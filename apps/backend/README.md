# Sports Exchange and Casino Betting Backend

This is the backend of a sports and casino betting application built with Node.js and TypeScript. It includes essential configurations, API endpoints, and functionality for user authentication, data processing, real-time interactions, platform management and more.

## Table of Contents

- [Prerequisites](#Prerequisites)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)

## Prerequisites

- Node.js (v14 or higher recommended)
- TypeScript (included in project)
- MongoDB (or any other database supported by Mongoose)


## Getting Started
- Clone the repository
```
git clone  https://github.com/newstable/casino-api.git
```
- Install dependencies
```
cd casino-api
npm install
```

## Scripts
| Npm Script | Description |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `start`                   | Runs full build and runs node on dist/index.js. Can be invoked with `npm start` `yarn start`                  |
| `build`                   | Full build. Runs ALL build tasks       |
| `dev`                   | Runs full build before starting all watch tasks. Can be invoked with `npm dev` `yarn dev`                                         |
| `test`                    | Runs build and run tests using mocha        |
| `lint`                    | Runs TSLint on project files       |
| `format`                    | Runs format on project files       |
| `watch`                    | Runs format realtime on project files       |

## Environment Variables
```
# Port number
PORT=

NODE_ENV= production | development

# URL of the Mongo DB
DATABASE_URL=mongodb://[host | ip:port]/[db_name]

APP_URL=http://mainapp_domain

# JWT
# JWT secret key
JWT_SECRET=gambling-backend
# Number of minutes after which an access token expires
JWT_ACCESS_EXPIRATION_MINUTES=43200
```