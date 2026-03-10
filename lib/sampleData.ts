import { QueryResponse } from "./types";

const emptyResponse: QueryResponse = {
  answer:
    "No strongly relevant result was found in the current demo data for that query.",
  sources: [],
  toolUsed: [],
  status: "empty",
  structuredTruth: {
    decision: "No confirmed decision found",
    budget: "Not available",
    approvedBy: "Not available",
    evidence: [],
    status: "unconfirmed",
    conflicts: "No evidence available",
  },
  conflictsPanel: [],
  queryType: "General lookup",
  routerDecision: [],
  routerReason:
    "The query did not strongly match the current demo source patterns.",
  followUpSuggestions: [
    "Ask about transport",
    "Check whether budget is mentioned",
    "Find an invoice mail",
  ],
};

export function getMockResponse(query: string): QueryResponse {
  const q = query.toLowerCase();

  if (q.includes("transport") || q.includes("bus")) {
    return {
      answer:
        "We finalized 2 buses for 9:00 AM pickup from the campus gate and allocated ₹8,000 for transport.",
      sources: [
        {
          id: "transport-1",
          title: "meeting_notes.txt",
          type: "text",
          snippet:
            "Transport finalized: 2 buses, 9 AM campus gate pickup for symposium participants.",
          meta: "Line 18-20",
        },
        {
          id: "transport-2",
          title: "confirmation_email.json",
          type: "email",
          snippet:
            "Transport budget approved at Rs. 8,000 and bus booking to proceed immediately.",
          meta: "From: logistics@college.edu",
        },
        {
          id: "transport-3",
          title: "budget.pdf",
          type: "pdf",
          snippet: "Transport allocation: ₹8,000 under event operations budget.",
          meta: "Page 3",
        },
      ],
      toolUsed: ["text", "email", "pdf"],
      status: "success",
      structuredTruth: {
        decision: "2 buses for 9:00 AM pickup from campus gate",
        budget: "₹8,000",
        approvedBy: "Logistics confirmation email",
        evidence: ["meeting_notes.txt", "confirmation_email.json", "budget.pdf"],
        status: "confirmed",
        conflicts: "none",
      },
      conflictsPanel: [
        {
          title: "No transport conflict detected",
          severity: "none",
          type: "Decision consistency",
          note: "All available sources agree on the finalized transport arrangement.",
          comparison: [
            {
              source: "meeting_notes.txt",
              value: "2 buses, 9:00 AM campus gate pickup",
            },
            {
              source: "confirmation_email.json",
              value: "2 buses confirmed, ₹8,000 approved",
            },
          ],
          likelyLatestTruth:
            "Transport plan is consistently recorded as 2 buses with ₹8,000 allocation.",
          recommendedAction:
            "No action needed. Current transport decision appears consistent across sources.",
        },
      ],
      queryType: "Decision lookup",
      routerDecision: ["text", "email", "pdf"],
      routerReason:
        "The query mentions transport planning and budget confirmation, which match notes, emails, and budget documents.",
      followUpSuggestions: [
        "Was the transport budget approved?",
        "Who confirmed the transport arrangement?",
        "Is there any conflict in transport sources?",
      ],
    };
  }

  if (q.includes("invoice") || q.includes("ravi")) {
    return {
      answer:
        "I found the invoice-related email from Ravi. It appears to contain the vendor confirmation and attached billing details for event supplies.",
      sources: [
        {
          id: "invoice-1",
          title: "ravi_invoice_mail.json",
          type: "email",
          snippet:
            "Please find attached the invoice for stage decoration and banner printing for the symposium event.",
          meta: "From: Ravi Kumar <ravi.vendor@email.com>",
        },
      ],
      toolUsed: ["email"],
      status: "success",
      structuredTruth: {
        decision: "Vendor invoice identified for stage decoration and banner printing",
        budget: "Not explicitly stated",
        approvedBy: "Ravi vendor email",
        evidence: ["ravi_invoice_mail.json"],
        status: "reference found",
        conflicts: "none",
      },
      conflictsPanel: [
        {
          title: "No invoice conflict detected",
          severity: "none",
          type: "Single-source reference",
          note: "Only one relevant source was found, so no cross-source conflict is detected.",
          comparison: [
            {
              source: "ravi_invoice_mail.json",
              value: "Invoice mail found for stage decoration and banner printing",
            },
            {
              source: "Cross-source verification",
              value: "No second source available in current demo data",
            },
          ],
          likelyLatestTruth:
            "The Ravi invoice email is currently the only relevant source for this request.",
          recommendedAction:
            "If needed, verify against an approval mail or finance record later.",
        },
      ],
      queryType: "Invoice lookup",
      routerDecision: ["email"],
      routerReason:
        "The query includes a person name and invoice wording, which strongly points to email search.",
      followUpSuggestions: [
        "Was the invoice approved?",
        "Does the invoice mention a total amount?",
        "Are there any other mails from Ravi?",
      ],
    };
  }

  if (q.includes("budget") || q.includes("pdf")) {
    return {
      answer:
        "Yes, the budget is explicitly mentioned in the PDF. It includes allocations for transport, catering, printing, and event materials.",
      sources: [
        {
          id: "budget-1",
          title: "budget.pdf",
          type: "pdf",
          snippet:
            "Budget Summary: Transport ₹8,000, Catering ₹12,000, Printing ₹3,500, Miscellaneous ₹2,500.",
          meta: "Page 2",
        },
      ],
      toolUsed: ["pdf"],
      status: "success",
      structuredTruth: {
        decision: "Budget allocations documented in the PDF",
        budget: "Transport ₹8,000, Catering ₹12,000, Printing ₹3,500",
        approvedBy: "Budget PDF record",
        evidence: ["budget.pdf"],
        status: "documented",
        conflicts: "none",
      },
      conflictsPanel: [
        {
          title: "No budget conflict detected",
          severity: "none",
          type: "Single-document budget record",
          note: "Only one budget source is available in the current demo data.",
          comparison: [
            {
              source: "budget.pdf",
              value: "Transport ₹8,000, Catering ₹12,000, Printing ₹3,500",
            },
            {
              source: "Cross-source verification",
              value: "No second budget source available",
            },
          ],
          likelyLatestTruth:
            "The budget PDF is the current recorded source of truth for budget values.",
          recommendedAction:
            "Add finance sheet or approval mail later if you want cross-source validation.",
        },
      ],
      queryType: "Budget lookup",
      routerDecision: ["pdf"],
      routerReason:
        "The query explicitly asks about budget or PDF mention, so the document source is the primary route.",
      followUpSuggestions: [
        "Was catering budget also approved?",
        "What is the transport allocation?",
        "Are there any conflicts in budget values?",
      ],
    };
  }

  if (q.includes("catering") || q.includes("food")) {
    return {
      answer:
        "The meeting notes show that catering was discussed and a light breakfast plus lunch package was preferred for attendees.",
      sources: [
        {
          id: "catering-1",
          title: "meeting_notes.txt",
          type: "text",
          snippet:
            "Catering decision: tea, snacks, lunch combo preferred for guest speakers and volunteers.",
          meta: "Line 31-33",
        },
        {
          id: "catering-2",
          title: "expenses.csv",
          type: "csv",
          snippet:
            "Category: Catering | Estimated Cost: 12000 | Status: Pending Approval",
          meta: "Row 7",
        },
      ],
      toolUsed: ["text", "csv"],
      status: "success",
      structuredTruth: {
        decision: "Light breakfast plus lunch package preferred",
        budget: "₹12,000 estimated",
        approvedBy: "Pending approval",
        evidence: ["meeting_notes.txt", "expenses.csv"],
        status: "partially confirmed",
        conflicts: "none",
      },
      conflictsPanel: [
        {
          title: "Catering approval mismatch",
          severity: "low",
          type: "Approval mismatch",
          note: "The decision is present in meeting notes, but the expense sheet still shows pending approval.",
          comparison: [
            {
              source: "meeting_notes.txt",
              value: "Catering plan preferred and discussed",
            },
            {
              source: "expenses.csv",
              value: "Estimated cost ₹12,000, status pending approval",
            },
          ],
          likelyLatestTruth:
            "The catering plan exists, but financial approval is not yet fully confirmed.",
          recommendedAction:
            "Verify the final approval from finance or a confirmation email before treating it as finalized.",
        },
      ],
      queryType: "Decision + budget lookup",
      routerDecision: ["text", "csv"],
      routerReason:
        "The query refers to a decision plus cost context, which matches notes and spreadsheet-style records.",
      followUpSuggestions: [
        "Was catering finally approved?",
        "What is the estimated catering cost?",
        "Who proposed the catering plan?",
      ],
    };
  }

  if (q.includes("conflict") || q.includes("mismatch")) {
    return {
      answer:
        "I found a mismatch in the transport budget across sources. The meeting notes mention ₹8,000, while a later email reference mentions ₹10,000.",
      sources: [
        {
          id: "conflict-1",
          title: "meeting_notes.txt",
          type: "text",
          snippet: "Transport budget discussed and noted as ₹8,000.",
          meta: "Line 18-20",
        },
        {
          id: "conflict-2",
          title: "followup_email.json",
          type: "email",
          snippet: "Updated transport requirement may need ₹10,000 allocation.",
          meta: "From: logistics-followup@college.edu",
        },
      ],
      toolUsed: ["text", "email"],
      status: "success",
      structuredTruth: {
        decision: "Transport arrangement identified, but budget changed across sources",
        budget: "₹8,000 to ₹10,000",
        approvedBy: "Unclear due to mismatch",
        evidence: ["meeting_notes.txt", "followup_email.json"],
        status: "needs review",
        conflicts: "budget mismatch detected",
      },
      conflictsPanel: [
        {
          title: "Conflict detected in transport budget",
          severity: "high",
          type: "Budget mismatch",
          note: "Two relevant sources disagree on the final budget value for transport.",
          comparison: [
            {
              source: "meeting_notes.txt",
              value: "₹8,000",
            },
            {
              source: "followup_email.json",
              value: "₹10,000",
            },
          ],
          likelyLatestTruth:
            "The later follow-up email likely reflects an updated budget of ₹10,000, but this is not yet fully verified.",
          recommendedAction:
            "Check the latest approved finance or logistics confirmation and treat the email as the likely newer source until verified.",
        },
      ],
      queryType: "Conflict check",
      routerDecision: ["text", "email"],
      routerReason:
        "The query asks about mismatch/conflict, so the system compares decision notes with follow-up communication.",
      followUpSuggestions: [
        "Which source is the latest one?",
        "Who should verify the final budget?",
        "Show me all transport-related sources",
      ],
    };
  }

  return emptyResponse;
}