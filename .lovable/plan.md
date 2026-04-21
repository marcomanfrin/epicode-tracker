

## Obiettivo
Permettere che i campi numerici dei corsi (totale, caricato, fatto) accettino valori decimali inseriti manualmente, mantenendo i pulsanti `+` e `-` con incremento/decremento di 1.

## Modifiche

### Database
Nessuna modifica necessaria: i campi `totale`, `caricato`, `fatto` sono già `integer`. Verranno convertiti a `numeric` per supportare i decimali.

### Migrazione SQL
```sql
ALTER TABLE public.courses
  ALTER COLUMN totale TYPE numeric USING totale::numeric,
  ALTER COLUMN fatto TYPE numeric USING fatto::numeric,
  ALTER COLUMN caricato TYPE numeric USING caricato::numeric;

ALTER TABLE public.courses
  ALTER COLUMN totale SET DEFAULT 0,
  ALTER COLUMN fatto SET DEFAULT 0,
  ALTER COLUMN caricato SET DEFAULT 0;
```

### Frontend (`src/pages/Index.tsx`)

1. **Form "Nuovo corso"** (riga 134): sostituire `parseInt(newTot, 10)` con `parseFloat(newTot)`. Sull'input `<input type="number">` (riga 448) aggiungere `step="any"` e abbassare `min` a un valore compatibile (es. `min={0.01}`).

2. **Input numerici dello Stepper** nelle righe/card dei corsi: aggiungere `step="any"` all'attributo, e usare `parseFloat` invece di `parseInt` quando si legge `e.target.value`. In questo modo l'utente può digitare a mano valori come `2.5`.

3. **Pulsanti `+` / `−`**: NESSUNA modifica. Continuano a chiamare `update(id, key, +1)` / `update(id, key, -1)`, quindi l'incremento resta intero (1).

4. **Funzione `clamp`**: rimuovere eventuali arrotondamenti impliciti — già usa `Math.max`/`Math.min` che preservano i decimali, quindi nessuna modifica necessaria.

5. **Visualizzazione totali e grafico**: i valori vengono già mostrati così come sono. Per evitare numeri con tante cifre decimali nei totali sommati (es. `0.1 + 0.2 = 0.30000000000004`), arrotondare a 2 decimali nei `useMemo` dei totals con `Math.round(x * 100) / 100`.

6. **Asse Y del grafico**: rimuovere `allowDecimals={false}` (riga 382) per permettere tick decimali quando i valori lo richiedono.

## File modificati
- `src/pages/Index.tsx`
- nuova migrazione SQL per convertire le colonne in `numeric`

