import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { papers, users, auditLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { logAudit, getRequestIp, getRequestUserAgent } from "@/lib/audit";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val).replace(/"/g, '""');
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str}"`
            : str;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export async function GET(req: Request) {
  const fa = await authenticateFounder(req, 2);
  if (!fa.ok) return fa.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "papers";

  const ip = getRequestIp(req);
  const ua = getRequestUserAgent(req);

  if (type === "papers") {
    const rows = await db
      .select({
        id: papers.id,
        title: papers.title,
        authors: papers.authors,
        categories: papers.categories,
        publishedAt: papers.publishedAt,
        arxivUrl: papers.arxivUrl,
      })
      .from(papers)
      .orderBy(desc(papers.publishedAt))
      .limit(10000);

    await logAudit({
      actionType: "founder_export_papers",
      detail: { count: rows.length },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 2,
    });

    const csv = toCsv(
      rows.map((r) => ({
        ...r,
        authors: Array.isArray(r.authors) ? r.authors.join("; ") : r.authors,
        categories: Array.isArray(r.categories) ? r.categories.join("; ") : r.categories,
      })),
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="papers-${Date.now()}.csv"`,
      },
    });
  }

  if (type === "users") {
    // Anonymized export — no email, no hash, only metadata
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(50000);

    await logAudit({
      actionType: "founder_export_users",
      detail: { count: rows.length },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 2,
    });

    const csv = toCsv(rows as Record<string, unknown>[]);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users-anonymized-${Date.now()}.csv"`,
      },
    });
  }

  if (type === "audit") {
    const rows = await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(10000);

    await logAudit({
      actionType: "founder_export_audit_log",
      detail: { count: rows.length },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 2,
    });

    const csv = toCsv(
      rows.map((r) => ({
        ...r,
        detail: r.detail ? JSON.stringify(r.detail) : "",
      })),
    );
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-log-${Date.now()}.csv"`,
      },
    });
  }

  return Response.json({ error: "type must be: papers, users, audit" }, { status: 400 });
}
