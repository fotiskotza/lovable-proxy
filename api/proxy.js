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
  console.log("Fetching from:", targetUrl); // 👈 log this

  try {
    const response = await fetch(targetUrl);
    const text = await response.text(); // <-- get raw response
    console.log("Raw response:", text); // 👈 log it

    const data = JSON.parse(text); // manually parse
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Proxy fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch from Lovable API" });
  }
}