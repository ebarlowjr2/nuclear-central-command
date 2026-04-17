import fs from 'node:fs/promises';
import path from 'node:path';
import { Reactor } from './types';

const DATA_PATH = path.join(process.cwd(), 'data', 'reactors.local.json');

let cached: { at: number; reactors: Reactor[] } | null = null;
const CACHE_TTL_MS = 60_000;

export async function getLocalReactors(): Promise<Reactor[]> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.reactors;

  let raw: string;
  try {
    raw = await fs.readFile(DATA_PATH, 'utf8');
  } catch {
    cached = { at: now, reactors: [] };
    return [];
  }

  const parsed = JSON.parse(raw) as Reactor[];
  cached = { at: now, reactors: parsed };
  return parsed;
}
