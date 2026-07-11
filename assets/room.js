// Room join page. The URL is couch-games.com/<CODE>#<instance> — the same link
// a display's QR encodes for app deep-linking (see .well-known/). When the app
// isn't installed the browser lands here instead: we look the code up on the
// relay directory, show what we know about the room, and offer browser play
// plus the app stores.
//
// Game identity (names, art, host allow-list, per-game relays) comes from
// /games-manifest.json — the web-served counterpart of the controller apps'
// bundled manifest, so a new game is a site deploy, not a code change here.
//
// Resolution mirrors the controller apps (RoomDirectory in
// Couch-Games-Controller): probe the game relays and the shared relay in
// parallel and prefer a host-declared controller URL over the declared origin.
// Relay answers are UNTRUSTED — a join target that doesn't vet against the
// manifest allow-list is treated as "room not found": we won't send anyone to
// a game we can't identify.
(function () {
  'use strict';

  // ---- Store listings (fill in when the apps go live; sizes shown to users) ----
  var IOS_APP_URL = null;      // e.g. 'https://apps.apple.com/app/couch-games/id<APPSTORE_ID>'
  var IOS_APP_SIZE = '≈ 3 MB';
  var ANDROID_APP_URL = null;  // 'https://play.google.com/store/apps/details?id=com.couchgames.controller'
  var ANDROID_APP_SIZE = '≈ 8 MB';

  var SHARED_RELAY = 'https://ws.couch-games.com';
  var OWN_HOST = 'couch-games.com'; // preview deployments live on subdomains

  // ---- Room-code region decoding (mirrors Party-Sockets regions.ts/server.ts:
  // 6-char base58, top 5 bits = Fly region index, low 30 bits random) ----
  var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  var REGIONS = ['ams', 'arn', 'bom', 'cdg', 'dfw', 'ewr', 'fra', 'gru', 'iad',
    'jnb', 'lax', 'lhr', 'nrt', 'ord', 'sin', 'sjc', 'syd', 'yyz'];
  var REGION_NAMES = {
    ams: 'Amsterdam', arn: 'Stockholm', bom: 'Mumbai', cdg: 'Paris',
    dfw: 'Dallas', ewr: 'New York', fra: 'Frankfurt', gru: 'São Paulo',
    iad: 'Washington D.C.', jnb: 'Johannesburg', lax: 'Los Angeles',
    lhr: 'London', nrt: 'Tokyo', ord: 'Chicago', sin: 'Singapore',
    sjc: 'San Jose', syd: 'Sydney', yyz: 'Toronto'
  };
  var BODY_DIVISOR = Math.pow(2, 30);
  var MAX_CODE_VALUE = Math.pow(2, 35) - 1;

  function regionOf(code) {
    var value = 0; // 35 bits — safe in a double, no BigInt needed
    for (var i = 0; i < code.length; i++) {
      var v = ALPHABET.indexOf(code[i]);
      if (v === -1) return null;
      value = value * 58 + v;
    }
    if (value > MAX_CODE_VALUE) return null;
    var region = REGIONS[Math.floor(value / BODY_DIVISOR)];
    return region ? (REGION_NAMES[region] || region.toUpperCase()) : null;
  }

  // ---- DOM ----
  var el = {
    card: document.getElementById('roomcard'),
    art: document.getElementById('room-art'),
    mark: document.getElementById('room-mark'),
    status: document.getElementById('room-status'),
    code: document.getElementById('room-code'),
    meta: document.getElementById('room-meta'),
    game: document.getElementById('room-game'),
    region: document.getElementById('room-region'),
    browser: document.getElementById('join-browser'),
    ios: document.getElementById('app-ios'),
    iosSub: document.getElementById('app-ios-sub'),
    android: document.getElementById('app-android'),
    androidSub: document.getElementById('app-android-sub')
  };

  function setStatus(text, mod) {
    el.status.textContent = text;
    el.status.className = 'badge' + (mod ? ' badge--' + mod : '');
  }

  function setupStoreButton(a, sub, url, store, size) {
    if (url) {
      a.href = url;
      sub.textContent = store + ' · ' + size;
    } else {
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
      sub.textContent = 'Coming soon · ' + size;
    }
  }
  setupStoreButton(el.ios, el.iosSub, IOS_APP_URL, 'App Store', IOS_APP_SIZE);
  setupStoreButton(el.android, el.androidSub, ANDROID_APP_URL, 'Google Play', ANDROID_APP_SIZE);

  // ---- Parse the link ----
  var m = location.pathname.match(/^\/([1-9A-HJ-NP-Za-km-z]{6})$/);
  if (!m) {
    setStatus('Invalid link', 'err');
    metaMessage('No room code in this link — scan the QR on your TV.');
    return;
  }
  var code = m[1];
  var instance = (location.hash.slice(1).match(/^[A-Za-z0-9_-]{1,64}$/) || [''])[0];
  el.code.textContent = code;
  document.title = 'Room ' + code + ' · Couch Games';

  // ---- Relay lookup ----
  function lookup(base) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (ctrl) setTimeout(function () { ctrl.abort(); }, 5000);
    return fetch(base + '/room/' + encodeURIComponent(code), ctrl ? { signal: ctrl.signal } : {})
      .then(function (res) {
        if (!res.ok) return null;
        return res.json().then(function (json) {
          return {
            url: typeof json.url === 'string' ? json.url : null,
            origin: typeof json.origin === 'string' ? json.origin : null
          };
        });
      })
      .catch(function () { return null; });
  }

  function hostMatches(host, allowed) {
    return host === allowed || host.slice(-(allowed.length + 1)) === '.' + allowed;
  }

  function metaMessage(text) {
    el.meta.textContent = text;
    el.meta.hidden = false;
  }

  // One headline, no badge — the viewfinder-with-question-mark carries the
  // rest. (People land here from a QR/link, so a stale link is the usual
  // cause; the looked-up code stays visible below.)
  function notFound() {
    el.status.hidden = true;
    // SVG elements lack the HTMLElement `hidden` property — toggle the attribute.
    el.mark.removeAttribute('hidden');
    el.game.textContent = 'Room not found';
    el.game.hidden = false;
  }

  fetch('/games-manifest.json')
    .then(function (res) { return res.ok ? res.json() : null; })
    .catch(function () { return null; })
    .then(function (manifest) {
      var games = (manifest && manifest.games || []).filter(function (g) {
        return g && typeof g.name === 'string';
      });
      var allowedHosts = [OWN_HOST];
      var relays = [];
      for (var i = 0; i < games.length; i++) {
        var hosts = games[i].hosts || [];
        for (var j = 0; j < hosts.length; j++) allowedHosts.push(hosts[j].toLowerCase());
        var probe = games[i].relayProbeBase;
        if (probe && relays.indexOf(probe) === -1) relays.push(probe);
      }
      if (relays.indexOf(SHARED_RELAY) === -1) relays.push(SHARED_RELAY);

      // Returns the join URL when target is an allowed https URL, else null.
      function vetted(target) {
        var u;
        try { u = new URL(target); } catch (e) { return null; }
        if (u.protocol !== 'https:') return null;
        var host = u.hostname.toLowerCase();
        if (!allowedHosts.some(function (a) { return hostMatches(host, a); })) return null;
        if (instance && !u.hash) u.hash = instance;
        // Single-instance relays substitute {instance} with "" leaving a bare "#".
        return u.hash ? u.href : u.href.replace(/#$/, '');
      }

      function gameFor(joinUrl) {
        var host = new URL(joinUrl).hostname.toLowerCase();
        for (var i = 0; i < games.length; i++) {
          if ((games[i].hosts || []).some(function (h) { return hostMatches(host, h.toLowerCase()); })) {
            return games[i];
          }
        }
        return null;
      }

      function render(joinUrl) {
        var game = gameFor(joinUrl);
        if (game && game.art) {
          el.art.src = game.art;
          el.art.hidden = false;
          el.card.classList.add('roomcard--art');
        }
        if (game) {
          el.game.textContent = game.name;
          el.game.hidden = false;
        }
        // Only multi-instance relay deployments (which pin an #instance into
        // the join link) region-encode their codes — without that signal the
        // decoded "region" would just be random bits, so show none.
        var region = instance ? regionOf(code) : null;
        if (region) {
          el.region.textContent = region;
          el.region.hidden = false;
        }
        el.status.hidden = true; // the banner speaks for itself once live
        el.browser.href = joinUrl;
        el.browser.hidden = false;
      }

      Promise.all(relays.map(lookup)).then(function (results) {
        var founds = results.filter(Boolean);
        for (var i = 0; i < founds.length; i++) {
          if (founds[i].url) {
            var joinUrl = vetted(founds[i].url);
            if (joinUrl) return render(joinUrl);
          }
        }
        for (var j = 0; j < founds.length; j++) {
          if (founds[j].origin) {
            var originUrl = vetted(founds[j].origin.replace(/\/+$/, '') + '/' + code);
            if (originUrl) return render(originUrl);
          }
        }
        // Unknown, unreachable, or unvetted — we can't tell which game this
        // is, so there is nothing safe to join. One honest answer.
        notFound();
      });
    });
})();
