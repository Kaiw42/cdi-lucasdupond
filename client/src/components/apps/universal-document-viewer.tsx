import { useState, useEffect } from "react";
import { FileText, Image, Film, FileSpreadsheet, Presentation, Download, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UniversalDocumentViewerProps {
  file: {
    id: string;
    name: string;
    content?: string;
    mimeType?: string;
    fileSize?: number;
  };
  onClose?: () => void;
}

export function UniversalDocumentViewer({ file, onClose }: UniversalDocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getMimeType = (): string => {
    if (file.mimeType) return file.mimeType;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      mp4: "video/mp4",
      webm: "video/webm",
      ogg: "video/ogg",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      js: "text/javascript",
      json: "application/json",
      xml: "application/xml",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      odt: "application/vnd.oasis.opendocument.text",
      ods: "application/vnd.oasis.opendocument.spreadsheet",
      odp: "application/vnd.oasis.opendocument.presentation",
    };
    return mimeMap[ext] || "application/octet-stream";
  };

  const getFileTypeIcon = () => {
    const mime = getMimeType();
    if (mime.startsWith("image/")) return <Image className="h-5 w-5" />;
    if (mime.startsWith("video/")) return <Film className="h-5 w-5" />;
    if (mime.includes("spreadsheet") || mime.includes("excel")) return <FileSpreadsheet className="h-5 w-5" />;
    if (mime.includes("presentation") || mime.includes("powerpoint")) return <Presentation className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getDataUrl = (): string => {
    if (!file.content) return "";
    const mime = getMimeType();
    return `data:${mime};base64,${file.content}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    if (!file.content) return;
    const link = document.createElement("a");
    link.href = `/api/shared-files/${file.id}/download`;
    link.download = file.name;
    link.click();
  };

  const renderContent = () => {
    const mime = getMimeType();
    const dataUrl = getDataUrl();

    if (!file.content) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          {getFileTypeIcon()}
          <p className="mt-4">Contenu non disponible</p>
          <Button variant="outline" className="mt-4" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
      );
    }

    if (mime === "application/pdf") {
      return (
        <iframe
          src={dataUrl}
          className="w-full h-full border-0"
          title={file.name}
          data-testid="pdf-viewer"
        />
      );
    }

    if (mime.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center h-full bg-muted/20 p-4">
          <img
            src={dataUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain transition-transform"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
            data-testid="image-viewer"
          />
        </div>
      );
    }

    if (mime.startsWith("video/")) {
      return (
        <div className="flex items-center justify-center h-full bg-black p-4">
          <video
            src={dataUrl}
            controls
            className="max-w-full max-h-full"
            data-testid="video-viewer"
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>
      );
    }

    if (mime.startsWith("audio/")) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="bg-muted/30 p-8 rounded-lg">
            {getFileTypeIcon()}
            <p className="mt-4 font-medium">{file.name}</p>
          </div>
          <audio
            src={dataUrl}
            controls
            className="mt-6 w-full max-w-md"
            data-testid="audio-viewer"
          >
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
        </div>
      );
    }

    if (mime.startsWith("text/") || mime === "application/json" || mime === "application/xml") {
      try {
        const textContent = atob(file.content);
        return (
          <ScrollArea className="h-full">
            <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words" data-testid="text-viewer">
              {textContent}
            </pre>
          </ScrollArea>
        );
      } catch {
        setError("Erreur de décodage du fichier texte");
      }
    }

    if (
      mime.includes("word") ||
      mime.includes("excel") ||
      mime.includes("powerpoint") ||
      mime.includes("opendocument")
    ) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
          <div className="bg-muted/30 p-8 rounded-lg text-center">
            {getFileTypeIcon()}
            <p className="mt-4 font-medium">{file.name}</p>
            <p className="text-sm mt-2">
              Ce type de fichier nécessite un téléchargement pour être visualisé.
            </p>
          </div>
          <Button variant="default" className="mt-6" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le fichier
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileText className="h-16 w-16 opacity-50" />
        <p className="mt-4">Aperçu non disponible pour ce type de fichier</p>
        <Button variant="outline" className="mt-4" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      </div>
    );
  };

  const mime = getMimeType();
  const showZoomControls = mime.startsWith("image/");

  if (error) {
    return (
      <Card className="h-full flex flex-col items-center justify-center p-8">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="universal-document-viewer">
      <div className="flex items-center justify-between gap-3 p-3 border-b bg-muted/30">
        <div className="flex items-center gap-3 min-w-0">
          {getFileTypeIcon()}
          <div className="min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            {file.fileSize && (
              <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showZoomControls && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setZoom((z) => Math.max(25, z - 25))}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Badge variant="secondary">{zoom}%</Badge>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setZoom((z) => Math.min(300, z + 25))}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                data-testid="button-rotate"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" onClick={handleDownload} data-testid="button-download">
            <Download className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-viewer">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
}
