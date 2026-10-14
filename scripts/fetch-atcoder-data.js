const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Fetching AtCoder problem models and problems...');

  const [modelsRes, problemsRes, contestsRes] = await Promise.all([
    fetch('https://kenkoooo.com/atcoder/resources/problem-models.json'),
    fetch('https://kenkoooo.com/atcoder/resources/problems.json'),
    fetch('https://kenkoooo.com/atcoder/resources/contests.json'),
  ]);

  const models = await modelsRes.json();
  const problems = await problemsRes.json();
  const contests = await contestsRes.json();

  console.log(`Loaded ${Object.keys(models).length} models, ${problems.length} problems, ${contests.length} contests.`);

  const contestMap = new Map();
  for (const c of contests) {
    contestMap.set(c.id, c);
  }

  function getContestType(cid) {
    const lower = cid.toLowerCase();
    if (lower.startsWith('abc')) return 'abc';
    if (lower.startsWith('arc')) return 'arc';
    if (lower.startsWith('agc')) return 'agc';
    return 'other';
  }

  function getAtCoderColor(rating) {
    if (rating < 400) return { level: 1, name: 'Gray', hex: '#808080' };
    if (rating < 800) return { level: 2, name: 'Brown', hex: '#8C4B00' };
    if (rating < 1200) return { level: 3, name: 'Green', hex: '#008000' };
    if (rating < 1600) return { level: 4, name: 'Cyan', hex: '#00C0C0' };
    if (rating < 2000) return { level: 5, name: 'Blue', hex: '#0000FF' };
    if (rating < 2400) return { level: 6, name: 'Yellow', hex: '#C0C000' };
    if (rating < 2800) return { level: 7, name: 'Orange', hex: '#FF8000' };
    return { level: 8, name: 'Red', hex: '#FF0000' };
  }

  const formattedProblems = [];

  for (const p of problems) {
    const model = models[p.id];
    // We only keep problems that have difficulty rating or are standard ABC/ARC/AGC
    const contestType = getContestType(p.contest_id);
    if (contestType === 'other') continue;

    const contest = contestMap.get(p.contest_id);
    const contestName = contest?.title || p.contest_id.toUpperCase();
    const contestEpoch = contest?.start_epoch_second || 0;

    let rating = model?.difficulty;
    if (rating === undefined || rating === null) {
      // Estimate if missing
      const idx = (p.problem_index || 'A').toUpperCase();
      if (contestType === 'abc') {
        const est = { A: 100, B: 250, C: 500, D: 900, E: 1300, F: 1700, G: 2100, EX: 2400 };
        rating = est[idx] || 1000;
      } else if (contestType === 'arc') {
        const est = { A: 900, B: 1400, C: 1900, D: 2300, E: 2700, F: 3100 };
        rating = est[idx] || 1500;
      } else {
        const est = { A: 1500, B: 2000, C: 2500, D: 2900, E: 3300, F: 3600 };
        rating = est[idx] || 2200;
      }
    }

    // Clip negative ratings to positive for friendly display (Kenkoooo calculates negative for very easy)
    const displayRating = Math.max(0, Math.round(rating));
    const colorInfo = getAtCoderColor(displayRating);

    formattedProblems.push({
      id: p.id,
      contestId: p.contest_id,
      contestName,
      contestType,
      problemIndex: (p.problem_index || 'A').toUpperCase(),
      title: p.title || p.name,
      exactRating: displayRating,
      level: colorInfo.level,
      levelName: colorInfo.name,
      levelColor: colorInfo.hex,
      startEpoch: contestEpoch,
      url: `https://atcoder.jp/contests/${p.contest_id}/tasks/${p.id}`,
    });
  }

  // Sort default: increasing difficulty
  formattedProblems.sort((a, b) => a.exactRating - b.exactRating);

  console.log(`Total formatted ABC/ARC/AGC problems: ${formattedProblems.length}`);

  const outPath = path.join(__dirname, '../src/data/atcoderProblems.json');
  fs.writeFileSync(outPath, JSON.stringify(formattedProblems, null, 2));
  console.log(`Saved to ${outPath}`);

  // Also save copy for extension
  const extPath = path.join(__dirname, '../extension/data/atcoderProblems.json');
  const extDir = path.dirname(extPath);
  if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true });
  fs.writeFileSync(extPath, JSON.stringify(formattedProblems, null, 2));
  console.log(`Saved to ${extPath}`);
}

main().catch(console.error);

