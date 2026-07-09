export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = (process.env as any).GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: '服务端未配置 GITHUB_TOKEN 环境变量' });
  }

  const { owner, repo, branch, path } = req.query as Record<string, string>;

  if (!owner || !repo) {
    return res.status(400).json({ error: '缺少必要参数: owner, repo' });
  }

  const branchName = branch || 'main';
  const subPath = (path || 'uploads/').replace(/\/$/, '');
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${subPath}?ref=${branchName}`;

  try {
    if (req.method === 'GET') {
      const ghRes = await fetch(apiBase, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'UpGo-Vercel',
        },
      });

      if (!ghRes.ok) {
        const errData = await ghRes.json().catch(() => ({}));
        const msg = (errData as any).message || `GitHub API 错误 (${ghRes.status})`;
        return res.status(ghRes.status).json({ error: msg });
      }

      const contents = await ghRes.json() as Array<any>;
      const files = contents
        .filter((item: any) => item.type === 'file')
        .map((item: any) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/${item.path}`,
          cdnUrl: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branchName}/${item.path}`,
        }));

      return res.status(200).json(files);
    }

    if (req.method === 'DELETE') {
      const { filePath, sha } = req.body as { filePath: string; sha: string };

      if (!filePath || !sha) {
        return res.status(400).json({ error: '缺少必要参数: filePath, sha' });
      }

      const ghRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(filePath)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'UpGo-Vercel',
          },
          body: JSON.stringify({
            message: `Delete ${filePath} via UpGo`,
            sha: sha,
            branch: branchName,
          }),
        }
      );

      if (!ghRes.ok) {
        const errData = await ghRes.json().catch(() => ({}));
        const msg = (errData as any).message || `删除失败 (${ghRes.status})`;
        return res.status(ghRes.status).json({ error: msg });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: '不支持的请求方法' });
  } catch (err) {
    console.error('Files API error:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}