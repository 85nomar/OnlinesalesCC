import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Check } from "lucide-react";
import { EmailService } from "@/features/email";
import { useToast } from "@/hooks/use-toast";
import DateFormatter from "@/components/DateFormatter";
import { MappedOpenOrder, MappedAlternativeItem } from "@/features/orders/types/mappings";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemInfo: {
    itemNumber: number;
    itemName: string;
    newDeliveryDate: string;
    alternatives: MappedAlternativeItem[];
  };
  orders: MappedOpenOrder[];
}

// Email form schema
const emailFormSchema = z.object({
  notificationType: z.enum(["all", "selected"]),
  selectedOrders: z.array(z.number()).optional(),
  subject: z.string().min(1, "Subject is required"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export default function EmailModal({
  isOpen,
  onClose,
  itemInfo,
  orders,
}: EmailModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize form with default values
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      notificationType: "all",
      subject: `Update regarding your ${itemInfo.itemName} order`,
    },
  });

  // Handle form submission
  const onSubmit = async (values: EmailFormValues) => {
    setIsSubmitting(true);

    try {
      // Determine which order numbers to include
      const orderNumbers =
        values.notificationType === "all" ? "all" : values.selectedOrders || [];

      // Email content is pre-generated based on the item and delivery info
      const emailContent = generateEmailContent(
        itemInfo.itemName,
        itemInfo.newDeliveryDate,
        itemInfo.alternatives,
      );

      // Send the email
      const response = await EmailService.sendNotifications({
        orderNumbers: orders.map((order) => order.orderNumber),
        subject: values.subject,
        content: emailContent,
        artikelNr: itemInfo.itemNumber
      });

      if (response.success) {
        setSuccess(true);
        toast({
          title: "Success",
          description: response.message,
        });

        // Reset form after success
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Error",
        description: "Failed to send email notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Notify Customers
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center mb-2">
              Email Sent Successfully
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Customers have been notified about the updated delivery
              information.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="notificationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="all" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            All Orders
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="selected" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Selected Orders
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" autoFocus={false} tabIndex={-1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Content Preview
                </label>
                <div className="rounded-md border border-input bg-card p-4 text-sm text-card-foreground">
                  <p>Dear Customer,</p>
                  <p className="mt-2">
                    We would like to inform you about an update to your recent
                    order of the {itemInfo.itemName}.
                  </p>
                  <p className="mt-2">
                    Unfortunately, there has been a delay in our supply chain,
                    and the new estimated delivery date is{" "}
                    <strong>
                      <DateFormatter date={itemInfo.newDeliveryDate} withTime={true} />
                    </strong>
                    .
                  </p>

                  {itemInfo.alternatives.length > 0 && (
                    <>
                      <p className="mt-2">
                        We apologize for any inconvenience this may cause and
                        would like to offer you the following alternatives
                        that are currently in stock:
                      </p>
                      <ul className="mt-2 list-disc pl-5">
                        {itemInfo.alternatives.map((alt) => (
                          <li key={alt.alternativeItemNumber}>{alt.alternativeItemName}</li>
                        ))}
                      </ul>
                      <p className="mt-2">
                        If you would like to switch to one of these
                        alternatives, please reply to this email or contact
                        our customer service.
                      </p>
                    </>
                  )}

                  <p className="mt-2">Thank you for your understanding.</p>
                  <p className="mt-2">
                    Best regards,
                    <br />
                    Your Order Management Team
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                      Sending...
                    </span>
                  ) : (
                    "Send Email"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper function to generate email content
function generateEmailContent(
  itemName: string,
  deliveryDate: string,
  alternatives: MappedAlternativeItem[],
): string {
  let content = `
    Dear Customer,
    
    We would like to inform you about an update to your recent order of the ${itemName}.
    
    Unfortunately, there has been a delay in our supply chain, and the new estimated delivery date is ${new Date(deliveryDate).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
  `;

  if (alternatives && alternatives.length > 0) {
    content += `
      
      We apologize for any inconvenience this may cause and would like to offer you the following alternatives that are currently in stock:
      
      ${alternatives.map((alt) => `- ${alt.alternativeItemName}`).join("\n")}
      
      If you would like to switch to one of these alternatives, please reply to this email or contact our customer service.
    `;
  }

  content += `
    
    Thank you for your understanding.
    
    Best regards,
    Your MediaMarkt Team
  `;

  return content;
}
