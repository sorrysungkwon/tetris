const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY_ALL   = 'glowtris-lb';
const KEY_DAILY = () => `glowtris-daily-${new Date().toISOString().slice(0,10)}`;
const KEY_WEEKLY = () => {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return `glowtris-weekly-${d.toISOString().slice(0,10)}`;
};
const KEY_CHALLENGE = () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `daily:${today}`;
};
const KEY_CHALLENGE_ALLTIME = 'challenge:alltime';
const TOP = 10;
const TOP_ALLTIME = 20;
const DAILY_TTL  = 60 * 60 * 26;
const WEEKLY_TTL = 60 * 60 * 24 * 8;

// Score bounds: 0 < score ≤ 10M (roughly 4+ hours of perfect play).
// Rejects obvious spoofed submissions without needing server-side game simulation.
const MAX_SCORE = 10_000_000;

// Rate limit: max 5 POST submissions per IP per 60s window.
const RATE_LIMIT  = 5;
const RATE_WINDOW = 60; // seconds

async function redis(cmd) {
  const res = await fetch(`${REDIS_URL}/${cmd}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  return res.json();
}

function parseMember(member) {
  const decoded = decodeURIComponent(member);
  const idx = decoded.lastIndexOf('#');
  return idx === -1 ? decoded : decoded.slice(0, idx);
}

async function getBoard(key, limit = TOP) {
  const data = await redis(`zrange/${key}/0/${limit - 1}/rev/withscores`);
  const raw = data.result || [];
  const board = [];
  for (let i = 0; i < raw.length; i += 2) {
    board.push({ name: parseMember(raw[i]), score: parseInt(raw[i + 1], 10) });
  }
  return board;
}

// Returns true if the IP has exceeded the rate limit, false otherwise.
// Costs 1 Redis command on hot path (INCR), +1 EXPIRE on first hit in window.
async function checkRateLimit(ip) {
  const key = `rl:${ip.replace(/[^a-fA-F0-9.:]/g, '_')}`;
  const incr = await redis(`incr/${key}`);
  const count = incr.result || 0;
  if (count === 1) {
    // First request in this window — set expiry (fire-and-forget, no await needed)
    redis(`expire/${key}/${RATE_WINDOW}`);
  }
  return count > RATE_LIMIT;
}

// Deduplication: keep only personal best for each clean name.
// Returns true if the new score was written, false if an equal/higher score already exists.
async function deduplicateAndAdd(key, cleanName, newScore, newMember) {
  const data = await redis(`zrange/${key}/0/-1/withscores`);
  const raw = data.result || [];
  const oldMembers = [];
  let personalBest = -Infinity;
  for (let i = 0; i < raw.length; i += 2) {
    if (parseMember(raw[i]) === cleanName) {
      oldMembers.push(raw[i]);
      personalBest = Math.max(personalBest, parseInt(raw[i + 1], 10));
    }
  }
  if (personalBest >= newScore) return false;
  if (oldMembers.length > 0) {
    const encoded = oldMembers.map(m => encodeURIComponent(m)).join('/');
    await redis(`zrem/${key}/${encoded}`);
  }
  await redis(`zadd/${key}/${newScore}/${newMember}`);
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const daily  = KEY_DAILY();
  const weekly = KEY_WEEKLY();

  if (req.method === 'GET') {
    // Cache GET responses at the Vercel edge for 60s.
    // Cuts Redis reads ~50% at zero cost — extends Upstash free tier from ~416 to ~700 DAU.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    const url = req.url ? new URL(req.url, 'http://localhost') : null;
    const isChallenge = (req.query && (req.query.mode === 'daily' || req.query.challenge === '1')) ||
                        (url && (url.searchParams.get('mode') === 'daily' || url.searchParams.get('challenge') === '1'));

    if (isChallenge) {
      const [challengeBoard, challengeAlltimeBoard] = await Promise.all([
        getBoard(KEY_CHALLENGE()),
        getBoard(KEY_CHALLENGE_ALLTIME, TOP_ALLTIME),
      ]);
      return res.status(200).json({ challengeBoard, challengeAlltimeBoard });
    }

    const [board, dailyBoard, weeklyBoard] = await Promise.all([
      getBoard(KEY_ALL, TOP_ALLTIME),
      getBoard(daily),
      getBoard(weekly),
    ]);
    return res.status(200).json({ board, dailyBoard, weeklyBoard });
  }

  if (req.method === 'POST') {
    // --- Rate limiting ---
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    if (await checkRateLimit(ip)) {
      return res.status(429).json({ error: 'too many requests' });
    }

    const { name, score, mode } = req.body;

    // --- Input validation ---
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'name and score required' });
    }
    if (!Number.isInteger(score) || score <= 0 || score > MAX_SCORE) {
      return res.status(400).json({ error: 'score out of range' });
    }
    const clean = String(name).slice(0, 12).replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ\s\-_.]/g, '');
    if (!clean) return res.status(400).json({ error: 'invalid name' });

    const member = encodeURIComponent(`${clean}#${Date.now()}`);
    const isChallenge = mode === 'daily' || req.body.challenge === 1;

    if (isChallenge) {
      const key = KEY_CHALLENGE();
      await Promise.all([
        deduplicateAndAdd(key, clean, score, member),
        deduplicateAndAdd(KEY_CHALLENGE_ALLTIME, clean, score, member),
      ]);
      await Promise.all([
        redis(`expire/${key}/${DAILY_TTL}`),
        redis(`zremrangebyrank/${KEY_CHALLENGE_ALLTIME}/0/-101`),
      ]);

      const [challengeBoard, challengeAlltimeBoard] = await Promise.all([
        getBoard(key),
        getBoard(KEY_CHALLENGE_ALLTIME, TOP_ALLTIME),
      ]);
      const rankData = await redis(`zcount/${key}/${score + 1}/+inf`);
      const challengeRank = (rankData.result || 0) + 1;
      const alltimeRankData = await redis(`zcount/${KEY_CHALLENGE_ALLTIME}/${score + 1}/+inf`);
      const challengeAlltimeRank = (alltimeRankData.result || 0) + 1;

      return res.status(200).json({ challengeBoard, challengeRank, challengeAlltimeBoard, challengeAlltimeRank });
    }

    await Promise.all([
      deduplicateAndAdd(KEY_ALL, clean, score, member),
      deduplicateAndAdd(daily, clean, score, member),
      deduplicateAndAdd(weekly, clean, score, member),
    ]);

    await Promise.all([
      redis(`zremrangebyrank/${KEY_ALL}/0/-101`),
      redis(`expire/${daily}/${DAILY_TTL}`),
      redis(`expire/${weekly}/${WEEKLY_TTL}`),
    ]);

    const [board, dailyBoard, weeklyBoard] = await Promise.all([
      getBoard(KEY_ALL, TOP_ALLTIME),
      getBoard(daily),
      getBoard(weekly),
    ]);

    const rankData = await redis(`zcount/${KEY_ALL}/${score + 1}/+inf`);
    const rank = (rankData.result || 0) + 1;
    const dailyRankData = await redis(`zcount/${daily}/${score + 1}/+inf`);
    const dailyRank = (dailyRankData.result || 0) + 1;
    const weeklyRankData = await redis(`zcount/${weekly}/${score + 1}/+inf`);
    const weeklyRank = (weeklyRankData.result || 0) + 1;

    return res.status(200).json({ board, dailyBoard, weeklyBoard, rank, dailyRank, weeklyRank });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
