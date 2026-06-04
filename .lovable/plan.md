# Migliorie UX — Tracker, Calendario, Libretto

Focus richiesto: **navigazione mobile** + **estetica generale**. Nessuna modifica alla logica di business o al backend.

## Problemi rilevati

**Navigazione mobile**
- Nessun accesso rapido al "ritorno a oggi" nel Calendario su mobile; cursor si perde facilmente.
- Calendario: switch vista (mese/settimana/giorno) non è visibile su mobile in modo compatto.
- Tracker mobile: numeri fatto/caricato sono separati su tre colonne piccole, difficili da tappare per modificarli; manca un riepilogo "sticky" in cima.
- Libretto mobile: form "aggiungi esame" è in fondo a una pagina lunga; serve un FAB / scorciatoia.
- Manca un indicatore di pagina attiva forte sulla nav (icone già ci sono, ma serve un underline/active state più chiaro).

**Estetica**
- Le sezioni "STATS" del Libretto sono celle grigie squadrate poco respirate; tipografia value/label poco differenziata.
- Hero su mobile occupa molto spazio (text-5xl + paragrafo lungo) prima di vedere il contenuto utile — collassare su mobile.
- Tracker chart: header su mobile va a capo male, legenda densa.
- Calendar header (mese + frecce + view switcher + bottoni) si comprime male sotto 400px.
- Dark "add" section: bordi sottili input poco contrastati, label minuscole.
- Mancano micro-transizioni hover/active coerenti (alcune sì, altre no).

## Cosa farò

### 1. Navbar — affinare active state mobile
- Aggiungere etichetta testuale sotto l'icona attiva (icona + label corta solo sull'attivo); restanti restano icona pura.
- Active state: pill con `bg-background` più ombra leggera + bordo colore primary sotto.

### 2. Tracker (Index) — mobile
- Hero ridotto su mobile (text-4xl, paragrafo nascosto o accorciato sotto 640px).
- Riepilogo totali spostato in alto in un blocco "summary card" sticky sotto la navbar (Fatto / Caricato / Da caricare / Totale) — sempre visibile durante lo scroll.
- Chart: header con label-meta + titolo più piccolo su mobile, legenda in grid 2 colonne.
- Form "Aggiungi corso": rendere il pulsante "+" un FAB galleggiante mobile (in basso a destra) che scorre alla sezione dark.

### 3. Calendario — mobile
- Header: layout a 2 righe su mobile (riga 1: ‹ mese ›, riga 2: switcher vista compatto a icone + "oggi").
- Switcher vista: usare segmented control a icone (Mese/Settimana/Giorno = quadretti/lista/punto).
- Bottone "oggi" sempre presente quando cursor != today.
- Cells mese: aumentare leggermente altezza minima e padding tap.
- Legenda colori materie collassabile (accordion) per non rubare spazio.

### 4. Libretto — mobile
- Hero ridotto su mobile (come Tracker).
- STATS: trasformare la griglia di 4 celle in 2 card più ariose con tipografia editorial (numero grande serif, label uppercase piccola). Su mobile resta 2x2 ma con più padding.
- Chart: aggiungere "media ponderata" come linea di riferimento orizzontale tratteggiata.
- FAB "+" mobile per scorrere al form.
- Cronologia mobile: tap sulla riga apre dettaglio (data completa + nome corso); attualmente il cestino è l'unica azione.

### 5. Polish trasversale
- Transizioni coerenti: `transition-colors duration-150` ovunque manchi; hover sulle righe corso/esame con `bg-secondary/40`.
- Focus ring uniforme (`focus-visible:ring-2 focus-visible:ring-primary`) su tutti gli input/button custom.
- Spaziature verticali ridotte del 20–30% su mobile (`py-10` → `py-6 md:py-10`).
- Skeleton al posto di "Caricamento…" testuale su Tracker/Libretto.
- `safe-area-inset-bottom` sui FAB per dispositivi con notch/home bar.

## Dettagli tecnici

**File modificati**
- `src/components/AppNavbar.tsx` — active state mobile.
- `src/pages/Index.tsx` — hero responsive, summary sticky, FAB, chart header, skeleton.
- `src/pages/Calendar.tsx` — header 2 righe mobile, segmented control vista, bottone "oggi", legenda collassabile.
- `src/pages/Libretto.tsx` — hero responsive, STATS ridisegnate, chart con linea media, FAB, riga cronologia tappabile, skeleton.
- `src/index.css` — eventuali utility per safe-area e transizioni standard.

**Nessuna modifica a**: `src/lib/libretto.ts`, hooks, schema DB, edge functions, routing.

**Approccio**: edit chirurgici sui file pagina, riuso dei token semantici esistenti (`--primary`, `--accent`, `--border-soft`, `--surface-dark`), nessun nuovo design token salvo necessità.

Procedo in build mode con questi cambiamenti.