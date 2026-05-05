using System;
using System.Runtime.InteropServices;
using System.Threading;

namespace Conduit
{
    class Program
    {
        public static string APP_NAME = "Mimic Conduit";
        public static string VERSION = "2.2.0";

        public static string HUB_WS = "ws://localhost:51001/conduit";
        public static string HUB = "http://localhost:51001";

        private static App _instance;
        private static Mutex _mutex;

        private const int SW_RESTORE = 9;

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        private static extern bool IsIconic(IntPtr hWnd);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [STAThread]
        public static void Main()
        {
            bool createdNew;
            _mutex = new Mutex(true, "MimicConduit_SingleInstance", out createdNew);

            if (!createdNew)
            {
                ActivateExistingWindow();
                return;
            }

            // Start the application.
            _instance = new App();
            _instance.InitializeComponent();
            _instance.Run();

            _mutex.ReleaseMutex();
        }

        private static void ActivateExistingWindow()
        {
            IntPtr hWnd = FindWindow(null, "Mimic Conduit - About");
            if (hWnd != IntPtr.Zero)
            {
                if (IsIconic(hWnd))
                {
                    ShowWindow(hWnd, SW_RESTORE);
                }
                SetForegroundWindow(hWnd);
            }
        }
    }
}
