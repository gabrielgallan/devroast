# tRPC — API Layer Conventions

This module contains all tRPC v11 infrastructure for type-safe API communication between server and client.

## File Structure

| File | Responsibility |
|---|---|
| `init.ts` | `initTRPC`, context creation (injects Drizzle `db` + request `headers`), exports `createTRPCRouter`, `baseProcedure`, `createCallerFactory` |
| `query-client.ts` | `makeQueryClient` factory — shared between server and client. `staleTime: 30s`, dehydrates pending queries for streaming |
| `client.tsx` | `"use client"` — `TRPCReactProvider` (wraps `QueryClientProvider` + `TRPCProvider`), `useTRPC` hook, `httpBatchLink` to `/api/trpc` |
| `server.tsx` | `"server-only"` — `trpc` options proxy (calls router directly, no HTTP), `caller` for direct access, `HydrateClient` wrapper, `prefetch` helper |
| `routers/_app.ts` | Root router — merges all sub-routers, exports `AppRouter` type |
| `routers/*.ts` | Feature routers — one file per domain (e.g., `stats.ts`, `submission.ts`) |

## Adding a New Router

1. Create `src/trpc/routers/<name>.ts`:

```ts
import { z } from "zod/v4";
import { baseProcedure, createTRPCRouter } from "../init";

export const nameRouter = createTRPCRouter({
	list: baseProcedure
		.input(z.object({ limit: z.number().min(1).max(100).default(10) }))
		.query(async ({ ctx, input }) => {
			// Query via ctx.db (Drizzle instance)
			return ctx.db.select().from(table).limit(input.limit);
		}),

	create: baseProcedure
		.input(z.object({ /* ... */ }))
		.mutation(async ({ ctx, input }) => {
			// Mutations also use ctx.db
			return ctx.db.insert(table).values(input).returning();
		}),
});
```

2. Merge into `routers/_app.ts`:

```ts
import { nameRouter } from "./name";

export const appRouter = createTRPCRouter({
	// ...existing routers
	name: nameRouter,
});
```

3. The router is immediately available on both server (`trpc.name.list.queryOptions()`) and client (`useTRPC().name.list.queryOptions()`).

## Procedure Conventions

- Always start from `baseProcedure` — it provides the Drizzle `db` context.
- Use **Zod v4** for input validation (`import { z } from "zod/v4"`). Output validation is optional.
- Access the database via `ctx.db` — never import `db` directly in router files.
- Return plain JSON-serializable objects — no `superjson`, no data transformers. Convert `Date` to `.toISOString()` if needed.
- Keep procedures focused — one query/mutation per procedure. Complex business logic should be extracted to separate functions if it grows beyond ~20 lines.

## SSR Data Fetching Pattern

The standard pattern for pages that need database data:

### Server Component (page)

```tsx
import { Suspense } from "react";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { MyComponent } from "@/components/ui/my-component";
import { MyComponentSkeleton } from "@/components/ui/my-component";

export const dynamic = "force-dynamic";

export default function MyPage() {
	prefetch(trpc.router.procedure.queryOptions());

	return (
		<HydrateClient>
			<Suspense fallback={<MyComponentSkeleton />}>
				<MyComponent />
			</Suspense>
		</HydrateClient>
	);
}
```

### Client Component (data consumer)

```tsx
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function MyComponent() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(trpc.router.procedure.queryOptions());

	return <div>{data.value}</div>;
}
```

### Key rules

- `prefetch()` is **fire-and-forget** (no `await`) — the data streams in via RSC.
- `<HydrateClient>` must wrap any subtree that contains client components consuming prefetched data.
- Always pair `useSuspenseQuery` with `<Suspense fallback>` — the query suspends until data is available.
- Export `const dynamic = "force-dynamic"` on any page that uses `prefetch` — prevents build-time prerendering.
- Create a matching `*Skeleton` component for every data-consuming client component.

## Client-Only Patterns

### Query (no SSR prefetch)

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function MyComponent() {
	const trpc = useTRPC();
	const { data, isLoading } = useQuery(trpc.router.procedure.queryOptions());
	// Handle loading/error states manually
}
```

### Mutation

```tsx
"use client";

import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function SubmitButton() {
	const trpc = useTRPC();
	const mutation = useMutation(trpc.router.procedure.mutationOptions());

	return (
		<button onClick={() => mutation.mutate({ /* input */ })}>
			Submit
		</button>
	);
}
```

## Server-Only Direct Access

For server components that need data but don't need hydration (metadata, OG images, etc.):

```tsx
import { caller } from "@/trpc/server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const result = await caller.router.procedure({ id });
	// Render directly — no HydrateClient needed
}
```

## API Route

The tRPC fetch adapter lives at `src/app/api/trpc/[trpc]/route.ts`. It handles both `GET` and `POST` requests. Client-side calls from `httpBatchLink` hit this endpoint. Server-side calls via `trpc` proxy or `caller` bypass HTTP entirely.
