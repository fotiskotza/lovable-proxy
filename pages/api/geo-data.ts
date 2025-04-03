import type { NextApiRequest, NextApiResponse } from 'next';
import {
  loadStaticPolygons,
  findContainingPolygons,
  generateCardinalPoints,
  findSmallestContainingPolygon,
} from '@/utils/polygonUtils';
import { geocodeAddress } from '@/utils/geocoding';

interface ApiResponse {
  success: boolean;
  error?: string;
  data?: {
    lat: string;
    lon: string;
    polygon: string;
    polygonNorth: string;
    polygonSouth: string;
    polygonEast: string;
    polygonWest: string;
    formattedAddress?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { address, lat, lng } = req.query;

  if (!address && (!lat || !lng)) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameter: provide 'address' or both 'lat' and 'lng'",
    });
  }

  try {
    let latitude: number;
    let longitude: number;
    let formattedAddress = address as string | undefined;

    if (address && (!lat || !lng)) {
      const geoResult = await geocodeAddress(address as string);
      if (!geoResult.success) {
        return res.status(400).json({
          success: false,
          error: geoResult.error || "Geocoding failed",
        });
      }

      latitude = geoResult.coordinates.lat;
      longitude = geoResult.coordinates.lng;
      formattedAddress = geoResult.formattedAddress;
    } else {
      latitude = parseFloat(lat as string);
      longitude = parseFloat(lng as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          success: false,
          error: "Invalid lat/lng values",
        });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          error: "Coordinates out of valid range",
        });
      }
    }

    const polygons = loadStaticPolygons();
    const centerPoint: [number, number] = [latitude, longitude];

    const matchingPolygons = findContainingPolygons(centerPoint, polygons);
    const centerPolygon = matchingPolygons[0]?.name || "None";

    const cardinalPoints = generateCardinalPoints(centerPoint);

    const north = findSmallestContainingPolygon(cardinalPoints.north, polygons);
    const south = findSmallestContainingPolygon(cardinalPoints.south, polygons);
    const east = findSmallestContainingPolygon(cardinalPoints.east, polygons);
    const west = findSmallestContainingPolygon(cardinalPoints.west, polygons);

    const response: ApiResponse = {
      success: true,
      data: {
        lat: latitude.toFixed(7),
        lon: longitude.toFixed(7),
        polygon: centerPolygon,
        polygonNorth: north?.name || "None",
        polygonSouth: south?.name || "None",
        polygonEast: east?.name || "None",
        polygonWest: west?.name || "None",
      },
    };

    if (formattedAddress) {
      response.data!.formattedAddress = formattedAddress;
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
