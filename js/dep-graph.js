/* js/dep-graph.js */
"use strict";

const DepGraph = {
  simulation: null,

  render(repos) {
    const svgEl = document.getElementById('dep-graph-svg');
    if (!svgEl) return;
    svgEl.innerHTML = '';
    if (!repos || repos.length === 0) return;

    const width  = svgEl.parentElement ? (svgEl.parentElement.clientWidth || 900) : 900;
    const height = 420;
    svgEl.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    // Build language groups
    const langGroups = {};
    repos.forEach(r => {
      const lang = r.language || 'Other';
      if (!langGroups[lang]) langGroups[lang] = [];
      langGroups[lang].push(r);
    });
    const sortedLangs = Object.entries(langGroups)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8);

    const nodes = [];
    const links = [];

    // Hub node
    const hubNode = {
      id: '__hub__', type: 'hub',
      label: State.currentUser ? State.currentUser.login : 'Dev',
      stars: 0
    };
    nodes.push(hubNode);

    sortedLangs.forEach(([lang, langRepos]) => {
      const langNode = {
        id: '__lang__' + lang, type: 'lang', label: lang,
        stars: langRepos.reduce((s, r) => s + r.stargazers_count, 0)
      };
      nodes.push(langNode);
      links.push({ source: '__hub__', target: '__lang__' + lang, type: 'hub-lang' });
      langRepos
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 4)
        .forEach(repo => {
          nodes.push({
            id: repo.full_name, type: 'repo',
            label: repo.name, lang,
            stars: repo.stargazers_count,
            url: repo.html_url,
            desc: repo.description
          });
          links.push({ source: '__lang__' + lang, target: repo.full_name, type: 'lang-repo' });
        });
    });

    const d3svg = d3.select(svgEl);
    d3svg.style('background', '#080c11');
    const g = d3svg.append('g');

    d3svg.call(
      d3.zoom().scaleExtent([0.3, 3]).on('zoom', e => g.attr('transform', e.transform))
    );

    const link = g.append('g').selectAll('line').data(links).enter().append('line')
      .attr('class', 'dep-link')
      .attr('stroke-width', d => d.type === 'hub-lang' ? 2 : 1)
      .attr('stroke', d => d.type === 'hub-lang' ? 'rgba(131,174,255,0.3)' : 'rgba(131,174,255,0.12)');

    const nodeG = g.append('g').selectAll('.dep-node').data(nodes).enter().append('g')
      .attr('class', 'dep-node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag',  dragged)
        .on('end',   dragended)
      );

    nodeG.append('circle')
      .attr('r', d => {
        if (d.type === 'hub')  return 28;
        if (d.type === 'lang') return 18;
        return 6 + Math.min(16, Math.sqrt(d.stars + 1) * 1.5);
      })
      .attr('fill', d => {
        if (d.type === 'hub')  return 'rgba(131,174,255,0.15)';
        if (d.type === 'lang') return Utils.getLangColor(d.label) + '22';
        return Utils.getLangColor(d.lang) + '18';
      })
      .attr('stroke', d => {
        if (d.type === 'hub')  return '#83aeff';
        if (d.type === 'lang') return Utils.getLangColor(d.label);
        return Utils.getLangColor(d.lang);
      })
      .attr('stroke-width', d => d.type === 'hub' ? 2.5 : 1.5);

    nodeG.append('text')
      .attr('dy', '0.35em').attr('text-anchor', 'middle')
      .attr('fill', d => {
        if (d.type === 'hub')  return '#83aeff';
        if (d.type === 'lang') return Utils.getLangColor(d.label);
        return '#a8abb3';
      })
      .attr('font-size',   d => d.type === 'hub' ? '11px' : d.type === 'lang' ? '10px' : '8px')
      .attr('font-family', "'Space Grotesk', sans-serif")
      .attr('font-weight', d => d.type !== 'repo' ? '700' : '400')
      .text(d => d.label.length > 12 ? d.label.slice(0, 11) + '…' : d.label);

    const depTooltip = document.getElementById('dep-tooltip');

    nodeG
      .on('mouseenter', function (event, d) {
        if (d.type === 'hub' || !depTooltip) return;
        let content = '';
        if (d.type === 'lang') {
          const found     = sortedLangs.find(([l]) => l === d.label);
          const repoCount = found ? found[1].length : 0;
          content = '<strong>' + Utils.escapeHTML(d.label) + '</strong><br>' +
            repoCount + ' repos · ' + Utils.formatNum(d.stars) + ' stars';
        } else {
          content = '<strong>' + Utils.escapeHTML(d.label) + '</strong><br>' +
            Utils.escapeHTML(d.lang || 'Unknown') + ' · ⭐ ' + Utils.formatNum(d.stars) +
            (d.desc ? '<br><span style="opacity:0.7">' + Utils.escapeHTML(d.desc.slice(0, 50)) + (d.desc.length > 50 ? '…' : '') + '</span>' : '');
        }
        depTooltip.innerHTML = content;
        depTooltip.style.display = 'block';
      })
      .on('mousemove', function (event) {
        if (!depTooltip) return;
        const rect = svgEl.parentElement ? svgEl.parentElement.getBoundingClientRect() : { left: 0, top: 0 };
        depTooltip.style.left = (event.clientX - rect.left + 12) + 'px';
        depTooltip.style.top  = (event.clientY - rect.top  - 28) + 'px';
      })
      .on('mouseleave', function () { if (depTooltip) depTooltip.style.display = 'none'; })
      .on('click', function (event, d) {
        if (d.type === 'repo' && d.url) window.open(d.url, '_blank', 'noopener noreferrer');
      });

    if (this.simulation) this.simulation.stop();

    this.simulation = d3.forceSimulation(nodes)
      .force('link',      d3.forceLink(links).id(d => d.id).distance(d => d.type === 'hub-lang' ? 90 : 55).strength(0.7))
      .force('charge',    d3.forceManyBody().strength(d => d.type === 'hub' ? -400 : d.type === 'lang' ? -150 : -60))
      .force('center',    d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.type === 'hub' ? 38 : d.type === 'lang' ? 28 : 20))
      .on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        nodeG.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
      });

    function dragstarted(event, d) {
      if (!event.active) DepGraph.simulation.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d)  { d.fx = event.x; d.fy = event.y; }
    function dragended(event, d) {
      if (!event.active) DepGraph.simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }

    const legend = document.getElementById('dep-legend');
    if (legend) {
      legend.innerHTML = sortedLangs.slice(0, 8).map(([lang, lr]) =>
        '<div class="flex items-center gap-1.5 text-xs font-label text-on-surface-variant">' +
        '<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:' + Utils.getLangColor(lang) + '"></span>' +
        Utils.escapeHTML(lang) + ' <span class="text-on-surface-variant/50">(' + lr.length + ')</span></div>'
      ).join('');
    }
  }
};
