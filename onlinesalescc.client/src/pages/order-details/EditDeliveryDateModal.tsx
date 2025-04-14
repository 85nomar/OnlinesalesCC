import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { OrdersAdditionalService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import DateFormatter, { parseAndFormatDate } from "@/components/DateFormatter";
import { DatePicker } from "@/components/ui/date-picker";
import { deliveryDateFormSchema, type DeliveryDateFormValues } from "@/lib/validationSchemas";

interface EditDeliveryDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  artikelNr: number;
  currentDate: string;
  originalDate: string;
}

export default function EditDeliveryDateModal({
  isOpen,
  onClose,
  onSuccess,
  artikelNr,
  currentDate,
  originalDate
}: EditDeliveryDateModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<DeliveryDateFormValues>({
    resolver: zodResolver(deliveryDateFormSchema),
    defaultValues: {
      newDeliveryDate: currentDate || originalDate
    }
  });

  // Get query client from React Query
  const queryClient = useQueryClient();

  // Handle form submission
  const onSubmit = async (values: DeliveryDateFormValues) => {
    setIsSubmitting(true);

    try {
      await OrdersAdditionalService.updateDeliveryDate(artikelNr, values.newDeliveryDate);

      // Invalidate all queries that might use this data
      // Invalidate order details page queries
      queryClient.invalidateQueries({ queryKey: [`/api/orders/additional/${artikelNr}`] });
      // Invalidate open orders page queries to show the updated delivery date
      queryClient.invalidateQueries({ queryKey: ['/api/orders/additional'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/grouped'] });

      toast({
        title: t('common.success'),
        description: t('orders.deliveryDateUpdated', "Delivery date updated successfully"),
      });

      onSuccess();
    } catch (error) {
      console.log("Error updating delivery date:", error);

      // Show toast with error message
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error
          ? error.message
          : t('orders.deliveryDateUpdateFailed', "Failed to update delivery date"),
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  // Handle dialog close
  const handleClose = () => {
    form.reset({ newDeliveryDate: currentDate || originalDate });
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('orders.editDeliveryDate', "Edit Delivery Date")}
          </DialogTitle>
          <DialogDescription>
            {t('orders.updateEstimatedDeliveryDate', "Update the estimated delivery date for item #{{artikelNr}}", { artikelNr })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newDeliveryDate"
              render={({ field }) => {
                // Convert string to Date object for the DatePicker
                const dateValue = field.value ? new Date(field.value) : undefined;

                return (
                  <FormItem>
                    <FormLabel>{t('orders.newDeliveryDate', "New Delivery Date")}</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={dateValue}
                        setDate={(date) => {
                          // Convert Date back to string for form value, preserving the selected date
                          if (date) {
                            // Use local timezone for date conversion to avoid timezone offset issues
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateStr = `${year}-${month}-${day}`;
                            field.onChange(dateStr);
                          } else {
                            field.onChange("");
                          }
                        }}
                        required={true}
                      // No focus handling needed here, we rely on the date-picker component's implementation
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {t('orders.selectUpdatedDeliveryDate', "Please select the updated delivery date")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {originalDate && (
              <div className="p-4 border rounded-md bg-muted/30">
                <div className="text-xs font-medium mb-1 text-muted-foreground">{t('orders.originalDeliveryDate', "Original Delivery Date")}</div>
                <div className="text-sm font-medium"><DateFormatter date={originalDate} withTime={true} /></div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                {t('common.cancel', "Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                    {t('common.updating', "Updating...")}
                  </span>
                ) : (
                  t('orders.updateDate', "Update Date")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
