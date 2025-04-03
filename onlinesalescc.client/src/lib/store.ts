import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  mockBackendOpenOrdersGrouped, 
  mockBackendOpenOrders, 
  mockOrdersGroupedAdditional, 
  mockTickets 
} from './mockData';
import { 
  type Ticket, 
  type OpenOrdersGrouped, 
  type OpenOrders, 
  type OrdersGroupedAdditional,
  type AlternativeItem
} from './mockData';
import { generateUniqueId } from './utils';

interface StoreState {
  tickets: Ticket[];
  openOrdersGrouped: OpenOrdersGrouped[];
  openOrders: OpenOrders[];
  ordersGroupedAdditional: OrdersGroupedAdditional[];
  
  // Ticket operations
  addTicket: (ticket: Omit<Ticket, 'id' | 'ticketId'>) => void;
  updateTicket: (id: string, ticket: Partial<Omit<Ticket, 'id' | 'ticketId'>>) => void;
  deleteTicket: (id: string) => void;
  
  // Delivery date operations
  updateDeliveryDate: (artikelNr: number, newDate: string) => void;
  
  // Alternative items operations
  addAlternativeItem: (artikelNr: number, item: AlternativeItem) => void;
  removeAlternativeItem: (artikelNr: number, altArtikelNr: number) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      tickets: mockTickets,
      openOrdersGrouped: mockBackendOpenOrdersGrouped,
      openOrders: mockBackendOpenOrders,
      ordersGroupedAdditional: mockOrdersGroupedAdditional,
      
      addTicket: (newTicket) => set((state) => {
        const lastTicketId = Math.max(...state.tickets.map(t => t.ticketId), 1000);
        const ticket: Ticket = {
          ...newTicket,
          id: generateUniqueId(),
          ticketId: lastTicketId + 1
        };
        
        // Also update the AnzahlTickets count for the relevant grouped order
        const updatedGroupedOrders = state.openOrdersGrouped.map(order => {
          if (order.ArtikelNr === newTicket.artikelNr) {
            return {
              ...order,
              AnzahlTickets: order.AnzahlTickets + 1
            };
          }
          return order;
        });
        
        return {
          tickets: [...state.tickets, ticket],
          openOrdersGrouped: updatedGroupedOrders
        };
      }),
      
      updateTicket: (id, updatedTicket) => set((state) => ({
        tickets: state.tickets.map(ticket => 
          ticket.id === id ? { ...ticket, ...updatedTicket } : ticket
        )
      })),
      
      deleteTicket: (id) => set((state) => {
        const ticketToDelete = state.tickets.find(t => t.id === id);
        if (!ticketToDelete) return state;
        
        // Also update the AnzahlTickets count for the relevant grouped order
        const updatedGroupedOrders = state.openOrdersGrouped.map(order => {
          if (order.ArtikelNr === ticketToDelete.artikelNr) {
            return {
              ...order,
              AnzahlTickets: Math.max(0, order.AnzahlTickets - 1)
            };
          }
          return order;
        });
        
        return {
          tickets: state.tickets.filter(ticket => ticket.id !== id),
          openOrdersGrouped: updatedGroupedOrders
        };
      }),
      
      updateDeliveryDate: (artikelNr, newDate) => set((state) => {
        const existingAdditionalData = state.ordersGroupedAdditional.find(
          entry => entry.ArtikelNr === artikelNr
        );
        
        let updatedAdditionalData;
        
        if (existingAdditionalData) {
          // Update existing entry
          updatedAdditionalData = state.ordersGroupedAdditional.map(entry => {
            if (entry.ArtikelNr === artikelNr) {
              const originalDate = entry.originalDeliveryDate || 
                state.openOrdersGrouped.find(o => o.ArtikelNr === artikelNr)?.Erstelldatum || '';
              
              return {
                ...entry,
                newDeliveryDate: newDate,
                originalDeliveryDate: entry.originalDeliveryDate || originalDate
              };
            }
            return entry;
          });
        } else {
          // Create new entry
          const originalDate = state.openOrdersGrouped.find(o => o.ArtikelNr === artikelNr)?.Erstelldatum || '';
          
          updatedAdditionalData = [
            ...state.ordersGroupedAdditional,
            {
              ArtikelNr: artikelNr,
              newDeliveryDate: newDate,
              originalDeliveryDate: originalDate,
              alternativeItems: []
            }
          ];
        }
        
        return {
          ordersGroupedAdditional: updatedAdditionalData
        };
      }),
      
      addAlternativeItem: (artikelNr, item) => set((state) => {
        const existingAdditionalData = state.ordersGroupedAdditional.find(
          entry => entry.ArtikelNr === artikelNr
        );
        
        let updatedAdditionalData;
        
        if (existingAdditionalData) {
          // Update existing entry
          updatedAdditionalData = state.ordersGroupedAdditional.map(entry => {
            if (entry.ArtikelNr === artikelNr) {
              const currentAlternatives = entry.alternativeItems || [];
              const isAlreadyAdded = currentAlternatives.some(
                alt => alt.artikelNr === item.artikelNr
              );
              
              if (isAlreadyAdded) {
                return entry; // No change needed
              }
              
              return {
                ...entry,
                alternativeItems: [...currentAlternatives, item]
              };
            }
            return entry;
          });
        } else {
          // Create new entry
          updatedAdditionalData = [
            ...state.ordersGroupedAdditional,
            {
              ArtikelNr: artikelNr,
              alternativeItems: [item]
            }
          ];
        }
        
        return {
          ordersGroupedAdditional: updatedAdditionalData
        };
      }),
      
      removeAlternativeItem: (artikelNr, altArtikelNr) => set((state) => {
        const updatedAdditionalData = state.ordersGroupedAdditional.map(entry => {
          if (entry.ArtikelNr === artikelNr && entry.alternativeItems) {
            return {
              ...entry,
              alternativeItems: entry.alternativeItems.filter(
                item => item.artikelNr !== altArtikelNr
              )
            };
          }
          return entry;
        });
        
        return {
          ordersGroupedAdditional: updatedAdditionalData
        };
      }),
    }),
    {
      name: 'order-management-store'
    }
  )
);
