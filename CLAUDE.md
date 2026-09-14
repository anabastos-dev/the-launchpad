# The Launchpad — Contexto do Projeto

Ferramenta interna da Minimal Club para planejamento e upload de campanhas de marketing no ClickUp. Desenvolvida por Ana Bastos com Claude Code.

## URLs

- **Frontend:** https://the-launchpad-nu.vercel.app
- **Backend:** https://backend-ten-chi-jleyncxvf6.vercel.app
- **ClickUp workspace:** https://app.clickup.com/31012836

## Stack

- **Frontend:** React + Vite (Vercel)
- **Backend:** Express.js ESM (`"type": "module"`) (Vercel serverless)
- **API:** ClickUp API v2

## Deploy

O backend usa Vercel serverless. Após cada deploy, o alias precisa ser re-apontado:

```bash
cd backend
npx vercel deploy --prod
# Pegar a URL de preview gerada (ex: backend-xxx.vercel.app)
npx vercel alias {preview-url} backend-ten-chi-jleyncxvf6.vercel.app
```

> **Importante:** o `.env` local tem token inválido. Todas as chamadas ao ClickUp precisam ir pelo backend deployado no Vercel, que tem as env vars corretas.

## Estrutura de Pastas

```
minimal-dashboard/
├── backend/
│   └── src/
│       ├── routes/agent.js   # Endpoints principais (upload, delete, etc.)
│       └── clickup.js        # Funções wrapper da ClickUp API
└── frontend/
    └── src/
```

## ClickUp — Configuração

| Variável | Valor |
|---|---|
| TEAM_ID | `31012836` |
| FOLDER_ID | `90135153539` |
| Template list (excluída) | `CLICKUP_TEMPLATE_LIST_ID` (env var no Vercel) |

### Custom Fields

| Campo | ID |
|---|---|
| Fase da Campanha | `b16eadf9-ee56-4761-8ed1-929b1f28235a` |
| Etapa Limitante | `69a14be9-6e97-4178-a0ac-03cfc350ef61` |

### Fase da Campanha — UUIDs

| Fase | UUID |
|---|---|
| Kickoff | `3ae35628-...` (ver agent.js) |
| Estratégia | `c7c31a5a-...` |
| Produção | `bf6f9fbb-...` |
| Pré-lançamento | `26e26426-...` |
| Live | `ff5bdb52-...` |
| Retrospectiva | `2b4f7aaa-...` |

### Etapa Limitante — UUIDs

| Valor | UUID |
|---|---|
| Sim | `d5f995e8-...` |
| Não | `be8d60ff-...` |

> UUIDs completos estão em `backend/src/routes/agent.js` nas constantes `FASE_MAP` e `EL_MAP`.

## Listas de Campanhas (ClickUp)

| Campanha | List ID |
|---|---|
| Aumento de Preços | `901327733805` |
| Lucro Zero — Camiseta Vinho | `901328715630` ✅ upado |
| Lançamento Jeans Comfort | `901328715327` ✅ upado |

## Time de Marketing — Nomes no ClickUp

A resolução de membros usa matching normalizado + email prefix. Nomes a usar no JSON das campanhas:

| Nome no time | Nome para usar no JSON |
|---|---|
| Ana Bastos | `Ana Bastos` |
| Pedro Nasser | `Pedro Nasser` |
| Daniel Magalhães | `Daniel Magalhães` |
| Carolina Amaral | `Carolina Amaral` |
| Gabriel Tolentino | `Gabriel Tolentino` |
| Lucas Kurt | `Lucas Kurt` |
| Bárbara Dias | `Bárbara Dias` (resolve via email prefix) |
| Andre Filizola | `Andre Filizola` (resolve via email prefix, nome no ClickUp tem zz duplo) |
| Diogo Drumond (Dioninha) | `Diogo Drumond` |
| Manuela Antunes | `Manuela Antunes` |
| Sofia Amaral | `Sofia Amaral` |
| Victor Medeiros | `Victor Medeiros` |
| Gabriel Glatz | `Gabriel Glatz` |
| Marconi | `Marconi` |
| Jonathan | `Jonathan` |

## Workflow para Subir uma Campanha

1. Montar o JSON da campanha (ver estrutura abaixo)
2. Rodar o script Python de upload grupo a grupo (2-3s de delay entre grupos para evitar timeout do Vercel)
3. Se algum grupo der erro 500 ou timeout, retentar só ele individualmente

### Estrutura do JSON de Campanha

```json
{
  "campaignName": "Nome da Campanha",
  "grupos": [
    {
      "name": "Nome do Grupo",
      "assignees": ["Nome Membro"],
      "due_date": "2026-09-09",
      "fase": "Kickoff",
      "el": "Sim",
      "tarefas": [
        {
          "name": "Nome da Tarefa",
          "assignees": ["Nome Membro"],
          "due_date": "2026-09-04",
          "fase": "Produção",
          "el": "Sim",
          "subtarefas": [
            {
              "name": "Nome da Subtarefa",
              "assignees": ["Nome Membro"],
              "due_date": "2026-09-04",
              "fase": "Produção",
              "el": "Não"
            }
          ]
        }
      ]
    }
  ]
}
```

### Script de Upload

```python
import json, urllib.request, time

LIST_ID = "XXXXXXXXX"  # ID da lista no ClickUp
BASE_URL = "https://backend-ten-chi-jleyncxvf6.vercel.app"

with open("campanha.json") as f:
    campaign = json.load(f)

for i, grupo in enumerate(campaign["grupos"]):
    print(f"[{i+1}] {grupo['name']}")
    payload = json.dumps({"listId": LIST_ID, "grupos": [grupo]}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/agent/upload",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=55) as resp:
        print("OK:", json.loads(resp.read()))
    if i < len(campaign["grupos"]) - 1:
        time.sleep(3)
```

## Endpoint para Deletar Todas as Tarefas de uma Lista

Útil quando sobe errado e precisa resubir do zero:

```bash
curl -X DELETE https://backend-ten-chi-jleyncxvf6.vercel.app/api/agent/delete-list-tasks/{LIST_ID}
```

## Issues Conhecidos

- **Finalizar campanha no dashboard:** botão não funciona (Vercel serverless é stateless, `finalized.json` não persiste) — a resolver
- **Chat do agente no app:** markdown aparece como texto puro em vez de renderizado — a resolver
- **Timeout do Vercel:** funções serverless têm timeout curto; grupos grandes podem falhar na primeira tentativa. Retentar individualmente sempre funciona.
