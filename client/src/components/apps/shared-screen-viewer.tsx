import { Eye, FileText, Globe, Presentation, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ScreenSharing } from "@shared/schema";

interface SharedScreenViewerProps {
  screenSharing: ScreenSharing | null;
}

export function SharedScreenViewer({ screenSharing }: SharedScreenViewerProps) {
  if (!screenSharing || !screenSharing.isActive) {
    return null;
  }

  const getContentIcon = () => {
    switch (screenSharing.contentType) {
      case "browser":
        return <Globe className="h-5 w-5" />;
      case "presentation":
        return <Presentation className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getContentTypeLabel = () => {
    switch (screenSharing.contentType) {
      case "browser":
        return "Page web";
      case "presentation":
        return "Présentation";
      case "document":
        return "Document";
      default:
        return "Contenu";
    }
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const renderContent = () => {
    const content = screenSharing.sharedContent;

    if (screenSharing.contentType === "browser" && content && isValidUrl(content)) {
      return (
        <div className="h-full flex flex-col">
          <div className="bg-muted/50 px-4 py-2 rounded-t-md flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{content}</span>
          </div>
          <iframe
            src={content}
            className="flex-1 w-full border-0 rounded-b-md bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Contenu partagé par le professeur"
            data-testid="shared-screen-iframe"
          />
        </div>
      );
    }

    if (screenSharing.contentType === "presentation") {
      return (
        <div className="h-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-md flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            <div className="bg-card rounded-lg shadow-lg p-12 min-h-[400px] flex items-center justify-center">
              <div className="prose dark:prose-invert prose-lg text-center max-w-none">
                {content ? (
                  <div className="whitespace-pre-wrap text-xl leading-relaxed">
                    {content}
                  </div>
                ) : (
                  <p className="text-muted-foreground">En attente du contenu...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-card rounded-md overflow-auto">
        <div className="p-6">
          {content ? (
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {content}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Monitor className="h-16 w-16 mb-4 opacity-50" />
              <p>En attente du contenu du professeur...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[90] bg-background flex flex-col" data-testid="shared-screen-viewer">
      <div className="h-14 bg-primary flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary-foreground animate-pulse" />
            <span className="font-semibold text-primary-foreground">Partage d'écran en cours</span>
          </div>
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
            {getContentIcon()}
            <span className="ml-1">{getContentTypeLabel()}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {screenSharing.targetClasses?.map((c) => (
            <Badge key={c} variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs">
              {c}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
}
