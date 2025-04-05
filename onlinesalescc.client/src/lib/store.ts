import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type Ticket,
  type OpenOrder,
  type OpenOrderGrouped,
  type OrdersGroupedAdditional,
  type AlternativeItem
} from '@/shared/types';

/**
 * UI state store
 * 
 * This store maintains UI-specific state that needs to be persisted
 * across page refreshes, such as filter preferences and UI settings.
 * 
 * It no longer stores mock data - all data is fetched from the API.
 */
interface StoreState {
  // UI preferences
  sidebarCollapsed: boolean;
  selectedTheme: 'light' | 'dark' | 'system';
  tablePageSizes: Record<string, number>;

  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setTablePageSize: (tableId: string, pageSize: number) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Default UI state
      sidebarCollapsed: false,
      selectedTheme: 'system',
      tablePageSizes: {},

      // Actions for UI state
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),

      setTheme: (theme) => set(() => ({
        selectedTheme: theme
      })),

      setTablePageSize: (tableId, pageSize) => set((state) => ({
        tablePageSizes: {
          ...state.tablePageSizes,
          [tableId]: pageSize
        }
      }))
    }),
    {
      name: 'online-sales-ui-store'
    }
  )
);
