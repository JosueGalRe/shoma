import { afterEach, describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";

import { DatabaseLive, DatabaseService } from "../../src/core/database/database-service";
import { cleanupDbFiles, createTempDbPath } from "../helpers/db-test-helpers";

const dbFiles: string[] = [];

afterEach(() => {
  cleanupDbFiles(dbFiles);
});

describe("DatabaseLive", () => {
  it("provides an initialized service", async () => {
    const originalPath = Bun.env.LEYLINE_DB_PATH;
    const path = createTempDbPath("database-live");
    dbFiles.push(path);
    Bun.env.LEYLINE_DB_PATH = path;

    try {
      const program = Effect.gen(function* program() {
        const database = yield* DatabaseService;
        return yield* database.generateCode("test-pubkey");
      });

      const result = await Effect.runPromiseExit(Effect.provide(program, DatabaseLive));

      expect(Exit.isSuccess(result)).toBe(true);
      if (Exit.isSuccess(result)) {
        expect(result.value).toHaveLength(6);
      }
    } finally {
      Bun.env.LEYLINE_DB_PATH = originalPath;
    }
  });

  it("works after initialize is called explicitly", async () => {
    const originalPath = Bun.env.LEYLINE_DB_PATH;
    const path = createTempDbPath("database-live");
    dbFiles.push(path);
    Bun.env.LEYLINE_DB_PATH = path;

    try {
      const program = Effect.gen(function* program() {
        const database = yield* DatabaseService;
        yield* database.initialize;
        return yield* database.generateCode("test-pubkey");
      });

      const result = await Effect.runPromiseExit(Effect.provide(program, DatabaseLive));

      expect(Exit.isSuccess(result)).toBe(true);
      if (Exit.isSuccess(result)) {
        expect(result.value).toHaveLength(6);
      }
    } finally {
      Bun.env.LEYLINE_DB_PATH = originalPath;
    }
  });
});
