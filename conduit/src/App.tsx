import { useEffect, useReducer, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion, getTauriVersion } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-shell";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { AmbientBackground, Button, Card, Icon, Spinner } from "@shoma/design-system";
import QRCode from "qrcode";
import en from "./i18n/en.json";
import es from "./i18n/es.json";
import "./style.css";

type TranslationKey = keyof typeof en;
type Translations = Record<TranslationKey, string>;

const translations: Record<string, Translations> = { en, es };

const STORAGE_KEY = "conduit-language";

const getInitialLanguage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in translations) {
    return stored;
  }
  const browserLang = navigator.language.split("-")[0].toLowerCase();
  return browserLang in translations ? browserLang : "en";
};

const useI18n = () => {
  const [language, setLanguageState] = useState(getInitialLanguage);
  const dictionary = translations[language] ?? translations.en;

  const setLanguage = (lang: string) => {
    if (lang in translations) {
      localStorage.setItem(STORAGE_KEY, lang);
      setLanguageState(lang);
    }
  };

  const t = (key: TranslationKey) => dictionary[key] ?? translations.en[key];

  return { t, language, setLanguage };
};

export const APP_NAME = en["app.name"];

type Status = "Starting" | "Waiting" | "Connected" | "Paired" | "Error";

type ConnectionState = {
  state: string;
  code: string | null;
  url: string;
};

type AppState = {
  status: Status;
  accessCode: string | null;
  showSettings: boolean;
  isGeneratingCode: boolean;
  copied: boolean;
};

type AppAction =
  | { type: "INITIALIZE"; payload: Partial<AppState> }
  | { type: "SET_STATUS"; payload: Status }
  | { type: "SET_ACCESS_CODE"; payload: string | null }
  | { type: "SET_SHOW_SETTINGS"; payload: boolean }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_COPIED"; payload: boolean };

const initialAppState: AppState = {
  status: "Starting",
  accessCode: null,
  showSettings: false,
  isGeneratingCode: false,
  copied: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "INITIALIZE":
      return { ...state, ...action.payload };
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "SET_ACCESS_CODE":
      return { ...state, accessCode: action.payload };
    case "SET_SHOW_SETTINGS":
      return { ...state, showSettings: action.payload };
    case "SET_GENERATING":
      return { ...state, isGeneratingCode: action.payload };
    case "SET_COPIED":
      return { ...state, copied: action.payload };
    default:
      return state;
  }
};

type ConnectionStateChanged = {
  state: string;
};

type AccessCodeChanged = {
  code: string;
};

type AccessCodeGenerating = {
  generating: boolean;
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
  language,
  setLanguage,
}: {
  onClose: () => void;
  t: (key: TranslationKey) => string;
  language: string;
  setLanguage: (lang: string) => void;
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
    const fetchAutostartStatus = async () => {
      try {
        const enabled = await isEnabled();
        setLaunchAtStartup(enabled);
      } catch (e) {
        console.error("Failed to fetch autostart status", e);
      }
    };
    fetchAutostartStatus();
  }, []);

  const handleToggleAutostart = async (checked: boolean) => {
    try {
      if (checked) {
        await enable();
      } else {
        await disable();
      }
      setLaunchAtStartup(checked);
    } catch (e) {
      console.error("Failed to toggle autostart", e);
    }
  };

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
          <Icon name="settings" size="sm" tone="primary" />
          {t("settings.title")}
        </div>
        <button className="settings-close" onClick={onClose} title="Close">
          <Icon name="x" size="sm" />
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-item">
          <label className="settings-label">
            <input
              type="checkbox"
              checked={launchAtStartup}
              onChange={(e) => handleToggleAutostart(e.target.checked)}
              className="settings-checkbox"
            />
            {t("settings.launchAtStartup")}
          </label>
        </div>

        <div className="settings-item">
          <div className="settings-label">{t("settings.language")}</div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="settings-select"
          >
            <option value="en">{t("lang.en")}</option>
            <option value="es">{t("lang.es")}</option>
          </select>
        </div>

        <div className="settings-item">
          <div className="settings-label">{t("settings.version")}</div>
          <div className="settings-value">
            App: {appVersion || "..."} | Tauri: {tauriVersion || "..."}
          </div>
        </div>

        <div className="settings-links">
          <button
            type="button"
            onClick={() => open("https://github.com/molenzwiebel/Mimic")}
            className="settings-link"
          >
            GitHub
          </button>
          <span className="settings-link-separator">•</span>
          <button
            type="button"
            onClick={() => open("https://discord.gg/bfxdsRC")}
            className="settings-link"
          >
            Discord
          </button>
        </div>
      </div>

      <div className="settings-footer">
        <Button className="settings-back-button" onClick={onClose} variant="secondary">
          {t("settings.back")}
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const { t, language, setLanguage } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const connectionStateRef = useRef<ConnectionState | null>(null);

  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const win = getCurrentWindow();
    win.show()
      .then(() => win.setFocus())
      .catch((e) => console.error("failed to show/focus window:", e));
  }, []);

  useEffect(() => {
    const url = connectionStateRef.current?.url?.trim();
    if (state.accessCode && url && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `${url.replace(/\/$/, "")}/?code=${state.accessCode}`,
        {
          width: 100,
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
    } else if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [state.accessCode, showQR]);

  useEffect(() => {
    let mounted = true;
    const unlisteners: Array<() => void> = [];

    Promise.all([
      listen<ConnectionStateChanged>("connection-state-changed", (event) => {
        dispatch({ type: "SET_STATUS", payload: toStatus(event.payload.state) });
      }),
      listen<AccessCodeChanged>("access-code-changed", (event) => {
        dispatch({
          type: "INITIALIZE",
          payload: {
            accessCode: event.payload.code || null,
            isGeneratingCode: false,
          },
        });
      }),
      listen<AccessCodeGenerating>("access-code-generating", () => {
        dispatch({ type: "SET_GENERATING", payload: true });
      }),
    ])
      .then(([unlistenState, unlistenCode, unlistenGenerating]) => {
        if (!mounted) {
          unlistenState();
          unlistenCode();
          unlistenGenerating();
          return null;
        }

        unlisteners.push(unlistenState, unlistenCode, unlistenGenerating);
        return invoke<ConnectionState>("get_connection_state");
      })
      .then((connectionState) => {
        if (!connectionState || !mounted) {
          return;
        }

        connectionStateRef.current = connectionState;
        dispatch({
          type: "INITIALIZE",
          payload: {
            status: toStatus(connectionState.state),
            accessCode: connectionState.code ?? null,
            isGeneratingCode: false,
          },
        });
      })
      .catch((error) => {
        console.error("failed to load connection state", error);
        if (mounted) {
          dispatch({
            type: "INITIALIZE",
            payload: {
              status: "Error",
              isGeneratingCode: false,
            },
          });
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
    getCurrentWindow().close();
  };

  const handleCopyCode = async () => {
    if (!state.accessCode) return;
    try {
      await navigator.clipboard.writeText(state.accessCode);
      dispatch({ type: "SET_COPIED", payload: true });
      setTimeout(() => dispatch({ type: "SET_COPIED", payload: false }), 2000);
    } catch (e) {
      console.error("failed to copy code:", e);
    }
  };

  const getStatusColor = (s: Status) => {
    switch (s) {
      case "Starting":
        return "var(--status-starting)";
      case "Waiting":
        return "var(--status-waiting)";
      case "Connected":
        return "var(--status-connected)";
      case "Paired":
        return "var(--status-paired)";
      case "Error":
        return "var(--status-error)";
      default:
        return "var(--status-starting)";
    }
  };

  const getStatusText = (s: Status) => {
    switch (s) {
      case "Starting":
        return t("status.starting");
      case "Waiting":
        return t("status.waiting");
      case "Connected":
        return t("status.connected");
      case "Paired":
        return t("status.paired");
      case "Error":
        return t("status.error");
      default:
        return "Unknown Status";
    }
  };

  return (
    <AmbientBackground>
      <div data-tauri-drag-region className="titlebar">
        <div className="titlebar-title">{t("app.name")}</div>
        <div className="titlebar-controls">
          <button
            className="titlebar-button"
            onClick={() => dispatch({ type: "SET_SHOW_SETTINGS", payload: !state.showSettings })}
            title={t("settings.title")}
          >
            <Icon name="settings" size={12} />
          </button>
          <button className="titlebar-button" onClick={handleMinimize} title="Minimize">
            <Icon name="minus" size={12} />
          </button>
          <button className="titlebar-button close" onClick={handleClose} title="Close">
            <Icon name="x" size={12} />
          </button>
        </div>
      </div>
      <div className="content">
        <Card className="main-card">
          <div className="status-container">
            <div
              className="status-dot"
              style={{
                backgroundColor: getStatusColor(state.status),
                color: getStatusColor(state.status),
              }}
            ></div>
            <div className="status-text" style={{ color: getStatusColor(state.status) }}>
              {getStatusText(state.status)}
            </div>
          </div>

          {state.isGeneratingCode ? (
            <div className="generating-state">
              <Spinner label={t("status.generating")} />
              <div>{t("status.generating")}</div>
            </div>
          ) : (
            <>
              {showQR ? (
                <div className="qr-container">
                  <canvas ref={canvasRef} className="qr-canvas"></canvas>
                </div>
              ) : (
                <>
                  <div className="access-code">
                    {(state.accessCode ?? "------").split("").join(" ")}
                  </div>
                  <Button
                    className="copy-button"
                    onClick={handleCopyCode}
                    disabled={!state.accessCode || state.copied}
                    title={t("button.copy")}
                    variant="primary"
                  >
                    <Icon name={state.copied ? "check" : "copy"} size="sm" tone="primary" />
                    {state.copied ? t("button.copied") : t("button.copy")}
                  </Button>
                </>
              )}

              <Button
                variant="secondary"
                onClick={() => setShowQR(!showQR)}
                className="qr-toggle-button"
              >
                <Icon name={showQR ? "hash" : "qr-code"} size="sm" />
                {showQR ? t("button.showCode") : t("button.showQR")}
              </Button>
            </>
          )}
        </Card>
      </div>

      {state.showSettings && (
        <SettingsPanel
          onClose={() => dispatch({ type: "SET_SHOW_SETTINGS", payload: false })}
          t={t}
          language={language}
          setLanguage={setLanguage}
        />
      )}
    </AmbientBackground>
  );
}
