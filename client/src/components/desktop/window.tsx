import { X, Minus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  initialWidth?: number;
  initialHeight?: number;
  testId: string;
}

export function Window({
  title,
  children,
  onClose,
  initialWidth = 700,
  initialHeight = 500,
  testId,
}: WindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return null;
  }

  return (
    <div
      className={`flex flex-col bg-card border border-card-border rounded-lg shadow-2xl overflow-hidden ${
        isMaximized ? "fixed inset-4 z-40" : "relative"
      }`}
      style={
        isMaximized
          ? undefined
          : { width: initialWidth, height: initialHeight, maxWidth: "90vw", maxHeight: "80vh" }
      }
      data-testid={testId}
    >
      <div className="h-10 bg-muted border-b border-border flex items-center justify-between px-2 shrink-0">
        <span className="text-sm font-medium px-2 truncate">{title}</span>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
            data-testid={`${testId}-minimize`}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsMaximized(!isMaximized)}
            data-testid={`${testId}-maximize`}
          >
            <Square className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
            onClick={onClose}
            data-testid={`${testId}-close`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
