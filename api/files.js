export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
  }

  const { owner, repo, branch, path } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({ error: 'Missing owner or repo' });
  }

  const branchName = branch || 'main';
  const subPath = (path || 'uploads/').replace(/\/$/, '');
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${subPath}?ref=${branchName}`;

  try {
    if (req.method === 'GET') {
      const ghRes = await fetch(apiBase, {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'UpGo' },
      });

      if (!ghRes.ok) {
        const errData = await ghRes.json().catch(() => ({}));
        return res.status(ghRes.status).json({ error: errData.message || `GitHub API error ${ghRes.status}` });
      }

      const contents = await ghRes.json();
      const files = contents
        .filter((item) => item.type === 'file')
        .map((item) => ({
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
      const { filePath, sha } = req.body;

      if (!filePath || !sha) {
        return res.status(400).json({ error: 'Missing filePath or sha' });
      }

      const ghRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(filePath)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'UpGo',
          },
          body: JSON.stringify({ message: `Delete ${filePath} via UpGo`, sha, branch: branchName }),
        }
      );

      if (!ghRes.ok) {
        const errData = await ghRes.json().catch(() => ({}));
        return res.status(ghRes.status).json({ error: errData.message || `Delete failed ${ghRes.status}` });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Files API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}