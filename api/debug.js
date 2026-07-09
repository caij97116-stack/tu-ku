export default async function handler(req, res) {
  if (req.method === 'POST') {
    return res.status(200).json({
      bodyReceived: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodySize: JSON.stringify(req.body || {}).length,
      hasFile: !!(req.body && req.body.file),
      hasOwner: !!(req.body && req.body.owner),
      hasRepo: !!(req.body && req.body.repo),
      owner: req.body?.owner || 'not set',
      repo: req.body?.repo || 'not set',
      branch: req.body?.branch || 'not set',
      path: req.body?.path || 'not set',
      fileName: req.body?.fileName || 'not set',
      fileLength: req.body?.file ? req.body.file.length : 0,
    });
  }
  return res.status(200).json({ message: 'Send a POST with your upload config' });
}