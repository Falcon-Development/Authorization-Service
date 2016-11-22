const Promise = require("bluebird");
const mysql = require('promise-mysql');

const getPatients = Promise.coroutine(function* (db, id) {
    const connection =  yield mysql.createConnection(db)
    const rows = yield connection.query('select * from TherapistPatientLink where TherapistPatientLink.therapist = ?', [id]).catch(console.error);
    yield connection.end();
    const patients = []
    for (let item of rows) {
        const user = yield getUserById(db, item.patient)
        patients.push(user)
    }
    return patients;
});
const getSessions = Promise.coroutine(function* (db, id) {
    const connection =  yield mysql.createConnection(db)
    const rows = yield connection.query('select patient, type, acquisitionDate from SessionData where SessionData.patient = ? ORDER BY SessionData.acquisitionDate DESC', [id]).catch(console.error);
    yield connection.end();
    return rows || [];
});
const getSession = Promise.coroutine(function* (db, id, date) {
    const connection =  yield mysql.createConnection(db)
    const rows = yield connection.query('select * from SessionData where SessionData.patient = ? and SessionData.acquisitionDate = ?', [id, date]).catch(console.error);
    yield connection.end();
    if (rows) {
        rows[0].data = JSON.parse(rows[0].jsonData);
        delete rows[0].jsonData;
        return rows[0]
    } else {
        return null
    }
});
const getUserById = Promise.coroutine(function*(db, id) {
    const connection =  yield mysql.createConnection(db);
    const rows = yield connection.query('select * from users where users.Id = ?', [id]).catch(console.error);
    yield connection.end();
    if (rows.length !== 0) {
        rows[0].getPatients = getPatients.bind(null, db, id)
        return rows[0]
    } else {
        return undefined
    }
});

const insertUser = Promise.coroutine(function*(db, user, userId, isTherapist) {
    const connection =  yield mysql.createConnection(db)
    const inserted = yield connection.query("INSERT INTO users (patientID,id,isTherapist) VALUES (?,?,?);", [userId, user.id, isTherapist]).catch(err => {
        console.error(err)
        return false 
    });
    yield connection.end();
    return inserted;
});
const userIsPatientOf = Promise.coroutine(function*(db, userID, therapistID) {
    const connection =  yield mysql.createConnection(db)
    const found = yield connection.query("select * from TherapistPatientLink where TherapistPatientLink.therapist = ? and TherapistPatientLink.patient = ?", [therapistID, userID]).catch(err => {
        console.error(err)
        return false 
    }).then(rows => {
        if (rows) { return true; } else {return false;}
    });
    yield connection.end();
    return found;
});

const makeTheripst = Promise.coroutine(function*(db, userID) {
    const connection =  yield mysql.createConnection(db)
    const succeded = yield connection.query("UPDATE users SET isTherapist= 1  WHERE users.Id = ?", [userID]).catch(err => {
        console.error(err)
        return false 
    }).then(() => true);
    yield connection.end();
    return succeded;
});

module.exports = {
    getUserById,
    insertUser,
    userIsPatientOf,
    getSessions,
    getSession
}