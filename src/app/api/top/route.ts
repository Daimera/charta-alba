import { loadTop } from "@/lib/queries";

const VALID_WINDOWS = ["today", "week", "month", "all"] as const;
type Window = (typeof VALID_WINDOWS)[number];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const window = (searchParams.get("window") ?? "today") as Window;

  if (!VALID_WINDOWS.includes(window)) {
    return Response.json({ error: "Invalid window" }, { status: 400 });
  }

  const cards = await loadTop(window);
  return Response.json({ cards });
}
