"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ArrowRight, Check, ChevronDown, Clock3, UtensilsCrossed, Waves } from "lucide-react";
import { createEntryAction } from "@/app/actions";
import { dateKey, entryTimeForSubmission, formatDay, localDateTime, localDateTimeOnDay, parseLocalDateTime } from "@/lib/dates";
import { bowelLabels, bowelTypes, durationLabels, impactLabels, locationLabels, foodCategories, severityLabels, severityLevels, symptomLabels, type Entry, type Severity } from "@/lib/entries";

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
  return <details className="optional-details"><summary><ChevronDown size={16} /> Valgfritt notat</summary><div className="optional-content"><label className="stacked-label" htmlFor="entry-note">Notat (valgfritt)</label><textarea id="entry-note" name="note" maxLength={500} rows={2} placeholder={placeholder} /></div></details>;
}

function OptionalChoice({ name, label, options }: { name: string; label: string; options: Record<string, string> }) {
  return <fieldset className="detail-choice"><legend>{label}</legend><div className="detail-options">
    <label><input type="radio" name={name} value="" defaultChecked /><span>Ikke registrert</span></label>
    {Object.entries(options).map(([value, text]) => <label key={value}><input type="radio" name={name} value={value} /><span>{text}</span></label>)}
  </div></fieldset>;
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
  const submitting = useRef(false);
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
    if (submitting.current) return;
    onTabChange(next);
    setMessage("");
    setError("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const effectiveWhen = entryTimeForSubmission(when, timeTouched, initialDay, new Date());
    const date = parseLocalDateTime(effectiveWhen);
    if (!date) {
      setError("Velg gyldig dato og klokkeslett.");
      return;
    }
    formData.set("occurredAt", date.toISOString());
    submitting.current = true;
    setPending(true);
    try {
      const result = await createEntryAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(tab === "symptom" ? "Symptomer lagret." : tab === "food" ? "Mat siste døgn lagret." : "Avføring lagret.");
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
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="card entry-card" aria-labelledby="new-entry-title">
      <div className="entry-heading"><h2 id="new-entry-title">{tab === "symptom" ? "Hvordan har han det?" : tab === "food" ? "Mat siste døgn" : "Avføring"}</h2><span className="entry-badge">{initialDay ? formatDay(initialDay, { day: "numeric", month: "short" }) : "Nå"}</span></div>
      <p className="card-description">{tab === "symptom" ? "Et par trykk er nok. Ingen tekst nødvendig." : "Velg det som passer. Notat er valgfritt."}</p>
      <div className="entry-tabs" role="tablist" aria-label="Type registrering">
        <button type="button" role="tab" aria-selected={tab === "symptom"} disabled={pending} className={tab === "symptom" ? "active" : ""} onClick={() => chooseTab("symptom")}><Activity size={16} /> Symptomer</button>
        <button type="button" role="tab" aria-selected={tab === "food"} disabled={pending} className={tab === "food" ? "active" : ""} onClick={() => chooseTab("food")}><UtensilsCrossed size={16} /> Mat siste døgn</button>
        <button type="button" role="tab" aria-selected={tab === "bowel"} disabled={pending} className={tab === "bowel" ? "active" : ""} onClick={() => chooseTab("bowel")}><Waves size={16} /> Avføring</button>
      </div>

      <form key={`${tab}-${formVersion}`} onSubmit={save} className="entry-form">
        <input type="hidden" name="kind" value={tab} />
        <fieldset className="entry-fields" disabled={pending}>
        {tab === "symptom" && (
          <div className="form-section">
            <p className="selection-hint">Velg graden av plager. Resten lagres som «Ingen».</p>
            <SeverityRow name="nausea" label={symptomLabels.nausea} value={nausea} onChange={setNausea} />
            <SeverityRow name="pain" label={symptomLabels.pain} value={pain} onChange={setPain} />
            <SeverityRow name="headache" label={symptomLabels.headache} value={headache} onChange={setHeadache} />
            <details className="optional-details">
              <summary><ChevronDown size={16} /> Legg til detaljer <span>valgfritt</span></summary>
              <div className="optional-content">
                <p className="detail-help">Bare hvis du vet. Ubesvarte detaljer står som ikke registrert.</p>
                <OptionalChoice name="duration" label="Hvor lenge har denne episoden vart så langt?" options={durationLabels} />
                <OptionalChoice name="impact" label="Hvordan påvirker plagene lek, skole eller aktivitet?" options={impactLabels} />
                <OptionalChoice name="location" label="Hvor gjør det vondt i magen?" options={locationLabels} />
                <div className="check-row"><label><input name="vomited" type="checkbox" /> Kastet opp</label><label><input name="fever" type="checkbox" /> Feber</label></div>
                <label className="stacked-label" htmlFor="symptom-note">Notat (valgfritt)</label>
                <textarea id="symptom-note" name="note" maxLength={500} rows={2} placeholder="For eksempel hvor det gjorde vondt eller hva som hjalp" />
              </div>
            </details>
          </div>
        )}

        {tab === "food" && (
          <div className="form-section">
            <div className="form-intro"><h3>Hva har han spist siste døgn?</h3><p>Velg gruppene som passer. Du kan legge til et notat hvis du vil.</p></div>
            <span className="field-label block-label">Matvaregrupper <span className="muted">(velg alle som passer)</span></span>
            <div className="food-grid" role="group" aria-label="Matvaregrupper">
              {foodCategories.map((category) => <label key={category.value} className="food-option"><input name="categories" type="checkbox" value={category.value} /><span className="food-check"><Check size={13} /></span>{category.label}</label>)}
            </div>
            <OptionalNote placeholder="Noe du vil huske?" />
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

        <details className="time-details">
          <summary><Clock3 size={16} /><span>{timeTouched && when ? `${formatDay(when.slice(0, 10), { day: "numeric", month: "short" })} kl. ${when.slice(11)}` : initialDay ? `${formatDay(initialDay, { day: "numeric", month: "long" })} · kl. ${when.slice(11)}` : "Registreres nå"}</span><span className="time-edit">Endre</span></summary>
          <div className="form-bottom">
          <label className="time-label" htmlFor="occurred-at"><Clock3 size={16} /> Når?</label>
          <input id="occurred-at" type="datetime-local" value={when} onChange={(event) => { setWhen(event.target.value); setTimeTouched(true); }} required />
          </div>
        </details>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status"><Check size={15} /> {message}</p>}
        <button className="primary-button save-button" type="submit" disabled={pending || !when}>
          {pending ? "Lagrer…" : tab === "symptom" ? "Lagre symptomer" : tab === "food" ? "Lagre mat siste døgn" : "Lagre avføring"}<ArrowRight size={18} />
        </button>
      </form>
    </section>
  );
}
