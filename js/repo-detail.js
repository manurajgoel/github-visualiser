/* js/repo-detail.js */
"use strict";

const RepoDetail = {
  currentOwner: null,
  currentRepo:  null,
  fromView: 'dashboard',

  async open(owner, repo, pushState = true) {
    this.fromView    = this._guessFromView();
    this.currentOwner = owner;
    this.currentRepo  = repo;
    UI.switchView('repo-detail');

    // Reset tabs
    document.querySelectorAll('[data-detail-tab]').forEach(t => t.classList.remove('active'));
    const overviewTab = document.querySelector('[data-detail-tab="overview"]');
    if (overviewTab) overviewTab.classList.add('active');
    document.querySelectorAll('.detail-panel').forEach(p => p.classList.remove('active'));
    const overviewPanel = document.getElementById('detail-panel-overview');
    if (overviewPanel) overviewPanel.classList.add('active');

    const backLabel = document.getElementById('repo-detail-back-label');
    if (backLabel) backLabel.textContent = this.fromView === 'dashboard' ? 'Back to dashboard' : 'Back to results';

    const setTxt  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const setHTML = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML   = v; };

    setTxt('rd-name',  repo);
    setTxt('rd-owner', owner);
    setTxt('rd-desc',  'Loading...');
    setHTML('rd-topics', '');
    setHTML('rd-stats-row',
      '<div class="skeleton h-20 rounded-xl"></div>' +
      '<div class="skeleton h-20 rounded-xl"></div>' +
      '<div class="skeleton h-20 rounded-xl"></div>' +
      '<div class="skeleton h-20 rounded-xl"></div>');
    setHTML('rd-overview-content',
      '<div class="skeleton h-4 w-full rounded mb-2"></div>' +
      '<div class="skeleton h-4 w-4/5 rounded"></div>');
    setHTML('rd-details-content',
      '<div class="skeleton h-4 w-full rounded mb-2"></div>' +
      '<div class="skeleton h-4 w-3/5 rounded"></div>');
    setTxt('rd-issue-count-badge', '');
    setHTML('rd-issues-list', '');
    const issLoad = document.getElementById('rd-issues-loading');
    if (issLoad) issLoad.style.display = 'block';
    setHTML('rd-releases-list', '');
    const relLoad = document.getElementById('rd-releases-loading');
    if (relLoad) relLoad.style.display = 'block';
    setHTML('rd-contrib-list', '');
    const conLoad = document.getElementById('rd-contrib-loading');
    if (conLoad) conLoad.style.display = 'block';

    if (pushState) {
      const url = new URL(window.location);
      url.search = '';
      url.searchParams.set('owner', owner);
      url.searchParams.set('repo',  repo);
      history.pushState({ view: 'repo-detail', owner, repo }, '', url);
    }

    try {
      const repoData = await API.fetchWithFallback(
        'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo)
      );
      this._renderHeader(repoData);
      this._renderOverview(repoData);
      const [issues, releases, contributors] = await Promise.allSettled([
        API.fetchWithFallback('https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/issues?state=open&per_page=20'),
        API.fetchWithFallback('https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/releases?per_page=10'),
        API.fetchWithFallback('https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contributors?per_page=15')
      ]);
      this._renderIssues(issues.status === 'fulfilled' ? issues.value : [], repoData.open_issues_count);
      this._renderReleases(releases.status === 'fulfilled' ? releases.value : []);
      this._renderContributors(contributors.status === 'fulfilled' ? contributors.value : []);
    } catch (err) { UI.showError(err.message); }
  },

  _guessFromView() {
    const s = window.history.state;
    if (!s) return 'dashboard';
    return s.view === 'repo-search' ? 'repo-search' : 'dashboard';
  },

  goBack() {
    if (window.history.length > 1) history.back();
    else UI.switchView(this.fromView === 'repo-search' ? 'repo-search' : 'dashboard');
  },

  switchTab(tab) {
    document.querySelectorAll('[data-detail-tab]').forEach(t => t.classList.remove('active'));
    const tabEl = document.querySelector('[data-detail-tab="' + tab + '"]');
    if (tabEl) tabEl.classList.add('active');
    document.querySelectorAll('.detail-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('detail-panel-' + tab);
    if (panel) panel.classList.add('active');
  },

  _renderHeader(repo) {
    const setTxt  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const setHTML = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML   = v; };
    setTxt('rd-name',  repo.name);
    setTxt('rd-owner', repo.owner ? repo.owner.login : '');
    setTxt('rd-desc',  repo.description || 'No description provided.');
    const ghLink = document.getElementById('rd-gh-link');
    if (ghLink) ghLink.href = repo.html_url;
    const topics = (repo.topics || []).slice(0, 8);
    setHTML('rd-topics', topics.map(t => '<span class="topic-chip">' + Utils.escapeHTML(t) + '</span>').join(''));
    const stats = [
      { icon: 'star',            label: 'Stars',       val: Utils.formatNum(repo.stargazers_count), color: 'text-primary' },
      { icon: 'fork_right',      label: 'Forks',       val: Utils.formatNum(repo.forks_count),      color: 'text-tertiary' },
      { icon: 'remove_red_eye',  label: 'Watchers',    val: Utils.formatNum(repo.watchers_count),   color: 'text-secondary' },
      { icon: 'bug_report',      label: 'Open Issues', val: Utils.formatNum(repo.open_issues_count),color: 'text-error' }
    ];
    setHTML('rd-stats-row', stats.map(s =>
      '<div class="detail-stat">' +
      '<span class="material-symbols-outlined ' + s.color + ' text-2xl mb-1 block" aria-hidden="true">' + s.icon + '</span>' +
      '<div class="text-2xl font-black font-headline ' + s.color + '">' + s.val + '</div>' +
      '<div class="text-xs font-label text-on-surface-variant mt-1">' + s.label + '</div>' +
      '</div>'
    ).join(''));
  },

  _renderOverview(repo) {
    const lang     = repo.language;
    const overview = [
      lang
        ? '<div class="flex items-center gap-3 p-3 bg-surface-container-highest/30 rounded-lg">' +
          '<span class="w-3 h-3 rounded-full flex-shrink-0" style="background:' + Utils.getLangColor(lang) + '"></span>' +
          '<span class="font-label text-sm text-on-surface font-semibold">' + Utils.escapeHTML(lang) + '</span>' +
          '<span class="text-xs text-on-surface-variant ml-2">Primary language</span></div>'
        : '',
      repo.license
        ? '<div class="flex items-center gap-3 p-3 bg-surface-container-highest/30 rounded-lg">' +
          '<span class="material-symbols-outlined text-on-surface-variant text-sm" aria-hidden="true">gavel</span>' +
          '<span class="font-label text-sm text-on-surface">' + Utils.escapeHTML(repo.license.spdx_id || repo.license.name) + '</span>' +
          '<span class="text-xs text-on-surface-variant ml-2">License</span></div>'
        : '',
      '<div class="flex items-center gap-3 p-3 bg-surface-container-highest/30 rounded-lg">' +
        '<span class="material-symbols-outlined text-on-surface-variant text-sm" aria-hidden="true">calendar_today</span>' +
        '<span class="font-label text-sm text-on-surface">' + Utils.formatDate(repo.created_at) + '</span>' +
        '<span class="text-xs text-on-surface-variant ml-2">Created</span></div>',
      '<div class="flex items-center gap-3 p-3 bg-surface-container-highest/30 rounded-lg">' +
        '<span class="material-symbols-outlined text-on-surface-variant text-sm" aria-hidden="true">update</span>' +
        '<span class="font-label text-sm text-on-surface">' + Utils.formatDate(repo.updated_at) + '</span>' +
        '<span class="text-xs text-on-surface-variant ml-2">Last updated</span></div>',
      repo.fork
        ? '<div class="flex items-center gap-3 p-3 bg-tertiary/5 border border-tertiary/10 rounded-lg">' +
          '<span class="material-symbols-outlined text-tertiary text-sm" aria-hidden="true">fork_right</span>' +
          '<span class="font-label text-sm text-on-surface">Forked repository</span></div>'
        : '',
      repo.archived
        ? '<div class="flex items-center gap-3 p-3 bg-error/5 border border-error/10 rounded-lg">' +
          '<span class="material-symbols-outlined text-error text-sm" aria-hidden="true">archive</span>' +
          '<span class="font-label text-sm text-on-surface">Archived</span></div>'
        : ''
    ].filter(Boolean);

    const oc = document.getElementById('rd-overview-content');
    if (oc) oc.innerHTML = overview.join('');

    const details = [
      repo.homepage
        ? '<div class="flex items-center gap-2 text-on-surface-variant">' +
          '<span class="material-symbols-outlined text-sm" aria-hidden="true">link</span>' +
          '<a href="' + Utils.sanitizeUrl(repo.homepage) + '" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline truncate text-sm">' +
          Utils.escapeHTML(repo.homepage.replace(/^https?:\/\//, '')) + '</a></div>'
        : '',
      '<div class="flex items-center gap-2 text-on-surface-variant">' +
        '<span class="material-symbols-outlined text-sm" aria-hidden="true">code</span>' +
        '<span class="text-on-surface text-sm">' + Utils.escapeHTML(repo.visibility || 'public') + '</span></div>',
      repo.default_branch
        ? '<div class="flex items-center gap-2 text-on-surface-variant">' +
          '<span class="material-symbols-outlined text-sm" aria-hidden="true">device_hub</span>' +
          '<span class="text-on-surface text-sm">' + Utils.escapeHTML(repo.default_branch) + '</span></div>'
        : '',
      repo.size
        ? '<div class="flex items-center gap-2 text-on-surface-variant">' +
          '<span class="material-symbols-outlined text-sm" aria-hidden="true">storage</span>' +
          '<span class="text-on-surface text-sm">' + (repo.size / 1024).toFixed(1) + ' MB</span></div>'
        : ''
    ].filter(Boolean);

    const dc = document.getElementById('rd-details-content');
    if (dc) dc.innerHTML = details.join('');
  },

  _renderIssues(issues, totalOpen) {
    const issLoad = document.getElementById('rd-issues-loading');
    if (issLoad) issLoad.style.display = 'none';
    const badge = document.getElementById('rd-issue-count-badge');
    if (badge) badge.textContent = Utils.formatNum(totalOpen || 0);
    const meta = document.getElementById('rd-issues-meta');
    if (meta) meta.textContent = 'Showing ' + Math.min(issues.length, 20) + ' of ' + Utils.formatNum(totalOpen || 0) + ' open issues';
    const list = document.getElementById('rd-issues-list');
    if (!list) return;
    if (!issues.length) {
      list.innerHTML = '<div class="py-12 text-center text-on-surface-variant text-sm font-label">' +
        '<span class="material-symbols-outlined text-2xl block mb-2" aria-hidden="true">check_circle</span>No open issues 🎉</div>';
      return;
    }
    list.innerHTML = issues.map(issue =>
      '<div class="issue-item">' +
      '<span class="material-symbols-outlined text-secondary text-base flex-shrink-0 mt-0.5" aria-hidden="true">radio_button_unchecked</span>' +
      '<div class="flex-1 min-w-0">' +
      '<a href="' + Utils.escapeHTML(issue.html_url) + '" target="_blank" rel="noopener noreferrer"' +
      ' class="text-sm font-semibold text-on-surface hover:text-primary transition-colors line-clamp-1 font-headline">' +
      Utils.escapeHTML(issue.title) + '</a>' +
      '<div class="flex items-center gap-3 mt-1 flex-wrap">' +
      '<span class="text-xs font-label text-on-surface-variant">#' + issue.number + '</span>' +
      '<span class="text-xs font-label text-on-surface-variant">by ' + Utils.escapeHTML((issue.user && issue.user.login) || 'unknown') + '</span>' +
      '<span class="text-xs font-label text-on-surface-variant">' + Utils.formatDate(issue.created_at) + '</span>' +
      (issue.labels || []).slice(0, 3).map(l =>
        '<span class="text-[10px] font-label px-1.5 py-0.5 rounded-full" style="background:#' + l.color + '22;color:#' + l.color + ';border:1px solid #' + l.color + '44">' +
        Utils.escapeHTML(l.name) + '</span>'
      ).join('') +
      '</div></div>' +
      (issue.comments > 0
        ? '<div class="flex items-center gap-1 text-xs font-label text-on-surface-variant flex-shrink-0">' +
          '<span class="material-symbols-outlined text-xs" aria-hidden="true">chat_bubble_outline</span>' + issue.comments + '</div>'
        : '') +
      '</div>'
    ).join('');
  },

  _renderReleases(releases) {
    const relLoad = document.getElementById('rd-releases-loading');
    if (relLoad) relLoad.style.display = 'none';
    const list = document.getElementById('rd-releases-list');
    if (!list) return;
    if (!releases.length) {
      list.innerHTML = '<div class="bg-surface-container-low rounded-xl p-12 text-center text-on-surface-variant text-sm font-label">' +
        '<span class="material-symbols-outlined text-2xl block mb-2" aria-hidden="true">new_releases</span>No releases yet</div>';
      return;
    }
    list.innerHTML = releases.map((r, i) =>
      '<div class="release-card">' +
      '<div class="flex items-start justify-between gap-4 mb-2">' +
      '<div class="flex items-center gap-3 flex-wrap">' +
      (i === 0 ? '<span class="text-[10px] font-label bg-secondary/15 text-secondary border border-secondary/25 px-2 py-0.5 rounded-full">Latest</span>' : '') +
      (r.prerelease ? '<span class="text-[10px] font-label bg-tertiary/15 text-tertiary border border-tertiary/25 px-2 py-0.5 rounded-full">Pre-release</span>' : '') +
      '<a href="' + Utils.escapeHTML(r.html_url) + '" target="_blank" rel="noopener noreferrer"' +
      ' class="text-base font-bold font-headline text-on-surface hover:text-primary transition-colors">' +
      Utils.escapeHTML(r.tag_name) + ' — ' + Utils.escapeHTML(r.name || r.tag_name) + '</a>' +
      '</div>' +
      '<span class="text-xs font-label text-on-surface-variant flex-shrink-0">' + Utils.formatDate(r.published_at) + '</span>' +
      '</div>' +
      (r.body ? '<p class="text-sm text-on-surface-variant line-clamp-3 font-body">' + Utils.escapeHTML(r.body.slice(0, 280)) + (r.body.length > 280 ? '…' : '') + '</p>' : '') +
      '<div class="flex items-center gap-4 mt-3 text-xs font-label text-on-surface-variant">' +
      (r.assets && r.assets.length
        ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs" aria-hidden="true">download</span>' + r.assets.length + ' asset' + (r.assets.length !== 1 ? 's' : '') + '</span>'
        : '') +
      '<span>by ' + Utils.escapeHTML((r.author && r.author.login) || 'unknown') + '</span>' +
      '</div></div>'
    ).join('');
  },

  _renderContributors(contributors) {
    const conLoad = document.getElementById('rd-contrib-loading');
    if (conLoad) conLoad.style.display = 'none';
    const list = document.getElementById('rd-contrib-list');
    if (!list) return;
    if (!contributors.length) {
      list.innerHTML = '<p class="text-on-surface-variant text-sm font-label text-center py-8">No contributor data available.</p>';
      return;
    }
    const maxContribs = (contributors[0] && contributors[0].contributions) || 1;
    list.innerHTML = contributors.map((c, i) =>
      '<div class="flex items-center gap-4">' +
      '<span class="text-xs font-label text-on-surface-variant w-5 text-right flex-shrink-0">' + (i + 1) + '</span>' +
      '<img src="' + Utils.escapeHTML(c.avatar_url) + '" alt="' + Utils.escapeHTML(c.login) + '"' +
      ' class="w-8 h-8 rounded-full flex-shrink-0 border border-outline-variant/20" loading="lazy"/>' +
      '<a href="' + Utils.escapeHTML(c.html_url) + '" target="_blank" rel="noopener noreferrer"' +
      ' class="text-sm font-label font-semibold text-on-surface hover:text-primary transition-colors w-28 truncate flex-shrink-0">' +
      Utils.escapeHTML(c.login) + '</a>' +
      '<div class="flex-1"><div class="w-full bg-surface-container-highest rounded h-2 overflow-hidden">' +
      '<div class="contrib-bar" style="width:' + ((c.contributions / maxContribs) * 100).toFixed(1) + '%"></div>' +
      '</div></div>' +
      '<span class="text-xs font-label text-on-surface-variant flex-shrink-0 w-20 text-right">' +
      Utils.formatNum(c.contributions) + ' commits</span>' +
      '</div>'
    ).join('');
  }
};
