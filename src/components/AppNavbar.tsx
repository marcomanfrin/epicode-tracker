import { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  LayoutGrid,
  LogOut,
  MoreVertical,
  Monitor,
  Moon,
  Share2,
  Sun,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AppNavbarProps {
  actions?: ReactNode;
  onShare?: () => void;
}

const tabs = [
  { to: "/", end: true, label: "Tracker", Icon: LayoutGrid },
  { to: "/calendar", end: false, label: "Calendario", Icon: CalendarDays },
  { to: "/libretto", end: false, label: "Libretto", Icon: BookOpen },
];

const themeOptions: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: "system", label: "Sistema", Icon: Monitor },
  { value: "light", label: "Chiaro", Icon: Sun },
  { value: "dark", label: "Scuro", Icon: Moon },
];

export const AppNavbar = ({ actions, onShare }: AppNavbarProps) => {
  const { signOut } = useAuth();
  const { mode, setMode } = useTheme();

  return (
    <nav className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border-soft">
      <div className="container-editorial flex h-12 items-center gap-2 sm:gap-4">
        {/* Desktop tabs (testo) */}
        <div className="hidden sm:flex items-center gap-0.5 bg-secondary/60 rounded p-0.5">
          {tabs.map(({ to, end, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="label-meta px-3 py-1 rounded transition-colors hover:bg-background/50 text-muted-foreground"
              activeClassName="bg-background text-foreground shadow-sm"
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile tabs (icone, riempiono lo spazio) */}
        <div className="flex sm:hidden flex-1 items-center gap-0.5 bg-secondary/60 rounded p-0.5">
          {tabs.map(({ to, end, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              title={label}
              className="flex-1 inline-flex items-center justify-center h-9 rounded transition-all text-muted-foreground hover:bg-background/50 hover:text-foreground"
              activeClassName="bg-background text-primary shadow-sm ring-1 ring-primary/20"
            >
              <Icon className="h-4 w-4" />
            </NavLink>
          ))}
        </div>

        <div className="hidden sm:block flex-1" />

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3">
          {actions}
          {onShare && (
            <button
              onClick={onShare}
              className="label-meta inline-flex items-center gap-1.5 hover:text-primary transition-colors"
              aria-label="Condividi"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Condividi</span>
            </button>
          )}
          <button
            onClick={signOut}
            className="label-meta inline-flex items-center gap-1.5 hover:text-primary transition-colors"
            aria-label="Esci"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Esci</span>
          </button>
          <ThemeToggle />
        </div>

        {/* Mobile actions menu */}
        <div className="flex sm:hidden items-center gap-1">
          {actions}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Altre opzioni"
              className="inline-flex items-center justify-center h-8 w-8 rounded border border-border-soft text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {onShare && (
                <DropdownMenuItem onSelect={() => onShare()}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Condividi
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Esci
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="label-meta text-muted-foreground">
                Tema
              </DropdownMenuLabel>
              {themeOptions.map(({ value, label, Icon }) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => setMode(value)}
                  className={cn(mode === value && "bg-secondary text-foreground")}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
