export type Reactor = {
  id: string;
  plant_name: string;
  unit_name?: string;
  country_id?: string;
  reactor_type?: string;
  status?: 'Operating'|'Under Construction'|'Planned'|'Decommissioned';
  net_capacity_mwe?: number;
  thermal_power_mwt?: number;
  latitude?: number;
  longitude?: number;
  operator?: string;
  owner?: string;
  supplier?: string;
  construction_start?: string;
  first_grid_connection?: string;
  commercial_operation?: string;
  shutdown_date?: string;
  iaea_pris_id?: string;
  nrc_unit_id?: string;
  last_updated?: string;
};

export type Country = {
  id: string;
  iso2?: string;
  name: string;
  region?: string;
  subregion?: string;
  created_at?: string;
};

export type CountryStats = {
  id?: number;
  country_id: string;
  year: number;
  nuclear_twh?: number;
  total_electricity_twh?: number;
  nuclear_share_percent?: number;
};

export type GenerationMonthly = {
  id?: number;
  reactor_id: string;
  year: number;
  month: number;
  gross_mwh?: number;
  net_mwh?: number;
  capacity_factor?: number;
};

export type ReactorStatusHistory = {
  id?: number;
  reactor_id: string;
  status: string;
  effective_date: string;
};

export type Fact = {
  id?: number;
  category?: string;
  title: string;
  body: string;
  tags?: string[];
  created_at?: string;
};

export type Alert = {
  id: string;
  email: string;
  reactor_id?: string;
  alert_type: string;
  created_at?: string;
};
