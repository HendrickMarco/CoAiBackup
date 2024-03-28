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
    </head>
    <body>
      <h1>Index</h1>
      <ul>${htmlList}</ul>
    </body>
    </html>
  `;

  // 将生成的 HTML 内容写入主页文件
  fs.writeFileSync('index.html', htmlContent);

  console.log('Index.html file generated successfully.');
});
