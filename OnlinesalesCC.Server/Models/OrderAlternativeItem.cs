using System;

namespace OnlinesalesCC.Server.Models
{
  public partial class OrderAlternativeItem
  {
    public int Id { get; set; }
    public int OrderArtikelNr { get; set; }
    public int AlternativeArtikelNr { get; set; }
    public string AlternativeArtikel { get; set; } = string.Empty;
  }
}