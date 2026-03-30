DevArchive 
<div align="center">

# ⚡ DevArchive

### Turn any GitHub profile into a story, not just data.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Now-83aeff?style=for-the-badge)](https://your-demo-link.com)
[![GitHub Stars](https://img.shields.io/github/stars/YOUR_USERNAME/devarchive?style=for-the-badge&color=97f999&logo=github)](https://github.com/YOUR_USERNAME/devarchive/stargazers)
[![License](https://img.shields.io/badge/License-MIT-ffa366?style=for-the-badge)](LICENSE)
![Built With](https://img.shields.io/badge/Built_With-AI_%2B_Intuition-f38020?style=for-the-badge)

<br/>

> *GitHub gives you data. DevArchive gives you insight.*

<br/>

![DevArchive Dashboard Preview](https://via.placeholder.com/900x480/0a0e14/83aeff?text=Add+Your+Screenshot+Here)

</div>

---

## 🧠 The Problem

When you visit a GitHub profile, you still have to ask:

- *What is this developer actually good at?*
- *How impactful are their contributions?*
- *What's their dominant tech stack?*
- *How do they compare to other developers?*

GitHub shows you raw data — repositories, stars, follower counts. But it doesn't tell you the **story** behind the developer. You have to piece it together yourself.

**DevArchive solves this.**

It transforms any GitHub profile into a clean, visual, insight-driven experience — so you can understand a developer in seconds, not minutes.

Think of it as: **a portfolio intelligence layer on top of GitHub.**

---

## ✨ Features

<table>
<tr>
<td width="50%">

**👤 Profile Dashboard**
- Instant profile lookup with full metadata
- Animated language distribution chart
- Top 6 repositories ranked by stars
- Account age, location, company, blog

**🧠 Developer Score (0–100)**
- Custom algorithm across 5 weighted dimensions
- Grades: S / A / B / C with visual score ring
- Breakdown: Impact · Reach · Productivity · Quality · Maturity

**🌐 Ecosystem Map**
- Interactive D3.js force-directed graph
- Repos clustered by language around a hub node
- Drag, zoom, hover tooltips, click to open repos

</td>
<td width="50%">

**⚔️ Developer Comparison**
- Head-to-head stats across 8 categories
- Animated progress bars with winner detection
- Per-developer language breakdown
- Overall winner banner with tie support

**🔍 Repository Explorer**
- Search all of GitHub by keyword
- Filter by language · sort by stars, forks, date
- Paginated results up to 100 pages

**📦 Repository Deep Dive**
- Issues with labels, authors, comment counts
- Full release history with changelogs
- Top contributors ranked by commits

</td>
</tr>
</table>

---

## 🎬 See It In Action

| Profile Dashboard | Developer Comparison | Ecosystem Map |
|:---:|:---:|:---:|
| ![Dashboard](https://via.placeholder.com/280x180/0f141a/83aeff?text=Dashboard) | ![Compare](https://via.placeholder.com/280x180/0f141a/ffa366?text=Compare) | ![Graph](https://via.placeholder.com/280x180/080c11/97f999?text=D3+Graph) |
| Score, stats & languages | Side-by-side metrics | Interactive force graph |

> 💡 *Replace placeholders above with real screenshots before publishing*

---

## ⚙️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vanilla HTML + CSS + JS | Zero dependencies, maximum portability |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Visualization | D3.js v7 | Force graphs, custom layouts |
| Design System | Material Design 3 tokens | Consistent dark-mode palette |
| API | GitHub REST API v3 | Profile, repo, issue, release data |
| Proxy | Cloudflare Workers | Extend rate limit to 5,000 req/hr |
| Fonts | Inter + Space Grotesk | Clean, modern type hierarchy |

**No frameworks. No bundler. No `node_modules`.** Drop the HTML file anywhere — it just works.

---

## 🤖 Built With AI — Thoughtfully

This project was built through a modern AI-assisted workflow. Not blindly — *deliberately*.

| Tool | Role |
|---|---|
| **Google Stitch** | UI structure & layout inspiration |
| **Cursor** | Rapid iteration, refactoring, flow building |
| **Claude** | Architecture decisions, complex logic |
| **ChatGPT** | Debugging, API edge cases, polishing |

### How AI was actually used

Instead of asking AI to "write the app", I used it to:

- Break down complex features before touching code (score algorithm, D3 graph structure)
- Debug async flows and GitHub API rate limit handling
- Evaluate UI/UX tradeoffs before building
- Iterate 10× faster: build → test → break → refine → rebuild

The thinking was mine. The speed was AI's.

---

## 📊 Developer Score — How It Works

The score (0–100) is computed from five exponentially-weighted components:

```
Score = Impact(40) + Reach(25) + Productivity(15) + Quality(10) + Maturity(10)
```

| Component | Max | Formula |
|---|---|---|
| 🌍 Global Impact | 40 pts | `40 × (1 − e^(−(stars + forks×1.5) / 1500))` |
| 👥 Community Reach | 25 pts | `25 × (1 − e^(−followers / 300))` |
| 🏗️ Productivity | 15 pts | `15 × (1 − e^(−ownRepos / 30))` |
| 🏅 Code Quality | 10 pts | `10 × (1 − e^(−starsPerRepo / 40))` |
| 📅 Account Maturity | 10 pts | `min(10, accountAgeInYears)` |

**Grades:** `S (85+)` · `A (65–84)` · `B (40–64)` · `C (0–39)`

---

## 🚀 Getting Started

This is a single `.html` file — no setup needed.

```bash
git clone https://github.com/YOUR_USERNAME/devarchive.git
cd devarchive
open index.html
```

Or serve it locally for full routing support:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080`.

---

## 🔧 Proxy Setup (Optional but Recommended)

By default, GitHub allows 60 API requests/hour per IP. The Cloudflare Worker proxy raises this to **5,000/hour**.

1. Create a free [Cloudflare Workers](https://workers.cloudflare.com) account
2. Deploy a Worker that forwards requests to `api.github.com` using your GitHub token
3. Add `GITHUB_TOKEN` and `APP_SECRET` as Worker environment secrets
4. Update the proxy URL in `index.html`:

```js
const PROXY = 'https://your-worker.your-subdomain.workers.dev/proxy';
```

> Your token stays in Cloudflare's secret store — **it never touches the HTML file.**

---

## 🌐 Shareable URLs

Every view has its own URL — perfect for sharing:

| URL | View |
|---|---|
| `/` | Landing page |
| `/?user=torvalds` | Profile dashboard |
| `/?a=gaearon&b=sindresorhus` | Side-by-side comparison |
| `/?q=react` | Repository search |
| `/?owner=facebook&repo=react` | Repository detail |

---

## 🔐 Security

- ✅ All inputs sanitized via `escapeHTML()` before DOM insertion
- ✅ All external links validated — only `https://` URLs are rendered
- ✅ No API keys, tokens, or secrets anywhere in the HTML
- ✅ GitHub links use `rel="noopener noreferrer"`
- ✅ Recent searches stored locally — never sent to any server

---

## 🗺️ Roadmap

- [ ] GitHub OAuth for private repo access
- [ ] Exportable developer PDF report card
- [ ] Contribution activity heatmap
- [ ] Organization profile support
- [ ] Mobile layout improvements
- [ ] Team comparison (3+ developers)

---

## 💡 What I Learned

- Working with real-world REST APIs at scale (pagination, rate limits, caching)
- Building interactive data visualizations from scratch with D3.js
- Handling async data flows and partial failure gracefully
- Designing for both developer and recruiter audiences simultaneously
- Using AI tools as a thinking partner, not a code dispenser

---

## 🙏 Credits

[GitHub REST API](https://docs.github.com/en/rest) · [D3.js](https://d3js.org/) · [Tailwind CSS](https://tailwindcss.com/) · [Cloudflare Workers](https://workers.cloudflare.com/) · [Material Symbols](https://fonts.google.com/icons) · [Inter & Space Grotesk](https://fonts.google.com/)

---

<div align="center">

**GitHub shows what you've done.**
**DevArchive shows who you are as a developer.**

<br/>

If this project helped you or impressed you — a ⭐ star means the world.

<br/>

Made by [Manu Raj](https://github.com/YOUR_USERNAME)

</div>
