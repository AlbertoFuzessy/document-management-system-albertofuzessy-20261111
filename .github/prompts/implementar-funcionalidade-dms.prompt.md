---
description: "Implementa uma funcionalidade do DMS com base na especificação e nas convenções do projeto."
name: implementar-funcionalidade-dms
argument-hint: "funcionalidade e escopo: backend, frontend ou integração existente"
agent: agent
---

# Implementar funcionalidade do DMS

Implemente a funcionalidade `${input:funcionalidade:descreva o comportamento desejado}` no escopo `${input:escopo:backend, frontend ou integração}`.

Interprete o escopo assim: `backend` ou `frontend` autoriza mudanças somente nessa área, com a integração mínima necessária para conectá-la; `integração` significa conectar e validar partes que já existem, sem criar partes ausentes. Se a funcionalidade depender de trabalho fora do escopo, informe a dependência e peça confirmação antes de ampliá-lo.

Antes de editar, consulte [a especificação do DMS](../../docs/specs/dms-spec.md), [as instruções do projeto](../copilot-instructions.md) e o código próximo ao comportamento solicitado. Use essas fontes como contrato; se houver contradição, ambiguidade que impeça uma implementação correta ou requisito ausente, esclareça antes de escolher um comportamento.

## Regras de implementação

- Faça somente as mudanças necessárias à funcionalidade solicitada e respeite o escopo escolhido. Inclua a integração entre camadas apenas quando necessária para tornar a funcionalidade acessível.
- Preserve alterações existentes no workspace e evite refatorações não relacionadas, novas dependências ou APIs não previstas.
- No backend, use Node.js + Express em CommonJS e JavaScript sem TypeScript. Mantenha o fluxo `routes -> controllers -> services -> repositories`, com cada camada limitada à sua responsabilidade.
- Para uploads, use Multer com `diskStorage` e grave arquivos exclusivamente no filesystem local em `backend/storage`. Mantenha metadados em memória nesta fase; não adicione armazenamento externo.
- No frontend, use React + Vite, componentes funcionais com Hooks e organização existente em `components/`, `pages/` e `services/`. Consuma a API com `fetch` pelo prefixo `/api` e reutilize componentes e serviços existentes.
- Trate validação e falhas nos limites HTTP e da interface, conforme os contratos da especificação. Não exponha caminhos locais ou detalhes internos.
- Siga SOLID, DRY, KISS e YAGNI. Mantenha nomes de símbolos em inglês e mensagens ao usuário/comentários em português.

## Verificação

- Acrescente ou atualize testes focados seguindo os padrões existentes: `node:test` no backend e as ferramentas já configuradas no frontend.
- Execute os testes e verificações disponíveis para a área alterada. Se não houver um teste executável para o frontend, execute o build existente.
- Não implemente etapas futuras da especificação que não pertençam à funcionalidade e ao escopo selecionados.

Ao concluir, resuma o comportamento implementado, os arquivos alterados e as verificações executadas; indique claramente qualquer requisito que tenha permanecido sem validação.
