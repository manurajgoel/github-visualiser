/* js/ui.js */
"use strict";

const UI = {
  _errorTimer: null,

  transition(cb) {
    if (!document.startViewTransition) { cb(); return; }
    try { document.startViewTransition(cb); } catch { cb(); }
  },

  showError(msg) {
    const banner = document.getElementById('error-banner');
    const msgEl  = document.getElementById('error-message');
    if (!banner || !msgEl) return;
    msgEl.textContent = msg;
    banner.style.display = 'block';
    clearTimeout(UI._errorTimer);
    UI._errorTimer = setTimeout(() => { banner.style.display = 'none'; }, 7000);
  },

  switchView(view) {
    const ALL_VIEWS = ['landing', 'dashboard', 'compare', 'repo-search', 'repo-detail'];
    ALL_VIEWS.forEach(v => {
      const el = document.getElementById(v === 'landing' ? 'landing-screen' : v + '-screen');
      if (el) el.style.display = 'none';
    });
    const target = document.getElementById(view === 'landing' ? 'landing-screen' : view + '-screen');
    if (target) target.style.display = view === 'landing' ? 'flex' : 'block';
    const nav = document.getElementById('main-nav');
    if (nav) nav.style.display = view !== 'landing' ? 'block' : 'none';
    if (view !== 'landing') {
      ['dashboard', 'compare', 'repo-search'].forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.classList.toggle('active', view === t);
      });
    }
    window.scrollTo(0, 0);
    RecentSearches.hideAll();
  },

  // ── SKELETON LOADERS ────────────────────────────────────

  setDashboardSkeletons() {
    const setEl = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    document.getElementById('profile-avatar').src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    setEl('profile-name',  '<div class="skeleton h-12 w-3/4 rounded mt-2 mb-2"></div>');
    setEl('profile-login', '<div class="skeleton h-5 w-1/3 rounded mb-3"></div>');
    setEl('profile-bio',   '<div class="skeleton h-5 w-full rounded mb-1"></div><div class="skeleton h-5 w-4/5 rounded"></div>');
    ['profile-location', 'profile-website', 'profile-company', 'profile-created'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
    });
    ['stat-followers', 'stat-stars', 'stat-repos', 'stat-following'].forEach(id => {
      setEl(id, '<div class="skeleton h-10 w-20 rounded mt-1"></div>');
    });
    const ring = document.getElementById('score-ring-fill');
    if (ring) ring.style.strokeDashoffset = '188.5';
    setEl('score-value', '<div class="skeleton h-8 w-12 rounded"></div>');
    const grade = document.getElementById('score-grade');
    if (grade) grade.textContent = '—';
    setEl('score-breakdown', '<div class="skeleton h-6 w-full rounded mb-2"></div><div class="skeleton h-6 w-full rounded"></div>');
    setEl('languages-container', '<div class="skeleton h-4 w-full rounded mb-4"></div><div class="skeleton h-4 w-4/5 rounded mb-4"></div><div class="skeleton h-4 w-3/5 rounded"></div>');
    setEl('repos-grid', Array(6).fill('<div class="bg-surface-container p-6 rounded-xl"><div class="skeleton h-5 w-1/2 rounded mb-4"></div><div class="skeleton h-4 w-full rounded mb-2"></div><div class="skeleton h-4 w-3/4 rounded mb-6"></div><div class="skeleton h-3 w-16 rounded"></div></div>').join(''));
    const svg    = document.getElementById('dep-graph-svg');
    if (svg) svg.innerHTML = '';
    const legend = document.getElementById('dep-legend');
    if (legend) legend.innerHTML = '';
  },

  setCompareSkeletons() {
    const setEl = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    ['a', 'b'].forEach(side => {
      const av = document.getElementById('cmp-avatar-' + side);
      if (av) av.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
      setEl('cmp-name-'  + side, '<div class="skeleton h-6 w-3/4 mx-auto rounded mb-2"></div>');
      setEl('cmp-login-' + side, '<div class="skeleton h-4 w-1/2 mx-auto rounded"></div>');
      setEl('cmp-score-' + side + '-wrap', '<div class="skeleton h-10 w-24 mx-auto rounded mt-3"></div>');
    });
    setEl('compare-stat-rows', Array(8).fill('<div class="px-6 py-5"><div class="skeleton h-3 w-full rounded mb-3"></div><div class="grid grid-cols-2 gap-4"><div><div class="skeleton h-3 w-16 rounded mb-1.5"></div><div class="skeleton h-2 w-full rounded"></div></div><div><div class="skeleton h-3 w-16 rounded mb-1.5"></div><div class="skeleton h-2 w-full rounded"></div></div></div></div>').join(''));
    ['a', 'b'].forEach(side => {
      setEl('cmp-lang-title-' + side, '<div class="skeleton h-4 w-32 rounded"></div>');
      setEl('cmp-langs-' + side, Array(4).fill('<div class="mb-3"><div class="flex justify-between mb-1"><div class="skeleton h-3 w-20 rounded"></div><div class="skeleton h-3 w-8 rounded"></div></div><div class="skeleton h-1.5 w-full rounded"></div></div>').join(''));
    });
    setEl('compare-winner-content', '<div class="skeleton h-16 w-16 rounded-full mx-auto mb-3"></div><div class="skeleton h-6 w-48 rounded mx-auto mb-2"></div>');
  },

  // ── PROFILE RENDER ───────────────────────────────────────

  renderProfile(user) {
    const escapedName = Utils.escapeHTML(user.name || user.login);
    const av = document.getElementById('profile-avatar');
    if (av) { av.src = user.avatar_url; av.alt = 'Profile picture of ' + escapedName; }
    const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.innerHTML = txt; };
    setTxt('profile-name',  escapedName);
    setTxt('profile-login', '@' + Utils.escapeHTML(user.login));
    setTxt('profile-bio',   Utils.escapeHTML(user.bio || 'No bio provided.'));
    const gl = document.getElementById('github-link');
    if (gl) gl.href = user.html_url;
    const grl = document.getElementById('github-repos-link');
    if (grl) grl.href = user.html_url + '?tab=repositories';
    const sn = document.getElementById('search-input-nav');
    if (sn) sn.value = user.login;
    ['profile-location', 'profile-website', 'profile-company', 'profile-created'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
    });
    if (user.location) {
      const el = document.getElementById('profile-location');
      if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
      const lt = document.getElementById('profile-location-text');
      if (lt) lt.textContent = user.location;
    }
    if (user.blog) {
      const el = document.getElementById('profile-website');
      if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
      const link = document.getElementById('profile-website-link');
      if (link) {
        link.textContent = user.blog.replace(/^https?:\/\//, '').split('/')[0];
        link.href = Utils.sanitizeUrl(user.blog);
      }
    }
    if (user.company) {
      const el = document.getElementById('profile-company');
      if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
      const ct = document.getElementById('profile-company-text');
      if (ct) ct.textContent = user.company;
    }
    if (user.created_at) {
      const el = document.getElementById('profile-created');
      if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
      const crt = document.getElementById('profile-created-text');
      if (crt) crt.textContent = 'Member since ' + new Date(user.created_at).getFullYear();
    }
  },

  // ── STATS RENDER ─────────────────────────────────────────

  renderStats(user, totalStars, totalForks, ownRepoCount) {
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setTxt('stat-followers', Utils.formatNum(user.followers));
    setTxt('stat-stars',     Utils.formatNum(totalStars));
    setTxt('stat-repos',     Utils.formatNum(user.public_repos));
    setTxt('stat-following', Utils.formatNum(user.following));

    const fLabel = document.getElementById('stat-followers-label');
    if (fLabel) {
      const f = user.followers;
      if (f === 0)          fLabel.textContent = 'Just getting started';
      else if (f < 10)      fLabel.textContent = f + ' people follow this dev';
      else if (f < 100)     fLabel.textContent = 'Growing community presence';
      else if (f < 500)     fLabel.textContent = 'Notable open-source contributor';
      else if (f < 2000)    fLabel.textContent = 'Established GitHub developer';
      else if (f < 10000)   fLabel.textContent = 'Top-tier GitHub influencer';
      else                  fLabel.textContent = 'Elite — top 0.1% of GitHub';
    }
    const sLabel = document.getElementById('stat-stars-label');
    if (sLabel) {
      if (totalStars === 0)       sLabel.textContent = 'No starred repos yet';
      else if (totalStars < 10)   sLabel.textContent = totalStars + ' total stars earned';
      else if (totalStars < 100)  sLabel.textContent = 'Building an open-source footprint';
      else if (totalStars < 500)  sLabel.textContent = 'Solid community traction';
      else if (totalStars < 2000) sLabel.textContent = 'Strong open-source impact';
      else if (totalStars < 10000)sLabel.textContent = 'Highly impactful repositories';
      else                        sLabel.textContent = 'Legendary open-source impact';
    }
    const rLabel = document.getElementById('stat-repos-label');
    if (rLabel) {
      if (ownRepoCount === 0)      rLabel.textContent = 'No original repos yet';
      else if (ownRepoCount < 5)   rLabel.textContent = ownRepoCount + ' original repos';
      else if (ownRepoCount < 20)  rLabel.textContent = 'Active builder';
      else if (ownRepoCount < 50)  rLabel.textContent = 'Prolific — ' + ownRepoCount + ' original projects';
      else                         rLabel.textContent = 'Power contributor — ' + ownRepoCount + ' repos';
    }
    const foLabel = document.getElementById('stat-following-label');
    if (foLabel) {
      const ratio = user.followers > 0
        ? (user.followers / Math.max(user.following, 1)).toFixed(1) : 0;
      if (user.following === 0)  foLabel.textContent = 'Not following anyone yet';
      else if (user.following < 10) foLabel.textContent = 'Selective networker';
      else if (ratio > 5)        foLabel.textContent = ratio + '× follower/following ratio';
      else if (ratio > 2)        foLabel.textContent = 'Well-networked developer';
      else                       foLabel.textContent = 'Follows ' + user.following + ' developers';
    }
  },

  // ── SCORE RENDER ─────────────────────────────────────────

  renderScore(user, totalStars, totalForks, ownRepoCount, accountAge) {
    const components = [
      { label: 'Global Impact',    icon: 'public',        raw: totalStars + (totalForks * 1.5), score: 40 * (1 - Math.exp(-(totalStars + (totalForks * 1.5)) / 1500)), max: 40 },
      { label: 'Community Reach',  icon: 'people',        raw: user.followers,                  score: 25 * (1 - Math.exp(-user.followers / 300)),                     max: 25 },
      { label: 'Productivity',     icon: 'inventory_2',   raw: ownRepoCount,                    score: 15 * (1 - Math.exp(-ownRepoCount / 30)),                        max: 15 },
      { label: 'Code Quality',     icon: 'military_tech', raw: totalStars / Math.max(ownRepoCount, 1), score: 10 * (1 - Math.exp(-(totalStars / Math.max(ownRepoCount, 1)) / 40)), max: 10 },
      { label: 'Account Maturity', icon: 'calendar_month',raw: accountAge,                      score: Math.min(10, accountAge),                                       max: 10 }
    ];
    const totalScore = Math.round(components.reduce((s, c) => s + c.score, 0));
    let grade, gradeBg;
    if (totalScore >= 85)      { grade = 'S'; gradeBg = 'bg-secondary/10 text-secondary'; }
    else if (totalScore >= 65) { grade = 'A'; gradeBg = 'bg-primary/10 text-primary'; }
    else if (totalScore >= 40) { grade = 'B'; gradeBg = 'bg-tertiary/10 text-tertiary'; }
    else                       { grade = 'C'; gradeBg = 'bg-outline-variant/20 text-on-surface-variant'; }
    const gradeDesc = { S: 'Elite developer profile', A: 'Strong, impactful presence', B: 'Growing community footprint', C: 'Early-stage developer' }[grade];
    const sv = document.getElementById('score-value');
    if (sv) sv.textContent = totalScore;
    const gradeEl = document.getElementById('score-grade');
    if (gradeEl) { gradeEl.textContent = 'Grade ' + grade; gradeEl.className = 'text-xs font-label font-bold px-2 py-0.5 rounded-full ' + gradeBg; }
    const sl = document.getElementById('score-label');
    if (sl) sl.textContent = gradeDesc;
    const circumference = 188.5;
    const offset = circumference - (totalScore / 100) * circumference;
    const ringColors = { S: '#97f999', A: '#83aeff', B: '#ffa366', C: '#a8abb3' };
    Utils.nextFrame(() => {
      const ring = document.getElementById('score-ring-fill');
      if (ring) { ring.style.strokeDashoffset = offset; ring.style.stroke = ringColors[grade]; }
    });
    const sb = document.getElementById('score-breakdown');
    if (sb) {
      sb.innerHTML = components.slice(0, 3).map(c => {
        const pct = Math.round((c.score / c.max) * 100);
        const barColor = pct >= 70 ? '#97f999' : pct >= 40 ? '#83aeff' : '#ffa366';
        return '<div class="score-pill">' +
          '<div class="flex items-center gap-1.5 text-on-surface-variant">' +
          '<span class="material-symbols-outlined" style="font-size:12px" aria-hidden="true">' + c.icon + '</span>' +
          Utils.escapeHTML(c.label) + '</div>' +
          '<div class="flex items-center gap-2">' +
          '<div style="width:48px;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden">' +
          '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:2px"></div></div>' +
          '<span style="color:' + barColor + ';font-weight:700;font-size:11px">' + pct + '%</span>' +
          '</div></div>';
      }).join('');
    }
  },

  // ── LANGUAGES RENDER ─────────────────────────────────────

  renderLanguages(topLangs, ownRepoCount, totalRepoCount) {
    const c    = document.getElementById('languages-container');
    const meta = document.getElementById('languages-meta');
    if (!c) return;
    if (!topLangs.length) {
      c.innerHTML = '<p class="text-on-surface-variant text-sm">No language data available.</p>';
      if (meta) meta.textContent = 'No original repositories found.';
      return;
    }
    c.innerHTML = topLangs.map(({ lang, pct }) =>
      '<div class="group">' +
      '<div class="flex justify-between items-end mb-2">' +
      '<span class="text-sm font-medium text-on-surface flex items-center gap-2">' +
      '<span class="w-2 h-2 rounded-full flex-shrink-0" style="background:' + Utils.getLangColor(lang) + '"></span>' +
      Utils.escapeHTML(lang) + '</span>' +
      '<span class="text-xs font-label text-on-surface-variant">' + pct + '%</span>' +
      '</div>' +
      '<div class="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">' +
      '<div class="lang-bar h-full rounded-full" style="background:' + Utils.getLangColor(lang) + '" data-width="' + pct + '"></div>' +
      '</div></div>'
    ).join('');
    const forkedNote = totalRepoCount > ownRepoCount ? ' (forks excluded)' : '';
    if (meta) meta.textContent = 'Based on ' + ownRepoCount + ' original repositories' + forkedNote + '.';
    Utils.nextFrame(() => {
      document.querySelectorAll('.lang-bar').forEach(b => { b.style.width = b.dataset.width + '%'; });
    });
  },

  // ── REPO CARDS RENDER ────────────────────────────────────

  renderRepoCards(topRepos, totalRepoCount) {
    const g        = document.getElementById('repos-grid');
    const subtitle = document.getElementById('repos-subtitle');
    if (!g) return;
    if (!topRepos.length) {
      g.innerHTML = '<p class="text-on-surface-variant text-sm col-span-3">No repositories found.</p>';
      return;
    }
    if (subtitle) {
      subtitle.textContent = totalRepoCount <= 6
        ? 'Showing all ' + topRepos.length + ' repositor' + (topRepos.length === 1 ? 'y' : 'ies') + '.'
        : 'Top 6 repositories by stars — ' + totalRepoCount + ' total.';
    }
    g.innerHTML = topRepos.map(repo => {
      const topics    = (repo.topics || []).slice(0, 4);
      const topicsHtml = topics.length
        ? '<div class="flex flex-wrap gap-1 mt-3">' + topics.map(t => '<span class="topic-chip">' + Utils.escapeHTML(t) + '</span>').join('') + '</div>'
        : '';
      const ownerLogin = Utils.escapeHTML(repo.owner ? repo.owner.login : '');
      const repoName   = Utils.escapeHTML(repo.name);
      return '<div class="bg-surface-container p-6 rounded-xl hover:bg-surface-bright transition-all transform hover:-translate-y-1 cursor-pointer"' +
        ' onclick="RepoDetail.open(\'' + ownerLogin + '\',\'' + repoName + '\',true)"' +
        ' role="button" tabindex="0"' +
        ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')RepoDetail.open(\'' + ownerLogin + '\',\'' + repoName + '\',true)">' +
        '<div class="flex justify-between items-start mb-4">' +
        '<span class="material-symbols-outlined text-primary" aria-hidden="true">' + (repo.fork ? 'fork_right' : 'folder_open') + '</span>' +
        '<div class="flex gap-4">' +
        '<div class="flex items-center gap-1 text-on-surface-variant text-xs font-label"><span class="material-symbols-outlined text-[14px]" aria-hidden="true">star</span>' + Utils.formatNum(repo.stargazers_count) + '</div>' +
        '<div class="flex items-center gap-1 text-on-surface-variant text-xs font-label"><span class="material-symbols-outlined text-[14px]" aria-hidden="true">fork_right</span>' + Utils.formatNum(repo.forks_count) + '</div>' +
        '</div></div>' +
        '<h3 class="text-lg font-bold mb-2 hover:text-primary transition-colors font-headline truncate">' + repoName + '</h3>' +
        '<p class="text-sm text-on-surface-variant mb-2 line-clamp-2">' + (Utils.escapeHTML(repo.description) || 'No description provided.') + '</p>' +
        topicsHtml +
        '<div class="flex items-center justify-between mt-4">' +
        '<div class="flex items-center gap-2">' +
        (repo.language
          ? '<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:' + Utils.getLangColor(repo.language) + '"></span>' +
            '<span class="text-xs font-label uppercase tracking-widest text-on-surface-variant">' + Utils.escapeHTML(repo.language) + '</span>'
          : '<span class="text-xs font-label text-on-surface-variant">—</span>') +
        '</div>' +
        (repo.fork ? '<span class="text-[10px] font-label text-on-surface-variant/50 uppercase tracking-wider border border-outline-variant/20 px-1.5 py-0.5 rounded">Forked</span>' : '') +
        '</div></div>';
    }).join('');
  },

  // ── COMPARE RENDER ───────────────────────────────────────

  renderCompare(a, b) {
    ['a', 'b'].forEach(side => {
      const d = side === 'a' ? a : b;
      const av = document.getElementById('cmp-avatar-' + side);
      if (av) { av.src = d.user.avatar_url; av.alt = 'Profile of ' + Utils.escapeHTML(d.user.login); }
      const nm = document.getElementById('cmp-name-'  + side);
      if (nm) nm.textContent = d.user.name || d.user.login;
      const lg = document.getElementById('cmp-login-' + side);
      if (lg) lg.textContent = '@' + d.user.login;
      const lk = document.getElementById('cmp-link-'  + side);
      if (lk) lk.href = d.user.html_url;
      const grade = d.score >= 85 ? 'S' : d.score >= 65 ? 'A' : d.score >= 40 ? 'B' : 'C';
      const gradeColors = { S: 'text-secondary bg-secondary/10', A: 'text-primary bg-primary/10', B: 'text-tertiary bg-tertiary/10', C: 'text-on-surface-variant bg-outline-variant/10' };
      const sw = document.getElementById('cmp-score-' + side + '-wrap');
      if (sw) sw.innerHTML =
        '<div class="flex items-center gap-2">' +
        '<span class="text-2xl font-black font-headline ' + (side === 'a' ? 'text-primary' : 'text-tertiary') + '">' + d.score + '</span>' +
        '<span class="text-xs font-label font-bold px-2 py-0.5 rounded-full ' + gradeColors[grade] + '">Grade ' + grade + '</span>' +
        '</div><p class="text-xs text-on-surface-variant font-label mt-1">Profile Score</p>';
    });

    const stats = [
      { label: 'Followers',     va: a.user.followers,    vb: b.user.followers,    fmt: Utils.formatNum.bind(Utils), higherBetter: true },
      { label: 'Total Stars',   va: a.totalStars,        vb: b.totalStars,        fmt: Utils.formatNum.bind(Utils), higherBetter: true },
      { label: 'Public Repos',  va: a.user.public_repos, vb: b.user.public_repos, fmt: v => String(v),             higherBetter: true },
      { label: 'Own Repos',     va: a.ownRepos.length,   vb: b.ownRepos.length,   fmt: v => String(v),             higherBetter: true },
      { label: 'Total Forks',   va: a.totalForks,        vb: b.totalForks,        fmt: Utils.formatNum.bind(Utils), higherBetter: true },
      { label: 'Following',     va: a.user.following,    vb: b.user.following,    fmt: Utils.formatNum.bind(Utils), higherBetter: false },
      { label: 'Account Age',   va: a.accountAge,        vb: b.accountAge,        fmt: v => v.toFixed(1) + 'y',    higherBetter: true },
      { label: 'Profile Score', va: a.score,             vb: b.score,             fmt: v => String(v),             higherBetter: true }
    ];

    const csr = document.getElementById('compare-stat-rows');
    if (csr) {
      csr.innerHTML = stats.map(stat => {
        const maxVal = Math.max(stat.va, stat.vb, 1);
        const pctA   = Math.round((stat.va / maxVal) * 100);
        const pctB   = Math.round((stat.vb / maxVal) * 100);
        const aWins  = stat.higherBetter ? stat.va > stat.vb : stat.va < stat.vb;
        const bWins  = stat.higherBetter ? stat.vb > stat.va : stat.vb < stat.va;
        const tie    = stat.va === stat.vb;
        return '<div class="px-6 py-5">' +
          '<div class="flex items-center justify-between mb-3">' +
          '<div class="flex items-center gap-2">' +
          '<span class="font-label text-xs font-semibold text-on-surface uppercase tracking-widest">' + Utils.escapeHTML(stat.label) + '</span>' +
          (!tie ? '<span class="winner-badge">' + (aWins ? Utils.escapeHTML(a.user.login) : Utils.escapeHTML(b.user.login)) + ' wins</span>' : '') +
          '</div></div>' +
          '<div class="grid grid-cols-2 gap-4">' +
          '<div><div class="flex justify-between text-xs font-label mb-1.5">' +
          '<span class="text-on-surface-variant">' + Utils.escapeHTML(a.user.login) + '</span>' +
          '<span class="' + (aWins ? 'text-primary font-bold' : 'text-on-surface-variant') + '">' + Utils.escapeHTML(String(stat.fmt(stat.va))) + '</span>' +
          '</div><div class="compare-bar-wrap"><div class="compare-bar" style="width:0%;background:#83aeff" data-w="' + pctA + '"></div></div></div>' +
          '<div><div class="flex justify-between text-xs font-label mb-1.5">' +
          '<span class="text-on-surface-variant">' + Utils.escapeHTML(b.user.login) + '</span>' +
          '<span class="' + (bWins ? 'text-tertiary font-bold' : 'text-on-surface-variant') + '">' + Utils.escapeHTML(String(stat.fmt(stat.vb))) + '</span>' +
          '</div><div class="compare-bar-wrap"><div class="compare-bar" style="width:0%;background:#ffa366" data-w="' + pctB + '"></div></div></div>' +
          '</div></div>';
      }).join('');
      Utils.nextFrame(() => {
        document.querySelectorAll('.compare-bar').forEach(b => { b.style.width = b.dataset.w + '%'; });
      });
    }

    ['a', 'b'].forEach(side => {
      const d     = side === 'a' ? a : b;
      const color = side === 'a' ? '#83aeff' : '#ffa366';
      const title = document.getElementById('cmp-lang-title-' + side);
      if (title) title.innerHTML =
        '<span class="w-3 h-3 rounded-full inline-block" style="background:' + color + '"></span> ' +
        Utils.escapeHTML(d.user.login) + "'s Languages";
      const allLangTotal = d.topLangs.reduce((s, l) => s + l.n, 0) || 1;
      const langsEl = document.getElementById('cmp-langs-' + side);
      if (langsEl) {
        langsEl.innerHTML = d.topLangs.map(({ lang, n }) => {
          const pct = ((n / allLangTotal) * 100).toFixed(1);
          return '<div>' +
            '<div class="flex justify-between text-xs font-label mb-1">' +
            '<span class="flex items-center gap-1.5">' +
            '<span class="w-2 h-2 rounded-full inline-block" style="background:' + Utils.getLangColor(lang) + '"></span>' +
            Utils.escapeHTML(lang) + '</span>' +
            '<span class="text-on-surface-variant">' + pct + '%</span>' +
            '</div>' +
            '<div class="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">' +
            '<div class="lang-bar h-full rounded-full" style="background:' + Utils.getLangColor(lang) + '" data-width="' + pct + '"></div>' +
            '</div></div>';
        }).join('');
        Utils.nextFrame(() => {
          document.querySelectorAll('#cmp-langs-' + side + ' .lang-bar').forEach(b => { b.style.width = b.dataset.width + '%'; });
        });
      }
    });

    const winnerEl = document.getElementById('compare-winner-content');
    if (winnerEl) {
      const aPoints = stats.filter(s => s.higherBetter ? s.va > s.vb : s.va < s.vb).length;
      const bPoints = stats.filter(s => s.higherBetter ? s.vb > s.va : s.vb < s.va).length;
      if (aPoints === bPoints) {
        winnerEl.innerHTML =
          '<div class="text-2xl font-black font-headline text-on-surface">It\'s a tie! 🤝</div>' +
          '<p class="text-on-surface-variant text-sm mt-1">Both developers are evenly matched across ' + stats.length + ' categories.</p>';
      } else {
        const winner    = aPoints > bPoints ? a : b;
        const winColor  = aPoints > bPoints ? '#83aeff' : '#ffa366';
        const winPoints = Math.max(aPoints, bPoints);
        winnerEl.innerHTML =
          '<img src="' + winner.user.avatar_url + '" alt="Winner Avatar" class="w-16 h-16 rounded-full border-2 mx-auto mb-3 object-cover" style="border-color:' + winColor + '"/>' +
          '<div class="text-2xl font-black font-headline" style="color:' + winColor + '">' + Utils.escapeHTML(winner.user.name || winner.user.login) + '</div>' +
          '<p class="text-on-surface-variant text-sm mt-1">Wins <strong>' + winPoints + ' of ' + stats.length + '</strong> categories with a profile score of <strong>' + winner.score + '/100</strong></p>';
      }
    }
  }
};
