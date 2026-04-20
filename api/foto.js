// api/foto.js
// Upload de foto - salva base64 no próprio Redis (até 10MB por entry no Upstash)

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
  try { return JSON.parse(raw); } catch { return []; }
}

async function saveTarefas(tarefas) {
  await redisCmd("SET", TAREFAS_KEY, JSON.stringify(tarefas));
  await redisCmd("SET", "limpeza:lastupdate", Date.now().toString());
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { id, foto } = req.body;
    if (!id || !foto) {
      return res.status(400).json({ erro: "ID e foto obrigatórios" });
    }

    // Comprime a imagem se necessário (já vem como base64 do frontend)
    // Salva a foto no Redis com chave separada para não inflar a lista de tarefas
    const fotoKey = `limpeza:foto:${id}`;
    await redisCmd("SET", fotoKey, foto);
    await redisCmd("EXPIRE", fotoKey, 2592000); // 30 dias

    // Atualiza o registro da tarefa com referência à foto
    const tarefas = await getTarefas();
    const idx = tarefas.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tarefas[idx].foto = `/api/foto?id=${id}`;
      await saveTarefas(tarefas);
    }

    return res.status(200).json({ ok: true, url: `/api/foto?id=${id}` });
  } catch (err) {
    console.error("Erro upload foto:", err);
    return res.status(500).json({ erro: "Erro ao salvar foto" });
  }
}
