const fs = require('fs');
const path = require('path');

// 读取当前目录下的所有文件夹
const directoryPath = process.env.GITHUB_WORKSPACE;

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // 过滤出所有以"柯"开头的文件夹
  const folders = files.filter(file => {
    return fs.statSync(path.join(directoryPath, file)).isDirectory() && file.startsWith('柯');
  });

  // 构建 HTML 列表
  const htmlList = folders.map(folder => {
    // 读取文件夹内的所有文件
    const folderPath = path.join(directoryPath, folder);
    const filesInFolder = fs.readdirSync(folderPath);
    // 查找以 .html 结尾的文件作为 HTML 文件
    const htmlFile = filesInFolder.find(file => file.endsWith('.html'));
    // 如果存在 HTML 文件，则生成对应的列表项
    if (htmlFile) {
      return `<li><a href="./${folder}/${htmlFile}">${folder}</a></li>`;
    }
    return '';
  }).join('\n');

  // 生成 HTML 文件内容
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Index</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        h1 {
          text-align: center;
          padding: 25px 0;
          background: linear-gradient(135deg, #6e8efb, #a777e3);
          color: #fff;
          margin: 0;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .container {
          max-width: 800px;
          margin: 30px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
          flex: 1;
        }
        ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        li {
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
          transition: all 0.3s ease;
        }
        li:hover {
          background-color: #f8f9fa;
          transform: translateX(5px);
        }
        li:last-child {
          border-bottom: none;
        }
        a {
          color: #444;
          text-decoration: none;
          display: block;
          font-size: 16px;
        }
        a:hover {
          color: #6e8efb;
        }
        input[type="text"] {
          width: 100%;
          padding: 12px 15px;
          margin-bottom: 20px;
          border: 2px solid #eee;
          border-radius: 8px;
          box-sizing: border-box;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        input[type="text"]:focus {
          outline: none;
          border-color: #6e8efb;
          box-shadow: 0 0 5px rgba(110,142,251,0.2);
        }
        .footer {
          text-align: center;
          padding: 20px;
          background-color: #333;
          color: #fff;
          font-size: 14px;
        }
        .footer a {
          color: #6e8efb;
          display: inline;
        }
      </style>
    </head>
    <body>
      <h1>Index</h1>
      <div class="container">
        <input type="text" id="searchInput" placeholder="输入关键词搜索...">
        <ul id="indexList">${htmlList}</ul>
      </div>
      <div class="footer">
        Powered by <a href="https://loli.ie" target="_blank">loli.ie</a>
      </div>

      <script>
        const searchInput = document.getElementById('searchInput');
        const indexList = document.getElementById('indexList');

        searchInput.addEventListener('input', function() {
          const searchValue = this.value.trim().toLowerCase();
          const items = indexList.getElementsByTagName('li');
          Array.from(items).forEach(item => {
            const text = item.textContent.toLowerCase();
            const match = text.includes(searchValue);
            item.style.display = match ? 'block' : 'none';
          });
        });
      </script>
    </body>
    </html>
  `;

  // 将生成的 HTML 内容写入主页文件
  fs.writeFileSync('index.html', htmlContent);

  console.log('Index.html file generated successfully.');
});
