import Header from "@/components/Header";

const files = [
  {
    name: "meeting_notes.txt",
    type: "Text",
    description:
      "Contains symposium planning decisions such as transport, catering, scheduling, and volunteer tasks.",
  },
  {
    name: "budget.pdf",
    type: "PDF",
    description:
      "Contains event budget allocations across transport, catering, printing, and miscellaneous expenses.",
  },
  {
    name: "expenses.csv",
    type: "CSV",
    description:
      "Structured cost sheet with category, estimated cost, and approval status.",
  },
  {
    name: "confirmation_email.json",
    type: "Email JSON",
    description:
      "Mock email records containing confirmations, invoice messages, and logistics approvals.",
  },
];

export default function DemoDataPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 max-w-2xl">
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
            Demo Data
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Sample sources used by the assistant
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            This page explains the example files that the assistant can search
            during your demo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {files.map((file) => (
            <div
              key={file.name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">
                  {file.name}
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {file.type}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {file.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}