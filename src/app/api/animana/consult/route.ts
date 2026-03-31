import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { parseAnimanaConsult } from "@/lib/animana-parser";
import type { AnimanaConsultEntry } from "@/lib/animana-parser";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

/**
 * POST /api/animana/consult
 *
 * Accepts a PDF file upload from Animana (patient info / vet consult).
 * Parses it, matches the horse by regimental number, and returns a preview
 * of records to import. If `?confirm=1`, actually creates the records.
 */
export async function POST(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  if (!session || !["ADMIN", "VET"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const confirm = searchParams.get("confirm") === "1";

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Please upload a PDF file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let pdfData;
  try {
    pdfData = await pdfParse(buffer);
  } catch {
    return NextResponse.json({ error: "Failed to read PDF" }, { status: 400 });
  }

  const parsed = parseAnimanaConsult(pdfData.text);

  if (!parsed.regimentalNumber) {
    return NextResponse.json(
      { error: "Could not find a regimental number in this PDF. Is this an Animana export?" },
      { status: 400 }
    );
  }

  // Match horse
  const horse = await prisma.horse.findFirst({
    where: {
      regimentalNumber: { contains: parsed.regimentalNumber, mode: "insensitive" },
      isActive: true,
    },
    select: { id: true, name: true, regimentalNumber: true },
  });

  if (!horse) {
    return NextResponse.json(
      {
        error: `No active horse found with regimental number containing "${parsed.regimentalNumber}"`,
        parsed: { horseName: parsed.horseName, regimentalNumber: parsed.regimentalNumber },
      },
      { status: 404 }
    );
  }

  // Build preview of what will be imported
  const preview = buildPreview(parsed.entries);

  if (!confirm) {
    return NextResponse.json({
      horse: { id: horse.id, name: horse.name, regimentalNumber: horse.regimentalNumber },
      parsed: {
        horseName: parsed.horseName,
        regimentalNumber: parsed.regimentalNumber,
        breed: parsed.breed,
        vetName: parsed.vetName,
        entryCount: parsed.entries.length,
      },
      preview,
    });
  }

  // Actually import
  const results = await importRecords(horse.id, session.user.id, parsed.entries, parsed.vetName);

  return NextResponse.json({
    horse: { id: horse.id, name: horse.name, regimentalNumber: horse.regimentalNumber },
    imported: results,
  });
}

interface PreviewItem {
  date: string;
  type: string;
  summary: string;
  model: string;
}

function buildPreview(entries: AnimanaConsultEntry[]): PreviewItem[] {
  return entries.map((entry) => {
    switch (entry.type) {
      case "consult":
        return {
          date: entry.date,
          type: "Vet Consult",
          summary: truncate(
            [entry.history, entry.findings, entry.plan].filter(Boolean).join(" — "),
            120
          ),
          model: "HealthNote + HealthEvent",
        };
      case "medication":
        return {
          date: entry.date,
          type: "Medication",
          summary: `${entry.medicationDosage} ${entry.medicationName}`,
          model: "MedicationRecord",
        };
      case "reminder":
        return {
          date: entry.date,
          type: `Reminder (${entry.reminderType})`,
          summary: entry.reminderText ?? "",
          model: "HealthEvent",
        };
      case "appointment":
        return {
          date: entry.date,
          type: "Appointment",
          summary: `${entry.appointmentType}: ${entry.appointmentText}`,
          model: "HealthEvent",
        };
      case "note":
        return {
          date: entry.date,
          type: "Note",
          summary: truncate(entry.noteText ?? "", 120),
          model: "HealthNote",
        };
      case "weight":
        return {
          date: entry.date,
          type: "Weight",
          summary: `${entry.weight} kg`,
          model: "HealthNote",
        };
      default:
        return {
          date: entry.date,
          type: entry.type,
          summary: "",
          model: "skip",
        };
    }
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.substring(0, max) + "…" : text;
}

async function importRecords(
  horseId: string,
  userId: string,
  entries: AnimanaConsultEntry[],
  vetName: string | null
) {
  let healthNotes = 0;
  let healthEvents = 0;
  let medications = 0;

  for (const entry of entries) {
    const entryDate = new Date(entry.date + "T12:00:00.000Z");

    switch (entry.type) {
      case "consult": {
        // Create a HealthNote with all consult fields
        const parts: string[] = [];
        if (vetName) parts.push(`Vet: ${vetName}`);
        if (entry.history) parts.push(`History: ${entry.history}`);
        if (entry.findings) parts.push(`Findings: ${entry.findings}`);
        if (entry.diagnosis) parts.push(`Diagnosis: ${entry.diagnosis}`);
        if (entry.plan) parts.push(`Plan: ${entry.plan}`);
        if (entry.additionalNotes) parts.push(entry.additionalNotes);

        const content = parts.join("\n\n");
        if (content) {
          await prisma.healthNote.create({
            data: {
              horseId,
              authorId: userId,
              content: `[Animana Import — ${entry.date}]\n\n${content}`,
              createdAt: entryDate,
            },
          });
          healthNotes++;
        }

        // Also create a completed VET_CHECKUP event
        await prisma.healthEvent.create({
          data: {
            horseId,
            type: "VET_CHECKUP",
            status: "COMPLETED",
            scheduledAt: entryDate,
            completedAt: entryDate,
            notes: truncate(entry.history ?? entry.findings ?? "Animana import", 200),
            performedBy: vetName ?? undefined,
          },
        });
        healthEvents++;
        break;
      }

      case "medication": {
        await prisma.medicationRecord.create({
          data: {
            horseId,
            administeredById: userId,
            medicationName: entry.medicationName ?? "Unknown",
            dosage: entry.medicationDosage ?? "",
            route: "ORAL", // Default — Animana doesn't always specify route
            notes: entry.medicationInstructions
              ? `[Animana Import] ${entry.medicationInstructions}`
              : "[Animana Import]",
            administeredAt: entryDate,
            createdAt: entryDate,
          },
        });
        medications++;
        break;
      }

      case "reminder": {
        const typeMap: Record<string, "VACCINATION" | "DENTAL_CHECK" | "CUSTOM"> = {
          vaccination: "VACCINATION",
          "dental control": "DENTAL_CHECK",
        };
        const eventType = typeMap[entry.reminderType?.toLowerCase() ?? ""] ?? "CUSTOM";
        const isFuture = entryDate > new Date();

        await prisma.healthEvent.create({
          data: {
            horseId,
            type: eventType,
            status: isFuture ? "SCHEDULED" : "OVERDUE",
            scheduledAt: entryDate,
            notes: `[Animana] ${entry.reminderText ?? entry.reminderType ?? ""}`,
          },
        });
        healthEvents++;
        break;
      }

      case "appointment": {
        const isCompleted = entry.appointmentType?.toLowerCase().includes("completed");
        await prisma.healthEvent.create({
          data: {
            horseId,
            type: "VET_CHECKUP",
            status: isCompleted ? "COMPLETED" : "SCHEDULED",
            scheduledAt: entryDate,
            completedAt: isCompleted ? entryDate : undefined,
            notes: `[Animana] ${entry.appointmentText ?? ""}`,
          },
        });
        healthEvents++;
        break;
      }

      case "note": {
        await prisma.healthNote.create({
          data: {
            horseId,
            authorId: userId,
            content: `[Animana Import — ${entry.date}]\n\n${entry.noteText}`,
            createdAt: entryDate,
          },
        });
        healthNotes++;
        break;
      }

      case "weight": {
        await prisma.healthNote.create({
          data: {
            horseId,
            authorId: userId,
            content: `[Animana Import — ${entry.date}]\n\nWeight: ${entry.weight} kg`,
            createdAt: entryDate,
          },
        });
        healthNotes++;
        break;
      }

      // Skip attachment, task types
      default:
        break;
    }
  }

  return { healthNotes, healthEvents, medications };
}
