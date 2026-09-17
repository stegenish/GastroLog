"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowRight, Heart, LogOut, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { dateKey } from "@/lib/dates";
import type { Entry } from "@/lib/entries";
import { DailyTimeline } from "./daily-timeline";
import { EntryForm } from "./entry-form";
import { WeekOverview } from "./week-overview";

export function Dashboard({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [today, setToday] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [entryTab, setEntryTab] = useState<Entry["kind"]>("symptom");
  const [entryFormVersion, setEntryFormVersion] = useState(0);
  const [entryPrefillDay, setEntryPrefillDay] = useState<string | undefined>();

  useEffect(() => {
    let currentDay = dateKey(new Date());
    const frame = requestAnimationFrame(() => {
      setToday(currentDay);
      setSelectedDay(currentDay);
    });
    const timer = setInterval(() => {
      const nextDay = dateKey(new Date());
      if (nextDay === currentDay) return;
      setToday(nextDay);
      setSelectedDay((day) => day === currentDay ? nextDay : day);
      currentDay = nextDay;
    }, 60_000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, []);

  function addCheckin() {
    setEntryTab("symptom");
    setEntryPrefillDay(selectedDay || today);
    setEntryFormVersion((version) => version + 1);
    document.getElementById("new-entry-title")?.scrollIntoView({ behavior: "smooth" });
  }

  function saved(day: string) {
    setSelectedDay(day);
    router.refresh();
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand"><span className="brand-icon"><Heart size={19} fill="currentColor" /></span> Magelogg<span className="brand-divider" /><span className="brand-subtitle">Familiens helselogg</span></div>
          <div className="header-actions">
            <span className="private-label"><ShieldCheck size={15} /> Privat logg</span>
            <form action={logoutAction}><button className="text-button" type="submit"><LogOut size={16} /> Logg ut</button></form>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="welcome-row">
          <div>
            <span className="eyebrow"><span className="eyebrow-dot" /> EN ENKEL MÅTE Å SE MØNSTRE PÅ</span>
            <h1>Én dag om gangen<span className="heading-period">.</span></h1>
            <p className="welcome-copy">Noter raskt hvordan han har det, hva han spiste og det som kan gi nyttig sammenheng.</p>
          </div>
          <a className="export-button" href="/export"><ArrowDownToLine size={17} /> Last ned til legen</a>
        </div>

        <WeekOverview entries={entries} today={today} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

        <div className="content-grid">
          <EntryForm key={entryFormVersion} tab={entryTab} initialDay={entryPrefillDay} onTabChange={setEntryTab} onSaved={saved} />
          <DailyTimeline entries={entries} today={today} selectedDay={selectedDay} onSelectDay={setSelectedDay} onAddCheckin={addCheckin} />
        </div>

        <footer className="site-footer"><span>Magelogg samler observasjoner, men kan ikke stille en diagnose.</span><a href="https://www.helsenorge.no/sykdom/barn/magesmerter-hos-barn-og-ungdom/" target="_blank" rel="noreferrer">Når bør du kontakte lege? <ArrowRight size={13} /></a></footer>
      </main>
    </div>
  );
}
