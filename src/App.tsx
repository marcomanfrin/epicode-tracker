import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { PageTransition } from "@/components/PageTransition";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Shared from "./pages/Shared.tsx";
import Calendar from "./pages/Calendar.tsx";
import Libretto from "./pages/Libretto.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const SwipeNav = () => {
  useSwipeNavigation();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SwipeNav />
          <PageTransition>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/share/:token" element={<Shared />} />
              <Route path="/calendar" element={<Protected><Calendar /></Protected>} />
              <Route path="/libretto" element={<Protected><Libretto /></Protected>} />
              <Route path="/" element={<Protected><Index /></Protected>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
