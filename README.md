# Casper Metrics

Purpose of this application is to serve accurate metrics data crawled and analysed from Casper Blockchain.

There is an asynchronous crawler that collects data from RPC servers. By default, it uses a cluster of 4 workers, each making requests to this servers.
Swagger interface for the endpoints can give some insight on the data structure and how to make queries.
Admin part is makes requests to the protected API endpoints. It has possibilities to find and approve transactions that were unlocked as well as changing the amount of locked Validators.

## Prerequisites

Please make sure you have the following installed:

- Nginx (Optionally, not needed to for local testing)
- PM2
- Node 16+
- MySQL 8+
- Redis (default port, no password)

Please pre-create a database and a user.
Create .env file with all connection parameters.
Carefully review the example.env with the instructions.
Database structure will be created when running 'migrate' commands.


App has documented, public enpoints for the Front App that can be observed here in action:
https://caspermetrics.io

It can be also used as an API for any service that needs this data.

Depending on the app configuration it can serve as just a Public API, or as an Admin API as well.
Admin API endpoints are protected and require logging in. The front for the admin part can be observed here:
https://admin.caspermetrics.io

API, Public Front and Admin Front are now three separate apps, living in different repositories:



Once you have all set up, install the app.

```sh
npm install
```

Create DB structure by running:

```shell
npm run migrate
```
Make sure you have create an empty MySQL database and a user with sufficient permissions and set up your .env file.

## Testing

To make sure that all is set up correctly run the suite of tests by executing:

```sh
npm run test
```

If all was set up correctly, all tests should pass. For tests, an empty in-memory database is created, filled with mock
values that are identical in their structure to those used in the production database.

## Initial catch up

When you start with an empty database, it will take quite a while to get all blocks crawled and eras created.
Even though it's well optimised, it may consume quite some CPU, memory and network traffic.

As blocks are crawled asynchronously, in batches, but in random order, the front and admin apps can be not fully functional
or provide partial data until it finishes and stabilizes.

As an option you can import a database with precrawled blocks and eras, that will **save your time**.

## Run the application

There are two options how the app can run together with the Crawler Workers, that will collect new blocks and Eras,
or just as a server of existing data, which can be useful when there are a few servers and a balancer are used, and you
want a few of them just to serve data, without crawling or Admin functions.

To run everything at once type:

```sh
npm run start
```

That will launch the main app as well as 4 crawlers that crawl blocks.
You can see more options in `package.json` and `ecosystem.config.js`.
As it is launced with PM2 manager you can observe the status and see the logs with the following commands:

```sh
    pm2 status
```

```sh
    pm2 log all
```

You can optionally set log level to "debug" in the `.env` file to get more verbose response.

If all is set up correctly you should be able to access your application on the port you've set, by default
it should be accessible at `http://localhost:3000`

There's no front indented to be served by the app so the root will show just a "Welcome!" message.
You can set up and run Front and Admin apps to get the full use of API.

Please refer to their dedicated repositories on how to set them up and run.

## URLs to access the API

The best way would be to start with the API section of the front app (https://caspermetrics.io)
There you can see what kind of requests you can make.

For example `http://localhost:3000/block` to get the last block.

Admin enpoints are not documented in the `openapi` spec file and most of them are protected with a JWT token,
that is set up to live for 24 after the login. Please see the `example.env` file on how to configure it and access for the first time.

## Rebuild the project

To incrementally build the project:

```sh
npm run build
```

## Structure

When in the last version there were two apps inside one - for public and admin, now the API for bot is just a one app,
and front projects migrated for the dedicated repositories. That helps to keep the project better organized and to prevent
unnecessary code duplication and overlapping.

## Security considerations

Public enpoints are read-only, so unless there's anything that can compromise db access, it should be safe. Nevertheless, please kindly report any issues or doubts in the Github sections of this repository and they'll be addressed ASAP.

Admin part is more sensitive, as it allows writing to db. It is covered with lots of checks to prevent unauthorised access.

### Admin role

There are three roles for the admin area.

The first logged in user (see `example.env`) gets the Administrator role and can invite new users.

Once a new user is invited (via link in the email) - they first have to set up their password and 2FA before they can log in.
New users get a "Viewer" role by default, meaning that they can see everything (except the users list) but can't take any action.
Once new user has set up his account, admin can change their role to "Editor" or "Administrator".
The only difference between "Editors" and "Administrators" is that the latter can edit users while "Editors" can't.


## Documentation

Most of the code is self-explanatory, and swagger interfaces can give you some insight how to work with the enpoints.
We've added more comments in the difficult parts of the code and we are preparing a full documentation that will be released as a part of Milestone 3.

## Contributing

You are welcome to add your suggestions and to contribute to the project. Please create a PR against develop branch and it will be reviewed shortly.

## License

This project is licensed under MIT.

## Working Front version example

https://caspermetrics.io

## Admin UI 

https://admin.caspermetrics.io



