# specs/ — Padrão de Especificações

Toda feature deve ter uma spec nesta pasta **antes** da implementação começar.

## Formato

- **Arquivo:** `kebab-case.md`, nome descritivo da feature.
- **Título:** `# Nome da Feature — Spec`
- **Intro:** Uma frase explicando o que a spec cobre.

## Seções esperadas

| Seção | Obrigatória | Conteúdo |
|---|---|---|
| **Status** | Sim | `Planned`, `In Progress` ou `Implemented` |
| **Requirements** | Sim | Lista numerada dos requisitos funcionais |
| **Approach Decision** | Se houve trade-off | Tabela comparando abordagens avaliadas com veredicto e justificativa |
| **Architecture** | Sim | Estrutura de componentes/módulos, diagrama ASCII se aplicável |
| **Dependencies** | Sim | Tabela `Pacote \| Propósito \| Status` com comandos de instalação |
| **Files Modified** | Após implementação | Tabela `Arquivo \| Mudança` |
| **Implementação — To-do** | Sim | Checklist agrupado por fase (infra, schema, validação, etc.) |
| **Open Questions** | Opcional | Dúvidas pendentes ou decisões a tomar |

## Regras

1. **Spec primeiro, código depois** — nenhum PR de feature sem spec aprovada.
2. **Idioma:** português (consistente com o resto do projeto).
3. **Código na spec** — inclua snippets completos e prontos para copiar (schema, config, queries).
4. **Referência ao design** — quando a feature mapeia telas do Pencil, liste as telas e entidades envolvidas.
5. **Atualize o status** — marque como `Implemented` e preencha "Files Modified" após a conclusão.
