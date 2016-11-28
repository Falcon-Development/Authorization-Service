const Promise = require("bluebird");
const mysql = require("promise-mysql");


//returns a list of patients for a therapist id
const getPatients = Promise.coroutine(function* (db, id) {
	const connection =  yield mysql.createConnection(db);
	const rows = yield connection.query("select * from TherapistPatientLink where TherapistPatientLink.therapist = ?", [id]).catch(console.error); //eslint-disable-line
	yield connection.end();
	const patients = [];
	for (let item of rows) {
		const user = yield getUserById(db, item.patient);
		patients.push(user);
	}
	return patients;
});

//get a list of sessions for a user id
const getSessions = Promise.coroutine(function* (db, id) {
	const connection =  yield mysql.createConnection(db);
	const rows = yield connection.query("select patient, type, acquisitionDate from SessionData where SessionData.patient = ? ORDER BY SessionData.acquisitionDate DESC", [id]).catch(console.error);//eslint-disable-line
	yield connection.end();
	return rows || [];
});

//return a session for an id and date
const getSession = Promise.coroutine(function* (db, id, date) {
	const connection =  yield mysql.createConnection(db); 
	const rows = yield connection.query("select * from SessionData where SessionData.patient = ? and SessionData.acquisitionDate = ?", [id, date.toISOString().slice(0, 19).replace("T", " ")]).catch(console.error);//eslint-disable-line
	yield connection.end();
	if (rows && rows.length !== 0) {
		rows[0].data = JSON.parse(rows[0].jsonData);
		delete rows[0].jsonData;
		return rows[0];
	} else {
		return null;
	}
});

//get a user object;
const getUserById = Promise.coroutine(function*(db, id) {
	const connection =  yield mysql.createConnection(db);
	const rows = yield connection.query("select * from users where users.Id = ?", [id]).catch(console.error); //eslint-disable-line
	yield connection.end();
	if (rows.length !== 0) {
		rows[0].getPatients = getPatients.bind(null, db, id);
		return rows[0];
	} else {
		return undefined;
	}
});

//insert a user into the users table
const insertUser = Promise.coroutine(function*(db, user, userId, isTherapist) {
	const connection =  yield mysql.createConnection(db);
	const inserted = yield connection.query("INSERT INTO users (patientID,id,isTherapist) VALUES (?,?,?);", [userId, user.id, isTherapist]).catch(err => {
		console.error(err); //eslint-disable-line
		return false;
	});
	yield connection.end();
	return inserted;
});

//see if a user is a patient of a therapist
const userIsPatientOf = Promise.coroutine(function*(db, userID, therapistID) {
	const connection =  yield mysql.createConnection(db);
	const found = yield connection.query("select * from TherapistPatientLink where TherapistPatientLink.therapist = ? and TherapistPatientLink.patient = ?", [therapistID, userID]).catch(err => {
		console.error(err); //eslint-disable-line
		return false;
	}).then(rows => {
		if (rows) { return true; } else {return false;}
	});
	yield connection.end();
	return found;
});

//export modules
module.exports = {
	getUserById,
	insertUser,
	userIsPatientOf,
	getSessions,
	getSession
};