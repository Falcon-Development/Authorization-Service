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
})

const getSessions = Promise.coroutine(function* (db, id) {
    const connection =  yield mysql.createConnection(db)
    const rows = yield connection.query('select * from Sessions where Sessions.patient = ? ORDER BY Sessions.date DESC', [id]).catch(console.error);
    yield connection.end();
    return rows || [];
})

const getSession = Promise.coroutine(function* (db, id, date) {
    const connection =  yield mysql.createConnection(db)
    const rows = yield connection.query('select * from Sessions where Sessions.patient = ? and date = ?', [id, date]).catch(console.error);
    yield connection.end();
    if (rows) {
        return rows[0]
    } else {
        return null
    }
})

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

const insertUser = Promise.coroutine(function*(db, user, isTherapist) {
    if (!user.name.givenName || !user.name.familyName || !user.id) {
        return Promise.reject(new Error("Invaild arguments"))
    } 
    const connection =  yield mysql.createConnection(db)
    const inserted = yield connection.query("INSERT INTO users (fname,lname,id,isTherapist) VALUES (?,?,?,?);", [user.name.givenName, user.name.familyName, user.id, isTherapist]).catch(err => {
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
    }).then(rows => boolean(rows));
    yield connection.end();
    return inserted;
});

module.exports = { getUserById, insertUser, userIsPatientOf, getSessions }