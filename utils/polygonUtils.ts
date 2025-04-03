import { userPolygonTsvData } from '../data/userPolygonData';

export interface Polygon {
  id: string;
  name: string;
  coordinates: [number, number][];
}

export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [polygonLatI, polygonLngI] = polygon[i];
    const [polygonLatJ, polygonLngJ] = polygon[j];

    const intersect =
      ((polygonLngI > lng) !== (polygonLngJ > lng)) &&
      (lat < (polygonLatJ - polygonLatI) * (lng - polygonLngI) / (polygonLngJ - polygonLngI) + polygonLatI);

    if (intersect) inside = !inside;
  }

  return inside;
}

export function parsePolygonTSV(tsvString: string): Polygon[] {
  const lines = tsvString.trim().split('\n');
  const polygons: Polygon[] = [];

  const startIndex = lines[0].toLowerCase().includes('id') ||
                     lines[0].toLowerCase().includes('city') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split('\t').map(val => val.trim());
    let coordString = '';
    let id = '';
    let name = '';

    if (values.length >= 3) {
      const lastValue = values[values.length - 1];
      const secondLastValue = values[values.length - 2];

      if (lastValue.includes('(') && lastValue.includes(')')) {
        id = values[0];
        name = values[1];
        coordString = lastValue;
      } else if (secondLastValue.includes('(') && secondLastValue.includes(')')) {
        id = values[0];
        name = values[1];
        coordString = secondLastValue;
      } else {
        id = values[0];
        name = values[1];
        const coordinates: [number, number][] = [];
        for (let j = 2; j < values.length - 1; j += 2) {
          const lat = parseFloat(values[j]);
          const lng = parseFloat(values[j + 1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            coordinates.push([lat, lng]);
          }
        }
        if (coordinates.length >= 3) {
          polygons.push({ id, name, coordinates });
        }
        continue;
      }
    } else {
      continue;
    }

    const coordinates: [number, number][] = [];
    const coordPairs = coordString.split('),').map(pair => pair.trim());

    for (let pair of coordPairs) {
      pair = pair.replace(/[()]/g, '').trim();
      const [lng, lat] = pair.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates.push([lat, lng]);
      }
    }

    if (coordinates.length >= 3) {
      polygons.push({ id, name, coordinates });
    }
  }

  return polygons;
}

export function calculatePolygonArea(polygon: [number, number][]): number {
  if (polygon.length < 3) return 0;
  let area = 0;
  const R = 6371000;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const lambda1 = (lng1 * Math.PI) / 180;
    const lambda2 = (lng2 * Math.PI) / 180;
    area += (lambda2 - lambda1) * (2 + Math.sin(phi1) + Math.sin(phi2));
  }

  return Math.abs(area * R * R / 2);
}

export function calculatePointAtDistance(
  origin: [number, number],
  distance: number,
  bearing: number
): [number, number] {
  const R = 6371000;
  const d = distance / R;
  const lat1 = (origin[0] * Math.PI) / 180;
  const lng1 = (origin[1] * Math.PI) / 180;
  const brng = (bearing * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [(lat2 * 180) / Math.PI, ((lng2 * 180) / Math.PI + 540) % 360 - 180];
}

export function generateCardinalPoints(
  center: [number, number],
  distance: number = 100
): {
  north: [number, number];
  east: [number, number];
  south: [number, number];
  west: [number, number];
} {
  return {
    north: calculatePointAtDistance(center, distance, 0),
    east: calculatePointAtDistance(center, distance, 90),
    south: calculatePointAtDistance(center, distance, 180),
    west: calculatePointAtDistance(center, distance, 270),
  };
}

export function findContainingPolygons(
  point: [number, number],
  polygons: Polygon[]
): Polygon[] {
  return polygons.filter(polygon => 
    isPointInPolygon(point, polygon.coordinates)
  );
}

export function findSmallestContainingPolygon(
  point: [number, number],
  polygons: Polygon[]
): Polygon | null {
  const containingPolygons = findContainingPolygons(point, polygons);
  if (containingPolygons.length === 0) return null;
  if (containingPolygons.length === 1) return containingPolygons[0];

  return containingPolygons.reduce((smallest, current) => {
    const smallestArea = calculatePolygonArea(smallest.coordinates);
    const currentArea = calculatePolygonArea(current.coordinates);
    return currentArea < smallestArea ? current : smallest;
  });
}

export const staticPolygonData = '';
export const userPolygonData = userPolygonTsvData;

export function loadStaticPolygons(): Polygon[] {
  const userPolygons = parsePolygonTSV(userPolygonData);
  return [...userPolygons];
}
