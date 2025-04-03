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
    const html = await response.text();

    // Regex to extract JSON from <pre>{...}</pre>
    const match = html.match(/<pre.*?>(.*?)<\/pre>/s);
    if (!match) throw new Error("Could not extract JSON from HTML");

    const extractedJson = match[1];
    const data = JSON.parse(extractedJson);

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Proxy fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch or parse Lovable response" });
  }
}
