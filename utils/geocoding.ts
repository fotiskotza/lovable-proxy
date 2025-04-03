interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  formattedAddress: string;
  success: boolean;
  error?: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!address.trim()) {
    return {
      coordinates: { lat: 0, lng: 0 },
      formattedAddress: "",
      success: false,
      error: "Please enter an address"
    };
  }

  try {
    const addressToUse = address.trim();
    const encodedAddress = encodeURIComponent(addressToUse);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=1&accept-language=en`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "LatLonFinder/1.0"
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          coordinates: {
            lat: parseFloat(parseFloat(result.lat).toFixed(7)),
            lng: parseFloat(parseFloat(result.lon).toFixed(7))
          },
          formattedAddress: result.display_name,
          success: true
        };
      }
    } catch {}

    const simplifiedAddress = addressToUse.replace(/[^\w\s,]/gi, ' ').trim();
    if (simplifiedAddress !== addressToUse) {
      const encodedSimplified = encodeURIComponent(simplifiedAddress);
      try {
        const secondController = new AbortController();
        const secondTimeoutId = setTimeout(() => secondController.abort(), 5000);

        const secondResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodedSimplified}&format=json&limit=1`,
          {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "LatLonFinder/1.0"
            },
            signal: secondController.signal
          }
        );

        clearTimeout(secondTimeoutId);

        if (secondResponse.ok) {
          const secondData = await secondResponse.json();
          if (secondData && secondData.length > 0) {
            const result = secondData[0];
            return {
              coordinates: {
                lat: parseFloat(parseFloat(result.lat).toFixed(7)),
                lng: parseFloat(parseFloat(result.lon).toFixed(7))
              },
              formattedAddress: result.display_name,
              success: true
            };
          }
        }
      } catch {}
    }

    const coordMatch = address.match(/(-?\d+\.?\d*)[\s,]+(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          coordinates: { lat, lng },
          formattedAddress: `${lat}, ${lng}`,
          success: true
        };
      }
    }

    return {
      coordinates: { lat: 0, lng: 0 },
      formattedAddress: "",
      success: false,
      error: "No results found"
    };
  } catch {
    return {
      coordinates: { lat: 0, lng: 0 },
      formattedAddress: "",
      success: false,
      error: "Geocoding service unavailable"
    };
  }
}
