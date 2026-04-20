import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Auth = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = mode === "login" ? "Accedi · Course Tracker" : "Registrati · Course Tracker";
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
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Errore");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center">
      <div className="container-editorial w-full">
        <div className="max-w-md mx-auto">
          <span className="label-meta">{mode === "login" ? "Accesso" : "Registrazione"}</span>
          <h1 className="font-serif text-5xl md:text-6xl leading-[0.95] tracking-tight mt-4">
            {mode === "login" ? (
              <>Bentornato<span className="italic text-primary">.</span></>
            ) : (
              <>Crea un <span className="italic text-primary">account</span>.</>
            )}
          </h1>
          <p className="mt-4 text-muted-foreground font-sans">
            I tuoi corsi resteranno privati e sincronizzati su tutti i tuoi dispositivi.
          </p>

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
            <div>
              <label className="label-meta block mb-2">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-foreground/30 focus:border-primary outline-none py-3 font-sans text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center bg-foreground text-background px-5 py-4 font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? "Attendi…" : mode === "login" ? "Accedi" : "Registrati"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-8 label-meta hover:text-primary transition-colors"
          >
            {mode === "login"
              ? "→ Non hai un account? Registrati"
              : "→ Hai già un account? Accedi"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default Auth;
