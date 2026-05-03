import { getVersion } from "@tauri-apps/api/app";

export const APP_NAME = "Mimic Conduit";

async function mountApp() {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.getElementById("app");
  if (!root) {
    return;
  }

  const version = await getVersion().catch(() => "dev");

  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:linear-gradient(180deg,#0e1116 0%,#090b0f 100%);color:#f4f0e8;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
      <section style="border:1px solid rgba(244,240,232,0.14);border-radius:20px;padding:24px 28px;background:rgba(255,255,255,0.04);box-shadow:0 24px 80px rgba(0,0,0,0.45);min-width:280px;">
        <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.72;margin-bottom:10px;">Mimic Conduit</div>
        <div style="font-size:28px;line-height:1.05;font-weight:700;margin-bottom:10px;">Placeholder shell</div>
        <p style="margin:0;color:rgba(244,240,232,0.72);font-size:14px;line-height:1.5;max-width:26ch;">Tray actions, dialogs, and notifications will live here.</p>
        <div style="margin-top:18px;font-size:12px;color:rgba(244,240,232,0.5);">Tauri ${version}</div>
      </section>
    </main>
  `;
}

void mountApp();
