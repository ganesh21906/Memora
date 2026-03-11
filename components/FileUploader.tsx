"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, FileSpreadsheet, FileType2, UploadCloud, Loader2 } from "lucide-react";

type UploadedFile = { name: string; size_bytes: number };
export type SourceStats = { pdf: number; txt: number; csv: number; total: number };

type Props = { onUploaded?: () => void; onStatsChange?: (s: SourceStats) => void; compact?: boolean };

function ext(n: string): "pdf" | "txt" | "csv" | "other" {
  const l = n.toLowerCase();
  if (l.endsWith(".pdf")) return "pdf";
  if (l.endsWith(".txt")) return "txt";
  if (l.endsWith(".csv")) return "csv";
  return "other";
}
function fmtSize(b: number) {
  const kb = b / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

const ICON_MAP = {
  pdf: <FileType2 size={13} />, csv: <FileSpreadsheet size={13} />,
  txt: <FileText size={13} />,  other: <FileText size={13} />,
};
const COLOR_MAP = {
  pdf: "var(--c-pdf)", csv: "var(--c-csv)",
  txt: "var(--c-txt)", other: "var(--txt-3)",
};

export default function FileUploader({ onUploaded, onStatsChange, compact = false }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/uploads");
      if (!r.ok) return;
      const d = (await r.json()) as { files?: UploadedFile[] };
      setFiles(d.files ?? []);
    } catch { /**/ }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setUploading(true); setError(null);
    try {
      for (const file of accepted) {
        const form = new FormData();
        form.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: form });
        if (!r.ok) {
          const p = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(p.error ?? `Failed: ${file.name}`);
        }
      }
      await load(); onUploaded?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(false); }
  }, [load, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"], "text/csv": [".csv"] },
  });

  const stats = useMemo(() => ({
    pdf: files.filter(f => ext(f.name) === "pdf").length,
    txt: files.filter(f => ext(f.name) === "txt").length,
    csv: files.filter(f => ext(f.name) === "csv").length,
    total: files.length,
  }), [files]);

  useEffect(() => { onStatsChange?.(stats); }, [stats, onStatsChange]);

  const visible = compact ? files.slice(0, 4) : files;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="sec-label">Upload Sources</span>
        <span style={{ fontSize: 10, color: "var(--txt-4)", letterSpacing: "0.04em" }}>PDF · TXT · CSV</span>
      </div>

      {/* Drop zone */}
      <div {...getRootProps()} className={`upload-zone-glass ${isDragActive ? "dragging" : ""}`}>
        <input {...getInputProps()} />
        {uploading
          ? <Loader2 size={20} style={{ color: "var(--accent)", margin: "0 auto 8px", animation: "spin 0.8s linear infinite", display: "block" }} />
          : <UploadCloud size={20} style={{ color: isDragActive ? "var(--accent)" : "var(--txt-3)", margin: "0 auto 8px", display: "block", transition: "color 200ms ease" }} />
        }
        <p style={{ fontSize: 12.5, fontWeight: 500, color: isDragActive ? "#A5B4FC" : "var(--txt-2)" }}>
          {uploading ? "Uploading…" : isDragActive ? "Drop to upload" : "Drag & drop files"}
        </p>
        <p style={{ fontSize: 11, color: "var(--txt-4)", marginTop: 2 }}>or click to browse</p>
      </div>

      {error && (
        <div style={{ padding: "8px 11px", borderRadius: 9, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}>
          <p style={{ fontSize: 11.5, color: "#FCA5A5" }}>{error}</p>
        </div>
      )}

      {(stats.pdf > 0 || stats.txt > 0 || stats.csv > 0) && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {stats.pdf > 0 && <span className="pill pill-orange">{stats.pdf} PDF</span>}
          {stats.txt > 0 && <span className="pill pill-violet">{stats.txt} TXT</span>}
          {stats.csv > 0 && <span className="pill pill-green">{stats.csv} CSV</span>}
        </div>
      )}

      {files.length === 0 ? (
        <p style={{ fontSize: 11.5, color: "var(--txt-4)", paddingLeft: 2 }}>No files uploaded yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {visible.map(file => {
            const kind = ext(file.name);
            return (
              <div key={`${file.name}-${file.size_bytes}`} className="file-row-glass">
                <span style={{ color: COLOR_MAP[kind], flexShrink: 0 }}>{ICON_MAP[kind]}</span>
                <span style={{ flex: 1, fontSize: 12, color: "var(--txt-2)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{file.name}</span>
                <span style={{ fontSize: 10.5, color: "var(--txt-3)", flexShrink: 0 }}>{fmtSize(file.size_bytes)}</span>
              </div>
            );
          })}
          {compact && files.length > 4 && (
            <p style={{ fontSize: 11, color: "var(--txt-4)", paddingLeft: 2 }}>+{files.length - 4} more</p>
          )}
        </div>
      )}
    </div>
  );
}
