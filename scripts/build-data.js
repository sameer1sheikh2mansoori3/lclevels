const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../lc_ratings.json'), 'utf8'));

function getCFTier(rating) {
  if (rating < 1200) return 'Newbie';
  if (rating < 1400) return 'Pupil';
  if (rating < 1600) return 'Apprentice';
  if (rating < 1900) return 'Specialist';
  if (rating < 2100) return 'Expert';
  if (rating < 2300) return 'Candidate Master';
  if (rating < 2400) return 'Master';
  return 'Grandmaster';
}

function getDifficultyCategory(rating) {
  if (rating < 1400) return 'Easy';
  if (rating < 1750) return 'Medium';
  if (rating < 2100) return 'Medium-Hard';
  if (rating < 2400) return 'Hard';
  return 'Very Hard';
}

const existingIds = new Set();

const processed = raw.map(item => {
  const isBiweekly = item.ContestSlug.toLowerCase().startsWith('biweekly');
  const contestType = isBiweekly ? 'biweekly' : 'weekly';
  const match = item.ContestSlug.match(/\d+/);
  const contestNum = match ? parseInt(match[0], 10) : 0;
  const exactRating = Number(item.Rating.toFixed(1));
  const roundedRating = Math.round(item.Rating);

  existingIds.add(item.ID);

  return {
    id: item.ID,
    title: item.Title,
    titleSlug: item.TitleSlug,
    rating: roundedRating,
    exactRating: exactRating,
    contestSlug: item.ContestSlug,
    contestName: item.ContestID_en || (isBiweekly ? `Biweekly Contest ${contestNum}` : `Weekly Contest ${contestNum}`),
    contestType: contestType,
    contestNum: contestNum,
    problemIndex: item.ProblemIndex,
    url: `https://leetcode.com/problems/${item.TitleSlug}/`,
    contestUrl: `https://leetcode.com/contest/${item.ContestSlug}/`,
    cfTier: getCFTier(item.Rating),
    difficultyCategory: getDifficultyCategory(item.Rating),
    isPendingRating: false,
  };
});

// Check if pendingContests exists (e.g. newly concluded contests whose ratings are still computing)
const pendingFile = path.join(__dirname, '../src/data/pendingContests.json');
if (fs.existsSync(pendingFile)) {
  const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
  for (const item of pending) {
    if (!existingIds.has(item.id)) {
      processed.push({
        ...item,
        rating: Math.round(item.exactRating),
        cfTier: getCFTier(item.exactRating),
        difficultyCategory: getDifficultyCategory(item.exactRating),
        isPendingRating: true,
      });
      existingIds.add(item.id);
    }
  }
}

// Sort by default in INCREASING ORDER of difficulty (rating)
processed.sort((a, b) => a.exactRating - b.exactRating);

const outDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'problems.json'), JSON.stringify(processed, null, 2));

// Also sync to extension
const extDir = path.join(__dirname, '../extension/data');
if (!fs.existsSync(extDir)) {
  fs.mkdirSync(extDir, { recursive: true });
}
fs.writeFileSync(path.join(extDir, 'problems.json'), JSON.stringify(processed, null, 2));

console.log(`Successfully generated ${processed.length} problems sorted by difficulty ascending.`);
console.log(`Latest Weekly Contest: Weekly ${Math.max(...processed.filter(p => p.contestType === 'weekly').map(p => p.contestNum))}`);
console.log(`Lowest rating: ${processed[0].title} (${processed[0].exactRating})`);
console.log(`Highest rating: ${processed[processed.length - 1].title} (${processed[processed.length - 1].exactRating})`);
