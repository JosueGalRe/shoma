# conduit KNOWLEDGE BASE

**Generated:** 2026-05-01

## OVERVIEW
Windows desktop bridge for Mimic. C# .NET Framework 4.6.1 WPF tray app that proxies between the local League Client (LCU) and the mobile web UI via Rift.

## STRUCTURE
```
conduit/
├── Program.cs                # Entry: WPF app bootstrap
├── App.xaml.cs               # Tray icon, settings, manager startup
├── ConnectionManager.cs      # Orchestrates League + Rift connections
├── LeagueConnection.cs       # LCU API + WebSocket client
├── LeagueUtils.cs            # Process detection + WMI command-line parsing
├── HubConnectionHandler.cs   # Rift hub socket handler
├── MobileConnectionHandler.cs# Per-device encryption + approval
├── CryptoHelpers.cs          # RSA + AES utilities
├── Persistence.cs            # `%APPDATA%/Mimic` storage
├── AboutWindow.xaml.cs       # QR code + settings UI
└── DeviceConnectionPrompt.xaml.cs # Desktop approval dialog
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App bootstrap | `Program.cs` | WPF entry |
| Tray + settings | `App.xaml.cs` | Notification + about window |
| LCU connection | `LeagueConnection.cs` | HTTPS + WebSocket to local LCU |
| League detection | `LeagueUtils.cs` | Process + WMI parsing |
| Rift orchestration | `ConnectionManager.cs` | JWT + hub socket lifecycle |
| Encryption | `CryptoHelpers.cs` | RSA keypair + AES-CBC |
| Device approval | `MobileConnectionHandler.cs` | Handshake + allow-list |
| Persistence | `Persistence.cs` | Token, keys, approved devices |

## CONVENTIONS
- **Framework:** .NET Framework 4.6.1, WPF
- **Build:** Visual Studio / MSBuild (`Conduit.csproj`)
- **Dependencies:** `websocket-sharp`, `Newtonsoft.Json` (NuGet)
- **Excluded from modern lint/format:** C# codebase; not covered by JS/TS tooling

## ANTI-PATTERNS
- TLS cert validation is bypassed for LCU (`ServerCertificateCustomValidationCallback = true`)
- AES mode is CBC without explicit integrity/MAC in protocol framing
- Do not hardcode production Rift URLs; use constants in `Program.cs`
