CREATE SCHEMA mobilityApp;
USE mobilityApp;

CREATE TABLE users (
	patientID VARCHAR(50) NOT NULL,
	id VARCHAR(50) NOT NULL, 
	isTherapist BOOLEAN NOT NULL,
	PRIMARY KEY(id)
);

CREATE TABLE TherapistPatientLink (
	patient VARCHAR(50) NOT NULL,
    therapist VARCHAR(50) NOT NULL,
	FOREIGN KEY(therapist) REFERENCES users(id),
	FOREIGN KEY(patient) REFERENCES users(id),
    PRIMARY KEY(therapist, patient)
);

CREATE TABLE SessionData(
	patient VARCHAR(50) NOT NULL,
	FOREIGN KEY(patient) REFERENCES users(id),
    type VARCHAR(3) NOT NULL,
	jsonData LONGTEXT not null,
    acquisitionDate datetime not null,
	metadata VARCHAR(50) not null,
	
    PRIMARY KEY(patient, acquisitionDate),
    CHECK(type = "DGI" or type = "SM")
);