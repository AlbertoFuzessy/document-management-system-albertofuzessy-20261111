# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para enviar, listar e baixar documentos, armazenando os arquivos no filesystem local e mantendo seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos disponíveis para o usuário local da aplicação.
- Download de um documento pelo identificador.
- Exibição de metadados e de erros de operação na interface web.
- Identificação local do dono do documento, sem autenticação nesta versão.

### Fora do escopo

- Armazenamento externo, em nuvem ou em serviços de terceiros.
- Versionamento, edição, compartilhamento ou exclusão de documentos.
- Cadastro de usuários, login, autenticação e autorização multiusuário.
- Persistência durável dos metadados em banco de dados.
- Busca avançada, pastas, etiquetas, pré-visualização e conversão de arquivos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo usando o formulário da aplicação. O envio é feito como `multipart/form-data`, com um único campo chamado `file`. |
| RF-02 | O sistema rejeita requisições sem arquivo, com mais de um arquivo ou que excedam o limite de tamanho configurado. |
| RF-03 | O sistema grava o conteúdo no diretório local `backend/storage`, usando Multer com `diskStorage` e um nome de armazenamento gerado pela aplicação, sem usar o nome original como caminho. |
| RF-04 | Após salvar o arquivo, o sistema cria metadados e devolve uma confirmação com esses metadados, sem expor o caminho ou nome interno de armazenamento. |
| RF-05 | O usuário pode listar os metadados dos documentos registrados pelo processo atual, ordenados do mais recente para o mais antigo. |
| RF-06 | O usuário pode baixar um documento pelo seu `id`. O nome original é usado como nome sugerido para download, com tratamento seguro para cabeçalhos HTTP. |
| RF-07 | Se o registro dos metadados falhar após a gravação, o sistema tenta remover o arquivo recém-gravado para não deixar um arquivo sem referência. |
| RF-08 | A interface apresenta estados de carregamento, sucesso e erro para upload, listagem e download; falhas não devem ser apresentadas como operações concluídas. |
| RF-09 | Um documento não encontrado deve resultar em resposta `404`, sem revelar caminhos ou detalhes internos do filesystem. |

### Identidade do usuário

A primeira versão é de usuário local único, sem autenticação. O backend obtém o valor de `owner` de uma configuração de ambiente `DMS_OWNER_ID`, com valor padrão `local-user`. A listagem inclui somente registros com esse `owner`. Como não há identidade autenticada, esse filtro é uma regra de organização do MVP e não constitui isolamento de segurança entre usuários. A introdução de múltiplos usuários exige autenticação e autorização, fora do escopo atual.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são gravados exclusivamente no filesystem local em `backend/storage`, por meio de Multer `diskStorage`. Não usar armazenamento externo. |
| RNF-02 | Os metadados são mantidos em memória nesta fase; reiniciar o processo remove o catálogo, embora os arquivos existentes possam permanecer no diretório local. |
| RNF-03 | Configurações operacionais são obtidas por variáveis de ambiente, seguindo o princípio 12-Factor. |
| RNF-04 | O limite máximo do arquivo é configurado por `UPLOAD_MAX_SIZE_BYTES`; a implementação deve definir e documentar um valor padrão antes de entrar em execução. |
| RNF-05 | Tipos MIME aceitos podem ser limitados por `UPLOAD_ALLOWED_MIME_TYPES`, uma lista separada por vírgulas. A política e os valores padrão devem ser decididos antes da implementação; a validação de MIME não substitui medidas de segurança no consumo dos arquivos. |
| RNF-06 | A aplicação deve garantir a existência do diretório de armazenamento na inicialização ou tratar claramente sua indisponibilidade, sem iniciar upload com configuração inválida. |
| RNF-07 | Caminhos locais, nomes internos, stack traces e detalhes do sistema de arquivos não são expostos em respostas HTTP. |
| RNF-08 | A API retorna respostas JSON consistentes para erros e usa códigos HTTP compatíveis com o resultado da operação. |
| RNF-09 | O código segue JavaScript sem TypeScript nesta fase, CommonJS no backend, ESM no frontend e os padrões simples de Clean Architecture definidos neste documento. |

### Configuração

| Variável | Finalidade | Regra |
| --- | --- | --- |
| `PORT` | Porta HTTP do backend | Usar o valor configurado; definir um padrão no ambiente de desenvolvimento. |
| `STORAGE_DIR` | Diretório local de arquivos | Padrão `backend/storage`; não aceitar destino de armazenamento externo. |
| `DMS_OWNER_ID` | Identificador local do dono | Padrão `local-user`; não representa uma credencial. |
| `UPLOAD_MAX_SIZE_BYTES` | Tamanho máximo por arquivo | Obrigatória para a política de produção ou fornecer padrão explicitamente documentado. |
| `UPLOAD_ALLOWED_MIME_TYPES` | Lista opcional de MIME types permitidos | Configuração separada por vírgulas; comportamento sem valor deve ser definido antes da implementação. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único, gerado pelo backend e não derivado do nome do arquivo. |
| `originalName` | string | Nome original submetido pelo cliente, preservado como metadado e sanitizado ao criar o cabeçalho de download. |
| `size` | number | Tamanho do conteúdo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601, preferencialmente UTC. |
| `owner` | string | Identificador local do dono conforme `DMS_OWNER_ID`; não comprova identidade. |
| `mimeType` | string | Tipo MIME registrado no upload, quando disponível. |

### Dados internos de armazenamento

O repositório mantém também um identificador/nome interno de armazenamento (`storageName`) necessário para localizar o arquivo no diretório local. Esse valor não é retornado nos metadados públicos. O caminho absoluto pode ser calculado a partir de `STORAGE_DIR` e `storageName`; não deve ser aceito diretamente de uma requisição nem persistido como dado fornecido pelo cliente.

### Regras de consistência

- `id` e `storageName` são gerados no backend e não reutilizados intencionalmente.
- `size` é obtido do arquivo recebido, não de um valor enviado separadamente pelo cliente.
- Cada registro de metadados corresponde a um arquivo local gravado com sucesso.
- A listagem e o download consultam somente metadados registrados em memória e do `owner` local corrente.
- Após reiniciar o backend, o catálogo fica vazio; reconstruí-lo a partir dos arquivos não faz parte deste MVP.

## 6. Contratos de API

Os caminhos abaixo são relativos ao backend. O frontend acessa-os com prefixo `/api` por meio do proxy do Vite, por exemplo, `POST /api/upload`.

### Formato de erro

Erros retornam JSON no formato:

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "O arquivo excede o tamanho máximo permitido."
  }
}
```

A mensagem pode ser exibida ao usuário; detalhes internos não devem ser incluídos. Códigos possíveis incluem `FILE_REQUIRED`, `TOO_MANY_FILES`, `FILE_TOO_LARGE`, `FILE_TYPE_NOT_ALLOWED`, `DOCUMENT_NOT_FOUND` e `INTERNAL_ERROR`.

### `POST /upload`

- **Entrada:** `multipart/form-data`, um campo de arquivo chamado `file`.
- **Sucesso:** `201 Created`, `Content-Type: application/json`.
- **Resposta:**

```json
{
  "document": {
    "id": "<id>",
    "originalName": "relatorio.pdf",
    "size": 12345,
    "uploadedAt": "2026-11-11T12:00:00.000Z",
    "owner": "local-user",
    "mimeType": "application/pdf"
  }
}
```

- **Erros:** `400 Bad Request` para arquivo ausente, múltiplos arquivos ou tipo não permitido; `413 Payload Too Large` para limite excedido; `500 Internal Server Error` para falha inesperada de gravação ou registro.
- O arquivo não deve permanecer no diretório se o upload não puder ser registrado como documento.

### `GET /documents`

- **Entrada:** sem corpo.
- **Sucesso:** `200 OK`, `Content-Type: application/json`.
- **Resposta:** lista vazia quando não houver documentos registrados para o dono local.

```json
{
  "documents": [
    {
      "id": "<id>",
      "originalName": "relatorio.pdf",
      "size": 12345,
      "uploadedAt": "2026-11-11T12:00:00.000Z",
      "owner": "local-user",
      "mimeType": "application/pdf"
    }
  ]
}
```

- Os itens são ordenados por `uploadedAt` decrescente. Caminhos e nomes internos não são retornados.
- **Erro:** `500 Internal Server Error` em falha inesperada ao consultar o repositório.

### `GET /documents/:id/download`

- **Entrada:** `id` na rota; sem corpo.
- **Sucesso:** `200 OK`, conteúdo binário do arquivo, `Content-Disposition: attachment` com o nome original sanitizado e `Content-Type` do documento (ou `application/octet-stream` quando desconhecido).
- **Erros:** `404 Not Found` quando não houver metadados para o `id` do dono local; `500 Internal Server Error` se houver metadados, mas o arquivo não puder ser lido.
- A rota resolve o arquivo exclusivamente a partir do registro interno; nunca concatena um caminho fornecido pelo cliente.

## 7. Decisões arquiteturais

### Backend

- Stack: Node.js + Express, CommonJS, JavaScript sem TypeScript; testes com `node:test`.
- Fluxo de dependência: `routes -> controllers -> services -> repositories`.
- `routes/`: registra endpoints e middlewares de upload/erros, delegando aos controllers.
- `controllers/`: interpreta parâmetros e arquivos HTTP, valida entrada básica, define status/headers e serializa respostas. Não contém regras de negócio nem acesso direto ao filesystem.
- `services/`: aplica regras de negócio, coordena gravação, registro de metadados e compensação quando necessário.
- `repositories/`: mantém e consulta os metadados em memória. Não conhece Express nem detalhes de HTTP.
- Multer com `diskStorage` grava exclusivamente em `STORAGE_DIR`. O nome físico é gerado pela aplicação; o nome original permanece como metadado.
- Erros de Multer e de filesystem são convertidos em respostas HTTP nos limites da aplicação.

### Frontend

- Stack: React + Vite, ESM, componentes funcionais e Hooks.
- Organização por `components/`, `pages/` e `services/`.
- Comunicação por `fetch` usando prefixo `/api` e proxy do Vite.
- A interface permite selecionar e enviar um arquivo, consultar a lista e iniciar o download. Erros de API são tratados e apresentados sem indicar sucesso indevido.

### Armazenamento e limites conhecidos

- Arquivos no filesystem local de `backend/storage`; metadados apenas em memória.
- Não adicionar banco de dados, armazenamento externo ou serviço de upload de terceiros.
- A remoção manual ou perda de arquivos não é reconciliada automaticamente com o catálogo nesta versão.
- Como não há autenticação, o identificador `owner` e o filtro por dono não oferecem segurança multiusuário.

## 8. Plano de execução

As etapas abaixo descrevem implementação futura. Esta especificação não executa nem altera arquivos de backend ou frontend.

1. **Fechar parâmetros do MVP:** definir limite padrão de upload, política de tipos MIME, valores de desenvolvimento para porta e diretório, e confirmar o identificador de usuário local. Critério: configuração e comportamento de validação documentados.
2. **Implementar armazenamento e metadados no backend:** configurar Multer `diskStorage` no diretório local, gerar nomes internos seguros e criar repositório em memória conforme o modelo. Critério: arquivo gravado localmente e metadados consultáveis em memória.
3. **Implementar regras de negócio:** coordenar upload, validação, criação de metadados e remoção compensatória em caso de falha; implementar listagem por dono e resolução de download. Critério: serviços não dependem de Express e respeitam as regras de consistência.
4. **Expor os contratos HTTP:** implementar controllers e rotas para upload, listagem e download, incluindo status, headers e formato de erro especificados. Critério: os três endpoints atendem aos contratos e não expõem caminhos locais.
5. **Testar o backend:** adicionar testes com `node:test` para sucesso, arquivo ausente, limite/tipo inválido, listagem vazia e preenchida, documento inexistente, falha de arquivo e compensação. Critério: testes isolam o diretório temporário e validam respostas HTTP sem depender de armazenamento externo.
6. **Implementar a experiência web:** criar serviço de API e interface de upload, listagem e download com estados de carregamento, sucesso e erro. Critério: chamadas usam `/api` e a interface apresenta os metadados retornados pelo backend.
7. **Validar integração e documentação operacional:** executar testes e verificações disponíveis, confirmar proxy frontend-backend e documentar variáveis de ambiente, inicialização e limitações de persistência/identidade. Critério: fluxo completo funciona localmente e os limites do MVP estão explícitos.
