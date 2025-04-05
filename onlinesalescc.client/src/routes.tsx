import { lazy } from 'react';
import { Navigate } from 'wouter';

// Import the nav layout, responsible for showing the sidebar
import DashboardLayout from '@/layouts/DashboardLayout';

// Import page components
const Home = lazy(() => import('@/pages/home'));
const GroupedOrders = lazy(() => import('@/pages/open-orders'));
const AllOrders = lazy(() => import('@/pages/open-orders/AllOrdersPage'));
const OrderDetails = lazy(() => import('@/pages/order-details'));
const Tickets = lazy(() => import('@/pages/tickets'));
const NotFound = lazy(() => import('@/pages/not-found'));

// Define routes with the required layout wrappers
const routes = [
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Home />,
      },
      {
        path: 'grouped-orders',
        element: <GroupedOrders />,
      },
      {
        path: 'orders',
        element: <AllOrders />,
      },
      {
        path: 'order-details/:artikelNr',
        element: <OrderDetails />,
      },
      {
        path: 'tickets',
        element: <Tickets />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];

export default routes; 