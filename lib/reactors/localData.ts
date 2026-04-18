import type { Reactor } from './types';

// Static import so Next/Vercel bundles the file (avoids runtime fs reads).
import reactors from '@/data/reactors.json';

export const LOCAL_REACTORS: Reactor[] = reactors as Reactor[];
