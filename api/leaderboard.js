const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'neon-glowtris-lb';
const TOP = 10;

async function redis(cmd) {
  const res = await fetch(`${REDIS_URL}/${cmd}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  return res.json();
}

// member 형식: "이름#타임스탬프" → 표시 시 # 앞부분만 사용
function parseMember(member) {
  const decoded = decodeURIComponent(member);
  const idx = decoded.lastIndexOf('#');
  return idx === -1 ? decoded : decoded.slice(0, idx);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const data = await redis(`zrange/${KEY}/0/${TOP - 1}/rev/withscores`);
    const raw = data.result || [];
    const board = [];
    for (let i = 0; i < raw.length; i += 2) {
      board.push({ name: parseMember(raw[i]), score: parseInt(raw[i + 1], 10) });
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

    // 이름#타임스탬프 → 항상 새 항목으로 추가
    const member = encodeURIComponent(`${clean}#${Date.now()}`);
    await redis(`zadd/${KEY}/${score}/${member}`);

    // 상위 100개만 유지
    await redis(`zremrangebyrank/${KEY}/0/-101`);

    const data = await redis(`zrange/${KEY}/0/${TOP - 1}/rev/withscores`);
    const raw = data.result || [];
    const board = [];
    for (let i = 0; i < raw.length; i += 2) {
      board.push({ name: parseMember(raw[i]), score: parseInt(raw[i + 1], 10) });
    }

    // 내 항목의 순위: 전체에서 내 점수보다 높은 항목 수 + 1
    const rankData = await redis(`zcount/${KEY}/${score + 1}/+inf`);
    const rank = (rankData.result || 0) + 1;

    return res.status(200).json({ board, rank });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
