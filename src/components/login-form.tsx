"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";
import { ArrowRight } from "lucide-react";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  return (
    <form action={action} className="login-form">
      <label htmlFor="password">Passord</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus placeholder="Skriv inn passordet" />
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Åpner…" : "Åpne loggen"}<ArrowRight size={17} />
      </button>
    </form>
  );
}
