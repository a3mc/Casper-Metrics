# Casper Metrics

Purpose of this application is to serve accurate metrics data crawled and analysed from Casper Blockchain.

There is an asynchronous crawler that collects data from RPC servers. There's a list of 30 servers in the environment files that you can modify. By default, it uses a cluster of 4 workers, each making requests to this servers.
Swagger interface for the endpoints can give some insight on the data structure and how to make queries.
Admin part is a separate app that makes requests to the protected API. It has possibilities to find and approve transactions that were unlocked as well as changing the amount of locked Validators.

## Install dependencies

Please make sure you have the following installed:

- Nginx
- MySQL 8+
- PM2
- Node 16+
- Redis

```sh
npm install
```

To only install resolved dependencies in `package-lock.json`:

```sh
npm ci
```

## Run the application

You may want to edit environment files to set your preferred ports.
Set up your MySQL credentials in datasources/metrics-db.datasource.ts

For development mode omit :prod.

npm run migrate && npm run build:prod && pm2 reload ecosystem.config.js

## Rebuild the project

To incrementally build the project:

```sh
npm run build
```

To force a full build by cleaning up cached artifacts:

```sh
npm run rebuild
```

## Other useful commands

- `npm run migrate`: Migrate database schemas for models
- `npm run migrate:erase`: Erase and migrate database schemas for models

## Tests

```sh
npm run test
```

## Structure

There are two webapps, one for the public frontend and another is for admin panel.
You can find admin panel code in /admin-ui
It's a sub-project written in Angular. Please run inside the folder:

Admin UI has to be served under protected domain. Currently, Basic Http Auth is used to protect it.
Both Frontend and Admin parts expose their API endpoints.

`npm install && npm run build
`

## Working Front version

https://cspr.rpc.best/explorer/

## Admin UI screenshot

![admin demo](https://github.com/a3mc/casper-metrics/blob/master/public/admin1.png?raw=true)

## Front API screenshot

![admin demo](https://github.com/a3mc/casper-metrics/blob/master/public/front1.png?raw=true)





