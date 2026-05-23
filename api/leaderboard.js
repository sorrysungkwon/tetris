const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY_ALL   = 'neon-tetris-lb';
const KEY_DAILY = () => `neon-tetris-daily-${new Date().toISOString().slice(0,10)}`; // e.g. neon-tetris-daily-2026-05-23
const TOP = 7;
const DAILY_TTL = 60 * 60 * 26; // 26 hours so the key survives the full day + buffer

async function redis(cmd) {
  const res = await fetch(`${REDIS_URL}/${cmd}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  return res.json();
}

// member format: "name#timestamp" — display only the part before #
function parseMember(member) {
  const decoded = decodeURIComponent(member);
  const idx = decoded.lastIndexOf('#');
  return idx === -1 ? decoded : decoded.slice(0, idx);
}

async function getBoard(key) {
  const data = await redis(`zrange/${key}/0/${TOP - 1}/rev/withscores`);
  const raw = data.result || [];
  const board = [];
  for (let i = 0; i < raw.length; i += 2) {
    board.push({ name: parseMember(raw[i]), score: parseInt(raw[i + 1], 10) });
  }
  return board;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const daily = KEY_DAILY();

  if (req.method === 'GET') {
    const [board, dailyBoard] = await Promise.all([getBoard(KEY_ALL), getBoard(daily)]);
    return res.status(200).json({ board, dailyBoard });
  }

  if (req.method === 'POST') {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'name and score required' });
    }
    const clean = String(name).slice(0, 12).replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ\s\-_.]/g, '');
    if (!clean) return res.status(400).json({ error: 'invalid name' });

    const member = encodeURIComponent(`${clean}#${Date.now()}`);

    // Write to both all-time and daily boards in parallel
    await Promise.all([
      redis(`zadd/${KEY_ALL}/${score}/${member}`),
      redis(`zadd/${daily}/${score}/${member}`),
    ]);

    // Trim all-time to top 100; set TTL on daily key
    await Promise.all([
      redis(`zremrangebyrank/${KEY_ALL}/0/-101`),
      redis(`expire/${daily}/${DAILY_TTL}`),
    ]);

    const [board, dailyBoard] = await Promise.all([getBoard(KEY_ALL), getBoard(daily)]);

    // rank on all-time board
    const rankData = await redis(`zcount/${KEY_ALL}/${score + 1}/+inf`);
    const rank = (rankData.result || 0) + 1;

    // daily rank
    const dailyRankData = await redis(`zcount/${daily}/${score + 1}/+inf`);
    const dailyRank = (dailyRankData.result || 0) + 1;

    return res.status(200).json({ board, dailyBoard, rank, dailyRank });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
