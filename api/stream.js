// api/stream.js
// Server-Sent Events para atualizações em tempo real via Upstash Redis Pub/Sub

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const config = {
  maxDuration: 60, // Vercel Pro: até 300s. Free: 60s
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Envia heartbeat imediato para estabelecer conexão
  res.write(`data: connected\n\n`);

  // Polling do Redis a cada 2 segundos para detectar mudanças
  // Upstash não tem WebSocket nativo no free tier, então polling leve é a abordagem
  let lastTimestamp = Date.now().toString();
  let alive = true;

  req.on("close", () => {
    alive = false;
  });

  const poll = async () => {
    if (!alive) return;

    try {
      // Busca o último timestamp publicado no canal
      const response = await fetch(`${UPSTASH_URL}/get/limpeza:lastupdate`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const data = await response.json();
      const current = data.result;

      if (current && current !== lastTimestamp) {
        lastTimestamp = current;
        res.write(`data: update\n\n`);
      }

      // Heartbeat a cada 20s para manter conexão viva
      res.write(`: heartbeat\n\n`);
    } catch (e) {
      // Silently continue
    }

    if (alive) {
      setTimeout(poll, 2000);
    }
  };

  // Começa polling após 1 segundo
  setTimeout(poll, 1000);

  // Mantém a conexão aberta
  await new Promise((resolve) => {
    req.on("close", resolve);
    // Timeout máximo do Vercel
    setTimeout(resolve, 55000);
  });

  res.end();
}
