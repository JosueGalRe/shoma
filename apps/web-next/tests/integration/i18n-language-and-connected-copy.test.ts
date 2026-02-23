import { describe, expect, it } from "bun:test";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "../../src/i18n/resources";

async function createTestI18n() {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

  return i18n;
}

describe("i18n language switching and connected copy", () => {
  it("switches from English to Spanish", async () => {
    const i18n = await createTestI18n();

    expect(i18n.t("connect.heading")).toBe("League control, modern stack");

    await i18n.changeLanguage("es");

    expect(i18n.t("connect.heading")).toBe("Control de League, stack moderno");
  });

  it("resolves connected value templates with interpolated values", async () => {
    const i18n = await createTestI18n();

    const versionCopy = i18n.t("connected.versionValue", { value: "1.2.3" });
    const membersCopy = i18n.t("connected.membersValue", { value: 5 });

    expect(versionCopy).toContain("1.2.3");
    expect(membersCopy).toContain("5");
  });
});
