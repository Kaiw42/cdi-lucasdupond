import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  FileText,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TextEditorProps {
  initialContent?: string;
  fileName?: string;
  onSave?: (content: string, fileName: string) => void;
}

export function TextEditor({ initialContent = "", fileName = "nouveau_document.txt", onSave }: TextEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [currentFileName, setCurrentFileName] = useState(fileName);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(content, currentFileName);
    }
    setHasChanges(false);
    toast({
      title: "Document enregistré",
      description: `${currentFileName} a été sauvegardé.`,
    });
  };

  const handleNew = () => {
    setContent("");
    setCurrentFileName("nouveau_document.txt");
    setHasChanges(false);
  };

  const lineCount = content.split("\n").length;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-10 border-b flex items-center gap-1 px-2 bg-muted/50">
        <Button size="icon" variant="ghost" onClick={handleNew} data-testid="editor-new">
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleSave} data-testid="editor-save">
          <Save className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button size="icon" variant="ghost" data-testid="editor-bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" data-testid="editor-italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" data-testid="editor-underline">
          <Underline className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button size="icon" variant="ghost" data-testid="editor-align-left">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" data-testid="editor-align-center">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" data-testid="editor-align-right">
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Input
            value={currentFileName}
            onChange={(e) => setCurrentFileName(e.target.value)}
            className="h-7 w-40 text-xs"
            data-testid="editor-filename"
          />
        </div>
      </div>
      <div className="flex-1 flex">
        <div className="w-12 bg-muted/30 border-r flex flex-col items-end py-2 px-2 text-xs text-muted-foreground font-mono">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="h-5 leading-5">
              {i + 1}
            </div>
          ))}
        </div>
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0 font-mono text-sm leading-5"
          placeholder="Commencez à écrire..."
          data-testid="editor-content"
        />
      </div>
      <div className="h-6 border-t bg-muted/50 flex items-center justify-between px-3 text-xs text-muted-foreground">
        <span>{lineCount} ligne{lineCount > 1 ? "s" : ""}</span>
        <span>{hasChanges ? "Non enregistré" : "Enregistré"}</span>
      </div>
    </div>
  );
}
