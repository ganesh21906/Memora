"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrainCircuit, ShieldCheck, DatabaseZap, LogOut } from "lucide-react";
import ChatInput from "@/components/ChatInput";
import Header from "@/components/Header";
import LoadingState from "@/components/LoadingState";
import ResponsePanel from "@/components/ResponsePanel";
import RecentQueries from "@/components/RecentQueries";
import FileUploadPanel from "@/components/FileUploadPanel";
import SessionSummary from "@/components/SessionSummary";
import { QueryResponse } from "@/lib/types";

type DemoUser = {
  name: string;
  email: string;
  loggedIn: boolean;
};

export default function HomePage() {
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<DemoUser | null>(null);

  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [totalQueries, setTotalQueries] = useState(0);

  useEffect(() => {
    const rawUser = localStorage.getItem("demo-auth-user");

    if (!rawUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser: DemoUser = JSON.parse(rawUser);

      if (!parsedUser.loggedIn) {
        router.push("/login");
        return;
      }

      setUser(parsedUser);
      setIsReady(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  async function handleQuery(nextQuery: string) {
    setLoading(true);
    setError(null);
    setQuery(nextQuery);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: nextQuery }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch assistant response.");
      }

      const data: QueryResponse = await res.json();
      setResponse(data);
      setTotalQueries((prev) => prev + 1);

      setRecentQueries((prev) => {
        const updated = [nextQuery, ...prev.filter((item) => item !== nextQuery)];
        return updated.slice(0, 5);
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setQuery("");
    setResponse(null);
    setError(null);
  }

  function handleRecentQuerySelect(selectedQuery: string) {
    setQuery(selectedQuery);
    void handleQuery(selectedQuery);
  }

  function handleLogout() {
    localStorage.removeItem("demo-auth-user");
    router.push("/login");
  }

  if (!isReady) {
    return null;
  }

  return (
    <main className="min-h-screen">
      <Header />

      <section className="px-6 py-12 lg:py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl text-center"
          >
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
              Multi-source assistant
            </span>

            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Ask one question.
              <span className="mt-2 block bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-600 bg-clip-text text-transparent">
                Search across many sources.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              A context-aware executive assistant that answers natural-language
              questions using notes, PDFs, CSVs, and email-style data with grounded references.
            </p>

            <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <span>
                Logged in as <span className="font-semibold text-slate-800">{user?.name}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span>{user?.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </motion.div>

          <div className="mt-10 w-full max-w-4xl">
            <ChatInput
              query={query}
              setQuery={setQuery}
              onSubmit={handleQuery}
              onClear={handleClear}
              loading={loading}
            />
          </div>

          <div className="mt-4 w-full max-w-4xl">
            <RecentQueries
              queries={recentQueries}
              onSelect={handleRecentQuerySelect}
            />
          </div>

          <div className="mt-6 w-full max-w-4xl">
            <FileUploadPanel />
          </div>

          <div className="mt-6 w-full max-w-4xl">
            <SessionSummary
              totalQueries={totalQueries}
              recentQueries={recentQueries}
              lastSourceTypes={response?.toolUsed ?? []}
            />
          </div>

          <div className="mt-6 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
            {[
              {
                title: "Supported",
                desc: "TXT, PDF, CSV, Email JSON",
                icon: <DatabaseZap size={18} />,
              },
              {
                title: "Output",
                desc: "Final answer + evidence cards",
                icon: <ShieldCheck size={18} />,
              },
              {
                title: "Demo Goal",
                desc: "Context-aware assistant MVP",
                icon: <BrainCircuit size={18} />,
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="glass soft-shadow rounded-3xl border border-white/80 p-5 text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  {item.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.title}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 w-full max-w-4xl">
            {loading ? (
              <LoadingState />
            ) : (
              <ResponsePanel
                response={response}
                error={error}
                currentQuery={query}
                onFollowUpSelect={handleRecentQuerySelect}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}