# Setup Notes

## Pre-requisites
1. node =0.12.5
2. mongodb

## Installation
1. Download dist zip (toastio-1-0-0.zip)
2. Unzip into application directory
3. run ```npm install``` to install node modules

## Set up
1. Point application to mongodb instance
  In ```server/config/environment/production.js```
    - point mongo.uri to application database
    - point mongo.sessionuri to session database
2. Create administrative user(s)
    In ```server/config/seed/user/seedData.js```
    - Add accounts to ```module.exports.all``` array
    - example
    ```
      {
        username: 'administrator@admin.com', // The email format is necessary in order to log in :/
        groups: ['administrators'],
        password: 'administrator',
        fullName: 'Administrator',
        organization: null,
        comments: null,
        address: {
        	addr1: null,
        	addr2: null,
        	city: null,
        	stateProv: null,
        	postalCode: null,
        	country: null
        }
      }
    ```
3. Set cookie secret values
    In ```server/config/environment/index.js``` on lines 29 and 30. Change these values to something secret.

## Running
1. Execute ```node server/app.js --init:all``` to initialize the database. If the database exists, all data will be wiped so be sure to confirm the value set in Set Up#1
2. If the application has already been initialized just run ```node server\app.js```

