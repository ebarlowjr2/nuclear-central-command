export type CompanyCategory =
  | 'utilities'
  | 'smr_developers'
  | 'reactor_vendors'
  | 'uranium_fuel'
  | 'engineering'
  | 'research_advocacy';

export type Company = {
  id: string;
  name: string;
  category: CompanyCategory;
  description: string;
  website: string;
  socials: {
    linkedin?: string;
    x?: string;
  };
  logoUrl?: string; // optional, local or remote asset path
  latestUpdate?: string; // ISO date (best-effort, derived from news)
};

