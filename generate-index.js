const fs = require('fs');
const path = require('path');

const rootDir = process.env.GITHUB_WORKSPACE || process.cwd();
const outputFile = path.join(rootDir, 'index.html');

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.github',
  '.vscode',
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
              <span class="article-arrow" aria-hidden="true">›</span>
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
  <title>CoAiBackup 文章索引</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f3ef;
      --surface: #ffffff;
      --surface-muted: #f0ece5;
      --text: #24211f;
      --muted: #6d655e;
      --line: #ded7cf;
      --accent: #b2342b;
      --accent-strong: #84231f;
      --blue: #225e76;
      --shadow: 0 18px 50px rgba(41, 32, 25, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background:
        linear-gradient(180deg, rgba(178, 52, 43, 0.10), rgba(34, 94, 118, 0.06) 340px, transparent 620px),
        var(--bg);
      color: var(--text);
      font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", Arial, sans-serif;
      line-height: 1.6;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .site-header {
      padding: 44px 20px 24px;
      border-bottom: 1px solid rgba(132, 35, 31, 0.14);
    }

    .header-inner,
    .page-shell {
      width: min(1120px, calc(100% - 40px));
      margin: 0 auto;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: var(--accent-strong);
      font-size: 0.88rem;
      font-weight: 700;
      letter-spacing: 0;
    }

    h1 {
      margin: 0;
      font-size: 2.15rem;
      line-height: 1.2;
      letter-spacing: 0;
    }

    .header-copy {
      max-width: 720px;
      margin: 12px 0 0;
      color: var(--muted);
      font-size: 1rem;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 26px;
      max-width: 680px;
    }

    .stat {
      min-height: 82px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.68);
      border: 1px solid rgba(132, 35, 31, 0.13);
      border-radius: 8px;
    }

    .stat-value {
      display: block;
      color: var(--accent-strong);
      font-size: 1.55rem;
      font-weight: 800;
      line-height: 1.15;
    }

    .stat-label {
      display: block;
      margin-top: 5px;
      color: var(--muted);
      font-size: 0.86rem;
    }

    main {
      flex: 1;
      padding: 28px 0 42px;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 3;
      padding: 14px;
      margin-bottom: 18px;
      background: rgba(246, 243, 239, 0.92);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(41, 32, 25, 0.08);
      backdrop-filter: blur(12px);
    }

    .search-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: center;
    }

    .search-box {
      position: relative;
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
      height: 46px;
      padding: 0 16px 0 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font: inherit;
      outline: none;
    }

    #searchInput:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(178, 52, 43, 0.14);
    }

    .result-count {
      min-width: 96px;
      color: var(--muted);
      font-size: 0.92rem;
      text-align: right;
      white-space: nowrap;
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .filter-button {
      min-height: 34px;
      padding: 6px 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface);
      color: var(--muted);
      font: inherit;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .filter-button:hover,
    .filter-button.is-active {
      border-color: rgba(178, 52, 43, 0.38);
      background: #fff5f2;
      color: var(--accent-strong);
    }

    .filter-button span {
      color: var(--blue);
      font-weight: 700;
    }

    .article-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 12px;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .article-card {
      min-height: 92px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 8px 22px rgba(41, 32, 25, 0.06);
      transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
    }

    .article-card:hover {
      border-color: rgba(178, 52, 43, 0.36);
      box-shadow: var(--shadow);
      transform: translateY(-2px);
    }

    .article-card.is-hidden {
      display: none;
    }

    .article-card a {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
      min-height: 92px;
      padding: 15px;
    }

    .article-number {
      width: 46px;
      color: var(--accent);
      font-size: 0.82rem;
      font-weight: 800;
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
      font-weight: 700;
      line-height: 1.45;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .article-meta {
      display: inline-block;
      margin-top: 6px;
      color: var(--muted);
      font-size: 0.82rem;
    }

    .article-arrow {
      color: var(--blue);
      font-size: 1.45rem;
      line-height: 1;
    }

    .empty-state {
      display: none;
      padding: 42px 18px;
      margin-top: 14px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.62);
      color: var(--muted);
      text-align: center;
    }

    .empty-state.is-visible {
      display: block;
    }

    .site-footer {
      padding: 24px 20px;
      border-top: 1px solid var(--line);
      background: #211f1d;
      color: #e7dfd6;
      text-align: center;
    }

    .site-footer a {
      color: #ffd4c7;
      font-weight: 700;
    }

    @media (max-width: 720px) {
      .site-header {
        padding-top: 30px;
      }

      .header-inner,
      .page-shell {
        width: min(100% - 28px, 1120px);
      }

      h1 {
        font-size: 1.65rem;
      }

      .stats,
      .search-row {
        grid-template-columns: 1fr;
      }

      .result-count {
        text-align: left;
      }

      .toolbar {
        position: static;
      }

      .article-list {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <p class="eyebrow">CoAiBackup</p>
      <h1>文章归档索引</h1>
      <p class="header-copy">按目录自动生成的静态索引，支持关键词搜索和分类筛选。</p>
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
          <span class="stat-value">本地</span>
          <span class="stat-label">静态归档</span>
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
    联系方式：<a href="mailto:tomiyasu@duck.com">tomiyasu@duck.com</a>
  </footer>

  <script>
    (() => {
      const searchInput = document.getElementById('searchInput');
      const resultCount = document.getElementById('resultCount');
      const emptyState = document.getElementById('emptyState');
      const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
      const items = Array.from(document.querySelectorAll('.article-card')).map(item => ({
        node: item,
        title: item.dataset.title.toLowerCase(),
        category: item.dataset.category,
        searchable: \`\${item.dataset.title} \${item.dataset.category}\`.toLowerCase(),
      }));

      let activeCategory = 'all';

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

      searchInput.addEventListener('input', updateList);

      for (const button of filterButtons) {
        button.addEventListener('click', () => {
          activeCategory = button.dataset.category;
          for (const current of filterButtons) {
            current.classList.toggle('is-active', current === button);
          }
          updateList();
        });
      }
    })();
  </script>
</body>
</html>
`;
}

const articles = collectArticles();
fs.writeFileSync(outputFile, renderHtml(articles), 'utf8');
console.log(`Generated ${path.relative(process.cwd(), outputFile)} with ${articles.length} articles.`);
