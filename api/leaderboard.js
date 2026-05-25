const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY_ALL   = 'glowtris-lb';
const KEY_DAILY = () => `glowtris-daily-${new Date().toISOString().slice(0,10)}`; // e.g. glowtris-daily-2026-05-23
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
const KEY_CHALLENGE_ALLTIME = 'challenge:alltime'; // permanent — no TTL, trimmed to top 100
const TOP = 10;          // TODAY / WEEKLY / CHALLENGE-TODAY leaderboards
const TOP_ALLTIME = 20;  // ALL TIME leaderboards (marathon + challenge)
const DAILY_TTL = 60 * 60 * 26; // 26 hours so the key survives the full day + buffer
const WEEKLY_TTL = 60 * 60 * 24 * 8; // 8 days

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

async function getBoard(key, limit = TOP) {
  const data = await redis(`zrange/${key}/0/${limit - 1}/rev/withscores`);
  const raw = data.result || [];
  const board = [];
  for (let i = 0; i < raw.length; i += 2) {
    board.push({ name: parseMember(raw[i]), score: parseInt(raw[i + 1], 10) });
  }
  return board;
}

// Deduplication: remove all previous entries for cleanName from key if new score is higher,
// then add the new entry. Returns true if the score was submitted, false if an equal/higher
// personal best already exists (old record kept, new not added).
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
  if (personalBest >= newScore) {
    // Not a new personal best — don't overwrite the higher score
    return false;
  }
  // Remove stale entries for this name
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

  const daily = KEY_DAILY();
  const weekly = KEY_WEEKLY();

  if (req.method === 'GET') {
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

    const [board, dailyBoard, weeklyBoard] = await Promise.all([getBoard(KEY_ALL, TOP_ALLTIME), getBoard(daily), getBoard(weekly)]);
    return res.status(200).json({ board, dailyBoard, weeklyBoard });
  }

  if (req.method === 'POST') {
    const { name, score, mode } = req.body;
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'name and score required' });
    }
    const clean = String(name).slice(0, 12).replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ\s\-_.]/g, '');
    if (!clean) return res.status(400).json({ error: 'invalid name' });

    const member = encodeURIComponent(`${clean}#${Date.now()}`);
    const isChallenge = mode === 'daily' || req.body.challenge === 1;

    if (isChallenge) {
      const key = KEY_CHALLENGE();
      // Write to today's challenge board and all-time challenge board with deduplication
      await Promise.all([
        deduplicateAndAdd(key, clean, score, member),
        deduplicateAndAdd(KEY_CHALLENGE_ALLTIME, clean, score, member),
      ]);
      // Set TTL on today's key; trim alltime to top 100
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

    // Write to all boards with deduplication (personal best only)
    await Promise.all([
      deduplicateAndAdd(KEY_ALL, clean, score, member),
      deduplicateAndAdd(daily, clean, score, member),
      deduplicateAndAdd(weekly, clean, score, member),
    ]);

    // Trim all-time to top 100; set TTL on daily and weekly keys
    await Promise.all([
      redis(`zremrangebyrank/${KEY_ALL}/0/-101`),
      redis(`expire/${daily}/${DAILY_TTL}`),
      redis(`expire/${weekly}/${WEEKLY_TTL}`),
    ]);

    const [board, dailyBoard, weeklyBoard] = await Promise.all([getBoard(KEY_ALL, TOP_ALLTIME), getBoard(daily), getBoard(weekly)]);

    // rank on all-time board
    const rankData = await redis(`zcount/${KEY_ALL}/${score + 1}/+inf`);
    const rank = (rankData.result || 0) + 1;

    // daily rank
    const dailyRankData = await redis(`zcount/${daily}/${score + 1}/+inf`);
    const dailyRank = (dailyRankData.result || 0) + 1;

    // weekly rank
    const weeklyRankData = await redis(`zcount/${weekly}/${score + 1}/+inf`);
    const weeklyRank = (weeklyRankData.result || 0) + 1;

    return res.status(200).json({ board, dailyBoard, weeklyBoard, rank, dailyRank, weeklyRank });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
