import React, { useState } from "react";
import { TicketsService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import type { Ticket } from "@/shared/types";

export default function TicketsApiTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any | null>(null);
  const [testTicketId, setTestTicketId] = useState<number | null>(null);

  // Test getting all tickets
  const testGetAllTickets = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const tickets = await TicketsService.getAllTickets();
      setResponse(tickets);
      console.log("All tickets:", tickets);
    } catch (err) {
      setError(`Error fetching tickets: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error fetching tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Test getting tickets by artikelNr
  const testGetTicketsByArtikelNr = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const artikelNr = 1234; // Use a valid artikelNr that exists in your system

    try {
      const tickets = await TicketsService.getTicketsByArtikelNr(artikelNr);
      setResponse(tickets);
      console.log(`Tickets for artikelNr ${artikelNr}:`, tickets);
    } catch (err) {
      setError(`Error fetching tickets by artikelNr: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Error fetching tickets by artikelNr ${artikelNr}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Test creating a ticket
  const testCreateTicket = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const newTicket = {
      artikelNr: 1234,  // Use a valid artikelNr 
      bestellNr: 5678,  // Use a valid bestellNr
      comment: "Test ticket created from API test page",
      byUser: "Test User",
      entrydate: new Date().toISOString()
    };

    try {
      const createdTicket = await TicketsService.createTicket(newTicket);
      setResponse(createdTicket);
      setTestTicketId(createdTicket.ticketId);
      console.log("Created ticket:", createdTicket);
    } catch (err) {
      setError(`Error creating ticket: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error creating ticket:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Test updating a ticket
  const testUpdateTicket = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    if (!testTicketId) {
      setError("Please create a ticket first to get an ID for update");
      setIsLoading(false);
      return;
    }

    const updates = {
      comment: "Updated test ticket " + new Date().toISOString()
    };

    try {
      const updatedTicket = await TicketsService.updateTicket(testTicketId, updates);
      setResponse(updatedTicket);
      console.log("Updated ticket:", updatedTicket);
    } catch (err) {
      setError(`Error updating ticket: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Error updating ticket ${testTicketId}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Test deleting a ticket
  const testDeleteTicket = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    if (!testTicketId) {
      setError("Please create a ticket first to get an ID for deletion");
      setIsLoading(false);
      return;
    }

    try {
      await TicketsService.deleteTicket(testTicketId);
      setResponse({ message: `Successfully deleted ticket ${testTicketId}` });
      setTestTicketId(null);
      console.log(`Deleted ticket ${testTicketId}`);
    } catch (err) {
      setError(`Error deleting ticket: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Error deleting ticket ${testTicketId}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">Tickets API Connection Test</h1>
      <p className="text-muted-foreground">
        Use this page to test the connection between the React frontend and .NET backend for the Tickets functionality.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>API Endpoint Tests</CardTitle>
            <CardFooter>
              Click the buttons below to test each API endpoint
            </CardFooter>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testGetAllTickets}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              GET /api/tickets (Get All Tickets)
            </Button>

            <Button
              onClick={testGetTicketsByArtikelNr}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              GET /api/tickets/1234 (Get by ArtikelNr)
            </Button>

            <Button
              onClick={testCreateTicket}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              POST /api/tickets (Create Ticket)
            </Button>

            <Button
              onClick={testUpdateTicket}
              disabled={isLoading || !testTicketId}
              variant="outline"
              className="w-full"
            >
              PATCH /api/tickets/{testTicketId || '{id}'} (Update Ticket)
            </Button>

            <Button
              onClick={testDeleteTicket}
              disabled={isLoading || !testTicketId}
              variant="outline"
              className="w-full"
            >
              DELETE /api/tickets/{testTicketId || '{id}'} (Delete Ticket)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardFooter>
              API response will appear here
            </CardFooter>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                <h3 className="font-semibold mb-2">Error</h3>
                <p>{error}</p>
              </div>
            ) : response ? (
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-semibold mb-2">Success</h3>
                <pre className="text-xs overflow-auto max-h-[400px]">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No API call has been made yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {testTicketId && (
        <div className="p-4 bg-primary/10 rounded-md">
          <span className="font-medium">Current test ticket ID:</span> {testTicketId}
        </div>
      )}
    </div>
  );
} 