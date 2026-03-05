# TRONTEC - Gestão de Rondas

Dashboard analítico de alta performance para monitoramento de rondas e segurança patrimonial, integrado diretamente ao Google Sheets.

## 🚀 Tecnologias

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Shadcn/UI
- **Charts:** Recharts (Heatmap 2D, Pareto, Timeline)
- **Data Source:** Google Sheets API
- **Cloud:** Vercel (Edge Runtime + ISG Cache)

## ✨ Funcionalidades Principais

- **KPI Reativo (72h):** Visualização imediata de "Pontos Cegos" (bases sem ronda nas últimas 72 horas) com alerta visual dinâmico.
- **Heatmap 2D (Horário x Bases):** Matriz térmica para identificação de janelas de vulnerabilidade por posto.
- **Auditoria de Cobertura:** Histórico retroativo de visitação (✅/⏳) com filtro por calendário.
- **Colaborador Destaque:** Ranking de produtividade calculado sobre média absoluta de 3 dias.
- **Semana Passada (Monitoramento Estrito):** Listas inteligentes (2 e 7 dias) das bases menos visitadas para intervenção tática.
- **Cache ISG (300s):** Sincronização automática semi-imediata sem sobrecarga de cota de API.

## 📦 Início Rápido

### 1. Pré-requisitos
Certifique-se de ter o arquivo `credentials.json` (Google Cloud Service Account) na raiz do projeto.

### 2. Instalação
```bash
npm install
```

### 3. Execução (Local)
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

- `/src/app`: Rotas e Server Components (Lógica de Revalidação)
- `/src/components`: UI Components e Views do Dashboard
- `/src/components/charts`: Implementações nativas de gráficos Recharts
- `/src/lib`: Core de integração com Google Sheets API

---
Desenvolvido por **Autonexus**

