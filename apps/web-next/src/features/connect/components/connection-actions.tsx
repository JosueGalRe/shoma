import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type ConnectionActionsProps = {
  mode: "failure" | "pending";
  onRetry: () => void;
  onCancel: () => void;
};

export function ConnectionActions({ mode, onRetry, onCancel }: ConnectionActionsProps) {
  const { t } = useTranslation();

  if (mode === "failure") {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          className="h-14 shrink-0 rounded-2xl bg-ink px-6 font-display text-lg text-mist transition hover:bg-slate"
          onClick={onRetry}
          type="button"
        >
          {t($ => $.connect.actions.retry)}
        </Button>
        <Button
          variant="outline"
          className="h-14 shrink-0 rounded-2xl border border-slate-300 px-6 font-display text-lg text-slate-700 transition hover:border-slate-400"
          onClick={onCancel}
          type="button"
        >
          {t($ => $.connect.actions.cancel)}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Button
        variant="outline"
        className="h-14 shrink-0 rounded-2xl border border-slate-300 px-6 font-display text-lg text-slate-700 transition hover:border-slate-400"
        onClick={onCancel}
        type="button"
      >
        {t($ => $.connect.actions.cancel)}
      </Button>
    </div>
  );
}
