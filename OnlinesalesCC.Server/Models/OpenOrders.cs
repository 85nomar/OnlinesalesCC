using System;
using System.Collections.Generic;

namespace OnlinesalesCC.Server.Models
{
    public partial class OpenOrders
    {
        public long BestellNr { get; set; } // PK, bigint, not null (not int)
        public DateTime? Erstelldatum { get; set; } // datetime, null (not string)
        public int ArtikelNr { get; set; } // PK, int, not null
        public string? Hrs { get; set; } // nvarchar, null
        public string? Artikel { get; set; } // nvarchar, null
        public string? WgrNo { get; set; } // varchar, null (not int)
        public int? Anzahl { get; set; } // int, null
        public string? BestellStatus { get; set; } // nvarchar, null
    }
}