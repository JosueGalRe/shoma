export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ConfigServiceShape {
  readonly jwtSecret: string;
  readonly databasePath: string;
  readonly port: number;
  readonly hostname: string;
  readonly logLevel: LogLevel;
  readonly logSilentInTests: boolean;
}
