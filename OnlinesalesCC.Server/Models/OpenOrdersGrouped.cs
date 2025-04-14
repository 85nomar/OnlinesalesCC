using System;
using System.Collections.Generic;

namespace OnlinesalesCC.Server.Models
{
    public partial class OpenOrdersGrouped
    {
        public int ArtikelNr { get; set; }  // PK, int, not null
        public string? Hrs { get; set; }     // nvarchar, null
        public string? Artikel { get; set; } // nvarchar, null
        public string? WgrNo { get; set; }   // nvarchar, null (not int)
        public int? Anzahl { get; set; }     // int, null
        public DateTime? Erstelldatum { get; set; } // datetime, null (not string)
        public DateTime? Entrydate { get; set; } // datetime, null
        public int AnzahlTickets { get; set; } // int, not null
    }
}