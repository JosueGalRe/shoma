import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Button, Card, Icon } from "@shoma/design-system";

interface UpdatePromptProps {
  version: string;
  date?: string;
  notes?: string;
  onDismiss: () => void;
}

export function UpdatePrompt({ version, date, notes, onDismiss }: UpdatePromptProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      setError(null);
      const update = await check();
      
      if (!update) {
        setError("No update found.");
        setIsInstalling(false);
        return;
      }
      
      let downloaded = 0;
      let contentLength = 0;
      
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            setProgress(0);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            setProgress(100);
            break;
        }
      });
      await relaunch();
    } catch (e) {
      console.error("Failed to install update:", e);
      setError(e instanceof Error ? e.message : String(e));
      setIsInstalling(false);
    }
  };

  const handleLater = () => {
    localStorage.setItem('conduit-dismissed-version', version);
    onDismiss();
  };

  return (
    <Card className="absolute bottom-4 right-4 left-4 z-50 flex flex-col gap-3 p-4 shadow-xl border border-[var(--shoma-border-gold)]/30 bg-[var(--conduit-surface)]/95 backdrop-blur-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[var(--shoma-primary)] font-semibold text-sm">
            <Icon name="download" size="sm" />
            <span>Update available: v{version}</span>
          </div>
          {date && <div className="text-xs text-[var(--shoma-muted)]">{new Date(date).toLocaleDateString()}</div>}
        </div>
        {!isInstalling && (
          <button onClick={handleLater} className="text-[var(--shoma-muted)] hover:text-[var(--shoma-text)] transition-colors cursor-pointer bg-transparent border-none p-1">
            <Icon name="x" size="sm" />
          </button>
        )}
      </div>

      {notes && (
        <div className="text-xs text-[var(--shoma-text)]/80 max-h-20 overflow-y-auto text-left">
          {notes}
        </div>
      )}

      {error && (
        <div className="text-xs text-[var(--shoma-destructive)] bg-[var(--shoma-destructive)]/10 p-2 rounded border border-[var(--shoma-destructive)]/20">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-1">
        {isInstalling ? (
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-1.5 bg-[var(--shoma-surface)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--shoma-primary)] transition-all duration-200 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-[var(--shoma-muted)] min-w-[3ch] text-right">{progress}%</span>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={handleLater} className="text-xs py-1 px-3 min-h-0">
              Later
            </Button>
            <Button variant="primary" onClick={handleInstall} className="text-xs py-1 px-3 min-h-0">
              {error ? "Retry" : "Install now"}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
