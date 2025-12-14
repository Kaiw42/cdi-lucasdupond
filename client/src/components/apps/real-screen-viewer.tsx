import { useRef, useEffect, useState } from "react";
import { Eye, X, Maximize2, Minimize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RealScreenViewerProps {
  stream: MediaStream | null;
  isActive: boolean;
  onClose?: () => void;
}

export function RealScreenViewer({ stream, isActive, onClose }: RealScreenViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (!isActive || !stream) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[90] bg-black flex flex-col" 
      data-testid="real-screen-viewer"
    >
      <div className="h-14 bg-primary flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary-foreground animate-pulse" />
            <span className="font-semibold text-primary-foreground">
              Partage d'écran en direct
            </span>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-primary-foreground/20 text-primary-foreground border-0"
          >
            En direct
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={toggleFullscreen}
            data-testid="button-fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onClose}
              data-testid="button-close-stream"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center bg-black p-2">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="max-w-full max-h-full object-contain"
          data-testid="screen-share-video"
        />
      </div>
    </div>
  );
}
