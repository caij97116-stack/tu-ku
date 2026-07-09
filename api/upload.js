export const config = {
  api: {
    bodyParser: { sizeLimit: '50mb' },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
  }

  try {
    let body = req.body;

    const { file, fileName, fileType, owner, repo, branch, path } = body || {};

    if (!file || !fileName || !owner || !repo) {
      return res.status(400).json({
        error: 'Missing required fields',
        debug: {
          hasFile: !!file,
          hasFileName: !!fileName,
          hasOwner: !!owner,
          hasRepo: !!repo,
          owner,
          repo,
          fileLength: file ? file.length : 0,
        },
      });
    }

    const branchName = branch || 'main';
    const subPath = (path || 'uploads/').replace(/\/$/, '');
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${safeName}`;
    const filePath = `${subPath}/${uniqueName}`;

    const ghRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(filePath)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'UpGo',
        },
        body: JSON.stringify({
          message: `Upload ${fileName} via UpGo`,
          content: file,
          branch: branchName,
        }),
      }
    );

    if (!ghRes.ok) {
      const errData = await ghRes.json().catch(() => ({}));
      return res.status(ghRes.status).json({
        error: errData.message || `GitHub API error ${ghRes.status}`,
        debug: { owner, repo, branch: branchName, targetPath: filePath },
      });
    }

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/${filePath}`;
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branchName}/${filePath}`;

    return res.status(200).json({ rawUrl, cdnUrl, filePath, fileName, fileType: fileType || 'unknown' });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}