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

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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
	users.getUserById(config.mysql, user.id).then(res => {
		if (!res) {
			users.insertUser(config.mysql, user, false).then(success => {
				if (success) {
					done(null, user)
				} else {
					done(new Error("failed to add user"), null)
				}
			})
		} else {
			done(null, user)
		}
	})
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
app.get('/api/marco', passport.authenticate("google-token"), function (req, res) {
	res.send("polo");
});
app.get('/api/patients', passport.authenticate("google-token"), function (req, res) {
	users.getUserById(config.mysql, req.user.id).then(usr => {
		const isTherapist = usr.isTherapist;
		if (!isTherapist) {
			res.status(401).json({
				message: "User is not a therapist"
			})
		}else {
			usr.getPatients().then(patients => res.json(patients))
		} 
	})
});

app.get('/api/sessions', passport.authenticate("google-token"), function (req, res) {
	//if user id does not equal the requests patient id
	if (req.user.id !== req.params.userId) {
		users.userIsPatientOf(config.mssql, req.params.userId, req.user.id).then(isPatient => {
			if (!isPatient) {
				res.status(401).json({
					message: "This user is not assigned to you"
				})
			} else {
				user.getSessions(config.mssql.req.params.userId).then(sessions => res.json(session))
			}
		})
	} else {
		user.getSessions(config.mssql.req.params.userId).then(sessions => res.json(session))
	}
	//  check to be sure user is that patients therapist and if not return 401
	//
	//get the list of sessions
});

app.get('/api/sessions/data', passport.authenticate("google-token"), function (req, res) {
	//if user id does not equal the requests patient id
	if (req.user.id !== req.params.userId) {
		users.userIsPatientOf(config.mssql, req.params.userId, req.user.id).then(isPatient => {
			if (!isPatient) {
				res.status(401).json({
					message: "This user is not assigned to you"
				})
			} else {
				user.getSession(config.mssql, req.params.userId, req.params.date).then(session => {
					if (session) {
						req.json(session)
					} else {
						req.status(401).json({
							message: "No session found"
						})
					}
				})
			}
		})
	} else {
		user.getSession(config.mssql, req.params.userId, req.params.date).then(session => {
			if (session) {
				req.json(session)
			} else {
				req.status(401).json({
					message: "No session found"
				})
			}
		})
	}
	//  check to be sure user is that patients therapist and if not return 401
	//
	//get the list of sessions
});

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