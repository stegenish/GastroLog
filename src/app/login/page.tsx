import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { Activity, Heart, LockKeyhole } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");
  return (
    <main className="login-shell">
      <div className="login-illustration" aria-hidden="true">
        <div className="login-mark"><Activity size={34} strokeWidth={2.2} /></div>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="login-art-copy">
          <span className="eyebrow light">LITT MER OVERSIKT, DAG FOR DAG</span>
          <h1>Små notater.<br />Bedre oversikt.</h1>
          <p>Samle det viktigste på ett sted, med en enkel registrering om gangen.</p>
        </div>
      </div>
      <div className="login-panel">
        <div className="brand"><span className="brand-icon"><Heart size={19} fill="currentColor" /></span> Magelogg</div>
        <div className="login-content">
          <div className="login-lock"><LockKeyhole size={23} /></div>
          <span className="eyebrow">FAMILIENS PRIVATE LOGG</span>
          <h2>Velkommen tilbake</h2>
          <p>Skriv inn familiens passord for å åpne loggen.</p>
          <LoginForm />
          <div className="privacy-note"><LockKeyhole size={15} /> Registreringene er bare synlige etter innlogging.</div>
        </div>
        <p className="login-footer">For de små detaljene som kan bety noe.</p>
      </div>
    </main>
  );
}
