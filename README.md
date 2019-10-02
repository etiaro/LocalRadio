## BLB-Back-End
Baltic League Back-End REST API server based on Node.js + Express.js, and NoSQL Mongo Database.

| HTTP method | URI path | Description |
| ----------- | -------- | ----------- |
| POST | /api/users |  Add user to the database |
| GET | /api/users |  Retrieves all users from database |

### Install

```sh
$ npm install
```

### Run

```sh
$ npm run dev
```

### Build

```sh
$ npm run build
```





### TO BUILD
after npm run build you have to add
```javascript
require("babel-core/register");
require("babel-polyfill");
```
and add Music folder to get working non-dev build
(node index.js/ pm2 start index.js)
