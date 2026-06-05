import { useLocation, useOutlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const ROUTES = ["/", "/calendar", "/libretto"];

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const [animClass, setAnimClass] = useState("animate-page-fade");
  const [renderKey, setRenderKey] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    const prevIdx = ROUTES.indexOf(prevPath.current);
    const nextIdx = ROUTES.indexOf(location.pathname);
    let cls = "animate-page-fade";
    if (prevIdx !== -1 && nextIdx !== -1) {
      cls = nextIdx > prevIdx ? "animate-page-from-right" : "animate-page-from-left";
    }
    setAnimClass(cls);
    setRenderKey(location.pathname);
    prevPath.current = location.pathname;
  }, [location.pathname]);

  return (
    <div key={renderKey} className={animClass}>
      {children}
    </div>
  );
};
