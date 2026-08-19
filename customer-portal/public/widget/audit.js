/**
 * Nebula Landing Page Audit Widget
 * Play 4 - agencies as the distribution layer.
 *
 * Embed:
 *   <div id="nebula-audit-widget" data-partner="PARTNER_ID" data-theme="dark"></div>
 *   <script src="https://nebulacomponents.com/widget/audit.js" async></script>
 *
 * Vanilla JS + shadow DOM. No dependencies. Communicates only with
 * https://nebulacomponents.com/api/widget/*. Dark (default) / light themes.
 */
(function () {
  'use strict';

  var SITE = 'https://nebulacomponents.com';
  var API = SITE + '/api/widget/audit';
  var PLACEHOLDER = 'https://';

  var THEMES = {
    dark: {
      bg: '#0a0f1a',
      card: '#111827',
      text: '#e2e8f0',
      muted: '#94a3b8',
      accent: '#c7ff2f',
      border: '#1e293b',
      inputBg: '#0f172a',
      ringTrack: '#1e293b',
      danger: '#f87171',
    },
    light: {
      bg: '#ffffff',
      card: '#f8fafc',
      text: '#1a202c',
      muted: '#64748b',
      accent: '#00a98b',
      border: '#e2e8f0',
      inputBg: '#ffffff',
      ringTrack: '#e2e8f0',
      danger: '#dc2626',
    },
  };

  var GRADE_COLORS = {
    A: '#c7ff2f',
    B: '#84cc16',
    C: '#f59e0b',
    D: '#f97316',
    F: '#ef4444',
  };

  function gradeColor(grade, theme) {
    var g = (grade || '').toUpperCase().charAt(0);
    return GRADE_COLORS[g] || theme.accent;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initWidget(host) {
    var partner = host.getAttribute('data-partner') || '';
    var themeName = host.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    if (!partner) {
      host.innerHTML = '<p style="color:#f87171;font-family:system-ui">Nebula widget: missing data-partner attribute</p>';
      return;
    }

    var theme = THEMES[themeName];
    var shadow = host.attachShadow({ mode: 'open' });

    var style = document.createElement('style');
    style.textContent = [
      ':host { all: initial; }',
      '* { box-sizing: border-box; }',
      '.nw { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
      '  background: ' + theme.bg + '; color: ' + theme.text + ';',
      '  border: 1px solid ' + theme.border + '; border-radius: 12px;',
      '  padding: 20px; width: 100%; min-width: 280px; max-width: 100%;',
      '  font-size: 14px; line-height: 1.5; }',
      '.nw h3 { margin: 0 0 4px; font-size: 15px; font-weight: 650; color: ' + theme.text + '; }',
      '.nw p { margin: 4px 0; color: ' + theme.muted + '; }',
      '.nw input[type=url], .nw input[type=email] { width: 100%; padding: 10px 12px;',
      '  border: 1px solid ' + theme.border + '; border-radius: 8px;',
      '  background: ' + theme.inputBg + '; color: ' + theme.text + ';',
      '  font-size: 14px; margin: 6px 0; outline: none; }',
      '.nw input:focus { border-color: ' + theme.accent + '; }',
      '.nw button { width: 100%; padding: 11px 12px; border: 0; border-radius: 8px;',
      '  background: ' + theme.accent + '; color: #ffffff; font-size: 14px; font-weight: 650;',
      '  cursor: pointer; margin: 8px 0 0; transition: opacity .15s; }',
      '.nw button:hover { opacity: .9; }',
      '.nw button:disabled { opacity: .6; cursor: wait; }',
      '.nw .nw-error { color: ' + theme.danger + '; font-size: 13px; margin-top: 8px; }',
      '.nw .nw-pill { display: inline-block; background: ' + theme.accent + '22; color: ' + theme.accent + ';',
      '  border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 650; margin-bottom: 8px; }',
      '.nw .nw-ring-wrap { text-align: center; padding: 4px 0 8px; }',
      '.nw svg.nw-ring { transform: rotate(-90deg); }',
      '.nw .nw-ring-bg { stroke: ' + theme.ringTrack + '; fill: none; stroke-width: 10; }',
      '.nw .nw-ring-fg { fill: none; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 1s ease; }',
      '.nw .nw-score-big { font-size: 34px; font-weight: 750; fill: ' + theme.text + '; }',
      '.nw .nw-score-label { font-size: 12px; fill: ' + theme.muted + '; }',
      '.nw .nw-finding { border-top: 1px solid ' + theme.border + '; padding: 8px 0; }',
      '.nw .nw-finding b { color: ' + theme.text + '; }',
      '.nw a { color: ' + theme.accent + '; text-decoration: none; font-weight: 600; }',
      '.nw a:hover { text-decoration: underline; }',
      '.nw .nw-powered { margin-top: 12px; padding-top: 10px; border-top: 1px solid ' + theme.border + ';',
      '  font-size: 12px; color: ' + theme.muted + '; text-align: center; }',
      '.nw .nw-spinner { display: inline-block; width: 26px; height: 26px; margin: 14px auto;',
      '  border: 3px solid ' + theme.border + '; border-top-color: ' + theme.accent + ';',
      '  border-radius: 50%; animation: nwspin .8s linear infinite; }',
      '@keyframes nwspin { to { transform: rotate(360deg); } }',
    ].join('\n');
    shadow.appendChild(style);

    var root = document.createElement('div');
    root.className = 'nw';
    shadow.appendChild(root);

    function renderPowered() {
      var div = document.createElement('div');
      div.className = 'nw-powered';
      div.innerHTML = 'Powered by <a href="' + SITE + '/audit" target="_blank" rel="noopener">Nebula</a>';
      return div;
    }

    function renderForm() {
      root.innerHTML = '';
      var pill = document.createElement('span');
      pill.className = 'nw-pill';
      pill.textContent = 'Free landing page audit';
      root.appendChild(pill);

      var h3 = document.createElement('h3');
      h3.textContent = 'Find out why your page leaks conversions';
      root.appendChild(h3);

      var form = document.createElement('form');
      form.id = 'nw-form';

      var urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.placeholder = PLACEHOLDER + 'your-landing-page.com';
      urlInput.required = true;
      form.appendChild(urlInput);

      var emailInput = document.createElement('input');
      emailInput.type = 'email';
      emailInput.placeholder = 'Your email (optional) - get the full report';
      form.appendChild(emailInput);

      var submit = document.createElement('button');
      submit.type = 'submit';
      submit.textContent = 'Scan my page';
      form.appendChild(submit);

      var errBox = document.createElement('div');
      errBox.className = 'nw-error';
      errBox.style.display = 'none';
      form.appendChild(errBox);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        errBox.style.display = 'none';
        var u = urlInput.value.trim();
        if (!u) return;
        submit.disabled = true;
        submit.textContent = 'Analyzing…';
        renderProcessing();
        runAudit(u, emailInput.value.trim());
      });

      root.appendChild(form);
      root.appendChild(renderPowered());
    }

    function renderProcessing() {
      root.innerHTML = '';
      var h3 = document.createElement('h3');
      h3.textContent = 'Analyzing your page…';
      root.appendChild(h3);
      var p = document.createElement('p');
      p.textContent = 'Checking the page for conversion leaks. Usually 30–90 seconds.';
      root.appendChild(p);
      var spinner = document.createElement('div');
      spinner.className = 'nw-spinner';
      root.appendChild(spinner);
      root.appendChild(renderPowered());
    }

    function renderError(message) {
      root.innerHTML = '';
      var h3 = document.createElement('h3');
      h3.textContent = 'Couldn\u2019t complete the audit';
      root.appendChild(h3);
      var p = document.createElement('p');
      p.textContent = message || 'Something went wrong. Please try again.';
      root.appendChild(p);
      var back = document.createElement('button');
      back.textContent = 'Try again';
      back.addEventListener('click', renderForm);
      root.appendChild(back);
      root.appendChild(renderPowered());
    }

    function renderScore(payload) {
      root.innerHTML = '';
      var score = typeof payload.score === 'number' ? payload.score : null;
      var grade = payload.grade || '-';
      var color = gradeColor(grade, theme);

      var pill = document.createElement('span');
      pill.className = 'nw-pill';
      pill.textContent = 'Audit complete';
      root.appendChild(pill);

      var ringWrap = document.createElement('div');
      ringWrap.className = 'nw-ring-wrap';

      var r = 44;
      var circ = 2 * Math.PI * r;
      var frac = score == null ? 0 : Math.max(0, Math.min(1, score / 10));
      var svgNs = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNs, 'svg');
      svg.setAttribute('class', 'nw-ring');
      svg.setAttribute('width', '120');
      svg.setAttribute('height', '120');
      svg.setAttribute('viewBox', '0 0 120 120');

      var bg = document.createElementNS(svgNs, 'circle');
      bg.setAttribute('class', 'nw-ring-bg');
      bg.setAttribute('cx', '60');
      bg.setAttribute('cy', '60');
      bg.setAttribute('r', String(r));
      bg.setAttribute('stroke-width', '10');
      svg.appendChild(bg);

      var fg = document.createElementNS(svgNs, 'circle');
      fg.setAttribute('class', 'nw-ring-fg');
      fg.setAttribute('cx', '60');
      fg.setAttribute('cy', '60');
      fg.setAttribute('r', String(r));
      fg.setAttribute('stroke', color);
      fg.setAttribute('stroke-dasharray', String(circ));
      fg.setAttribute('stroke-dashoffset', String(circ));
      svg.appendChild(fg);

      // Animate the ring on next frame
      requestAnimationFrame(function () {
        fg.style.strokeDashoffset = String(circ * (1 - frac));
      });

      var scoreText = document.createElementNS(svgNs, 'text');
      scoreText.setAttribute('class', 'nw-score-big');
      scoreText.setAttribute('x', '60');
      scoreText.setAttribute('y', '58');
      scoreText.setAttribute('text-anchor', 'middle');
      scoreText.textContent = score == null ? '-' : score.toFixed(1);
      svg.appendChild(scoreText);

      var scoreLabel = document.createElementNS(svgNs, 'text');
      scoreLabel.setAttribute('class', 'nw-score-label');
      scoreLabel.setAttribute('x', '60');
      scoreLabel.setAttribute('y', '78');
      scoreLabel.setAttribute('text-anchor', 'middle');
      scoreLabel.textContent = 'out of 10 · grade ' + grade;
      svg.appendChild(scoreLabel);

      ringWrap.appendChild(svg);
      root.appendChild(ringWrap);

      var p = document.createElement('p');
      p.style.textAlign = 'center';
      p.style.margin = '0 0 8px';
      p.innerHTML = score == null
        ? 'Audit finished, but no score was returned.'
        : (score < 7
            ? 'This page is <b>leaking conversions</b> \u2014 ' + (3 - Math.min(3, Math.round((7 - score) * 2))) + ' or more signals are failing.'
            : 'Solid page \u2014 the free signals are mostly passing.');
      root.appendChild(p);

      // Top 3 findings
      var findings = Array.isArray(payload.findings_summary) ? payload.findings_summary : [];
      findings.slice(0, 3).forEach(function (f) {
        var item = document.createElement('div');
        item.className = 'nw-finding';
        var label = f.label || 'Finding';
        var issue = f.issue || '';
        item.innerHTML = '<b>' + escapeHtml(label) + ':</b> ' + escapeHtml(issue.slice(0, 140));
        root.appendChild(item);
      });

      if (payload.full_report_url) {
        var reportLink = document.createElement('p');
        reportLink.style.margin = '10px 0 0';
        reportLink.innerHTML = '<a href="' + escapeHtml(payload.full_report_url) + '" target="_blank" rel="noopener">See full report \u2192</a>';
        root.appendChild(reportLink);
      }

      root.appendChild(renderPowered());
    }

    function runAudit(url, email) {
      var payload = { url: url, partner_id: partner };
      if (email) payload.visitor_email = email;

      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) {
              throw new Error(data.error || 'Request failed (' + res.status + ')');
            }
            return data;
          });
        })
        .then(function (data) {
          renderScore(data);
        })
        .catch(function (err) {
          renderError(err.message || 'Network error');
        });
    }

    renderForm();
  }

  // Support multiple widget instances on one page (demo page has dark + light).
  function init() {
    var hosts = document.querySelectorAll('[id^="nebula-audit-widget"]');
    if (!hosts.length) return;
    Array.prototype.forEach.call(hosts, initWidget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
