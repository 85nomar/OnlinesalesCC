using System;
using System.Collections.Generic;

namespace OnlinesalesCC.Server.Models;

public partial class OrderTicket
{
    public int TicketId         { get; set; }
    public int? ArtikelNr       { get; set; }
    public string? Comment      { get; set; }
    public string? ByUser       { get; set; }
    public DateTime? Entrydate  { get; set; }
    public long? BestellNr      { get; set; }
}
