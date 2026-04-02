import { NextResponse } from "next/server";
import { loadTrendingTags } from "@/lib/queries";

export const revalidate = 3600; // revalidate once per hour

export async function GET() {
  const tags = await loadTrendingTags(5);
  return NextResponse.json({ tags });
}
