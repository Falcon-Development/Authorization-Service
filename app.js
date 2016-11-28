const express = require("express");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("configya")({
	file: "./config.json"
} );
const engine = require("ejs-locals");
const bodyParser = require("body-parser");
const passport = require("passport");
const GoogleTokenStrategy = require("passport-google-token").Strategy;
const users = require("./users/users");
const Promise = require("bluebird");
const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());

passport.use(new GoogleTokenStrategy({
	clientID: config.google.client.id,
	clientSecret: config.google.client.secret,
},
	function (accessToken, refreshToken, profile, done) {
		done(null, profile);
	}
));

passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(function (id, done) {
	users.getUserById(config.mysql, id).then(usr => {
		if (usr) {
			done(null, usr);
		} else {
			done(new Error("No user found"), null);
		}
	});
});

app.get("/login", passport.authenticate("google"));
app.get("/api/marco", passport.authenticate("google-token"),  (req, res) => {
	res.send("polo");
});

app.post("/api/users/add", passport.authenticate("google-token"),  (req, res) => {
	Promise.coroutine(function*(){
		if (!req.body.userId) {
			res.status(400).json({message: "No user id"});
			return;
		}
		const success = yield users.insertUser(config.mysql, req.user, req.body.userId, false);
		if (success) {
			res.status(200).json({message: "done"});
		} else {
			res.status(500).json({message: "Failed to add user to database"});
		}
	})().catch(err => {
		console.error(err); //eslint-disable-line
		res.status(500).json({message: "Server error"});
	} );
});

app.get("/api/patients", passport.authenticate("google-token"), (req, res) => {
	Promise.coroutine(function*(){
		const user = yield users.getUserById(config.mysql, req.user.id);
		if (!user) {
			res.status(401).json({message: "User not found"});
			return;
		}
		if (!user.isTherapist) {
			res.status(401).json({message: "User not a therapist"});
			return;
		}
		const patients = yield user.getPatients();
		res.json(patients);
		return;
	})().catch(err => {
		console.error(err); //eslint-disable-line
		res.status(500).json({message: "Server error"});
	});
});

app.get("/api/sessions", passport.authenticate("google-token"),  (req, res) => {
	Promise.coroutine(function*(){
		const user = yield users.getUserById(config.mysql, req.user.id);
		if (!user) {
			res.status(401).json({message: "User not found"});
			return;
		}
		if (req.user.id !== req.query.user_id) {
			const isPatient = yield users.userIsPatientOf(config.mysql, req.query.user_id, req.user.id);
			if (!isPatient) {
				res.status(401).json({message: "This user is not assigned to you"});
				return;
			}
			const sessions = yield users.getSessions(config.mysql, req.query.user_id);
			res.json(sessions);
		} else {
			const sessions = yield users.getSessions(config.mysql, req.query.user_id);
			res.json(sessions);
		}
		return;
	})().catch(err => {
		console.error(err); //eslint-disable-line
		res.status(500).json({message: "Server error"});
	});
});

app.get("/api/sessions/data", passport.authenticate("google-token"),  (req, res) => {
	Promise.coroutine(function*(){
		if (req.user.id !== req.query.user_id) {
			const isPatient = yield users.userIsPatientOf(config.mysql, req.query.user_id, req.user.id);
			if (!isPatient) {
				res.status(401).json({message: "This user is not assigned to you"});
				return;
			}
		}
		const session = yield users.getSession(config.mysql, req.query.user_id, new Date(req.query.date));
		if (!session) {
			res.status(404).json({message: "No session found"});
			return;
		}
		res.json(session);
	})().catch(err => {
		console.error(err); //eslint-disable-line
		res.status(500).json({message: "Server error"});
	});
});

// catch 404
app.use(function (req, res) {
	console.warn("Response not found for ", req.path); //eslint-disable-line
	res.status(404).json({message: "not found"});
});

module.exports = app;