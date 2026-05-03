import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion, getTauriVersion } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-shell";
import QRCode from "qrcode";
import en from "./i18n/en.json";
import es from "./i18n/es.json";
import "./style.css";

type TranslationKey = keyof typeof en;
type Translations = Record<TranslationKey, string>;

const translations: Record<string, Translations> = { en, es };

const getBrowserLanguage = () => {
  const language = navigator.language.split("-")[0].toLowerCase();
  return language in translations ? language : "en";
};

const useI18n = () => {
  const [language] = useState(getBrowserLanguage);
  const dictionary = translations[language] ?? translations.en;

  return (key: TranslationKey) => dictionary[key] ?? translations.en[key];
};

export const APP_NAME = en["app.name"];

type Status = "Starting" | "Waiting" | "Connected" | "Paired" | "Error";

type ConnectionState = {
  state: string;
  code: string | null;
  url: string;
};

type ConnectionStateChanged = {
  state: string;
};

type AccessCodeChanged = {
  code: string;
};

const toStatus = (state: string): Status => {
  switch (state) {
    case "Starting":
    case "Waiting":
    case "Connected":
    case "Paired":
    case "Error":
      return state;
    default:
      return "Starting";
  }
};

function SettingsPanel({
  onClose,
  t,
}: {
  onClose: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [launchAtStartup, setLaunchAtStartup] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const [tauriVersion, setTauriVersion] = useState<string>("");

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const appVer = await getVersion();
        const tauriVer = await getTauriVersion();
        setAppVersion(appVer);
        setTauriVersion(tauriVer);
      } catch (e) {
        console.error("Failed to fetch versions", e);
      }
    };
    fetchVersions();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="settings-overlay">
      <div className="settings-header">
        <div className="settings-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          {t("settings.title")}
        </div>
        <button className="settings-close" onClick={onClose} title="Close">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      
      <div className="settings-content">
        <div className="settings-item">
          <label className="settings-label">
            <input 
              type="checkbox" 
              checked={launchAtStartup} 
              onChange={(e) => setLaunchAtStartup(e.target.checked)} 
              className="settings-checkbox"
            />
            {t("settings.launchAtStartup")}
          </label>
        </div>

        <div className="settings-item">
          <div className="settings-label">{t("settings.version")}</div>
          <div className="settings-value">
            App: {appVersion || "..."} | Tauri: {tauriVersion || "..."}
          </div>
        </div>

        <div className="settings-links">
          <a href="#" onClick={(e) => { e.preventDefault(); open('https://github.com/molenzwiebel/Mimic'); }} className="settings-link">GitHub</a>
          <span className="settings-link-separator">•</span>
          <a href="#" onClick={(e) => { e.preventDefault(); open('https://discord.gg/bfxdsRC'); }} className="settings-link">Discord</a>
        </div>
      </div>

      <div className="settings-footer">
        <button className="settings-back-button" onClick={onClose}>{t("settings.back")}</button>
      </div>
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState<Status>("Starting");
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const t = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const url = connectionState?.url?.trim();
    if (accessCode && url) {
      QRCode.toCanvas(
        canvasRef.current,
        `${url.replace(/\/$/, "")}/?code=${accessCode}`,
        {
          width: 120,
          margin: 0,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) console.error(error);
        }
      );
    } else {
      const context = canvasRef.current.getContext("2d");
      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [accessCode, connectionState?.url]);

  useEffect(() => {
    let mounted = true;
    const unlisteners: Array<() => void> = [];

    const setupConnectionState = async () => {
      const [unlistenState, unlistenCode] = await Promise.all([
        listen<ConnectionStateChanged>("connection-state-changed", (event) => {
          setStatus(toStatus(event.payload.state));
        }),
        listen<AccessCodeChanged>("access-code-changed", (event) => {
          setAccessCode(event.payload.code || null);
        }),
      ]);

      if (!mounted) {
        unlistenState();
        unlistenCode();
        return;
      }

      unlisteners.push(unlistenState, unlistenCode);

      const connectionState = await invoke<ConnectionState>("get_connection_state");
      if (mounted) {
        setConnectionState(connectionState);
        setStatus(toStatus(connectionState.state));
        setAccessCode(connectionState.code ?? null);
      }
    };

    setupConnectionState().catch((error) => {
      console.error("failed to load connection state", error);
      if (mounted) {
        setStatus("Error");
      }
    });

    return () => {
      mounted = false;
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, []);

  const handleMinimize = () => {
    getCurrentWindow().minimize();
  };

  const handleClose = () => {
    getCurrentWindow().hide();
  };

  const getStatusColor = (s: Status) => {
    switch (s) {
      case "Starting": return "var(--status-starting)";
      case "Waiting": return "var(--status-waiting)";
      case "Connected": return "var(--status-connected)";
      case "Paired": return "var(--status-paired)";
      case "Error": return "var(--status-error)";
      default: return "var(--status-starting)";
    }
  };

  const getStatusText = (s: Status) => {
    switch (s) {
      case "Starting": return t("status.starting");
      case "Waiting": return t("status.waiting");
      case "Connected": return t("status.connected");
      case "Paired": return t("status.paired");
      case "Error": return t("status.error");
      default: return "Unknown Status";
    }
  };

  return (
    <>
      <div data-tauri-drag-region className="titlebar">
        <div className="titlebar-title">{t("app.name")}</div>
        <div className="titlebar-controls">
          <button className="titlebar-button" onClick={() => setShowSettings(true)} title={t("settings.title")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button className="titlebar-button" onClick={handleMinimize} title="Minimize">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="6" width="8" height="1" fill="currentColor" />
            </svg>
          </button>
          <button className="titlebar-button close" onClick={handleClose} title="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className="content">
        <div className="status-container">
          <div className="status-dot" style={{ backgroundColor: getStatusColor(status) }}></div>
          <div className="status-text" style={{ color: getStatusColor(status) }}>{getStatusText(status)}</div>
        </div>
        <div className="access-code">{(accessCode ?? "------").split('').join(' ')}</div>
        <div className="qr-container">
          <canvas ref={canvasRef} className="qr-canvas"></canvas>
        </div>
      </div>
      {showSettings && (
        <SettingsPanel 
          onClose={() => setShowSettings(false)} 
          t={t} 
        />
      )}
    </>
  );
}
