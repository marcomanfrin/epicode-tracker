---
name: clean-architecture
description: Guida la progettazione e il refactoring di codice orientato agli oggetti verso un'architettura "imbarazzantemente semplice", spostando i controlli al momento della costruzione ed eliminando codice difensivo e flag booleani. Usa questa skill ogni volta che scrivi, generi, riveli o fai refactoring di codice OO (specialmente C#/.NET, ma i principi valgono anche per Java, Kotlin, TypeScript) e noti: flag booleani che codificano stato (isActive, isClosed, hasBeen...), catene di if/else o switch che diramano sullo stato di un oggetto, validazione sparsa in più metodi, oggetti mutabili con setter, controlli null ripetuti, o classi che accumulano troppe responsabilità. Attivala anche quando l'utente chiede di "semplificare", "ripulire", "rendere più robusto", "togliere i bug di stato", modellare una macchina a stati, o progettare un dominio di business. Falla scattare anche se l'utente non nomina esplicitamente questi termini ma il codice mostra i sintomi descritti.
---

# Clean Architecture

## Filosofia

L'obiettivo è rendere gli stati illegali **non rappresentabili**. La maggior parte del codice difensivo (controlli null, validazioni ripetute, `if (!isReady) throw...`) esiste perché il tipo permette di costruire oggetti in stati invalidi e poi spera di intercettarli a runtime. Se invece l'oggetto **non può nascere invalido** e **non può transitare in stati incoerenti**, quel codice difensivo sparisce e il flusso di controllo diventa lineare. Da qui "imbarazzantemente semplice": non perché il problema sia banale, ma perché la soluzione finale sembra ovvia una volta che i tipi fanno il lavoro.

Il principio guida: **sposta i controlli dal runtime al momento della costruzione, e dalla logica sparsa al sistema di tipi.**

Questa skill non è un dogma da applicare meccanicamente. È un insieme di lenti attraverso cui leggere il codice. Quando applichi una regola, spiega *perché* migliora questo codice specifico — non recitare la regola.

## Come usare questa skill

Quando **generi** codice nuovo, applica le regole proattivamente: progetta i tipi in modo che l'invariante sia garantita dalla costruzione.

Quando **analizzi o fai refactoring** di codice esistente:
1. Scansiona i sintomi (vedi sotto). Ogni sintomo è un puntatore a una regola.
2. Segnala il problema con un nome e una riga concreta, non in astratto.
3. Proponi la trasformazione mostrando il *prima* e il *dopo*, e di' cosa diventa impossibile dopo la modifica.
4. Non riscrivere tutto a forza. Se una regola non si applica bene qui, dillo. Il giudizio conta più della copertura.

## Tabella dei sintomi → regola

Usa questa come prima passata diagnostica:

| Sintomo nel codice | Regola | File di riferimento |
|---|---|---|
| Validazione (`if x < 0 throw`) ripetuta in più punti; logica di stato sparsa fuori dal tipo | Regola 1 | `references/rule-1-everything-is-an-object.md` |
| `switch`/`if-else` lunghi che diramano sul "tipo" o sullo stato di un oggetto | Regola 2 | `references/rule-2-no-shallow-branching.md` |
| `class` mutabile con setter pubblici; metodi che modificano `this`; uguaglianza per riferimento dove serve per valore | Regola 3 | `references/rule-3-value-objects-immutability.md` |
| Flag booleani (`isClosed`, `isInitialized`); controlli null difensivi; oggetti che possono esistere "a metà" | Regola 4 | `references/rule-4-design-by-contract.md` |
| Loop imperativi con accumulatori; null check a catena; codice async/collezioni gestiti a mano invece che composti | Regola 5 | `references/rule-5-monadic-types.md` |
| Una classe che fa troppe cose (persistenza + business + presentazione); "God object" | Regola 6 | `references/rule-6-separation-of-concerns.md` |

Leggi il file di riferimento corrispondente prima di proporre una trasformazione non banale: contiene gli esempi prima/dopo dettagliati e i casi limite.

## Le sei regole (sintesi operativa)

### Regola 1 — Tutto è un oggetto
Ogni concetto di business ha un tipo dedicato che incapsula la propria validazione e il proprio stato. Non lasciare che un'email viaggi come `string`, una quantità come `int`, uno stato come `bool`. Se trovi la stessa validazione in due punti, è il segnale che manca un tipo. La validazione vive nel costruttore del tipo, una volta sola.

### Regola 2 — Niente branching superficiale
Un `switch` sullo stato di un oggetto è polimorfismo scritto a mano. Quando le diramazioni si moltiplicano per gestire varianti di un oggetto, dividi la classe in sottotipi (ereditarietà o, in C# moderno, una gerarchia `sealed` / pattern matching su record). Ogni variante implementa il proprio comportamento; il chiamante torna a essere lineare.

### Regola 3 — Value Object e immutabilità
Per i valori, preferisci `record class` / `record struct` (C#): immutabili, uguaglianza strutturale per default. Lo stato non si modifica: evolve creando **nuove** istanze (`with` expressions in C#). Niente setter sui Value Object.

### Regola 4 — Design by Contract e invarianti di classe
Ogni oggetto nasce valido (validazione nel costruttore = **precondizione di costruzione**) e resta valido (**invariante di classe**: una condizione booleana vera al termine di ogni operazione pubblica). Usa precondizioni sui parametri e postcondizioni sui risultati per rendere i contratti espliciti. L'invariante garantita dalla costruzione è ciò che permette di cancellare i flag booleani e i null check.

### Regola 5 — Tipi monadici
Favorisci tipi componibili: `IEnumerable<T>` (con LINQ invece di loop imperativi), `Task<T>` (composizione async), `Nullable<T>` / un tipo `Option`/`Result` per l'assenza e gli errori. Il risultato è codice OO con uno stampo funzionale: si compone con `Select`/`Where`/`Bind` invece di diramare e mutare.

### Regola 6 — Separazione rigorosa delle responsabilità
Quando un modello accumula responsabilità (persistenza, regole di business, serializzazione, presentazione), spostane alcune in tipi nuovi o intere gerarchie isolate in namespace/package distinti. Un tipo, una ragione per cambiare.

## Come si compongono le regole

Le regole non sono indipendenti — si rinforzano a vicenda, ed è questo che produce la semplicità finale:

- La **Regola 1** crea i tipi; la **Regola 4** garantisce che quei tipi nascano validi; insieme rendono superflui i null check e le validazioni difensive sparse.
- La **Regola 3** (immutabilità) rende l'invariante della **Regola 4** banale da mantenere: se l'oggetto non muta, l'invariante vera alla costruzione resta vera per sempre.
- La **Regola 2** elimina il branching sullo *stato*; la **Regola 5** elimina il branching sul *controllo di flusso* (null, errori, sequenze).
- La **Regola 6** tiene tutto questo organizzato man mano che il sistema cresce.

Quando proponi un refactoring importante, prova a mostrare questa catena: spesso introdurre un tipo (R1) reso immutabile (R3) con validazione nel costruttore (R4) cancella in un colpo solo decine di righe di branching difensivo (R2/R5).

## Tono e modo di intervenire

- Sii concreto: cita righe, nomi di variabili, nomi di metodi reali del codice davanti a te.
- Mostra sempre il *prima* e il *dopo* per le trasformazioni non ovvie.
- Dichiara cosa diventa **impossibile** dopo la modifica ("dopo questo refactoring, non si può più costruire un `Order` senza almeno una riga"). È la prova che il controllo si è spostato dal runtime ai tipi.
- Se l'utente lavora in un linguaggio diverso da C#, traduci i meccanismi (record → data class Kotlin / frozen dataclass Python / readonly type TS; `with` → copy; pattern matching sealed → sealed interface/discriminated union) ma mantieni i principi.
- Non essere fanatico. Se applicare una regola aggiunge complessità senza eliminare un rischio reale, dillo apertamente.
