import { describe, expect, it } from "bun:test";
import { MobileOpcode, RiftOpcode } from "../src/index";

describe("protocol contract opcode stability", () => {
  it("keeps Rift opcodes stable", () => {
    expect(RiftOpcode.OPEN).toBe(1);
    expect(RiftOpcode.RECEIVE).toBe(8);
  });

  it("keeps Mobile opcodes stable", () => {
    expect(MobileOpcode.SECRET).toBe(1);
    expect(MobileOpcode.UPDATE).toBe(9);
  });
});
