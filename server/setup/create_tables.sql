CREATE TABLE IF NOT EXISTS Building (
    BuildingIRN INT PRIMARY KEY,
    BuildingName VARCHAR(100),
    Enrollment INT,
    AttendanceRate DECIMAL(5, 2),
    MobilityRate DECIMAL(5, 2),
    ChronicAbsenteeismRate DECIMAL(5, 2)
);

CREATE TABLE IF NOT EXISTS BuildingAchievement (
    BuildingIRN INT PRIMARY KEY REFERENCES Building(BuildingIRN),
    PerfIndexScore DECIMAL(5, 2),
    StudentsLimited DECIMAL(5, 2),
    StudentsBasic DECIMAL(5, 2),
    StudentsProficient DECIMAL(5, 2),
    StudentsAccomplished DECIMAL(5, 2),
    StudentsAdvanced DECIMAL(5, 2),
    StudentsAdvancedPlus DECIMAL(5, 2)
);

CREATE TABLE IF NOT EXISTS HighSchoolAchievement (
    BuildingIRN INT PRIMARY KEY REFERENCES Building(BuildingIRN),
    PathCompletedPc DECIMAL(5, 2),
    SATSatisfactoryPc DECIMAL(5, 2),
    HonorDiplomaPc DECIMAL(5, 2),
    APIBOutstandingPc DECIMAL(5, 2),
    CareerReadyPc DECIMAL(5, 2),
    DualReadyPc DECIMAL(5, 2),
    MilitaryEnlistedPc DECIMAL(5, 2),
    TechProficiencyPc DECIMAL(5, 2),
    WBLCompletionPc DECIMAL(5, 2),
    FourYearGradRate DECIMAL(5, 2)
);

CREATE TABLE IF NOT EXISTS BelongsTo (
    BuildingIRN INT PRIMARY KEY REFERENCES Building(BuildingIRN),
    DistrictIRN INT PRIMARY KEY REFERENCES District(DistrictIRN)
);

CREATE TABLE IF NOT EXISTS District (
    DistrictIRN INT PRIMARY KEY,
    DistrictName VARCHAR(100),
    County VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS DistrictAchievement (
    DistrictIRN INT PRIMARY KEY REFERENCES District(DistrictIRN),
    PerfIndexScore DECIMAL(5, 2),
    StudentsLimited DECIMAL(5, 2),
    StudentsBasic DECIMAL(5, 2),
    StudentsProficient DECIMAL(5, 2),
    StudentsAccomplished DECIMAL(5, 2),
    StudentsAdvanced DECIMAL(5, 2),
    StudentsAdvancedPlus DECIMAL(5, 2)
);