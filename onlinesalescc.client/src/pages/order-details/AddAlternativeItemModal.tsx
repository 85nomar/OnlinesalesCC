import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrdersAdditionalService } from "@/features/orders";
import { useToast } from "@/hooks/use-toast";
import type { AlternativeItem } from "@/features/orders/types/models";

interface AddAlternativeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  artikelNr: number;
  currentAlternatives: AlternativeItem[];
}

export default function AddAlternativeItemModal({ 
  isOpen, 
  onClose,
  onSuccess,
  artikelNr,
  currentAlternatives
}: AddAlternativeItemModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create the validation schema with empty messages to avoid duplication
  const validationSchema = z.object({
    alternativeArtikelNr: z.coerce.number().min(1000, { message: "" }),
    alternativeArtikel: z.string().min(1, { message: "" })
  });
  
  type AlternativeItemFormValues = z.infer<typeof validationSchema>;

  // Initialize the form
  const form = useForm<AlternativeItemFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      alternativeArtikelNr: undefined,
      alternativeArtikel: ""
    }
  });

  // Check if item already exists
  const isAlreadyAdded = (itemNumber: number) => {
    return currentAlternatives.some(alt => alt.alternativeArtikelNr === itemNumber);
  };

  // Get query client from React Query
  const queryClient = useQueryClient();
  
  // Handle form submission
  const onSubmit = async (values: AlternativeItemFormValues) => {
    // Check if trying to add the same item as the original
    if (values.alternativeArtikelNr === artikelNr) {
      toast({
        title: t('common.error'),
        description: t('orders.cannotAddSameItem', "Cannot add the same item as an alternative"),
        variant: "destructive",
      });
      return;
    }
    
    // Check if already added
    if (isAlreadyAdded(values.alternativeArtikelNr)) {
      toast({
        title: t('common.error'),
        description: t('orders.itemAlreadyAdded', "This item is already added as an alternative"),
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Construct the payload to match backend expectations
      const payload: AlternativeItem = {
        orderArtikelNr: artikelNr,
        alternativeArtikelNr: values.alternativeArtikelNr,
        alternativeArtikel: values.alternativeArtikel
      };
      
      await OrdersAdditionalService.addAlternativeItem(artikelNr, payload);
      
      // Invalidate all queries that might use this data
      // Invalidate order details page queries
      queryClient.invalidateQueries({ queryKey: [`/api/orders/additional/${artikelNr}`] });
      // Invalidate open orders page queries to show the updated alternative items indicator
      queryClient.invalidateQueries({ queryKey: ['/api/orders/additional'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/grouped'] });
      
      toast({
        title: t('common.success'),
        description: t('orders.alternativeItemAdded', "Alternative item added successfully"),
      });
      
      onSuccess();
      form.reset({ alternativeArtikelNr: undefined, alternativeArtikel: "" });
    } catch (error: any) {
      console.error("Error adding alternative item:", error);
      
      // Extract more detailed error message if available
      const errorMessage = error.message 
        ? `${t('orders.failedToAddItem', "Failed to add alternative item")}: ${error.message}`
        : t('orders.failedToAddItem', "Failed to add alternative item. Please try again.");
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    form.reset({ alternativeArtikelNr: undefined, alternativeArtikel: "" });
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {t('orders.addAlternativeItem', "Add Alternative Item")}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="alternativeArtikelNr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orders.alternativeItemNumber', "Alternative Item Number")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t('orders.enterAtLeast4Digits', "Enter at least 4 digits")}
                      min={1000}
                      autoComplete="off"
                      value={field.value || ''}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Only set the value if it's not empty
                        field.onChange(inputValue === '' ? undefined : parseInt(inputValue));
                        
                        // Only validate if there's a value
                        if (inputValue && inputValue.length > 0) {
                          const value = parseInt(inputValue);
                          if (value === artikelNr) {
                            form.setError("alternativeArtikelNr", {
                              type: "manual",
                              message: t('orders.cannotAddSameItem', "Cannot add the same item as an alternative")
                            });
                          } else if (isAlreadyAdded(value)) {
                            form.setError("alternativeArtikelNr", {
                              type: "manual",
                              message: t('orders.itemAlreadyAdded', "This item is already added as an alternative")
                            });
                          } else {
                            form.clearErrors("alternativeArtikelNr");
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="alternativeArtikel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orders.alternativeItemName', "Alternative Item Name")}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('orders.enterItemName', "Enter item name")}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                {t('common.cancel', "Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                    {t('common.adding', "Adding...")}
                  </span>
                ) : (
                  t('orders.addAlternative', "Add Alternative")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
