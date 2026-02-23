import { Card } from "@/components/ui/card";
import type { ConnectionCopy } from "../connect-types";

type StatusCardProps = {
  copy: ConnectionCopy;
};

export function StatusCard({ copy }: StatusCardProps) {
  return (
    <Card className="mt-8 rounded-2xl border-brass/40 bg-brass/10 p-5">
      <h2 className="font-display text-2xl text-ink">{copy.title}</h2>
      <p className="mt-2 text-slate-700">{copy.body}</p>
    </Card>
  );
}
