
# 🚀 DevArchive
**A GitHub profile visualizer that transforms raw data into developer intelligence**

## 🧠 The Problem
GitHub shows you the data. But it doesn't tell you the *story*.

When you land on a developer's profile, you're still left asking:
- What are they *actually* skilled at?
- How impactful are their contributions?
- What's their dominant tech stack?
- How do they stack up against others?

You're connecting dots manually. That's inefficient.


## 💡 The Solution

**DevArchive gives you the answer in seconds.**
It transforms any GitHub profile into a clean, visual, insight-driven experience — revealing the developer behind the repositories.
Think of it as a **portfolio intelligence layer** on top of GitHub.

## ✨ Core Features

### 👤 Profile Dashboard
- Instant lookup with full metadata
- Animated language distribution 
- Top 6 repositories ranked by impact
- Account age, location, company, blog link

### 🧠 Developer Score (0–100)
A custom algorithm grading across 5 weighted dimensions:
- **Impact** | **Reach** | **Productivity** | **Quality** | **Maturity**
- Visual score ring with S / A / B / C grades

### 🌐 Ecosystem Map
Interactive D3.js force-directed graph showing:
- Repositories clustered by language
- Click-to-explore interaction

### ⚔️ Developer Comparison
Head-to-head stats across multiple metrics:
- Animated progress bars with winner detection
- Language breakdown per developer
- Overall winner banner (with tie support)

### 🔍 Repository Explorer
Search GitHub with:
- Language filtering
- Sort by stars, forks, or last updated
- Paginated deep exploration


## 🤖 Built with Intention
This wasn't a traditional build.
**Claude** orchestrated the core logic and architecture.  
**Google Stitch** shaped the frontend into something clean and intuitive.

The result: a product that feels intentional from every angle — both code and design.


## 🛠️ Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Google Stitch |
| Logic & Backend | Claude |
| IDE | Cursor |
| Polish & Debugging | ChatGPT |
| Visualization | D3.js |


## 📚 Key Learnings

✅ Working with real-world APIs (pagination, rate limits, async flows)  
✅ Building interactive data visualizations with D3.js  
✅ Full-stack architecture without framework dependencies  
✅ Designing products that are both useful *and* beautiful  
✅ Using AI as a thinking partner, not just a code generator  
✅ Iterating faster: Build → Test → Break → Improve  


## 💭 The Bigger Picture
GitHub shows *what* you've built.  
DevArchive shows *what that actually means.*


Instead of asking AI to "write the app", I used it to:

- Break down complex features before touching code (score algorithm, D3 graph structure)
- Debug async flows and GitHub API rate limit handling
- Evaluate UI/UX tradeoffs before building
- Iterate 10× faster: build → test → break → refine → rebuild

The thinking was mine. The speed was AI's.



## 🗺️ Roadmap

- [ ] AI summary and recommendations
- [ ] Exportable developer PDF report card
- [ ] Contribution activity heatmap
- [ ] Organization profile support
- [ ] Roast Me feature

