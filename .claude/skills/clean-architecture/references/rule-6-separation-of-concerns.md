# Regola 6 — Separazione rigorosa delle responsabilità

## Idea centrale

Un tipo dovrebbe avere **una sola ragione per cambiare**. Quando un modello di business accumula responsabilità eterogenee — regole di dominio *e* persistenza *e* serializzazione *e* presentazione — diventa fragile: un cambiamento nel database costringe a toccare la stessa classe che contiene le regole di business. Sposta le responsabilità aggiuntive in tipi nuovi, e quando crescono in famiglie, in intere gerarchie isolate in namespace/package distinti.

Questa regola è il "tessuto connettivo": man mano che applichi le altre cinque, il numero di tipi cresce. La Regola 6 li tiene organizzati in modo che la crescita resti gestibile invece di trasformarsi in caos.

## Sintomi da segnalare

- Una classe di dominio con attributi di mapping ORM, metodi di serializzazione JSON, e logica di formattazione per la UI tutti insieme.
- "God object" / "manager" / "service" che fa di tutto (centinaia di righe, molti `using` non correlati).
- Una classe che cambia per ragioni scollegate tra loro nel tempo (la cronologia git mostra modifiche per motivi eterogenei).
- Logica di business mescolata con I/O (un metodo `CalculateTotal` che apre anche una connessione al DB e scrive un log).
- Tutto in un unico namespace piatto senza confini.

## Trasformazione

### Prima — un modello che fa troppo

```csharp
public class Invoice   // dominio + persistenza + serializzazione + presentazione
{
    public int Id { get; set; }
    public List<LineItem> Items { get; set; }

    public decimal CalculateTotal() => Items.Sum(i => i.Price);          // dominio

    public void SaveToDatabase(SqlConnection conn) { /* SQL inline */ }  // persistenza

    public string ToJson() => JsonSerializer.Serialize(this);           // serializzazione

    public string ToHtml() => $"<table>...{CalculateTotal():C}...</table>"; // presentazione
}
```

Ogni cambiamento di schema DB, di formato JSON o di markup HTML tocca la stessa classe che custodisce le regole di fatturazione. Quattro ragioni per cambiare in un tipo solo.

### Dopo — responsabilità separate in tipi e namespace distinti

```csharp
namespace Billing.Domain;   // SOLO regole di business, zero I/O
public sealed record Invoice(InvoiceId Id, IReadOnlyList<LineItem> Items)
{
    public Money Total() => Items.Aggregate(Money.Zero, (sum, i) => sum.Add(i.Price));
}

namespace Billing.Persistence;   // sa come salvare, non conosce le regole
public sealed class InvoiceRepository
{
    public Task SaveAsync(Invoice invoice) { /* mapping + SQL/EF qui */ }
    public Task<Invoice?> FindAsync(InvoiceId id) { /* ... */ }
}

namespace Billing.Presentation;   // sa come mostrare
public sealed class InvoiceHtmlRenderer
{
    public string Render(Invoice invoice) => /* HTML a partire dal dominio */;
}
```

Ora `Invoice` è puro dominio: non sa nulla di SQL né di HTML. Cambiare il database tocca solo `Persistence`; cambiare il formato di stampa tocca solo `Presentation`. Il dominio resta stabile, testabile in isolamento, e diventa il candidato ideale per i tipi immutabili e validati delle regole 1, 3 e 4.

## Come decidere dove tagliare

- **Per ragione di cambiamento**: se due pezzi di codice cambiano per motivi diversi e in momenti diversi, separali.
- **Per direzione delle dipendenze**: il dominio non deve dipendere da infrastruttura (DB, HTTP, framework UI). Le dipendenze puntano *verso* il dominio, non da esso verso l'esterno. (È il cuore di architetture come Hexagonal / Clean / Onion.)
- **Per vocabolario**: se in una classe convivono termini di mondi diversi (`SqlConnection` accanto a `TaxRate`), probabilmente convivono responsabilità diverse.

## Quando isolare in una gerarchia/namespace dedicato

Non basta una classe nuova quando una responsabilità cresce in una *famiglia* di tipi correlati. Esempio: la presentazione che inizialmente era un solo renderer HTML diventa HTML + PDF + email. A quel punto crea una gerarchia (`IInvoiceRenderer` con implementazioni — nota il legame con la Regola 2: varianti polimorfiche) dentro il suo namespace `Billing.Presentation`, con i suoi tipi di supporto. Il dominio non se ne accorge nemmeno.

## Cosa diventa impossibile (o almeno improbabile)

- Che un cambiamento allo schema DB rompa le regole di business.
- Testare le regole di dominio senza tirarsi dietro un database o un web server.
- Che un nuovo collaboratore mescoli logica di persistenza dentro il dominio (i namespace e le dipendenze lo scoraggiano).

## Casi limite e buon senso

- **Non over-engineerare in anticipo.** Per uno script o un dominio minuscolo, separare in quattro namespace è burocrazia inutile. Applica questa regola quando le responsabilità *iniziano davvero* a divergere o quando la classe supera una soglia di complessità percepibile. Tre righe non sono un God object.
- Separare non significa anemizzare: il dominio deve contenere *comportamento* (le regole), non essere un sacco di getter/setter con tutta la logica altrove (anti-pattern "anemic domain model"). Le regole di business stanno nel dominio; persistenza e presentazione sono ciò che si sposta fuori.
- Il confine giusto è quello che riduce il "blast radius" di un cambiamento. Se separare non riduce nulla, non separare.
