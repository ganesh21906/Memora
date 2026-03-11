"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, FileSpreadsheet, FileType2, UploadCloud } from "lucide-react";

type UploadedFile = {
  name: string;
  size_bytes: number;
};

export type SourceStats = {
  pdf: number;
  txt: number;
  csv: number;
  total: number;
};

type FileUploaderProps = {
  onUploaded?: () => void;
  onStatsChange?: (stats: SourceStats) => void;
  compact?: boolean;
};

function ext(name: string): "pdf" | "txt" | "csv" | "other" {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".csv")) return "csv";
  return "other";
}

function formatSize(sizeBytes: number): string {
  const kb = sizeBytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function FileUploader({ onUploaded, onStatsChange, compact = false }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadUploads = useCallback(async () => {
    const res = await fetch("/api/uploads");
    if (!res.ok) return;
    const data = (await res.json()) as { files?: UploadedFile[] };
    setFiles(data.files ?? []);
  }, []);

  useEffect(() => {
    void loadUploads();
  }, [loadUploads]);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      setUploading(true);
      setUploadError(null);

      try {
        for (const file of accepted) {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: form });
          if (!res.ok) {
            const payload = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error ?? `Upload failed for ${file.name}`);
          }
        }
        await loadUploads();
        onUploaded?.();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [loadUploads, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
  });

  const counters = useMemo(() => {
    const pdf = files.filter((f) => ext(f.name) === "pdf").length;
    const txt = files.filter((f) => ext(f.name) === "txt").length;
    const csv = files.filter((f) => ext(f.name) === "csv").length;
    return { pdf, txt, csv, total: files.length };
  }, [files]);

  useEffect(() => {
    onStatsChange?.(counters);
  }, [counters, onStatsChange]);

  return (
    <section
      className={`rounded-2xl ${compact ? "p-4" : "p-6"}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: "#F8FAFC" }}>Upload Data Sources</h2>
        <span className="text-xs" style={{ color: "#94A3B8" }}>PDF, TXT, CSV</span>
      </div>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed text-center transition-all duration-150 ${compact ? "p-4" : "p-6"} ${
          isDragActive ? "border-brand" : "border-white/10"
        }`}
        style={isDragActive ? { background: "rgba(99,102,241,0.08)" } : { background: "rgba(255,255,255,0.03)" }}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`mx-auto ${compact ? "mb-2" : "mb-3"}`} style={{ color: isDragActive ? "#6366F1" : "#94A3B8" }} />
        <p className="text-sm font-medium" style={{ color: "#F8FAFC" }}>
          {isDragActive ? "Drop files to upload" : "Drag and drop files here"}
        </p>
        <p className="mt-1 text-xs" style={{ color: "#64748B" }}>or click to browse</p>
      </div>

      {/* File type pills — only render when count > 0 */}
      {(counters.pdf > 0 || counters.txt > 0 || counters.csv > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {counters.pdf > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ border: "1px solid rgba(249,115,22,0.35)", color: "#FDBA74", background: "rgba(249,115,22,0.08)" }}
            >
              PDF · {counters.pdf}
            </span>
          )}
          {counters.txt > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ border: "1px solid rgba(139,92,246,0.35)", color: "#C4B5FD", background: "rgba(139,92,246,0.08)" }}
            >
              TXT · {counters.txt}
            </span>
          )}
          {counters.csv > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ border: "1px solid rgba(34,197,94,0.35)", color: "#86EFAC", background: "rgba(34,197,94,0.08)" }}
            >
              CSV · {counters.csv}
            </span>
          )}
        </div>
      )}

      {uploading && <p className="mt-3 text-sm" style={{ color: "#94A3B8" }}>Uploading files…</p>}
      {uploadError && <p className="mt-3 text-sm" style={{ color: "#F87171" }}>{uploadError}</p>}

      <div className="mt-4 space-y-2">
        {files.length === 0 ? (
          <p className="text-sm" style={{ color: "#64748B" }}>No uploaded files yet.</p>
        ) : (
          files.slice(0, compact ? 5 : files.length).map((file) => {
            const kind = ext(file.name);
            const icon = kind === "pdf" ? <FileType2 size={14} /> : kind === "csv" ? <FileSpreadsheet size={14} /> : <FileText size={14} />;
            return (
              <div
                key={`${file.name}-${file.size_bytes}`}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2 text-sm" style={{ color: "#CBD5E1" }}>
                  <span style={{ color: "#94A3B8" }}>{icon}</span>
                  <span className="truncate max-w-[140px]">{file.name}</span>
                </div>
                <span className="text-xs" style={{ color: "#64748B" }}>{formatSize(file.size_bytes)}</span>
              </div>
            );
          })
        )}
        {compact && files.length > 5 ? (
          <p className="pt-1 text-xs" style={{ color: "#64748B" }}>+{files.length - 5} more files</p>
        ) : null}
      </div>
    </section>
  );
}
