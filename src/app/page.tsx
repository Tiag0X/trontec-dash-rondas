import { getSheetData, getMasterBases } from "@/lib/google-sheets";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { RefreshButton } from "@/components/dashboard/refresh-button";

export const revalidate = 300; // Recarrega automaticamente os novos dados a cada 5 min (ISG Edge)

export default async function Page() {
  const [data, masterBases] = await Promise.all([
    getSheetData(),
    getMasterBases()
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-['Josefin_Sans']">
              🛡️ TRONTEC - Gestão de Rondas
            </h1>
            <RefreshButton />
          </div>
          <p className="text-muted-foreground">
            Monitoramento operacional de Rondas, Cobertura Diária e Análise de Ocorrências.
          </p>
        </div>

        <DashboardView initialData={data} masterBases={masterBases} />
      </div>
    </main>
  );
}
