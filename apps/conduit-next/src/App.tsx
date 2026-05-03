import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

export const APP_NAME = "Mimic Conduit";

export default function App() {
  const [version, setVersion] = useState("dev");

  useEffect(() => {
    void getVersion()
      .then(setVersion)
      .catch(() => setVersion("dev"));
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(180deg,#0e1116 0%,#090b0f 100%)", color: "#f4f0e8", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
      <section style={{ border: "1px solid rgba(244,240,232,0.14)", borderRadius: 20, padding: "24px 28px", background: "rgba(255,255,255,0.04)", boxShadow: "0 24px 80px rgba(0,0,0,0.45)", minWidth: 280 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.72, marginBottom: 10 }}>{APP_NAME}</div>
        <div style={{ fontSize: 28, lineHeight: 1.05, fontWeight: 700, marginBottom: 10 }}>React shell</div>
        <p style={{ margin: 0, color: "rgba(244,240,232,0.72)", fontSize: 14, lineHeight: 1.5, maxWidth: "26ch" }}>Tray actions, dialogs, and notifications will live here.</p>
        <div style={{ marginTop: 18, fontSize: 12, color: "rgba(244,240,232,0.5)" }}>Tauri {version}</div>
      </section>
    </main>
  );
}
