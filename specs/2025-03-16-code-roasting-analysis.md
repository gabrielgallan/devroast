# Code Roasting & Analysis Feature

**Status**: Design (Ready for Implementation)  
**Date**: 2025-03-16  
**Owner**: DevRoast Team

---

## Overview

Implementar a feature central do DevRoast: análise de código via IA com suporte a "roast mode" (tom sarcástico). Usuários enviam trechos de código, recebem análise detalhada com score, veredicto, problemas identificados e sugestões de correção.

### Requisitos Funcionais

1. **Envio de código**: usuário cola código, seleciona modo (padrão ou roast), clica "Analisar"
2. **Análise de IA**: integração com OpenAI GPT-4o para gerar análise estruturada
3. **Roast Mode**: toggle que muda o tom da análise para sarcástico/cômico
4. **Resultados**: exibição com score (0-100), veredicto, comentário, problemas e sugestões
5. **Polling**: página de resultados aguarda análise em tempo real via polling
6. **Tratamento de erros**: exibir mensagens amigáveis se a API falhar

### Fora do Escopo

- Funcionalidade de compartilhamento (deixar para depois)
- Histórico de análises do usuário
- Análise em tempo real enquanto digita

---

## Arquitetura do Sistema

### Fluxo de Dados

```
1. User submits code
   ↓
2. CodeEditor → roast.submit (mutation)
   ↓
3. Create submissions record, return submissionId
   ↓
4. Client redirects to /roast/[submissionId]
   ↓
5. scheduleAnalysis() triggered in background
   ├─ Call OpenAI GPT-4o with code + roastMode
   ├─ Parse JSON response
   ├─ Create roast_result + analysis_issues + suggested_diffs
   └─ Handle errors gracefully
   ↓
6. Results page polls via useSuspenseQuery + refetchInterval
   ├─ Show skeleton until roast_result exists
   ├─ Once ready, display full analysis
   └─ If error, show error message
```

### Estados da Análise

A análise passa por três estados:

| Estado | Descrição | Ação |
|--------|-----------|------|
| **Pending** | `roast_results` não existe | Continuar polling |
| **Processing** | `roast_results` existe, `roastText` null | Continuar polling |
| **Ready** | `roast_results` completo | Exibir resultados |
| **Error** | `roast_results` com `error_message` | Exibir erro, parar polling |

---

## Integração OpenAI GPT-4o

### Módulo `src/lib/openai.ts`

Nova função helper para chamar a API:

```ts
export async function generateRoastAnalysis(
  code: string,
  language: string,
  roastMode: boolean,
): Promise<RoastAnalysis> {
  const tone = roastMode
    ? "Provide brutally honest, sarcastic, humorous feedback..."
    : "Provide professional, constructive feedback...";

  const prompt = `
You are a code review expert. Analyze the following ${language} code:

${code}

${tone}

Return a JSON object with:
- score (0-100 integer)
- verdict ("looks_clean" | "could_be_better" | "needs_serious_help")
- roastText (string, main commentary in ${roastMode ? "sarcastic" : "professional"} tone)
- issues (array of {severity: "critical|warning|good", title: string, description: string})
- diffs (array of {type: "added|removed|context", content: string})
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: roastMode ? 0.8 : 0.5,
  });

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);

  return {
    score: parsed.score,
    verdict: parsed.verdict,
    roastText: parsed.roastText,
    issues: parsed.issues,
    diffs: parsed.diffs,
    model: "gpt-4o",
    promptTokens: response.usage.prompt_tokens,
    completionTokens: response.usage.completion_tokens,
    latencyMs: Date.now() - startTime,
  };
}
```

### Tratamento de Erros

Se a chamada à API falhar:
1. Catch a exceção (timeout, rate limit, API error, parse error)
2. Formatar mensagem amigável:
   - "Rate limited. Try again in a few minutes."
   - "API service unavailable. Please try again later."
   - "Invalid code or language not supported."
3. Salvar `error_message` em `roast_results`
4. Página de resultados exibe o erro em vez do skeleton

---

## Alterações no Banco de Dados

### Nova Coluna em `roast_results`

```sql
ALTER TABLE roast_results ADD COLUMN error_message TEXT;
```

Permite armazenar mensagens de erro da API para exibição no frontend.

---

## tRPC Procedures

### `roast.submit` (Mutation)

**Input**:
```ts
{
  code: string (1-100k chars)
  language: string
  lineCount: number (1-2000)
  roastMode: boolean
}
```

**Output**:
```ts
{ submissionId: uuid }
```

**Comportamento**:
1. Criar `submissions` record
2. Chamar `scheduleAnalysis()` em background (fire-and-forget, sem await)
3. Retornar `submissionId` imediatamente (não bloqueia)

**Implementação da `scheduleAnalysis()`**:
```ts
async function scheduleAnalysis(
  submissionId: uuid,
  code: string,
  language: string,
  roastMode: boolean,
) {
  try {
    const analysis = await generateRoastAnalysis(code, language, roastMode);

    // Salvar resultados completos
    const [result] = await db
      .insert(roastResults)
      .values({
        submissionId,
        score: analysis.score,
        verdict: analysis.verdict,
        roastText: analysis.roastText,
        model: analysis.model,
        promptTokens: analysis.promptTokens,
        completionTokens: analysis.completionTokens,
        latencyMs: analysis.latencyMs,
      })
      .returning({ id: roastResults.id });

    // Salvar issues
    if (analysis.issues.length > 0) {
      await db.insert(analysisIssues).values(
        analysis.issues.map((issue, index) => ({
          roastResultId: result.id,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          sortOrder: index,
        })),
      );
    }

    // Salvar diffs
    if (analysis.diffs.length > 0) {
      await db.insert(suggestedDiffs).values(
        analysis.diffs.map((diff, index) => ({
          roastResultId: result.id,
          lineType: diff.type,
          content: diff.content,
          sortOrder: index,
        })),
      );
    }
  } catch (error) {
    // Salvar erro para exibição
    const errorMessage = formatErrorMessage(error);
    await db
      .insert(roastResults)
      .values({
        submissionId,
        score: 0,
        verdict: "needs_serious_help",
        roastText: "Analysis failed",
        error_message: errorMessage,
        model: "gpt-4o",
      });
  }
}
```

### `roast.getById` (Query)

**Input**: `{ id: uuid }`

**Output**:
```ts
{
  id: uuid
  score: number
  verdict: string
  roastText: string
  language: string
  lineCount: number
  code: string
  issues: Array<{severity, title, description}>
  diffs: Array<{type, content, sortOrder}>
  errorMessage?: string // se houver erro
} | throws NOT_FOUND
```

**Comportamento**:
1. Procurar por `roastResults.id` ou `roastResults.submissionId` (ambos funcionam)
2. Se não encontrar → throw `NOT_FOUND` (indica estado Pending)
3. Se encontrar → retornar resultado completo (com `error_message` se presente)

---

## UI & Componentes

### Página de Resultados: `/roast/[id]/page.tsx`

**Server Component**:
1. Prefetch `trpc.roast.getById` via `prefetch()`
2. Render `HydrateClient` wrapper
3. Wrap client component em `<Suspense fallback={<RoastResultSkeleton />}>`

**Client Component** (`RoastResultDisplay`):
1. Chamar `useSuspenseQuery(trpc.roast.getById.queryOptions())`
2. Com `refetchInterval: 1000` (polling a cada segundo)
3. Lidar com estados:
   - **Loading (Suspense)**: mostrar skeleton
   - **Error com `errorMessage`**: exibir mensagem amigável
   - **Success**: exibir análise completa (score, veredicto, problemas, sugestões)

### Novo Componente: `RoastResultSkeleton`

Skeleton que corresponde ao layout real para evitar layout shift.

---

## Configuração de Ambiente

Adicionar ao `.env.local`:
```
OPENAI_API_KEY=sk-...
```

O módulo `src/lib/openai.ts` lê esta variável e inicializa o cliente OpenAI.

---

## Arquivos a Modificar/Criar

### Novos Arquivos

1. `src/lib/openai.ts` — integração com OpenAI GPT-4o
2. `src/components/ui/roast-result-skeleton.tsx` — skeleton para resultados
3. `src/components/ui/roast-result-display.tsx` — exibição de análise com polling

### Arquivos Modificados

1. `src/db/schema.ts` — adicionar coluna `error_message` em `roast_results`
2. `src/trpc/routers/roast.ts` — implementar `scheduleAnalysis()`, atualizar `submit` mutation
3. `src/app/roast/[id]/page.tsx` — implementar com prefetch + Suspense
4. `drizzle.config.ts` — gerar migration para nova coluna (se necessário)

---

## Fluxo de Implementação

1. **Database**: Adicionar coluna `error_message`, gerar e aplicar migration
2. **OpenAI Client**: Criar `src/lib/openai.ts` com `generateRoastAnalysis()`
3. **tRPC Router**: Implementar `scheduleAnalysis()` e atualizar `roast.submit`
4. **UI Skeletons**: Criar `RoastResultSkeleton` com layout matching
5. **Results Page**: Implementar `/roast/[id]/page.tsx` com prefetch + Suspense
6. **Client Display**: Criar `RoastResultDisplay` com polling + error handling
7. **Testes**: Verificar fluxo end-to-end: submit → redirect → polling → exibição

---

## Critérios de Aceitação

- ✅ Usuário consegue enviar código e escolher roast mode
- ✅ Redirect imediato para página de resultados (sem esperar análise)
- ✅ Página mostra skeleton enquanto aguarda resultado
- ✅ Análise é feita pela OpenAI GPT-4o no background
- ✅ Resultados aparecem na página via polling (máx 1-2s de latência)
- ✅ Roast mode muda o tom da análise para sarcástico
- ✅ Se API falhar, erro amigável é exibido
- ✅ Build passa: `pnpm build` sem erros
- ✅ Lint passa: `pnpm check` sem erros
