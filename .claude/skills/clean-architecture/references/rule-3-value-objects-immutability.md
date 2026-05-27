# Regola 3 — Value Object e immutabilità

## Idea centrale

Per i **valori** (cose definite da *cosa sono*, non da *quale istanza sono*), preferisci tipi immutabili con uguaglianza strutturale. In C# moderno: `record class` e `record struct`. Lo stato non si **modifica**: evolve creando **nuove** istanze.

L'immutabilità è ciò che rende l'invariante di classe (Regola 4) gratuita: se un oggetto è valido alla nascita e non può mutare, è valido per sempre. Tutta la complessità del "e se qualcuno cambia questo campo dopo?" sparisce.

## Identità vs valore

- **Value Object**: due `Money(10, "EUR")` sono *lo stesso* importo. Niente identità. → uguaglianza per valore, immutabile.
- **Entity**: due clienti con lo stesso nome sono persone diverse. Hanno identità (un Id). → l'identità conta, ma i loro *attributi* possono comunque essere Value Object immutabili.

Questa regola riguarda soprattutto i Value Object, ma "evolvere creando nuove istanze" si applica anche allo stato delle Entity (vedi sotto).

## Sintomi da segnalare

- `class` con setter pubblici (`public decimal Amount { get; set; }`) usata come valore.
- Metodi che mutano `this` (`order.Total += item.Price`).
- Uguaglianza per riferimento dove l'intento è confrontare valori (due oggetti "uguali" risultano diversi con `==`).
- `Equals`/`GetHashCode` scritti a mano e soggetti a errore.
- Liste/dizionari mutabili esposti pubblicamente (`public List<T> Items`).

## Trasformazione

### Prima

```csharp
public class Money
{
    public decimal Amount { get; set; }
    public string Currency { get; set; }

    public void Add(Money other)
    {
        if (other.Currency != Currency) throw new InvalidOperationException();
        Amount += other.Amount;   // muta this: chiunque tenga un riferimento è sorpreso
    }
}
```

Problemi: chiunque può scrivere `m.Amount = -999`; `Add` muta l'oggetto condiviso; due `Money` con stesso importo non sono `==`.

### Dopo

```csharp
public readonly record struct Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException(nameof(currency));
        Amount = amount;
        Currency = currency;
    }

    // l'operazione NON muta: restituisce un nuovo valore
    public Money Add(Money other)
    {
        if (other.Currency != Currency)
            throw new InvalidOperationException("Valute diverse");
        return new Money(Amount + other.Amount, Currency);
    }
}
```

`record` fornisce `Equals`/`GetHashCode`/`ToString` strutturali gratis. `Money(10,"EUR") == Money(10,"EUR")` è `true`. Nessuno può mutare un importo condiviso: `Add` produce un nuovo valore, lo stile è funzionale (lega con Regola 5).

### Evolvere lo stato con `with`

Quando devi cambiare un campo, non muti: crei una copia modificata.

```csharp
public sealed record Customer(CustomerId Id, Email Email, Address Address);

// "cambiare" indirizzo = nuovo Customer, l'originale resta intatto
Customer moved = customer with { Address = newAddress };
```

L'`Id` resta (è un'Entity con identità), ma ogni "modifica" è una nuova istanza. Il codice che teneva il vecchio `customer` non viene sorpreso da cambiamenti sotto i piedi.

## Collezioni immutabili

Non esporre `List<T>`. Esponi `IReadOnlyList<T>` o usa `ImmutableArray<T>`/`ImmutableList<T>`:

```csharp
public sealed record Order(IReadOnlyList<LineItem> Items)
{
    public Order AddItem(LineItem item) =>
        this with { Items = Items.Append(item).ToImmutableArray() };
}
```

## Cosa diventa impossibile

- Mutare un valore condiviso e sorprendere chi ne tiene un riferimento.
- Avere un `Money` in stato invalido dopo la costruzione (non c'è "dopo": è immutabile).
- Bug di uguaglianza per dimenticanza di `Equals`/`GetHashCode`.

## Casi limite e buon senso

- **`record struct` vs `record class`**: struct per valori piccoli e senza identità (no allocazione GC); class per oggetti più grandi o con identità. Usa `readonly record struct` per garantire l'immutabilità anche a livello struct.
- L'immutabilità ha un costo se crei moltissime copie in hot path molto stretti. In quei rari casi, misura prima di rinunciarci; spesso il costo è trascurabile e ne guadagni in correttezza.
- Attenzione all'immutabilità *superficiale*: un `record` che contiene una `List<T>` mutabile non è davvero immutabile. Usa tipi immutabili anche per i campi.
- Equivalenti: Kotlin `data class` + `copy()`; Python `@dataclass(frozen=True)`; TypeScript `readonly` + `Object.freeze` o librerie immutabili; Java `record`.
