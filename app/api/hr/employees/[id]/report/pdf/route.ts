import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getCurrentUser, hasRole, roleHome } from "@/lib/permissions";
import { SENTIMENT_LABELS } from "@/lib/validation/pulse";
import { dayKey } from "@/lib/utils/date";
import {
  loadEmployeeInsights,
  resolvePulsePeriod,
  type EmployeeInsights,
} from "@/lib/hr/employee-insights";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const BOTTOM = 56;
const BODY_WIDTH = PAGE_W - MARGIN * 2;

const ascii = (s: string): string =>
  s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, "-")
    .replace(/[^\x20-\x7E]/g, "-");

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = ascii(text).split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const fmtDate = (key: string): string => {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse | Response> {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user || !user.active) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!hasRole(user, "hr")) {
    return NextResponse.redirect(new URL(roleHome(user.role), request.url));
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  const url = new URL(request.url);
  const period = resolvePulsePeriod(
    Object.fromEntries(url.searchParams.entries()),
    org?.timezone
  );

  const insights = await loadEmployeeInsights({
    organizationId: user.organizationId,
    employeeId: id,
    start: period.start,
    end: period.end,
  });
  if (!insights) {
    return new Response("Employee not found.", { status: 404 });
  }

  const buf = await buildPdf(insights, org?.name, period.start, period.end);

  const safeName = insights.employee.name.trim().replace(/\s+/g, "-").toLowerCase();
  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pulse360-${safeName}-${period.start}-to-${period.end}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

type PdfCtx = {
  doc: PDFDocument;
  page: ReturnType<PDFDocument["addPage"]>;
  font: PDFFont;
  bold: PDFFont;
};

async function buildPdf(
  insights: EmployeeInsights,
  orgName: string | undefined,
  start: string,
  end: string
): Promise<Uint8Array> {
  const { employee, pulses, connections, limitedTeammates, weekRows, count, avg, high, low, topTags } =
    insights;

  const doc = await PDFDocument.create();
  doc.setTitle(`Pulse report - ${employee.name}`);
  doc.setAuthor("Pulse360");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const ctx: PdfCtx = { doc, page: doc.addPage([PAGE_W, PAGE_H]), font, bold };
  const ensure = (needed: number) => {
    if (ctx.page.getHeight() - ctx.page.getY() - BOTTOM < needed) {
      ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
      ctx.page.moveTo(MARGIN, PAGE_H - 56);
    }
  };

  const section = (title: string) => {
    ensure(32);
    ctx.page.moveTo(MARGIN, ctx.page.getY() - 22);
    ctx.page.drawText(title, { x: MARGIN, y: ctx.page.getY(), size: 12, font: bold, color: rgb(0.19, 0.12, 0.38) });
    ctx.page.moveTo(MARGIN, ctx.page.getY() - 4);
  };

  const kv = (label: string, value: string) => {
    ensure(16);
    ctx.page.moveTo(MARGIN, ctx.page.getY() - 15);
    ctx.page.drawText(ascii(label), { x: MARGIN, y: ctx.page.getY(), size: 9.5, font, color: rgb(0.4, 0.4, 0.45) });
    ctx.page.drawText(ascii(value), {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(ascii(value), 9.5),
      y: ctx.page.getY(),
      size: 9.5,
      font: bold,
      color: rgb(0.1, 0.1, 0.12),
    });
  };

  const para = (text: string, size = 9.5, color = rgb(0.1, 0.1, 0.12)) => {
    for (const line of wrap(text, font, size, BODY_WIDTH)) {
      ensure(size + 3);
      ctx.page.moveTo(MARGIN, ctx.page.getY() - (size + 4));
      ctx.page.drawText(line, { x: MARGIN, y: ctx.page.getY(), size, font, color });
    }
  };

  // Header
  ctx.page.moveTo(MARGIN, PAGE_H - 64);
  ctx.page.drawText("Pulse360", { x: MARGIN, y: ctx.page.getY(), size: 11, font: bold, color: rgb(0.29, 0.16, 0.44) });
  ctx.page.moveTo(MARGIN, PAGE_H - 84);
  ctx.page.drawText("Individual pulse report", { x: MARGIN, y: ctx.page.getY(), size: 22, font: bold, color: rgb(0.1, 0.1, 0.12) });
  ctx.page.moveTo(MARGIN, PAGE_H - 104);
  ctx.page.drawText(ascii(orgName ?? "Organization"), { x: MARGIN, y: ctx.page.getY(), size: 12, font, color: rgb(0.2, 0.2, 0.24) });
  ctx.page.moveTo(MARGIN, PAGE_H - 116);
  const periodLabel = `Period: ${fmtDate(start)} to ${fmtDate(end)}`;
  ctx.page.drawText(periodLabel, { x: MARGIN, y: ctx.page.getY(), size: 8.5, font, color: rgb(0.45, 0.45, 0.5) });

  // Employee identity
  ctx.page.moveTo(MARGIN, PAGE_H - 148);
  para(employee.name, 16, rgb(0.1, 0.1, 0.12));
  ctx.page.moveTo(MARGIN, ctx.page.getY() - 8);
  para(`${employee.name} · ${employee.email}`, 9.5, rgb(0.4, 0.4, 0.45));
  const roleLine = [employee.role, employee.jobTitle, employee.department?.name, employee.team?.name]
    .filter(Boolean)
    .join(" · ");
  if (roleLine) para(roleLine, 9.5, rgb(0.4, 0.4, 0.45));
  if (employee.manager) para(`Manager: ${employee.manager.name}`, 8.5, rgb(0.45, 0.45, 0.5));

  ctx.page.moveTo(MARGIN, PAGE_H - 176);
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.page.getY() },
    end: { x: PAGE_W - MARGIN, y: ctx.page.getY() },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.88),
  });
  ctx.page.moveTo(MARGIN, PAGE_H - 190);

  section("Pulse summary");
  kv("Submissions", String(count));
  kv("Average mood", avg === null ? "—" : avg.toFixed(1));
  kv("High days (4-5)", String(high));
  kv("Low days (1-2)", String(low));

  if (weekRows.length > 0) {
    section("Weekly snapshot");
    weekRows.forEach(({ startKey, pulses: wk }) => {
      const wkAvg = wk.reduce((s, p) => s + p.sentimentScore, 0) / wk.length;
      const full = wk.length >= 5;
      kv(`Week of ${fmtDate(startKey)}`, `${wk.length} submissions · avg ${wkAvg.toFixed(1)} · ${full ? "full coverage" : "partial"}`);
    });
  }

  if (connections.length > 0) {
    section("Relationship signals");
    connections.forEach((c) =>
      kv(c.name, `${c.given} recognised them · ${c.received} recognised by them`)
    );
  }
  if (limitedTeammates.length > 0) {
    section(`Teammates with limited interaction signal (${limitedTeammates.length})`);
    para(
      `No recognitions exchanged in this period with ${limitedTeammates.map((t) => t.name).join(", ")}. ` +
        "Recognition is voluntary, so this does not imply conflict.",
      9,
      rgb(0.45, 0.45, 0.5)
    );
  }

  if (topTags.length > 0) {
    section("Most common mood tags");
    para(topTags.map(([t, n]) => `${t} (${n})`).join(" · "), 9.5);
  }

  section(`Pulse timeline (${count} of 60-second pulses)`);
  if (pulses.length === 0) {
    para("No pulses recorded in this period.");
  }
  pulses
    .slice()
    .reverse()
    .forEach((p) => {
      ensure(14);
      ctx.page.moveTo(MARGIN, ctx.page.getY() - 16);
      const headline = `${fmtDate(dayKey(p.pulseDate))}  -  Mood ${p.sentimentScore}/5 (${SENTIMENT_LABELS[p.sentimentScore - 1]})`;
      ctx.page.drawText(headline, { x: MARGIN, y: ctx.page.getY(), size: 9.5, font: bold, color: rgb(0.1, 0.1, 0.12) });
      ctx.page.moveTo(MARGIN + 12, ctx.page.getY() - 13);
      if (p.moodTags.length > 0) {
        ctx.page.drawText(`Tags: ${ascii(p.moodTags.join(", "))}`, { x: MARGIN + 12, y: ctx.page.getY(), size: 8.5, font, color: rgb(0.45, 0.45, 0.5) });
        ctx.page.moveTo(MARGIN + 12, ctx.page.getY() - 12);
      }
      if (p.bestMoment) {
        para(`Best moment: ${p.bestMoment}`, 8.5, rgb(0.45, 0.45, 0.5));
      }
      if (p.improvementText) {
        para(`Could be better: ${p.improvementText}`, 8.5, rgb(0.45, 0.45, 0.5));
      }
    });

  return doc.save();
}