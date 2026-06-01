/* js/api.js */
"use strict";

const API = {
  _cache: new Map(),
  _controller: null,
  CACHE_TTL: 5 * 60 * 1000,

  async fetchWithFallback(url, signal) {
    if (this._cache.has(url)) {
      const cached = this._cache.get(url);
      if (Date.now() - cached.time < this.CACHE_TTL) return cached.data;
      this._cache.delete(url);
    }
    try {
      const PROXY = 'https://devarchive-proxy.manurajg1806.workers.dev';
      const proxiedUrl = url.replace('https://api.github.com', PROXY);
      const opts = signal ? { signal } : {};
      const res = await fetch(proxiedUrl, opts);

      if (!res.ok) {
        if (res.status === 404) throw new Error('GitHub user or resource not found.');
        if (res.status === 403) {
          const reset = res.headers.get('X-RateLimit-Reset');
          const remaining = res.headers.get('X-RateLimit-Remaining');
          // If remaining is 0, it's a rate limit. If not, it's a permission error.
          if (remaining === '0' || remaining === null) {
            const waitSec = reset
              ? Math.max(0, Math.ceil((Number(reset) * 1000 - Date.now()) / 1000))
              : 60;
            throw new Error('GitHub API rate limit reached. Try again in ~' + waitSec + 's.');
          }
          throw new Error('Access forbidden. The resource may be private.');
        }
        if (res.status === 422) throw new Error('Invalid search query. Please try different keywords.');
        if (res.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        if (res.status >= 500) throw new Error('GitHub API is currently unavailable. Try again shortly.');
        throw new Error('API Error: ' + res.status);
      }

      const data = await res.json();
      this._cache.set(url, { data, time: Date.now() });
      return data;
    } catch (err) {
      // AbortError = user navigated away / new search started — silent
      if (err.name === 'AbortError') throw new Error('Request cancelled.');

      // TypeError from fetch() = actual network failure OR CORS failure
      // Check the message to distinguish them
      if (err.name === 'TypeError') {
        const msg = err.message.toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
          throw new Error('Network error — the proxy may be down or you are offline. Check your connection and try again.');
        }
        // Any other TypeError (e.g. programming bug) — surface the real message
        throw new Error('Unexpected error: ' + err.message);
      }

      // Re-throw our own custom errors (404, 403, 422, etc.) unchanged
      throw err;
    }
  },

  _abortPrevious() {
    if (this._controller) this._controller.abort();
    this._controller = new AbortController();
    return this._controller.signal;
  },

  async fetchAllUserRepos(username, signal) {
    let page = 1, allRepos = [];
    while (true) {
      const repos = await this.fetchWithFallback(
        'https://api.github.com/users/' + encodeURIComponent(username) +
        '/repos?per_page=100&page=' + page + '&sort=pushed', signal
      );
      allRepos.push(...repos);
      if (repos.length < 100 || page >= 10) break;
      page++;
    }
    return allRepos;
  },

  async fetchProfile(username, pushState = true) {
    const banner = document.getElementById('error-banner');
    if (banner) banner.style.display = 'none';
    const signal = this._abortPrevious();
    UI.transition(() => { UI.setDashboardSkeletons(); UI.switchView('dashboard'); });
    try {
      const [user, repos] = await Promise.all([
        this.fetchWithFallback('https://api.github.com/users/' + encodeURIComponent(username), signal),
        this.fetchWithFallback('https://api.github.com/users/' + encodeURIComponent(username) + '/repos?per_page=100&sort=pushed', signal)
      ]);
      State.currentUser  = user;
      State.currentRepos = repos;
      const ownRepos      = repos.filter(r => !r.fork);
      const sortedByStars = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);
      const totalStars    = repos.reduce((s, r) => s + r.stargazers_count, 0);
      const totalForks    = repos.reduce((s, r) => s + r.forks_count, 0);
      const langMap = {};
      ownRepos.forEach(r => {
        if (r.language) {
          const w = r.stargazers_count > 0 ? 2 : 1;
          langMap[r.language] = (langMap[r.language] || 0) + w;
        }
      });
      const totalLangWeight = Object.values(langMap).reduce((a, b) => a + b, 0) || 1;
      const topLangs = Object.entries(langMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([lang, w]) => ({ lang, pct: ((w / totalLangWeight) * 100).toFixed(1) }));
      const accountAge = user.created_at
        ? (Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365) : 0;
      UI.transition(() => {
        UI.renderProfile(user);
        UI.renderStats(user, totalStars, totalForks, ownRepos.length);
        UI.renderLanguages(topLangs, ownRepos.length, repos.length);
        UI.renderScore(user, totalStars, totalForks, ownRepos.length, accountAge);
        UI.renderRepoCards(sortedByStars.slice(0, 6), repos.length);
        DepGraph.render(ownRepos);
      });
      RecentSearches.addProfile(username);
      if (pushState) {
        const url = new URL(window.location);
        url.search = '';
        url.searchParams.set('user', username);
        history.pushState({ view: 'dashboard', user: username }, '', url);
      }
      if (repos.length === 100 && user.public_repos > 100) {
        this._fetchRemainingRepos(username, signal).catch(() => {});
      }
    } catch (err) {
      if (err.message === 'Request cancelled.') return;
      UI.showError(err.message);
    }
  },

  async _fetchRemainingRepos(username, signal) {
    let page = 2;
    while (true) {
      try {
        const repos = await this.fetchWithFallback(
          'https://api.github.com/users/' + encodeURIComponent(username) +
          '/repos?per_page=100&page=' + page + '&sort=pushed', signal
        );
        State.currentRepos = State.currentRepos.concat(repos);
        if (repos.length < 100 || page >= 10) break;
        page++;
      } catch { break; }
    }
  },

  async fetchCompareData(username) {
    const user  = await this.fetchWithFallback('https://api.github.com/users/' + encodeURIComponent(username));
    const repos = await this.fetchAllUserRepos(username);
    const ownRepos    = repos.filter(r => !r.fork);
    const totalStars  = repos.reduce((s, r) => s + r.stargazers_count, 0);
    const totalForks  = repos.reduce((s, r) => s + r.forks_count, 0);
    const accountAge  = user.created_at
      ? (Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365) : 0;
    const score = Utils.calcScore(user, totalStars, totalForks, ownRepos.length, accountAge);
    const langMap = {};
    ownRepos.forEach(r => { if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1; });
    const topLangs = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, n]) => ({ lang, n }));
    return { user, repos, ownRepos, totalStars, totalForks, accountAge, score, topLangs };
  },

  async executeCompare(nameA, nameB, pushState = true) {
    const banner = document.getElementById('error-banner');
    if (banner) banner.style.display = 'none';
    UI.transition(() => {
      UI.setCompareSkeletons();
      UI.switchView('compare');
      const cr = document.getElementById('compare-results');
      const ce = document.getElementById('compare-empty');
      if (cr) cr.style.display = 'block';
      if (ce) ce.style.display = 'none';
    });
    try {
      const [dataA, dataB] = await Promise.all([
        this.fetchCompareData(nameA),
        this.fetchCompareData(nameB)
      ]);
      UI.transition(() => { UI.renderCompare(dataA, dataB); });
      if (pushState) {
        const url = new URL(window.location);
        url.search = '';
        url.searchParams.set('a', nameA);
        url.searchParams.set('b', nameB);
        history.pushState({ view: 'compare', a: nameA, b: nameB }, '', url);
      }
    } catch (err) {
      UI.transition(() => {
        const ce = document.getElementById('compare-empty');
        const cr = document.getElementById('compare-results');
        if (ce) ce.style.display = 'flex';
        if (cr) cr.style.display = 'none';
      });
      UI.showError(err.message);
    }
  },

  async searchRepos(query, sort = 'stars', language = '', page = 1) {
    let q = encodeURIComponent(query);
    if (language) q += '+language:' + encodeURIComponent(language);
    return await this.fetchWithFallback(
      'https://api.github.com/search/repositories?q=' + q +
      '&sort=' + sort + '&order=desc&per_page=10&page=' + page
    );
  }
};