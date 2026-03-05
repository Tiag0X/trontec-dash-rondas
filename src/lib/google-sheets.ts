import { google } from "googleapis";
import { format, parse } from "date-fns";

// Mesma ID da planilha usada no Python
const SPREADSHEET_ID = '1-q0436ZSSHvQzzSmEu7yd7dW-XFliVcgqM6JUOV0fyA';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export type RondaRecord = {
    id: string;
    data: string;
    dataParsed: Date | null;
    base: string;
    colaborador: string;
    tipoAlerta: string;
    duracao: string;
    text: string;
    responsavel: string;
    detalhe: string;
    lat: string;
    long: string;
};

// Autenticação singleton para GSheets
const getAuth = () => {
    let credentials;

    // Tenta carregar das variáveis de ambiente (Vercel/Produção)
    if (process.env.GOOGLE_SHEETS_JSON) {
        try {
            credentials = JSON.parse(process.env.GOOGLE_SHEETS_JSON);
        } catch (e) {
            console.error("Erro ao fazer parse de GOOGLE_SHEETS_JSON:", e);
        }
    }

    // Se não encontrou na env ou falhou o parse, tenta carregar do arquivo local
    if (!credentials) {
        try {
            // Usamos require dinâmico para evitar erro de build se o arquivo não existir
            // (que é o caso da Vercel onde o arquivo é ignorado pelo git)
            credentials = require("../../credentials.json");
        } catch (e) {
            console.error("credentials.json não encontrado localmente e GOOGLE_SHEETS_JSON não configurado.");
            throw new Error("Configuração de credenciais do Google Sheets ausente.");
        }
    }

    return new google.auth.GoogleAuth({
        credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key,
        },
        scopes: SCOPES,
    });
};

export async function getMasterBases(): Promise<string[]> {
    try {
        const auth = getAuth();
        const sheets = google.sheets({ version: "v4", auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "bases!A:A", // Assumindo que "Condominios" fica na coluna A
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        // O primeiro elemento possivelmente é "Condominios" (header)
        const rawBases = rows.map((row) => row[0]).filter(Boolean);
        const basesList = rawBases.slice(1); // Remover header caso tenha
        // Se o index 0 não for header mas for uma base legítima, devemos apenas checar pelo nome
        // Pra garantir, remover tudo que for igual a 'Condominios' e limpar 'BASE TRONTEC'

        return Array.from(new Set(
            rawBases
                .map(b => b?.trim())
                .filter(b => b && b.toLowerCase() !== 'condominios' && !b.toUpperCase().includes('BASE TRONTEC'))
        )).sort();

    } catch (error) {
        console.error("Erro ao buscar Master Bases:", error);
        return [];
    }
}

export async function getSheetData(): Promise<RondaRecord[]> {
    try {
        const auth = getAuth();
        const sheets = google.sheets({ version: "v4", auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Página1!A:K", // Adaptar alcance com base nas 11 colunas originais do python
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        // Headers devem estar na linha 0
        const headers = rows[0].map((h: string) => h.toLowerCase());
        const dataRows = rows.slice(1);

        const getColIndex = (colName: string): number => {
            const idx = headers.findIndex((h: string) => h === colName.toLowerCase());
            return idx !== -1 ? idx : -1;
        };

        const idx = {
            id: getColIndex("id"),
            data: getColIndex("data"),
            base: getColIndex("base"),
            colaborador: getColIndex("colaborador"),
            tipoAlerta: getColIndex("tipoalerta"),
            duracao: getColIndex("duração"), // atenção ao acento
            text: getColIndex("text"),
            responsavel: getColIndex("responsavel"),
            detalhe: getColIndex("detalhe"),
            lat: getColIndex("lat"),
            long: getColIndex("long")
        };

        const records: RondaRecord[] = dataRows
            .filter((row: any[]) => {
                // Ignorar sem ID assim como em python
                if (idx.id === -1 || !row[idx.id]) return false;

                // Filtro de Negócio (Ignorar BASE TRONTEC)
                const base = idx.base !== -1 ? String(row[idx.base] || "") : "";
                if (base.toUpperCase().includes("BASE TRONTEC")) return false;

                return true;
            })
            .map((row: any[]) => {
                const rawDate = idx.data !== -1 ? String(row[idx.data] || "") : "";

                // Em python era format='%d/%m/%Y %H:%M:%S'
                let parsedDate: Date | null = null;
                if (rawDate) {
                    try {
                        parsedDate = parse(rawDate, "dd/MM/yyyy HH:mm:ss", new Date());
                        if (isNaN(parsedDate.getTime())) parsedDate = null;
                    } catch (e) {
                        parsedDate = null;
                    }
                }

                const fallbackTxt = "Não Informado";

                return {
                    id: idx.id !== -1 ? String(row[idx.id]) : "",
                    data: rawDate,
                    dataParsed: parsedDate,
                    base: idx.base !== -1 && row[idx.base] ? String(row[idx.base]).trim() : fallbackTxt,
                    colaborador: idx.colaborador !== -1 && row[idx.colaborador] ? String(row[idx.colaborador]).trim() : fallbackTxt,
                    tipoAlerta: idx.tipoAlerta !== -1 && row[idx.tipoAlerta] ? String(row[idx.tipoAlerta]).trim() : fallbackTxt,
                    duracao: idx.duracao !== -1 && row[idx.duracao] ? String(row[idx.duracao]) : "",
                    text: idx.text !== -1 && row[idx.text] ? String(row[idx.text]) : fallbackTxt,
                    responsavel: idx.responsavel !== -1 && row[idx.responsavel] ? String(row[idx.responsavel]) : fallbackTxt,
                    detalhe: idx.detalhe !== -1 && row[idx.detalhe] ? String(row[idx.detalhe]) : fallbackTxt,
                    lat: idx.lat !== -1 ? String(row[idx.lat] || "") : "",
                    long: idx.long !== -1 ? String(row[idx.long] || "") : "",
                };
            });

        return records;
    } catch (error) {
        console.error("Erro ao buscar dados da aba Principal:", error);
        return [];
    }
}
