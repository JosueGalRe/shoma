import { expect, test } from "bun:test";
import { APP_NAME } from "./main";

test("exports the conduit app name", () => {
  expect(APP_NAME).toBe("Mimic Conduit");
});
