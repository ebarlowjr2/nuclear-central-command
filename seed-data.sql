
INSERT INTO countries (id, iso2, name, region, subregion) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'US', 'United States', 'Americas', 'Northern America'),
('550e8400-e29b-41d4-a716-446655440002', 'FR', 'France', 'Europe', 'Western Europe'),
('550e8400-e29b-41d4-a716-446655440003', 'CN', 'China', 'Asia', 'Eastern Asia'),
('550e8400-e29b-41d4-a716-446655440004', 'JP', 'Japan', 'Asia', 'Eastern Asia'),
('550e8400-e29b-41d4-a716-446655440005', 'RU', 'Russia', 'Europe', 'Eastern Europe'),
('550e8400-e29b-41d4-a716-446655440006', 'KR', 'South Korea', 'Asia', 'Eastern Asia'),
('550e8400-e29b-41d4-a716-446655440007', 'CA', 'Canada', 'Americas', 'Northern America'),
('550e8400-e29b-41d4-a716-446655440008', 'GB', 'United Kingdom', 'Europe', 'Northern Europe'),
('550e8400-e29b-41d4-a716-446655440009', 'IN', 'India', 'Asia', 'Southern Asia'),
('550e8400-e29b-41d4-a716-446655440010', 'DE', 'Germany', 'Europe', 'Western Europe')
ON CONFLICT (iso2) DO NOTHING;

INSERT INTO reactors (country_id, plant_name, unit_name, reactor_type, status, net_capacity_mwe, thermal_power_mwt, latitude, longitude, operator, owner, supplier, construction_start, first_grid_connection, commercial_operation) VALUES
((SELECT id FROM countries WHERE iso2 = 'US'), 'Vogtle', 'Unit 3', 'PWR', 'Operating', 1117, 3415, 33.1415, -81.7609, 'Southern Nuclear', 'Southern Company', 'Westinghouse', '2013-03-12', '2023-07-31', '2023-07-31'),
((SELECT id FROM countries WHERE iso2 = 'US'), 'Vogtle', 'Unit 4', 'PWR', 'Under Construction', 1117, 3415, 33.1415, -81.7609, 'Southern Nuclear', 'Southern Company', 'Westinghouse', '2013-11-19', NULL, NULL),
((SELECT id FROM countries WHERE iso2 = 'US'), 'Palo Verde', 'Unit 1', 'PWR', 'Operating', 1314, 3990, 33.3883, -112.8650, 'Arizona Public Service', 'Arizona Public Service', 'Combustion Engineering', '1976-05-25', '1985-05-25', '1986-01-28'),
((SELECT id FROM countries WHERE iso2 = 'US'), 'Palo Verde', 'Unit 2', 'PWR', 'Operating', 1314, 3990, 33.3883, -112.8650, 'Arizona Public Service', 'Arizona Public Service', 'Combustion Engineering', '1976-05-25', '1986-04-18', '1986-09-19'),
((SELECT id FROM countries WHERE iso2 = 'US'), 'Palo Verde', 'Unit 3', 'PWR', 'Operating', 1312, 3990, 33.3883, -112.8650, 'Arizona Public Service', 'Arizona Public Service', 'Combustion Engineering', '1976-05-25', '1987-10-25', '1988-01-08'),
((SELECT id FROM countries WHERE iso2 = 'US'), 'Diablo Canyon', 'Unit 1', 'PWR', 'Operating', 1138, 3411, 35.2111, -120.8522, 'Pacific Gas & Electric', 'Pacific Gas & Electric', 'Westinghouse', '1968-04-23', '1984-11-02', '1985-05-07'),
((SELECT id FROM countries WHERE iso2 = 'US'), 'Diablo Canyon', 'Unit 2', 'PWR', 'Operating', 1118, 3411, 35.2111, -120.8522, 'Pacific Gas & Electric', 'Pacific Gas & Electric', 'Westinghouse', '1970-12-23', '1985-08-19', '1986-03-13'),
((SELECT id FROM countries WHERE iso2 = 'US'), 'Browns Ferry', 'Unit 1', 'BWR', 'Operating', 1155, 3458, 34.7042, -87.1186, 'Tennessee Valley Authority', 'Tennessee Valley Authority', 'General Electric', '1967-05-01', '1973-08-01', '1974-08-01'),
((SELECT id FROM countries WHERE iso2 = 'US'), 'Peach Bottom', 'Unit 2', 'BWR', 'Operating', 1112, 3514, 39.7589, -76.2692, 'Exelon Generation', 'Exelon', 'General Electric', '1968-01-31', '1973-09-16', '1974-07-05'),
((SELECT id FROM countries WHERE iso2 = 'US'), 'Peach Bottom', 'Unit 3', 'BWR', 'Operating', 1112, 3514, 39.7589, -76.2692, 'Exelon Generation', 'Exelon', 'General Electric', '1968-01-31', '1974-08-07', '1974-12-23');

INSERT INTO reactors (country_id, plant_name, unit_name, reactor_type, status, net_capacity_mwe, latitude, longitude, operator, construction_start, first_grid_connection, commercial_operation) VALUES
((SELECT id FROM countries WHERE iso2 = 'FR'), 'Flamanville', 'Unit 3', 'PWR', 'Under Construction', 1650, 49.5361, -1.8819, 'EDF', '2007-12-03', NULL, NULL),
((SELECT id FROM countries WHERE iso2 = 'FR'), 'Civaux', 'Unit 1', 'PWR', 'Operating', 1495, 46.4569, 0.6544, 'EDF', '1991-04-01', '1997-12-24', '2002-05-01'),
((SELECT id FROM countries WHERE iso2 = 'FR'), 'Civaux', 'Unit 2', 'PWR', 'Operating', 1495, 46.4569, 0.6544, 'EDF', '1991-04-01', '1999-12-24', '2002-05-01'),
((SELECT id FROM countries WHERE iso2 = 'FR'), 'Cattenom', 'Unit 1', 'PWR', 'Operating', 1300, 49.4167, 6.2181, 'EDF', '1979-01-01', '1986-11-13', '1987-04-01'),
((SELECT id FROM countries WHERE iso2 = 'FR'), 'Cattenom', 'Unit 2', 'PWR', 'Operating', 1300, 49.4167, 6.2181, 'EDF', '1979-01-01', '1987-08-06', '1988-02-01');

INSERT INTO reactors (country_id, plant_name, unit_name, reactor_type, status, net_capacity_mwe, latitude, longitude, operator, construction_start, first_grid_connection, commercial_operation) VALUES
((SELECT id FROM countries WHERE iso2 = 'CN'), 'Taishan', 'Unit 1', 'PWR', 'Operating', 1750, 21.9144, 112.9861, 'CGNPC', '2009-10-18', '2018-06-29', '2018-12-13'),
((SELECT id FROM countries WHERE iso2 = 'CN'), 'Taishan', 'Unit 2', 'PWR', 'Operating', 1750, 21.9144, 112.9861, 'CGNPC', '2010-04-15', '2019-06-23', '2019-09-07'),
((SELECT id FROM countries WHERE iso2 = 'CN'), 'Hualong One Demo', 'Unit 1', 'PWR', 'Operating', 1150, 28.4667, 121.4167, 'CNNC', '2015-05-07', '2020-11-27', '2021-01-30'),
((SELECT id FROM countries WHERE iso2 = 'CN'), 'Tianwan', 'Unit 1', 'PWR', 'Operating', 1060, 34.6869, 119.4569, 'CNNC', '1999-10-20', '2006-05-17', '2007-05-17');

INSERT INTO generation_monthly (reactor_id, year, month, gross_mwh, net_mwh, capacity_factor) 
SELECT r.id, 2023, 8, 850000, 820000, 95.5
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3'
UNION ALL
SELECT r.id, 2023, 9, 870000, 840000, 96.2
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3'
UNION ALL
SELECT r.id, 2023, 10, 890000, 860000, 97.1
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3'
UNION ALL
SELECT r.id, 2023, 11, 880000, 850000, 96.8
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3'
UNION ALL
SELECT r.id, 2023, 12, 900000, 870000, 98.0
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3'
UNION ALL
SELECT r.id, 2024, 1, 910000, 880000, 98.5
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3'
UNION ALL
SELECT r.id, 2024, 2, 895000, 865000, 97.8
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3'
UNION ALL
SELECT r.id, 2024, 3, 905000, 875000, 98.2
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3';

INSERT INTO country_energy_stats (country_id, year, nuclear_twh, total_electricity_twh, nuclear_share_percent) VALUES
((SELECT id FROM countries WHERE iso2 = 'US'), 2023, 775.0, 4050.0, 19.1),
((SELECT id FROM countries WHERE iso2 = 'US'), 2022, 772.0, 4070.0, 19.0),
((SELECT id FROM countries WHERE iso2 = 'US'), 2021, 778.0, 4100.0, 19.0),
((SELECT id FROM countries WHERE iso2 = 'FR'), 2023, 320.0, 450.0, 71.1),
((SELECT id FROM countries WHERE iso2 = 'FR'), 2022, 279.0, 445.0, 62.7),
((SELECT id FROM countries WHERE iso2 = 'FR'), 2021, 360.0, 500.0, 72.0),
((SELECT id FROM countries WHERE iso2 = 'CN'), 2023, 440.0, 9000.0, 4.9),
((SELECT id FROM countries WHERE iso2 = 'CN'), 2022, 418.0, 8800.0, 4.7),
((SELECT id FROM countries WHERE iso2 = 'CN'), 2021, 407.0, 8500.0, 4.8);

INSERT INTO reactor_status_history (reactor_id, status, effective_date)
SELECT r.id, 'Under Construction', '2013-03-12'
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3'
UNION ALL
SELECT r.id, 'Operating', '2023-07-31'
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 3'
UNION ALL
SELECT r.id, 'Under Construction', '2013-11-19'
FROM reactors r WHERE r.plant_name = 'Vogtle' AND r.unit_name = 'Unit 4';

INSERT INTO facts (category, title, body, tags) VALUES
('technology', 'Pressurized Water Reactors (PWR)', 'PWRs use water under high pressure as both coolant and moderator. The water in the reactor core does not boil, and heat is transferred to a secondary loop where steam is generated to drive turbines. PWRs are the most common reactor type worldwide.', ARRAY['PWR', 'reactor types']),
('technology', 'Boiling Water Reactors (BWR)', 'BWRs allow water to boil directly in the reactor core, producing steam that drives turbines. This single-loop design is simpler than PWRs but requires more complex safety systems to handle radioactive steam.', ARRAY['BWR', 'reactor types']),
('safety', 'Defense in Depth', 'Nuclear safety relies on multiple layers of protection: fuel design, reactor coolant system, containment building, and emergency systems. Each layer provides backup if another fails, ensuring public safety.', ARRAY['safety', 'design']),
('fuel', 'Nuclear Fuel Cycle', 'The nuclear fuel cycle includes uranium mining, enrichment, fuel fabrication, reactor operation, spent fuel storage, and potential reprocessing. Modern reactors can achieve very high fuel burnup, extracting more energy per unit of uranium.', ARRAY['fuel', 'cycle']),
('environment', 'Carbon-Free Baseload Power', 'Nuclear power plants produce no greenhouse gas emissions during operation and provide reliable baseload electricity 24/7. A typical 1000 MW nuclear plant prevents about 2 million tons of CO2 emissions annually compared to coal.', ARRAY['climate', 'emissions']),
('performance', 'Capacity Factor Leadership', 'Nuclear plants consistently achieve capacity factors above 90%, meaning they produce power at or near maximum output over 90% of the time. This reliability is unmatched by any other energy source.', ARRAY['reliability', 'efficiency']),
('statistics', 'Global Nuclear Fleet', 'As of 2024, there are over 440 nuclear power reactors operating in 30 countries, providing about 10% of global electricity. An additional 60+ reactors are under construction worldwide.', ARRAY['global', 'statistics']),
('applications', 'Medical Isotopes', 'Nuclear reactors produce critical medical isotopes used in cancer treatment, diagnostic imaging, and sterilization. Over 40 million medical procedures annually rely on reactor-produced isotopes.', ARRAY['medicine', 'isotopes']),
('technology', 'Small Modular Reactors (SMRs)', 'SMRs are factory-built reactors with capacities up to 300 MW, offering enhanced safety through passive systems, reduced construction time, and flexibility for smaller grids or remote locations.', ARRAY['SMR', 'innovation']),
('safety', 'Passive Safety Systems', 'Modern reactor designs incorporate passive safety features that work without power or human intervention, using natural forces like gravity, convection, and evaporation to maintain safe conditions.', ARRAY['safety', 'passive']);

SELECT 'Countries inserted:' as info, COUNT(*) as count FROM countries;
SELECT 'Reactors inserted:' as info, COUNT(*) as count FROM reactors;
SELECT 'Generation records:' as info, COUNT(*) as count FROM generation_monthly;
SELECT 'Country stats:' as info, COUNT(*) as count FROM country_energy_stats;
SELECT 'Status history:' as info, COUNT(*) as count FROM reactor_status_history;
SELECT 'Facts inserted:' as info, COUNT(*) as count FROM facts;
