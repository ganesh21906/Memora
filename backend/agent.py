"""
Memora – Agent
Runs all search tools in parallel, then passes results to the LLM for synthesis.
No function-calling format dependencies — works with any OpenAI-compatible LLM.
"""
from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import openai

from backend.config import settings
from backend.tools.email_search import search_email
from backend.tools.pdf_search import search_pdf
from backend.tools.txt_search import search_txt
from backend.tools.csv_search import search_csv
from backend.tools.attachment_parser import search_attachments
from backend.tools.whatsapp_search import search_whatsapp


# ── Tool Registry ─────────────────────────────────────────────────────────────
TOOL_FUNCTIONS: dict[str, Any] = {
    "search_email":       search_email,
    "search_pdf":         search_pdf,
    "search_txt":         search_txt,
    "search_csv":         search_csv,
    "search_attachments": search_attachments,
    "search_whatsapp":    search_whatsapp,
}

# Tools that only make sense in live Gmail mode
_LIVE_ONLY = {"search_attachments"}

# No-result markers — skip these when building context for the LLM
_EMPTY_MARKERS = (
    "No relevant",
    "no relevant",
    "[Tool error",
    "[Error",
    "only available in live",
)

SYSTEM_PROMPT = """You are Memora, a Context-Aware Personal Executive Assistant.
You have already searched the user's emails, documents, notes, CSV data, and WhatsApp chats.
The retrieved results are provided below as context.

Respond ONLY with a valid JSON object — no text before or after the JSON.
Use this exact schema:

{
  "answer": "Your full synthesized answer here. Use markdown (bold, bullets, headers) for clarity. Do NOT mention filenames, file paths, or source labels inline.",
  "structured_truth": {
    "decision": "The key decision, action, or main finding. Use N/A if not applicable.",
    "budget": "Any money amount, cost, or budget figure. Use N/A if not applicable.",
    "approved_by": "Person, sender, or responsible party. Use N/A if not applicable.",
    "evidence": ["concrete fact 1", "concrete fact 2", "concrete fact 3"],
    "status": "Current status, date, or time period. Use N/A if not applicable.",
    "conflicts": "Brief summary of any internal conflicts found, or None."
  },
  "conflicts": []
}

Conflict item schema (add to conflicts array only if two sources say different things):
{
  "title": "Short conflict title",
  "severity": "high | medium | low | none",
  "type": "amount | date | status | person | other",
  "note": "Brief description of what conflicts",
  "comparison": [
    {"source": "Source A name", "value": "what it says"},
    {"source": "Source B name", "value": "what it says differently"}
  ],
  "likely_latest_truth": "Which version is more likely correct and why",
  "recommended_action": "What the user should do to resolve this"
}

Rules:
1. evidence must contain 2–5 specific facts extracted from the context.
2. If a structured_truth field is not applicable to the question, use "N/A".
3. CRITICAL — Conflicts array: If you notice ANY of the following, you MUST add a conflict item:
   - Two sources give different numbers for the same thing (e.g. weight 68 kg vs 72 kg)
   - Two sources give different dates for the same event
   - One source says something is done, another says it is pending
   - Two sources give different amounts for the same expense or debt
   - Any inconsistency you mention in your answer MUST also appear in the conflicts array
   DO NOT leave the conflicts array empty if your answer mentions any inconsistency or uncertainty across sources.
4. If no relevant information found at all, set answer to explain this politely.
5. Output ONLY valid JSON — no markdown fences, no explanatory text outside the JSON.
"""


# ── JSON Extraction ────────────────────────────────────────────────────────────
def _parse_llm_json(text: str) -> dict[str, Any]:
    """
    Robustly extract JSON from LLM output.
    Handles: raw JSON, markdown code fences, leading/trailing text.
    Falls back to plain answer if parsing fails.
    """
    # Strip markdown code fences
    clean = re.sub(r"```(?:json)?\s*", "", text)
    clean = re.sub(r"```\s*", "", clean)
    clean = clean.strip()

    # Try direct parse
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        pass

    # Try to find JSON object within the text
    match = re.search(r"\{[\s\S]*\}", clean)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Fallback: treat entire text as the answer
    return {
        "answer": text.strip(),
        "structured_truth": {},
        "conflicts": [],
    }


# ── Conflict Extraction Fallback ──────────────────────────────────────────────
_CONFLICT_KEYWORDS = [
    "discrepancy", "inconsistency", "inconsistent", "however",
    "differs", "different", "mismatch", "conflict", "but states",
    "whereas", "contradicts", "does not match", "on the other hand",
]

def _extract_conflicts_from_answer(answer: str, client: openai.OpenAI) -> list[dict]:
    """
    If the LLM described a conflict in the answer but left conflicts[] empty,
    run a second focused call to extract the conflict objects.
    """
    if not any(kw in answer.lower() for kw in _CONFLICT_KEYWORDS):
        return []

    prompt = f"""The following answer mentions a conflict or inconsistency between sources:

\"\"\"{answer}\"\"\"

Extract every conflict mentioned and return ONLY a JSON array. Each item must follow this exact schema:
{{
  "title": "short conflict title",
  "severity": "high",
  "type": "amount",
  "note": "brief description of what conflicts",
  "comparison": [
    {{"source": "Source A", "value": "what it says"}},
    {{"source": "Source B", "value": "what it says differently"}}
  ],
  "likely_latest_truth": "which version is more likely correct and why",
  "recommended_action": "what the user should do to resolve this"
}}

Return ONLY the JSON array — no explanation, no markdown fences. If nothing conflicts, return []."""

    raw = "[]"
    try:
        resp = client.chat.completions.create(
            model=settings.llm_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        raw = resp.choices[0].message.content or "[]"
        clean = re.sub(r"```(?:json)?\s*", "", raw)
        clean = re.sub(r"```\s*", "", clean).strip()
        parsed = json.loads(clean)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        # Try to find array in text
        match = re.search(r"\[[\s\S]*\]", raw)
        if match:
            try:
                result = json.loads(match.group())
                if isinstance(result, list):
                    return result
            except Exception:
                pass
    return []



def run_agent(query: str) -> dict[str, Any]:
    """
    Run all search tools in parallel, then ask the LLM to synthesize the results.

    Returns:
        {
            "answer": str,
            "tools_called": list[str],
            "tool_results": dict[str, str],
            "elapsed_seconds": float,
            "structured_truth": dict,
            "conflicts": list[dict],
        }
    """
    settings.validate()
    start = time.time()

    # ── Step 1: Run all tools in parallel ────────────────────────────────────
    tool_results: dict[str, str] = {}
    live_mode = not settings.use_demo_mode

    active_tools = {
        name: fn for name, fn in TOOL_FUNCTIONS.items()
        if live_mode or name not in _LIVE_ONLY
    }

    with ThreadPoolExecutor(max_workers=len(active_tools)) as executor:
        future_to_name = {
            executor.submit(fn, query): name
            for name, fn in active_tools.items()
        }
        for future in as_completed(future_to_name):
            name = future_to_name[future]
            try:
                tool_results[name] = future.result()
            except Exception as exc:
                tool_results[name] = f"[Tool error in {name}: {exc}]"

    tools_called = list(tool_results.keys())

    # ── Step 2: Build context — skip empty results ────────────────────────────
    sections: list[str] = []
    for name, result in tool_results.items():
        if not any(result.startswith(m) or m in result[:60] for m in _EMPTY_MARKERS):
            label = name.replace("search_", "").replace("_", " ").title()
            sections.append(f"=== {label} ===\n{result}")

    context = "\n\n".join(sections) if sections else "No relevant information found in any data source."

    # ── Step 3: LLM synthesizes the answer ───────────────────────────────────
    client = openai.OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
    )

    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Question: {query}\n\n{context}\n\nIMPORTANT: If any two sources above give different values for the same fact, you MUST populate the conflicts array. Do not leave it empty if there is any inconsistency."},
        ],
        temperature=0.1,
    )

    raw = response.choices[0].message.content or '{"answer": "I could not find a relevant answer."}'
    parsed = _parse_llm_json(raw)

    answer = parsed.get("answer", raw)
    conflicts = parsed.get("conflicts", [])

    # Fallback: if LLM mentioned a conflict in text but left the array empty, extract it
    if not conflicts:
        conflicts = _extract_conflicts_from_answer(answer, client)

    return {
        "answer":           answer,
        "tools_called":     tools_called,
        "tool_results":     tool_results,
        "elapsed_seconds":  round(time.time() - start, 2),
        "structured_truth": parsed.get("structured_truth", {}),
        "conflicts":        conflicts,
    }
