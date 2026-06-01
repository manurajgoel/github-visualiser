/* js/utils.js */
"use strict";

const Utils = {
  LANG_COLORS: {
    JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572A5', Rust: '#dea584',
    Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
    HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051', Vue: '#41b883', Svelte: '#ff3e00',
    Scala: '#c22d40', Haskell: '#5e5086', Elixir: '#6e4a7e', 'Jupyter Notebook': '#DA5B0B',
    R: '#198CE7', SCSS: '#c6538c', Makefile: '#427819', Dockerfile: '#384d54',
    YAML: '#cb171e', default: '#83aeff'
  },

  getLangColor(lang) {
    return this.LANG_COLORS[lang] || this.LANG_COLORS.default;
  },

  formatNum(n) {
    if (n === null || n === undefined) return '0';
    n = Number(n);
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
  },

  formatDate(str) {
    if (!str) return '';
    try {
      return new Date(str).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch { return ''; }
  },

  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  sanitizeUrl(url) {
    if (!url) return '#';
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      if (u.protocol === 'http:') u.protocol = 'https:';
      if (u.protocol !== 'https:') return '#';
      return u.href;
    } catch { return '#'; }
  },

  calcScore(user, totalStars, totalForks, ownRepoCount, accountAge) {
    const impact = totalStars + (totalForks * 1.5);
    const impactScore  = 40 * (1 - Math.exp(-impact / 1500));
    const reachScore   = 25 * (1 - Math.exp(-user.followers / 300));
    const prodScore    = 15 * (1 - Math.exp(-ownRepoCount / 30));
    const qualityScore = 10 * (1 - Math.exp(-(totalStars / Math.max(ownRepoCount, 1)) / 40));
    const ageScore     = Math.min(10, accountAge);
    return Math.round(impactScore + reachScore + prodScore + qualityScore + ageScore);
  },

  nextFrame(cb) {
    requestAnimationFrame(() => requestAnimationFrame(cb));
  }
};
