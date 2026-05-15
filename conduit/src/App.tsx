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
  inline = false,
}: {
  onClose: () => void;
  t: (key: TranslationKey) => string;
  language: string;
  setLanguage: (lang: string) => void;
  inline?: boolean;
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
    <div className={inline ? "settings-inline" : "settings-overlay"} style={inline ? { padding: 0, background: 'transparent' } : {}}>
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

function PrototypeSwitcher({ currentVariant, onSelect }: { currentVariant: string, onSelect: (v: string) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, background: 'rgba(0,0,0,0.8)', padding: 8, borderRadius: 20, zIndex: 9999 }}>
      <div style={{ color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', marginRight: '4px' }}>PROTOTYPE</div>
      {['A', 'B', 'C'].map(v => (
        <button 
          key={v}
          onClick={() => onSelect(v)}
          style={{ 
            background: currentVariant === v ? 'var(--color-primary, #c8aa6e)' : 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: currentVariant === v ? 'bold' : 'normal'
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const { t, language, setLanguage } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const connectionStateRef = useRef<ConnectionState | null>(null);
  
  const [variant, setVariant] = useState(() => new URLSearchParams(window.location.search).get('variant') || 'A');
  const [showQR, setShowQR] = useState(false);

  const updateVariant = (v: string) => {
    setVariant(v);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.pushState({}, '', url);
  };

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
  }, [state.accessCode, variant, showQR]);

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

  const renderMainContent = () => {
    if (state.isGeneratingCode) {
      return (
        <div className="generating-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 0' }}>
          <Spinner label={t("status.generating")} />
          <div>{t("status.generating")}</div>
        </div>
      );
    }

    if (variant === 'A') {
      // Variant A: Vertical Stack (Current)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="access-code" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary, #c8aa6e)', letterSpacing: '4px' }}>
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
          <div className="qr-container" style={{ background: 'white', padding: '8px', borderRadius: '8px' }}>
            <canvas ref={canvasRef} className="qr-canvas" style={{ display: 'block' }}></canvas>
          </div>
        </div>
      );
    }

    if (variant === 'B') {
      // Variant B: Horizontal Split (Mimic style)
      return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center', width: '100%', padding: '8px 0' }}>
          <div className="qr-container" style={{ background: 'white', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
            <canvas ref={canvasRef} className="qr-canvas" style={{ display: 'block', width: '100px', height: '100px' }}></canvas>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.2 }}>Scan QR or enter code:</div>
            <div className="access-code" style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-primary, #c8aa6e)', letterSpacing: '2px' }}>
              {(state.accessCode ?? "------").split("").join(" ")}
            </div>
            <Button
              className="copy-button"
              onClick={handleCopyCode}
              disabled={!state.accessCode || state.copied}
              title={t("button.copy")}
              variant="secondary"
              style={{ padding: '4px 12px', fontSize: '0.85rem', minHeight: '32px' }}
            >
              <Icon name={state.copied ? "check" : "copy"} size="sm" />
              {state.copied ? t("button.copied") : t("button.copy")}
            </Button>
          </div>
        </div>
      );
    }

    // Variant C: Minimalist / Flip
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '16px 0' }}>
        <div className="qr-container" style={{ display: showQR ? 'block' : 'none', background: 'white', padding: '12px', borderRadius: '12px', transform: 'scale(1.1)' }}>
          <canvas ref={canvasRef} className="qr-canvas" style={{ display: 'block' }}></canvas>
        </div>
        
        {!showQR && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div className="access-code" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary, #c8aa6e)', letterSpacing: '6px' }}>
              {(state.accessCode ?? "------").split("").join(" ")}
            </div>
            <Button
              className="copy-button"
              onClick={handleCopyCode}
              disabled={!state.accessCode || state.copied}
              title={t("button.copy")}
              variant="secondary"
            >
              <Icon name={state.copied ? "check" : "copy"} size="sm" />
              {state.copied ? t("button.copied") : t("button.copy")}
            </Button>
          </div>
        )}
        
        <Button 
          variant={showQR ? "secondary" : "primary"} 
          onClick={() => setShowQR(!showQR)}
          style={{ width: '100%' }}
        >
          <Icon name={showQR ? "hash" : "qr-code"} size="sm" tone={showQR ? "default" : "primary"} />
          {showQR ? "Show Access Code" : "Show QR Code"}
        </Button>
      </div>
    );
  };

  return (
    <AmbientBackground>
      <PrototypeSwitcher currentVariant={variant} onSelect={updateVariant} />
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
      <div className="content" style={{ perspective: '1000px' }}>
        <Card 
          className="main-card" 
          style={{ 
            transition: 'transform 0.6s', 
            transformStyle: 'preserve-3d',
            transform: variant === 'C' && state.showSettings ? 'rotateY(180deg)' : 'none',
            position: 'relative',
            width: '100%'
          }}
        >
          {/* Front of card */}
          <div style={{ 
            backfaceVisibility: 'hidden',
            display: variant === 'C' && state.showSettings ? 'none' : 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div className="status-container" style={{ alignSelf: variant === 'B' ? 'flex-start' : 'center' }}>
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
            
            {renderMainContent()}
            
            {/* Variant B Inline Settings */}
            {variant === 'B' && state.showSettings && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '8px' }}>
                <SettingsPanel
                  onClose={() => dispatch({ type: "SET_SHOW_SETTINGS", payload: false })}
                  t={t}
                  language={language}
                  setLanguage={setLanguage}
                  inline={true}
                />
              </div>
            )}
          </div>

          {/* Back of card (Variant C Settings) */}
          {variant === 'C' && state.showSettings && (
            <div style={{ 
              backfaceVisibility: 'hidden', 
              transform: 'rotateY(180deg)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <SettingsPanel
                onClose={() => dispatch({ type: "SET_SHOW_SETTINGS", payload: false })}
                t={t}
                language={language}
                setLanguage={setLanguage}
                inline={true}
              />
            </div>
          )}
        </Card>
      </div>
      
      {/* Variant A Overlay Settings */}
      {variant === 'A' && state.showSettings && (
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
