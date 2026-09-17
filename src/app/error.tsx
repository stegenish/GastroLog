"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="not-found-page">
      <div className="card not-found-card" role="alert">
        <span className="section-kicker">MAGELOGG</span>
        <h1>Noe gikk galt</h1>
        <p>Vi kunne ikke vise siden akkurat nå. Prøv igjen.</p>
        <button className="primary-button" type="button" onClick={reset}>Prøv igjen</button>
      </div>
    </main>
  );
}
