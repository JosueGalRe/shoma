import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import QRCode from "qrcode";

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
  
  let hubCode = "------";
  try {
    hubCode = await invoke<string>("get_hub_code");
  } catch (e) {
    console.error("Failed to get hub code:", e);
  }

  const qrCodeDataUrl = await QRCode.toDataURL(`https://remote.mimic.lol/${hubCode}`, {
    color: {
      dark: "#f4f0e8",
      light: "#00000000"
    },
    margin: 1,
    width: 200
  });

  root.innerHTML = `
    <main style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#0e1116 0%,#090b0f 100%);color:#f4f0e8;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;padding:20px;box-sizing:border-box;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:rgba(255,255,255,0.1);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:24px;">
          M
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;">${APP_NAME}</h1>
        <div style="margin-top:4px;font-size:14px;color:rgba(244,240,232,0.5);">v${version}</div>
      </div>

      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(244,240,232,0.14);border-radius:16px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;max-width:300px;">
        <div style="text-align:center;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(244,240,232,0.5);margin-bottom:8px;">Connection Code</div>
          <div style="font-size:32px;font-weight:700;letter-spacing:0.2em;background:rgba(0,0,0,0.2);padding:8px 16px;border-radius:8px;">${hubCode}</div>
        </div>
        
        <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:12px;">
          <img src="${qrCodeDataUrl}" alt="QR Code" style="display:block;width:200px;height:200px;" />
        </div>
      </div>

      <button id="close-btn" style="margin-top:32px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#f4f0e8;padding:8px 24px;border-radius:8px;font-family:inherit;font-size:14px;cursor:pointer;transition:background 0.2s;">
        Close
      </button>
    </main>
  `;

  const closeBtn = document.getElementById("close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      getCurrentWindow().close();
    });
    closeBtn.addEventListener("mouseover", () => {
      closeBtn.style.background = "rgba(255,255,255,0.15)";
    });
    closeBtn.addEventListener("mouseout", () => {
      closeBtn.style.background = "rgba(255,255,255,0.1)";
    });
  }
}

void mountApp();
