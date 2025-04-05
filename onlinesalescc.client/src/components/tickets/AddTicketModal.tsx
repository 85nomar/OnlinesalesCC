import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ChevronDown, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DateFormatter from "@/components/DateFormatter";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import OrderTicketForm from './OrderTicketForm';

// UI components
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Types, schemas and services
import type { Ticket, OpenOrder, OpenOrderGrouped } from "@/shared/types";
import {
  ticketFormSchema,
  orderTicketFormSchema,
  type TicketFormValues,
  type OrderTicketFormValues
} from "@/lib/validationSchemas";
import { TicketsService } from "@/services/api";
import { OrdersService, orderCache } from "@/services/orders.service";

// Type aliases for backward compatibility (to match existing code)
type OpenOrders = OpenOrder;
type OpenOrdersGrouped = OpenOrderGrouped;

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  artikelNr?: number;
  bestellNr?: number;
  ticket?: Ticket | null;
}

// Read-only field component for edit mode
const ReadOnlyField = ({ label, value, prefix = "#" }: { label: string; value: string | number; prefix?: string }) => (
  <div className="mb-4">
    <div className="text-sm font-medium mb-1">{label}</div>
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="text-sm font-mono font-medium">{prefix}{value || ''}</div>
    </div>
  </div>
);

// Component to render a single order item with properly memoized DateFormatter
const OrderItem = React.memo(({
  order,
  onClick
}: {
  order: OpenOrders;
  onClick: () => void;
}) => {
  return (
    <div
      className="flex items-start justify-between p-2 text-sm hover:bg-muted rounded-sm cursor-pointer"
      onClick={onClick}
    >
      <div>
        <div className="font-medium">{order.BestellNr}</div>
        <div className="text-xs text-muted-foreground">
          <DateFormatter date={order.Erstelldatum} withTime={true} />
        </div>
      </div>
      <div className="text-xs px-1.5 py-0.5 rounded bg-muted/80">{order.BestellStatus}</div>
    </div>
  );
});

// Component to render a single order item with article info and properly memoized DateFormatter
const OrderItemWithArticle = React.memo(({
  order,
  onClick,
  index
}: {
  order: OpenOrders;
  onClick: () => void;
  index: number;
}) => {
  return (
    <div
      key={`order-${order.BestellNr}-${order.ArtikelNr}-${index}`}
      className="flex items-start justify-between p-2 text-sm hover:bg-muted rounded-sm cursor-pointer"
      onClick={onClick}
    >
      <div>
        <div className="font-medium">{order.BestellNr}</div>
        <div className="text-xs text-muted-foreground flex flex-col">
          <DateFormatter date={order.Erstelldatum} withTime={true} />
          <span>#{order.ArtikelNr} - {order.Artikel}</span>
        </div>
      </div>
      <div className="text-xs px-1.5 py-0.5 rounded bg-muted/80">{order.BestellStatus}</div>
    </div>
  );
});

export default function AddTicketModalWithErrorBoundary(props: AddTicketModalProps) {
  return (
    <ErrorBoundary
      fallback={<div className="p-4 bg-destructive/10 text-destructive rounded-md">
        Something went wrong loading the ticket form. Please try again or contact support.
      </div>}
    >
      <AddTicketModal {...props} />
    </ErrorBoundary>
  );
}

function AddTicketModal({
  isOpen,
  onClose,
  onSuccess,
  artikelNr,
  bestellNr,
  ticket
}: AddTicketModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for detecting clicks outside the dropdown
  const orderDropdownRef = useRef<HTMLDivElement>(null);
  const itemDropdownRef = useRef<HTMLDivElement>(null);

  // States for order dropdown
  // NOTE: We ensure orders is always an array through the safeSetOrders utility function
  // This prevents "orders.filter is not a function" errors by guaranteeing orders is always an array
  const [orders, setOrders] = useState<OpenOrders[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  // States for items dropdown
  const [items, setItems] = useState<OpenOrdersGrouped[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  // States for existing tickets
  const [existingTickets, setExistingTickets] = useState<Ticket[]>([]);
  const [isLoadingExistingTickets, setIsLoadingExistingTickets] = useState(false);
  const [showExistingTickets, setShowExistingTickets] = useState(false);

  // State to track if item field should be disabled (when order is selected)
  const [isItemFieldDisabled, setIsItemFieldDisabled] = useState(false);

  // Determine if we're in order-specific mode, generic mode, or edit mode
  const isOrderMode = !!artikelNr;
  const isEditMode = !!ticket;

  // Add a ref for debounce timer at the component level
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close order dropdown if clicked outside
      if (orderDropdownRef.current && !orderDropdownRef.current.contains(event.target as Node)) {
        setOrderDropdownOpen(false);
      }

      // Close item dropdown if clicked outside
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target as Node)) {
        setItemDropdownOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load initial data when the modal opens
  useEffect(() => {
    if (isOpen && !isEditMode) {
      // Load all orders for order number dropdown
      if (!isOrderMode) {
        loadAllOrders();
      }

      // Load grouped orders for item dropdown
      setIsLoadingItems(true);
      OrdersService.getOpenOrdersGrouped()
        .then((data) => {
          // Handle both response formats (array or paginated object)
          const itemsData = Array.isArray(data) ? data : data.items || [];
          setItems(itemsData);
        })
        .catch((error) => {
          console.error("Failed to fetch grouped orders:", error);
          setItems([]);
        })
        .finally(() => {
          setIsLoadingItems(false);
        });
    }
  }, [isOpen, isEditMode, isOrderMode]);

  // Add debug logging to check loaded orders
  useEffect(() => {
    console.log(`Orders loaded: ${orders.length} orders`);
    if (orders.length > 0) {
      const sampleOrders = orders.slice(0, 5);
      console.log('Sample orders:');
      sampleOrders.forEach(order => {
        console.log(`- Order #${order.BestellNr} (${typeof order.BestellNr}): Article ${order.ArtikelNr} - ${order.Artikel}`);
      });
    }
  }, [orders]);

  // Function to reset form values
  const resetFormValues = () => {
    genericForm.reset({
      artikelNr: 0,
      bestellNr: 0,
      comment: ""
    });
    orderForm.reset({
      orderNumber: "",
      comment: ""
    });
    setIsItemFieldDisabled(false);
    setOrders([]);
    setItems([]);
    setOrderDropdownOpen(false);
    setItemDropdownOpen(false);

    // Reset existing tickets state
    setExistingTickets([]);
    setShowExistingTickets(false);
  };

  // Initialize the generic ticket form
  const genericForm = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      artikelNr: ticket?.artikelNr || 0,
      bestellNr: ticket?.bestellNr || 0,
      comment: ticket?.comment || "",
    },
    mode: "onSubmit" // Only validate on submit, not on change
  });

  // Initialize the order-specific form (when artikelNr is provided)
  const orderForm = useForm<OrderTicketFormValues>({
    resolver: zodResolver(orderTicketFormSchema),
    defaultValues: {
      comment: ticket?.comment || "",
      orderNumber: bestellNr ? bestellNr.toString() : "",
    },
    mode: "onSubmit" // Only validate on submit, not on change
  });

  // Update generic form values when editing a ticket and set item field disabled state
  useEffect(() => {
    // When editing, ensure the form has the ticket's values
    if (isEditMode && ticket) {
      genericForm.reset({
        artikelNr: ticket.artikelNr || 0,
        bestellNr: ticket.bestellNr || 0,
        comment: ticket.comment || "",
      });

      // Load existing tickets for this order if it has an order number
      if (ticket.bestellNr) {
        loadExistingTicketsByOrder(ticket.bestellNr);
      }
    } else if (!isOrderMode) {
      // For new generic tickets
      genericForm.reset({
        artikelNr: 0,
        bestellNr: 0,
        comment: "",
      });
    }
  }, [ticket, genericForm, isOrderMode, isEditMode]);

  // Fetch related orders and set the default order number when in order mode
  useEffect(() => {
    if (isOpen && isOrderMode && artikelNr) {
      // If a specific order was provided, set it
      if (bestellNr && bestellNr > 0) {
        orderForm.setValue('orderNumber', bestellNr.toString());
        // If we have a bestellNr, load existing tickets for it
        loadExistingTicketsByOrder(bestellNr);
      }

      // Load related orders for autocomplete
      setIsLoadingOrders(true);
      OrdersService.getOpenOrdersByArtikelNr(artikelNr)
        .then((data) => {
          // Add direct debug log of raw data
          console.log('Raw API response for orders:', data);
          console.log('Type of data:', typeof data);
          console.log('Is Array?', Array.isArray(data));
          if (Array.isArray(data)) {
            console.log('First few orders:', data.slice(0, 3));
          }

          safeSetOrders(data);
          // Don't automatically open the order selection
          setOrderDropdownOpen(false);
        })
        .catch((error) => {
          console.error("Failed to fetch orders:", error);
          safeSetOrders([]);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    }
  }, [isOpen, artikelNr, bestellNr, orderForm, isOrderMode]);

  // Add effect for order dropdown debugging
  useEffect(() => {
    if (orderDropdownOpen) {
      console.log('Order dropdown opened');
      console.log('Current orders state:', orders);
      console.log('Orders count:', orders.length);
      console.log('Is loading orders:', isLoadingOrders);
      console.log('Order search term:', orderSearch);
    }
  }, [orderDropdownOpen, orders, isLoadingOrders, orderSearch]);

  // Modify setOrders to ensure it always sets an array
  const safeSetOrders = (data: any) => {
    // Always ensure orders is set as an array even if API returns something else
    if (!data) {
      console.warn("Received null or undefined data in safeSetOrders");
      setOrders([]);
      return;
    }

    if (Array.isArray(data)) {
      console.log(`Setting ${data.length} orders from array data`);
      setOrders(data);
    } else if (data && typeof data === 'object' && 'items' in data) {
      console.log(`Setting ${data.items.length} orders from paginated data`);
      setOrders(Array.isArray(data.items) ? data.items : []);
    } else {
      console.warn("Received unexpected data format in safeSetOrders:", data);
      setOrders([]);
    }
  };

  // Helper function to filter orders or grouped orders by search term
  const getFilteredItems = <T extends OpenOrders | OpenOrdersGrouped>(
    items: T[],
    searchTerm: string
  ): T[] => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return items;
    }
    return OrdersService.searchOrderItems(items, searchTerm) as T[];
  };

  // Fetch all orders when we need to search globally
  const loadAllOrders = () => {
    // Skip if already loading
    if (isLoadingOrders) {
      console.log('Already loading orders, skipping duplicate request');
      return;
    }

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Show loading indicator immediately
    setIsLoadingOrders(true);

    // Try to use cache first if we have it and it's not empty
    if (orderCache.has('all-orders')) {
      try {
        const cached = orderCache.get('all-orders');
        if (cached && cached.data.length > 0) {
          console.log(`Using cached orders (${cached.data.length} items)`);

          // If searching, filter the data
          if (orderSearch.trim()) {
            // Use OrdersService to search with consistent logic
            OrdersService.searchOrders(orderSearch)
              .then((filteredOrders: OpenOrders[]) => {
                safeSetOrders(filteredOrders);
                setIsLoadingOrders(false);
              })
              .catch((error: Error) => {
                console.error("Error during search:", error);
                // Fall back to showing all cached orders
                safeSetOrders(cached.data);
                setIsLoadingOrders(false);
              });
          } else {
            // No search, just use all cached orders
            safeSetOrders(cached.data);
            setIsLoadingOrders(false);
          }
          return;
        }
      } catch (error) {
        console.error("Error retrieving from cache:", error);
      }
    }

    // Set debounce timer to prevent multiple rapid requests
    debounceTimerRef.current = setTimeout(() => {
      console.log('Loading all orders after debounce...');

      // If we have a search term, use the searchOrders method directly
      if (orderSearch && orderSearch.trim().length > 0) {
        OrdersService.searchOrders(orderSearch)
          .then((filteredOrders: OpenOrders[]) => {
            safeSetOrders(filteredOrders);
          })
          .catch((error: Error) => {
            console.error("Failed to search orders:", error);
            safeSetOrders([]);
          })
          .finally(() => {
            setIsLoadingOrders(false);
          });
        return;
      }

      // If no search term, load all orders
      OrdersService.getOpenOrders()
        .then((data) => {
          console.log(`Received ${data.length} orders from API`);
          safeSetOrders(data);
        })
        .catch((error) => {
          console.error("Failed to fetch all orders:", error);
          safeSetOrders([]);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    }, 300); // 300ms debounce time for better UI experience
  };

  // Fetch related orders when an item number is selected in generic mode
  const loadOrdersForItem = (itemNumber: number): Promise<OpenOrders[]> => {
    setIsLoadingOrders(true);

    // The debouncing and validation are now handled in the service layer
    return OrdersService.getOpenOrdersByArtikelNr(itemNumber)
      .then((data) => {
        const ordersData = Array.isArray(data) ? data : [];
        safeSetOrders(ordersData);
        setIsLoadingOrders(false);
        return ordersData;
      })
      .catch((error) => {
        console.error(`Failed to fetch orders for item ${itemNumber}:`, error);
        safeSetOrders([]);
        setIsLoadingOrders(false);
        return [];
      });
  };

  // New function to directly search for items using the API
  const searchItemsByNumber = (itemNumber: number) => {
    if (!itemNumber || isNaN(itemNumber) || itemNumber < 1000) {
      return; // Skip invalid numbers
    }

    console.log(`Directly searching for item #${itemNumber}`);
    setIsLoadingItems(true);

    // First try to get an exact match with the item number
    OrdersService.searchItems(itemNumber.toString())
      .then(items => {
        if (items && items.length > 0) {
          console.log(`Found ${items.length} item(s) matching ${itemNumber}`);

          // Check for exact match with search term
          const exactMatch = items.find(item => item.ArtikelNr === itemNumber);

          if (exactMatch || items.length === 1) {
            // Auto-select if we have exactly one match or an exact match with search
            const item = exactMatch || items[0];

            // Update form value
            genericForm.setValue('artikelNr', item.ArtikelNr);

            // Load orders for this item
            loadOrdersForItem(item.ArtikelNr)
              .then(ordersData => {
                // Auto-select if there's only one order
                if (ordersData.length === 1) {
                  genericForm.setValue('bestellNr', ordersData[0].BestellNr);
                  loadExistingTicketsByOrder(ordersData[0].BestellNr);
                }
              });

            // Close dropdown since we've auto-selected
            setItemDropdownOpen(false);
          } else {
            // Show found items in dropdown
            setItems(items);
            setItemDropdownOpen(true);
          }
        } else {
          console.log(`No items found for ${itemNumber}`);
          // No items found, close dropdown
          setItemDropdownOpen(false);

          // Show a message
          toast({
            title: t('tickets.noItemsFound', 'No Items Found'),
            description: t('tickets.noItemsFoundDesc', 'No items found with number {{itemNumber}}', { itemNumber: itemNumber }),
            variant: "default"
          });
        }
      })
      .catch(error => {
        console.error(`Error searching for item ${itemNumber}:`, error);
        toast({
          title: t('common.error', 'Error'),
          description: t('tickets.errorSearchingItem', 'Error searching for item. Please try again.'),
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsLoadingItems(false);
      });
  };

  // Fetch existing tickets for a specific order number
  const loadExistingTicketsByOrder = (orderNumber: number) => {
    if (orderNumber && orderNumber > 0) {
      setIsLoadingExistingTickets(true);
      setShowExistingTickets(false); // Hide until loaded

      console.log(`Looking up tickets for order: ${orderNumber} using correct API endpoint`);
      // Use the service method which handles validation and fallback to client-side filtering
      TicketsService.getTicketsByBestellNr(orderNumber)
        .then((tickets) => {
          console.log(`Found ${tickets.length} tickets for order ${orderNumber}`);
          setExistingTickets(tickets);

          // Only show existing tickets if there are any
          const hasTickets = tickets.length > 0;
          setShowExistingTickets(hasTickets);

          // Optionally provide feedback to the user
          if (hasTickets) {
            toast({
              title: t('tickets.existingTicketsFound', 'Existing Tickets Found'),
              description: t('tickets.ticketsForOrderFound', '{{count}} tickets found for this order', { count: tickets.length }),
              variant: "default",
            });
          }
        })
        .catch((error) => {
          console.error("Failed to fetch existing tickets:", error);
          setExistingTickets([]);
          setShowExistingTickets(false);

          // Let the user know there was a problem
          toast({
            title: t('tickets.ticketsLookupError', 'Ticket Lookup Error'),
            description: t('tickets.failedToLoadTickets', 'Failed to load existing tickets for this order'),
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoadingExistingTickets(false);
        });
    } else {
      setExistingTickets([]);
      setShowExistingTickets(false);
    }
  };

  // Find the item details for a given order number
  const findItemForOrder = (orderNumber: number) => {
    // Convert to string for consistent comparison
    const orderNumStr = String(orderNumber);

    const order = orders.find(order => String(order.BestellNr) === orderNumStr);
    if (order) {
      return order.ArtikelNr;
    }
    console.log(`No item found for order: ${orderNumber}`);
    return 0;
  };

  // Add a useEffect to handle item field disabling when order number changes
  useEffect(() => {
    // This effect runs when the order number changes in the generic form
    if (!isEditMode && !isOrderMode) {
      const orderNumber = genericForm.getValues('bestellNr');

      if (orderNumber && orderNumber > 0) {
        // Find the associated item for this order
        const itemForOrder = findItemForOrder(orderNumber);

        if (itemForOrder && itemForOrder > 0) {
          // If we found an item number, set it and disable the field
          genericForm.setValue('artikelNr', itemForOrder);
          setIsItemFieldDisabled(true);
        } else {
          // If no valid item was found, clear the field and enable it
          genericForm.setValue('artikelNr', 0);
          setIsItemFieldDisabled(false);
        }
      } else {
        // If order number is cleared or invalid, enable the item field
        setIsItemFieldDisabled(false);
      }
    }
  }, [genericForm.watch('bestellNr'), isEditMode, isOrderMode, findItemForOrder]);

  // Add effect to filter orders when search changes
  useEffect(() => {
    // Skip if we don't have any orders loaded or are currently loading
    if (isLoadingOrders) {
      return;
    }

    // If search is empty and we have orders, no need to filter
    if (!orderSearch.trim() && orders.length > 0) {
      return;
    }

    // If we have a search query, use the centralized searchOrders method
    if (orderSearch.trim().length > 0) {
      setIsLoadingOrders(true);

      // Use the centralized search function from OrdersService
      OrdersService.searchOrders(orderSearch)
        .then(results => {
          safeSetOrders(results);
          console.log(`Search for "${orderSearch}" returned ${results.length} results`);
          setIsLoadingOrders(false);
        })
        .catch(error => {
          console.error("Error searching orders:", error);
          setIsLoadingOrders(false);

          // If the search fails, try to load all orders as a fallback
          if (orders.length === 0) {
            loadAllOrders();
          }
        });
      return;
    }

    // If no search term but we need orders, load all
    if (orders.length === 0) {
      loadAllOrders();
    }
  }, [orderSearch]);

  // Effect to filter items based on search term
  useEffect(() => {
    // Skip if items are loading or search is empty
    if (isLoadingItems || items.length === 0) {
      return;
    }

    // If search term is significant, use OrdersService to search
    if (itemSearch.trim().length >= 3) {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a small debounce to prevent too many searches
      debounceTimerRef.current = setTimeout(() => {
        setIsLoadingItems(true);

        // Use OrdersService search method for consistent behavior
        OrdersService.searchItems(itemSearch)
          .then(filteredItems => {
            setItems(filteredItems);
          })
          .catch(error => {
            console.error("Failed to search items:", error);
          })
          .finally(() => {
            setIsLoadingItems(false);
          });
      }, 300); // 300ms debounce
    } else if (itemSearch.trim().length === 0 && items.length === 0) {
      // If search is cleared and we have no items, reload all items
      setIsLoadingItems(true);
      OrdersService.getOpenOrdersGrouped()
        .then((data) => {
          // Handle both response formats (array or paginated object)
          const itemsData = Array.isArray(data) ? data : data.items || [];
          setItems(itemsData);
        })
        .catch((error) => {
          console.error("Failed to fetch grouped orders:", error);
          setItems([]);
        })
        .finally(() => {
          setIsLoadingItems(false);
        });
    }
  }, [itemSearch]);

  // Function for handling item selection in the generic form
  const handleItemSelection = React.useCallback((item: any) => {
    console.log('Item selected in generic form:', item);

    // Clear search
    setItemSearch('');

    // Close dropdown
    setItemDropdownOpen(false);

    // Update form value using multiple approaches for maximum reliability
    const itemNumberStr = String(item.ArtikelNr);
    console.log('Setting item number to:', itemNumberStr);

    // 1. Set form value through React Hook Form
    genericForm.setValue('artikelNr', item.ArtikelNr);

    // 2. Directly update DOM input to ensure UI updates
    setTimeout(() => {
      // Try to find the input by its placeholder text
      const inputElements = document.querySelectorAll('input');
      inputElements.forEach(input => {
        if (input.placeholder && input.placeholder.includes('Enter item number')) {
          input.value = itemNumberStr;
          // Force an input event
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        }
      });

      // 3. Also try to find it by name attribute
      try {
        const itemField = document.querySelector('input[name="artikelNr"]');
        if (itemField) {
          (itemField as HTMLInputElement).value = itemNumberStr;
          const event = new Event('input', { bubbles: true });
          itemField.dispatchEvent(event);
          console.log('Updated item number field directly');
        }
      } catch (e) {
        console.error('Error updating item number field:', e);
      }

      console.log('Form values after item update:', genericForm.getValues());
    }, 10);

    // Load orders for this item if needed
    if (item.ArtikelNr) {
      loadOrdersForItem(item.ArtikelNr);
    }
  }, [genericForm, setItemSearch, setItemDropdownOpen, loadOrdersForItem]);

  // Handle form submission for generic ticket
  const onSubmitGeneric = async (values: TicketFormValues) => {
    setIsSubmitting(true);

    try {
      // Final check - ensure item number is correct for selected order
      if (values.bestellNr && values.bestellNr > 0) {
        const itemForOrder = findItemForOrder(values.bestellNr);
        if (itemForOrder && itemForOrder > 0 && values.artikelNr !== itemForOrder) {
          // Auto-correct the item number to match the order
          values.artikelNr = itemForOrder;
        }
      }

      if (isEditMode && ticket) {
        // Update existing ticket
        await TicketsService.updateTicket(ticket.ticketId, {
          ...values,
        });

        toast({
          title: t('common.success', 'Success'),
          description: t('tickets.ticketUpdatedSuccess', 'Ticket updated successfully'),
        });
      } else {
        // Create new ticket
        await TicketsService.createTicket({
          ...values,
          byUser: 'System User',
          entrydate: new Date().toISOString(),
        });

        toast({
          title: t('common.success', 'Success'),
          description: t('tickets.ticketCreatedSuccess', 'Ticket created successfully'),
        });
      }

      // Invalidate tickets cache to ensure data is refreshed across all components
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });

      // If an item number was provided, invalidate specific item tickets
      if (values.artikelNr) {
        queryClient.invalidateQueries({
          queryKey: [`/api/tickets/by-itemnr/${values.artikelNr}`]
        });
      }

      // If an order number was provided, invalidate orders grouped to update ticket counts
      if (values.bestellNr) {
        queryClient.invalidateQueries({ queryKey: ['/api/orders/grouped'] });
      }

      resetFormValues();
      onSuccess();
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast({
        title: t('common.error', 'Error'),
        description: isEditMode
          ? t('tickets.updateTicketError', 'Failed to update ticket. Please try again.')
          : t('tickets.createTicketError', 'Failed to create ticket. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create stable reference for generic form submission
  const genericFormSubmitHandler = useCallback(
    (values: TicketFormValues) => onSubmitGeneric(values),
    [onSubmitGeneric]
  );

  // Handle form submission for order-specific ticket
  const onSubmitOrder = async (values: OrderTicketFormValues) => {
    setIsSubmitting(true);

    try {
      if (!artikelNr) {
        throw new Error("Item number is required");
      }

      // Get the associated order number if provided
      const selectedOrderNumber = values.orderNumber && values.orderNumber.trim() !== ""
        ? parseInt(values.orderNumber)
        : bestellNr && bestellNr > 0 ? bestellNr : 0;

      // Human error failsafe: verify the item number is valid for this order if an order is selected
      let finalArtikelNr = artikelNr;
      if (selectedOrderNumber && selectedOrderNumber > 0) {
        // Find the matching order to verify the item number is correct
        const matchingOrder = orders.find(o => o.BestellNr === selectedOrderNumber);
        if (matchingOrder && matchingOrder.ArtikelNr && matchingOrder.ArtikelNr !== artikelNr) {
          console.log(`Human error failsafe: Correcting item number from ${artikelNr} to ${matchingOrder.ArtikelNr} for order ${selectedOrderNumber}`);
          finalArtikelNr = matchingOrder.ArtikelNr;

          // Show a toast to inform the user of the correction
          toast({
            title: t('tickets.itemNumberCorrected', 'Item Number Corrected'),
            description: t('tickets.itemNumberCorrectedDesc', 'The item number has been corrected to match the selected order.'),
            variant: "default",
          });
        }
      }

      // Create a new ticket with the form values
      const newTicket = {
        artikelNr: finalArtikelNr,
        bestellNr: selectedOrderNumber,
        comment: values.comment,
        byUser: 'System User',
        entrydate: new Date().toISOString(),
      };

      await TicketsService.createTicket(newTicket);

      toast({
        title: t('common.success', 'Success'),
        description: t('tickets.ticketCreatedSuccess', 'Ticket created successfully'),
      });

      // Invalidate tickets cache to ensure data is refreshed across all components
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });

      // Invalidate specific item tickets
      queryClient.invalidateQueries({
        queryKey: [`/api/tickets/by-itemnr/${finalArtikelNr}`]
      });

      // If an order number was provided, invalidate orders grouped to update ticket counts
      if (selectedOrderNumber) {
        queryClient.invalidateQueries({ queryKey: ['/api/orders/grouped'] });
      }

      resetFormValues();
      onSuccess();
    } catch (error) {
      console.error("Failed to create ticket:", error);
      toast({
        title: t('common.error', 'Error'),
        description: t('tickets.createTicketError', 'Failed to create ticket. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create stable reference for order form submission
  const orderFormSubmitHandler = useCallback(
    (values: OrderTicketFormValues) => onSubmitOrder(values),
    [onSubmitOrder]
  );

  // Helper function to render the existing tickets section
  const renderExistingTickets = React.useCallback(() => {
    if (!showExistingTickets) return null;

    return (
      <div className="bg-muted rounded-md overflow-hidden">
        <div className="px-3 py-2 font-medium text-sm bg-muted/80 flex items-center">
          {t('tickets.existingTickets', 'Existing Tickets for this Order')}
          {existingTickets.length > 0 && (
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {existingTickets.length === 1
                ? '1 ' + t('common.ticketLowercase', 'ticket')
                : existingTickets.length + ' ' + t('common.ticketsLowercase', 'tickets')}
            </span>
          )}
        </div>

        {isLoadingExistingTickets ? (
          <div className="p-3 text-center text-sm text-muted-foreground">
            {t('common.loading', 'Loading...')}
          </div>
        ) : existingTickets.length === 0 ? (
          <div className="p-3 text-center text-sm text-muted-foreground">
            {t('tickets.noExistingTickets', 'No existing tickets found for this order')}
          </div>
        ) : (
          <div className="p-2 space-y-2 max-h-[200px] overflow-y-auto">
            {existingTickets.slice(0, 5).map(ticket => (
              <div
                key={ticket.ticketId}
                className="bg-background rounded p-2 shadow-sm text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">#{ticket.ticketId}</div>
                  <div className="text-muted-foreground text-[10px]">
                    <DateFormatter date={ticket.entrydate ?? null} withTime={true} />
                  </div>
                </div>
                <div className="line-clamp-2 text-muted-foreground">
                  {ticket.comment || ''}
                </div>
              </div>
            ))}
            {existingTickets.length > 5 && (
              <div className="text-xs text-center py-1 text-muted-foreground">
                {t('common.moreTickets', 'And {{count}} more tickets...',
                  { count: existingTickets.length - 5 })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [existingTickets, isLoadingExistingTickets, showExistingTickets, t]);

  // Function to render the edit mode form
  const renderEditForm = React.useCallback(() => {
    return (
      <Form {...genericForm}>
        <form onSubmit={genericForm.handleSubmit(genericFormSubmitHandler)} className="space-y-6">
          {/* Read-only Item Number display */}
          <ReadOnlyField
            label={t('tickets.formItemNumber', 'Item Number')}
            value={ticket?.artikelNr || 0}
          />

          {/* Read-only Order Number display if present */}
          {ticket?.bestellNr && (
            <ReadOnlyField
              label={t('tickets.formOrderNumber', 'Order Number')}
              value={ticket.bestellNr}
            />
          )}

          {/* Editable Comment field */}
          <FormField
            control={genericForm.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tickets.comment', 'Comment')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('tickets.enterDetailsPlaceholder', 'Enter details about the issue or request')}
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('tickets.provideDescriptionHelp', 'Please provide a clear description of the issue or request')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetFormValues();
                onClose();
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => {
                console.log('Edit form submit button clicked');
                genericForm.handleSubmit(genericFormSubmitHandler)();
              }}
            >
              {isSubmitting
                ? t('common.updating', 'Updating...')
                : t('tickets.updateTicket', 'Update Ticket')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  }, [genericForm, genericFormSubmitHandler, t, ticket, resetFormValues, onClose, isSubmitting]);

  // Function to render the generic form
  const renderGenericForm = React.useCallback(() => {
    return (
      <Form {...genericForm}>
        <form onSubmit={genericForm.handleSubmit(genericFormSubmitHandler)} className="space-y-6">
          <FormField
            control={genericForm.control}
            name="artikelNr"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('tickets.formItemNumber', 'Item Number')}</FormLabel>
                <div className="relative" ref={itemDropdownRef}>
                  <FormControl>
                    <div className="flex w-full items-center space-x-2">
                      {isItemFieldDisabled ? (
                        <>
                          <div className="flex h-10 w-[50%] rounded-md border border-input bg-muted px-3 py-2 text-sm">
                            <span className="text-muted-foreground"># {field.value || ''}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-10 px-3"
                            disabled={true}>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex h-10 w-[50%] rounded-md border border-input bg-background px-3 py-2 text-sm relative">
                            <input
                              className="w-full outline-none bg-transparent"
                              placeholder={t('tickets.itemNumberPlaceholder', 'Enter item number')}
                              value={field.value || ''}
                              type="text"
                              onChange={(e) => {
                                const value = e.target.value;
                                const numericValue = parseInt(value, 10);
                                // Only update if it's a valid number or empty
                                if (!isNaN(numericValue) || value === '') {
                                  field.onChange(!isNaN(numericValue) ? numericValue : 0);
                                  setItemSearch(value);

                                  // Reset order field when item changes
                                  genericForm.setValue('bestellNr', 0);
                                  setOrders([]);
                                  setShowExistingTickets(false);

                                  // Always clear previous debounce timer
                                  if (debounceTimerRef.current) {
                                    clearTimeout(debounceTimerRef.current);
                                  }

                                  // For valid numbers, wait until user stops typing to search
                                  if (numericValue >= 1000) {
                                    // Show loading indicator immediately
                                    setIsLoadingItems(true);

                                    // Set a new debounce timer (500ms delay)
                                    debounceTimerRef.current = setTimeout(() => {
                                      console.log(`Debounced search for item #${numericValue}`);
                                      searchItemsByNumber(numericValue);
                                    }, 500); // 500ms debounce time
                                  } else {
                                    setItemDropdownOpen(numericValue > 0 && items.length > 0);
                                    setIsLoadingItems(false);
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                // If user presses Enter, try to directly select the current item
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const numericValue = field.value as number;

                                  if (numericValue && numericValue >= 1000) {
                                    // First check if we have this item in our dropdown already
                                    const exactMatch = items.find(item => item.ArtikelNr === numericValue);

                                    if (exactMatch) {
                                      // Use the existing item from the dropdown
                                      setItemDropdownOpen(false);

                                      // Load orders for this item
                                      loadOrdersForItem(exactMatch.ArtikelNr)
                                        .then(ordersData => {
                                          // Auto-select if there's only one order
                                          if (ordersData.length === 1) {
                                            genericForm.setValue('bestellNr', ordersData[0].BestellNr);
                                            loadExistingTicketsByOrder(ordersData[0].BestellNr);
                                          }
                                        });
                                    } else {
                                      // Directly try to use the entered value
                                      console.log(`Directly using entered item number: ${numericValue}`);

                                      // Search using API to validate
                                      setIsLoadingItems(true);
                                      OrdersService.getOpenOrdersByArtikelNr(numericValue)
                                        .then(orders => {
                                          if (orders && orders.length > 0) {
                                            console.log(`Found ${orders.length} orders for item ${numericValue}`);

                                            // Load orders for this item
                                            loadOrdersForItem(numericValue)
                                              .then(ordersData => {
                                                // Auto-select if there's only one order
                                                if (ordersData.length === 1) {
                                                  genericForm.setValue('bestellNr', ordersData[0].BestellNr);
                                                  loadExistingTicketsByOrder(ordersData[0].BestellNr);
                                                }
                                              });

                                            // Close the dropdown
                                            setItemDropdownOpen(false);
                                          } else {
                                            console.log(`No orders found for item ${numericValue}`);
                                            toast({
                                              title: t('tickets.noOrdersForItem', 'No Orders Found'),
                                              description: t('tickets.noOrdersForItemDesc', 'No orders found for item {{itemNumber}}', { itemNumber: numericValue }),
                                              variant: "destructive"
                                            });
                                          }
                                        })
                                        .catch(error => {
                                          console.error(`Error searching for item ${numericValue}:`, error);
                                          toast({
                                            title: t('common.error', 'Error'),
                                            description: t('tickets.errorSearchingItem', 'Error searching for item. Please try again.'),
                                            variant: "destructive"
                                          });
                                        })
                                        .finally(() => {
                                          setIsLoadingItems(false);
                                        });
                                    }
                                  }
                                }
                              }}
                              onClick={() => {
                                // Only open dropdown if we have a valid item number and items are loaded
                                if (!isItemFieldDisabled && field.value && items.length > 0) {
                                  setItemDropdownOpen(true);
                                }
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-10 px-3"
                            onClick={() => {
                              if (!isItemFieldDisabled) {
                                setItemDropdownOpen(!itemDropdownOpen);
                              }
                            }}
                            disabled={isItemFieldDisabled || items.length === 0}>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                    </div>
                  </FormControl>

                  {/* Always render the dropdown container to maintain hook order */}
                  <div style={{ display: (itemDropdownOpen && (items.length > 0 || isLoadingItems)) ? 'block' : 'none' }}
                    className="absolute top-[calc(100%+4px)] left-0 z-10 w-full max-h-40 overflow-auto rounded-md bg-popover border shadow-md">
                    {isLoadingItems ? (
                      <div className="p-2 text-center text-sm">{t('tickets.loadingItems', 'Loading items...')}</div>
                    ) : items.length === 0 ? (
                      <div className="p-2 text-center text-sm">{t('tickets.noItemsFound', 'No items found')}</div>
                    ) : (
                      <div className="p-1">
                        {items.map(item => (
                          <div
                            key={`item-${item.ArtikelNr}`}
                            className="flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-accent"
                            onClick={() => handleItemSelection(item)}
                          >
                            <div>
                              <div className="font-medium">{item.ArtikelNr}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{item.Artikel}</div>
                            </div>
                            <div className="text-xs px-1.5 py-0.5 rounded bg-muted/80">{item.Hrs}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <FormDescription>
                  {t('tickets.itemNumberRequirement', 'Item numbers must be at least 4 digits')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={genericForm.control}
            name="bestellNr"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  {t('tickets.formOrderNumber', 'Order Number')}
                </FormLabel>
                <div className="relative" ref={orderDropdownRef}>
                  <FormControl>
                    <div className="flex w-full items-center space-x-2">
                      <div className={`flex h-10 w-[50%] rounded-md border border-input ${isEditMode ? 'bg-muted' : 'bg-background'} px-3 py-2 text-sm relative`}>
                        <input
                          className="w-full outline-none bg-transparent"
                          placeholder={t('tickets.enterOrderNumber', 'Enter order number')}
                          value={field.value || ''}
                          type="text"
                          disabled={isEditMode}
                          onChange={(e) => {
                            // Input change handler code
                            const value = e.target.value;
                            const numericValue = parseInt(value, 10);
                            field.onChange(!isNaN(numericValue) ? numericValue : 0);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 px-3"
                        disabled={isEditMode}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={genericForm.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tickets.comment', 'Comment')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('tickets.enterDetailsPlaceholder', 'Enter details about the issue or request')}
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('tickets.provideDescriptionHelp', 'Please provide a clear description of the issue or request')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Container for existing tickets */}
          <div style={{ display: showExistingTickets ? 'block' : 'none' }}>
            {renderExistingTickets()}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetFormValues();
                onClose();
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('common.creating', 'Creating...')
                : t('tickets.createTicket', 'Create Ticket')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  }, [
    genericForm,
    genericFormSubmitHandler,
    isItemFieldDisabled,
    t,
    resetFormValues,
    onClose,
    isSubmitting,
    showExistingTickets,
    renderExistingTickets
  ]);

  // Function to render the order-specific form
  const renderOrderForm = React.useCallback(() => {
    return (
      <Form {...orderForm}>
        <form onSubmit={orderForm.handleSubmit(orderFormSubmitHandler)} className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 mb-2">
            <div className="text-xs text-muted-foreground font-medium">{t('tickets.formItemNumber', 'Item Number')}</div>
            <div className="text-sm font-mono font-medium mt-1">#{artikelNr}</div>
          </div>

          {/* Order selection dropdown - show in both modes but with different behavior */}
          <div className="mb-4" ref={orderDropdownRef}>
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium mb-1">
                {isOrderMode
                  ? t('orders.selectOrder', 'Select Order (Optional)')
                  : t('orders.searchOrders', 'Search Orders')}
              </div>
              {isLoadingOrders && (
                <div className="text-xs text-muted-foreground animate-pulse">
                  {t('common.loading', 'Loading...')}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="mb-1">
                <Input
                  type="text"
                  placeholder={isOrderMode
                    ? t('orders.searchRelatedOrders', 'Search related orders...')
                    : t('orders.searchAllOrders', 'Search order #, item #, or description...')}
                  value={orderSearch}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setOrderSearch(newValue);

                    // Open dropdown if input not empty
                    if (newValue.trim()) {
                      setOrderDropdownOpen(true);
                    }
                  }}
                  onFocus={() => {
                    // Open dropdown if we have orders and input has content
                    if ((orders.length > 0 || orderCache.has('all-orders')) && orderSearch.trim()) {
                      setOrderDropdownOpen(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle Enter key to select first order if possible
                    if (e.key === 'Enter' && orders.length > 0 && orderDropdownOpen) {
                      e.preventDefault();

                      // Select the first order
                      const firstOrder = orders[0];

                      if (isOrderMode) {
                        // Set to the order form
                        orderForm.setValue('orderNumber', String(firstOrder.BestellNr));
                        loadExistingTicketsByOrder(firstOrder.BestellNr);
                      } else {
                        // Set to the generic form
                        genericForm.setValue('bestellNr', firstOrder.BestellNr);
                        genericForm.setValue('artikelNr', firstOrder.ArtikelNr);
                        loadExistingTicketsByOrder(firstOrder.BestellNr);
                      }

                      // Clear search and close dropdown
                      setOrderSearch('');
                      setOrderDropdownOpen(false);
                    }
                  }}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 px-3"
                onClick={() => {
                  setOrderDropdownOpen(!orderDropdownOpen);
                  if (!orderDropdownOpen && orders.length === 0) {
                    loadAllOrders();
                  }
                }}
              >
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">{t('common.toggle', 'Toggle')}</span>
              </Button>
            </div>

            {/* Dropdown with filtered orders */}
            {orderDropdownOpen && (
              <div className="absolute left-0 z-50 w-full mt-1 bg-popover rounded-md border shadow-lg max-h-[280px] overflow-auto">
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                    <span className="text-sm">{t('common.loading', 'Loading...')}</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {orderSearch.trim() ?
                      t('orders.noMatchingOrders', 'No matching orders found for "{{search}}"', { search: orderSearch }) :
                      t('orders.noOrdersAvailable', 'No orders available')}
                  </div>
                ) : (
                  <div className="p-1">
                    {orders.slice(0, 30).map((order, index) => (
                      <OrderItemWithArticle
                        key={`order-${order.BestellNr}-${order.ArtikelNr}-${index}`}
                        order={order}
                        index={index}
                        onClick={() => {
                          // Add debug log
                          console.log('Order item clicked in generic form:', order);
                          console.log('Current generic form values before update:', genericForm.getValues());

                          // Clear search text
                          setOrderSearch('');

                          // Close dropdown
                          setOrderDropdownOpen(false);

                          // Set generic form values for both order and item
                          genericForm.setValue('bestellNr', order.BestellNr);
                          genericForm.setValue('artikelNr', order.ArtikelNr);

                          // Also directly update the DOM inputs to ensure UI updates
                          setTimeout(() => {
                            // For order number
                            const orderInputs = document.querySelectorAll('input');
                            orderInputs.forEach(input => {
                              if (input.placeholder && (
                                input.placeholder.includes('Enter order number') ||
                                input.placeholder.includes('Search all orders'))) {
                                input.value = String(order.BestellNr);
                                // Force an input event
                                const event = new Event('input', { bubbles: true });
                                input.dispatchEvent(event);
                              }
                            });

                            // Try finding by name attribute as well
                            try {
                              const orderField = document.querySelector('input[name="bestellNr"]');
                              if (orderField) {
                                (orderField as HTMLInputElement).value = String(order.BestellNr);
                                const event = new Event('input', { bubbles: true });
                                orderField.dispatchEvent(event);
                              }
                            } catch (e) {
                              console.error('Error updating order field:', e);
                            }

                            // For item number as well
                            const itemInputs = document.querySelectorAll('input');
                            itemInputs.forEach(input => {
                              if (input.placeholder && input.placeholder.includes('Enter item number')) {
                                input.value = String(order.ArtikelNr);
                                // Force an input event
                                const event = new Event('input', { bubbles: true });
                                input.dispatchEvent(event);
                              }
                            });

                            // Try finding by name attribute as well
                            try {
                              const itemField = document.querySelector('input[name="artikelNr"]');
                              if (itemField) {
                                (itemField as HTMLInputElement).value = String(order.ArtikelNr);
                                const event = new Event('input', { bubbles: true });
                                itemField.dispatchEvent(event);
                              }
                            } catch (e) {
                              console.error('Error updating item field:', e);
                            }

                            console.log('Generic form values after update:', genericForm.getValues());
                          }, 10);

                          setIsItemFieldDisabled(true);
                          loadExistingTicketsByOrder(order.BestellNr);
                        }}
                      />
                    ))}

                    {orders.length > 30 && (
                      <div className="p-2 text-center text-xs text-muted-foreground border-t">
                        {t('common.showingLimited', 'Showing 30 of {{total}} results. Refine your search to see more specific results.',
                          { total: orders.length })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isOrderMode ? (
              <div className="text-xs text-muted-foreground mt-1">
                {t('orders.searchRelatedOrdersHint', 'Search for orders related to item #{{artikelNr}}',
                  { artikelNr: artikelNr })}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                {t('orders.searchOrdersHint', 'Search by order number, item number, or description')}
              </div>
            )}
          </div>

          <FormField
            control={orderForm.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tickets.comment', 'Comment')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('tickets.enterDetailsPlaceholder', 'Enter details about the issue or request')}
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('tickets.provideDescriptionHelp', 'Please provide a clear description of the issue or request')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Always render the container for existing tickets to maintain hook order */}
          <div style={{ display: showExistingTickets ? 'block' : 'none' }}>
            {renderExistingTickets()}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetFormValues();
                onClose();
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('common.creating', 'Creating...')
                : t('tickets.createTicket', 'Create Ticket')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  }, [
    artikelNr,
    orderForm,
    orderFormSubmitHandler,
    orderDropdownRef,
    t,
    setOrderSearch,
    setOrderDropdownOpen,
    loadExistingTicketsByOrder,
    setShowExistingTickets,
    orders,
    orderDropdownOpen,
    isLoadingOrders,
    orderSearch,
    renderExistingTickets,
    resetFormValues,
    onClose,
    isSubmitting,
    showExistingTickets
  ]);

  // Complete the component with the return statement
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetFormValues();
          onClose();
        }
      }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {isEditMode ? t('tickets.editTicket', 'Edit Ticket') : t('tickets.addTicketTitle', 'Add New Ticket')}
          </DialogTitle>
        </DialogHeader>

        {isEditMode ? renderEditForm() : isOrderMode ? renderOrderForm() : renderGenericForm()}

      </DialogContent>
    </Dialog>
  );
}