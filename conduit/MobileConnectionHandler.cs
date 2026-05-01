using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Threading;
using WebSocketSharp;

namespace Conduit
{
    /**
     * This is the class that handles a direct talk with a mobile client. All messages are tunneled through
     * Rift, but that is transparent to this class. For all purposes, this class acts as if there is a direct
     * encrypted connection with the client (that somehow already knows our public key).
     */
    class MobileConnectionHandler
    {
        public delegate void SendMessageDelegate(string s);

        private LeagueConnection league;
        private byte[] key;
        private Dictionary<string, Regex> observedPaths = new Dictionary<string, Regex>();

        private SendMessageDelegate Send;
        private SendMessageDelegate SendRaw;

        public MobileConnectionHandler(LeagueConnection league, SendMessageDelegate send)
        {
            this.league = league;
            this.league.OnWebsocketEvent += HandleLeagueEvent;

            this.SendRaw = send;
            this.Send = msg => SendRaw("\"" + CryptoHelpers.EncryptAES(key, msg) + "\"");
        }

        /**
         * Called by the HubConnectionHandler when the connection with this mobile peer closes.
         */
        public void OnClose()
        {
            this.league.OnWebsocketEvent -= HandleLeagueEvent;
        }

        /**
         * Handles a message incoming through rift. First checks its opcode, then possibly decrypts the contents.
         */
        public void HandleMessage(dynamic msg)
        {
            try
            {
                DebugLogger.Global.WriteMessage($"Mobile message received. Encrypted={key != null}.");

                if (key != null)
                {
                    try
                    {
                        var contents = CryptoHelpers.DecryptAES(key, (string) msg);
                        DebugLogger.Global.WriteMessage($"Mobile decrypted message: {contents}");
                        this.HandleMimicMessage(SimpleJson.DeserializeObject(contents));
                    }
                    catch (Exception error)
                    {
                        DebugLogger.Global.WriteError($"Unable to decrypt or handle encrypted mobile message: {error.ToString()}");
                        return;
                    }
                }

                if (!(msg is JsonArray)) return;

                if (msg[0] == (long) MobileOpcode.Secret)
                {
                    DebugLogger.Global.WriteMessage("Mobile secret negotiation received.");
                    var info = CryptoHelpers.DecryptRSA((string) msg[1]);

                    if (info == null)
                    {
                        this.SendRaw("[" + MobileOpcode.SecretResponse + ",false]");
                        return;
                    }

                    dynamic contents = SimpleJson.DeserializeObject(info);
                    if (contents["secret"] == null || contents["identity"] == null || contents["device"] == null || contents["browser"] == null) return;

                    // If this device is already approved, immediately respond.
                    if (Persistence.IsDeviceApproved(contents["identity"]))
                    {
                        this.key = Convert.FromBase64String((string)contents["secret"]);
                        this.SendRaw("[" + (long) MobileOpcode.SecretResponse + ",true]");
                    }
                    else
                    {
                        // Note: UI prompt needs to happen on an STA thread.
                        var promptThread = new Thread(() =>
                        {
                            // Else, prompt the user.
                            var window = new DeviceConnectionPrompt((string)contents["device"], (string)contents["browser"], result =>
                            {
                                // If approved, save the device identity and set the key.
                                if (result)
                                {
                                    this.key = Convert.FromBase64String((string)contents["secret"]);
                                    Persistence.ApproveDevice(contents["identity"]);
                                }

                                // Send the result of the prompt to the device.
                                this.SendRaw("[" + (long)MobileOpcode.SecretResponse + "," + result.ToString().ToLower() + "]");
                            });

                            window.Show();
                            window.Focus();
                            Dispatcher.Run();
                        });
                        promptThread.SetApartmentState(ApartmentState.STA);
                        promptThread.Start();
                    }
                }
            }
            catch (Exception error)
            {
                DebugLogger.Global.WriteError($"Unhandled mobile message error: {error.ToString()}");
            }
        }

        /**
         * Handles a message post-decryption, which is the raw message sent by the mobile client.
         */
        private async void HandleMimicMessage(dynamic msg)
        {
            try
            {
                if (!(msg is JsonArray)) return;

                if (msg[0] == (long) MobileOpcode.Subscribe)
                {
                    var path = (string) msg[1];
                    DebugLogger.Global.WriteMessage($"Mobile subscribe: {path}");
                    if (!observedPaths.ContainsKey(path)) observedPaths.Add(path, new Regex(path));
                }
                else if (msg[0] == (long) MobileOpcode.Unsubscribe)
                {
                    var path = (string) msg[1];
                    DebugLogger.Global.WriteMessage($"Mobile unsubscribe: {path}");
                    if (observedPaths.ContainsKey(path)) observedPaths.Remove(path);
                }
                else if (msg[0] == (long) MobileOpcode.Request)
                {
                    var id = (long) msg[1];
                    var path = (string) msg[2];
                    var method = (string) msg[3];
                    var body = (string) msg[4];

                    DebugLogger.Global.WriteMessage($"Mobile request: id={id}, method={method}, path={path}");
                    var result = await league.Request(method, path, body);
                    var contents = await result.Content.ReadAsStringAsync();
                    if (contents.IsNullOrEmpty()) contents = "null";

                    DebugLogger.Global.WriteMessage($"Mobile response: id={id}, status={(long) result.StatusCode}");
                    Send("[" + (long) MobileOpcode.Response + "," + id + "," + (long) result.StatusCode + "," + contents + "]");
                }
                else if (msg[0] == (long) MobileOpcode.Version)
                {
                    DebugLogger.Global.WriteMessage("Mobile version request.");
                    Send("[" + (long) MobileOpcode.VersionResponse + ", \"" + Program.VERSION + "\", \"" + Environment.MachineName + "\"]");
                }
            }
            catch (Exception error)
            {
                DebugLogger.Global.WriteError($"Unhandled mimic message error: {error.ToString()}");
            }
        }

        /**
         * Handles an update coming from the League socket.
         */
        private void HandleLeagueEvent(OnWebsocketEventArgs ev)
        {
            if (!observedPaths.Values.Any(x => x.IsMatch(ev.Path))) return;

            var status = ev.Type.Equals("Create") || ev.Type.Equals("Update") ? 200 : 404;
            DebugLogger.Global.WriteMessage($"League event update: path={ev.Path}, type={ev.Type}, status={status}");
            Send("[" + (long) MobileOpcode.Update + ",\"" + ev.Path + "\"," + status + "," + (ev.Data != null ? ev.Data.ToString() : "null") + "]");
        }
    }

    enum MobileOpcode : long
    {
        // Mobile -> Conduit, sends encrypted shared secret.
        Secret = 1,

        // Conduit <- Mobile, sends result of secret negotiation. If true, rest of communications is encrypted.
        SecretResponse = 2,

        // Mobile -> Conduit, request version
        Version = 3,

        // Conduit <- Mobile, send version
        VersionResponse = 4,

        // Mobile -> Conduit, subscribe to LCU updates that match regex
        Subscribe = 5,

        // Mobile -> Conduit, unsibscribe to LCU updates that match regex
        Unsubscribe = 6,

        // Mobile -> Conduit, make LCU request
        Request = 7,

        // Conduit -> Mobile, response of a previous request message.
        Response = 8,

        // Conduit -> Mobile, when any subscribed endpoint gets an update
        Update = 9
    }
}
