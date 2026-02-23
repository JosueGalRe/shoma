import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RiftClientState, type RiftClientState as RiftClientStateValue } from "../../../core/rift/rift-client-types";
import { LanguageSwitcher } from "../../i18n/language-switcher";

type ConnectScreenShellProps = {
  status: RiftClientStateValue | null;
  errorBanner: string | null;
  children: ReactNode;
};

export function ConnectScreenShell({ status, errorBanner, children }: ConnectScreenShellProps) {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8">
      <section className="rounded-3xl border border-white/60 bg-white/75 p-6 shadow-2xl backdrop-blur sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <p className="font-display text-sm uppercase tracking-[0.24em] text-slate">{t($ => $.connect.brand)}</p>
          <LanguageSwitcher />
        </div>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">{t($ => $.connect.heading)}</h1>
        <p className="mt-4 text-base text-slate-700">
          {t($ => $.connect.subtitle)}
        </p>

        {errorBanner ? (
          <Alert className="mt-6 rounded-2xl border-red-300 bg-red-50 text-red-900" variant="destructive">
            <AlertDescription className="text-red-900">{errorBanner}</AlertDescription>
          </Alert>
        ) : null}

        {children}

        {status === RiftClientState.CONNECTED ? (
          <Card className="mt-8 rounded-2xl border-slate-200 bg-white p-4 text-slate-700">
            <p className="text-base">{t($ => $.connect.dashboardCtaBody)}</p>
            <Button asChild className="mt-4 h-11 rounded-2xl bg-ink px-5 font-display text-mist hover:bg-slate">
              <Link to="/connected">{t($ => $.connect.dashboardCtaButton)}</Link>
            </Button>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
