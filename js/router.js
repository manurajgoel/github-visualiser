/* js/router.js */
"use strict";

const Router = {
  init() {
    window.addEventListener('popstate', e => this.handlePopState(e));
    this.parseUrl();
  },

  navigate(view, params = {}, pushState = true) {
    if (view === 'landing') {
      if (pushState) history.pushState({ view: 'landing' }, '', window.location.pathname);
      UI.transition(() => UI.switchView('landing'));
      return;
    }
    if (pushState) {
      const url = new URL(window.location);
      url.search = '';
      if (view === 'dashboard'   && params.user)              url.searchParams.set('user',  params.user);
      if (view === 'compare'     && params.a && params.b)   { url.searchParams.set('a', params.a); url.searchParams.set('b', params.b); }
      if (view === 'repo-search' && params.q)                 url.searchParams.set('q',     params.q);
      if (view === 'repo-detail' && params.owner && params.repo) {
        url.searchParams.set('owner', params.owner);
        url.searchParams.set('repo',  params.repo);
      }
      history.pushState({ view, ...params }, '', url);
    }
    UI.switchView(view);
  },

  handlePopState(e) {
    const state = e.state;
    if (!state || state.view === 'landing') {
      UI.transition(() => UI.switchView('landing'));
      return;
    }
    if (state.view === 'dashboard' && state.user) {
      API.fetchProfile(state.user, false);
    } else if (state.view === 'compare' && state.a && state.b) {
      document.getElementById('compare-input-a').value = state.a;
      document.getElementById('compare-input-b').value = state.b;
      API.executeCompare(state.a, state.b, false);
    } else if (state.view === 'compare') {
      UI.transition(() => UI.switchView('compare'));
      App.resetCompare();
    } else if (state.view === 'repo-search') {
      UI.transition(() => UI.switchView('repo-search'));
      if (state.q) RepoSearch.searchQuery(state.q, false);
      else         RepoSearch.reset();
    } else if (state.view === 'repo-detail' && state.owner && state.repo) {
      RepoDetail.open(state.owner, state.repo, false);
    } else {
      UI.transition(() => UI.switchView(state.view));
    }
  },

  parseUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('owner') && params.has('repo')) {
      RepoDetail.open(params.get('owner'), params.get('repo'), false);
    } else if (params.has('user')) {
      API.fetchProfile(params.get('user'), false);
    } else if (params.has('a') && params.has('b')) {
      const a = params.get('a'), b = params.get('b');
      document.getElementById('compare-input-a').value = a;
      document.getElementById('compare-input-b').value = b;
      UI.switchView('compare');
      API.executeCompare(a, b, false);
    } else if (params.has('q')) {
      UI.switchView('repo-search');
      RepoSearch.searchQuery(params.get('q'), false);
    } else if (params.get('view') === 'repo-search') {
      UI.switchView('repo-search');
      RepoSearch.reset();
    } else if (params.get('view') === 'compare') {
      UI.switchView('compare');
      App.resetCompare();
    } else {
      UI.switchView('landing');
    }
  }
};
