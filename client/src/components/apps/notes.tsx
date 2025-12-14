import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, FileText } from "lucide-react";
import type { StudentNote } from "@shared/schema";

interface NotesAppProps {
  notes?: StudentNote[];
  onSave?: (note: { id?: string; title: string; content: string }) => void;
  onDelete?: (id: string) => void;
}

export function NotesApp({ notes = [], onSave, onDelete }: NotesAppProps) {
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleNewNote = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
  };

  const handleSelectNote = (note: StudentNote) => {
    setSelectedNote(note.id);
    setTitle(note.title);
    setContent(note.content || "");
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: selectedNote || undefined,
        title: title || "Sans titre",
        content,
      });
    }
  };

  const handleDelete = () => {
    if (selectedNote && onDelete) {
      onDelete(selectedNote);
      handleNewNote();
    }
  };

  return (
    <div className="flex h-full bg-background">
      <div className="w-48 border-r flex flex-col">
        <div className="p-2 border-b">
          <Button size="sm" className="w-full" onClick={handleNewNote} data-testid="notes-new">
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle note
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {notes.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune note
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`w-full text-left p-2 rounded-md text-sm hover-elevate ${
                    selectedNote === note.id ? "bg-muted" : ""
                  }`}
                  data-testid={`notes-item-${note.id}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{note.title}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-10 border-b flex items-center gap-2 px-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la note"
            className="h-7 border-0 focus-visible:ring-0 text-sm font-medium"
            data-testid="notes-title"
          />
          <Button size="sm" onClick={handleSave} data-testid="notes-save">
            Enregistrer
          </Button>
          {selectedNote && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              data-testid="notes-delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez votre note ici..."
          className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0"
          data-testid="notes-content"
        />
      </div>
    </div>
  );
}
