# Vanderbilt Mobility App API

This repository contains the backend server code for the Vanderbilt-Mobility-App

## Setup

### Google oauth
You will need to use the google developer console generate a client ID, and client secret for this web-service to use.

The access tokens will need `openid profile` level access.

### Mysql
The app requires a mysql database in order to run. To run a server locally, you can either install it on the host machine or use docker.

>Using Docker: Create a directory "mysql" to hold the database files. Then run the command `docker run --name mobility-app-mysql -p 127.0.0.1:3306:3306 -v <path to mysql directory>:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=<your-password> -d mysql:8`. Now connect to it via msql workbench

>Installing locally: Install mysql, and then connect to it from mysql workbench.

Once you have connected to the database, run schema.sql to create all the tables needed for the API.

#### Adding test data

>Note: values to replace are shown in <>

Start the API and use the `/api/users/add` endpoint to add two users.

Choose one to become the therapist and update the database using a SQL statement like

```UPDATE users SET isTherapist=1 WHERE id=<google-open-id-of-therapist>;```

Then make the other user a patient of the therapist by running a SQL statement like 

```INSERT INTO TherapistPatientLink (patient, therapist) VALUES (<open-id-of-patient>, <openid-of-therapist>);```

Finally add a session for the patient by running a command like:

```
INSERT INTO SessionData (patient, type, jsonData, acquisitionDate, metadata) VALUES (<open-id-of-patient>, "DGI", <json-string-for-DGI>, CURDATE(), "M11")
```

> for the json value you can use a small snippet for testing the api such as
> ```
>[{
>    \"TS\": \"11:53:12:956\",
>    \"HAx\": -0.112253,
>    \"HAy\": -0.2063109,
>    \"HAz\": 0.9845038,
>    \"Gx\": -4.273233,
>    \"Gy\": 7.334367,
>    \"Gz\": -0.2253242,
>    \"f0\": 139.5667,
>    \"f1\": 15.66947,
>    \"f2\": 250.9928,
>    \"f3\": 1080.784,
>    \"f4\": 201.43,
>    \"f5\": 0,
>    \"roll\": -10.81105,
>    \"pitch\": -5.48577
>}, {
>    \"TS\": \"11:53:12:988\",
>    \"HAx\": -0.119751,
>    \"HAy\": -0.2353719,
>    \"HAz\": 0.9761833,
>    \"Gx\": -4.067383,
>    \"Gy\": 7.506714,
>    \"Gz\": -0.194397,
>    \"f0\": 139.5164,
>    \"f1\": 15.66941,
>    \"f2\": 250.9776,
>    \"f3\": 1080.734,
>    \"f4\": 201.42,
>    \"f5\": 0,
>   \"roll\": -12.40567,
>    \"pitch\": -5.75157
>}, {
>    \"TS\": \"11:53:13:19\",
>    \"HAx\": -0.1152344,
>    \"HAy\": -0.2469482,
>    \"HAz\": 0.9778314,
>    \"Gx\": -3.379417,
>    \"Gy\": 7.775379,
>    \"Gz\": 0.3952708,
>    \"f0\": 139.7165,
>    \"f1\": 15.66841,
>    \"f2\": 250.9288,
>    \"f3\": 1080.154,
>    \"f4\": 201.45,
>    \"f5\": 0,
>    \"roll\": -13.15085,
>    \"pitch\": -5.498623
>}]"
>```
> 
>But for a testing the full app, you will most likely want to load a full example session into the database. To generate that json, take one of Josh's example CSVs and run it through an online json converter. I found a CSV to json converter fairly easily on google. Copy the resulting json and past it into a file. Then run find and replace for the " character to replace it with the escaped double quote \". Now you have a the contents of the json string for the insert statement.

### Configuration
You will then need to set the configuration settings for the service. 

There are two ways of doing this: configuration files and environment variable. Environment variable will override configs.

Environment variables: 

```
GOOGLE_CLIENT_ID must be set to the google client id.
GOOGLE_CLIENT_SECRET must be set to the google client secret.
MYSQL_HOST must be set to the mysql host, for example "localhost".
MYSQL_USER: must be set to the mysql user.
MYSQL_PASSWORD: must be set to the mysql user's password.
MYSQL_DATABASE: the mysql database to connect to.
```

Config files

A file config.json should contain values in this format.

```
{
    "google": {
        "client": {
            "id": null,
            "secret": null
        }
    },
    "mysql": {
        "host": null,
        "user": null,
        "password": null,
        "database": null
    }
}
```

## Endpoints

All endpoints are authenticated with a google oauth 2.0 access token specified in the access_token request header.

Method| Path | Description
--- | --- | ---
GET | /api/marco | Smoke-test endpoint

Response example:
```
polo
```

Method| Path | Description | Parameters
--- | --- | --- | ---
POST | /api/users/add | Adds the users with the token to the database | requires a userId set in the body.

> Note this will be the hospital patient id. It is only used here. All other endpoints use the google account id.

Example request body.
```
{
	"userId": "ejs4j"
}
```

Example Response
```
{
    "message": "done"
}
```

Method| Path | Description
--- | --- | ---
GET | /api/patients | Gets the patients assigned to the user specified by the token. Returns 401 if user is not a therapist.

Example Response
```
[
  {
    "patientID": "someHospitalId",
    "id": "012345678901234567890",
    "isTherapist": 0
  }
]
```


Method| Path | Description | Parameters
--- | --- | --- | ---
GET | /api/sessions | returns all the sessions associated in user_id.| Requires a user_id set in the query string.

>Note this is the google user id...

Example response body.
```
[
  {
    "patient": "012345678901234567890",
    "type": "DGI/SM",
    "acquisitionDate": "2016-11-20T06:00:00.000Z"
  }
]
```

Method| Path | Description | Parameters
--- | --- | --- | ---
GET | /api/sessions/data | Returns all the session data for a session on that datetime associated with that user_id. If the user_id does not equal the one in the access_token or the user_id is not a patient of the user in the access_token then it returns a 401 | Requires a user_id set in the query string, and a "date" set in the query string, which must be a url-encoded javascript datetime string.

>Note this is the google user id...

Example response body.
```
{
  "patient": "012345678901234567890",
  "type": "DGI/SM",
  "acquisitionDate": "2016-11-20T06:00:00.000Z",
  "metadata": "What ever metadata you would like. 50 character max",
  "data": [
    {
      "TS": "11:53:12:956",
      "HAx": -0.112793,
      "HAy": -0.2064209,
      "HAz": 0.9840088,
      "Gx": -4.276733,
      "Gy": 7.334747,
      "Gz": -0.2243042,
      "f0": 139.5165,
      "f1": 15.66941,
      "f2": 250.9788,
      "f3": 1080.754,
      "f4": 201.44,
      "f5": 0,
      "roll": -10.81005,
      "pitch": -5.48467
    },
    {
      "TS": "11:53:12:988",
      "HAx": -0.119751,
      "HAy": -0.2359619,
      "HAz": 0.9761963,
      "Gx": -4.067383,
      "Gy": 7.506714,
      "Gz": -0.194397,
      "f0": 139.5165,
      "f1": 15.66941,
      "f2": 250.9788,
      "f3": 1080.754,
      "f4": 201.44,
      "f5": 0,
      "roll": -12.40567,
      "pitch": -5.75157
    }
  ]
}
```

## Project goals

Currently to make a user a therapist, add a session, or do any other sort of administrative task, you have to write raw SQL against the database.
This will not work at scale in production, The next step would be to add a set of endpoints for doing these tasks. They would probably be protected by basic auth, not google auth, and would only accept a special admin user and password.
A GUI would then need to be developed for these endpoints.

## Development Notes

This is written in Node J.S. using ES6 functionality.

I used express for the framework, and passport for the authorization.

I have used bluebird co-routines where possible to simplify async operations. I would greatly recommend using promises (especially co-routines) over standard callbacks.

I have used the configya library to handle reading configs from environment variables and config files.

I also recommend using Postman to test the endpoints. This provides a GUI for generating the HTTP requests, and getting Google access tokens.

I used eslint to help enforce coding style when I was writing this. I would also recommend you use this as well. 

I also recommend using visual studio code for development. It has an integrated node debugger, and allows you to set environment variables easily. It also has an extension that highlights eslint errors. Here is an example launch.json for vscode.

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch",
            "type": "node",
            "request": "launch",
            "program": "${workspaceRoot}/bin/www",
            "stopOnEntry": false,
            "args": [],
            "cwd": "${workspaceRoot}",
            "preLaunchTask": null,
            "runtimeExecutable": null,
            "runtimeArgs": [
                "--nolazy"
            ],
            "env": {
                "NODE_ENV": "development",
                "GOOGLE_CLIENT_ID": "my client id",
                "GOOGLE_CLIENT_SECRET": "my client secret",
                "MYSQL_HOST": "mysql host",
                "MYSQL_USER": "mysql user",
                "MYSQL_PASSWORD": "mysql password",
                "MYSQL_DATABASE": "mysql database"
            },
            "console": "internalConsole",
            "sourceMaps": false,
            "outFiles": []
        },
        {
            "name": "Attach",
            "type": "node",
            "request": "attach",
            "port": 5858,
            "address": "localhost",
            "restart": false,
            "sourceMaps": false,
            "outFiles": [],
            "localRoot": "${workspaceRoot}",
            "remoteRoot": null
        },
        {
            "name": "Attach to Process",
            "type": "node",
            "request": "attach",
            "processId": "${command.PickProcess}",
            "port": 5858,
            "sourceMaps": false,
            "outFiles": []
        }
    ]
}
```
