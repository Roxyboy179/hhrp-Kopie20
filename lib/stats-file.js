import fs from 'fs';
import path from 'path';

const STATS_FILE = path.join(process.cwd(), 'data', 'website_stats.json');

// Stelle sicher, dass das data-Verzeichnis existiert
if (!fs.existsSync(path.dirname(STATS_FILE))) {
  fs.mkdirSync(path.dirname(STATS_FILE), { recursive: true });
}

// Lese Stats aus Datei
export function readStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[Stats File] Read error:', e);
  }
  
  // Default Stats
  return {
    total_visits: 0,
    unique_visitors: 0,
    app_installs: 0,
    pwa_users: 0,
    last_updated: null
  };
}

// Schreibe Stats in Datei
export function writeStats(stats) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify({
      ...stats,
      last_updated: new Date().toISOString()
    }, null, 2));
    return true;
  } catch (e) {
    console.error('[Stats File] Write error:', e);
    return false;
  }
}

// Inkrementiere Stat
export function incrementStat(statName, incrementBy = 1) {
  const stats = readStats();
  if (stats[statName] !== undefined) {
    stats[statName] += incrementBy;
    writeStats(stats);
  }
  return stats;
}
