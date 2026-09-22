import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { db } from "@/db";
import { monthlyReports, organizations } from "@/db/schema";
import { getCurrentUser, hasRole, roleHome } from "@/lib/permissions";

interface ReportData {
  year?: number;
  month?: number;
  generatedAt?: string;
  activeEmployees?: number;
  participationToday?: number;
  totalPulses?: number;
  weekAverage?: number | null;
  weekBand?: { positive?: number | null; neutral?: number | null; negative?: number | null };
  monthAverage?: number | null;
  monthBand?: { positive?: number | null; neutral?: number | null; negative?: number | null };
  openConcerns?: number;
}

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

const nm = (n: number | null | undefined, digits = 2): string =>
  n === null || n === undefined ? "—" : n.toFixed(digits);

const pct = (n: number | null | undefined): string =>
  n === null || n === undefined ? "—" : `${n}%`;

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

  const [report] = await db.query.monthlyReports.findMany({
    where: and(
      eq(monthlyReports.id, id),
      eq(monthlyReports.organizationId, user.organizationId)
    ),
    limit: 1,
  });
  if (!report || !report.reportJson) {
    return new Response("Report not found.", { status: 404 });
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  const data = report.reportJson as ReportData;
  const monthName = new Date(0, (data.month ?? 1) - 1, 1).toLocaleString("en-US", {
    month: "long",
  });

  const doc = await PDFDocument.create();
  doc.setTitle(`Pulse360 Monthly Report - ${monthName} ${data.year}`);
  doc.setAuthor("Pulse360");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  const addPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
  };
  const ensure = (needed: number) => {
    if (page.getHeight() - page.getY() - BOTTOM < needed) addPage();
  };

  const y = (amount: number) => page.moveDown(amount);

  const text = (s: string, size: number, fontF: PDFFont, color = rgb(0.1, 0.1, 0.12)) => {
    page.drawText(s, { x: MARGIN, y: page.getY(), size, font: fontF, color });
  };

  const heading = (s: string) => {
    ensure(30);
    y(18);
    text(ascii(s), 12, bold, rgb(0.19, 0.12, 0.38));
    y(8);
  };

  const row = (label: string, value: string) => {
    ensure(16);
    y(16);
    page.drawText(ascii(label), {
      x: MARGIN,
      y: page.getY(),
      size: 9.5,
      font: font,
      color: rgb(0.4, 0.4, 0.45),
    });
    page.drawText(ascii(value), {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(ascii(value), 9.5),
      y: page.getY(),
      size: 9.5,
      font,
      color: rgb(0.1, 0.1, 0.12),
    });
  };

  const paragraph = (s: string, size = 9.5, color = rgb(0.1, 0.1, 0.12)) => {
    for (const line of wrap(s, font, size, BODY_WIDTH)) {
      ensure(size + 3);
      y(size + 4);
      text(line, size, font, color);
    }
  };

  // Header
  page.moveTo(MARGIN, PAGE_H - 64);
  text("Pulse360", 11, bold, rgb(0.29, 0.16, 0.44));
  page.moveDown(4);
  text("Monthly pulse report", 22, bold, rgb(0.1, 0.1, 0.12));
  page.moveTo(MARGIN, PAGE_H - 108);
  text(`${ascii(org?.name ?? "Organization")}`, 12, font, rgb(0.2, 0.2, 0.24));
  page.moveDown(4);
  text(`${monthName} ${data.year}`, 12, font, rgb(0.2, 0.2, 0.24));
  page.moveDown(4);
  text(
    `Generated ${data.generatedAt ? new Date(data.generatedAt).toLocaleString("en-IN") : "recently"}`,
    8.5,
    font,
    rgb(0.45, 0.45, 0.5)
  );
  page.moveTo(MARGIN, PAGE_H - 140);
  page.drawLine({
    start: { x: MARGIN, y: page.getY() },
    end: { x: PAGE_W - MARGIN, y: page.getY() },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.88),
  });

  page.moveTo(MARGIN, PAGE_H - 158);

  heading("Participation");
  row("Active employees", String(data.activeEmployees ?? "—"));
  row("Pulse today", `${pct(data.participationToday)}`);
  row("Pulses recorded this month", String(data.totalPulses ?? "—"));

  heading("Sentiment");
  row("Average this month", nm(data.monthAverage));
  paragraph(
    `Month breakdown — positive ${pct(data.monthBand?.positive)}, neutral ${pct(
      data.monthBand?.neutral
    )}, negative ${pct(data.monthBand?.negative)}.`,
    9.5,
    rgb(0.45, 0.45, 0.5)
  );
  row("Average last 7 days", nm(data.weekAverage));
  paragraph(
    `7-day breakdown — positive ${pct(data.weekBand?.positive)}, neutral ${pct(
      data.weekBand?.neutral
    )}, negative ${pct(data.weekBand?.negative)}.`,
    9.5,
    rgb(0.45, 0.45, 0.5)
  );

  heading("Wellbeing");
  row("Open concerns", String(data.openConcerns ?? "—"));

  heading("About this report");
  paragraph(
    "Sentiment is measured on a 1-5 scale from daily 60-second pulses. Aggregates are only shown " +
      "when at least five colleagues contributed, to protect privacy. Recognition is voluntary and " +
      "no individual is scored or ranked against others.",
    9,
    rgb(0.45, 0.45, 0.5)
  );

  const bytes = await doc.save();
  const monthKey = `${data.year}-${String(data.month ?? 1).padStart(2, "0")}`;

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pulse360-report-${monthKey}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}