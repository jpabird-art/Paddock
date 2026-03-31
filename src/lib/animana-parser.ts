/**
 * Parses Animana "Patient Information" / vet consult PDFs into structured records.
 *
 * Animana consult format:
 *   Header: "A3 HCMR" | "Horse [Name] Rmt XXXX, [breed], [sex]"
 *   Date blocks: "DD-MM-YYYY" followed by entry lines
 *   Entry types: "general - history :", "findings :", "diagnosis :", "plan / therapy :"
 *   Medications: "X.X [unit] [medication name] :"
 *   Reminders: "reminder - [type] : [text]"
 *   Appointments: "appointment - [type] : [text]"
 *   Notes: "note - [text]"
 *   Weight: "weight - X.X kg"
 *   Signature block at end
 */

export interface AnimanaConsultEntry {
  date: string; // ISO date
  type: "consult" | "medication" | "reminder" | "appointment" | "note" | "weight" | "task" | "attachment";
  history?: string;
  findings?: string;
  diagnosis?: string;
  plan?: string;
  additionalNotes?: string;
  medicationName?: string;
  medicationDosage?: string;
  medicationInstructions?: string;
  reminderType?: string;
  reminderText?: string;
  appointmentType?: string;
  appointmentText?: string;
  noteText?: string;
  weight?: number;
  taskText?: string;
}

export interface AnimanaConsultData {
  horseName: string | null;
  regimentalNumber: string | null;
  breed: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  lifeNumber: string | null;
  weight: string | null;
  colour: string | null;
  vetName: string | null;
  entries: AnimanaConsultEntry[];
}

function parseDate(dateStr: string): string {
  // DD-MM-YYYY → YYYY-MM-DD
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export function parseAnimanaConsult(text: string): AnimanaConsultData {
  const lines = text.split("\n").map((l) => l.trim());

  // Extract horse info from header
  // Pattern: "Horse [Name] Rmt XXXX" or "Horse Rmt XXXX"
  let horseName: string | null = null;
  let regimentalNumber: string | null = null;
  let breed: string | null = null;
  let sex: string | null = null;
  let dateOfBirth: string | null = null;
  let lifeNumber: string | null = null;
  let weight: string | null = null;
  let colour: string | null = null;
  let vetName: string | null = null;

  // Find horse header line - matches patterns like:
  // "Horse Rmt 9233, Irish Draught Horse, gelding"
  // "Horse Acorn 9248 1 DIV LG 9, Noniusz, gelding"
  for (const line of lines) {
    // Match "Horse [name] [rmt number]" pattern
    const horseMatch = line.match(/Horse\s+(.+?)(?:,\s*(.+?))?(?:,\s*(mare|gelding|stallion))?$/i);
    if (horseMatch) {
      const nameAndNum = horseMatch[1].trim();
      breed = horseMatch[2]?.trim() ?? null;
      sex = horseMatch[3]?.trim() ?? null;

      // Extract RMT number
      const rmtMatch = nameAndNum.match(/(?:Rmt\s+)?(\d{4})/);
      if (rmtMatch) {
        regimentalNumber = rmtMatch[1];
        // Name is everything before the RMT number, or "Rmt XXXX"
        const beforeRmt = nameAndNum.substring(0, nameAndNum.indexOf(rmtMatch[0])).trim();
        if (beforeRmt && beforeRmt.toLowerCase() !== "rmt") {
          horseName = beforeRmt;
        }
      }
      break;
    }
  }

  // Extract DOB
  for (const line of lines) {
    const dobMatch = line.match(/Born on (\d{2}-\d{2}-\d{4})/);
    if (dobMatch) {
      dateOfBirth = parseDate(dobMatch[1]);
      break;
    }
  }

  // Extract life number
  for (const line of lines) {
    const lifeMatch = line.match(/Life number (\S+)/);
    if (lifeMatch) {
      lifeNumber = lifeMatch[1];
      // Rest of the line may have weight, colour, etc.
      const rest = line.substring(line.indexOf(lifeMatch[0]) + lifeMatch[0].length).trim();
      const weightMatch = rest.match(/([\d.]+)\s*kg/);
      if (weightMatch) weight = weightMatch[1];
      // Colour is typically a word like "black", "bay", "grey"
      const colourMatch = rest.match(/\b(black|bay|grey|chestnut|brown|dun|palomino|roan|piebald|skewbald)\b/i);
      if (colourMatch) colour = colourMatch[1];
      break;
    }
  }

  // Extract vet name from signature block
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().startsWith("signature")) {
      // Vet name is typically 1-5 lines after "Signature :" (blank lines in between)
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const candidate = lines[j];
        if (candidate && candidate.length > 2 && !candidate.startsWith("Hyde") && !candidate.startsWith("Vet Clinic") && !candidate.match(/^\d/)) {
          vetName = candidate;
          break;
        }
      }
      break;
    }
  }

  // Parse date-based entries
  const entries: AnimanaConsultEntry[] = [];
  const datePattern = /^(\d{2}-\d{2}-\d{4})$/;

  let currentDate: string | null = null;
  let currentConsult: {
    history: string[];
    findings: string[];
    diagnosis: string[];
    plan: string[];
    additional: string[];
  } | null = null;
  let activeField: "history" | "findings" | "diagnosis" | "plan" | "additional" | null = null;

  function flushConsult() {
    if (currentConsult && currentDate) {
      const history = currentConsult.history.join("\n").trim();
      const findings = currentConsult.findings.join("\n").trim();
      const diagnosis = currentConsult.diagnosis.join("\n").trim();
      const plan = currentConsult.plan.join("\n").trim();
      const additional = currentConsult.additional.join("\n").trim();

      if (history || findings || diagnosis || plan || additional) {
        entries.push({
          date: parseDate(currentDate),
          type: "consult",
          history: history || undefined,
          findings: findings || undefined,
          diagnosis: diagnosis || undefined,
          plan: plan || undefined,
          additionalNotes: additional || undefined,
        });
      }
    }
    currentConsult = null;
    activeField = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and header content
    if (!line) continue;
    if (line === "PATIENT INFORMATION") continue;
    if (line.startsWith("A3 HCMR")) continue;
    if (line.startsWith("Horse ")) continue;
    if (line.startsWith("Born on")) continue;
    if (line.startsWith("Life number")) continue;
    if (line.toLowerCase().startsWith("signature")) break; // Stop at signature

    // Date line
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      flushConsult();
      currentDate = dateMatch[1];
      continue;
    }

    if (!currentDate) continue;

    // Medication line: "X.X [unit] [medication] :"
    const medMatch = line.match(/^([\d.]+)\s+(ml|syringe|vial|sachet|times|tablet)\s+(.+?)\s*:\s*(.*)$/i);
    if (medMatch) {
      flushConsult();
      const instructions = medMatch[4].trim();
      // Check next line for parenthetical instructions
      let fullInstructions = instructions;
      if (i + 1 < lines.length && lines[i + 1].startsWith("(")) {
        fullInstructions = (instructions + " " + lines[i + 1]).trim();
      }
      entries.push({
        date: parseDate(currentDate),
        type: "medication",
        medicationDosage: `${medMatch[1]} ${medMatch[2]}`,
        medicationName: medMatch[3].trim(),
        medicationInstructions: fullInstructions || undefined,
      });
      continue;
    }

    // Reminder line
    const reminderMatch = line.match(/^reminder\s*-\s*(.+?)\s*:\s*(.+)$/i);
    if (reminderMatch) {
      flushConsult();
      entries.push({
        date: parseDate(currentDate),
        type: "reminder",
        reminderType: reminderMatch[1].trim(),
        reminderText: reminderMatch[2].trim(),
      });
      continue;
    }

    // Appointment line
    const appointmentMatch = line.match(/^appointment\s*-\s*(.+?)\s*:\s*(.+)$/i);
    if (appointmentMatch) {
      flushConsult();
      entries.push({
        date: parseDate(currentDate),
        type: "appointment",
        appointmentType: appointmentMatch[1].trim(),
        appointmentText: appointmentMatch[2].trim(),
      });
      continue;
    }

    // Note line
    const noteMatch = line.match(/^note\s*-\s*(.+)$/i);
    if (noteMatch) {
      flushConsult();
      entries.push({
        date: parseDate(currentDate),
        type: "note",
        noteText: noteMatch[1].trim(),
      });
      continue;
    }

    // Weight line
    const weightMatch = line.match(/^weight\s*-\s*([\d.]+)\s*kg/i);
    if (weightMatch) {
      flushConsult();
      entries.push({
        date: parseDate(currentDate),
        type: "weight",
        weight: parseFloat(weightMatch[1]),
      });
      continue;
    }

    // Task line
    const taskMatch = line.match(/^task\s*-\s*(.+)$/i);
    if (taskMatch) {
      flushConsult();
      entries.push({
        date: parseDate(currentDate),
        type: "task",
        taskText: taskMatch[1].trim(),
      });
      continue;
    }

    // Attachment line
    if (line.startsWith("attachment -")) {
      flushConsult();
      entries.push({
        date: parseDate(currentDate),
        type: "attachment",
        noteText: line.replace("attachment -", "").trim() || undefined,
      });
      continue;
    }

    // "Full details can be found in appendix X" — skip
    if (line.match(/^Full details can be found in appendix/i)) continue;

    // Consult fields
    const historyMatch = line.match(/^general\s*-\s*history\s*:\s*(.*)$/i);
    if (historyMatch) {
      if (!currentConsult) {
        currentConsult = { history: [], findings: [], diagnosis: [], plan: [], additional: [] };
      }
      activeField = "history";
      if (historyMatch[1].trim()) currentConsult.history.push(historyMatch[1].trim());
      continue;
    }

    const findingsMatch = line.match(/^findings\s*:\s*(.*)$/i);
    if (findingsMatch) {
      if (!currentConsult) {
        currentConsult = { history: [], findings: [], diagnosis: [], plan: [], additional: [] };
      }
      activeField = "findings";
      if (findingsMatch[1].trim()) currentConsult.findings.push(findingsMatch[1].trim());
      continue;
    }

    const diagnosisMatch = line.match(/^diagnosis\s*:\s*(.*)$/i);
    if (diagnosisMatch) {
      if (!currentConsult) {
        currentConsult = { history: [], findings: [], diagnosis: [], plan: [], additional: [] };
      }
      activeField = "diagnosis";
      if (diagnosisMatch[1].trim()) currentConsult.diagnosis.push(diagnosisMatch[1].trim());
      continue;
    }

    const planMatch = line.match(/^plan\s*\/\s*therapy\s*:\s*(.*)$/i);
    if (planMatch) {
      if (!currentConsult) {
        currentConsult = { history: [], findings: [], diagnosis: [], plan: [], additional: [] };
      }
      activeField = "plan";
      if (planMatch[1].trim()) currentConsult.plan.push(planMatch[1].trim());
      continue;
    }

    // Continuation lines within a consult
    if (currentConsult && activeField && line) {
      currentConsult[activeField].push(line);
      continue;
    }

    // Lines after plan/therapy but before next date/entry — additional notes
    if (currentConsult && line) {
      activeField = "additional";
      currentConsult.additional.push(line);
    }
  }

  flushConsult();

  return {
    horseName,
    regimentalNumber,
    breed,
    sex,
    dateOfBirth,
    lifeNumber,
    weight,
    colour,
    vetName,
    entries,
  };
}
