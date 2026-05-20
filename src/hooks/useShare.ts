import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useShare = () => {
  const { user } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const buildShareUrl = (token: string) =>
    `${window.location.origin}/share/${token}`;

  const openShare = async () => {
    setShareOpen(true);
    if (!user || shareUrl) return;
    setShareLoading(true);
    const { data: existing } = await supabase
      .from("share_tokens")
      .select("token")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (existing?.token) {
      setShareUrl(buildShareUrl(existing.token));
      setShareLoading(false);
      return;
    }
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase
      .from("share_tokens")
      .insert({ user_id: user.id, token });
    if (error) toast.error("Errore: " + error.message);
    else setShareUrl(buildShareUrl(token));
    setShareLoading(false);
  };

  const regenerateShare = async () => {
    if (!user) return;
    setShareLoading(true);
    setCopied(false);
    await supabase.from("share_tokens").delete().eq("user_id", user.id);
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase
      .from("share_tokens")
      .insert({ user_id: user.id, token });
    if (error) toast.error("Errore: " + error.message);
    else setShareUrl(buildShareUrl(token));
    setShareLoading(false);
  };

  const revokeShare = async () => {
    if (!user) return;
    setShareLoading(true);
    await supabase.from("share_tokens").delete().eq("user_id", user.id);
    setShareUrl(null);
    setShareLoading(false);
    toast.success("Link revocato");
  };

  const copyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return {
    shareOpen,
    setShareOpen,
    shareUrl,
    shareLoading,
    copied,
    openShare,
    copyShare,
    regenerateShare,
    revokeShare,
  };
};
