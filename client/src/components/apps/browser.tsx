import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, RotateCcw, Home, Search, BookOpen } from "lucide-react";

const EDUCATIONAL_SITES = [
    { name: "Pronote", url: "https://0288321.ac-jeanmoulin.fr/?login=true", icon: Home },
    { name: "eprofs - Physique", url: "https://eprofs.fr", icon: BookOpen },
  { name: "eprofs - Maths", url: "https://eprofs.fr", icon: BookOpen },
  { name: "Wikipédia", url: "https://fr.wikipedia.org", icon: BookOpen },
  { name: "Labomep", url: "https://labomep.sesamath.net", icon: BookOpen },
];

export function Browser() {
  const [url, setUrl] = useState("https://0288321.ac-jeanmoulin.fr/?login=true");
  const [inputUrl, setInputUrl] = useState("https://0288321.ac-jeanmoulin.fr/?login=true");
  const [history, setHistory] = useState<string[]>(["https://0288321.ac-jeanmoulin.fr/?login=true"]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigateTo = (newUrl: string) => {
    let formattedUrl = newUrl;
    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
      formattedUrl = "https://" + newUrl;
    }
    setUrl(formattedUrl);
    setInputUrl(formattedUrl);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(formattedUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setInputUrl(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setInputUrl(history[newIndex]);
    }
  };

  const refresh = () => {
    const iframe = document.getElementById("browser-iframe") as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const goHome = () => {
    navigateTo("https://www.google.fr");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(inputUrl);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-10 border-b flex items-center gap-1 px-2 bg-muted/50">
        <Button
          size="icon"
          variant="ghost"
          onClick={goBack}
          disabled={historyIndex <= 0}
          data-testid="browser-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          data-testid="browser-forward"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={refresh} data-testid="browser-refresh">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={goHome} data-testid="browser-home">
          <Home className="h-4 w-4" />
        </Button>
        <form onSubmit={handleSubmit} className="flex-1 flex gap-1">
          <Input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="h-7 text-sm"
            placeholder="Entrez une URL..."
            data-testid="browser-url-input"
          />
          <Button size="icon" variant="ghost" type="submit" data-testid="browser-go">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="h-8 border-b flex items-center gap-1 px-2 bg-muted/30 overflow-x-auto">
        {EDUCATIONAL_SITES.map((site) => (
          <Button
            key={site.url}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs shrink-0"
            onClick={() => navigateTo(site.url)}
            data-testid={`browser-bookmark-${site.name.toLowerCase().replace(/\s/g, "-")}`}
          >
            <site.icon className="h-3 w-3 mr-1" />
            {site.name}
          </Button>
        ))}
      </div>

      <div className="flex-1 relative">
        <iframe
          id="browser-iframe"
          src={url}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
          title="Navigateur"
          data-testid="browser-iframe"
        />
      </div>
    </div>
  );
}
