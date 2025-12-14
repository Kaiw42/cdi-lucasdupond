import { useRef, useEffect } from "react";
import { Eye, X, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StudentStream {
  studentId: string;
  stream: MediaStream;
}

interface StudentScreenMonitorProps {
  studentStreams: StudentStream[];
  workstations: Array<{
    id: number;
    currentStudentId: string | null;
    currentStudentName: string | null;
    isOccupied: boolean;
  }>;
  onRequestScreen: (studentId: string) => void;
  onStopWatching: (studentId: string) => void;
}

function StudentVideoTile({
  stream,
  studentName,
  studentId,
  onStopWatching,
}: {
  stream: MediaStream;
  studentName: string;
  studentId: string;
  onStopWatching: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen();
  };

  return (
    <Card className="overflow-hidden" data-testid={`student-screen-${studentId}`}>
      <CardHeader className="p-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-xs font-medium truncate flex items-center gap-1">
          <Eye className="h-3 w-3 text-green-500" />
          {studentName}
        </CardTitle>
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleFullscreen}
            data-testid={`button-fullscreen-${studentId}`}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onStopWatching}
            data-testid={`button-stop-watch-${studentId}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-video bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentScreenMonitor({
  studentStreams,
  workstations,
  onRequestScreen,
  onStopWatching,
}: StudentScreenMonitorProps) {
  const occupiedWorkstations = workstations.filter((w) => w.isOccupied && w.currentStudentId);
  const watchedStudentIds = studentStreams.map((s) => s.studentId);

  const getStudentName = (studentId: string): string => {
    const ws = workstations.find((w) => w.currentStudentId === studentId);
    return ws?.currentStudentName || "Élève";
  };

  return (
    <div className="space-y-4">
      {studentStreams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {studentStreams.map((ss) => (
            <StudentVideoTile
              key={ss.studentId}
              stream={ss.stream}
              studentName={getStudentName(ss.studentId)}
              studentId={ss.studentId}
              onStopWatching={() => onStopWatching(ss.studentId)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {occupiedWorkstations
          .filter((w) => w.currentStudentId && !watchedStudentIds.includes(w.currentStudentId))
          .map((ws) => (
            <Button
              key={ws.id}
              variant="outline"
              size="sm"
              onClick={() => ws.currentStudentId && onRequestScreen(ws.currentStudentId)}
              data-testid={`button-request-screen-${ws.id}`}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir {ws.currentStudentName}
            </Button>
          ))}
      </div>

      {occupiedWorkstations.length === 0 && studentStreams.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <Eye className="h-12 w-12 mx-auto opacity-30 mb-3" />
          <p>Aucun élève connecté à surveiller</p>
        </div>
      )}

      {studentStreams.length > 0 && (
        <Badge variant="secondary">
          {studentStreams.length} écran(s) en cours de visualisation
        </Badge>
      )}
    </div>
  );
}
