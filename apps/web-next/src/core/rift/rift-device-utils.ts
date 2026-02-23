const DEVICES = [
  { name: "Windows Phone", value: "Windows Phone" },
  { name: "Windows computer", value: "Win" },
  { name: "iPhone", value: "iPhone" },
  { name: "iPad", value: "iPad" },
  { name: "Kindle device", value: "Silk" },
  { name: "Android device", value: "Android" },
  { name: "PlayBook", value: "PlayBook" },
  { name: "BlackBerry", value: "BlackBerry" },
  { name: "macOS computer", value: "Mac" },
  { name: "Linux computer", value: "Linux" },
  { name: "Palm device", value: "Palm" }
] as const;

const BROWSERS = [
  { name: "Edge", value: "Edge" },
  { name: "Chrome", value: "Chrome" },
  { name: "Firefox", value: "Firefox" },
  { name: "Safari", value: "Safari" },
  { name: "Internet Explorer", value: "MSIE" },
  { name: "Opera", value: "Opera" },
  { name: "BlackBerry", value: "CLDC" },
  { name: "Mozilla", value: "Mozilla" }
] as const;

export function getDeviceDescription(): { browser: string; device: string } {
  const device = DEVICES.find((entry) => navigator.userAgent.includes(entry.value));
  const browser = BROWSERS.find((entry) => navigator.userAgent.includes(entry.value));

  return {
    browser: browser ? browser.name : "Unknown Browser",
    device: device ? device.name : "Unknown Device"
  };
}

export function getDeviceId(): string {
  const hasStorage = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  if (hasStorage) {
    const existing = window.localStorage.getItem("deviceID");
    if (existing) {
      return existing;
    }
  }

  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : ((random & 0x3) | 0x8);
    return value.toString(16);
  });

  if (hasStorage) {
    window.localStorage.setItem("deviceID", uuid);
  }

  return uuid;
}
