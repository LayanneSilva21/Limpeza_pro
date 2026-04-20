# 🧹 Limpeza Pro — Deploy no Vercel

## Stack
- **Frontend**: HTML/CSS/JS puro (sem framework)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Banco de dados**: Upstash Redis (gratuito, tempo real, sem Firebase/Supabase)
- **Tempo real**: Server-Sent Events (SSE) com fallback polling 3s

---

## 🚀 Passo a Passo: Deploy em 10 minutos

### 1. Criar banco de dados Upstash Redis (GRÁTIS)

1. Acesse **https://upstash.com** e crie uma conta gratuita
2. Clique em **"Create Database"**
3. Escolha:
   - **Name**: `limpeza-pro`
   - **Region**: `us-east-1` (ou mais próxima do Brasil: `sa-east-1`)
   - **Type**: Regional
4. Clique em **"Create"**
5. Na página do banco criado, vá em **"REST API"**
6. Copie as duas variáveis:
   - `UPSTASH_REDIS_REST_URL` (começa com `https://...upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (string longa)

---

### 2. Subir no GitHub

1. Crie um repositório no **https://github.com**
2. Faça upload de todos os arquivos desta pasta
3. Estrutura final:
```
limpeza-pro/
├── public/
│   └── index.html
├── api/
│   ├── tarefas.js
│   ├── stream.js
│   ├── foto.js
│   └── foto-get.js
├── package.json
├── vercel.json
└── README.md
```

---

### 3. Deploy no Vercel

1. Acesse **https://vercel.com** e faça login com o GitHub
2. Clique em **"New Project"**
3. Importe o repositório `limpeza-pro`
4. **IMPORTANTE — Adicionar variáveis de ambiente:**
   - Clique em **"Environment Variables"**
   - Adicione:
     ```
     UPSTASH_REDIS_REST_URL = https://sua-url.upstash.io
     UPSTASH_REDIS_REST_TOKEN = seu-token-aqui
     ```
5. Clique em **"Deploy"**
6. Aguarde ~1 minuto
7. ✅ Seu app está no ar!

---

## 🔑 Senhas de acesso

| Usuário | Senha |
|---------|-------|
| Administrador | `813147` |
| Ana, Beatriz, Claudio... | `1234` |

Para alterar senhas dos funcionários, edite o objeto `senhas` dentro da função `fazerLogin()` no `public/index.html`.

---

## ⚡ Como funciona o tempo real

1. Quando o admin adiciona uma tarefa → API salva no Redis → publica timestamp de atualização
2. Funcionários conectados recebem evento via **SSE** em ~1-2 segundos
3. Se SSE falhar (conexão instável), o sistema cai automaticamente para **polling a cada 3 segundos**
4. O indicador 🟢/🔴 no canto inferior direito mostra o status da conexão

---

## 📁 Estrutura dos arquivos

| Arquivo | Função |
|---------|--------|
| `public/index.html` | Frontend completo (login, admin, funcionário) |
| `api/tarefas.js` | CRUD de tarefas (GET/POST/PUT/DELETE) |
| `api/stream.js` | SSE para atualizações em tempo real |
| `api/foto.js` | Upload de fotos (POST) |
| `api/foto-get.js` | Servir fotos salvas (GET) |
| `vercel.json` | Configuração de rotas e headers |

---

## 🆓 Plano gratuito Upstash

- **10.000 comandos/dia** — suficiente para uso intenso
- **256MB de storage** — comporta milhares de tarefas e fotos
- **Sem cartão de crédito necessário**

---

## 🛠️ Personalização

### Adicionar funcionários
No `public/index.html`, procure por `<select id="select-user">` e `<select id="adm-func">` e adicione as opções.
Também adicione a senha no objeto `senhas` dentro de `fazerLogin()`.

### Adicionar andares
No `<select id="adm-andar">`, adicione novas `<option>`.
