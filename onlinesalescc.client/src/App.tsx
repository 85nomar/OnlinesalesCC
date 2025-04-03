import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import DashboardLayout from "@/layouts/DashboardLayout";
import TicketsPage from "@/pages/tickets";
import OpenOrdersPage from "@/pages/open-orders";
import OrderDetailsPage from "@/pages/order-details";
import HomeDashboard from "@/pages/home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeDashboard} />
      <Route path="/dashboard" component={HomeDashboard} />
      <Route path="/tickets" component={TicketsPage} />
      <Route path="/open-orders" component={OpenOrdersPage} />
      <Route path="/order-details/:artikelNr" component={OrderDetailsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout>
        <Router />
      </DashboardLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
0