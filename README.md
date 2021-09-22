# Casper Metrics

Purpose of this application is to serve accurate metrics data crawled and analysed from Casper Blockchain.

There is an asynchronous crawler that collects data from RPC servers. There's a list of 30 servers in the environment files that you can modify. By default, it uses a cluster of 4 workers, each making requests to this servers.
Swagger interface for the endpoints can give some insight on the data structure and how to make queries.
Admin part is a separate app that makes requests to the protected API. It has possibilities to find and approve transactions that were unlocked as well as changing the amount of locked Validators.

## Prerequisites

Please make sure you have the following installed:

- Nginx
- PM2
- Node 16+
- MySQL 8+
- Redis

Please pre-create two database, one for dev and for production environment:
metrics (prod) and metricsdev (dev). The exact db names can be configured.

Database structure will be created when running 'migrate' commands.

```sh
npm install
```

To only install resolved dependencies in `package-lock.json`:

```sh
npm ci
```

## Run the application

You may want to edit environment file to set your preferred ports.
Create a .env file in the root directory and set up your MySQL and Telegram (optional) credentials. There's an example.env file you can copy and edit.

### For production mode:

`npm run migrate && npm run build:prod && pm2 reload ecosystem.config.js`

### For development mode:

`npm run migrate && npm run build && pm2 reload ecosystem.config.js`

There's an environment file additionally to .env, that you don't need to change to run the project, but if you wish to alter something there it can be found in `environments` directory. When you you build the project in production mode it uses prod file, and when in dev - dev file. TODO: some settings will be moved to .env to simply the setup.

Application needs a reverse proxy to be set for to ports, set it environment.ts file. One is used for the public front, and another for admin. The latter needs to be protected.

## URLs to access the application

Ports are specified in the environment configuration files.
By default the prod build will open the front page on http://localhost:3000 and the admin panel on http://localhost:3004.
Dev environment uses 3002 and 3003 ports respectively.

It's supposed to forward these ports to external ports using NGINX (or another) reverse-proxy. THat's not required during testing or development.

## Rebuild the project

To incrementally build the project:

```sh
npm run build
```
OR:
```sh
npm run build:prod
```

To force a full build by cleaning up cached artifacts:

```sh
npm run rebuild
```
OR:
```sh
npm run rebuild:prod
```

## Running on a clean database

On the first run, crawler will use 4 processes to asyncronously parse blocks and transactions starting from genesis. This may consume some resource. You can adjust the crawling speed my launching less/more processed or by adjusting parallel limit of each process. See `_parallelLimit` in workers/crawler.worker.ts

## Regular operation

When database is crawled, only new blocks get indexed. That doesn't cosume any significant resources. TODO: The number of connected RPC servers will be adjusted for regular routine crawling.

## Other useful commands

- `npm run migrate`: Migrate database schemas for models
- `npm run migrate:erase`: Erase and migrate dev database schemas for models
- `npm run migrate:erase:prod`: Erase and migrate production database schemas for models

## Tests

As acceptance tests require the database to be filled with data, please make sure indexing and calculation is complete.
You may run on either DEV or PROD env.

To run tests using DEV environment:
```sh
npm run test
```
To run tests using PROD environment:
```sh
npm run test:prod
```

## Structure

There are two webapps, one for the public frontend and another is for admin panel.
Admin part consists of admin enpoints API and a frontend. You can find admin panel code in /admin-ui
It's a sub-project written in Angular. Please run inside the folder:

[Please note that admin app is presented here as a Milestone 2 part]

Admin UI has to be served under protected domain. Currently, Basic Http Auth is used to protect it.
Both Frontend and Admin parts expose their API endpoints.

From the admin-ui directory run the following:

`npm install && npm run build`

Admin part is supposed to be protected with Basic Http Auth for now. Web auth with JWT token will be presented in the upcoming update.

## Security considerations

Public Frontend part is a read-only app, so unless there's anything that can compromise db access, it should be safe. Nevertheless, please kindly report any issues or doubts in the Github sections of this repository and they'll be addressed ASAP.

Admin part is much more sensitive, as it allows writing to db. Currently the solution was to use BASIC-HTTP-AUTH to cover its enpoints and the interface to prevent any possible security holes. A more sofisticated auth is in the development and will be released after the testing stage.

## Documentation

Most of the code is self-explanatory, and swagger interfaces can give you some insight how to work with the enpoints. But we are preparing full documentation that will be release as a part of Milestone 3.

## Contributing

You are welcome to add your suggestions and to contribute to the project. Please create a PR against develop branch and it will be reviewed shortly.

## License

This project is licensed under MIT.

## Working Front version example

https://cspr.rpc.best/explorer/

## Admin UI screenshot

![admin demo](https://github.com/a3mc/casper-metrics/blob/master/public/admin1.png?raw=true)

## Front API screenshot

![admin demo](https://github.com/a3mc/casper-metrics/blob/master/public/front1.png?raw=true)





