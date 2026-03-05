"use server";

import { revalidatePath } from "next/cache";

export async function refreshData() {
    // Força o Next.js a limpar o cache estático (ISG) da rota principal
    // fazendo um novo fetch no Google Sheets na próxima montagem
    revalidatePath("/");
}
