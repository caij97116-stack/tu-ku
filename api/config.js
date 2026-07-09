export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    configured: !!process.env.GITHUB_TOKEN,
    message: process.env.GITHUB_TOKEN
      ? 'Vercel 后端已配置，Token 已就绪'
      : '未配置 GITHUB_TOKEN 环境变量，请在 Vercel 项目设置中添加',
  });
}