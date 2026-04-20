// api/tarefas.js
// Backend completo de tarefas usando Upstash Redis via REST

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const TAREFAS_KEY = "limpeza:tarefas";

async function redisCmd(...args) {
  const res = await fetch(`${UPSTASH_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  return data.result;
}

async function getTarefas() {
  const raw = await redisCmd("GET", TAREFAS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveTarefas(tarefas) {
  // Salva tarefas e atualiza timestamp que o SSE usa para detectar mudanças
  await Promise.all([
    redisCmd("SET", TAREFAS_KEY, JSON.stringify(tarefas)),
    redisCmd("SET", "limpeza:lastupdate", Date.now().toString()),
  ]);
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // GET - Listar todas as tarefas
    if (req.method === "GET") {
      const tarefas = await getTarefas();
      return res.status(200).json({ tarefas });
    }

    // POST - Criar nova tarefa
    if (req.method === "POST") {
      const { andar, dia, usuario, tarefa } = req.body;
      if (!tarefa || !usuario) {
        return res.status(400).json({ erro: "Campos obrigatórios faltando" });
      }

      const tarefas = await getTarefas();
      const nova = {
        id: gerarId(),
        andar: andar || "Térreo",
        dia: dia || "Segunda",
        usuario,
        tarefa,
        status: "Pendente",
        dataCriacao: new Date().toLocaleDateString("pt-BR"),
        timestamp: Date.now(),
        foto: null,
        horarioInicio: null,
        horarioFim: null,
        inicioMs: null,
      };

      tarefas.unshift(nova);
      await saveTarefas(tarefas);
      return res.status(201).json({ tarefa: nova });
    }

    // PUT - Atualizar tarefa (status, foto, etc.)
    if (req.method === "PUT") {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ erro: "ID obrigatório" });

      const tarefas = await getTarefas();
      const idx = tarefas.findIndex((t) => t.id === id);
      if (idx === -1) return res.status(404).json({ erro: "Tarefa não encontrada" });

      tarefas[idx] = { ...tarefas[idx], ...updates };
      await saveTarefas(tarefas);
      return res.status(200).json({ tarefa: tarefas[idx] });
    }

    // DELETE - Excluir tarefa
    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ erro: "ID obrigatório" });

      let tarefas = await getTarefas();
      tarefas = tarefas.filter((t) => t.id !== id);
      await saveTarefas(tarefas);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
  } catch (err) {
    console.error("Erro na API:", err);
    return res.status(500).json({ erro: "Erro interno do servidor" });
  }
}
