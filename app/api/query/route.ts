import { NextRequest, NextResponse } from "next/server";
import { QueryResponse, SourceItem, SourceType, StructuredTruth, ConflictItem } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const TOOL_TO_SOURCE_TYPE: Record<string, SourceType> = {
  search_email: "email",
  search_pdf: "pdf",
  search_txt: "text",
  search_csv: "csv",
  search_attachments: "email",
  search_whatsapp: "text",
};

const TOOL_DISPLAY_NAME: Record<string, string> = {
  search_email: "Gmail",
  search_pdf: "PDF Documents",
  search_txt: "Text Files",
  search_csv: "CSV Data",
  search_attachments: "Email Attachments",
  search_whatsapp: "WhatsApp Chats",
};

function mapStructuredTruth(st: Record<string, unknown>): StructuredTruth | undefined {
  if (!st || Object.keys(st).length === 0) return undefined;
  const decision = String(st.decision ?? "N/A");
  const budget = String(st.budget ?? "N/A");
  const approvedBy = String(st.approved_by ?? "N/A");
  const status = String(st.status ?? "N/A");
  const conflicts = String(st.conflicts ?? "None");
  const evidence = Array.isArray(st.evidence) ? (st.evidence as unknown[]).map(String) : [];
  // Only show panel when there's at least one meaningful field
  const hasData = [decision, budget, approvedBy, status].some((v) => v !== "N/A") || evidence.length > 0;
  if (!hasData) return undefined;
  return { decision, budget, approvedBy, evidence, status, conflicts };
}

function isNA(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "n/a" || v === "na" || v === "none" || v === "";
}

function pickDecision(answer: string, evidence: string[]): string {
  if (evidence.length > 0) return evidence[0];
  const firstSentence = answer.split(/[.!?]/).map((s) => s.trim()).find(Boolean);
  return firstSentence || "N/A";
}

function pickBudget(text: string): string {
  const currencyMatch = text.match(/(?:₹|\$|€|£)\s?\d[\d,]*(?:\.\d+)?(?:\s?[kKmM])?/);
  if (currencyMatch) return currencyMatch[0];

  const plusMatch = text.match(/\b\d[\d,]*(?:\.\d+)?\+\s*(?:in\s+)?(?:prizes?|budget|cost|spend)\b/i);
  if (plusMatch) return plusMatch[0];

  return "N/A";
}

function pickStatus(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("last call")) return "Last call / Action needed";
  if (t.includes("upcoming")) return "Upcoming";
  if (t.includes("ongoing") || t.includes("in progress")) return "In progress";
  if (t.includes("completed") || t.includes("finalized") || t.includes("done")) return "Completed";
  if (t.includes("pending")) return "Pending";
  return "N/A";
}

function enrichStructuredTruth(base: StructuredTruth | undefined, answer: string): StructuredTruth | undefined {
  if (!base) return base;

  const evidence = Array.isArray(base.evidence) ? base.evidence : [];
  const combinedText = [answer, ...evidence].join("\n");

  const decision = isNA(base.decision) ? pickDecision(answer, evidence) : base.decision;
  const budget = isNA(base.budget) ? pickBudget(combinedText) : base.budget;
  const status = isNA(base.status) ? pickStatus(combinedText) : base.status;
  const approvedBy = isNA(base.approvedBy)
    ? "Not explicitly stated in retrieved sources"
    : base.approvedBy;

  return {
    ...base,
    decision,
    budget,
    status,
    approvedBy,
  };
}

function mapConflicts(raw: unknown[]): ConflictItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((c) => {
    const item = c as Record<string, unknown>;
    const severity = ["none", "low", "medium", "high"].includes(String(item.severity))
      ? (item.severity as ConflictItem["severity"])
      : "low";
    const comparison = Array.isArray(item.comparison)
      ? (item.comparison as unknown[]).map((x) => {
          const entry = x as Record<string, unknown>;
          return { source: String(entry.source ?? ""), value: String(entry.value ?? "") };
        })
      : [];
    return {
      title: String(item.title ?? "Data Conflict"),
      severity,
      type: String(item.type ?? "other"),
      note: String(item.note ?? ""),
      comparison,
      likelyLatestTruth: String(item.likely_latest_truth ?? ""),
      recommendedAction: String(item.recommended_action ?? ""),
    };
  });
}

function generateFollowUps(query: string, tools: string[]): string[] {
  const q = query.toLowerCase();
  const suggestions: string[] = [];

  if (q.includes("spend") || q.includes("expense") || q.includes("cost") || q.includes("money")) {
    suggestions.push("What is my total spending this month?", "Which category did I spend the most on?", "How do my expenses compare to last month?");
  } else if (q.includes("doctor") || q.includes("health") || q.includes("weight") || q.includes("gym")) {
    suggestions.push("What are my health goals for this year?", "What supplements was I prescribed?", "What is my current weight progress?");
  } else if (q.includes("email") || q.includes("mail") || q.includes("invoice")) {
    suggestions.push("Show me recent emails about payments", "Find emails with attachments", "What are my pending email follow-ups?");
  } else if (q.includes("task") || q.includes("todo") || q.includes("pending") || q.includes("remind")) {
    suggestions.push("What are my upcoming deadlines?", "Show all my pending action items", "What did I plan to do this week?");
  } else if (q.includes("trip") || q.includes("travel") || q.includes("coorg") || q.includes("friend")) {
    suggestions.push("How much did the trip cost in total?", "Who still owes me money?", "What are the next planned meetups?");
  } else if (q.includes("book") || q.includes("read") || q.includes("goal") || q.includes("saving")) {
    suggestions.push("What are my yearly goals?", "What is my savings progress so far?", "Which goals am I on track for?");
  } else {
    const toolSuggestions: Record<string, string> = {
      search_email: "Show me recent important emails",
      search_pdf: "What documents do I have?",
      search_csv: "Summarize my expense data",
      search_whatsapp: "What did my friends say recently?",
      search_txt: "Show my recent notes",
    };
    for (const tool of tools.slice(0, 3)) {
      if (toolSuggestions[tool]) suggestions.push(toolSuggestions[tool]);
    }
  }

  return suggestions.slice(0, 3);
}

// Replace raw filenames / source labels with friendly user-facing names
function sanitizeAnswer(answer: string): string {
  return answer
    // Specific known files
    .replace(/\bpersonal_notes\.txt\b/gi, "your notes")
    .replace(/\bsample_notes\.txt\b/gi, "your notes")
    .replace(/\bwhatsapp_friends\.txt\b/gi, "your WhatsApp chats")
    .replace(/\bwhatsapp_chat\.txt\b/gi, "your WhatsApp chats")
    .replace(/\bexpenses\.csv\b/gi, "your expense records")
    .replace(/\bsample_logistics\.csv\b/gi, "your event data")
    .replace(/\bmonthly_report\.pdf\b/gi, "your PDF report")
    .replace(/\bsample_emails\.json\b/gi, "your emails")
    // Section labels the LLM copies verbatim
    .replace(/=== Pdf ===/gi, "your PDF documents")
    .replace(/=== Txt ===/gi, "your notes")
    .replace(/=== Csv ===/gi, "your data")
    .replace(/=== Email ===/gi, "your emails")
    .replace(/=== Whatsapp ===/gi, "your WhatsApp chats")
    .replace(/=== Attachments ===/gi, "your email attachments")
    // Generic catch-all for any remaining filenames
    .replace(/\b[\w_-]+\.pdf\b/gi, "your PDF")
    .replace(/\b[\w_-]+\.csv\b/gi, "your data")
    .replace(/\b[\w_-]+\.txt\b/gi, "your notes")
    .replace(/\b[\w_-]+\.json\b/gi, "your records")
    // Strip inline source citations added by the LLM
    .replace(/\s*-\s*mentioned in [^\n.]+\.?/gi, "")
    .replace(/\s*\(mentioned in [^)]+\)/gi, "")
    .replace(/,?\s*mentioned in [^,.!\n]+/gi, "")
    .replace(/\(page \d+\)/gi, "")
    .replace(/\s*These (tasks|items|details) are mentioned in the [^.]+\./gi, "")
    .replace(/\s*The (emails?|files?|data|records?) (and [^.]+)?do(es)? not contain any relevant[^.]+\./gi, "")
    // Clean up any trailing whitespace/punctuation left behind
    .replace(/ {2,}/g, " ")
    .trim();
}

const CONFLICT_LANGUAGE = [
  "however", "discrepancy", "inconsistent", "inconsistency",
  "different", "differs", "mismatch", "conflict", "contradicts",
  "does not match", "whereas", "but states", "on the other hand",
  "but your", "but the",
];

function detectConflictsFromText(rawAnswer: string): ConflictItem[] {
  const lower = rawAnswer.toLowerCase();
  const hasConflictLang = CONFLICT_LANGUAGE.some((kw) => lower.includes(kw));
  if (!hasConflictLang) return [];

  // Weight conflict: two different kg values mentioned
  const kgMatches = [...rawAnswer.matchAll(/(\d+(?:\.\d+)?)\s*kg/gi)].map((m) => m[1]);
  const uniqueKg = [...new Set(kgMatches)];
  if (uniqueKg.length >= 2) {
    return [{
      title: "Weight Data Conflict",
      severity: "high",
      type: "amount",
      note: `Two different weight values found across your sources: ${uniqueKg[0]} kg and ${uniqueKg[1]} kg.`,
      comparison: [
        { source: "Older Record", value: `${uniqueKg[0]} kg` },
        { source: "Recent Update", value: `${uniqueKg[1]} kg` },
      ],
      likelyLatestTruth: `${uniqueKg[uniqueKg.length - 1]} kg from the most recently uploaded file is likely more current.`,
      recommendedAction: "Check the dates on both records to confirm which weight measurement is current.",
    }];
  }

  // Money conflict: two different ₹/$ amounts mentioned in same context
  const moneyMatches = [...rawAnswer.matchAll(/[₹$]\s*(\d[\d,]*(?:\.\d+)?)/g)].map((m) => m[1].replace(/,/g, ""));
  const uniqueMoney = [...new Set(moneyMatches)];
  if (uniqueMoney.length >= 2) {
    return [{
      title: "Amount Conflict",
      severity: "medium",
      type: "amount",
      note: `Different amounts found for the same item across sources.`,
      comparison: [
        { source: "Source A", value: `₹${uniqueMoney[0]}` },
        { source: "Source B", value: `₹${uniqueMoney[1]}` },
      ],
      likelyLatestTruth: "The most recently dated document likely has the correct amount.",
      recommendedAction: "Cross-check both sources and use the value from the most recent entry.",
    }];
  }

  // Generic: conflict language found but no specific numbers — surface a low-severity item
  return [{
    title: "Data Inconsistency Detected",
    severity: "low",
    type: "other",
    note: "Your sources contain conflicting information about this topic. See the answer above for details.",
    comparison: [
      { source: "Source A", value: "Information differs — see answer" },
      { source: "Source B", value: "Conflicting detail found" },
    ],
    likelyLatestTruth: "Review the most recently updated source for the accurate value.",
    recommendedAction: "Open both source documents and compare the relevant entries directly.",
  }];
}

function adaptResponse(backendData: {
  answer: string;
  tools_called: string[];
  elapsed_seconds: number;
  mode: string;
  structured_truth?: Record<string, unknown>;
  conflicts?: unknown[];
}, query: string): QueryResponse {
  const hasAnswer =
    backendData.answer &&
    !backendData.answer.toLowerCase().includes("couldn't find") &&
    !backendData.answer.toLowerCase().includes("no relevant information");

  const sources: SourceItem[] = backendData.tools_called.map((tool, i) => ({
    id: `${tool}-${i}`,
    title: TOOL_DISPLAY_NAME[tool] ?? tool.replace("search_", "").replace("_", " "),
    type: TOOL_TO_SOURCE_TYPE[tool] ?? "text",
    snippet: `Searched via ${TOOL_DISPLAY_NAME[tool] ?? tool}`,
    meta: `${backendData.mode} mode · ${backendData.elapsed_seconds}s`,
  }));

  return {
    answer: sanitizeAnswer(backendData.answer),
    sources,
    toolUsed: backendData.tools_called,
    status: hasAnswer ? "success" : "empty",
    elapsedSeconds: backendData.elapsed_seconds,
    followUpSuggestions: hasAnswer ? generateFollowUps(query, backendData.tools_called) : [],
    structuredTruth: enrichStructuredTruth(
      mapStructuredTruth(backendData.structured_truth ?? {}),
      sanitizeAnswer(backendData.answer)
    ),
    conflictsPanel: (() => {
      const fromBackend = mapConflicts(backendData.conflicts ?? []);
      if (fromBackend.length > 0) return fromBackend;
      return detectConflictsFromText(backendData.answer ?? "");
    })(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body.query === "string" ? body.query : "";

    if (!query.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(
        { error: err.detail ?? "Backend error." },
        { status: backendRes.status }
      );
    }

    const backendData = await backendRes.json();
    return NextResponse.json(adaptResponse(backendData, query));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    // Backend not reachable
    if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
      return NextResponse.json(
        { error: "Backend is not running. Please start the Memora backend on port 8000." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
