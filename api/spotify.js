// Vercel function: returns the track playing now, or the last one played.
// The credentials live in Vercel environment variables (SPOTIFY_CLIENT_ID,
// SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN); the page never sees them.

const API = "https://api.spotify.com/v1/me/player";

async function accessToken() {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env;
  if (!id || !secret || !refresh) return null;

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  if (!r.ok) return null;
  return (await r.json()).access_token;
}

const shape = (track, playing) => ({
  playing,
  title: track.name,
  artist: track.artists.map((a) => a.name).join(", "),
  url: track.external_urls?.spotify ?? null,
});

module.exports = async (req, res) => {
  try {
    const token = await accessToken();
    if (!token) return res.status(501).json({ error: "Spotify not configured" });
    const headers = { Authorization: `Bearer ${token}` };

    // Spotify answers 204 with no body when nothing is playing
    const now = await fetch(`${API}/currently-playing`, { headers });
    if (now.status === 200) {
      const data = await now.json();
      if (data.is_playing && data.item?.type === "track") {
        res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
        return res.status(200).json(shape(data.item, true));
      }
    }

    const recent = await fetch(`${API}/recently-played?limit=1`, { headers });
    if (!recent.ok) return res.status(502).json({ error: "Spotify request failed" });
    const track = (await recent.json()).items?.[0]?.track;

    // A longer cache is fine here: the last played track changes less often than the live one
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(track ? shape(track, false) : { title: null });
  } catch {
    return res.status(502).json({ error: "Spotify request failed" });
  }
};
