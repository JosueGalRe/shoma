import { describe, expect, it } from "bun:test";

import { buttonVariants } from "../src";

describe("buttonVariants", () => {
  it("keeps the default variant and default touch target size", () => {
    const className = buttonVariants();

    expect(className).toContain("bg-secondary");
    expect(className).toContain("border-primary");
    expect(className).toContain("text-primary");
    expect(className).toContain("min-h-[44px]");
    expect(className).toContain("focus-visible:ring-ring");
  });

  it("keeps every migrated visual variant", () => {
    expect(buttonVariants({ variant: "primary" })).toContain("text-primary");
    expect(buttonVariants({ variant: "secondary" })).toContain("text-muted");
    expect(buttonVariants({ variant: "destructive" })).toContain("text-destructive");
    expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-secondary");
    expect(buttonVariants({ variant: "link" })).toContain("hover:underline");
  });

  it("keeps every migrated size variant", () => {
    expect(buttonVariants({ size: "sm" })).toContain("min-h-[44px]");
    expect(buttonVariants({ size: "lg" })).toContain("h-11");
    expect(buttonVariants({ size: "lg" })).toContain("px-8");
    expect(buttonVariants({ size: "icon" })).toContain("h-11");
    expect(buttonVariants({ size: "icon" })).toContain("w-11");
  });

  it("preserves caller className composition", () => {
    expect(buttonVariants({ className: "w-full" })).toContain("w-full");
  });
});
