import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="card not-found-card">
        <span className="section-kicker">MAGELOGG</span>
        <h1>Fant ikke siden</h1>
        <p>Adressen kan være feil, eller siden kan ha blitt flyttet.</p>
        <Link className="primary-button" href="/">Gå til loggen</Link>
      </div>
    </main>
  );
}
