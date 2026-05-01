using System;

namespace Conduit
{
    class Program
    {
        public static string APP_NAME = "Mimic Conduit";
        public static string VERSION = "2.2.0";

        public static string HUB_WS = "ws://localhost:51001/conduit";
        public static string HUB = "http://localhost:51001";

        private static App _instance;

        [STAThread]
        public static void Main()
        {
            // Start the application.
            _instance = new App();
            _instance.InitializeComponent();
            _instance.Run();
        }
    }
}
