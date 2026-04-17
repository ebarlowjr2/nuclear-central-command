import { Reactor, ReactorStatus } from './types';

export type ReactorListParams = {
  status?: ReactorStatus;
  country?: string;
  type?: string;
  limit: number;
  offset: number;
};

export function filterReactors(reactors: Reactor[], params: ReactorListParams) {
  let out = reactors;
  if (params.status) out = out.filter((r) => r.status === params.status);
  if (params.country) out = out.filter((r) => r.country === params.country);
  if (params.type) out = out.filter((r) => (r.type || '').toLowerCase() === params.type!.toLowerCase());
  return out;
}

