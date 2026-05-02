## Conduit Configuration Guide for Local Rift Server

**Discovered:** 2026-05-02
**Context:** User needs to connect Windows Conduit to local Rift server running on Linux at `172.25.208.230:51001`

### Current State
- Rift-next server running on `172.25.208.230:51001`
- Database empty (no conduit registrations)
- Conduit source code shows hardcoded `localhost:51001` in `Program.cs`
- Mobile attempts show `mobile_connect_no_conduit` — conduit never registered

### Three Possible Scenarios & Solutions

#### Scenario A: Using Official .exe from mimic.lol (Hardcoded to Production)
The release build points to production servers. Two options:

**Option A1: Edit Windows hosts file** (no recompile needed)
```
# File: C:\Windows\System32\drivers\etc\hosts
# Add these lines:
172.25.208.230  rift.mimic.lol
172.25.208.230  mimic.lol
```
Then flush DNS: `ipconfig /flushdns`
Restart Conduit.

**Option A2: Rebuild from source**
1. Open `conduit/Conduit.csproj` in Visual Studio
2. Edit `Program.cs`, change:
   ```csharp
   public static string HUB_WS = "ws://172.25.208.230:51001/conduit";
   public static string HUB = "http://172.25.208.230:51001";
   ```
3. Build Release → produces `MimicConduit.exe`

#### Scenario B: Compiled from source but on different machine
If you compiled the source but Conduit runs on Windows and Rift on Linux:

The current code has:
```csharp
public static string HUB_WS = "ws://localhost:51001/conduit";
```

Change to the Linux machine's IP:
```csharp
public static string HUB_WS = "ws://172.25.208.230:51001/conduit";
public static string HUB = "http://172.25.208.230:51001";
```

Then rebuild and run the new .exe.

#### Scenario C: Same machine, but firewall blocking
If both are on the same machine but connection fails:

1. Check Windows Defender Firewall allows outbound to `172.25.208.230:51001`
2. Check Linux firewall: `sudo ufw allow 51001/tcp`
3. Test connectivity: from Windows PowerShell:
   ```powershell
   Test-NetConnection -ComputerName 172.25.208.230 -Port 51001
   ```

### Verification Steps
1. Restart Conduit after any change
2. Check Rift logs for `conduit_open` event (not `mobile_connect_no_conduit`)
3. Check database: `sqlite3 database.db "SELECT * FROM conduit_instances;"` should show 1 row
4. On web app, enter the 6-digit code shown by Conduit
5. Approve the device prompt on Windows
6. Should see `CONNECTED` state in web UI

### Notes
- The source code already uses `localhost:51001` which is correct for same-machine setups
- For cross-machine setups, IP substitution is required
- The official release likely uses production URLs (mimic.lol) and requires hosts-file hack or recompile
- JWT token is persisted in `%APPDATA%/Mimic` — delete this folder to force re-registration with new server
