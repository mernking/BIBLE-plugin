import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("api ket generating . . ...");
  const newApiKey = uuidv4();
  console.log("ApI KEY generated ... .. . .");
  return NextResponse.json({ apiKey: newApiKey });
}
