import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Folder,
  FileText,
  ChevronRight,
  Home,
  ArrowUp,
  Plus,
  Search,
  Grid,
  List,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  parentId: string | null;
  content?: string;
}

interface FileManagerProps {
  files?: FileItem[];
  onFileOpen?: (file: FileItem) => void;
  onCreateFolder?: (name: string, parentId: string | null) => void;
  onCreateFile?: (name: string, parentId: string | null) => void;
  readOnly?: boolean;
  title?: string;
}

export function FileManager({
  files = [],
  onFileOpen,
  onCreateFolder,
  onCreateFile,
  readOnly = false,
  title = "Gestionnaire de fichiers",
}: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const currentFiles = files.filter((f) => f.parentId === currentPath);
  const filteredFiles = searchQuery
    ? currentFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentFiles;

  const getBreadcrumbs = () => {
    const breadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: "Accueil" }];
    let current = currentPath;
    const pathItems: { id: string; name: string }[] = [];
    
    while (current) {
      const folder = files.find((f) => f.id === current);
      if (folder) {
        pathItems.unshift({ id: folder.id, name: folder.name });
        current = folder.parentId;
      } else {
        break;
      }
    }
    
    return [...breadcrumbs, ...pathItems];
  };

  const navigateUp = () => {
    if (currentPath) {
      const currentFolder = files.find((f) => f.id === currentPath);
      setCurrentPath(currentFolder?.parentId || null);
    }
  };

  const handleItemClick = (item: FileItem) => {
    if (item.type === "folder") {
      setCurrentPath(item.id);
    } else if (onFileOpen) {
      onFileOpen(item);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-10 border-b flex items-center gap-1 px-2 bg-muted/50">
        <Button size="icon" variant="ghost" onClick={() => setCurrentPath(null)} data-testid="fm-home">
          <Home className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={navigateUp}
          disabled={!currentPath}
          data-testid="fm-up"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {getBreadcrumbs().map((crumb, index) => (
            <div key={crumb.id || "root"} className="flex items-center shrink-0">
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setCurrentPath(crumb.id)}
                data-testid={`fm-breadcrumb-${index}`}
              >
                {crumb.name}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            onClick={() => setViewMode("grid")}
            data-testid="fm-view-grid"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            onClick={() => setViewMode("list")}
            data-testid="fm-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="h-10 border-b flex items-center gap-2 px-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="h-7 pl-8 text-sm"
            data-testid="fm-search"
          />
        </div>
        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" data-testid="fm-new">
                <Plus className="h-4 w-4 mr-1" />
                Nouveau
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => onCreateFolder?.("Nouveau dossier", currentPath)}
                data-testid="fm-new-folder"
              >
                <Folder className="h-4 w-4 mr-2" />
                Dossier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onCreateFile?.("nouveau_fichier.txt", currentPath)}
                data-testid="fm-new-file"
              >
                <FileText className="h-4 w-4 mr-2" />
                Fichier texte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ScrollArea className="flex-1">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Aucun résultat trouvé" : "Ce dossier est vide"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-4">
            {filteredFiles.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="flex flex-col items-center gap-1 p-3 rounded-md hover-elevate active-elevate-2 text-center group"
                data-testid={`fm-item-${item.id}`}
              >
                {item.type === "folder" ? (
                  <Folder className="h-10 w-10 text-primary" />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground" />
                )}
                <span className="text-xs truncate w-full">{item.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {filteredFiles.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center gap-3 px-4 py-2 hover-elevate active-elevate-2 text-left"
                data-testid={`fm-item-${item.id}`}
              >
                {item.type === "folder" ? (
                  <Folder className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm truncate flex-1">{item.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Ouvrir</DropdownMenuItem>
                    {!readOnly && <DropdownMenuItem>Renommer</DropdownMenuItem>}
                    {!readOnly && (
                      <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="h-6 border-t bg-muted/50 flex items-center px-3 text-xs text-muted-foreground">
        {filteredFiles.length} élément{filteredFiles.length > 1 ? "s" : ""}
      </div>
    </div>
  );
}
