export const RiftOpcode = {
  OPEN: 1,
  MSG: 2,
  CLOSE: 3,
  CONNECT: 4,
  CONNECT_PUBKEY: 5,
  SEND: 6,
  REPLY: 7,
  RECEIVE: 8
} as const;

export type RiftOpcode = typeof RiftOpcode[keyof typeof RiftOpcode];

export const MobileOpcode = {
  SECRET: 1,
  SECRET_RESPONSE: 2,
  VERSION: 3,
  VERSION_RESPONSE: 4,
  SUBSCRIBE: 5,
  UNSUBSCRIBE: 6,
  REQUEST: 7,
  RESPONSE: 8,
  UPDATE: 9
} as const;

export type MobileOpcode = typeof MobileOpcode[keyof typeof MobileOpcode];

export type RiftFrame = [RiftOpcode, ...unknown[]];
export type MobileFrame = [MobileOpcode, ...unknown[]];
