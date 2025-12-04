-- Use psql's client-side "\copy" so files are read by the client (psql), not the DB server.
-- Run with: psql -U <user> -h <host> -p <port> -d <dbname> -f "server/setup/load_tables.sql"
  
-- Load tables in referential order so foreign keys resolve:
-- 1) Building and its achievements
-- 2) District and its achievements
-- 3) BelongsTo (references Building and District)
\copy Building FROM 'C:/Users/ryanv/OneDrive/Documents/GitHub/batabase-final-project/server/raw_data/Building.csv' WITH (FORMAT csv, DELIMITER ',', NULL '');
\copy BuildingAchievement FROM 'C:/Users/ryanv/OneDrive/Documents/GitHub/batabase-final-project/server/raw_data/BuildingAchievement.csv' WITH (FORMAT csv, DELIMITER ',', NULL '');
\copy HighSchoolAchievement FROM 'C:/Users/ryanv/OneDrive/Documents/GitHub/batabase-final-project/server/raw_data/HighSchoolAchievement.csv' WITH (FORMAT csv, DELIMITER ',', NULL '');
\copy District FROM 'C:/Users/ryanv/OneDrive/Documents/GitHub/batabase-final-project/server/raw_data/District.csv' WITH (FORMAT csv, DELIMITER ',', NULL '');
\copy DistrictAchievement FROM 'C:/Users/ryanv/OneDrive/Documents/GitHub/batabase-final-project/server/raw_data/DistrictAchievement.csv' WITH (FORMAT csv, DELIMITER ',', NULL '');
\copy BelongsTo FROM 'C:/Users/ryanv/OneDrive/Documents/GitHub/batabase-final-project/server/raw_data/BelongsTo.csv' WITH (FORMAT csv, DELIMITER ',', NULL '');