"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, FileSpreadsheet, FileType2, UploadCloud, X, Loader2 } from "lucide-react";

type UploadedFile = { name: string; size_bytes: number };
export type SourceStats = { pdf: number; txt: number; csv: number; total: number };

type Props = { onUploaded?: () => void; onStatsChange?: (s: SourceStats) => void; compact?: boolean };

function ext(name: string): "pdf" | "txt" | "csv" | "other" {
  const l = name.toLowerCase();
  if (l.endsWith(".pdf")) return "pdf";
  if (l.endsWith(".txt")) return "txt";
  if (l.endsWith(".csv")) return "csv";
  return "other";
}

function fmtSize(b: number) {
  const kb = b / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

const FILE_ICON = { pdf: <FileType2 size={13} />, csv: <FileSpreadsheet size={13} />, txt: <FileText size={13} />, other: <FileText size={13} /> };
const FILE_COLOR = { pdf: "var(--orange)", csv: "var(--green)", txt: "var(--violet)", other: "var(--text-muted)" };

export default function FileUploader({ onUploaded, onStatsChange, compact = false }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/uploads");
      if (!res.ok) return;
      const data = (await res.json()) as { files?: UploadedFile[] };
      setFiles(data.files ?? []);
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
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) {
          const p = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(p.error ?? `Upload failed: ${file.name}`);
        }
      }
      await load();
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [load, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"], "text/csv": [".csv"] },
  });

  const counters = useMemo(() => {
    const pdf = files.filter(f => ext(f.name) === "pdf").length;
    const txt = files.filter(f => ext(f.name) === "txt").length;
    const csv = files.filter(f => ext(f.name) === "csv").length;
    return { pdf, txt, csv, total: files.length };
  }, [files]);

  useEffect(() => { onStatsChange?.(counters); }, [counters, onStatsChange]);

  const visible = compact ? files.slice(0, 4) : files;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="section-label">Upload Sources</span>
        <span style={{ fontSize: 10.5, color: "var(--text-ghost)" }}>PDF · TXT · CSV</span>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`upload-zone text-center p-4 ${isDragActive ? "drag-active" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading
          ? <Loader2 size={18} style={{ color: "var(--accent)", margin: "0 auto 8px", animation: "spin 0.8s linear infinite" }} />
          : <UploadCloud size={18} style={{ color: isDragActive ? "var(--accent)" : "var(--text-muted)", margin: "0 auto 8px", transition: "color 180ms ease" }} />
        }
        <p style={{ fontSize: 12.5, fontWeight: 500, color: isDragActive ? "var(--accent-light)" : "var(--text-secondary)" }}>
          {uploading ? "Uploading…" : isDragActive ? "Drop to upload" : "Drag & drop files"}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-ghost)", marginTop: 2 }}>or click to browse</p>
      </div>

      {error && (
        <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p style={{ fontSize: 11.5, color: "#FCA5A5" }}>{error}</p>
        </div>
      )}

      {/* Type counters */}
      {(counters.pdf > 0 || counters.txt > 0 || counters.csv > 0) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {counters.pdf > 0 && <span className="badge badge-orange">{counters.pdf} PDF</span>}
          {counters.txt > 0 && <span className="badge badge-violet">{counters.txt} TXT</span>}
          {counters.csv > 0 && <span className="badge badge-green">{counters.csv} CSV</span>}
        </div>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--text-ghost)", padding: "4px 2px" }}>No files uploaded yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {visible.map((file) => {
            const kind = ext(file.name);
            return (
              <div key={`${file.name}-${file.size_bytes}`} className="file-row">
                <span style={{ color: FILE_COLOR[kind], flexShrink: 0 }}>{FILE_ICON[kind]}</span>
                <span className="truncate" style={{ flex: 1, fontSize: 12, color: "var(--text-secondary)" }}>{file.name}</span>
                <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{fmtSize(file.size_bytes)}</span>
              </div>
            );
          })}
          {compact && files.length > 4 && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", paddingLeft: 2 }}>+{files.length - 4} more</p>
          )}
        </div>
      )}
    </div>
  );
}
