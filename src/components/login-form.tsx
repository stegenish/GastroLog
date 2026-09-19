"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loginAction } from "@/app/actions";
import { ArrowRight } from "lucide-react";
import { clearRememberedPassword, loadRememberedPassword, saveRememberedPassword } from "@/lib/remembered-password";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  const [remember, setRemember] = useState(true);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPassword = loadRememberedPassword();
    if (savedPassword && passwordRef.current) passwordRef.current.value = savedPassword;
  }, []);

  useEffect(() => {
    if (state.error === "Feil passord. Prøv igjen.") {
      clearRememberedPassword();
    }
  }, [state.error]);

  function handleSubmit() {
    if (remember) saveRememberedPassword(passwordRef.current?.value ?? "");
    else clearRememberedPassword();
  }

  return (
    <form action={action} className="login-form" onSubmit={handleSubmit}>
      <label htmlFor="password">Passord</label>
      <input ref={passwordRef} id="password" name="password" type="password" autoComplete="current-password" required autoFocus placeholder="Skriv inn passordet" />
      <label className="remember-password">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => {
            setRemember(event.target.checked);
            if (!event.target.checked) clearRememberedPassword();
          }}
        />
        Husk passordet på denne enheten
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Åpner…" : "Åpne loggen"}<ArrowRight size={17} />
      </button>
    </form>
  );
}
