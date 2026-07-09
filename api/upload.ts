import type { VercelRequest, VercelResponse } from '@vercel/node';

// Increase body size limit for file uploads (Vercel default is 4.5MB, max 50MB for Pro)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: '服务端未配置 GITHUB_TOKEN 环境变量' });
  }

  try {
    const { file, fileName, fileType, owner, repo, branch, path } = req.body;

    // Validate required fields
    if (!file || !fileName || !owner || !repo) {
      return res.status(400).json({ error: '缺少必要参数: file, fileName, owner, repo' });
    }

    const branchName = branch || 'main';
    const subPath = (path || 'uploads/').replace(/\/$/, '');
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${safeName}`;
    const filePath = `${subPath}/${uniqueName}`;

    // Push to GitHub Contents API
    const githubResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(filePath)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'UpGo-Vercel',
        },
        body: JSON.stringify({
          message: `Upload ${fileName} via UpGo`,
          content: file, // base64 string (without data: prefix)
          branch: branchName,
        }),
      }
    );

    if (!githubResponse.ok) {
      const errData = await githubResponse.json().catch(() => ({}));
      const msg = (errData as { message?: string }).message || `GitHub API 返回错误 (HTTP ${githubResponse.status})`;
      return res.status(githubResponse.status).json({ error: msg });
    }

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/${filePath}`;
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branchName}/${filePath}`;

    return res.status(200).json({
      rawUrl,
      cdnUrl,
      filePath,
      fileName,
      fileType: fileType || 'unknown',
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}