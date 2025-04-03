namespace OnlinesalesCC.Server.Models
{
    public class OpenOrders
    {
        public int BestellNr { get; set; }

        public DateTime Erstelldatum { get; set; }

        public int ArtikelNr { get; set; }

        public string? Hrs { get; set; }
        public string? Artikel { get; set; }

        public int? WgrNo { get; set; }

        public int Anzahl { get; set; }

        public string? BestellStatus { get; set; }
    }
}
