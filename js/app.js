/* js/app.js */
"use strict";

// ── GLOBAL APP OBJECT ──────────────────────────────────────
window.App = {
  search(username) {
    API.fetchProfile(username, true);
  },

  goHome() {
    const inp = document.getElementById('search-input-landing');
    if (inp) inp.value = '';
    UI.transition(() => {
      const s = window.history.state;
      if (!s || s.view !== 'landing')
        history.pushState({ view: 'landing' }, '', window.location.pathname);
      UI.switchView('landing');
    });
  },

  resetCompare() {
    const ce = document.getElementById('compare-empty');
    const cr = document.getElementById('compare-results');
    const ia = document.getElementById('compare-input-a');
    const ib = document.getElementById('compare-input-b');
    if (ce) ce.style.display = 'flex';
    if (cr) cr.style.display = 'none';
    if (ia) ia.value = '';
    if (ib) ib.value = '';
  },

  switchTab(tab) {
    if (tab === 'repo-search') RepoSearch.reset();
    if (tab === 'compare')     App.resetCompare();
    UI.transition(() => { UI.switchView(tab); });
    if (tab === 'compare') {
      const s = window.history.state;
      if (!s || s.view !== 'compare')
        history.pushState({ view: 'compare' }, '', '?view=compare');
    } else if (tab === 'repo-search') {
      const s = window.history.state;
      if (!s || s.view !== 'repo-search')
        history.pushState({ view: 'repo-search' }, '', '?view=repo-search');
    }
  },

  dismissError() {
    const b = document.getElementById('error-banner');
    if (b) b.style.display = 'none';
  },

  openCompare() {
    UI.transition(() => { UI.switchView('compare'); });
    history.pushState({ view: 'compare' }, '', '?view=compare');
    if (State.currentUser) {
      const ia = document.getElementById('compare-input-a');
      if (ia) ia.value = State.currentUser.login;
    }
  },

  async runCompare() {
    const ia = document.getElementById('compare-input-a');
    const ib = document.getElementById('compare-input-b');
    const nameA = ia ? ia.value.trim() : '';
    const nameB = ib ? ib.value.trim() : '';
    if (!nameA || !nameB) { UI.showError('Enter two GitHub usernames to compare.'); return; }
    if (nameA.toLowerCase() === nameB.toLowerCase()) { UI.showError('Enter two different usernames.'); return; }
    const btn         = document.getElementById('compare-go-btn');
    const originalHTML = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled  = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin" aria-hidden="true">progress_activity</span><span>Loading...</span>';
    }
    await API.executeCompare(nameA, nameB, true);
    if (btn) { btn.disabled = false; btn.innerHTML = originalHTML; }
  }
};

// Expose modules globally so inline onclick= attributes work
window.RepoSearch      = RepoSearch;
window.RepoDetail      = RepoDetail;
window.RecentSearches  = RecentSearches;

// ── EVENT BINDINGS ─────────────────────────────────────────
function bindEvent(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

// Landing search
bindEvent('search-btn-landing',  'click',   () => { const v = document.getElementById('search-input-landing').value.trim(); if (v) App.search(v); });
bindEvent('search-input-landing','keydown', e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) App.search(v); } });

// Nav search
bindEvent('search-btn-nav',  'click',   () => { const v = document.getElementById('search-input-nav').value.trim(); if (v) App.search(v); });
bindEvent('search-input-nav','keydown', e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) App.search(v); } });
bindEvent('search-input-nav','focus',   () => RecentSearches.showProfileDropdown());
bindEvent('search-input-nav','input',   () => {
  const v  = document.getElementById('search-input-nav').value.trim();
  const dd = document.getElementById('nav-recent-dropdown');
  if (!v) RecentSearches.showProfileDropdown();
  else if (dd) dd.classList.remove('show');
});

// Compare inputs
bindEvent('compare-input-a', 'keydown', e => { if (e.key === 'Enter') { const ib = document.getElementById('compare-input-b'); if (ib) ib.focus(); } });
bindEvent('compare-input-b', 'keydown', e => {
  if (e.key === 'Enter') {
    const a = document.getElementById('compare-input-a').value.trim();
    const b = e.target.value.trim();
    if (a && b) App.runCompare();
  }
});

// Repo search
bindEvent('repo-search-btn',   'click',   () => { const q = document.getElementById('repo-search-input').value.trim(); if (q) { RepoSearch.currentQuery = q; RepoSearch.executeSearch(1); } });
bindEvent('repo-search-input', 'keydown', e => { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) { RepoSearch.currentQuery = q; RepoSearch.executeSearch(1); } } });
bindEvent('repo-search-input', 'focus',   () => RecentSearches.showRepoDropdown());
bindEvent('repo-search-input', 'input',   () => {
  const v  = document.getElementById('repo-search-input').value.trim();
  const dd = document.getElementById('repo-recent-dropdown');
  if (!v) RecentSearches.showRepoDropdown();
  else if (dd) dd.classList.remove('show');
});

// Recent profile dropdown clicks
const navRecentList = document.getElementById('nav-recent-list');
if (navRecentList) {
  navRecentList.addEventListener('click', e => {
    const removeBtn = e.target.closest('.js-remove-profile');
    if (removeBtn) { e.stopPropagation(); RecentSearches.removeProfile(removeBtn.dataset.profile); return; }
    const item = e.target.closest('.js-recent-profile');
    if (item) { App.search(item.dataset.profile); RecentSearches.hideAll(); }
  });
}

// Recent repo dropdown clicks
const repoRecentList = document.getElementById('repo-recent-list');
if (repoRecentList) {
  repoRecentList.addEventListener('click', e => {
    const removeBtn = e.target.closest('.js-remove-repo');
    if (removeBtn) { e.stopPropagation(); RecentSearches.removeRepo(removeBtn.dataset.query); return; }
    const item = e.target.closest('.js-recent-repo');
    if (item) { RepoSearch.searchQuery(item.dataset.query); RecentSearches.hideAll(); }
  });
}

// Close dropdowns on outside click
document.addEventListener('click', e => {
  const navWrap  = document.getElementById('nav-search-wrap');
  const repoWrap = document.getElementById('repo-search-wrap');
  const navDd    = document.getElementById('nav-recent-dropdown');
  const repoDd   = document.getElementById('repo-recent-dropdown');
  if (navWrap  && !navWrap.contains(e.target)  && navDd)  navDd.classList.remove('show');
  if (repoWrap && !repoWrap.contains(e.target) && repoDd) repoDd.classList.remove('show');
});

// ── BOOT ───────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Router.init());
} else {
  Router.init();
}
