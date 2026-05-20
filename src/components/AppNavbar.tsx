import { ReactNode } from "react";
import { LogOut, Share2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface AppNavbarProps {
  actions?: ReactNode;
  onShare?: () => void;
}

export const AppNavbar = ({ actions, onShare }: AppNavbarProps) => {
  const { signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border-soft">
      <div className="container-editorial flex h-12 items-center gap-4">
        <div className="flex items-center gap-0.5 bg-secondary/60 rounded p-0.5">
          <NavLink
            to="/"
            end
            className="label-meta px-3 py-1 rounded transition-colors hover:bg-background/50 text-muted-foreground"
            activeClassName="bg-background text-foreground shadow-sm"
          >
            Tracker
          </NavLink>
          <NavLink
            to="/calendar"
            className="label-meta px-3 py-1 rounded transition-colors hover:bg-background/50 text-muted-foreground"
            activeClassName="bg-background text-foreground shadow-sm"
          >
            Calendario
          </NavLink>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 sm:gap-3">
          {actions}
          {onShare && (
            <button
              onClick={onShare}
              className="label-meta inline-flex items-center gap-1.5 hover:text-primary transition-colors"
              aria-label="Condividi"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Condividi</span>
            </button>
          )}
          <button
            onClick={signOut}
            className="label-meta inline-flex items-center gap-1.5 hover:text-primary transition-colors"
            aria-label="Esci"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Esci</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};
