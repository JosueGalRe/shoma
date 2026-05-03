import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import QRCode from "qrcode";
import "./style.css";

export const APP_NAME = "Mimic Conduit";

type Status = "Starting" | "Waiting" | "Connected" | "Paired" | "Error";

type ConnectionState = {
  state: string;
  code: string | null;
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

export default function App() {
  const [status, setStatus] = useState<Status>("Starting");
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    if (accessCode) {
      QRCode.toCanvas(
        canvasRef.current,
        `https://remote.mimic.lol/${accessCode}`,
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
  }, [accessCode]);

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
      case "Starting": return "Starting...";
      case "Waiting": return "Waiting for League Client";
      case "Connected": return "Connected to Client";
      case "Paired": return "Paired with Phone";
      case "Error": return "Connection Error";
      default: return "Unknown Status";
    }
  };

  return (
    <>
      <div data-tauri-drag-region className="titlebar">
        <div className="titlebar-title">{APP_NAME}</div>
        <div className="titlebar-controls">
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
    </>
  );
}
