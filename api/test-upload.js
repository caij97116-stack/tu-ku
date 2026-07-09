export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'No token' });
  }

  try {
    const filePath = `uploads/test-${Date.now()}.txt`;

    const ghRes = await fetch(
      `https://api.github.com/repos/caij97116-stack/tu-ku/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'UpGo',
        },
        body: JSON.stringify({
          message: 'Test upload from Vercel',
          content: 'aGVsbG8gZnJvbSB2ZXJjZWw=',
          branch: 'main',
        }),
      }
    );

    const data = await ghRes.json();
    return res.status(ghRes.status).json({
      status: ghRes.status,
      ok: ghRes.ok,
      data: ghRes.ok ? { path: data.content?.path } : data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}