"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowRight, CalendarDays, ChevronLeft, ChevronRight,
  Heart, ShieldCheck, Trash2, UtensilsCrossed, Waves,
} from "lucide-react";
import { deleteEntryAction } from "@/app/actions";
import { entryDay, formatDay, shiftDate } from "@/lib/dates";
import { kindLabels, summarizeEntry, type Entry } from "@/lib/entries";

export function DailyTimeline({ entries, today, selectedDay, onSelectDay, onAddCheckin }: {
  entries: Entry[];
  today: string;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  onAddCheckin: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const dayEntries = selectedDay ? entries.filter((entry) => entryDay(entry) === selectedDay) : [];

  async function remove(id: string) {
    if (!window.confirm("Vil du slette denne registreringen?")) return;
    setDeleting(id);
    setError("");
    try {
      const result = await deleteEntryAction(id);
      if (result.error) setError(result.error);
      else router.refresh();
    } catch {
      setError("Kunne ikke slette registreringen. Prøv igjen.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="card timeline-card" aria-labelledby="timeline-title">
      <div className="timeline-heading">
        <div className="card-heading compact"><div className="heading-icon peach"><CalendarDays size={19} /></div><div><span className="section-kicker">DIN LOGG</span><h2 id="timeline-title">Dagsoversikt</h2></div></div>
        <div className="date-controls"><button type="button" aria-label="Forrige dag" onClick={() => onSelectDay(shiftDate(selectedDay || today, -1))}><ChevronLeft size={18} /></button><button type="button" aria-label="Neste dag" disabled={!selectedDay || selectedDay >= today} onClick={() => onSelectDay(shiftDate(selectedDay, 1))}><ChevronRight size={18} /></button></div>
      </div>
      <div className="timeline-date"><strong>{selectedDay ? (selectedDay === today ? "I dag" : formatDay(selectedDay, { weekday: "long" })) : "I dag"}</strong><span>{selectedDay && formatDay(selectedDay, { month: "long", day: "numeric", year: "numeric" })}</span></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {dayEntries.length ? (
        <div className="timeline-list">
          {dayEntries.map((entry) => (
            <div className="timeline-item" key={entry.id}>
              <div className={`timeline-icon ${entry.kind}`}>{entry.kind === "symptom" ? <Activity size={17} /> : entry.kind === "food" ? <UtensilsCrossed size={17} /> : <Waves size={17} />}</div>
              <div className="timeline-body">
                <div className="timeline-item-top"><span className="entry-type">{kindLabels[entry.kind]}</span><span className="entry-time">{new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", minute: "2-digit" }).format(new Date(entry.occurredAt))}</span></div>
                <p>{summarizeEntry(entry)}</p>
                {entry.payload.note && <div className="entry-note">{entry.payload.note}</div>}
              </div>
              <button className="delete-button" type="button" onClick={() => remove(entry.id)} disabled={deleting === entry.id} aria-label={`Slett ${kindLabels[entry.kind].toLowerCase()}`} title="Slett registrering"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-timeline"><div className="empty-icon"><Heart size={23} /></div><h3>Ingen registreringer denne dagen</h3><p>En kort symptomregistrering er en god start.</p><button type="button" onClick={onAddCheckin}>Registrer symptomer <ArrowRight size={15} /></button></div>
      )}
      <div className="timeline-footnote"><ShieldCheck size={15} /> Notatene dine vises bare i familiens private logg.</div>
    </section>
  );
}
