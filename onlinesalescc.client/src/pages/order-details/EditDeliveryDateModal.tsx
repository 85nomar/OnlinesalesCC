import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { OrdersAdditionalService } from "@/features/orders";
import { useTranslation } from "react-i18next";

interface EditDeliveryDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemNumber: number;
  currentDate: string;
  originalDate?: string;
  onSuccess: () => void;
}

export default function EditDeliveryDateModal({
  isOpen,
  onClose,
  itemNumber,
  currentDate,
  originalDate,
  onSuccess,
}: EditDeliveryDateModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [newDate, setNewDate] = useState(currentDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await OrdersAdditionalService.updateDeliveryDate(itemNumber, newDate);
      toast({
        title: t("common.success"),
        description: t("orders.deliveryDateUpdated"),
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to update delivery date:", error);
      toast({
        title: t("common.error"),
        description: t("orders.failedToUpdateDeliveryDate"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("orders.editDeliveryDate", "Edit Delivery Date")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">
            {t("orders.newDeliveryDate")}
          </label>
          <Input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          {originalDate && (
            <p className="text-xs text-muted-foreground">
              {t("orders.originalDeliveryDate")}: {originalDate}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
