# Regola 1 — Tutto è un oggetto

## Idea centrale

Ogni concetto del dominio merita un tipo. La validazione e la gestione dello stato di un concetto vivono **dentro** quel tipo, in un punto solo — non sparse nei chiamanti.

Il segnale diagnostico più affidabile: **la stessa validazione che compare in due o più punti.** Significa che esiste un concetto implicito che non ha ancora un tipo. La validazione duplicata è il "tipo mancante" che chiede di esistere.

## Sintomi da segnalare

- Tipi primitivi che trasportano significato di business: `string email`, `int quantity`, `decimal price`, `string customerId`. (È il *primitive obsession*.)
- La stessa `if (string.IsNullOrEmpty(...))` o `if (x < 0) throw` in più metodi.
- Logica che interpreta un primitivo ("se la stringa contiene '@' allora è valida") ripetuta lontano dal punto in cui il dato è nato.
- Metodi statici di utility (`EmailHelper.Validate(string)`) chiamati difensivamente prima di usare un valore.

## Trasformazione

### Prima

```csharp
public class CustomerService
{
    public void Register(string email, int age)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new ArgumentException("Email non valida");
        if (age < 0 || age > 150)
            throw new ArgumentException("Età non valida");
        // ...
    }

    public void SendNewsletter(string email)
    {
        // la stessa validazione, di nuovo, perché non ci si fida del chiamante
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new ArgumentException("Email non valida");
        // ...
    }
}
```

La validazione dell'email vive in due posti. Niente garantisce che ogni `string email` in giro per il codice sia davvero valida: ogni metodo deve diffidare.

### Dopo

```csharp
public readonly record struct Email
{
    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.Contains('@'))
            throw new ArgumentException("Email non valida", nameof(value));
        Value = value;
    }

    public override string ToString() => Value;
}

public readonly record struct Age
{
    public int Value { get; }

    public Age(int value)
    {
        if (value is < 0 or > 150)
            throw new ArgumentOutOfRangeException(nameof(value));
        Value = value;
    }
}
```

```csharp
public class CustomerService
{
    public void Register(Email email, Age age) { /* email e age sono già validi */ }
    public void SendNewsletter(Email email) { /* nessuna ri-validazione */ }
}
```

Ora **un `Email` non può esistere se non è valido.** La validazione è scritta una volta. Ogni metodo che riceve un `Email` può fidarsi senza controllare. La firma del metodo documenta il dominio: `Register(Email, Age)` dice più di `Register(string, int)`.

## Cosa diventa impossibile

- Passare una stringa qualsiasi dove serve un'email.
- Avere validazioni in disaccordo tra loro in punti diversi.
- Dimenticare la validazione in un nuovo chiamante (non compila senza costruire un `Email`).

## Casi limite e buon senso

- **Non incapsulare tutto.** Un `int` che è davvero solo un contatore tecnico non ha bisogno di un tipo. Crea un tipo quando il primitivo porta **regole** o **significato di dominio**.
- **`record struct` vs `record class`**: per piccoli valori senza identità preferisci `readonly record struct` (niente allocazione, semantica di valore). Per concetti più grandi o con identità, `record class`.
- Questa regola si appoggia alla Regola 4 (la validazione nel costruttore è la precondizione di costruzione) e alla Regola 3 (il tipo è immutabile, quindi non può diventare invalido dopo).
- In linguaggi senza struct dedicati: Kotlin `@JvmInline value class` / data class; TypeScript branded types o classi con costruttore privato + factory; Python `frozen dataclass` con `__post_init__`.
