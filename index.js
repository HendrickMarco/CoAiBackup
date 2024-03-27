// pages/index.js
import fs from 'fs';
import path from 'path';
import util from 'util';
import Link from 'next/link';
// 递归函数，用于获取所有HTML文件
const getHtmlFiles = async (dir, fileList = []) => {
  const files = await util.promisify(fs.readdir)(dir);
  for (const file of files) {
    const stat = await util.promisify(fs.stat)(path.join(dir, file));
    if (stat.isDirectory()) {
      // 如果是文件夹，则递归调用
      await getHtmlFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.html')) {
      // 如果是HTML文件，则加入列表
      fileList.push(path.join(dir.replace(path.join(process.cwd(), 'posts'), ''), file));
    }
  }
  return fileList;
};
export default function Home({ htmlFiles }) {
  return (
    <div>
      <h1>首页</h1>
      {htmlFiles.map((file, index) => (
        <div key={index}>
          <Link href={`/${file.replace('.html', '')}`}>
            <a>{file}</a>
          </Link>
        </div>
      ))}
    </div>
  );
}
export async function getStaticProps() {
  // 从 'posts' 文件夹开始搜索HTML文件
  const postsDirectory = path.join(process.cwd(), 'posts'); 
  const htmlFiles = await getHtmlFiles(postsDirectory);
  return {
    props: {
      htmlFiles,
    },
  };
}
