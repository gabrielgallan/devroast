# tRPC + TanStack React Query — Spec

Setup do tRPC v11 como camada de API do DevRoast, integrado com TanStack React Query e otimizado para Server Components do Next.js App Router.

## Status: Implemented

## Contexto

O DevRoast atualmente tem todas as paginas com dados hardcoded. O banco de dados (Drizzle + PostgreSQL) ja esta configurado com schema e migrations. Precisamos de uma camada de API type-safe para conectar o frontend ao banco, permitindo:

- Submissao de codigo para roast (mutation)
- Busca de resultados (query)
- Leaderboard com ranking (query)
- Stats do footer (query)

O tRPC v11 com o novo client TanStack React Query e a escolha ideal: type-safety end-to-end, zero code generation, e integracao nativa com SSR via prefetch + hydration.

---

## Requirements

1. **tRPC v11** — Usar o novo `@trpc/tanstack-react-query` (nao o client classico `@trpc/react-query`).
2. **Fetch adapter** — Handler via `fetchRequestHandler` no App Router (`/api/trpc/[trpc]/route.ts`).
3. **SSR com prefetch** — Server components fazem `prefetchQuery` e passam dados via `HydrationBoundary` para client components.
4. **Server caller** — Acesso direto ao router via `createTRPCOptionsProxy` para server components, sem HTTP round-trip.
5. **Contexto com Drizzle** — O contexto do tRPC expoe a instancia `db` do Drizzle para todas as procedures.
6. **Validacao com Zod** — Input/output validation em todas as procedures.
7. **Sem data transformer** — Nao usar `superjson`. Os tipos do banco (strings, numbers, booleans, Date via `.toISOString()`) nao precisam de serializacao especial.
8. **Helpers `prefetch` e `HydrateClient`** — Abstrair o boilerplate de `dehydrate`/`HydrationBoundary` em helpers reutilizaveis exportados de `trpc/server.tsx`.

---

## Approach Decision

| Abordagem | Veredicto | Razao |
|---|---|---|
| **tRPC v11 + TanStack React Query** | **Escolhida** | Type-safety end-to-end, SSR nativo, client moderno com `queryOptions`/`mutationOptions` |
| Server Actions puras | Rejeitada | Sem cache management, sem query invalidation, sem loading/error states automaticos |
| API routes manuais (Route Handlers) | Rejeitada | Sem type-safety, requer tipos manuais, boilerplate de serialization |
| tRPC v10 (client classico) | Rejeitada | API legada, o novo TanStack React Query client e o recomendado pela equipe do tRPC |

---

## Architecture

### Estrutura de arquivos

```
src/
├── app/
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc]/
│   │           └── route.ts        # Fetch adapter (GET + POST)
│   └── layout.tsx                  # Monta <TRPCReactProvider>
├── trpc/
│   ├── init.ts                     # initTRPC, context, base procedures
│   ├── routers/
│   │   └── _app.ts                 # Root router (merges sub-routers)
│   ├── client.tsx                  # "use client" — Provider + hooks
│   ├── query-client.ts             # Factory do QueryClient (compartilhada)
│   └── server.tsx                  # "server-only" — prefetch helpers + caller
└── db/
    ├── index.ts                    # Conexao Drizzle (ja existe)
    └── schema.ts                   # Schema Drizzle (ja existe)
```

### Fluxo de dados

```
Server Component                    Client Component
      │                                   │
      │ prefetch(trpc.X.queryOptions())    │
      │         │                          │
      │    getQueryClient()                │
      │    (cache por request)             │
      │         │                          │
      │    createTRPCOptionsProxy          │
      │    (chama router diretamente,      │
      │     sem HTTP)                      │
      │         │                          │
      │    <HydrateClient>                 │
      │         └──── dehydrate ──────────>│ useQuery(trpc.X.queryOptions())
      │                                    │ (dados ja estao no cache,
      │                                    │  sem refetch)
```

---

## Arquivos

### `src/trpc/init.ts` — Inicializacao do tRPC

```ts
import { initTRPC } from "@trpc/server";
import { db } from "@/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
	return {
		db,
		headers: opts.headers,
	};
};

const t = initTRPC
	.context<Awaited<ReturnType<typeof createTRPCContext>>>()
	.create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
```

**Decisoes:**
- O contexto recebe `headers` para ser reutilizavel tanto no fetch adapter (headers do request) quanto no server caller (headers do Next.js).
- O `db` do Drizzle e injetado no contexto para que todas as procedures tenham acesso direto ao banco.
- Sem `superjson` — os tipos do Drizzle sao primitivos JSON-safe (timestamps convertidos via `.toISOString()` nas queries).

### `src/trpc/routers/_app.ts` — Root router

```ts
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
	// Sub-routers serao adicionados aqui conforme as features forem implementadas
	// ex: submission: submissionRouter,
	// ex: leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
```

### `src/trpc/query-client.ts` — Factory do QueryClient

```ts
import {
	defaultShouldDehydrateQuery,
	QueryClient,
} from "@tanstack/react-query";

export function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
			},
			dehydrate: {
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
		},
	});
}
```

**Decisoes:**
- `staleTime: 30s` — evita refetch imediato no client apos hydration do SSR.
- `shouldDehydrateQuery` inclui queries `pending` — permite streaming de dados via RSC (prefetch sem `await`).
- Sem `serializeData`/`deserializeData` — nao usamos `superjson`.

### `src/trpc/client.tsx` — Client-side provider + hooks

```tsx
"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

export const { TRPCProvider, useTRPC } =
	createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;

function getQueryClient() {
	if (typeof window === "undefined") {
		return makeQueryClient();
	}
	if (!browserQueryClient) browserQueryClient = makeQueryClient();
	return browserQueryClient;
}

function getUrl() {
	const base = (() => {
		if (typeof window !== "undefined") return "";
		if (process.env.VERCEL_URL)
			return `https://${process.env.VERCEL_URL}`;
		return "http://localhost:3000";
	})();
	return `${base}/api/trpc`;
}

export function TRPCReactProvider(
	props: Readonly<{ children: React.ReactNode }>,
) {
	const queryClient = getQueryClient();
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
				httpBatchLink({
					url: getUrl(),
				}),
			],
		}),
	);
	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider
				trpcClient={trpcClient}
				queryClient={queryClient}
			>
				{props.children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}
```

**Decisoes:**
- `httpBatchLink` — agrupa multiplas chamadas em uma unica request HTTP.
- `getUrl()` resolve a URL correta tanto no browser (relativa) quanto no server (absoluta, com suporte a `VERCEL_URL`).
- Singleton `browserQueryClient` no browser — evita recriar o client se React suspender durante render inicial.

### `src/trpc/server.tsx` — Server-side caller + helpers

```tsx
import "server-only";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { TRPCQueryOptions } from "@trpc/tanstack-react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
	ctx: async () =>
		createTRPCContext({
			headers: await headers(),
		}),
	router: appRouter,
	queryClient: getQueryClient,
});

export const caller = appRouter.createCaller(async () =>
	createTRPCContext({ headers: await headers() }),
);

export function HydrateClient(props: { children: React.ReactNode }) {
	const queryClient = getQueryClient();
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			{props.children}
		</HydrationBoundary>
	);
}

export function prefetch<
	T extends ReturnType<TRPCQueryOptions<any>>,
>(queryOptions: T) {
	const queryClient = getQueryClient();
	if (queryOptions.queryKey[1]?.type === "infinite") {
		void queryClient.prefetchInfiniteQuery(queryOptions as any);
	} else {
		void queryClient.prefetchQuery(queryOptions);
	}
}
```

**Decisoes:**
- `import "server-only"` — garante erro de build se importado em client component.
- `cache(makeQueryClient)` — o React `cache()` garante o mesmo `QueryClient` por request no server.
- `createTRPCOptionsProxy` com `router` — chama procedures diretamente no server, sem HTTP round-trip.
- `caller` — para acesso direto em server components que nao precisam de hydration (ex: metadados, OG image).
- `HydrateClient` e `prefetch` — helpers que abstraem o boilerplate de `dehydrate`/`HydrationBoundary`.

### `src/app/api/trpc/[trpc]/route.ts` — Fetch adapter

```ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

const handler = (req: Request) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () =>
			createTRPCContext({ headers: req.headers }),
	});

export { handler as GET, handler as POST };
```

### `src/app/layout.tsx` — Montagem do provider

```tsx
import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
	title: "DevRoast",
	description: "Paste your code. Get roasted.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body className="bg-bg-page text-text-primary antialiased">
				<Navbar />
				<TRPCReactProvider>{children}</TRPCReactProvider>
			</body>
		</html>
	);
}
```

---

## Padroes de uso

### Prefetch em Server Component + consumo em Client Component

```tsx
// src/app/leaderboard/page.tsx (server component)
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { LeaderboardTable } from "./leaderboard-table";

export default function LeaderboardPage() {
	prefetch(trpc.leaderboard.list.queryOptions());
	return (
		<HydrateClient>
			<LeaderboardTable />
		</HydrateClient>
	);
}
```

```tsx
// src/app/leaderboard/leaderboard-table.tsx (client component)
"use client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function LeaderboardTable() {
	const trpc = useTRPC();
	const { data } = useQuery(
		trpc.leaderboard.list.queryOptions(),
	);
	// ...
}
```

### Mutation em Client Component

```tsx
"use client";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function SubmitButton() {
	const trpc = useTRPC();
	const submit = useMutation(
		trpc.submission.create.mutationOptions(),
	);
	// submit.mutate({ code, language, roastMode })
}
```

### Acesso direto em Server Component (sem hydration)

```tsx
// src/app/roast/[id]/page.tsx
import { caller } from "@/trpc/server";

export default async function RoastPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const result = await caller.submission.getResult({ id });
	// renderizar diretamente, sem hydration
}
```

---

## Dependencias

| Pacote | Proposito | Status |
|---|---|---|
| `@trpc/server` | Core do tRPC (routers, procedures, adapters) | Instalado |
| `@trpc/client` | Client vanilla (httpBatchLink) | Instalado |
| `@trpc/tanstack-react-query` | Integracao TanStack React Query (createTRPCContext, createTRPCOptionsProxy) | Instalado |
| `@tanstack/react-query` | Cache, queries, mutations, hydration | Instalado |
| `zod` | Validacao de input/output das procedures | Instalado |
| `server-only` | Garante que `trpc/server.tsx` nao e importado no client | Instalado |
| `client-only` | Garante que modulos client-only nao vazem pro server | Instalado |

```bash
pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only client-only
```

---

## Implementacao — To-do

### 1. Dependencias

- [x] Instalar pacotes: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@tanstack/react-query`, `zod`, `server-only`, `client-only`

### 2. Infraestrutura tRPC

- [x] Criar `src/trpc/init.ts` — `initTRPC`, contexto com `db` do Drizzle
- [x] Criar `src/trpc/routers/_app.ts` — root router vazio + export `AppRouter`
- [x] Criar `src/trpc/query-client.ts` — factory do `QueryClient`
- [x] Criar `src/trpc/client.tsx` — `TRPCReactProvider`, `useTRPC`
- [x] Criar `src/trpc/server.tsx` — `trpc` proxy, `caller`, `HydrateClient`, `prefetch`
- [x] Criar `src/app/api/trpc/[trpc]/route.ts` — fetch adapter

### 3. Integracao com Layout

- [x] Atualizar `src/app/layout.tsx` — envolver `{children}` com `<TRPCReactProvider>`

### 4. Validacao

- [x] Rodar `pnpm build` — garantir que nao ha erros de TypeScript
- [x] Rodar `pnpm check` — garantir que Biome esta satisfeito
- [ ] Testar rota `GET /api/trpc/health` ou similar para validar que o handler responde

---

## Files Modified

| Arquivo | Mudanca |
|---|---|
| `src/trpc/init.ts` | **Novo** — `initTRPC`, contexto com `db` do Drizzle, exports de `createTRPCRouter`, `createCallerFactory`, `baseProcedure` |
| `src/trpc/query-client.ts` | **Novo** — Factory do `QueryClient` com `staleTime: 30s` e dehydrate de queries pending |
| `src/trpc/client.tsx` | **Novo** — `"use client"` provider com `TRPCReactProvider`, `useTRPC`, `httpBatchLink` |
| `src/trpc/server.tsx` | **Novo** — `"server-only"` com `trpc` proxy, `caller`, `HydrateClient`, `prefetch` helpers |
| `src/trpc/routers/_app.ts` | **Novo** — Root router merging `statsRouter` |
| `src/trpc/routers/stats.ts` | **Novo** — `getStats` procedure (COUNT + AVG query on `roast_results`) |
| `src/app/api/trpc/[trpc]/route.ts` | **Novo** — Fetch adapter (GET + POST) |
| `src/app/layout.tsx` | **Modificado** — Wrapped children com `<TRPCReactProvider>` |
| `src/app/page.tsx` | **Modificado** — `prefetch` + `<HydrateClient>` + `<Suspense>` + `<StatsBar>` substituindo stats hardcoded, `force-dynamic` |
| `src/components/ui/stats-bar.tsx` | **Novo** — `StatsBar` (client component com `useSuspenseQuery` + `NumberFlow`) e `StatsBarSkeleton` |

---

## Open Questions

1. **Rate limiting** — Precisamos de rate limiting no endpoint `/api/trpc`? Se sim, middleware tRPC ou middleware do Next.js?
2. **Error formatting** — Customizar o formato de erro do tRPC para incluir codigos de erro especificos do DevRoast?
3. **Subscriptions** — Se no futuro quisermos streaming do progresso da analise IA, tRPC suporta SSE subscriptions. Avaliar quando implementar o fluxo de roast.
