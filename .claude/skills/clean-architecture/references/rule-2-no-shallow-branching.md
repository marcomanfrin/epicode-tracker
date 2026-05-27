# Regola 2 — Niente branching superficiale

## Idea centrale

Un `switch` o una catena di `if/else` che dirama sullo **stato** o sul **tipo** di un oggetto è polimorfismo scritto a mano, peggio. Ogni volta che si aggiunge una variante, bisogna trovare e aggiornare *tutti* gli switch sparsi — e si finisce per dimenticarne uno. Sostituendo il branching con varianti di tipo (sottoclassi o gerarchia chiusa), ogni variante porta con sé il proprio comportamento e il chiamante torna lineare.

Regola pratica: **se dirami sullo stesso discriminante in più di un posto, è polimorfismo mascherato.**

## Sintomi da segnalare

- `switch (order.Status)` o `if (shape.Kind == ...)` ripetuti in metodi diversi.
- Un campo `enum Kind` / `type` letto per decidere il comportamento.
- Branch che lanciano `default: throw new InvalidOperationException("stato non gestito")` — segnale che il compilatore non sta aiutando a coprire i casi.
- Metodi pieni di `if (this.isClosed) { ... } else if (this.isPending) { ... }`.

## Trasformazione

### Prima

```csharp
public enum ShapeKind { Circle, Rectangle }

public class Shape
{
    public ShapeKind Kind { get; set; }
    public double Radius { get; set; }      // usato solo se Circle
    public double Width { get; set; }       // usati solo se Rectangle
    public double Height { get; set; }

    public double Area() => Kind switch
    {
        ShapeKind.Circle => Math.PI * Radius * Radius,
        ShapeKind.Rectangle => Width * Height,
        _ => throw new InvalidOperationException()
    };

    public double Perimeter() => Kind switch   // STESSO switch, di nuovo
    {
        ShapeKind.Circle => 2 * Math.PI * Radius,
        ShapeKind.Rectangle => 2 * (Width + Height),
        _ => throw new InvalidOperationException()
    };
}
```

Note: campi che hanno senso solo in alcuni stati (`Radius` è spazzatura quando `Kind == Rectangle`), e lo stesso switch duplicato. Aggiungere un `Triangle` significa modificare ogni metodo.

### Dopo — polimorfismo per ereditarietà

```csharp
public abstract class Shape
{
    public abstract double Area();
    public abstract double Perimeter();
}

public sealed class Circle : Shape
{
    private readonly double _radius;
    public Circle(double radius) => _radius = radius;   // R4: nasce con tutto ciò che serve
    public override double Area() => Math.PI * _radius * _radius;
    public override double Perimeter() => 2 * Math.PI * _radius;
}

public sealed class Rectangle : Shape
{
    private readonly double _width, _height;
    public Rectangle(double width, double height) => (_width, _height) = (width, height);
    public override double Area() => _width * _height;
    public override double Perimeter() => 2 * (_width + _height);
}
```

Il chiamante non dirama mai: `shape.Area()` funziona e basta. `Circle` non ha campi `Width`/`Height` insensati. Aggiungere `Triangle` è una classe nuova, zero modifiche al codice esistente.

### Variante C# moderna — gerarchia chiusa + pattern matching esaustivo

Quando il comportamento vive *fuori* dai tipi (es. in un renderer separato — vedi Regola 6) e vuoi che il compilatore controlli l'esaustività:

```csharp
public abstract record Shape;
public sealed record Circle(double Radius) : Shape;
public sealed record Rectangle(double Width, double Height) : Shape;

// Pattern matching: il compilatore avvisa se manca un caso quando la gerarchia è sealed
public static double Area(Shape shape) => shape switch
{
    Circle c => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.Width * r.Height,
    _ => throw new ArgumentOutOfRangeException(nameof(shape))
};
```

Questa forma è una *discriminated union*. È accettabile quando il branching è centralizzato in un posto solo e logicamente non appartiene al tipo. Se lo stesso switch si ripete, torna alla soluzione con metodi virtuali.

## Stato → tipi (il caso macchina a stati)

Il caso più frequente: un oggetto di business con uno stato che evolve (`Draft → Submitted → Approved`). Spesso modellato con `enum Status` + branching. Se le transizioni e i dati disponibili cambiano con lo stato, modella ogni stato come un tipo:

```csharp
public abstract record Order;
public sealed record DraftOrder(IReadOnlyList<LineItem> Items) : Order
{
    public SubmittedOrder Submit() => new(Items, DateTime.UtcNow); // transizione = nuovo tipo (R3)
}
public sealed record SubmittedOrder(IReadOnlyList<LineItem> Items, DateTime SubmittedAt) : Order
{
    public ApprovedOrder Approve(Approver by) => new(Items, SubmittedAt, by);
}
public sealed record ApprovedOrder(IReadOnlyList<LineItem> Items, DateTime SubmittedAt, Approver ApprovedBy) : Order;
```

Ora `Approve()` esiste solo su `SubmittedOrder`: non puoi approvare una bozza, è un **errore di compilazione**, non un check a runtime. Questo è il legame diretto con la Regola 4 (eliminare i flag) e con il dominio dell'utente (es. la transizione `SCHEDULED → IN_PROGRESS → CLOSED → INVOICED`).

## Cosa diventa impossibile

- Dimenticare di gestire una variante in uno dei tanti switch (non ci sono più switch sparsi).
- Accedere a un campo che non ha senso nello stato corrente.
- Invocare un'operazione non valida per lo stato corrente (non compila).

## Casi limite e buon senso

- Il branching su valori che **non** sono varianti di un oggetto (es. parsing di input esterno, dispatch su codice HTTP) va benissimo. La regola riguarda il diramare sullo stato/tipo del *proprio* dominio.
- Non creare una gerarchia per due casi che non divergeranno mai. La polimorfizzazione paga quando le varianti hanno comportamento divergente *e* tendono a crescere.
- Equivalenti: Kotlin `sealed class` + `when` esaustivo; TypeScript discriminated unions; Rust `enum` + `match`.
