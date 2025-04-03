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

    // Find the JSON block inside the HTML using regex
    const jsonMatch = html.match(/{[\s\S]*}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const jsonText = jsonMatch[0];
    const parsed = JSON.parse(jsonText);

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(parsed);
  } catch (error) {
    console.error("Proxy fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch or parse Lovable response" });
  }
}
