"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileBadge2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type UploadedFileItem = {
  id: string;
  name: string;
  size: number;
  type: "pdf" | "txt" | "csv";
  file: File;
};

const DB_NAME = "context-assistant-files";
const STORE_NAME = "uploads";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllStoredFiles(): Promise<UploadedFileItem[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as UploadedFileItem[]);
    request.onerror = () => reject(request.error);
  });
}

async function saveStoredFile(fileItem: UploadedFileItem): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(fileItem);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteStoredFile(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getFileType(fileName: string): "pdf" | "txt" | "csv" | null {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".csv")) return "csv";

  return null;
}

function getIcon(type: "pdf" | "txt" | "csv") {
  switch (type) {
    case "pdf":
      return <FileBadge2 size={16} />;
    case "txt":
      return <FileText size={16} />;
    case "csv":
      return <FileSpreadsheet size={16} />;
  }
}

function getBadgeStyle(type: "pdf" | "txt" | "csv") {
  switch (type) {
    case "pdf":
      return "bg-red-50 text-red-700 border-red-200";
    case "txt":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "csv":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

function formatSize(size: number) {
  return `${(size / 1024).toFixed(1)} KB`;
}

export default function FileUploadPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function loadFiles() {
      try {
        const stored = await getAllStoredFiles();
        setUploadedFiles(stored);
      } catch (error) {
        console.error("Failed to load stored files:", error);
      }
    }

    void loadFiles();
  }, []);

  async function uploadToBackend(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    await fetch("/api/upload", { method: "POST", body: formData });
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;

    const nextFiles: UploadedFileItem[] = [];

    for (const file of Array.from(files)) {
      const detectedType = getFileType(file.name);
      if (!detectedType) continue;

      const item: UploadedFileItem = {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        type: detectedType,
        file,
      };

      nextFiles.push(item);
      await saveStoredFile(item);
      void uploadToBackend(file);
    }

    const refreshed = await getAllStoredFiles();
    setUploadedFiles(refreshed);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    void addFiles(e.target.files);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    void addFiles(e.dataTransfer.files);
  }

  async function removeFile(id: string) {
    await deleteStoredFile(id);
    const refreshed = await getAllStoredFiles();
    setUploadedFiles(refreshed);
  }

  const pdfCount = uploadedFiles.filter((file) => file.type === "pdf").length;
  const txtCount = uploadedFiles.filter((file) => file.type === "txt").length;
  const csvCount = uploadedFiles.filter((file) => file.type === "csv").length;

  const visibleFiles = isExpanded ? uploadedFiles : uploadedFiles.slice(0, 2);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass soft-shadow w-full max-w-4xl rounded-3xl border border-white/80 p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload Data Sources</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add PDF, TXT, and CSV demo files. These will stay even after refresh and logout on this browser.
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Upload size={16} />
          Upload Files
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.csv"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Files
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{uploadedFiles.length}</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">PDFs</p>
          <p className="mt-2 text-2xl font-semibold text-red-800">{pdfCount}</p>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">TXTs</p>
          <p className="mt-2 text-2xl font-semibold text-violet-800">{txtCount}</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">CSVs</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-800">{csvCount}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 transition ${
            isDragging
              ? "border-slate-900 bg-slate-100"
              : "border-slate-300 bg-slate-50 hover:bg-slate-100"
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
              <Upload size={22} />
            </div>

            <p className="text-sm font-semibold text-slate-800">Drag and drop files here</p>
            <p className="mt-2 text-sm text-slate-500">or click to browse and upload</p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                PDF
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                TXT
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                CSV
              </span>
            </div>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              These uploads are stored locally in this browser for demo use.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="mb-3 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Uploaded Files</h3>
              <p className="text-xs text-slate-500">
                {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="text-slate-600">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          <div className="min-h-[180px]">
            {uploadedFiles.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No files uploaded yet
              </div>
            ) : (
              <div className="space-y-3">
                {visibleFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700">
                        {getIcon(file.type)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${getBadgeStyle(
                          file.type
                        )}`}
                      >
                        {file.type}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void removeFile(file.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {!isExpanded && uploadedFiles.length > 2 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-center text-xs font-medium text-slate-500">
                    {uploadedFiles.length - 2} more file{uploadedFiles.length - 2 > 1 ? "s" : ""} hidden
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}