import { Reactor } from './types';
import { LOCAL_REACTORS } from './localData';

let cached: { at: number; reactors: Reactor[] } | null = null;
const CACHE_TTL_MS = 60_000;

export async function getLocalReactors(): Promise<Reactor[]> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.reactors;

  // LOCAL_REACTORS is bundled at build time, so this is safe in serverless.
  cached = { at: now, reactors: LOCAL_REACTORS };
  return LOCAL_REACTORS;
}
