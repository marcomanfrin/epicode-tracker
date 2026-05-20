## Obiettivo

Permettere di modificare un evento esistente nel calendario e di spostarlo in un altro giorno trascinandolo.

## Modifiche a `src/pages/Calendar.tsx`

### 1. Editing eventi
- Aggiungere icona "matita" accanto al cestino in `renderEntryCard` (visibile sia in day view che nel dialog del giorno).
- Cliccandola si entra in modalità edit inline per quell'evento: sostituisco l'header dell'event card con campi modificabili (tipo evento, materia se richiesta, etichetta, nota) — riuso gli stessi `Select`/`Input` di `renderAddForm`.
- Pulsanti "Salva" / "Annulla". Al salvataggio chiamo `supabase.from("calendar_entries").update({...}).eq("id", e.id)` e aggiorno lo stato `entries` localmente.
- Validazione: se il nuovo `kind` richiede materia, deve essere selezionata.

### 2. Drag & Drop tra giorni
- Aggiungere `draggable` alle pill renderizzate da `renderCellEntry` (month view) e ai bottoni eventi nella week view; `onDragStart` salva l'`entry.id` in `dataTransfer` + in uno stato `draggingId`.
- Rendere i contenitori-giorno (celle del mese e colonne della settimana) drop target: `onDragOver` (preventDefault + stile hover) e `onDrop` che:
  1. Legge l'id trascinato.
  2. Se la data target è diversa da quella corrente, fa `update({ date: newDate }).eq("id", id)`.
  3. Aggiorna lo stato `entries` localmente.
  4. Mostra toast di conferma/errore.
- Impedire che il drag start su una pill faccia partire il click che apre il dialog (gestire con flag `isDragging` o `e.stopPropagation` nell'onClick dopo drop).
- Day view: nessun drop target inter-giorno necessario (mostra un solo giorno).

### 3. Note tecniche
- Usare HTML5 DnD nativo (no librerie aggiuntive).
- Su mobile il DnD HTML5 non è supportato in modo affidabile: l'editing via matita garantisce comunque di poter cambiare giorno modificando il record. Eventuale supporto touch-DnD viene rimandato.
- Nessuna modifica DB necessaria (schema già adeguato).

## Verifica
- Drag di un evento da un giorno A a un giorno B in vista mese → l'evento sparisce da A, appare in B, persiste dopo refresh.
- Stesso test in vista settimana.
- Click matita → modifica tipo/materia/etichetta/nota → salva → cambiamenti visibili e persistenti.
