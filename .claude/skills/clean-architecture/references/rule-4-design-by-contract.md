# Regola 4 — Design by Contract e invarianti di classe

## Idea centrale

Ogni oggetto deve **nascere valido** e **restare valido**. Due meccanismi:

1. **Invariante di classe**: una condizione booleana che è vera al termine del costruttore e al termine di *ogni* metodo pubblico. È la promessa che il tipo fa su sé stesso ("un `BankAccount` ha sempre saldo ≥ 0").
2. **Contratti dei metodi**: **precondizioni** (cosa il metodo esige dai parametri e dallo stato per funzionare) e **postcondizioni** (cosa il metodo garantisce al ritorno).

L'invariante garantita dalla costruzione è il motore che **cancella i flag booleani e i null check difensivi**. Se un `Order` non può esistere senza almeno una riga, non serve `if (order.Items.Count == 0)` sparso ovunque: è impossibile per costruzione.

## Sintomi da segnalare

- Flag booleani che codificano stato: `isInitialized`, `isClosed`, `hasBeenValidated`, `isReady`. Quasi sempre indicano un oggetto che può esistere in uno stato "non ancora pronto".
- Null check difensivi ripetuti (`if (x == null) throw`) per parametri che il chiamante non dovrebbe mai poter passare null.
- Costruttori vuoti seguiti da `Initialize()` / `Setup()` da chiamare prima dell'uso ("two-step construction").
- Setter che, in combinazione, permettono stati incoerenti (`StartDate` dopo `EndDate`).
- Commenti tipo `// chiamare Connect() prima di Send()`.

## Trasformazione

### Prima — flag + two-step construction

```csharp
public class Report
{
    private bool _isFinalized;
    private List<string> _lines = new();

    public void AddLine(string line)
    {
        if (_isFinalized) throw new InvalidOperationException("Report già finalizzato");
        _lines.Add(line);
    }

    public void Finalize() => _isFinalized = true;

    public string Render()
    {
        if (!_isFinalized) throw new InvalidOperationException("Finalizzare prima");
        if (_lines.Count == 0) throw new InvalidOperationException("Report vuoto");
        return string.Join("\n", _lines);
    }
}
```

Il flag `_isFinalized` è controllato difensivamente in più metodi. Si può costruire un `Report` vuoto e non finalizzato, cioè in uno stato che non dovrebbe mai vedere la luce. Ogni metodo deve diffidare.

### Dopo — lo stato diventa tipo, l'invariante è garantita dalla costruzione

```csharp
// Una bozza accetta righe. Non può essere renderizzata: il metodo non esiste.
public sealed class DraftReport
{
    private readonly ImmutableList<string> _lines;
    public DraftReport() => _lines = ImmutableList<string>.Empty;
    private DraftReport(ImmutableList<string> lines) => _lines = lines;

    public DraftReport AddLine(string line)   // R3: nuova istanza
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(line);   // precondizione
        return new DraftReport(_lines.Add(line));
    }

    // Si può finalizzare SOLO se c'è almeno una riga: l'invariante di FinalReport
    // (non vuoto) è imposta qui, nel punto di transizione.
    public FinalReport Finalize()
    {
        if (_lines.IsEmpty)
            throw new InvalidOperationException("Non si finalizza un report vuoto");
        return new FinalReport(_lines);
    }
}

// Un FinalReport, per costruzione, ha sempre ≥1 riga ed è renderizzabile.
public sealed class FinalReport
{
    private readonly ImmutableList<string> _lines;

    internal FinalReport(ImmutableList<string> lines)
    {
        // invariante di classe, garantita una volta sola alla nascita
        if (lines.IsEmpty) throw new ArgumentException("Un FinalReport non può essere vuoto");
        _lines = lines;
    }

    public string Render() => string.Join("\n", _lines);   // nessun check: impossibile essere invalido
}
```

`Render()` non ha **nessun** check difensivo. Non gli serve: l'unico modo di avere un `FinalReport` è passare per `Finalize()`, che garantisce le precondizioni. Il flag booleano è sparito, sostituito da due tipi. Questo è il legame stretto con la Regola 2 (stato → tipi).

## Esprimere i contratti in C#

C# non ha più Code Contracts attivi di default, quindi i contratti si esprimono con:

- **Precondizioni sui parametri**: guard clause all'inizio del metodo. Helper moderni:
  ```csharp
  ArgumentNullException.ThrowIfNull(customer);
  ArgumentOutOfRangeException.ThrowIfNegative(amount);
  ArgumentException.ThrowIfNullOrWhiteSpace(name);
  ```
- **Invarianti / postcondizioni interne**: `Debug.Assert(condizione, "messaggio")` per asserzioni che documentano la logica e scattano in debug.
- **Nullability del compilatore**: abilita `<Nullable>enable</Nullable>`. Un parametro `Customer` (non `Customer?`) è una precondizione *imposta dal compilatore*: chi passa null riceve un warning. Questo elimina gran parte dei null check difensivi.
- **Documenta il contratto** in XML doc quando non è ovvio: `/// <exception>` per le precondizioni, una frase per la postcondizione.

## Il legame che cancella codice difensivo

La sequenza da mostrare quando applichi questa regola:

1. Sposta la validazione nel costruttore → l'oggetto **nasce valido** (precondizione di costruzione).
2. Rendi l'oggetto immutabile (R3) → resta valido (l'**invariante** non può essere violata dopo).
3. Quindi ogni metodo che riceve quel tipo **non deve più validarlo** → spariscono i null check, i flag, le guard ripetute.

Dichiara esplicitamente il guadagno: "Prima `Render` controllava 2 condizioni; dopo, 0. Le condizioni sono diventate impossibili da violare."

## Cosa diventa impossibile

- Costruire un oggetto in stato "non ancora pronto".
- Chiamare un'operazione fuori sequenza (l'operazione non esiste sul tipo sbagliato).
- Passare null dove non è ammesso (warning del compilatore con nullable abilitato).

## Casi limite e buon senso

- Le precondizioni sui **confini del sistema** (input utente, payload di rete, righe DB) sono validazione legittima, non difensività da eliminare: lì è il punto in cui costruisci i tipi validati.
- Non trasformare *ogni* sequenza in tipi distinti: fallo quando lo stato cambia *quali operazioni sono legali* o *quali dati sono presenti*. Se cambia solo un valore, basta l'immutabilità (R3).
- `Debug.Assert` non sostituisce la validazione degli input esterni: scatta solo in debug.
