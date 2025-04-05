
**Open Orders Grouped:
ArtikelNr(PK, int, not null),
Hrs(nvarchar, null),
Artikel(nvarchar, null),
WgrNo(nvarchar, null),
Anzahl(int, null),
Erstelldatum(int, not null),
Entrydate(datetime, null)
AnzahlTickets(int, not null)

**Open Orders: 
BestellNr(PK,bigint, not null)
Erstelldatum(datetime, null),
ArtikelNr(PK, int, not null),
Hrs(nvarchar, null),
Artikel(nvarchar, null),
WgrNo(varchar, null),
Anzahl(int, null)
BestellStatus(nvarchar, null)