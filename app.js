const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const config = require("configya")({
	file: "./config.json"
})
var engine = require('ejs-locals');
var session = require('express-session')
const bodyParser = require('body-parser');
const passport = require('passport');
const GoogleOAuth2Strategy = require('passport-google-auth').Strategy;
const GoogleTokenStrategy = require('passport-google-token').Strategy;
const routes = require('./routes/index');
const users = require('./users/users');
const Promise = require("bluebird");
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize())

passport.use(new GoogleOAuth2Strategy({
		clientId: config.google.client.id,
		clientSecret: config.google.client.secret,
		callbackURL: "http://localhost:3000/auth/google/callback"
	},
	function (accessToken, refreshToken, profile, done) {
		//User.findOrCreate(..., function (err, user) {
		done(null, profile);
		//});
	}
));

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
})

passport.deserializeUser(function (id, done) {
	getUserById(id).then(usr => {
		if (usr) {
			done(null, usr)
		} else {
			done(new Error("No user found"), null)
		}
	});
})

app.use('/', routes);

app.get('/login', passport.authenticate('google'));
app.get('/api/marco', passport.authenticate("google-token"),  (req, res) => {
	res.send("polo");
});

app.post('/api/users/add', passport.authenticate("google-token"),  (req, res) => {
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
		console.error(err);
		res.status(500).json({message: "Server error"});
	})
});

app.get('/api/patients', passport.authenticate("google-token"), (req, res) => {
	Promise.coroutine(function*(){
		const user = yield users.getUserById(config.mysql, req.user.id);
		if (!user) {
			res.status(401).json({message: "User not found"})
			return;
		}
		if (!user.isTherapist) {
			res.status(401).json({message: "User not a therapist"})
			return;
		}
		const patients = yield user.getPatients();
		res.json(patients);
		return;
	})().catch(err => {
		console.error(err);
		res.status(500).json({message: "Server error"});
	});
});

app.get('/api/sessions', passport.authenticate("google-token"),  (req, res) => {
	Promise.coroutine(function*(){
		const user = yield users.getUserById(config.mysql, req.user.id);
		if (!user) {
			res.status(401).json({message: "User not found"})
			return;
		}
		if (req.user.id !== req.query.user_id) {
			const isPatient = yield users.userIsPatientOf(config.mysql, req.query.user_id, req.user.id)
			if (!isPatient) {
				res.status(401).json({message: "This user is not assigned to you"})
				return;
			}
			const sessions = yield users.getSessions(config.mysql, req.query.user_id);
			res.json(sessions);
		} else {
			const sessions = yield users.getSessions(config.mysql, req.query.user_id);
			res.json(session);
		}
		return;
	})().catch(err => {
		console.error(err);
		res.status(500).json({message: "Server error"});
	});
});

app.get('/api/sessions/data', passport.authenticate("google-token"),  (req, res) => {
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
		console.error(err);
		res.status(500).json({message: "Server error"});
	});;
});

app.patch('api/users')

app.get('/auth/google/callback', passport.authenticate('google', {
	failureRedirect: "/login"
}), function (req, res) {
	// Successful authentication, redirect to your app. 
	console.log(res)
	res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;