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

    console.log("------ Raw HTML Start ------");
    console.log(html.slice(0, 1000)); // Log first 1000 characters
    console.log("------ Raw HTML End ------");

    // Try body content extraction again
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    if (!bodyMatch) throw new Error("No <body> tag found in response");

    const rawText = bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "") // strip scripts
      .replace(/<\/?[^>]+(>|$)/g, "") // strip remaining HTML tags
      .trim();

    console.log("------ Raw Text from <body> ------");
    console.log(rawText.slice(0, 1000)); // Log first 1000 chars
    console.log("------ End Raw Text ------");

    const json = JSON.parse(rawText);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(json);
  } catch (error) {
    console.error("Proxy fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch or parse Lovable response" });
  }
}
