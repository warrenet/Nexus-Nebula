import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

/**
 * MissionCache - Edge-Native SQLite caching for the last 5 successful missions
 * Per 2026 Sovereign Spec: Instant-on access without server round-trips
 */

interface CachedMission {
  id: string;
  mission: string;
  result: string;
  timestamp: number;
  cost: number;
  consensusScore: number;
}

const MAX_CACHED_MISSIONS = 5;
const DB_NAME = "nexus_cache.db";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the SQLite database
 */
async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  if (Platform.OS === "web") {
    // Web fallback: use localStorage
    console.log("SQLite not available on web, using localStorage fallback");
    return null as any;
  }

  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Create missions table if not exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      mission TEXT NOT NULL,
      result TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      cost REAL NOT NULL,
      consensusScore REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_timestamp ON missions(timestamp DESC);
  `);

  return db;
}

/**
 * Cache a successful mission result
 */
export async function cacheMission(
  id: string,
  mission: string,
  result: string,
  cost: number,
  consensusScore: number,
): Promise<void> {
  if (Platform.OS === "web") {
    // Web fallback
    cacheToLocalStorage({
      id,
      mission,
      result,
      timestamp: Date.now(),
      cost,
      consensusScore,
    });
    return;
  }

  const database = await initDatabase();
  const timestamp = Date.now();

  // Insert new mission
  await database.runAsync(
    `INSERT OR REPLACE INTO missions (id, mission, result, timestamp, cost, consensusScore) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, mission, result, timestamp, cost, consensusScore],
  );

  // Keep only the last 5 missions
  await database.runAsync(
    `
    DELETE FROM missions 
    WHERE id NOT IN (
      SELECT id FROM missions ORDER BY timestamp DESC LIMIT ?
    )
  `,
    [MAX_CACHED_MISSIONS],
  );
}

/**
 * Get cached missions (most recent first)
 */
export async function getCachedMissions(): Promise<CachedMission[]> {
  if (Platform.OS === "web") {
    return getFromLocalStorage();
  }

  const database = await initDatabase();
  const result = await database.getAllAsync<CachedMission>(
    `SELECT * FROM missions ORDER BY timestamp DESC LIMIT ?`,
    [MAX_CACHED_MISSIONS],
  );

  return result;
}

/**
 * Get a specific cached mission by ID
 */
export async function getCachedMission(
  id: string,
): Promise<CachedMission | null> {
  if (Platform.OS === "web") {
    const missions = getFromLocalStorage();
    return missions.find((m) => m.id === id) || null;
  }

  const database = await initDatabase();
  const result = await database.getFirstAsync<CachedMission>(
    `SELECT * FROM missions WHERE id = ?`,
    [id],
  );

  return result;
}

/**
 * Search cached missions by keyword
 */
export async function searchCachedMissions(
  keyword: string,
): Promise<CachedMission[]> {
  if (Platform.OS === "web") {
    const missions = getFromLocalStorage();
    const lowerKeyword = keyword.toLowerCase();
    return missions.filter(
      (m) =>
        m.mission.toLowerCase().includes(lowerKeyword) ||
        m.result.toLowerCase().includes(lowerKeyword),
    );
  }

  const database = await initDatabase();
  const result = await database.getAllAsync<CachedMission>(
    `SELECT * FROM missions 
     WHERE mission LIKE ? OR result LIKE ? 
     ORDER BY timestamp DESC LIMIT ?`,
    [`%${keyword}%`, `%${keyword}%`, MAX_CACHED_MISSIONS],
  );

  return result;
}

/**
 * Clear all cached missions
 */
export async function clearCache(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem("nexus_mission_cache");
    return;
  }

  const database = await initDatabase();
  await database.runAsync(`DELETE FROM missions`);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  count: number;
  totalCost: number;
  avgConsensus: number;
  oldestTimestamp: number | null;
}> {
  if (Platform.OS === "web") {
    const missions = getFromLocalStorage();
    if (missions.length === 0) {
      return { count: 0, totalCost: 0, avgConsensus: 0, oldestTimestamp: null };
    }
    return {
      count: missions.length,
      totalCost: missions.reduce((sum, m) => sum + m.cost, 0),
      avgConsensus:
        missions.reduce((sum, m) => sum + m.consensusScore, 0) /
        missions.length,
      oldestTimestamp: Math.min(...missions.map((m) => m.timestamp)),
    };
  }

  const database = await initDatabase();
  const result = await database.getFirstAsync<{
    count: number;
    totalCost: number;
    avgConsensus: number;
    oldestTimestamp: number;
  }>(
    `SELECT 
      COUNT(*) as count,
      COALESCE(SUM(cost), 0) as totalCost,
      COALESCE(AVG(consensusScore), 0) as avgConsensus,
      MIN(timestamp) as oldestTimestamp
     FROM missions`,
  );

  return (
    result || { count: 0, totalCost: 0, avgConsensus: 0, oldestTimestamp: null }
  );
}

// ============== Web LocalStorage Fallback ==============

function cacheToLocalStorage(mission: CachedMission): void {
  const cached = getFromLocalStorage();

  // Remove existing if present
  const filtered = cached.filter((m) => m.id !== mission.id);

  // Add new mission at the start
  filtered.unshift(mission);

  // Keep only last 5
  const trimmed = filtered.slice(0, MAX_CACHED_MISSIONS);

  localStorage.setItem("nexus_mission_cache", JSON.stringify(trimmed));
}

function getFromLocalStorage(): CachedMission[] {
  try {
    const data = localStorage.getItem("nexus_mission_cache");
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}
