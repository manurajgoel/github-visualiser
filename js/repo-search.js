/* js/repo-search.js */
"use strict";

const RepoSearch = {
  currentQuery: '',
  currentSort:  'stars',
  currentLang:  '',
  currentPage:  1,
  totalCount:   0,

  reset() {
    this.currentQuery = '';
    this.currentSort  = 'stars';
    this.currentLang  = '';
    this.currentPage  = 1;
    this.totalCount   = 0;
    const inp = document.getElementById('repo-search-input');
    if (inp) inp.value = '';
    const empty   = document.getElementById('repo-search-empty');
    const results = document.getElementById('repo-search-results');
    const loading = document.getElementById('repo-search-loading');
    if (empty)   empty.style.display   = 'flex';
    if (results) results.style.display = 'none';
    if (loading) loading.style.display = 'none';
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    const sortStars = document.querySelector('[data-sort="stars"]');
    const langAll   = document.querySelector('[data-lang=""]');
    if (sortStars) sortStars.classList.add('active');
    if (langAll)   langAll.classList.add('active');
  },

  setSort(sort, btn) {
    this.currentSort = sort;
    document.querySelectorAll('[data-sort]').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (this.currentQuery) this.executeSearch(1);
  },

  setLang(lang, btn) {
    this.currentLang = lang;
    document.querySelectorAll('[data-lang]').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (this.currentQuery) this.executeSearch(1);
  },

  searchQuery(q, pushState = true) {
    const inp = document.getElementById('repo-search-input');
    if (inp) inp.value = q;
    this.currentQuery = q;
    this.executeSearch(1, pushState);
  },

  async executeSearch(page = 1, pushState = true) {
    const query = this.currentQuery;
    if (!query) return;
    this.currentPage = page;
    const empty   = document.getElementById('repo-search-empty');
    const results = document.getElementById('repo-search-results');
    const loading = document.getElementById('repo-search-loading');
    if (empty)   empty.style.display   = 'none';
    if (results) results.style.display = 'none';
    if (loading) loading.style.display = 'block';
    try {
      const data       = await API.searchRepos(query, this.currentSort, this.currentLang, page);
      this.totalCount  = Math.min(data.total_count, 1000);
      this.renderResults(data.items, query);
      RecentSearches.addRepo(query);
      if (pushState) {
        const url = new URL(window.location);
        url.search = '';
        url.searchParams.set('q', query);
        history.pushState({ view: 'repo-search', q: query }, '', url);
      }
    } catch (err) {
      if (loading) loading.style.display = 'none';
      if (empty)   empty.style.display   = 'flex';
      UI.showError(err.message);
    }
  },

  renderResults(repos, query) {
    const loading = document.getElementById('repo-search-loading');
    const results = document.getElementById('repo-search-results');
    if (loading) loading.style.display = 'none';
    if (results) results.style.display = 'block';

    const totalPages = Math.min(Math.ceil(this.totalCount / 10), 100);
    const countEl = document.getElementById('repo-results-count');
    if (countEl) countEl.textContent = this.totalCount.toLocaleString() + ' repositories found for "' + query + '"';

    const grid = document.getElementById('repo-results-grid');
    if (grid) {
      grid.innerHTML = repos.map(repo => {
        const langDot = repo.language
          ? '<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:' + Utils.getLangColor(repo.language) + '"></span>' +
            '<span class="font-label text-xs text-on-surface-variant">' + Utils.escapeHTML(repo.language) + '</span>'
          : '';
        const topics     = (repo.topics || []).slice(0, 3);
        const topicsHtml = topics.length
          ? '<div class="flex flex-wrap gap-1 mt-3">' + topics.map(t => '<span class="topic-chip">' + Utils.escapeHTML(t) + '</span>').join('') + '</div>'
          : '';
        const updated    = repo.updated_at
          ? new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '';
        const ownerLogin  = Utils.escapeHTML(repo.owner ? repo.owner.login : '');
        const ownerAvatar = Utils.escapeHTML(repo.owner ? repo.owner.avatar_url : '');
        const repoName    = Utils.escapeHTML(repo.name);

        return '<div class="repo-card cursor-pointer"' +
          ' onclick="RepoDetail.open(\'' + ownerLogin + '\',\'' + repoName + '\',true)"' +
          ' role="button" tabindex="0"' +
          ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')RepoDetail.open(\'' + ownerLogin + '\',\'' + repoName + '\',true)">' +
          '<div class="flex items-start justify-between mb-3 gap-4">' +
          '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-2 mb-1">' +
          '<img src="' + ownerAvatar + '" alt="' + ownerLogin + '" class="w-5 h-5 rounded-full flex-shrink-0" loading="lazy"/>' +
          '<span class="text-xs font-label text-on-surface-variant truncate">' + ownerLogin + '</span>' +
          '</div>' +
          '<h3 class="text-base font-bold font-headline text-on-surface hover:text-primary transition-colors truncate">' + repoName + '</h3>' +
          '</div>' +
          '<div class="flex items-center gap-1 flex-shrink-0 bg-primary/8 border border-primary/15 rounded-full px-3 py-1">' +
          '<span class="material-symbols-outlined text-primary" style="font-size:14px" aria-hidden="true">star</span>' +
          '<span class="text-sm font-bold text-primary font-label">' + Utils.formatNum(repo.stargazers_count) + '</span>' +
          '</div></div>' +
          '<p class="text-sm text-on-surface-variant leading-relaxed line-clamp-2 mb-3">' + (Utils.escapeHTML(repo.description) || 'No description.') + '</p>' +
          topicsHtml +
          '<div class="flex items-center gap-4 mt-4 text-xs font-label text-on-surface-variant">' +
          '<div class="flex items-center gap-1.5">' + langDot + '</div>' +
          '<div class="flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:13px" aria-hidden="true">fork_right</span>' + Utils.formatNum(repo.forks_count) + '</div>' +
          '<div class="flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:13px" aria-hidden="true">remove_red_eye</span>' + Utils.formatNum(repo.watchers_count || 0) + '</div>' +
          (updated ? '<div class="ml-auto flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:12px" aria-hidden="true">schedule</span>' + updated + '</div>' : '') +
          '</div></div>';
      }).join('');
    }

    const pagHtml = this.buildPagination(this.currentPage, totalPages);
    const pag    = document.getElementById('repo-pagination');
    const pagBot = document.getElementById('repo-pagination-bottom');
    if (pag)    pag.innerHTML    = pagHtml;
    if (pagBot) pagBot.innerHTML = pagHtml;
  },

  buildPagination(current, total) {
    if (total <= 1) return '';
    const pages = [];
    if (current > 1)
      pages.push('<button onclick="RepoSearch.goToPage(' + (current - 1) + ')" class="filter-pill">← Prev</button>');
    const start = Math.max(1, current - 2);
    const end   = Math.min(total, current + 2);
    if (start > 1)  pages.push('<button onclick="RepoSearch.goToPage(1)" class="filter-pill">1</button>');
    if (start > 2)  pages.push('<span class="text-on-surface-variant text-sm px-2">…</span>');
    for (let i = start; i <= end; i++) {
      pages.push('<button onclick="RepoSearch.goToPage(' + i + ')" class="filter-pill' + (i === current ? ' active' : '') + '">' + i + '</button>');
    }
    if (end < total - 1) pages.push('<span class="text-on-surface-variant text-sm px-2">…</span>');
    if (end < total)     pages.push('<button onclick="RepoSearch.goToPage(' + total + ')" class="filter-pill">' + total + '</button>');
    if (current < total)
      pages.push('<button onclick="RepoSearch.goToPage(' + (current + 1) + ')" class="filter-pill">Next →</button>');
    return pages.join('');
  },

  goToPage(page) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.executeSearch(page, false);
  }
};
