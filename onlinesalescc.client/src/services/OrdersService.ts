import { API_ENDPOINTS } from '../config/api.config';
import { OpenOrder, OpenOrderGrouped, OrdersGroupedAdditional, PaginatedResponse, AlternativeItem } from '../shared/types';

class OrdersService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  }

  async getOpenOrders(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<OpenOrder>> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.ORDERS}?page=${page}&pageSize=${pageSize}`);
    if (!response.ok) {
      throw new Error('Failed to fetch open orders');
    }
    return response.json();
  }

  async getOpenOrdersByArtikelNr(artikelNr: number): Promise<OpenOrder[]> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.ORDERS}/by-artikelnr/${artikelNr}`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders by artikel number');
    }
    return response.json();
  }

  async getGroupedOrders(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<OpenOrderGrouped>> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.ORDERS_GROUPED}?page=${page}&pageSize=${pageSize}`);
    if (!response.ok) {
      throw new Error('Failed to fetch grouped orders');
    }
    return response.json();
  }

  async getOrderAdditional(artikelNr: number): Promise<OrdersGroupedAdditional> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.ORDER_ADDITIONAL(artikelNr.toString())}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order additional data');
    }
    return response.json();
  }

  async updateOrderAdditional(artikelNr: number, data: Partial<OrdersGroupedAdditional>): Promise<OrdersGroupedAdditional> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.ORDER_ADDITIONAL(artikelNr.toString())}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update order additional data');
    }
    return response.json();
  }

  async getOrderDeliveryDate(artikelNr: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.ORDER_DELIVERY_DATE(artikelNr.toString())}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order delivery date');
    }
    return response.json();
  }

  async getOrderAlternatives(artikelNr: number): Promise<AlternativeItem[]> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.ORDER_ALTERNATIVES(artikelNr.toString())}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order alternatives');
    }
    return response.json();
  }
}

export const ordersService = new OrdersService(); 