"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshData } from "@/app/actions";

export function RefreshButton() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshData();
        } finally {
            // Um leve delay apenas para feedback visual agradável do spinner contornando
            setTimeout(() => {
                setIsRefreshing(false);
            }, 600);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2 h-9 border-slate-200 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 transition-all shadow-sm"
        >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
            {isRefreshing ? "Atualizando..." : "Sincronizar Dados"}
        </Button>
    );
}
