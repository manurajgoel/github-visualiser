/* js/state.js */
"use strict";

// ── APP STATE ──────────────────────────────────────────────
const State = {
  currentUser: null,
  currentRepos: [],
  repoDetailFrom: 'dashboard'
};

// ── RECENT SEARCHES ────────────────────────────────────────
const RecentSearches = {
  MAX: 3,
  KEY_PROFILES: 'da_recent_profiles',
  KEY_REPOS: 'da_recent_repos',

  _get(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  },

  _set(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch {}
  },

  addProfile(username) {
    let list = this._get(this.KEY_PROFILES).filter(u => u.toLowerCase() !== username.toLowerCase());
    list.unshift(username);
    this._set(this.KEY_PROFILES, list.slice(0, this.MAX));
    this.renderProfileDropdown();
  },

  getProfiles() { return this._get(this.KEY_PROFILES); },

  addRepo(query) {
    let list = this._get(this.KEY_REPOS).filter(q => q.toLowerCase() !== query.toLowerCase());
    list.unshift(query);
    this._set(this.KEY_REPOS, list.slice(0, this.MAX));
    this.renderRepoDropdown();
  },

  getRepos() { return this._get(this.KEY_REPOS); },

  renderProfileDropdown() {
    const list = this.getProfiles();
    const el = document.getElementById('nav-recent-list');
    const dd = document.getElementById('nav-recent-dropdown');
    if (!el || !dd) return;
    if (!list.length) { dd.classList.remove('show'); return; }
    el.innerHTML = list.map(u => `
      <div class="recent-item js-recent-profile" data-profile="${Utils.escapeHTML(u)}">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">person</span>
          <span class="text-sm text-on-surface font-label">${Utils.escapeHTML(u)}</span>
        </div>
        <button class="js-remove-profile text-on-surface-variant hover:text-error transition-colors"
          aria-label="Remove ${Utils.escapeHTML(u)}" data-profile="${Utils.escapeHTML(u)}">
          <span class="material-symbols-outlined text-xs" aria-hidden="true">close</span>
        </button>
      </div>`).join('');
  },

  renderRepoDropdown() {
    const list = this.getRepos();
    const el = document.getElementById('repo-recent-list');
    const dd = document.getElementById('repo-recent-dropdown');
    if (!el || !dd) return;
    if (!list.length) { dd.classList.remove('show'); return; }
    el.innerHTML = list.map(q => `
      <div class="recent-item js-recent-repo" data-query="${Utils.escapeHTML(q)}">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">manage_search</span>
          <span class="text-sm text-on-surface font-label">${Utils.escapeHTML(q)}</span>
        </div>
        <button class="js-remove-repo text-on-surface-variant hover:text-error transition-colors"
          aria-label="Remove ${Utils.escapeHTML(q)}" data-query="${Utils.escapeHTML(q)}">
          <span class="material-symbols-outlined text-xs" aria-hidden="true">close</span>
        </button>
      </div>`).join('');
  },

  removeProfile(u) {
    this._set(this.KEY_PROFILES, this._get(this.KEY_PROFILES).filter(x => x.toLowerCase() !== u.toLowerCase()));
    this.renderProfileDropdown();
  },

  removeRepo(q) {
    this._set(this.KEY_REPOS, this._get(this.KEY_REPOS).filter(x => x.toLowerCase() !== q.toLowerCase()));
    this.renderRepoDropdown();
  },

  showProfileDropdown() {
    if (!this.getProfiles().length) return;
    this.renderProfileDropdown();
    const dd = document.getElementById('nav-recent-dropdown');
    if (dd) dd.classList.add('show');
  },

  showRepoDropdown() {
    if (!this.getRepos().length) return;
    this.renderRepoDropdown();
    const dd = document.getElementById('repo-recent-dropdown');
    if (dd) dd.classList.add('show');
  },

  hideAll() {
    const nav  = document.getElementById('nav-recent-dropdown');
    const repo = document.getElementById('repo-recent-dropdown');
    if (nav)  nav.classList.remove('show');
    if (repo) repo.classList.remove('show');
  }
};
