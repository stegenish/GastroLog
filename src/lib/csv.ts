import { bowelLabels, foodLabel, kindLabels, mealLabels, severityLabels, summarizeEntry, symptomLabels, type Entry } from "./entries";

function csvCell(value: string) {
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function entriesToCsv(entries: Entry[]) {
  const rows = [
    ["Tidspunkt (UTC)", "Type", "Oppsummering", symptomLabels.pain, symptomLabels.nausea, symptomLabels.headache, "Kastet opp", "Feber", "Måltid", "Matvaregrupper", "Avføring", "Notater"],
    ...entries.map((entry) => [
      entry.occurredAt,
      kindLabels[entry.kind],
      summarizeEntry(entry),
      entry.kind === "symptom" ? severityLabels[entry.payload.pain] : "",
      entry.kind === "symptom" ? severityLabels[entry.payload.nausea] : "",
      entry.kind === "symptom" ? severityLabels[entry.payload.headache] : "",
      entry.kind === "symptom" && entry.payload.vomited ? "Ja" : "",
      entry.kind === "symptom" && entry.payload.fever ? "Ja" : "",
      entry.kind === "meal" ? mealLabels[entry.payload.mealType] : "",
      entry.kind === "meal" ? entry.payload.categories.map(foodLabel).join("; ") : "",
      entry.kind === "bowel" ? bowelLabels[entry.payload.bowelType] : "",
      entry.payload.note,
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
