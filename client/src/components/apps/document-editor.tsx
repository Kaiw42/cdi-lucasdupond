import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  FileText,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Printer,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DocumentEditorProps {
  initialContent?: string;
  initialFileName?: string;
  fileId?: string;
  onSave?: (content: string, fileName: string, fileId?: string) => void;
  readOnly?: boolean;
}

export function DocumentEditor({
  initialContent = "",
  initialFileName = "Sans titre.txt",
  fileId,
  onSave,
  readOnly = false,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [fileName, setFileName] = useState(initialFileName);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(content, fileName, fileId);
        setHasChanges(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 2rem; white-space: pre-wrap; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-10 border-b flex items-center gap-1 px-2 bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          <FileText className="h-4 w-4 text-primary" />
          <Input
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value);
              setHasChanges(true);
            }}
            className="h-7 max-w-[200px] text-sm font-medium"
            disabled={readOnly}
            data-testid="doc-filename"
          />
          {hasChanges && (
            <Badge variant="secondary" className="text-xs">
              Non sauvegardé
            </Badge>
          )}
        </div>
        {!readOnly && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            data-testid="doc-save"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "..." : "Sauvegarder"}
          </Button>
        )}
      </div>

      <div className="h-9 border-b flex items-center gap-1 px-2 bg-muted/20">
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled data-testid="doc-undo">
          <Undo className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled data-testid="doc-redo">
          <Redo className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled data-testid="doc-bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled data-testid="doc-italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled data-testid="doc-underline">
          <Underline className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled data-testid="doc-align-left">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled data-testid="doc-align-center">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled data-testid="doc-align-right">
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handlePrint} data-testid="doc-print">
          <Printer className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden p-4 bg-muted/10">
        <div className="h-full max-w-4xl mx-auto bg-card border rounded-md shadow-sm overflow-hidden">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Commencez à écrire..."
            className="w-full h-full resize-none border-0 focus-visible:ring-0 p-6 text-base leading-relaxed font-serif"
            readOnly={readOnly}
            data-testid="doc-content"
          />
        </div>
      </div>

      <div className="h-6 border-t bg-muted/50 flex items-center justify-between px-3 text-xs text-muted-foreground">
        <span>{wordCount} mots, {charCount} caractères</span>
        <span>{readOnly ? "Lecture seule" : "Édition"}</span>
      </div>
    </div>
  );
}
