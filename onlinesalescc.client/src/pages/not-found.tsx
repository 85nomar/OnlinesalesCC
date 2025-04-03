import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 border-border">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">
              {t('common.pageNotFound', '404 Page Not Found')}
            </h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t('common.pageNotFoundMessage', 'The page you are looking for could not be found.')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
