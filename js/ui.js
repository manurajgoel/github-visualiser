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
    const cr = document.getElementById('compare-results');
    if (cr) {
      cr.innerHTML =
        '<div class="grid grid-cols-2 gap-4 mb-6" style="align-items:center">' +
          '<div class="skeleton h-48 rounded-xl"></div>' +
          '<div class="skeleton h-48 rounded-xl"></div>' +
        '</div>' +
        '<div class="skeleton h-64 rounded-xl mb-4"></div>' +
        '<div class="skeleton h-80 rounded-xl mb-4"></div>' +
        '<div class="skeleton h-48 rounded-xl mb-4"></div>' +
        '<div class="skeleton h-16 rounded-xl"></div>';
    }
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
      if (f === 0)        fLabel.textContent = 'Just getting started';
      else if (f < 10)    fLabel.textContent = f + ' people follow this dev';
      else if (f < 100)   fLabel.textContent = 'Growing community presence';
      else if (f < 500)   fLabel.textContent = 'Notable open-source contributor';
      else if (f < 2000)  fLabel.textContent = 'Established GitHub developer';
      else if (f < 10000) fLabel.textContent = 'Top-tier GitHub influencer';
      else                fLabel.textContent = 'Elite — top 0.1% of GitHub';
    }
    const sLabel = document.getElementById('stat-stars-label');
    if (sLabel) {
      if (totalStars === 0)        sLabel.textContent = 'No starred repos yet';
      else if (totalStars < 10)    sLabel.textContent = totalStars + ' total stars earned';
      else if (totalStars < 100)   sLabel.textContent = 'Building an open-source footprint';
      else if (totalStars < 500)   sLabel.textContent = 'Solid community traction';
      else if (totalStars < 2000)  sLabel.textContent = 'Strong open-source impact';
      else if (totalStars < 10000) sLabel.textContent = 'Highly impactful repositories';
      else                         sLabel.textContent = 'Legendary open-source impact';
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
      const ratio = user.followers > 0 ? (user.followers / Math.max(user.following, 1)).toFixed(1) : 0;
      if (user.following === 0)    foLabel.textContent = 'Not following anyone yet';
      else if (user.following < 10)foLabel.textContent = 'Selective networker';
      else if (ratio > 5)          foLabel.textContent = ratio + '× follower/following ratio';
      else if (ratio > 2)          foLabel.textContent = 'Well-networked developer';
      else                         foLabel.textContent = 'Follows ' + user.following + ' developers';
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
      const topics     = (repo.topics || []).slice(0, 4);
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

  // ══════════════════════════════════════════════════════════
  // ── COMPARE RENDER (REDESIGNED) ───────────────────────────
  // ══════════════════════════════════════════════════════════

  renderCompare(a, b) {
    const cr = document.getElementById('compare-results');
    if (!cr) return;

    // ── helpers ──────────────────────────────────────────
    const getInitials = user => {
      const name = user.name || user.login || '??';
      return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const gradeInfo = score => {
      if (score >= 85) return { grade: 'S', bg: 'rgba(151,249,153,0.12)', color: '#97f999', border: 'rgba(151,249,153,0.3)' };
      if (score >= 65) return { grade: 'A', bg: 'rgba(131,174,255,0.12)', color: '#83aeff', border: 'rgba(131,174,255,0.3)' };
      if (score >= 40) return { grade: 'B', bg: 'rgba(255,163,102,0.12)', color: '#ffa366', border: 'rgba(255,163,102,0.3)' };
      return                  { grade: 'C', bg: 'rgba(168,171,179,0.12)', color: '#a8abb3', border: 'rgba(168,171,179,0.3)' };
    };

    // log scale bar width — makes huge differences still visible
    const logWidth = (val, maxVal) => {
      if (maxVal <= 0) return 0;
      if (val <= 0) return 0;
      return Math.round((Math.log10(Math.max(val, 0.1)) / Math.log10(Math.max(maxVal, 0.1))) * 100);
    };

    const gi_a = gradeInfo(a.score);
    const gi_b = gradeInfo(b.score);

    // ── 1. PROFILE CARDS ─────────────────────────────────
    const profileCardsHTML =
      '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;margin-bottom:20px">' +

      // Card A
      '<div class="cmp-profile-card side-a">' +
        '<div class="cmp-avatar-initials side-a">' + Utils.escapeHTML(getInitials(a.user)) + '</div>' +
        '<div style="font-size:18px;font-weight:800;font-family:Inter,sans-serif;color:#f1f3fc;margin-bottom:3px">' + Utils.escapeHTML(a.user.name || a.user.login) + '</div>' +
        '<div style="font-size:11px;font-family:Space Grotesk,sans-serif;color:#a8abb3;margin-bottom:10px">@' + Utils.escapeHTML(a.user.login) + '</div>' +
        '<div class="cmp-grade-badge" style="background:' + gi_a.bg + ';color:' + gi_a.color + ';border:1px solid ' + gi_a.border + '">Grade ' + gi_a.grade + '</div>' +
        '<div class="cmp-big-score" style="color:' + gi_a.color + '">' + a.score + '</div>' +
        '<div class="cmp-score-label">profile score</div>' +
      '</div>' +

      // VS
      '<div class="cmp-vs-divider"><div class="cmp-vs-badge">VS</div></div>' +

      // Card B
      '<div class="cmp-profile-card side-b">' +
        '<div class="cmp-avatar-initials side-b">' + Utils.escapeHTML(getInitials(b.user)) + '</div>' +
        '<div style="font-size:18px;font-weight:800;font-family:Inter,sans-serif;color:#f1f3fc;margin-bottom:3px">' + Utils.escapeHTML(b.user.name || b.user.login) + '</div>' +
        '<div style="font-size:11px;font-family:Space Grotesk,sans-serif;color:#a8abb3;margin-bottom:10px">@' + Utils.escapeHTML(b.user.login) + '</div>' +
        '<div class="cmp-grade-badge" style="background:' + gi_b.bg + ';color:' + gi_b.color + ';border:1px solid ' + gi_b.border + '">Grade ' + gi_b.grade + '</div>' +
        '<div class="cmp-big-score" style="color:' + gi_b.color + '">' + b.score + '</div>' +
        '<div class="cmp-score-label">profile score</div>' +
      '</div>' +

      '</div>';

    // ── 2. HEAD-TO-HEAD METRICS ───────────────────────────
    const metrics = [
      { label: 'Followers',     va: a.user.followers,    vb: b.user.followers,    fmt: Utils.formatNum.bind(Utils) },
      { label: 'Total Stars',   va: a.totalStars,        vb: b.totalStars,        fmt: Utils.formatNum.bind(Utils) },
      { label: 'Public Repos',  va: a.user.public_repos, vb: b.user.public_repos, fmt: v => String(v) },
      { label: 'Total Forks',   va: a.totalForks,        vb: b.totalForks,        fmt: Utils.formatNum.bind(Utils) },
      { label: 'Account Age',   va: a.accountAge,        vb: b.accountAge,        fmt: v => v.toFixed(1) + 'y' },
      { label: 'Profile Score', va: a.score,             vb: b.score,             fmt: v => String(v) }
    ];

    let metricRowsHTML = '';
    metrics.forEach(m => {
      const aWins  = m.va > m.vb;
      const bWins  = m.vb > m.va;
      const maxVal = Math.max(m.va, m.vb, 1);
      const wA     = logWidth(m.va, maxVal);
      const wB     = logWidth(m.vb, maxVal);

      metricRowsHTML +=
        '<div class="h2h-metric-row">' +
          '<div class="h2h-metric-label-row">' +
            '<span class="h2h-metric-name">' + Utils.escapeHTML(m.label) + '</span>' +
            (!aWins && !bWins ? '' :
              '<span class="h2h-winner-pill' + (bWins ? ' side-b' : '') + '">' +
                Utils.escapeHTML(aWins ? a.user.login : b.user.login) + ' wins' +
              '</span>') +
          '</div>' +
          '<div class="h2h-bars-wrap">' +
            // Side A
            '<div class="h2h-bar-side">' +
              '<div class="h2h-bar-meta">' +
                '<span class="h2h-bar-username">' + Utils.escapeHTML(a.user.login) + '</span>' +
                '<span class="h2h-bar-value' + (aWins ? ' winner' : '') + '">' + Utils.escapeHTML(String(m.fmt(m.va))) + '</span>' +
              '</div>' +
              '<div class="h2h-bar-track">' +
                '<div class="h2h-bar-fill side-a" style="width:0" data-w="' + wA + '"></div>' +
              '</div>' +
            '</div>' +
            // Side B
            '<div class="h2h-bar-side">' +
              '<div class="h2h-bar-meta">' +
                '<span class="h2h-bar-username">' + Utils.escapeHTML(b.user.login) + '</span>' +
                '<span class="h2h-bar-value' + (bWins ? ' winner-b' : '') + '">' + Utils.escapeHTML(String(m.fmt(m.vb))) + '</span>' +
              '</div>' +
              '<div class="h2h-bar-track">' +
                '<div class="h2h-bar-fill side-b" style="width:0" data-w="' + wB + '"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    const h2hHTML =
      '<div class="h2h-section">' +
        '<div class="h2h-section-title">Head-to-Head Metrics</div>' +
        metricRowsHTML +
      '</div>';

    // ── 3. SKILL RADAR ────────────────────────────────────
    // 5 dimensions scored 0-100 each
    const radarDims = ['Community\nReach', 'Open Source\nImpact', 'Productivity', 'Consistency', 'Repo\nQuality'];

    const calcRadarScores = d => [
      Math.round(Math.min(100, 25 * (1 - Math.exp(-d.user.followers / 300)) * 4)),         // community reach
      Math.round(Math.min(100, 40 * (1 - Math.exp(-(d.totalStars + d.totalForks * 1.5) / 1500)) * 2.5)), // open source impact
      Math.round(Math.min(100, 15 * (1 - Math.exp(-d.ownRepos.length / 30)) * 6.67)),       // productivity
      Math.round(Math.min(100, d.accountAge >= 1 ? Math.min(100, (d.ownRepos.length / Math.max(d.accountAge, 1)) * 8) : 0)), // consistency
      Math.round(Math.min(100, 10 * (1 - Math.exp(-(d.totalStars / Math.max(d.ownRepos.length, 1)) / 40)) * 10)) // repo quality
    ];

    const scoresA = calcRadarScores(a);
    const scoresB = calcRadarScores(b);

    const radarHTML =
      '<div class="radar-section">' +
        '<div class="radar-section-title">Skill Radar</div>' +
        '<svg id="skill-radar-svg" width="420" height="320" viewBox="0 0 420 320"></svg>' +
        '<div class="radar-legend">' +
          '<div class="radar-legend-item"><div class="radar-legend-dot" style="background:#83aeff"></div>' + Utils.escapeHTML(a.user.login) + '</div>' +
          '<div class="radar-legend-item"><div class="radar-legend-dot" style="background:#ffa366"></div>' + Utils.escapeHTML(b.user.login) + '</div>' +
        '</div>' +
      '</div>';

    // ── 4. COMPARISON INSIGHTS ────────────────────────────
    const starsPerRepoA = a.ownRepos.length > 0 ? Math.round(a.totalStars / a.ownRepos.length) : 0;
    const starsPerRepoB = b.ownRepos.length > 0 ? Math.round(b.totalStars / b.ownRepos.length) : 0;

    // Shared languages
    const langsA = new Set(a.topLangs.map(l => l.lang));
    const langsB = new Set(b.topLangs.map(l => l.lang));
    const shared = [...langsA].filter(l => langsB.has(l));

    // Follower ratio text
    const followerRatio = a.user.followers > b.user.followers
      ? (a.user.followers / Math.max(b.user.followers, 1)).toFixed(0) + '×'
      : (b.user.followers / Math.max(a.user.followers, 1)).toFixed(0) + '×';
    const followerLeader = a.user.followers >= b.user.followers ? a.user : b.user;
    const followerTrailer = a.user.followers >= b.user.followers ? b.user : a.user;

    const insightCommunity = Utils.escapeHTML(followerLeader.login) + ' has ' + followerRatio + ' more followers' +
      (followerLeader.followers >= 10000 ? ', placing in the top 0.1% of GitHub globally.' : ' than ' + Utils.escapeHTML(followerTrailer.login) + '.');

    const insightStars = starsPerRepoA >= starsPerRepoB
      ? Utils.escapeHTML(a.user.login) + ' averages ~' + starsPerRepoA + ' stars/repo. ' +
        (starsPerRepoB === 0 ? Utils.escapeHTML(b.user.login) + ' has no starred repos yet — strong growth potential.' : Utils.escapeHTML(b.user.login) + ' averages ~' + starsPerRepoB + ' stars/repo.')
      : Utils.escapeHTML(b.user.login) + ' averages ~' + starsPerRepoB + ' stars/repo. ' +
        (starsPerRepoA === 0 ? Utils.escapeHTML(a.user.login) + ' has no starred repos yet — strong growth potential.' : Utils.escapeHTML(a.user.login) + ' averages ~' + starsPerRepoA + ' stars/repo.');

    const ageLeader = a.accountAge >= b.accountAge ? a.user : b.user;
    const ageYrs    = Math.floor(Math.max(a.accountAge, b.accountAge));
    const insightAge = Utils.escapeHTML(ageLeader.login) + "'s " + ageYrs + 'yr tenure shows sustained long-term output, not a single viral moment.';

    const insightLang = shared.length > 0
      ? 'Both devs share ' + shared.slice(0, 3).map(Utils.escapeHTML).join(' + ') + ' as primary tools — they operate in the same domain.'
      : 'No overlapping primary languages — these developers work in distinct tech ecosystems.';

    const insightsHTML =
      '<div class="insights-section">' +
        '<div class="insights-title">' +
          '<span style="color:#ffa366;font-size:14px">✦</span> Comparison Insights' +
        '</div>' +
        '<div class="insights-grid">' +
          '<div class="insight-card"><div class="insight-card-title">Community reach</div><div class="insight-card-body">' + insightCommunity + '</div></div>' +
          '<div class="insight-card"><div class="insight-card-title">Star efficiency</div><div class="insight-card-body">' + insightStars + '</div></div>' +
          '<div class="insight-card"><div class="insight-card-title">Account maturity</div><div class="insight-card-body">' + insightAge + '</div></div>' +
          '<div class="insight-card"><div class="insight-card-title">Language overlap</div><div class="insight-card-body">' + insightLang + '</div></div>' +
        '</div>' +
      '</div>';

    // ── 5. OVERALL WINNER BANNER ──────────────────────────
    const aWinCount = metrics.filter(m => m.va > m.vb).length;
    const bWinCount = metrics.filter(m => m.vb > m.va).length;
    const total     = metrics.length;
    let winnerHTML;

    if (aWinCount === bWinCount) {
      winnerHTML =
        '<div class="winner-banner-new" style="justify-content:center;text-align:center">' +
          '<div>' +
            '<div style="font-size:22px;font-weight:900;font-family:Inter,sans-serif;color:#f1f3fc;margin-bottom:4px">It\'s a tie! 🤝</div>' +
            '<div style="font-size:12px;font-family:Space Grotesk,sans-serif;color:#a8abb3">Both developers are evenly matched across ' + total + ' categories.</div>' +
          '</div>' +
        '</div>';
    } else {
      const winner   = aWinCount > bWinCount ? a : b;
      const winCount = Math.max(aWinCount, bWinCount);
      const isA      = aWinCount > bWinCount;
      const wColor   = isA ? '#83aeff' : '#ffa366';
      const wBg      = isA ? 'rgba(131,174,255,0.12)' : 'rgba(255,163,102,0.12)';
      const wBorder  = isA ? 'rgba(131,174,255,0.3)'  : 'rgba(255,163,102,0.3)';
      winnerHTML =
        '<div class="winner-banner-new" style="border-color:' + wBorder + '">' +
          '<div class="winner-banner-left">' +
            '<div class="winner-avatar-sm" style="background:' + wBg + ';color:' + wColor + ';border:2px solid ' + wBorder + '">' +
              Utils.escapeHTML(getInitials(winner.user)) +
            '</div>' +
            '<div>' +
              '<div class="winner-banner-text-top">Overall winner —</div>' +
              '<div class="winner-banner-name">' + Utils.escapeHTML(winner.user.name || winner.user.login) + '</div>' +
              '<div class="winner-banner-sub">Wins ' + winCount + ' of ' + total + ' scored categories with a profile score of ' + winner.score + '/' + total * Math.round(100 / total) * total / total + 100 + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="winner-wins-badge" style="background:' + wBg + ';color:' + wColor + ';border:2px solid ' + wBorder + '">' +
            winCount + '/' + total +
          '</div>' +
        '</div>';
    }

    // ── Inject everything ─────────────────────────────────
    cr.innerHTML = profileCardsHTML + h2hHTML + radarHTML + insightsHTML + winnerHTML;

    // ── Animate bars after paint ──────────────────────────
    Utils.nextFrame(() => {
      cr.querySelectorAll('.h2h-bar-fill').forEach(b => {
        b.style.width = b.dataset.w + '%';
      });
    });

    // ── Draw radar chart with D3 ──────────────────────────
    UI._drawRadar(scoresA, scoresB, radarDims, a.user.login, b.user.login);
  },

  // ── D3 RADAR CHART ───────────────────────────────────────
  _drawRadar(scoresA, scoresB, dims, loginA, loginB) {
    const svgEl = document.getElementById('skill-radar-svg');
    if (!svgEl || typeof d3 === 'undefined') return;

    svgEl.innerHTML = '';
    const W = 420, H = 320;
    const cx = W / 2, cy = H / 2 + 10;
    const R  = 110;
    const n  = dims.length;
    const levels = 4;

    const angle = i => (Math.PI * 2 * i / n) - Math.PI / 2;
    const coord = (val, i, maxR) => ({
      x: cx + maxR * (val / 100) * Math.cos(angle(i)),
      y: cy + maxR * (val / 100) * Math.sin(angle(i))
    });

    const svg = d3.select(svgEl);

    // Background rings
    for (let lv = 1; lv <= levels; lv++) {
      const r = R * (lv / levels);
      const pts = Array.from({ length: n }, (_, i) => {
        const a = angle(i);
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      });
      svg.append('polygon')
        .attr('points', pts.map(p => p.join(',')).join(' '))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(131,174,255,0.1)')
        .attr('stroke-width', 1);
    }

    // Axis lines
    Array.from({ length: n }, (_, i) => {
      const a = angle(i);
      svg.append('line')
        .attr('x1', cx).attr('y1', cy)
        .attr('x2', cx + R * Math.cos(a))
        .attr('y2', cy + R * Math.sin(a))
        .attr('stroke', 'rgba(131,174,255,0.15)')
        .attr('stroke-width', 1);
    });

    // Polygon builder
    const polyPoints = (scores) =>
      scores.map((s, i) => {
        const c = coord(s, i, R);
        return c.x + ',' + c.y;
      }).join(' ');

    // Area A
    svg.append('polygon')
      .attr('points', polyPoints(scoresA))
      .attr('fill', 'rgba(131,174,255,0.12)')
      .attr('stroke', '#83aeff')
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round');

    // Dots A
    scoresA.forEach((s, i) => {
      const c = coord(s, i, R);
      svg.append('circle').attr('cx', c.x).attr('cy', c.y).attr('r', 3)
        .attr('fill', '#83aeff');
    });

    // Area B
    svg.append('polygon')
      .attr('points', polyPoints(scoresB))
      .attr('fill', 'rgba(255,163,102,0.1)')
      .attr('stroke', '#ffa366')
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round');

    // Dots B
    scoresB.forEach((s, i) => {
      const c = coord(s, i, R);
      svg.append('circle').attr('cx', c.x).attr('cy', c.y).attr('r', 3)
        .attr('fill', '#ffa366');
    });

    // Axis labels
    dims.forEach((dim, i) => {
      const a   = angle(i);
      const lx  = cx + (R + 22) * Math.cos(a);
      const ly  = cy + (R + 22) * Math.sin(a);
      const lines = dim.split('\n');
      const text = svg.append('text')
        .attr('x', lx).attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#a8abb3')
        .attr('font-size', '10')
        .attr('font-family', 'Space Grotesk, sans-serif');
      lines.forEach((line, li) => {
        text.append('tspan')
          .attr('x', lx)
          .attr('dy', li === 0 ? (lines.length > 1 ? '-0.5em' : '0') : '1.2em')
          .text(line);
      });
    });
  }
};