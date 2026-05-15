# Nexo Finance — Finanças Pessoais

[![CI](https://github.com/brunombpereira/finance-app/actions/workflows/ci.yml/badge.svg)](https://github.com/brunombpereira/finance-app/actions/workflows/ci.yml)

App web (instalável como PWA) para organizar e planear a vida financeira como uma app
de banco: **contas com saldos** e **transferências** entre elas, registo de gastos e
receitas, transações recorrentes, orçamentos mensais por categoria, metas de poupança
(opcionalmente ligadas a uma conta), **portfolio de investimentos** com preços ao vivo,
**relatórios** com comparações período-a-período, e um dashboard com património e
gráficos de evolução. Tema claro/escuro.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | ASP.NET Core Web API (.NET 10), EF Core, ASP.NET Identity + JWT |
| Base de dados | PostgreSQL |
| Frontend | React + Vite + TypeScript, TanStack Query, Tailwind CSS v4, Recharts |
| UI | lucide-react (ícones), sonner (toasts), modo claro/escuro |
| PWA | vite-plugin-pwa (service worker + manifest, instalável) |
| Testes | xUnit (backend), Vitest + Testing Library (frontend) |
| CI | GitHub Actions (build + testes de backend e frontend) |

## Estrutura

```
finance-app/
  backend/
    FinanceApp.Api/      API REST (.NET)
    FinanceApp.Tests/    testes xUnit
  frontend/              SPA + PWA (React)
  FinanceApp.slnx        solution .NET
  .github/workflows/     pipeline de CI
```

## Pré-requisitos

- **.NET SDK 10** — instalado em `~/.dotnet` (PATH configurado via `~/.zsh/dotnet.zsh`).
  Confirmar com `dotnet --version`.
- **Node.js 22+** e **npm**.
- **PostgreSQL** a correr localmente, com a base de dados `financeapp_dev` criada:
  ```bash
  createdb financeapp_dev
  ```

## Configuração

A connection string e a chave JWT ficam em
`backend/FinanceApp.Api/appsettings.Development.json` (fora do controlo de versões —
ver `.gitignore`). Há um template em `appsettings.Development.json.example`:

```bash
cp backend/FinanceApp.Api/appsettings.Development.json.example \
   backend/FinanceApp.Api/appsettings.Development.json
# depois gerar uma chave JWT e colar no campo "Jwt.Key":
openssl rand -base64 48
```

A connection string por omissão usa o socket Unix do Postgres
(`Host=/var/run/postgresql`), sem password. Ajustar se o teu setup for diferente.

## Arrancar

**Backend** (porta 5000, Swagger em `http://localhost:5000/swagger`):

```bash
cd backend/FinanceApp.Api
dotnet run
```

As migrations EF Core são aplicadas automaticamente no arranque, tal como a
materialização de transações recorrentes em atraso.

**Frontend** (porta 5173):

```bash
cd frontend
npm install   # apenas na primeira vez
npm run dev
```

O Vite faz proxy de `/api` para o backend, por isso não é preciso configurar CORS
para desenvolvimento. Abrir `http://localhost:5173`.

## Testes

```bash
# Backend
dotnet test FinanceApp.slnx

# Frontend
cd frontend && npm test
```

## Funcionalidades

- **Autenticação** — registo e login com JWT. Cada utilizador só vê os seus dados.
  No registo são criadas categorias e contas por omissão.
- **Contas** — conta à ordem, poupança, dinheiro vivo, cartão de crédito. Cada conta
  tem um saldo calculado (saldo inicial + transações + transferências); a soma é o
  **património**.
- **Transferências** — mover dinheiro entre contas sem contar como receita/despesa.
- **Transações** — registar receitas/despesas associadas a uma conta, categorizar,
  filtrar por data, tipo, categoria e conta, **pesquisar** por texto, **exportar CSV**,
  **importar extratos CSV** do banco (com mapeamento de colunas) e lista **paginada**.
- **Transações recorrentes** — regras que lançam transações automaticamente todos os
  meses numa conta (ordenado, renda, …); o backend materializa as ocorrências em atraso.
- **Orçamentos** — definir limites mensais por categoria; barra de progresso mostra
  o gasto vs o limite.
- **Metas de poupança** — objetivos com valor-alvo e data-alvo; opcionalmente **ligadas
  a uma conta**, caso em que o progresso reflete o saldo real dessa conta.
- **Categorias** — CRUD com seletor de cor e ícone.
- **Dashboard** — património, visão geral das contas, receitas/despesas do mês, taxa de
  poupança, gráfico de evolução, **evolução do património ao longo do tempo**, donut
  interativo de gastos por categoria, **insights** (variação de despesa mês-a-mês,
  património projetado, maiores movimentos por categoria), transações recentes e
  resumos de orçamentos/metas. Onboarding na primeira utilização.
- **Modo escuro** — tema claro/escuro com toggle na sidebar, guardado no browser.
- **PWA** — instalável no telemóvel/desktop, com service worker.

## API (resumo)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | Autenticação, devolve JWT |
| GET/POST/PUT/DELETE | `/api/accounts` | Contas (com saldo calculado) |
| GET/POST/PUT/DELETE | `/api/transfers` | Transferências entre contas |
| GET/POST/PUT/DELETE | `/api/categories` | Categorias |
| GET/POST/PUT/DELETE | `/api/transactions` | Transações paginadas (filtros: `from`, `to`, `categoryId`, `accountId`, `type`, `search`, `page`, `pageSize`) |
| POST | `/api/transactions/bulk` | Importação em lote (extratos CSV) |
| GET/POST/PUT/DELETE | `/api/recurring` | Transações recorrentes |
| GET/POST/PUT/DELETE | `/api/budgets` | Orçamentos (`?year=&month=`) |
| GET/POST/PUT/DELETE | `/api/goals` | Metas · `POST /api/goals/{id}/contribute` |
| GET | `/api/dashboard/summary` | Resumo para o dashboard (património + contas) |

## Build de produção

Em produção a API serve também o frontend (React compilado) a partir de `wwwroot`,
por isso é **um único serviço** — sem CORS nem URL de API separado. O `Dockerfile`
multi-stage trata de tudo: compila o frontend, compila e publica o backend, copia o
`dist/` para `wwwroot` e corre a app.

```bash
docker build -t finance-app .
docker run -p 8080:8080 -e DATABASE_URL=postgres://... -e Jwt__Key=... finance-app
```

## Deploy (Render)

O `render.yaml` é um blueprint que provisiona a app + base de dados de uma vez:

1. Criar conta em [render.com](https://render.com) e ligar o GitHub
2. **New → Blueprint** → escolher este repositório
3. O Render lê o `render.yaml`: cria um Web Service (Docker) e uma base de dados
   PostgreSQL, injeta o `DATABASE_URL` e gera a chave JWT (`Jwt__Key`) automaticamente
4. Ao fim de alguns minutos a app fica num URL público; as migrations EF Core correm
   no arranque

Variáveis de ambiente (o blueprint trata destas):

| Variável | Origem |
|---|---|
| `DATABASE_URL` | injetada pela base de dados do Render (URL `postgres://`) |
| `Jwt__Key` | gerada pelo Render |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `PORT` | injetada pelo Render; a app liga-se a ela automaticamente |
| `SENTRY_DSN` | (opcional) DSN do projeto Sentry — sem ela, monitorização desativada |
| `VITE_SENTRY_DSN` | (opcional, build-time do frontend) DSN do Sentry para o cliente |

Health check: `GET /health`.
