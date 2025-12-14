import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWebRTCScreenShare } from "@/hooks/useWebRTCScreenShare";
import { DesktopIcon } from "@/components/desktop/desktop-icon";
import { Window } from "@/components/desktop/window";
import { Taskbar } from "@/components/desktop/taskbar";
import { TextEditor } from "@/components/apps/text-editor";
import { Calculator } from "@/components/apps/calculator";
import { Browser } from "@/components/apps/browser";
import { FileManager } from "@/components/apps/file-manager";
import { NotesApp } from "@/components/apps/notes";
import { SharedScreenViewer } from "@/components/apps/shared-screen-viewer";
import { RealScreenViewer } from "@/components/apps/real-screen-viewer";
import { MathTools } from "@/components/apps/math-tools";
import { DocumentEditor } from "@/components/apps/document-editor";
import { ScreenRequestDialog } from "@/components/student/screen-request-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Calculator as CalcIcon,
  Globe,
  Folder,
  StickyNote,
  BookOpen,
  Lock,
  Ruler,
} from "lucide-react";
import type { User, StudentFile, StudentNote, SharedFile, ScreenSharing } from "@shared/schema";

type AppType = "editor" | "calculator" | "browser" | "files" | "notes" | "courses" | "mathtools" | "document";

interface FileData {
  id: string;
  name: string;
  content: string;
  readOnly?: boolean;
}

interface OpenWindow {
  id: string;
  type: AppType;
  title: string;
  fileData?: FileData;
}

interface WorkstationStatus {
  isLocked: boolean;
  workstationId: number;
}

export default function StudentDesktop() {
  const { user, workstationId } = useAuth();
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [showScreenRequest, setShowScreenRequest] = useState(false);

  const {
    isReceiving: isReceivingRealScreen,
    remoteStream,
    acceptScreenRequest,
    declineScreenRequest,
  } = useWebRTCScreenShare({
    role: "student",
    userId: user?.id,
    classe: user?.classe,
    onScreenRequest: () => setShowScreenRequest(true),
  });

  const { data: workstationStatus } = useQuery<WorkstationStatus>({
    queryKey: ["/api/workstation/status"],
    refetchInterval: 3000,
    enabled: !!workstationId,
  });

  const isLocked = workstationStatus?.isLocked ?? false;

  const { data: studentFiles = [] } = useQuery<StudentFile[]>({
    queryKey: ["/api/student-files"],
  });

  const { data: studentNotes = [] } = useQuery<StudentNote[]>({
    queryKey: ["/api/student-notes"],
  });

  const { data: sharedFiles = [] } = useQuery<SharedFile[]>({
    queryKey: ["/api/shared-files"],
  });

  const { data: screenSharing } = useQuery<ScreenSharing | null>({
    queryKey: ["/api/screen-sharing"],
    refetchInterval: 3000,
  });

  const saveNoteMutation = useMutation({
    mutationFn: async (note: { id?: string; title: string; content: string }) => {
      if (note.id) {
        return apiRequest("PATCH", `/api/student-notes/${note.id}`, note);
      }
      return apiRequest("POST", "/api/student-notes", note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-notes"] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/student-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-notes"] });
    },
  });

  const saveFileMutation = useMutation({
    mutationFn: async (file: { id?: string; name: string; content: string }) => {
      if (file.id) {
        return apiRequest("PATCH", `/api/student-files/${file.id}`, {
          content: file.content,
        });
      }
      return apiRequest("POST", "/api/student-files", {
        name: file.name,
        content: file.content,
        fileType: "file",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-files"] });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async (activity: string | null) => {
      return apiRequest("POST", "/api/workstation/activity", { activity });
    },
  });

  const lastWindowType = openWindows.length > 0 ? openWindows[openWindows.length - 1].type : null;
  const lastWindowTitle = openWindows.length > 0 ? openWindows[openWindows.length - 1].title : null;

  useEffect(() => {
    const activityNames: Record<AppType, string> = {
      editor: "Éditeur de texte",
      calculator: "Calculatrice",
      browser: "Navigateur",
      files: "Mes fichiers",
      notes: "Notes",
      courses: "Cours",
      mathtools: "Outils mathématiques",
      document: "Document",
    };
    
    if (lastWindowType) {
      const activityText = lastWindowType === "document" && lastWindowTitle 
        ? `Document: ${lastWindowTitle}` 
        : activityNames[lastWindowType];
      updateActivityMutation.mutate(activityText);
    } else {
      updateActivityMutation.mutate(null);
    }
  }, [lastWindowType, lastWindowTitle]);

  const openApp = useCallback((type: AppType) => {
    const titles: Record<AppType, string> = {
      editor: "Éditeur de texte",
      calculator: "Calculatrice",
      browser: "Navigateur",
      files: "Mes fichiers",
      notes: "Notes",
      courses: "Cours",
      mathtools: "Outils mathématiques",
      document: "Document",
    };

    const existingWindow = openWindows.find((w) => w.type === type);
    if (existingWindow) {
      return;
    }

    setOpenWindows((prev) => [
      ...prev,
      { id: `${type}-${Date.now()}`, type, title: titles[type] },
    ]);
  }, [openWindows]);

  const openFileInDocument = useCallback((file: { id: string; name: string; content?: string }, readOnly = false) => {
    setOpenWindows((prev) => [
      ...prev,
      {
        id: `document-${file.id}-${Date.now()}`,
        type: "document",
        title: file.name,
        fileData: {
          id: file.id,
          name: file.name,
          content: file.content || "",
          readOnly,
        },
      },
    ]);
  }, []);

  const closeWindow = useCallback((id: string) => {
    setOpenWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleWindowClick = useCallback((id: string) => {
    // Bring window to front - for now just a placeholder
  }, []);

  const desktopApps = [
    { type: "editor" as AppType, icon: FileText, label: "Éditeur" },
    { type: "calculator" as AppType, icon: CalcIcon, label: "Calculatrice" },
    { type: "mathtools" as AppType, icon: Ruler, label: "Maths" },
    { type: "browser" as AppType, icon: Globe, label: "Navigateur" },
    { type: "files" as AppType, icon: Folder, label: "Mes fichiers" },
    { type: "notes" as AppType, icon: StickyNote, label: "Notes" },
    { type: "courses" as AppType, icon: BookOpen, label: "Cours" },
  ];

  const mapFilesToManagerFormat = (files: StudentFile[]) => {
    return files.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.fileType as "folder" | "file",
      parentId: f.parentId,
      content: f.content || undefined,
    }));
  };

  const mapSharedFilesToManagerFormat = (files: SharedFile[]) => {
    return files
      .filter((f) => f.targetClasses?.includes(user?.classe || ""))
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: f.fileType as "folder" | "file",
        parentId: f.parentId,
        content: f.content || undefined,
      }));
  };

  const renderWindowContent = (window: OpenWindow) => {
    switch (window.type) {
      case "editor":
        return (
          <TextEditor
            onSave={(content, fileName) => saveFileMutation.mutate({ name: fileName, content })}
          />
        );
      case "calculator":
        return <Calculator />;
      case "mathtools":
        return <MathTools />;
      case "browser":
        return <Browser />;
      case "files":
        return (
          <FileManager
            files={mapFilesToManagerFormat(studentFiles)}
            title="Mes fichiers"
            onFileOpen={(file) => openFileInDocument(file, false)}
          />
        );
      case "notes":
        return (
          <NotesApp
            notes={studentNotes}
            onSave={(note) => saveNoteMutation.mutate(note)}
            onDelete={(id) => deleteNoteMutation.mutate(id)}
          />
        );
      case "courses":
        return (
          <FileManager
            files={mapSharedFilesToManagerFormat(sharedFiles)}
            title="Cours partagés"
            readOnly
            onFileOpen={(file) => openFileInDocument(file, true)}
          />
        );
      case "document":
        if (window.fileData) {
          return (
            <DocumentEditor
              initialContent={window.fileData.content}
              initialFileName={window.fileData.name}
              fileId={window.fileData.id}
              readOnly={window.fileData.readOnly}
              onSave={(content, fileName, fileId) => {
                if (fileId) {
                  saveFileMutation.mutate({ id: fileId, name: fileName, content });
                }
              }}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  if (!user) return null;

  const handleAcceptScreenRequest = () => {
    setShowScreenRequest(false);
    acceptScreenRequest();
  };

  const handleDeclineScreenRequest = () => {
    setShowScreenRequest(false);
    declineScreenRequest();
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      <ScreenRequestDialog
        isOpen={showScreenRequest}
        onAccept={handleAcceptScreenRequest}
        onDecline={handleDeclineScreenRequest}
      />
      
      <RealScreenViewer 
        stream={remoteStream} 
        isActive={isReceivingRealScreen && screenSharing?.contentType === "screen"} 
      />
      
      {screenSharing?.contentType !== "screen" && (
        <SharedScreenViewer screenSharing={screenSharing || null} />
      )}
      
      {isLocked && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          data-testid="lock-overlay"
        >
          <div className="animate-pulse">
            <Lock className="h-48 w-48 text-white/80" />
          </div>
          <h2 className="text-3xl font-bold text-white mt-8 mb-4">Poste verrouillé</h2>
          <p className="text-white/70 text-lg text-center max-w-md">
            Votre poste a été verrouillé par le professeur.
            <br />
            Veuillez patienter.
          </p>
        </div>
      )}
      
      <div className="flex-1 relative overflow-hidden p-4">
        <div className="grid grid-cols-6 md:grid-cols-8 gap-2 content-start">
          {desktopApps.map((app) => (
            <DesktopIcon
              key={app.type}
              icon={app.icon}
              label={app.label}
              onClick={() => openApp(app.type)}
              testId={`desktop-icon-${app.type}`}
            />
          ))}
        </div>

        <div className="absolute inset-4 pointer-events-none">
          <div className="flex flex-wrap gap-4 items-start justify-center pointer-events-auto">
            {openWindows.map((window) => (
              <Window
                key={window.id}
                title={window.title}
                onClose={() => closeWindow(window.id)}
                testId={`window-${window.type}`}
                initialWidth={window.type === "calculator" ? 320 : window.type === "document" ? 800 : 700}
                initialHeight={window.type === "calculator" ? 480 : window.type === "document" ? 600 : 500}
              >
                {renderWindowContent(window)}
              </Window>
            ))}
          </div>
        </div>
      </div>

      <Taskbar
        user={user}
        openWindows={openWindows.map((w) => ({ id: w.id, title: w.title }))}
        onWindowClick={handleWindowClick}
      />
    </div>
  );
}
