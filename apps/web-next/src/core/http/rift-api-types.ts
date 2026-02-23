export type RegisterConduitRequest = {
  pubkey: string;
};

export type RegisterConduitResponse = {
  ok: boolean;
  token?: string;
  error?: string;
};

export type CheckTokenResponse = boolean;

export type ProtocolHealthResponse = {
  riftOpcodesLoaded: boolean;
};
