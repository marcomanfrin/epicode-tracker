# Regola 5 — Sfrutta i tipi monadici

## Idea centrale

I tipi monadici — `IEnumerable<T>`, `Task<T>`, `Nullable<T>` / `Option<T>`, `Result<T>` — incapsulano un "contesto" (una sequenza, un calcolo asincrono, un'eventuale assenza, un possibile errore) e offrono operazioni per **comporre** trasformazioni senza srotolare il contesto a mano. Il risultato è codice OO con uno **stampo funzionale**: si compone con `Select`/`Where`/`Bind`/`await` invece di diramare con `if` e mutare accumulatori.

Il filo conduttore con le altre regole: la Regola 2 elimina il branching sullo *stato del dominio*; la Regola 5 elimina il branching sul *flusso di controllo* (assenza, errori, iterazione).

## Sintomi da segnalare

- Loop `for`/`foreach` con accumulatore mutabile dove un `Select`/`Where`/`Aggregate` sarebbe più chiaro.
- Catene di null check (`if (a != null) { if (a.B != null) { ... } }`) — il "pyramid of doom".
- Restituire `null` per segnalare "non trovato" e poi controllare null ovunque.
- Eccezioni usate per il flusso di controllo normale (es. "utente non trovato").
- Codice asincrono gestito con callback annidati o `.Result`/`.Wait()` invece di comporre `Task` con `await`.

## Trasformazioni

### Sequenze: da loop imperativo a LINQ

#### Prima
```csharp
var result = new List<string>();
foreach (var o in orders)
{
    if (o.Total > 100)
        result.Add(o.CustomerName.ToUpper());
}
```

#### Dopo
```csharp
var result = orders
    .Where(o => o.Total > 100)
    .Select(o => o.CustomerName.ToUpper())
    .ToList();
```

Niente accumulatore mutabile, niente branching: la pipeline dichiara *cosa* vuoi, non *come* iterare. `IEnumerable<T>` è il "monade lista": `Select` è `map`, `SelectMany` è `bind`.

### Assenza: da null a Nullable/Option

Il punto debole di `null` è che non è visibile nel tipo: `Customer Find(id)` non dice che può non trovare nulla. Rendi l'assenza esplicita nel tipo.

Con nullable reference types abilitati, il minimo è dichiararlo:
```csharp
public Customer? Find(CustomerId id);   // il '?' costringe il chiamante a gestire l'assenza
```

Per comporre senza piramidi di if, un tipo `Option<T>` con `Map`/`Bind` rende l'assenza propagabile:

```csharp
// invece di: if (a != null) { var b = a.GetB(); if (b != null) { return b.Name; } } return "?";
string name = FindCustomer(id)
    .Map(c => c.PrimaryAddress)
    .Map(a => a.City)
    .GetValueOrDefault("sconosciuta");
```

Ogni `Map` si applica solo se il valore è presente; l'assenza si propaga da sola. Nessun branching esplicito.

### Errori: da eccezioni-come-flusso a Result

Quando "fallire" è un esito normale del dominio (validazione, risorsa non trovata), modellalo con un tipo invece di lanciare:

```csharp
public abstract record Result<T>;
public sealed record Ok<T>(T Value) : Result<T>;
public sealed record Err<T>(string Error) : Result<T>;

// composizione: Bind concatena operazioni che possono fallire, l'errore corto-circuita
Result<Receipt> outcome =
    ParseAmount(input)               // Result<Money>
        .Bind(amount => Charge(card, amount))    // Result<Transaction>
        .Map(tx => new Receipt(tx));             // Result<Receipt>
```

Il flusso "felice" è una pipeline lineare; il primo errore corto-circuita e si propaga. Niente `try/catch` annidati, niente branching su codici di ritorno. (Esistono librerie consolidate come `LanguageExt` o `CSharpFunctionalExtensions` se non vuoi scrivere `Result` a mano.)

### Async: componi i Task, non bloccarli

#### Prima
```csharp
var user = GetUserAsync(id).Result;          // blocca, rischio deadlock
var orders = GetOrdersAsync(user.Id).Result;
```

#### Dopo
```csharp
var user = await GetUserAsync(id);
var orders = await GetOrdersAsync(user.Id);
// o, per parallelizzare operazioni indipendenti:
var (a, b) = (await Task.WhenAll(GetA(), GetB())) switch { var r => (r[0], r[1]) };
```

`Task<T>` è il monade dell'asincronia; `await` è lo zucchero che lo compone. Non bloccare mai con `.Result`/`.Wait()`.

## Cosa diventa impossibile

- Dimenticare di gestire l'assenza (con `?`/`Option` il tipo lo impone).
- Mutare un accumulatore in modo errato a metà loop.
- Propagare silenziosamente un errore: con `Result` deve essere gestito o passato avanti esplicitamente.
- Deadlock da blocco sincrono di codice async.

## Casi limite e buon senso

- LINQ è elegante ma valuta in modo *lazy* e può nascondere costi (query ripetute, N+1 su `IQueryable`). Materializza con `ToList()` quando serve, e attenzione alle pipeline su `IQueryable` verso il DB.
- Non incatenare 15 operatori in una sola espressione illeggibile: la composizione deve *aumentare* la chiarezza, non fare sfoggio. Spezza in variabili con nomi parlanti quando aiuta.
- `Option`/`Result` fatti in casa vanno bene per progetti piccoli; per progetti seri valuta una libreria matura.
- Equivalenti concettuali: Java `Optional`/`Stream`/`CompletableFuture`; Kotlin sequence/`?.`/coroutine; Rust `Option`/`Result`/iterator; TypeScript array methods/`Promise`.
