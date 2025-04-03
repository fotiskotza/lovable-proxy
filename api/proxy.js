export default async function handler(req, res) {
  const { address, lat, lng } = req.query;

  const query = address
    ? `address=${encodeURIComponent(address)}`
    : lat && lng
    ? `lat=${lat}&lng=${lng}`
    : null;

  if (!query) {
    return res.status(400).json({ success: false, error: "Missing address or coordinates" });
  }

  const targetUrl = `https://precise-latlon-finder.lovable.app/api/json?${query}`;
  console.log("Fetching from:", targetUrl);

  try {
    const response = await fetch(targetUrl);
    const text = await response.text(); // don't parse!

    // Just forward the raw text as-is
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(text); // ✅ don't JSON.parse()
  } catch (error) {
    console.error("Proxy fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch from Lovable API" });
  }
}