"""
Memora Tool – Search CSV
Searches CSV files using pandas for content relevant to the query.
"""
from __future__ import annotations

import io
from pathlib import Path

import pandas as pd

from backend.config import settings


def _search_dataframe(df: pd.DataFrame, keywords: list[str]) -> pd.DataFrame:
    """Return rows where any string column contains any keyword."""
    str_cols = df.select_dtypes(include="object").columns
    if str_cols.empty:
        # Try all columns as strings
        str_cols = df.columns

    mask = pd.Series([False] * len(df), index=df.index)
    for col in str_cols:
        for kw in keywords:
            try:
                mask |= df[col].astype(str).str.contains(kw, case=False, na=False)
            except Exception:
                pass
    return df[mask]


def _df_to_markdown(df: pd.DataFrame, max_rows: int = 20) -> str:
    """Convert a DataFrame to a markdown table string."""
    if df.empty:
        return "(no matching rows)"
    subset = df.head(max_rows)
    header = "| " + " | ".join(str(c) for c in subset.columns) + " |"
    sep = "| " + " | ".join("---" for _ in subset.columns) + " |"
    rows = [
        "| " + " | ".join(str(v) for v in row) + " |"
        for row in subset.itertuples(index=False)
    ]
    return "\n".join([header, sep] + rows)


def search_csv(query: str, csv_bytes: bytes | None = None, filename: str = "") -> str:
    """
    Search CSV files for *query*.
    Uses semantic vector search first, falls back to pandas keyword search.
    If *csv_bytes* is provided (Gmail attachment), uses keyword search directly.
    """
    from backend.tools.email_search import _keywords_from_query
    from backend.vector_store import search, is_available

    keywords = _keywords_from_query(query) or query.split()
    results: list[str] = []

    # ── Inline bytes (Gmail attachment — always keyword) ─────────────────────
    if csv_bytes:
        try:
            df = pd.read_csv(io.BytesIO(csv_bytes))
            matched = _search_dataframe(df, keywords)
            table = _df_to_markdown(matched) if not matched.empty else _df_to_markdown(df)
            results.append(f"📊 CSV ({filename or 'attachment'}) — {len(df)} rows total:\n{table}")
        except Exception as exc:
            results.append(f"[CSV parse error for {filename}: {exc}]")
        return "\n\n".join(results) if results else "No relevant content found in CSV attachment."

    # ── Semantic vector search ────────────────────────────────────────────────
    if is_available():
        hits = search(query, n_results=6, where={"type": "csv"})
        if hits:
            for hit in hits:
                src = hit["metadata"].get("source", "unknown")
                rows = hit["metadata"].get("rows", "")
                label = f" (rows {rows})" if rows else ""
                results.append(f"📊 {src}{label}:\n{hit['text']}")
            return "\n\n".join(results)

    # ── Keyword fallback ──────────────────────────────────────────────────────
    for d in [settings.data_dir, settings.uploads_dir]:
        if not d.exists():
            continue
        for csv_path in d.glob("*.csv"):
            try:
                df = pd.read_csv(csv_path)
                matched = _search_dataframe(df, keywords)
                if not matched.empty:
                    results.append(
                        f"📊 {csv_path.name} — {len(matched)} matching row(s) of {len(df)}:\n"
                        + _df_to_markdown(matched)
                    )
                else:
                    results.append(
                        f"📊 {csv_path.name} — no direct match, showing overview ({len(df)} rows):\n"
                        + _df_to_markdown(df, max_rows=10)
                    )
            except Exception as exc:
                results.append(f"[CSV parse error for {csv_path.name}: {exc}]")

    return "\n\n".join(results) if results else "No relevant content found in CSV files."
