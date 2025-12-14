import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Shield } from "lucide-react";

interface ScreenRequestDialogProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ScreenRequestDialog({
  isOpen,
  onAccept,
  onDecline,
}: ScreenRequestDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle>Demande de visualisation d'écran</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Votre professeur souhaite voir votre écran pour vous aider ou vérifier votre travail.
            </p>
            <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
              <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm">
                Vous pouvez choisir de partager votre écran entier. Le partage s'arrêtera 
                automatiquement si vous fermez la fenêtre de partage.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline} data-testid="button-decline-screen">
            Refuser
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept} data-testid="button-accept-screen">
            <Eye className="h-4 w-4 mr-2" />
            Partager mon écran
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
