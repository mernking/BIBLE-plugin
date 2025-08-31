import { loadAllBibles } from "@/lib/bibleLoader";

export async function GET() {
  const bibles = loadAllBibles();
  return Response.json({ bibles });
}