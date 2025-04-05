# OnlinesalesCC ASP.NET Core API Endpoints

These endpoints are implemented in the ASP.NET Core backend. The frontend now exclusively uses these real API endpoints for all data operations, as all mock data has been completely removed from the codebase.

## Tickets Endpoints

- **GET /api/tickets** - Get all tickets
- **GET /api/tickets/:artikelNr** - Get tickets by article number
- **POST /api/tickets** - Create a new ticket
- **PATCH /api/tickets/:id** - Update an existing ticket
- **DELETE /api/tickets/:id** - Delete a ticket

## Open Orders Endpoints

- **GET /api/orders/grouped** - Get grouped orders
- **GET /api/orders** - Get all open orders
- **GET /api/orders/by-itemnr/:artikelNr** - Get orders by article number
- **GET /api/orders/by-ordernr/:bestellNr** - Get orders by order number (IMPORTANT: Must use this exact format, NOT /api/orders/:bestellNr)

## Additional Order Data Endpoints

- **GET /api/orders/additional** - Get all additional order data
- **GET /api/orders/additional/:artikelNr** - Get additional data for a specific article
- **PATCH /api/orders/additional/:artikelNr/delivery-date** - Update delivery date
- **POST /api/orders/additional/:artikelNr/alternatives** - Add alternative item
- **DELETE /api/orders/additional/:artikelNr/alternatives/:altArtikelNr** - Remove alternative item

## Email Notification Endpoint

- **POST /api/notifications/email** - Send email notifications