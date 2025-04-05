import { useState } from "react";
import { OrdersService, OrdersAdditionalService } from "@/services/orders.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/services/api";
import { API_ENDPOINTS } from "@/config/api.config";
import type { OpenOrder, OpenOrderGrouped, AlternativeItem } from "@/shared/types";

export default function ApiTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any | null>(null);

  // State for API parameters
  const [artikelNr, setArtikelNr] = useState(1234); // Default test article number
  const [emailRecipient, setEmailRecipient] = useState("test@example.com"); // Default test email
  const [alternativeArtikelNr, setAlternativeArtikelNr] = useState(5678); // Default alternative item number
  const [alternativeArtikel, setAlternativeArtikel] = useState("Alternative Test Item");
  const [newDeliveryDate, setNewDeliveryDate] = useState(new Date().toISOString().split('T')[0]); // Today's date in YYYY-MM-DD format

  // Orders endpoints

  const testGetAllOrders = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const orders = await OrdersService.getOpenOrders();
      setResponse(orders);
      console.log("All orders:", orders);
    } catch (err) {
      setError(`Error fetching orders: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetOrdersByArtikelNr = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const orders = await OrdersService.getOpenOrdersByArtikelNr(artikelNr);
      setResponse(orders);
      console.log(`Orders for artikelNr ${artikelNr}:`, orders);
    } catch (err) {
      setError(`Error fetching orders by artikelNr: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Error fetching orders by artikelNr ${artikelNr}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetGroupedOrders = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const orders = await OrdersService.getOpenOrdersGrouped();
      setResponse(orders);
      console.log("Grouped orders:", orders);
    } catch (err) {
      setError(`Error fetching grouped orders: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error fetching grouped orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Additional Order Data endpoints

  const testGetAllAdditionalData = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await OrdersAdditionalService.getOrdersGroupedAdditional();
      setResponse(data);
      console.log("All additional data:", data);
    } catch (err) {
      setError(`Error fetching additional data: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error fetching additional data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetAdditionalDataByArtikelNr = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await OrdersAdditionalService.getOrderAdditionalByArtikelNr(artikelNr);
      setResponse(data);
      console.log(`Additional data for artikelNr ${artikelNr}:`, data);
    } catch (err) {
      setError(`Error fetching additional data by artikelNr: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Error fetching additional data by artikelNr ${artikelNr}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdateDeliveryDate = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      await OrdersAdditionalService.updateDeliveryDate(artikelNr, newDeliveryDate);
      setResponse({
        success: true,
        message: `Updated delivery date for artikelNr ${artikelNr} to ${newDeliveryDate}`
      });
      console.log(`Updated delivery date for artikelNr ${artikelNr} to ${newDeliveryDate}`);
    } catch (err) {
      setError(`Error updating delivery date: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Error updating delivery date for artikelNr ${artikelNr}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const testAddAlternativeItem = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const alternativeItem: AlternativeItem = {
      orderArtikelNr: artikelNr,
      alternativeArtikelNr: alternativeArtikelNr,
      alternativeArtikel: alternativeArtikel,
      artikelNr: alternativeArtikelNr,
      artikel: alternativeArtikel
    };

    try {
      await OrdersAdditionalService.addAlternativeItem(artikelNr, alternativeItem);
      setResponse({
        success: true,
        message: `Added alternative item for artikelNr ${artikelNr}: ${alternativeArtikelNr} (${alternativeArtikel})`
      });
      console.log(`Added alternative item for artikelNr ${artikelNr}:`, alternativeItem);
    } catch (err) {
      setError(`Error adding alternative item: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Error adding alternative item for artikelNr ${artikelNr}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const testRemoveAlternativeItem = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      await OrdersAdditionalService.removeAlternativeItem(artikelNr, alternativeArtikelNr);
      setResponse({
        success: true,
        message: `Removed alternative item ${alternativeArtikelNr} from artikelNr ${artikelNr}`
      });
      console.log(`Removed alternative item ${alternativeArtikelNr} from artikelNr ${artikelNr}`);
    } catch (err) {
      setError(`Error removing alternative item: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Error removing alternative item for artikelNr ${artikelNr}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Email Notification endpoint

  const testSendEmailNotification = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const emailData = {
      recipient: emailRecipient,
      subject: "Test Notification",
      message: `This is a test notification sent at ${new Date().toISOString()}`,
      articleId: artikelNr
    };

    try {
      await apiClient.post<void>(API_ENDPOINTS.NOTIFICATIONS_EMAIL, emailData);
      setResponse({
        success: true,
        message: `Sent email notification to ${emailRecipient} regarding artikelNr ${artikelNr}`
      });
      console.log(`Sent email notification:`, emailData);
    } catch (err) {
      setError(`Error sending email notification: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Error sending email notification:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">API Connection Test</h1>
      <p className="text-muted-foreground">
        Use this page to test the connection between the React frontend and .NET backend for all API endpoints.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>API Parameters</CardTitle>
            <CardDescription>
              Set test parameters for API calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="artikelNr">Article Number</Label>
              <Input
                id="artikelNr"
                type="number"
                value={artikelNr}
                onChange={(e) => setArtikelNr(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternativeArtikelNr">Alternative Article Number</Label>
              <Input
                id="alternativeArtikelNr"
                type="number"
                value={alternativeArtikelNr}
                onChange={(e) => setAlternativeArtikelNr(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternativeArtikel">Alternative Article Name</Label>
              <Input
                id="alternativeArtikel"
                type="text"
                value={alternativeArtikel}
                onChange={(e) => setAlternativeArtikel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newDeliveryDate">New Delivery Date</Label>
              <Input
                id="newDeliveryDate"
                type="date"
                value={newDeliveryDate}
                onChange={(e) => setNewDeliveryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailRecipient">Email Recipient</Label>
              <Input
                id="emailRecipient"
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>
              API response will appear here
            </CardDescription>
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

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="ordersGrouped">Orders Grouped</TabsTrigger>
          <TabsTrigger value="additionalData">Additional Data</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders API Endpoints</CardTitle>
              <CardDescription>
                Test the Orders API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testGetAllOrders}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                GET /api/orders (Get All Orders)
              </Button>

              <Button
                onClick={testGetOrdersByArtikelNr}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                GET /api/orders/by-itemnr/{artikelNr} (Get by ArtikelNr)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordersGrouped" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Grouped Orders API Endpoints</CardTitle>
              <CardDescription>
                Test the Grouped Orders API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testGetGroupedOrders}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                GET /api/orders/grouped (Get Grouped Orders)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additionalData" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Order Data API Endpoints</CardTitle>
              <CardDescription>
                Test the Additional Order Data API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testGetAllAdditionalData}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                GET /api/orders/additional (Get All Additional Data)
              </Button>

              <Button
                onClick={testGetAdditionalDataByArtikelNr}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                GET /api/orders/additional/{artikelNr} (Get Additional Data by ArtikelNr)
              </Button>

              <Button
                onClick={testUpdateDeliveryDate}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                PATCH /api/orders/additional/{artikelNr}/delivery-date (Update Delivery Date)
              </Button>

              <Button
                onClick={testAddAlternativeItem}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                POST /api/orders/additional/{artikelNr}/alternatives (Add Alternative Item)
              </Button>

              <Button
                onClick={testRemoveAlternativeItem}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                DELETE /api/orders/additional/{artikelNr}/alternatives/{alternativeArtikelNr} (Remove Alternative Item)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notification API Endpoint</CardTitle>
              <CardDescription>
                Test the Email Notification API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testSendEmailNotification}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                POST /api/notifications/email (Send Email Notification)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 