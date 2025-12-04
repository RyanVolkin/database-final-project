CREATE TABLE IF NOT EXISTS Building (
    IRN INT PRIMARY KEY,
    Name VARCHAR(100),
    Enrollment INT,
    AttendanceRate DECIMAL(5, 2),
    MobilityRate DECIMAL(5, 2),
    ChronicAbsenteeismRate DECIMAL(5, 2)
);

CREATE TABLE IF NOT EXISTS BuildingAchievement (
    IRN INT PRIMARY KEY,
    PerfIndexScore DECIMAL(5, 2),
    StudentsLimited DECIMAL(5, 2),
    StudentsBasic DECIMAL(5, 2),
    StudentsProficient DECIMAL(5, 2),
    StudentsAccomplished DECIMAL(5, 2),
    StudentsAdvanced DECIMAL(5, 2),
    StudentsAdvancedPlus DECIMAL(5, 2),

    FOREIGN KEY (IRN) REFERENCES Building(IRN)
);

CREATE TABLE IF NOT EXISTS HighSchoolAchievement (
    IRN INT PRIMARY KEY,
    PathCompletedPc DECIMAL(5, 2),
    SATSatisfactoryPc DECIMAL(5, 2),
    HonorDiplomaPc DECIMAL(5, 2),
    APIBOutstandingPc DECIMAL(5, 2),
    CareerReadyPc DECIMAL(5, 2),
    DualReadyPc DECIMAL(5, 2),
    MilitaryEnlistedPc DECIMAL(5, 2),
    TechProficiencyPc DECIMAL(5, 2),
    WBLCompletionPc DECIMAL(5, 2),
    FourYearGradRate DECIMAL(5, 2),

    FOREIGN KEY (IRN) REFERENCES Building(IRN)
);
CREATE TABLE IF NOT EXISTS District (
    IRN INT PRIMARY KEY,
    Name VARCHAR(100),
    County VARCHAR(15)
);
CREATE TABLE IF NOT EXISTS BelongsTo (
    BuildingIRN INT,
    DistrictIRN INT,
    PRIMARY KEY (BuildingIRN, DistrictIRN),
    FOREIGN KEY (BuildingIRN) REFERENCES Building(IRN),
    FOREIGN KEY (DistrictIRN) REFERENCES District(IRN)
);



CREATE TABLE IF NOT EXISTS DistrictAchievement (
    IRN INT PRIMARY KEY,
    PerfIndexScore DECIMAL(5, 2),
    StudentsLimited DECIMAL(5, 2),
    StudentsBasic DECIMAL(5, 2),
    StudentsProficient DECIMAL(5, 2),
    StudentsAccomplished DECIMAL(5, 2),
    StudentsAdvanced DECIMAL(5, 2),
    StudentsAdvancedPlus DECIMAL(5, 2),
    
    FOREIGN KEY (IRN) REFERENCES District(IRN)
);