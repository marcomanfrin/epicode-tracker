## Navigazione swipe tra pagine

Aggiungere gesture swipe orizzontale (sinistra/destra) su mobile per navigare tra le 3 pagine principali nell'ordine: **Tracker → Calendario → Libretto**.

### Comportamento
- Swipe **sinistra** → pagina successiva (Tracker → Calendario → Libretto).
- Swipe **destra** → pagina precedente (Libretto → Calendario → Tracker).
- Solo su mobile/touch (≤ 768px); su desktop nessun effetto.
- Soglia: ~60px di spostamento orizzontale e angolo dominante orizzontale (deltaX > 1.5× deltaY) per evitare conflitti con lo scroll verticale.
- Ignorare swipe che partono da elementi interattivi orizzontali (calendario, eventuali carousel, input range) tramite `data-no-swipe` da applicare dove serve (per ora: contenitore mese Calendario).
- Nessuna animazione di transizione di pagina (mantiene navigazione istantanea come oggi); opzionale: piccolo feedback opacity sul body durante drag — da escludere per semplicità.

### Implementazione

**Nuovo file `src/hooks/useSwipeNavigation.ts`**
- Hook che registra `touchstart`/`touchmove`/`touchend` su `window`.
- Calcola delta, applica soglia e direzione, chiama `navigate(nextRoute)` di react-router.
- Determina prev/next dalla route corrente e dall'array `["/", "/calendar", "/libretto"]`.
- Skip se il target (o un suo antenato) ha `[data-no-swipe]` o è dentro `input/textarea/[contenteditable]`.
- Attivo solo se `window.matchMedia('(max-width: 767px)')` matcha.

**`src/App.tsx`**
- Montare il hook dentro un piccolo componente `<SwipeNav />` inserito sotto `<AuthProvider>` (così ha accesso a router + auth) — non naviga se utente non loggato o se la route corrente non è una delle 3 principali.

**`src/pages/Calendar.tsx`**
- Aggiungere `data-no-swipe` al contenitore della griglia calendario per evitare conflitti con eventuali gesture interne.

### File toccati
- nuovo: `src/hooks/useSwipeNavigation.ts`
- modificati: `src/App.tsx`, `src/pages/Calendar.tsx`

Nessuna nuova dipendenza (gesture nativa `touch*`, nessun pacchetto esterno).
