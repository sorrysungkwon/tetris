const URL   = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY   = 'neon-glowtris-lb';
const TOP   = 10;

async function redis(cmd) {
  const res = await fetch(`${URL}/${cmd}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // ZRANGE leaderboard 0 9 REV WITHSCORES
    const data = await redis(`zrange/${KEY}/0/${TOP - 1}/rev/withscores`);
    const raw = data.result || [];
    const board = [];
    for (let i = 0; i < raw.length; i += 2) {
      board.push({ name: decodeURIComponent(raw[i]), score: parseInt(raw[i + 1], 10) });
    }
    return res.status(200).json({ board });
  }

  if (req.method === 'POST') {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'name and score required' });
    }
    const clean = String(name).slice(0, 12).replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ\s\-_.]/g, '');
    if (!clean) return res.status(400).json({ error: 'invalid name' });

    // ZADD GT: only update if new score is higher
    await redis(`zadd/${KEY}/GT/${score}/${encodeURIComponent(clean)}`);

    // trim to top 100
    await redis(`zremrangebyrank/${KEY}/0/-101`);

    const data = await redis(`zrange/${KEY}/0/${TOP - 1}/rev/withscores`);
    const raw = data.result || [];
    const board = [];
    for (let i = 0; i < raw.length; i += 2) {
      board.push({ name: decodeURIComponent(raw[i]), score: parseInt(raw[i + 1], 10) });
    }
    const rank = board.findIndex(e => e.name === clean) + 1;
    return res.status(200).json({ board, rank });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
