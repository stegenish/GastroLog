export const severityLevels = ["none", "mild", "medium", "severe"] as const;
export type Severity = (typeof severityLevels)[number];
export const severityLabels: Record<Severity, string> = { none: "Ingen", mild: "Lett", medium: "Moderat", severe: "Sterk" };

export const foodCategories = [
  { value: "grains", label: "Kornprodukter" },
  { value: "dairy", label: "Meieriprodukter" },
  { value: "meat_fish_eggs", label: "Kjøtt, fisk og egg" },
  { value: "vegetables", label: "Grønnsaker" },
  { value: "fruit", label: "Frukt" },
  { value: "beans_nuts", label: "Belgfrukter og nøtter" },
  { value: "sweets", label: "Søtsaker" },
  { value: "other", label: "Annet" },
] as const;

export const bowelTypes = ["normal", "hard", "loose"] as const;

export type FoodCategory = (typeof foodCategories)[number]["value"];
export type BowelType = (typeof bowelTypes)[number];
export const bowelLabels: Record<BowelType, string> = { normal: "Normal", hard: "Hard", loose: "Løs" };
export const kindLabels = { symptom: "Symptomer", food: "Mat siste døgn", bowel: "Avføring" } as const;
export const symptomLabels = { pain: "Magesmerter", nausea: "Kvalme", headache: "Hodepine" } as const;
export const durationLabels = { under_30m: "Under 30 min", "30m_2h": "30 min–2 timer", "2h_6h": "2–6 timer", over_6h: "Over 6 timer" } as const;
export const impactLabels = { usual: "Som vanlig", breaks: "Trenger pauser", stopped: "Må avbryte aktivitet" } as const;
export const locationLabels = { navel: "Rundt navlen", upper: "Øverst i magen", lower: "Nederst i magen", right: "Høyre side", left: "Venstre side", diffuse: "Flere steder / hele magen" } as const;
export function foodLabel(value: FoodCategory) {
  return foodCategories.find((item) => item.value === value)!.label;
}

export type SymptomPayload = {
  pain: Severity;
  nausea: Severity;
  headache: Severity;
  vomited: boolean;
  fever: boolean;
  duration?: keyof typeof durationLabels;
  impact?: keyof typeof impactLabels;
  location?: keyof typeof locationLabels;
  note: string;
};

export type FoodPayload = {
  categories: FoodCategory[];
  note: string;
};

export type BowelPayload = {
  bowelType: BowelType;
  note: string;
};

export type Entry =
  | { id: string; kind: "symptom"; occurredAt: string; payload: SymptomPayload }
  | { id: string; kind: "food"; occurredAt: string; payload: FoodPayload }
  | { id: string; kind: "bowel"; occurredAt: string; payload: BowelPayload };

const validSeverities = new Set<string>(severityLevels);
const validFoods = new Set<string>(foodCategories.map((item) => item.value));
const validBowels = new Set<string>(bowelTypes);

export class EntryValidationError extends Error {}

function requiredString(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" || !value) throw new EntryValidationError(`Velg ${field}.`);
  return value;
}

function noteFrom(formData: FormData) {
  const value = formData.get("note");
  if (typeof value !== "string") return "";
  const note = value.trim();
  if (note.length > 500) throw new EntryValidationError("Notatet kan ikke være lengre enn 500 tegn.");
  return note;
}

function occurredAtFrom(formData: FormData, now: Date) {
  const raw = requiredString(formData.get("occurredAt"), "et tidspunkt");
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(raw);
  if (!match) throw new EntryValidationError("Oppgi gyldig dato og klokkeslett med tidssone.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1] || hour > 23 || minute > 59 || second > 59) {
    throw new EntryValidationError("Oppgi gyldig dato og klokkeslett.");
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new EntryValidationError("Oppgi gyldig dato og klokkeslett.");
  }
  if (date.getTime() > now.getTime() + 5 * 60_000) {
    throw new EntryValidationError("Tidspunktet kan ikke være i fremtiden.");
  }
  return date.toISOString();
}

function severityFrom(formData: FormData, key: keyof typeof symptomLabels): Severity {
  const value = requiredString(formData.get(key), symptomLabels[key].toLowerCase());
  if (!validSeverities.has(value)) throw new EntryValidationError(`Velg en gyldig grad for ${symptomLabels[key].toLowerCase()}.`);
  return value as Severity;
}

function optionalChoice<T extends Record<string, string>>(formData: FormData, key: string, labels: T): keyof T | undefined {
  const value = formData.get(key);
  if (value === null || value === "") return undefined;
  if (typeof value !== "string" || !Object.hasOwn(labels, value)) throw new EntryValidationError("Velg et gyldig alternativ i valgfrie detaljer.");
  return value as keyof T;
}

export function parseEntry(formData: FormData, now = new Date()): Entry {
  const kind = requiredString(formData.get("kind"), "en type registrering");
  const occurredAt = occurredAtFrom(formData, now);
  const note = noteFrom(formData);
  const id = crypto.randomUUID();

  if (kind === "symptom") {
    return {
      id,
      kind,
      occurredAt,
      payload: {
        pain: severityFrom(formData, "pain"),
        nausea: severityFrom(formData, "nausea"),
        headache: severityFrom(formData, "headache"),
        vomited: formData.get("vomited") === "on",
        fever: formData.get("fever") === "on",
        duration: optionalChoice(formData, "duration", durationLabels),
        impact: optionalChoice(formData, "impact", impactLabels),
        location: optionalChoice(formData, "location", locationLabels),
        note,
      },
    };
  }

  if (kind === "food") {
    const categories = formData.getAll("categories");
    if (!categories.length || categories.some((value) => typeof value !== "string" || !validFoods.has(value))) {
      throw new EntryValidationError("Velg minst én matvaregruppe.");
    }
    return {
      id,
      kind,
      occurredAt,
      payload: {
        categories: [...new Set(categories as FoodCategory[])],
        note,
      },
    };
  }

  if (kind === "bowel") {
    const bowelType = requiredString(formData.get("bowelType"), "en type avføring");
    if (!validBowels.has(bowelType)) throw new EntryValidationError("Velg en gyldig type avføring.");
    return { id, kind, occurredAt, payload: { bowelType: bowelType as BowelType, note } };
  }

  throw new EntryValidationError("Velg en gyldig type registrering.");
}

export function summarizeEntry(entry: Entry) {
  if (entry.kind === "symptom") {
    const parts = (["pain", "nausea", "headache"] as const)
      .filter((key) => entry.payload[key] !== "none")
      .map((key) => `${symptomLabels[key]} · ${severityLabels[entry.payload[key]].toLowerCase()}`);
    if (entry.payload.vomited) parts.push("Kastet opp");
    if (entry.payload.fever) parts.push("Feber");
    if (!parts.length) parts.push("Ingen kvalme, magesmerter eller hodepine");
    if (entry.payload.duration) parts.push(`Varighet så langt: ${durationLabels[entry.payload.duration]}`);
    if (entry.payload.impact) parts.push(`Aktivitet: ${impactLabels[entry.payload.impact]}`);
    if (entry.payload.location) parts.push(`Smertested: ${locationLabels[entry.payload.location]}`);
    return parts.join("  •  ");
  }
  if (entry.kind === "food") {
    return entry.payload.categories.map(foodLabel).join(", ");
  }
  return `Avføring · ${bowelLabels[entry.payload.bowelType].toLowerCase()}`;
}
