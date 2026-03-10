"use client";

import LoginForm from "@/components/LoginForm";
import Header from "@/components/Header";

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="px-6 py-12 lg:py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-8 max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
              Secure Demo Access
            </span>

            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Login before accessing the assistant
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              This login screen is for demo consent and access flow. Once logged in,
              you can use the assistant and upload PDF, TXT, and CSV files.
            </p>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}