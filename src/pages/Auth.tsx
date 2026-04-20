import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title =
      mode === "login"
        ? "Accedi · Course Tracker"
        : mode === "signup"
        ? "Registrati · Course Tracker"
        : "Recupera password · Course Tracker";
  }, [mode]);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account creato. Accesso in corso…");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Email di recupero inviata. Controlla la tua casella.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Errore");
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "login" ? (
      <>Bentornato<span className="italic text-primary">.</span></>
    ) : mode === "signup" ? (
      <>Crea un <span className="italic text-primary">account</span>.</>
    ) : (
      <>Password <span className="italic text-primary">dimenticata</span>?</>
    );

  const subtitle =
    mode === "forgot"
      ? "Inserisci la tua email: ti invieremo un link per reimpostare la password."
      : "I tuoi corsi resteranno privati e sincronizzati su tutti i tuoi dispositivi.";

  const cta =
    mode === "login" ? "Accedi" : mode === "signup" ? "Registrati" : "Invia link di recupero";

  const headerLabel =
    mode === "login" ? "Accesso" : mode === "signup" ? "Registrazione" : "Recupero";

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center">
      <div className="container-editorial w-full">
        <div className="max-w-md mx-auto">
          <span className="label-meta">{headerLabel}</span>
          <h1 className="font-serif text-5xl md:text-6xl leading-[0.95] tracking-tight mt-4">
            {title}
          </h1>
          <p className="mt-4 text-muted-foreground font-sans">{subtitle}</p>

          <form onSubmit={submit} className="mt-10 space-y-6">
            <div>
              <label className="label-meta block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-foreground/30 focus:border-primary outline-none py-3 font-sans text-lg"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="label-meta">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="label-meta hover:text-primary transition-colors"
                    >
                      Dimenticata?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-foreground/30 focus:border-primary outline-none py-3 font-sans text-lg"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center bg-foreground text-background px-5 py-4 font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? "Attendi…" : cta}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-2">
            {mode === "forgot" ? (
              <button
                onClick={() => setMode("login")}
                className="label-meta hover:text-primary transition-colors text-left"
              >
                ← Torna al login
              </button>
            ) : (
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="label-meta hover:text-primary transition-colors text-left"
              >
                {mode === "login"
                  ? "→ Non hai un account? Registrati"
                  : "→ Hai già un account? Accedi"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Auth;
