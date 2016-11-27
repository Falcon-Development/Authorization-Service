# Vanderbilt Mobility App API

This repo contains the backend server code for the Vanderbilt-Mobility-App

## Setup

### Google oauth
You will need to use the google developer console generate a client ID, and client secret for this webservice to use.

### Mysql
The app requires a mysql database in order to run. To run a server locally you can either install it on the host machine or use docker.

>Using Docker: Create a directory "mysql" to hold the database files. Then run the command `docker run --name mobility-app-mysql -p 127.0.0.1:3306:3306 -v <path to mysql directory>:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=<your-password> -d mysql:8`. Now connect to it via msql work
>Installing locally: Install mysql, and then connect to it from mysql workbench

### setting up config
You will need to set the configs then for the app. 

There are two ways of doing this. Congfig files, and enviorment vairbles. enviorment vairbles will overide configs.

enviorment varibles: 

GOOGLE_CLIENT_ID must be set to the google client id.
GOOGLE_CLIENT_SECRET must be set to the google client secret.
MYSQL_HOST must be set to the mysql host, for example "localhost".
MYSQL_USER: must be set to the mysql user.
MYSQL_PASSWORD: must be set to the mysql user's password.
MYSQL_DATABASE: the mysql database to connect to.

Config files
A file config.json should contain valuse in this format.

{
    "google": {
        "clientId": yourClientId,
        "clientSecret": yourClientSecret
    },
    "mysql": {
        "host": mysqlHost,
        "user": mysqlUser,
        "password": mysqlPasword,
        "database": mysqlDatabase
    }
}

## Endpoints

All endpoints are authenicated with a google oauth 2.0 access token specified in the access_token request header.

GET /api/marco
Smoke test endpoint repiles polo

POST /api/users/add
requires a patientid set in the body.
Addes the users with the token to the database

GET /api/patients
Gets the paitients assigned to the user specifed by the token. Returns 401 if user is not a theripst

GET /api/sessions
Requires a user_id set in the query stirng.
returns all the sessions assoicated in user_id.

GET /api/sessions/data
Requires a user_id set in the query stirng, and a "date" set in the query string, which must be a url-encoded javascript datetime string.
If the user_id does not equal the one in the access_token or the user_id is not a patient of the user in the access_token then it returns a 401
returns all the session data for a session on that datetime associated with that user_id.

## Project goals

Currently to make a user a theripst, add a session, or do any other sort of administrative task, you have to write raw SQL against the database.
This will not work at scale in production, The next step woulld be to add a set of endpoitns for doing these tasks. They would brobly be protected by basic auth, not google auth, and would only accept a special admin user and paswword.
A GUI would then need to be developed for these endpoints.

## Development Notes

This is written in Node J.S. using ES6 functionality.

I used express for the framework, and passport for the authorization.

I have used bluebird coroutines where possible to simplify async operations. I would greatly recomend using promises (esspically coroutines) over standard callbacks.

I have used the configya libary to handle reading configs from enviorment varibles and config files.

I also recomend using postman to test the endpoints. This provies a GUI for generating the HTTP requests, and getting goolge access tokens.
