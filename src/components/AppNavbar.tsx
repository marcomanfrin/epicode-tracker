import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppNavbarProps {
  actions?: ReactNode;
}

export const AppNavbar = ({ actions }: AppNavbarProps) => (
  <nav className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border-soft">
    <div className="container-editorial flex h-12 items-center justify-between gap-4">
      <NavLink
        to="/"
        end
        className="label-meta hover:text-foreground transition-colors"
        activeClassName="text-foreground"
      >
        Course Tracker
      </NavLink>

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

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        {actions}
      </div>
    </div>
  </nav>
);
