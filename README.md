## LocalRadio
Radio system with online access and management written in node.js, ES6 standard

### Usage
Empty MySQL database with charset ```utf8mb4``` and ```utf8mb4_unicode_ci``` collation needs to be set up, LocalRadio will automatically create tables.

Clone reposity

```database.js``` and ```general.js``` files in ```src/config``` directory have to be present\
Refer to example config files in this directory

Run
```sh
$ npm install
$ cd public
$ npm install
$ cd ..
$ npm start
```
Then you can access panel at http://localhost
and log in to administration panel at http://localhost/password

### Run Development mode
Run this in main folder for back-end development mode(site will be hosted at localhost)
```sh
$ npm run dev
```
And this in /public folder for front-end development mode(dev ver. of site will be hosted at localhost:3000)
```sh
$ npm start
```

### Project tree
/ - main directory of babel-rc app
/public - main directory of react front-end

/src - back-end source code
/public/src - front-end source code

/dist - bulit back-end
/public/build - built front-end
