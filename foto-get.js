// api/foto/[id].js  (ou tratado pelo mesmo api/foto.js via query param GET)
// Servir imagem salva no Redis

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
  const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const data = await res.json();
  return data.result;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "GET") {
    const { id } = req.query;
    if (!id) return res.status(400).send("ID obrigatório");

    const base64 = await redisGet(`limpeza:foto:${id}`);
    if (!base64) return res.status(404).send("Foto não encontrada");

    // base64 pode ser data URL (data:image/jpeg;base64,...)
    const match = base64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const contentType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.status(200).send(buffer);
    }

    // Se for base64 puro
    const buffer = Buffer.from(base64, "base64");
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(buffer);
  }

  return res.status(405).end();
}
