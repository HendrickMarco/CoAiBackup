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
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f2f2f2;
        }
        h1 {
          text-align: center;
          padding: 20px 0;
          background-color: #333;
          color: #fff;
          margin: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 10px;
          background-color: #fff;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        li {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        li:last-child {
          border-bottom: none;
        }
        a {
          color: #333;
          text-decoration: none;
        }
        a:hover {
          color: #000;
          text-decoration: underline;
        }
        input[type="text"] {
          width: 100%;
          padding: 10px;
          margin-bottom: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          box-sizing: border-box;
        }
      </style>
    </head>
    <body>
      <h1>Index</h1>
      <div class="container">
        <input type="text" id="searchInput" placeholder="Search...">
        <ul id="indexList">${htmlList}</ul>
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
