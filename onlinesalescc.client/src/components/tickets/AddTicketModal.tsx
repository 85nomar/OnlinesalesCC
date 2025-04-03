import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ChevronDown, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DateFormatter from "@/components/DateFormatter";
import { useQueryClient } from "@tanstack/react-query";

// UI components
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Types, schemas and services
import type { Ticket } from "@shared/schema";
import type { OpenOrders, OpenOrdersGrouped } from "@/lib/mockData";
import { 
  ticketFormSchema, 
  orderTicketFormSchema, 
  TicketFormValues, 
  OrderTicketFormValues 
} from "@/lib/validationSchemas";
import { TicketsService } from "@/services/tickets.service";
import { OrdersService } from "@/services/orders.service";

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

export default function AddTicketModal({ 
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
          setOrders(data || []);
          // Don't automatically open the order selection
          setOrderDropdownOpen(false);
        })
        .catch((error) => {
          console.error("Failed to fetch orders:", error);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    }
  }, [isOpen, artikelNr, bestellNr, orderForm, isOrderMode]);
  
  // Fetch related orders when an item number is selected in generic mode
  const loadOrdersForItem = (itemNumber: number): Promise<OpenOrders[]> => {
    return new Promise((resolve) => {
      if (itemNumber && itemNumber >= 1000) {
        setIsLoadingOrders(true);
        OrdersService.getOpenOrdersByArtikelNr(itemNumber)
          .then((data) => {
            const ordersData = data || [];
            setOrders(ordersData);
            resolve(ordersData);
          })
          .catch((error) => {
            console.error("Failed to fetch orders for item:", error);
            resolve([]);
          })
          .finally(() => {
            setIsLoadingOrders(false);
          });
      } else {
        setOrders([]);
        resolve([]);
      }
    });
  };
  
  // Fetch existing tickets for a specific order number
  const loadExistingTicketsByOrder = (orderNumber: number) => {
    if (orderNumber && orderNumber > 0) {
      setIsLoadingExistingTickets(true);
      TicketsService.getAllTickets()
        .then((tickets) => {
          // Filter tickets by the bestellNr
          const ticketsForOrder = tickets.filter((ticket) => 
            ticket.bestellNr === orderNumber
          );
          
          setExistingTickets(ticketsForOrder);
          setShowExistingTickets(ticketsForOrder.length > 0);
        })
        .catch((error) => {
          console.error("Failed to fetch existing tickets:", error);
          setExistingTickets([]);
          setShowExistingTickets(false);
        })
        .finally(() => {
          setIsLoadingExistingTickets(false);
        });
    } else {
      setExistingTickets([]);
      setShowExistingTickets(false);
    }
  };
  
  // Fetch all orders when we need to search globally
  const loadAllOrders = () => {
    setIsLoadingOrders(true);
    OrdersService.getOpenOrders()
      .then((data) => {
        setOrders(data || []);
      })
      .catch((error) => {
        console.error("Failed to fetch all orders:", error);
      })
      .finally(() => {
        setIsLoadingOrders(false);
      });
  };
  
  // Find the item details for a given order number
  const findItemForOrder = (orderNumber: number) => {
    const allOrders = orders.filter(order => order.BestellNr === orderNumber);
    if (allOrders.length > 0) {
      return allOrders[0].ArtikelNr;
    }
    return 0;
  };
  
  // Handle form submission for generic ticket
  const onSubmitGeneric = async (values: TicketFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditMode && ticket) {
        // Update existing ticket
        await TicketsService.updateTicket(ticket.id, {
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
          queryKey: [`/api/tickets/by-artikelnr/${values.artikelNr}`] 
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
        queryKey: [`/api/tickets/by-artikelnr/${artikelNr}`] 
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

  // Helper function to render the existing tickets section
  const renderExistingTickets = () => {
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
                key={ticket.id} 
                className="bg-background rounded p-2 shadow-sm text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">#{ticket.ticketId}</div>
                  <div className="text-muted-foreground text-[10px]">
                    <DateFormatter date={ticket.entrydate} withTime={true} />
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
  };

  // Function to render the edit mode form
  const renderEditForm = () => {
    return (
      <Form {...genericForm}>
        <form onSubmit={genericForm.handleSubmit(onSubmitGeneric)} className="space-y-6">
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
            >
              {isSubmitting 
                ? t('common.updating', 'Updating...') 
                : t('tickets.updateTicket', 'Update Ticket')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  // Function to render the order-specific form
  const renderOrderForm = () => {
    return (
      <Form {...orderForm}>
        <form onSubmit={orderForm.handleSubmit(onSubmitOrder)} className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 mb-2">
            <div className="text-xs text-muted-foreground font-medium">{t('tickets.formItemNumber', 'Item Number')}</div>
            <div className="text-sm font-mono font-medium mt-1">#{artikelNr}</div>
          </div>
          
          <FormField
            control={orderForm.control}
            name="orderNumber"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('tickets.formOrderNumber', 'Order Number')}</FormLabel>
                <div className="relative" ref={orderDropdownRef}>
                  <FormControl>
                    <div className="flex w-full items-center space-x-2">
                      <Input
                        placeholder={t('tickets.enterOrderNumber', 'Enter order number')}
                        className="w-[50%]"
                        {...field}
                        value={field.value}
                        type="text"
                        autoFocus={false} // Explicitly disable autofocus
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                          setOrderSearch(value);
                          
                          // Only open dropdown if we have 3+ digits
                          if (value.length >= 3) {
                            setOrderDropdownOpen(true);
                          } else {
                            setOrderDropdownOpen(false);
                          }
                          
                          // Check for existing tickets when a valid order number is entered
                          const orderNumber = parseInt(value, 10);
                          if (!isNaN(orderNumber) && orderNumber > 0) {
                            loadExistingTicketsByOrder(orderNumber);
                          } else {
                            setShowExistingTickets(false);
                          }
                        }}
                        onClick={() => {
                          if (orders.length > 0 && field.value && field.value.length >= 3) {
                            setOrderDropdownOpen(true);
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="h-10 px-3"
                        onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                        disabled={orders.length === 0}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </FormControl>
                  
                  {orderDropdownOpen && orders.length > 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 z-10 w-full max-h-40 overflow-auto rounded-md bg-popover border shadow-md">
                      {isLoadingOrders ? (
                        <div className="p-2 text-center text-sm">{t('common.loading', 'Loading...')}</div>
                      ) : orders.filter(order => 
                          orderSearch ? order.BestellNr.toString().includes(orderSearch) : true
                        ).length === 0 ? (
                        <div className="p-2 text-center text-sm">{t('tickets.noOrdersFound', 'No orders found for this item')}</div>
                      ) : (
                        <div className="p-1">
                          {orders
                            .filter(order => 
                              orderSearch ? order.BestellNr.toString().includes(orderSearch) : true
                            )
                            .map(order => (
                              <div 
                                key={order.BestellNr} 
                                className="flex items-start justify-between p-2 text-sm hover:bg-muted rounded-sm cursor-pointer"
                                onClick={() => {
                                  field.onChange(order.BestellNr.toString());
                                  setOrderDropdownOpen(false);
                                  
                                  // Load existing tickets for this order
                                  loadExistingTicketsByOrder(order.BestellNr);
                                }}>
                                <div>
                                  <div className="font-medium">{order.BestellNr}</div>
                                  <div className="text-xs text-muted-foreground"><DateFormatter date={order.Erstelldatum} withTime={true} /></div>
                                </div>
                                <div className="text-xs px-1.5 py-0.5 rounded bg-muted/80">{order.BestellStatus}</div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <FormDescription>
                  {t('tickets.leaveEmptyForGeneral', 'Leave empty for general product tickets')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
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

          {renderExistingTickets()}
          
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
  };

  // Function to render the generic form
  const renderGenericForm = () => {
    return (
      <Form {...genericForm}>
        <form onSubmit={genericForm.handleSubmit(onSubmitGeneric)} className="space-y-6">
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
                                  
                                  // Only show dropdown for 4+ digits
                                  if (value.length >= 4) {
                                    setItemDropdownOpen(true);
                                    
                                    // Load orders for this item
                                    loadOrdersForItem(numericValue).then((ordersData) => {
                                      // If only one order exists for this item, auto-select it
                                      if (ordersData.length === 1) {
                                        genericForm.setValue('bestellNr', ordersData[0].BestellNr);
                                        toast({
                                          title: t('common.info', 'Info'),
                                          description: t('tickets.autoSelectedOrder', 'Auto-selected the only available order for this item'),
                                        });
                                        
                                        // Load existing tickets for this order
                                        loadExistingTicketsByOrder(ordersData[0].BestellNr);
                                      }
                                    });
                                  } else {
                                    setItemDropdownOpen(false);
                                    setShowExistingTickets(false);
                                  }
                                }
                              }}
                              onClick={() => {
                                if (!isItemFieldDisabled && items.length > 0 && field.value && field.value.toString().length >= 4) {
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
                  
                  {itemDropdownOpen && items.length > 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 z-10 w-full max-h-40 overflow-auto rounded-md bg-popover border shadow-md">
                      {isLoadingItems ? (
                        <div className="p-2 text-center text-sm">{t('tickets.loadingItems', 'Loading items...')}</div>
                      ) : items.filter(item => 
                          itemSearch ? item.ArtikelNr.toString().includes(itemSearch) : true
                        ).length === 0 ? (
                        <div className="p-2 text-center text-sm">{t('tickets.noItemsFound', 'No items found')}</div>
                      ) : (
                        <div className="p-1">
                          {items
                            .filter(item => 
                              itemSearch ? item.ArtikelNr.toString().includes(itemSearch) : true
                            )
                            .map(item => (
                              <div 
                                key={item.ArtikelNr} 
                                className="flex items-start justify-between p-2 text-sm hover:bg-muted rounded-sm cursor-pointer"
                                onClick={() => {
                                  field.onChange(item.ArtikelNr);
                                  setItemDropdownOpen(false);
                                  loadOrdersForItem(item.ArtikelNr);
                                }}>
                                <div>
                                  <div className="font-medium">{item.ArtikelNr}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">{item.Artikel}</div>
                                </div>
                                <div className="text-xs px-1.5 py-0.5 rounded bg-muted/80">{item.Hrs}</div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  )}
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
                            const value = e.target.value;
                            const numericValue = parseInt(value, 10);
                            
                            // Only update if it's a valid number or empty
                            if (!isNaN(numericValue) || value === '') {
                              // Before updating, check if the order number is changing
                              const currentValue = field.value;
                              if (currentValue !== numericValue) {
                                // Reset item field if the order number changes and doesn't match the current item
                                const currentItem = genericForm.getValues('artikelNr');
                                if (currentItem) {
                                  // Check if the current item is associated with any order
                                  const ordersForItem = orders.filter(order => order.ArtikelNr === currentItem);
                                  const orderMatches = ordersForItem.some(order => order.BestellNr === numericValue);
                                  
                                  // If order doesn't match current item, reset item field and enable it
                                  if (!orderMatches && numericValue !== 0) {
                                    genericForm.setValue('artikelNr', 0);
                                    setIsItemFieldDisabled(false);
                                    
                                    // Look for the new item that matches this order
                                    const itemForOrder = findItemForOrder(numericValue);
                                    if (itemForOrder) {
                                      genericForm.setValue('artikelNr', itemForOrder);
                                      setIsItemFieldDisabled(true);
                                    }
                                  }
                                }
                              }
                              
                              field.onChange(!isNaN(numericValue) ? numericValue : 0);
                              setOrderSearch(value);
                              
                              // Find item for this order if it's not already set
                              const currentItem = genericForm.getValues('artikelNr');
                              if (!currentItem && numericValue) {
                                const itemForOrder = findItemForOrder(numericValue);
                                if (itemForOrder) {
                                  genericForm.setValue('artikelNr', itemForOrder);
                                  setIsItemFieldDisabled(true);
                                }
                              }
                              
                              // Load existing tickets for this order
                              if (!isNaN(numericValue) && numericValue > 0) {
                                loadExistingTicketsByOrder(numericValue);
                              }
                              
                              // Only show dropdown for 3+ digits
                              if (value.length >= 3) {
                                setOrderDropdownOpen(true);
                                // If we don't have orders loaded yet, load all orders
                                if (orders.length === 0) {
                                  loadAllOrders();
                                }
                              } else {
                                setOrderDropdownOpen(false);
                              }
                            }
                          }}
                          onClick={() => {
                            if (orders.length > 0 && field.value && field.value.toString().length >= 3) {
                              setOrderDropdownOpen(true);
                            } else if (field.value && field.value.toString().length >= 3) {
                              // Load all orders for global search
                              loadAllOrders();
                              setOrderDropdownOpen(true);
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button" 
                        variant="ghost" 
                        className="h-10 px-3"
                        disabled={isEditMode}
                        onClick={() => {
                          setOrderDropdownOpen(!orderDropdownOpen);
                          if (orderDropdownOpen === false && orders.length === 0) {
                            loadAllOrders();
                          }
                        }}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </FormControl>
                  
                  {orderDropdownOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 z-10 w-full max-h-40 overflow-auto rounded-md bg-popover border shadow-md">
                      {isLoadingOrders ? (
                        <div className="p-2 text-center text-sm">{t('common.loadingOrders', 'Loading orders...')}</div>
                      ) : orders.filter(order => 
                          orderSearch ? order.BestellNr.toString().includes(orderSearch) : true
                        ).length === 0 ? (
                        <div className="p-2 text-center text-sm">{t('tickets.noOrdersFound', 'No orders found')}</div>
                      ) : (
                        <div className="p-1">
                          {orders
                            .filter(order => 
                              orderSearch ? order.BestellNr.toString().includes(orderSearch) : true
                            )
                            .map(order => (
                              <div 
                                key={order.BestellNr} 
                                className="flex items-start justify-between p-2 text-sm hover:bg-muted rounded-sm cursor-pointer"
                                onClick={() => {
                                  field.onChange(order.BestellNr);
                                  setOrderDropdownOpen(false);
                                  
                                  // Update item number and disable item field
                                  const currentItem = genericForm.getValues('artikelNr');
                                  if (!currentItem || currentItem !== order.ArtikelNr) {
                                    genericForm.setValue('artikelNr', order.ArtikelNr);
                                    setIsItemFieldDisabled(true);
                                  }
                                  
                                  // Load existing tickets for this order
                                  loadExistingTicketsByOrder(order.BestellNr);
                                }}>
                                <div>
                                  <div className="font-medium">{order.BestellNr}</div>
                                  <div className="text-xs text-muted-foreground flex flex-col">
                                    <span><DateFormatter date={order.Erstelldatum} withTime={true} /></span>
                                    <span>#{order.ArtikelNr} - {order.Artikel}</span>
                                  </div>
                                </div>
                                <div className="text-xs px-1.5 py-0.5 rounded bg-muted/80">{order.BestellStatus}</div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <FormDescription>
                  {t('tickets.orderNumberOptional', 'Order number is optional. If provided, tickets will be linked to the specific order.')}
                </FormDescription>
                <FormMessage />
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
          
          {renderExistingTickets()}
          
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
  };

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