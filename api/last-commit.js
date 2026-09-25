// Función de Vercel: devuelve solo la hora del último push de aramis2009,
// incluyendo repos privados. Usa un token guardado como variable de entorno
// en Vercel (GITHUB_TOKEN); nunca se expone en la página ni en el repo.

const USER = "aramis2009";

module.exports = async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(501).json({ error: "GITHUB_TOKEN not configured" });

  try {
    // Autenticado como el propio usuario, GitHub incluye los eventos privados
    const r = await fetch(`https://api.github.com/users/${USER}/events?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "aramis-web",
      },
    });
    if (!r.ok) return res.status(502).json({ error: "GitHub request failed" });

    const events = await r.json();
    const last = events
      .filter((e) => e.type === "PushEvent")
      .map((e) => e.created_at)
      .sort()
      .pop();

    // Cache de 5 minutos en Vercel para no gastar el límite de GitHub
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ lastCommit: last ?? null });
  } catch {
    return res.status(502).json({ error: "GitHub request failed" });
  }
};
