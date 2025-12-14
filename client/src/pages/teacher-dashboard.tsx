import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebRTCScreenShare } from "@/hooks/useWebRTCScreenShare";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { StudentScreenMonitor } from "@/components/teacher/student-screen-monitor";
import {
  Monitor,
  Users,
  Folder,
  Share2,
  LogOut,
  Lock,
  Unlock,
  UserX,
  FileText,
  FolderPlus,
  Play,
  Square,
  UserPlus,
  Trash2,
  Upload,
  Eye,
  Tv,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SharedFile, ScreenSharing, Workstation } from "@shared/schema";
import { CLASSES } from "@shared/schema";

interface StudentAccount {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  classe: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [shareContent, setShareContent] = useState("");
  const [shareContentType, setShareContentType] = useState<"document" | "browser" | "presentation" | "screen">("document");
  const [newStudentUsername, setNewStudentUsername] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [newStudentFirstName, setNewStudentFirstName] = useState("");
  const [newStudentLastName, setNewStudentLastName] = useState("");
  const [newStudentClasse, setNewStudentClasse] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const {
    isSharing: isRealScreenSharing,
    studentStreams,
    startScreenShare: startRealScreenShare,
    stopScreenShare: stopRealScreenShare,
    requestStudentScreen,
    stopWatchingStudent,
  } = useWebRTCScreenShare({
    role: "teacher",
    userId: user?.id,
  });

  const { data: workstations = [] } = useQuery<Workstation[]>({
    queryKey: ["/api/workstations"],
    refetchInterval: 3000,
  });

  const { data: sharedFiles = [] } = useQuery<SharedFile[]>({
    queryKey: ["/api/shared-files/teacher"],
  });

  const { data: screenSharing } = useQuery<ScreenSharing | null>({
    queryKey: ["/api/screen-sharing/status"],
  });

  const { data: studentAccounts = [] } = useQuery<StudentAccount[]>({
    queryKey: ["/api/student-accounts"],
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; firstName: string; lastName: string; classe: string }) => {
      return apiRequest("POST", "/api/student-accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-accounts"] });
      setNewStudentUsername("");
      setNewStudentPassword("");
      setNewStudentFirstName("");
      setNewStudentLastName("");
      setNewStudentClasse("");
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest("DELETE", `/api/student-accounts/${username}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-accounts"] });
    },
  });

  const lockWorkstationMutation = useMutation({
    mutationFn: async ({ id, locked }: { id: number; locked: boolean }) => {
      return apiRequest("POST", `/api/workstations/${id}/lock`, { locked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workstations"] });
    },
  });

  const lockAllMutation = useMutation({
    mutationFn: async (locked: boolean) => {
      return apiRequest("POST", "/api/workstations/lock-all", { locked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workstations"] });
    },
  });

  const disconnectStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return apiRequest("POST", `/api/students/${studentId}/disconnect`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workstations"] });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; targetClasses: string[] }) => {
      return apiRequest("POST", "/api/shared-files", {
        name: data.name,
        fileType: "folder",
        targetClasses: data.targetClasses,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-files/teacher"] });
      setNewFolderName("");
    },
  });

  const toggleScreenSharingMutation = useMutation({
    mutationFn: async (data: { isActive: boolean; targetClasses?: string[]; sharedContent?: string; contentType?: string }) => {
      return apiRequest("POST", "/api/screen-sharing", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screen-sharing/status"] });
    },
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    queryClient.clear();
    window.location.href = "/teacher";
  };

  const handleClassToggle = (classe: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classe) ? prev.filter((c) => c !== classe) : [...prev, classe]
    );
  };

  const handleCreateFolder = () => {
    if (newFolderName && selectedClasses.length > 0) {
      createFolderMutation.mutate({ name: newFolderName, targetClasses: selectedClasses });
    }
  };

  const handleStartScreenShare = async () => {
    if (selectedClasses.length === 0) return;
    
    if (shareContentType === "screen") {
      try {
        await startRealScreenShare(selectedClasses);
        toggleScreenSharingMutation.mutate({
          isActive: true,
          targetClasses: selectedClasses,
          contentType: "screen",
        });
        toast({
          title: "Partage d'écran démarré",
          description: "Votre écran est maintenant visible par les élèves",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de partager l'écran. Vérifiez les permissions.",
          variant: "destructive",
        });
      }
    } else {
      toggleScreenSharingMutation.mutate({
        isActive: true,
        targetClasses: selectedClasses,
        sharedContent: shareContent,
        contentType: shareContentType,
      });
    }
  };

  const handleStopScreenShare = () => {
    if (isRealScreenSharing) {
      stopRealScreenShare();
    }
    toggleScreenSharingMutation.mutate({ isActive: false });
  };

  const handleCreateStudent = () => {
    if (newStudentUsername && newStudentPassword && newStudentFirstName && newStudentLastName && newStudentClasse) {
      createStudentMutation.mutate({
        username: newStudentUsername,
        password: newStudentPassword,
        firstName: newStudentFirstName,
        lastName: newStudentLastName,
        classe: newStudentClasse,
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (selectedClasses.length === 0) {
      toast({
        title: "Erreur",
        description: "Sélectionnez au moins une classe",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetClasses", JSON.stringify(selectedClasses));

      const response = await fetch("/api/shared-files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'upload");
      }

      toast({
        title: "Fichier uploadé",
        description: `${file.name} a été partagé avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shared-files/teacher"] });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await apiRequest("DELETE", `/api/shared-files/${fileId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/shared-files/teacher"] });
      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const occupiedCount = workstations.filter((w) => w.isOccupied).length;
  const lockedCount = workstations.filter((w) => w.isLocked).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b bg-card flex items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-3">
          <Monitor className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-semibold">Poste Professeur</h1>
            <p className="text-xs text-muted-foreground">{user.firstName} {user.lastName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {occupiedCount} connecté(s)
          </Badge>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="students" data-testid="tab-students">
              <Users className="h-4 w-4 mr-2" />
              Postes
            </TabsTrigger>
            <TabsTrigger value="files" data-testid="tab-files">
              <Folder className="h-4 w-4 mr-2" />
              Fichiers
            </TabsTrigger>
            <TabsTrigger value="share" data-testid="tab-share">
              <Tv className="h-4 w-4 mr-2" />
              Partage
            </TabsTrigger>
            <TabsTrigger value="monitor" data-testid="tab-monitor">
              <Eye className="h-4 w-4 mr-2" />
              Surveillance
            </TabsTrigger>
            <TabsTrigger value="accounts" data-testid="tab-accounts">
              <UserPlus className="h-4 w-4 mr-2" />
              Comptes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => lockAllMutation.mutate(true)}
                disabled={lockAllMutation.isPending}
                data-testid="button-lock-all"
              >
                <Lock className="h-4 w-4 mr-2" />
                Verrouiller tous
              </Button>
              <Button
                variant="outline"
                onClick={() => lockAllMutation.mutate(false)}
                disabled={lockAllMutation.isPending}
                data-testid="button-unlock-all"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Déverrouiller tous
              </Button>
              <Badge variant="outline">{lockedCount} verrouillé(s)</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {workstations.map((ws) => (
                <Card
                  key={ws.id}
                  className={`${ws.isLocked ? "border-destructive" : ""} ${ws.isOccupied ? "border-primary" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1">
                        <Monitor className="h-4 w-4" />
                        {ws.label}
                      </span>
                      {ws.isLocked && <Lock className="h-3 w-3 text-destructive" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ws.isOccupied ? (
                      <>
                        <p className="text-xs font-medium truncate" data-testid={`text-student-${ws.id}`}>
                          {ws.currentStudentName}
                        </p>
                        {ws.currentActivity && (
                          <Badge variant="outline" className="text-xs truncate max-w-full">
                            {ws.currentActivity}
                          </Badge>
                        )}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={ws.isLocked ? "outline" : "destructive"}
                            onClick={() => lockWorkstationMutation.mutate({ id: ws.id, locked: !ws.isLocked })}
                            className="flex-1"
                            data-testid={`button-lock-${ws.id}`}
                          >
                            {ws.isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => ws.currentStudentId && disconnectStudentMutation.mutate(ws.currentStudentId)}
                            data-testid={`button-disconnect-${ws.id}`}
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Libre</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Partager des fichiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {CLASSES.map((classe) => (
                    <div key={classe} className="flex items-center gap-2">
                      <Checkbox
                        id={`class-${classe}`}
                        checked={selectedClasses.includes(classe)}
                        onCheckedChange={() => handleClassToggle(classe)}
                        data-testid={`checkbox-class-${classe}`}
                      />
                      <Label htmlFor={`class-${classe}`}>{classe}</Label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <Input
                    placeholder="Nom du dossier"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="max-w-xs"
                    data-testid="input-folder-name"
                  />
                  <Button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName || selectedClasses.length === 0 || createFolderMutation.isPending}
                    data-testid="button-create-folder"
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Créer dossier
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap items-center border-t pt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.txt,.rtf,.png,.jpg,.jpeg,.gif"
                    data-testid="input-file-upload"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedClasses.length === 0 || isUploading}
                    variant="secondary"
                    data-testid="button-upload-file"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Upload en cours..." : "Uploader un fichier"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    PDF, Word, PowerPoint, Excel, LibreOffice, Images (max 50 MB)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Fichiers partagés ({sharedFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {sharedFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun fichier partagé</p>
                  ) : (
                    <div className="space-y-2">
                      {sharedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                          data-testid={`file-item-${file.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {file.fileType === "folder" ? (
                              <Folder className="h-5 w-5 text-primary shrink-0" />
                            ) : (
                              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              {file.fileSize && (
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.fileSize)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex gap-1 flex-wrap">
                              {file.targetClasses?.map((c) => (
                                <Badge key={c} variant="secondary" className="text-xs">
                                  {c}
                                </Badge>
                              ))}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteFile(file.id)}
                              data-testid={`button-delete-file-${file.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Partage d'écran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {CLASSES.map((classe) => (
                    <div key={classe} className="flex items-center gap-2">
                      <Checkbox
                        id={`share-class-${classe}`}
                        checked={selectedClasses.includes(classe)}
                        onCheckedChange={() => handleClassToggle(classe)}
                        data-testid={`checkbox-share-class-${classe}`}
                      />
                      <Label htmlFor={`share-class-${classe}`}>{classe}</Label>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label>Type de contenu</Label>
                    <Select value={shareContentType} onValueChange={(v) => setShareContentType(v as "document" | "browser" | "presentation" | "screen")}>
                      <SelectTrigger className="w-56" data-testid="select-content-type">
                        <SelectValue placeholder="Type de contenu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="screen">Mon écran complet</SelectItem>
                        <SelectItem value="document">Document / Texte</SelectItem>
                        <SelectItem value="browser">Page Web (URL)</SelectItem>
                        <SelectItem value="presentation">Présentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Textarea
                    placeholder={
                      shareContentType === "browser"
                        ? "URL à partager (ex: https://www.example.com)"
                        : shareContentType === "presentation"
                        ? "Contenu de la présentation..."
                        : "Texte ou contenu du document..."
                    }
                    value={shareContent}
                    onChange={(e) => setShareContent(e.target.value)}
                    className="min-h-[120px]"
                    data-testid="textarea-share-content"
                  />
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                  {screenSharing?.isActive ? (
                    <Button
                      variant="destructive"
                      onClick={handleStopScreenShare}
                      disabled={toggleScreenSharingMutation.isPending}
                      data-testid="button-stop-share"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Arrêter le partage
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStartScreenShare}
                      disabled={selectedClasses.length === 0 || toggleScreenSharingMutation.isPending}
                      data-testid="button-start-share"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Démarrer le partage
                    </Button>
                  )}
                </div>

                {screenSharing?.isActive && (
                  <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-sm font-semibold">Partage en cours</p>
                      </div>
                      <Badge variant="outline">
                        {screenSharing.contentType === "browser" ? "Page Web" : 
                         screenSharing.contentType === "presentation" ? "Présentation" : "Document"}
                      </Badge>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {screenSharing.targetClasses?.map((c) => (
                        <Badge key={c}>{c}</Badge>
                      ))}
                    </div>
                    {screenSharing.sharedContent && (
                      <p className="text-xs text-muted-foreground mt-2 truncate max-w-md">
                        {screenSharing.sharedContent.substring(0, 100)}
                        {screenSharing.sharedContent.length > 100 ? "..." : ""}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Surveillance des écrans élèves
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualisez en temps réel les écrans des élèves connectés. Chaque élève devra accepter la demande de visualisation.
                </p>
                <StudentScreenMonitor
                  studentStreams={studentStreams}
                  workstations={workstations.map(w => ({
                    id: w.id,
                    currentStudentId: w.currentStudentId,
                    currentStudentName: w.currentStudentName,
                    isOccupied: w.isOccupied ?? false,
                  }))}
                  onRequestScreen={requestStudentScreen}
                  onStopWatching={stopWatchingStudent}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Créer un compte élève
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-username">Identifiant</Label>
                    <Input
                      id="student-username"
                      placeholder="eleve13"
                      value={newStudentUsername}
                      onChange={(e) => setNewStudentUsername(e.target.value)}
                      data-testid="input-student-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Mot de passe</Label>
                    <Input
                      id="student-password"
                      type="password"
                      placeholder="Mot de passe"
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      data-testid="input-student-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-firstname">Prénom</Label>
                    <Input
                      id="student-firstname"
                      placeholder="Prénom"
                      value={newStudentFirstName}
                      onChange={(e) => setNewStudentFirstName(e.target.value)}
                      data-testid="input-student-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-lastname">Nom</Label>
                    <Input
                      id="student-lastname"
                      placeholder="Nom"
                      value={newStudentLastName}
                      onChange={(e) => setNewStudentLastName(e.target.value)}
                      data-testid="input-student-lastname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-classe">Classe</Label>
                    <Select value={newStudentClasse} onValueChange={setNewStudentClasse}>
                      <SelectTrigger data-testid="select-student-classe">
                        <SelectValue placeholder="Sélectionner une classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSES.map((classe) => (
                          <SelectItem key={classe} value={classe}>
                            {classe}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleCreateStudent}
                  disabled={!newStudentUsername || !newStudentPassword || !newStudentFirstName || !newStudentLastName || !newStudentClasse || createStudentMutation.isPending}
                  data-testid="button-create-student"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Créer le compte
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Comptes élèves ({studentAccounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {studentAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun compte élève</p>
                  ) : (
                    <div className="space-y-2">
                      {studentAccounts.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                              <p className="text-xs text-muted-foreground">@{student.username}</p>
                            </div>
                            <Badge variant="secondary">{student.classe}</Badge>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteStudentMutation.mutate(student.username)}
                            disabled={deleteStudentMutation.isPending}
                            data-testid={`button-delete-student-${student.username}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
