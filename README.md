# 🏆 LC Levels - LeetCode Contest Rating Ladders & Filter

A **Codeforces-levels style (CF Levels / C2Ladders)** platform and browser extension for LeetCode contest questions, featuring **Zerotrac's contest Elo difficulty ratings**.

Practice LeetCode contest problems in a structured ladder progression, filter by contest type, problem position, and master problems in **increasing order of difficulty**.

---

## 🚀 Features

- **Contest Filter**:
  - Filter by **Weekly Contest** (Contests 1 to 475+)
  - Filter by **Biweekly Contest** (Contests 1 to 155+)
  - Or view **All Contests**
- **Question Index / Position Filter**:
  - **Q1**: Easy / Warmup
  - **Q2**: Easy-Medium
  - **Q3**: Medium-Hard
  - **Q4**: Hard / Contest Boss
  - Multi-select or one-click presets (**Q1 only**, **Q2 only**, **Q3 only**, **Q4 only**, **Q3 & Q4**)
- **Sorted by Difficulty (Default)**:
  - All questions are sorted in **increasing order of difficulty** (exact Elo rating) from easiest to hardest.
  - Option to toggle to decreasing order or sort by contest date / problem ID.
- **CF Rating Ladders (Presets)**:
  - **Level 1 (Newbie)**: Rating `< 1300`
  - **Level 2 (Pupil)**: Rating `1300 - 1499`
  - **Level 3 (Apprentice)**: Rating `1500 - 1699`
  - **Level 4 (Specialist)**: Rating `1700 - 1899`
  - **Level 5 (Expert)**: Rating `1900 - 2099`
  - **Level 6 (Candidate Master)**: Rating `2100 - 2399`
  - **Level 7 (Grandmaster)**: Rating `2400+`
  - Custom rating range slider & number inputs
- **Progress Tracking & Gamification**:
  - Mark problems as **Solved** (triggers celebratory confetti 🎉)
  - **Star / Bookmark** problems for revision
  - Progress counters and completion percentage per level
  - Saved automatically to `localStorage` (no login required)
- **Random Problem Challenge (🎲)**:
  - Pick a random unsolved question matching your active filter & level.
- **Chrome / Brave / Edge Extension Included**:
  - Manifest V3 browser extension included in the `extension/` folder.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Dark theme with Codeforces rating tier colors)
- **Icons**: Lucide React
- **Animations**: Canvas Confetti
- **Dataset**: 2,608 contest problems with verified ratings

---

## 📦 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Or run production build
npm run build
npm run start -p 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment

### Option 1: Vercel (Recommended)
```bash
npx vercel
```

### Option 2: Static Export (GitHub Pages / Netlify / Cloudflare Pages)
```bash
npm run build:export
```
The static export will be generated in the `out/` folder, ready for drag-and-drop or Git-based deployment.

---

## 🧩 How to Install the Chrome Extension

1. Open Chrome, Brave, or Edge and go to:
   ```
   chrome://extensions
   ```
2. Turn ON **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the `extension/` folder in this repository:
   ```
   /home/sameer234/lclevel/extension
   ```
5. Pin **LC Levels** to your extension bar to filter contest questions directly from your browser!

# lclevels
