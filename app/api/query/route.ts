import { NextRequest, NextResponse } from "next/server";
import { getMockResponse } from "@/lib/sampleData";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body.query === "string" ? body.query : "";

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query is required." },
        { status: 400 }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const response = getMockResponse(query);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Invalid request or server failure." },
      { status: 500 }
    );
  }
}