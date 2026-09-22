import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { emailEnabled, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

// 5 enquiries per IP per hour
const ENQUIRY_LIMIT = 5;
const ENQUIRY_WINDOW_MS = 60 * 60 * 1000;

const enquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  organisation: z.string().trim().max(160).optional().default(""),
  horses: z.string().trim().max(6).optional().default(""),
  message: z.string().trim().min(10).max(4000),
  // Honeypot: populated only by bots. Accepted by the schema so the
  // response is indistinguishable from a successful submission.
  website: z.string().max(200).optional().default(""),
});

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const config = getSiteConfig();

  if (config.mode !== "marketing") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const { allowed, retryAfterMs } = rateLimit(
    `contact:${clientIp(request)}`,
    ENQUIRY_LIMIT,
    ENQUIRY_WINDOW_MS
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many enquiries from this address. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form: a required field is missing or invalid." },
      { status: 400 }
    );
  }

  const enquiry = parsed.data;

  // Silently accept honeypot submissions so bots learn nothing.
  if (enquiry.website) {
    return NextResponse.json({ ok: true });
  }

  if (!emailEnabled || !config.contact.email) {
    console.warn("[contact] Email delivery is not configured — enquiry could not be delivered.");
    return NextResponse.json(
      { error: config.contact.email ? `Our contact form is unavailable. Please email ${config.contact.email} directly.` : "Our contact form is currently unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const lines = [
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    enquiry.organisation ? `Organisation: ${enquiry.organisation}` : null,
    enquiry.horses ? `Horses: ${enquiry.horses}` : null,
    "",
    enquiry.message,
  ].filter(Boolean);

  const sent = await sendEmail({
    to: config.contact.email,
    subject: `Paddock enquiry — ${enquiry.name}${enquiry.organisation ? ` (${enquiry.organisation})` : ""}`,
    text: lines.join("\n"),
  });

  if (!sent) {
    return NextResponse.json(
      { error: `Your message could not be sent. Please email ${config.contact.email} directly.` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
