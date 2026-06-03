## Obiettivo
Su smartphone la navbar è troppo affollata: tab di navigazione + Condividi + Esci + Theme toggle stanno tutti sulla stessa riga. Riorganizzare per dare priorità alla navigazione e spostare le azioni secondarie in un menu.

## Modifiche

### 1. `src/components/AppNavbar.tsx`
Layout a due modalità:

**Mobile (< sm)**
- Tab di navigazione (Tracker / Calendario / Libretto) come **icone sole**, distribuite con `flex-1` per riempire la riga:
  - Tracker → `LayoutGrid`
  - Calendario → `CalendarDays`
  - Libretto → `BookOpen`
- A destra un singolo bottone **kebab** (`MoreVertical`) che apre un `DropdownMenu` shadcn contenente:
  - Cambia tema (item che chiama il toggle, mostra icona Sun/Moon corrente + etichetta "Tema chiaro/scuro")
  - Condividi (solo se `onShare` passato)
  - Esci
- `actions` (extra passati dalle pagine) restano visibili a sinistra del kebab se presenti, ma compattati.

**Desktop (≥ sm)**
- Layout attuale invariato: tab con etichetta testuale, Condividi/Esci con icona + testo, ThemeToggle separato a destra.

### 2. `src/components/NavLink.tsx` (se necessario)
Verificare che accetti children arbitrari; aggiungere prop opzionale `title` per tooltip sulle icone mobile. Probabilmente già ok.

### 3. `src/components/ThemeToggle.tsx`
Esporre anche una funzione/hook riutilizzabile (o leggere lo stato del tema) così il dropdown menu mobile può mostrare l'item "Passa a tema chiaro/scuro" e triggerare il toggle senza duplicare logica. Se il componente attuale incapsula tutto, estrarre la logica in un piccolo hook `useTheme()` interno o esportare un handler.

## Dettagli tecnici
- Usare `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` da `@/components/ui/dropdown-menu` (già parte di shadcn nel progetto).
- Mostrare gli elementi mobile con `sm:hidden` e quelli desktop con `hidden sm:flex` per evitare duplicazioni runtime e mantenere il markup leggibile.
- Tutte le icone con `aria-label` per accessibilità; sui tab icona aggiungere `title` con il nome della sezione.
- Mantenere stato attivo dei tab usando le stesse `activeClassName` ma applicate alle icone (background pill + colore foreground).
- Nessuna modifica alle pagine che usano `AppNavbar` (API `actions` / `onShare` invariate).

## Fuori scopo
- Animazioni elaborate o redesign visivo della navbar desktop.
- Modifiche al routing.
- Bottom navigation bar fissa (non richiesta esplicitamente; il kebab + icone risolvono la densità).