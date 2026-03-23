"use client";

import { t } from "@/lib/i18n";

import { useDashboardData } from "../hooks/useDashboardData";
import { CashFlowChart } from "./CashFlowChart";
import { ClientHealthList } from "./ClientHealthList";
import { KpiCards } from "./KpiCards";
import { UpcomingObligations } from "./UpcomingObligations";

export function DashboardPage() {
  const {
    clients,
    obligations,
    kpis,
    cashFlowSeries,
    chartCurrency,
    isLoading,
    isError,
  } = useDashboardData();

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t.nav.panel}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.dashboard.subtitle}
        </p>
      </header>

      {isError ? (
        <div
          className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {t.dashboard.mainLoadError}
        </div>
      ) : null}

      <KpiCards kpis={kpis} isLoading={isLoading} />

      <div className="mt-8">
        <CashFlowChart
          data={cashFlowSeries}
          currency={chartCurrency}
          isLoading={isLoading}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <UpcomingObligations obligations={obligations} isLoading={isLoading} />
        <ClientHealthList clients={clients} isLoading={isLoading} />
      </div>
    </div>
  );
}
