import { Pool } from "pg";

export type FarmRecord = {
  id: string;
  name: string;
  areaAcres: number;
  center: { lat: number; lng: number };
  boundary: { lat: number; lng: number }[];
  createdAt: string;
  sections?: { crop: string; area: number }[];
  preferences?: { water: string; risk: string };
};

const globalStore = globalThis as typeof globalThis & { agriprofitFarms?: FarmRecord[]; agriprofitPool?: Pool };
const memoryFarms = globalStore.agriprofitFarms ?? (globalStore.agriprofitFarms = []);

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  return globalStore.agriprofitPool ?? (globalStore.agriprofitPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));
}

export async function saveFarm(farm: FarmRecord) {
  const pool = getPool();
  if (!pool) {
    memoryFarms.push(farm);
    return farm;
  }
  const boundary = [...farm.boundary, farm.boundary[0]].map((point) => `${point.lng} ${point.lat}`).join(",");
  await pool.query(
    `INSERT INTO farms (id, name, area_acres, center_lat, center_lng, boundary, sections, preferences)
     VALUES ($1, $2, $3, $4, $5, ST_GeogFromText($6), $7, $8)`,
    [farm.id, farm.name, farm.areaAcres, farm.center.lat, farm.center.lng, `POLYGON((${boundary}))`, JSON.stringify(farm.sections ?? []), JSON.stringify(farm.preferences ?? {})],
  );
  return farm;
}

export async function listFarms() {
  const pool = getPool();
  if (!pool) return memoryFarms;
  const result = await pool.query(`SELECT id, name, area_acres, center_lat, center_lng, sections, preferences, ST_AsGeoJSON(boundary::geometry) AS boundary, created_at FROM farms ORDER BY created_at DESC`);
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    areaAcres: Number(row.area_acres),
    center: { lat: Number(row.center_lat), lng: Number(row.center_lng) },
    boundary: row.boundary.coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng })).slice(0, -1),
    createdAt: row.created_at.toISOString(),
    sections: row.sections,
    preferences: row.preferences,
  }));
}
