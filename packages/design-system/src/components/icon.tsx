import type { ComponentProps } from "react";

import { DynamicIcon } from "lucide-react/dynamic";

import type { SemanticTokenName } from "../tokens";

const iconSizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSize = keyof typeof iconSizeMap | number;

export interface IconProps extends Omit<ComponentProps<typeof DynamicIcon>, "name" | "size" | "color"> {
  name: ComponentProps<typeof DynamicIcon>["name"];
  size?: IconSize;
  tone?: SemanticTokenName;
}

export function Icon({
  name,
  size = "md",
  tone = "foreground",
  className,
  ...props
}: IconProps) {
  const resolvedSize = typeof size === "number" ? size : iconSizeMap[size];

  return (
    <DynamicIcon
      {...props}
      className={["shrink-0", className].filter(Boolean).join(" ")}
      color={`var(--shoma-${tone})`}
      name={name}
      size={resolvedSize}
    />
  );
}
