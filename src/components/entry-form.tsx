"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowRight, Check, CircleHelp, Clock3, Plus, UtensilsCrossed, Waves } from "lucide-react";
import { createEntryAction } from "@/app/actions";
import { dateKey, entryTimeForSubmission, localDateTime, localDateTimeOnDay } from "@/lib/dates";
import { bowelLabels, bowelTypes, foodCategories, mealLabels, mealTypes, severityLabels, severityLevels, symptomLabels, type Entry, type Severity } from "@/lib/entries";

type Tab = Entry["kind"];

function SeverityRow({ name, label, value, onChange }: { name: string; label: string; value: Severity; onChange: (value: Severity) => void }) {
  return (
    <div className="severity-row">
      <span className="field-label">{label}</span>
      <div className="severity-options" role="radiogroup" aria-label={label}>
        {severityLevels.map((level) => (
          <label className={`severity-option ${value === level ? `selected severity-${level}` : ""}`} key={level}>
            <input type="radio" name={name} value={level} checked={value === level} onChange={() => onChange(level)} />
            {severityLabels[level]}
          </label>
        ))}
      </div>
    </div>
  );
}

function OptionalNote({ placeholder }: { placeholder: string }) {
  return <details className="optional-details meal-optional"><summary><CircleHelp size={16} /> Valgfritt notat</summary><div className="optional-content"><textarea name="note" maxLength={500} rows={2} placeholder={placeholder} /></div></details>;
}

export function EntryForm({ tab, initialDay, onTabChange, onSaved }: {
  tab: Tab;
  initialDay?: string;
  onTabChange: (tab: Tab) => void;
  onSaved: (day: string) => void;
}) {
  const [pain, setPain] = useState<Severity>("none");
  const [nausea, setNausea] = useState<Severity>("none");
  const [headache, setHeadache] = useState<Severity>("none");
  const [when, setWhen] = useState("");
  const [timeTouched, setTimeTouched] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const refreshTime = () => {
      if (timeTouched) return;
      const now = new Date();
      setWhen(initialDay ? localDateTimeOnDay(initialDay, now) : localDateTime(now));
    };
    const frame = requestAnimationFrame(refreshTime);
    const timer = setInterval(refreshTime, 60_000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, [initialDay, timeTouched]);

  function chooseTab(next: Tab) {
    onTabChange(next);
    setMessage("");
    setError("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const effectiveWhen = entryTimeForSubmission(when, timeTouched, initialDay, new Date());
    const date = new Date(effectiveWhen);
    if (!when || Number.isNaN(date.getTime())) {
      setError("Velg gyldig dato og klokkeslett.");
      return;
    }
    formData.set("occurredAt", date.toISOString());
    setPending(true);
    try {
      const result = await createEntryAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(tab === "symptom" ? "Symptomer lagret." : tab === "meal" ? "Måltid lagret." : "Avføring lagret.");
      setPain("none");
      setNausea("none");
      setHeadache("none");
      setFormVersion((value) => value + 1);
      setWhen(initialDay ? localDateTimeOnDay(initialDay, new Date()) : localDateTime(new Date()));
      setTimeTouched(false);
      onSaved(dateKey(date));
    } catch {
      setError("Kunne ikke lagre registreringen. Prøv igjen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card entry-card" aria-labelledby="new-entry-title">
      <div className="card-heading">
        <div className="heading-icon mint"><Plus size={20} strokeWidth={2.5} /></div>
        <div><span className="section-kicker">LEGG TIL I LOGGEN</span><h2 id="new-entry-title">Ny registrering</h2></div>
      </div>
      <p className="card-description">Start med det viktigste. Legg til detaljer når det er nyttig.</p>
      <div className="entry-tabs" role="tablist" aria-label="Type registrering">
        <button type="button" role="tab" aria-selected={tab === "symptom"} className={tab === "symptom" ? "active" : ""} onClick={() => chooseTab("symptom")}><Activity size={16} /> Symptomer</button>
        <button type="button" role="tab" aria-selected={tab === "meal"} className={tab === "meal" ? "active" : ""} onClick={() => chooseTab("meal")}><UtensilsCrossed size={16} /> Måltid</button>
        <button type="button" role="tab" aria-selected={tab === "bowel"} className={tab === "bowel" ? "active" : ""} onClick={() => chooseTab("bowel")}><Waves size={16} /> Avføring</button>
      </div>

      <form key={`${tab}-${formVersion}`} onSubmit={save} className="entry-form">
        <input type="hidden" name="kind" value={tab} />
        {tab === "symptom" && (
          <div className="form-section">
            <div className="form-intro"><h3>Hvordan har han det?</h3><p>Velg grad for hvert symptom, også når han ikke har det.</p></div>
            <SeverityRow name="pain" label={symptomLabels.pain} value={pain} onChange={setPain} />
            <SeverityRow name="nausea" label={symptomLabels.nausea} value={nausea} onChange={setNausea} />
            <SeverityRow name="headache" label={symptomLabels.headache} value={headache} onChange={setHeadache} />
            <details className="optional-details">
              <summary><CircleHelp size={16} /> Valgfrie detaljer <span>ved behov</span></summary>
              <div className="optional-content">
                <div className="check-row"><label><input name="vomited" type="checkbox" /> Kastet opp</label><label><input name="fever" type="checkbox" /> Feber</label></div>
                <label className="stacked-label" htmlFor="symptom-note">Noe annet?</label>
                <textarea id="symptom-note" name="note" maxLength={500} rows={2} placeholder="For eksempel hvor det gjorde vondt eller hva som hjalp" />
              </div>
            </details>
          </div>
        )}

        {tab === "meal" && (
          <div className="form-section">
            <div className="form-intro"><h3>Hva spiste han?</h3><p>Matvaregrupper er nok. Du trenger ikke føre hver ingrediens.</p></div>
            <span className="field-label block-label">Måltid</span>
            <div className="pill-options" role="radiogroup" aria-label="Måltid">
              {mealTypes.map((type, index) => <label key={type} className="pill-option"><input name="mealType" type="radio" value={type} defaultChecked={index === 0} /><span>{mealLabels[type]}</span></label>)}
            </div>
            <span className="field-label block-label category-label">Matvaregrupper <span className="muted">(velg alle som passer)</span></span>
            <div className="food-grid" role="group" aria-label="Matvaregrupper">
              {foodCategories.map((category) => <label key={category.value} className="food-option"><input name="categories" type="checkbox" value={category.value} /><span className="food-check"><Check size={13} /></span>{category.label}</label>)}
            </div>
            <OptionalNote placeholder="For eksempel en matvare du vil huske" />
          </div>
        )}

        {tab === "bowel" && (
          <div className="form-section">
            <div className="form-intro"><h3>Avføring</h3><p>En enkel registrering kan gi nyttig sammenheng.</p></div>
            <span className="field-label block-label">Hvordan var den?</span>
            <div className="bowel-options" role="radiogroup" aria-label="Type avføring">
              {bowelTypes.map((type) => <label key={type} className="bowel-option"><input name="bowelType" type="radio" value={type} /><span className="radio-circle" /><span>{bowelLabels[type]}</span></label>)}
            </div>
            <OptionalNote placeholder="Noe du vil huske?" />
          </div>
        )}

        <div className="form-bottom">
          <label className="time-label" htmlFor="occurred-at"><Clock3 size={16} /> Når?</label>
          <input id="occurred-at" type="datetime-local" value={when} onChange={(event) => { setWhen(event.target.value); setTimeTouched(true); }} required />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status"><Check size={15} /> {message}</p>}
        <button className="primary-button save-button" type="submit" disabled={pending || !when}>
          {pending ? "Lagrer…" : tab === "symptom" ? "Lagre symptomer" : tab === "meal" ? "Lagre måltid" : "Lagre avføring"}<ArrowRight size={18} />
        </button>
      </form>
    </section>
  );
}
