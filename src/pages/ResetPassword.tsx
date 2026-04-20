import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Reimposta password · Course Tracker";
    // Supabase parses the recovery token from the URL hash automatically
    // and emits a PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Fallback: if a session already exists from the recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La password deve avere almeno 6 caratteri.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password aggiornata.");
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center">
      <div className="container-editorial w-full">
        <div className="max-w-md mx-auto">
          <span className="label-meta">Recupero</span>
          <h1 className="font-serif text-5xl md:text-6xl leading-[0.95] tracking-tight mt-4">
            Nuova <span className="italic text-primary">password</span>.
          </h1>
          <p className="mt-4 text-muted-foreground font-sans">
            {ready
              ? "Imposta una nuova password per il tuo account."
              : "Apri il link che hai ricevuto via email per continuare."}
          </p>

          {ready && (
            <form onSubmit={submit} className="mt-10 space-y-6">
              <div>
                <label className="label-meta block mb-2">Nuova password</label>
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
                {busy ? "Attendi…" : "Aggiorna password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
