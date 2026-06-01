const fs = require('fs');
const path = require('path');

const rootDir = process.env.GITHUB_WORKSPACE || process.cwd();
const outputFile = path.join(rootDir, 'index.html');

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.github',
  '.vscode',
  '.codex-preview',
  'node_modules',
  '__pycache__',
]);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toUrlPath(...segments) {
  return `./${segments.map(segment => encodeURIComponent(segment)).join('/')}`;
}

function getCategory(folderName) {
  if (folderName.includes('--')) {
    return folderName.split('--')[0];
  }

  if (folderName.includes('-')) {
    return folderName.split('-')[0];
  }

  return '其他';
}

function findHtmlFile(folderPath) {
  const files = fs.readdirSync(folderPath, { withFileTypes: true });
  return files
    .filter(file => file.isFile() && file.name.toLowerCase().endsWith('.html'))
    .map(file => file.name)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN', { numeric: true }))[0];
}

function collectArticles() {
  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name))
    .map(entry => {
      const folderPath = path.join(rootDir, entry.name);
      const htmlFile = findHtmlFile(folderPath);

      if (!htmlFile) {
        return null;
      }

      return {
        title: entry.name,
        category: getCategory(entry.name),
        href: toUrlPath(entry.name, htmlFile),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN', { numeric: true }));
}

function buildCategoryFilters(articles) {
  const counts = new Map();

  for (const article of articles) {
    counts.set(article.category, (counts.get(article.category) || 0) + 1);
  }

  const categories = Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN', { numeric: true }));

  const buttons = [
    `<button class="filter-button is-active" type="button" data-category="all">全部 <span>${articles.length}</span></button>`,
    ...categories.map(([category, count]) => (
      `<button class="filter-button" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)} <span>${count}</span></button>`
    )),
  ];

  return buttons.join('\n          ');
}

function buildArticleList(articles) {
  return articles.map((article, index) => `
          <li class="article-card" data-title="${escapeHtml(article.title)}" data-category="${escapeHtml(article.category)}">
            <a href="${escapeHtml(article.href)}">
              <span class="article-number">${String(index + 1).padStart(3, '0')}</span>
              <span class="article-main">
                <span class="article-title">${escapeHtml(article.title)}</span>
                <span class="article-meta">${escapeHtml(article.category)}</span>
              </span>
              <span class="article-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </a>
          </li>`).join('');
}

function renderHtml(articles) {
  const categories = new Set(articles.map(article => article.category));

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="柯哀与名柯文章归档索引">
  <script defer src="https://a.loli.za.org/script.js" data-website-id="13c0284e-a2e7-496d-8533-477dc7a1fcd0"></script>
  <title>CoAiBackup 文章索引</title>
  <script>
    (() => {
      const savedTheme = localStorage.getItem('coaibackup-theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        document.documentElement.dataset.theme = savedTheme;
      }
    })();
  </script>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f3ef;
      --bg-soft: #efe8df;
      --surface: #ffffff;
      --surface-raised: rgba(255, 255, 255, 0.88);
      --surface-muted: #f1ece5;
      --text: #211f1d;
      --muted: #6e655e;
      --line: #ded5ca;
      --line-strong: #c9baad;
      --accent: #b2342b;
      --accent-strong: #84231f;
      --accent-soft: #fff2ef;
      --blue: #225e76;
      --blue-soft: #e9f2f5;
      --shadow: 0 18px 50px rgba(41, 32, 25, 0.12);
      --toolbar-bg: rgba(246, 243, 239, 0.92);
      --footer-bg: #211f1d;
      --footer-text: #e7dfd6;
      --footer-link: #ffd4c7;
    }

    :root[data-theme="dark"] {
      color-scheme: dark;
      --bg: #141312;
      --bg-soft: #1b1917;
      --surface: #201e1c;
      --surface-raised: rgba(37, 34, 31, 0.88);
      --surface-muted: #2a2623;
      --text: #f0ebe5;
      --muted: #b7aca2;
      --line: #3b352f;
      --line-strong: #5b5047;
      --accent: #ff8a78;
      --accent-strong: #ffb1a5;
      --accent-soft: #3a211e;
      --blue: #7cc7df;
      --blue-soft: #1d3138;
      --shadow: 0 20px 54px rgba(0, 0, 0, 0.38);
      --toolbar-bg: rgba(20, 19, 18, 0.90);
      --footer-bg: #0f0e0d;
      --footer-text: #d8d0c8;
      --footer-link: #ffb1a5;
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        color-scheme: dark;
        --bg: #141312;
        --bg-soft: #1b1917;
        --surface: #201e1c;
        --surface-raised: rgba(37, 34, 31, 0.88);
        --surface-muted: #2a2623;
        --text: #f0ebe5;
        --muted: #b7aca2;
        --line: #3b352f;
        --line-strong: #5b5047;
        --accent: #ff8a78;
        --accent-strong: #ffb1a5;
        --accent-soft: #3a211e;
        --blue: #7cc7df;
        --blue-soft: #1d3138;
        --shadow: 0 20px 54px rgba(0, 0, 0, 0.38);
        --toolbar-bg: rgba(20, 19, 18, 0.90);
        --footer-bg: #0f0e0d;
        --footer-text: #d8d0c8;
        --footer-link: #ffb1a5;
      }
    }

    * {
      box-sizing: border-box;
    }

    html {
      background: var(--bg);
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background:
        linear-gradient(180deg, rgba(178, 52, 43, 0.10), rgba(34, 94, 118, 0.08) 360px, transparent 680px),
        radial-gradient(circle at 50% -220px, rgba(255, 255, 255, 0.36), transparent 430px),
        var(--bg);
      color: var(--text);
      font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", Arial, sans-serif;
      line-height: 1.6;
      transition: background-color 180ms ease, color 180ms ease;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    button,
    input {
      font: inherit;
    }

    .site-header {
      padding: 28px 20px 26px;
      border-bottom: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
    }

    .header-inner,
    .page-shell {
      width: min(1200px, calc(100% - 40px));
      margin: 0 auto;
    }

    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 34px;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--accent-strong);
      font-size: 0.95rem;
      font-weight: 800;
    }

    .brand-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .theme-toggle,
    .density-button,
    .filter-button {
      min-height: 38px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface-raised);
      color: var(--muted);
      cursor: pointer;
      transition: background 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease;
    }

    .theme-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
    }

    .theme-toggle:hover,
    .density-button:hover,
    .filter-button:hover {
      border-color: color-mix(in srgb, var(--accent) 46%, var(--line));
      color: var(--accent-strong);
      transform: translateY(-1px);
    }

    .theme-toggle svg {
      width: 18px;
      height: 18px;
    }

    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
      gap: 34px;
      align-items: end;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: var(--blue);
      font-size: 0.88rem;
      font-weight: 800;
      letter-spacing: 0;
    }

    h1 {
      max-width: 720px;
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 1.12;
      letter-spacing: 0;
    }

    .header-copy {
      max-width: 680px;
      margin: 16px 0 0;
      color: var(--muted);
      font-size: 1.02rem;
    }

    .stats {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .stat {
      min-height: 78px;
      padding: 14px 16px;
      background: var(--surface-raised);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 12px 34px rgba(41, 32, 25, 0.06);
    }

    .stat-value {
      display: block;
      color: var(--accent-strong);
      font-size: 1.5rem;
      font-weight: 850;
      line-height: 1.12;
    }

    .stat-label {
      display: block;
      margin-top: 5px;
      color: var(--muted);
      font-size: 0.86rem;
    }

    main {
      flex: 1;
      padding: 28px 0 44px;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 3;
      padding: 14px;
      margin-bottom: 18px;
      background: var(--toolbar-bg);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(41, 32, 25, 0.08);
      backdrop-filter: blur(14px);
    }

    .search-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 12px;
      align-items: center;
    }

    .search-box {
      position: relative;
      min-width: 0;
    }

    .search-box svg {
      position: absolute;
      left: 15px;
      top: 50%;
      width: 18px;
      height: 18px;
      transform: translateY(-50%);
      color: var(--muted);
      pointer-events: none;
    }

    #searchInput {
      width: 100%;
      height: 48px;
      padding: 0 16px 0 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      outline: none;
    }

    #searchInput::placeholder {
      color: color-mix(in srgb, var(--muted) 78%, transparent);
    }

    #searchInput:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
    }

    .result-count {
      min-width: 86px;
      color: var(--muted);
      font-size: 0.92rem;
      font-variant-numeric: tabular-nums;
      text-align: right;
      white-space: nowrap;
    }

    .density-control {
      display: inline-grid;
      grid-template-columns: repeat(2, auto);
      gap: 6px;
      padding: 4px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface-muted);
    }

    .density-button {
      min-height: 32px;
      padding: 4px 10px;
      border-color: transparent;
      background: transparent;
      font-size: 0.86rem;
    }

    .density-button.is-active {
      background: var(--surface);
      color: var(--accent-strong);
      box-shadow: 0 5px 16px rgba(41, 32, 25, 0.08);
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .filter-button {
      padding: 6px 12px;
      font-size: 0.9rem;
    }

    .filter-button.is-active {
      border-color: color-mix(in srgb, var(--accent) 44%, var(--line));
      background: var(--accent-soft);
      color: var(--accent-strong);
    }

    .filter-button span {
      color: var(--blue);
      font-weight: 800;
    }

    .article-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 12px;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .article-card {
      min-height: 98px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 8px 22px rgba(41, 32, 25, 0.06);
      transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
    }

    .article-card:hover {
      border-color: color-mix(in srgb, var(--accent) 42%, var(--line));
      box-shadow: var(--shadow);
      transform: translateY(-2px);
    }

    .article-card.is-hidden {
      display: none;
    }

    .article-card a {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 13px;
      align-items: center;
      min-height: 98px;
      padding: 16px;
    }

    .article-number {
      width: 46px;
      color: var(--accent);
      font-size: 0.82rem;
      font-weight: 850;
      font-variant-numeric: tabular-nums;
    }

    .article-main {
      min-width: 0;
    }

    .article-title {
      display: -webkit-box;
      overflow: hidden;
      color: var(--text);
      font-size: 0.98rem;
      font-weight: 750;
      line-height: 1.45;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .article-meta {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 8px;
      margin-top: 8px;
      border-radius: 999px;
      background: var(--blue-soft);
      color: var(--blue);
      font-size: 0.8rem;
      font-weight: 700;
    }

    .article-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--surface-muted);
      color: var(--blue);
    }

    .article-arrow svg {
      width: 18px;
      height: 18px;
    }

    :root[data-density="compact"] .article-list {
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 9px;
    }

    :root[data-density="compact"] .article-card,
    :root[data-density="compact"] .article-card a {
      min-height: 76px;
    }

    :root[data-density="compact"] .article-card a {
      padding: 12px;
    }

    :root[data-density="compact"] .article-title {
      font-size: 0.92rem;
      -webkit-line-clamp: 1;
    }

    :root[data-density="compact"] .article-meta,
    :root[data-density="compact"] .article-arrow {
      display: none;
    }

    .empty-state {
      display: none;
      padding: 42px 18px;
      margin-top: 14px;
      border: 1px dashed var(--line-strong);
      border-radius: 8px;
      background: color-mix(in srgb, var(--surface) 72%, transparent);
      color: var(--muted);
      text-align: center;
    }

    .empty-state.is-visible {
      display: block;
    }

    .site-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 4px;
      padding: 24px 20px;
      border-top: 1px solid var(--line);
      background: var(--footer-bg);
      color: var(--footer-text);
      text-align: center;
    }

    .site-footer a {
      color: var(--footer-link);
      font-weight: 800;
    }

    .footer-separator {
      color: color-mix(in srgb, var(--footer-text) 56%, transparent);
    }

    @media (min-width: 1180px) {
      .article-list {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      :root[data-density="compact"] .article-list {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    @media (max-width: 860px) {
      .site-header {
        padding-top: 22px;
      }

      .header-inner,
      .page-shell {
        width: min(100% - 28px, 1200px);
      }

      .header-top {
        margin-bottom: 24px;
      }

      .hero-grid {
        grid-template-columns: 1fr;
        gap: 22px;
      }

      .stats {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .stat {
        min-height: 74px;
        padding: 12px;
      }

      .search-row {
        grid-template-columns: 1fr auto;
      }

      .density-control {
        display: none;
      }
    }

    @media (max-width: 640px) {
      body {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent 360px),
          var(--bg);
      }

      .theme-toggle span {
        display: none;
      }

      .theme-toggle {
        width: 42px;
        justify-content: center;
        padding-inline: 0;
      }

      h1 {
        font-size: 1.8rem;
      }

      .header-copy {
        font-size: 0.96rem;
      }

      .stats {
        grid-template-columns: 1fr;
      }

      main {
        padding-top: 18px;
      }

      .toolbar {
        position: static;
        padding: 12px;
      }

      .search-row {
        grid-template-columns: 1fr;
      }

      .result-count {
        min-width: 0;
        text-align: left;
      }

      .filters {
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: thin;
      }

      .filter-button {
        flex: 0 0 auto;
      }

      .site-footer {
        flex-direction: column;
        gap: 2px;
      }

      .footer-separator {
        display: none;
      }

      .article-list,
      :root[data-density="compact"] .article-list {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .article-card,
      .article-card a,
      :root[data-density="compact"] .article-card,
      :root[data-density="compact"] .article-card a {
        min-height: 86px;
      }

      .article-card a,
      :root[data-density="compact"] .article-card a {
        grid-template-columns: minmax(0, 1fr) auto;
        padding: 14px;
      }

      .article-number {
        display: none;
      }

      .article-title,
      :root[data-density="compact"] .article-title {
        font-size: 0.95rem;
        -webkit-line-clamp: 2;
      }

      :root[data-density="compact"] .article-meta,
      :root[data-density="compact"] .article-arrow {
        display: inline-flex;
      }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="header-top">
        <div class="brand-mark">
          <span class="brand-dot" aria-hidden="true"></span>
          <span>CoAiBackup</span>
        </div>
        <button class="theme-toggle" type="button" id="themeToggle" aria-label="切换明暗主题">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path class="theme-icon-sun" d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path class="theme-icon-moon" d="M20 14.6A7.6 7.6 0 0 1 9.4 4 8.2 8.2 0 1 0 20 14.6Z" fill="currentColor"/>
          </svg>
          <span id="themeLabel">深色</span>
        </button>
      </div>

      <div class="hero-grid">
        <div>
          <p class="eyebrow">柯哀与名柯文章备份</p>
          <h1>文章归档索引</h1>
          <p class="header-copy">稳定保存的本地静态目录，按文章标题和分类快速定位。</p>
        </div>
        <div class="stats" aria-label="站点统计">
          <div class="stat">
            <span class="stat-value">${articles.length}</span>
            <span class="stat-label">篇文章</span>
          </div>
          <div class="stat">
            <span class="stat-value">${categories.size}</span>
            <span class="stat-label">个分类</span>
          </div>
          <div class="stat">
            <span class="stat-value">HTML</span>
            <span class="stat-label">静态备份</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main>
    <div class="page-shell">
      <section class="toolbar" aria-label="文章筛选">
        <div class="search-row">
          <label class="search-box" for="searchInput">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M9.8 3.2a6.6 6.6 0 0 1 5.2 10.7l4.1 4.1a1.1 1.1 0 0 1-1.6 1.6l-4.1-4.1A6.6 6.6 0 1 1 9.8 3.2Zm0 2.2a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Z"/>
            </svg>
            <input type="search" id="searchInput" autocomplete="off" placeholder="搜索标题、分类或关键词">
          </label>
          <div class="result-count" id="resultCount">${articles.length} 篇</div>
          <div class="density-control" aria-label="视图密度">
            <button class="density-button is-active" type="button" data-density="comfortable">舒适</button>
            <button class="density-button" type="button" data-density="compact">紧凑</button>
          </div>
        </div>
        <div class="filters" id="filters" aria-label="分类">
          ${buildCategoryFilters(articles)}
        </div>
      </section>

      <ul class="article-list" id="indexList">
${buildArticleList(articles)}
      </ul>
      <div class="empty-state" id="emptyState">没有找到匹配的文章。</div>
    </div>
  </main>

  <footer class="site-footer">
    <span>联系方式：<a href="mailto:tomiyasu@duck.com">tomiyasu@duck.com</a></span>
    <span class="footer-separator" aria-hidden="true"> · </span>
    <span>Powered by <a href="https://loli.ie" target="_blank" rel="noopener">loli.ie</a></span>
  </footer>

  <script>
    (() => {
      const root = document.documentElement;
      const searchInput = document.getElementById('searchInput');
      const resultCount = document.getElementById('resultCount');
      const emptyState = document.getElementById('emptyState');
      const themeToggle = document.getElementById('themeToggle');
      const themeLabel = document.getElementById('themeLabel');
      const densityButtons = Array.from(document.querySelectorAll('.density-button'));
      const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
      const items = Array.from(document.querySelectorAll('.article-card')).map(item => ({
        node: item,
        category: item.dataset.category,
        searchable: \`\${item.dataset.title} \${item.dataset.category}\`.toLowerCase(),
      }));

      const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
      let activeCategory = 'all';

      function currentTheme() {
        return root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
      }

      function syncThemeButton() {
        const isDark = currentTheme() === 'dark';
        themeLabel.textContent = isDark ? '浅色' : '深色';
        themeToggle.setAttribute('aria-pressed', String(isDark));
      }

      function setTheme(theme) {
        root.dataset.theme = theme;
        localStorage.setItem('coaibackup-theme', theme);
        syncThemeButton();
      }

      function setDensity(density) {
        root.dataset.density = density === 'compact' ? 'compact' : 'comfortable';
        localStorage.setItem('coaibackup-density', root.dataset.density);
        for (const button of densityButtons) {
          button.classList.toggle('is-active', button.dataset.density === root.dataset.density);
        }
      }

      function updateList() {
        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        for (const item of items) {
          const categoryMatches = activeCategory === 'all' || item.category === activeCategory;
          const searchMatches = !query || item.searchable.includes(query);
          const isVisible = categoryMatches && searchMatches;

          item.node.classList.toggle('is-hidden', !isVisible);
          if (isVisible) {
            visibleCount += 1;
          }
        }

        resultCount.textContent = \`\${visibleCount} 篇\`;
        emptyState.classList.toggle('is-visible', visibleCount === 0);
      }

      themeToggle.addEventListener('click', () => {
        setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
      });

      systemDark.addEventListener('change', () => {
        if (!root.dataset.theme) {
          syncThemeButton();
        }
      });

      searchInput.addEventListener('input', updateList);

      for (const button of densityButtons) {
        button.addEventListener('click', () => setDensity(button.dataset.density));
      }

      for (const button of filterButtons) {
        button.addEventListener('click', () => {
          activeCategory = button.dataset.category;
          for (const current of filterButtons) {
            current.classList.toggle('is-active', current === button);
          }
          updateList();
        });
      }

      setDensity(localStorage.getItem('coaibackup-density') || 'comfortable');
      syncThemeButton();
    })();
  </script>
</body>
</html>
`;
}

const articles = collectArticles();
fs.writeFileSync(outputFile, renderHtml(articles), 'utf8');
console.log(`Generated ${path.relative(process.cwd(), outputFile)} with ${articles.length} articles.`);
