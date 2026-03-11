import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/uploads`, { method: "GET" });

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({ detail: "Failed to fetch uploads" }));
      return NextResponse.json(
        { error: err.detail ?? "Failed to fetch uploads." },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch uploads.";
    if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
      return NextResponse.json(
        { error: "Backend is not running. Please start the Memora backend on port 8000." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
