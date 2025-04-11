import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TicketsService, OrdersService } from "@/services/api";
import { ChevronDown } from "lucide-react";
import DateFormatter from "@/components/DateFormatter";
import { DialogFooter } from "@/components/ui/dialog";
import { OpenOrder } from "@/shared/types";

// Define a schema for the form
const orderTicketFormSchema = z.object({
  orderNumber: z.string().optional(),
  comment: z.string().min(5, {
    message: "Comment must be at least 5 characters.",
  }),
});

type OrderTicketFormValues = z.infer<typeof orderTicketFormSchema>;

// Type alias for OpenOrders
type OpenOrders = OpenOrder;

// Component to render a single order item with article info
const OrderItemWithArticle = ({
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
};

interface OrderTicketFormProps {
  onClose: () => void;
  onSuccess: () => void;
  artikelNr: number;
  bestellNr?: number;
  onLoadTickets: (orderNumber: number) => void;
}

export default function OrderTicketForm({
  onClose,
  onSuccess,
  artikelNr,
  bestellNr,
  onLoadTickets
}: OrderTicketFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for order dropdown
  const [orders, setOrders] = useState<OpenOrders[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  // Ref for dropdown
  const orderDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize the form
  const form = useForm<OrderTicketFormValues>({
    resolver: zodResolver(orderTicketFormSchema),
    defaultValues: {
      orderNumber: bestellNr ? bestellNr.toString() : "",
      comment: "",
    },
  });

  // Function to safely set orders
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

  // Handle clicking outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orderDropdownRef.current && !orderDropdownRef.current.contains(event.target as Node)) {
        setOrderDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load orders related to the item number
  useEffect(() => {
    if (artikelNr) {
      // If a specific order was provided, set it
      if (bestellNr && bestellNr > 0) {
        form.setValue('orderNumber', bestellNr.toString());
        // Load existing tickets for this order
        onLoadTickets(bestellNr);
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
  }, [artikelNr, bestellNr, form, onLoadTickets]);

  // Debug logging for the dropdown
  useEffect(() => {
    if (orderDropdownOpen) {
      console.log('Order dropdown opened');
      console.log('Current orders state:', orders);
      console.log('Orders count:', orders.length);
      console.log('Is loading orders:', isLoadingOrders);
      console.log('Order search term:', orderSearch);
    }
  }, [orderDropdownOpen, orders, isLoadingOrders, orderSearch]);

  // Handle form submission
  const onSubmit = async (values: OrderTicketFormValues) => {
    setIsSubmitting(true);

    try {
      if (!artikelNr) {
        throw new Error("Item number is required");
      }

      // Get the associated order number if provided
      const selectedOrderNumber = values.orderNumber && values.orderNumber.trim() !== ""
        ? parseInt(values.orderNumber)
        : bestellNr && bestellNr > 0 ? bestellNr : 0;

      // Create a new ticket with the form values
      const newTicket = {
        artikelNr,
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
        queryKey: [`/api/tickets/by-itemnr/${artikelNr}`]
      });

      // If an order number was provided, invalidate orders grouped to update ticket counts
      if (selectedOrderNumber) {
        queryClient.invalidateQueries({ queryKey: ['/api/orders/grouped'] });
      }

      // Reset and close
      form.reset();
      onSuccess();
    } catch (error) {
      console.error("Error creating ticket:", error);

      toast({
        title: t('common.error', 'Error'),
        description: t('tickets.ticketCreationFailed', 'Failed to create ticket. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4 mb-2">
          <div className="text-xs text-muted-foreground font-medium">{t('tickets.formItemNumber', 'Item Number')}</div>
          <div className="text-sm font-mono font-medium mt-1">#{artikelNr}</div>
        </div>

        {/* Order selection dropdown */}
        <div className="mb-4" ref={orderDropdownRef}>
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium mb-1">
              {t('orders.selectOrder', 'Select Order (Optional)')}
            </div>
            {isLoadingOrders && (
              <div className="text-xs text-muted-foreground animate-pulse">
                {t('common.loading', 'Loading...')}
              </div>
            )}
          </div>

          <div className="relative">
            <FormField
              control={form.control}
              name="orderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex w-full items-center space-x-2">
                      <Input
                        className="w-full"
                        placeholder={t('orders.searchRelatedOrders', 'Search related orders...')}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setOrderSearch(e.target.value);

                          // Open dropdown if input not empty
                          if (e.target.value.trim()) {
                            setOrderDropdownOpen(true);
                          }
                        }}
                        onClick={() => {
                          setOrderDropdownOpen(!orderDropdownOpen);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10 px-3"
                        onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                      >
                        <ChevronDown className="h-4 w-4" />
                        <span className="sr-only">{t('common.toggle', 'Toggle')}</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          // Add debug log to see what's happening
                          console.log('Order item clicked:', order);
                          console.log('Current form values before update:', form.getValues());

                          // Clear search text
                          setOrderSearch('');

                          // Set the order number value - this is the key fix
                          const orderNumberStr = String(order.BestellNr);
                          console.log('Setting order number to:', orderNumberStr);

                          // Update form value
                          form.setValue('orderNumber', orderNumberStr);

                          // Close dropdown
                          setOrderDropdownOpen(false);

                          // Also directly update the DOM input element to ensure UI updates
                          setTimeout(() => {
                            const inputElements = document.querySelectorAll('input');
                            inputElements.forEach(input => {
                              if (input.placeholder && input.placeholder.includes('Search related orders')) {
                                input.value = orderNumberStr;
                                // Force an input event to ensure React state is updated
                                const event = new Event('input', { bubbles: true });
                                input.dispatchEvent(event);
                              }
                            });

                            console.log('Form values after update:', form.getValues());
                          }, 10);

                          // Load tickets for this order
                          onLoadTickets(order.BestellNr);
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

            <div className="text-xs text-muted-foreground mt-1">
              {t('orders.searchRelatedOrdersHint', 'Search for orders related to item #{{artikelNr}}',
                { artikelNr: artikelNr })}
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
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
            onClick={onClose}
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
} 