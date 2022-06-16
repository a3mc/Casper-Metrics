### Code Overview

#### API Framework and Standards

The API backend is built on top of the IBM's `Loopback 4` framework, that has been proved to be a winning solution for NodeJS API applications.

We follow the common code style throughout the project, with comments in the parts that are not self-explanatory or can be hard to understand.

Most of the code is written in Typescript.

All public endpoints are read-only and are available in the OpenApi specification. You can find more details and examples on how to use API in the [API Overview](https://github.com/a3mc/Casper-Metrics/blob/master/docs/API_OVERVIEW.md) document.

Admin endpoints are not expected to be consumed directly, so they are protected and undocumented in the OpenAPI specs.

#### Tests

To ensure the system is stable and secure, all endpoints are covered with the acceptance tests, including complex scenarios of using Admin endpoints.
When running the tests suite, an in-memory database is used instead of the MySQL one, populated with mock data. That ensures that nothing can be broken in the production database, and we can test various negative and positive cases.
You may also find that some tests can serve as examples and give expiration when you build your project that communicates with the API.

#### Project structure

Project consists of three parts, each in a separate repository. The backend part has a crawler and serves the API endpoints.

Two more projects are Frontend interfaces and are built using Angular. There's a public part that renders the charts and provides a Swagger interface and an Admin part. Both frontend projects communicate with backend via the API calls.

#### Database

We use MySQL 8 database to store the data. There are a few caching layers in the Nginx set up in production that ensures the high response rate. Some requests are cached for a short time, and others longer.

Database tables were designed in a way to be performant as possible. They are created, along with all the fields from the Models that you can observe in the `/models` folder.

By utilizing the Loopback's capabilities, it's easy to run database migrations with a just single command. Additionally, we use Redis for the help of fast storage when crawling and in-memory db, that uses the same models as the main one for running tests.

#### Error handling

While the system is designed to be stable and is covered with tests, there's always a possibility of a network error when make an RPC call to fetch some data. We store temporary marks in Redis to ensure that Block was crawled fully and successfully. But in case if error occurs, system knows about that and re-crawls the block in the next loop, typically in a few seconds. If some critical error happens, we immediately receive a notification about that, and in case if the process was terminated it gets restarted automatically by the PM2 tool.

#### Controllers

Most of the controllers, except the Crawler, serve the API endpoints and follow the standard *Loopback 4* architecture. They are quite isolated and well controlled with the help of decorators and schemas. Lots of extra checks and performance optimizations are used in some methods. Such controllers are triggered when an external request comes to the API.

#### Configuration

Main parameters for the system to run are set in the `.env` file that you should create in the root folder, based on the `example.env`, which provides comments about the usage and purpose of each parameter. There's also another configration file that stores some constants related to the Network. You can find it in the `configs/networks.ts`. While only the *Mainnet* is currently supported it's possible to run in on other networks by modifying this file.

#### Logging

We use Winston with some extensions to write logs. The verbose level can be set in the `.env file`. Normally `info` is enough, but in case if you run it in the `debug` mode, log files can grow huge and some log-rotate process helps to keep them in the adequate size.

Each verbose level log is stored in a separate file, with timestamps for each message, making it easy to debug problems if there are any.

For the `error` level that indicates critical problems, a separate notification is sent to a dedicated Telegram channel where our dev-ops can react ASAP to investigate and fix the problem.

#### Interceptors

While most of the REST operations is handled by the framework, following the options and decorators in the controllers, there's a special interceptor in `interceptors/authorize.interceptor.ts` that is dedicated to protect admin endpoints from the unneeded access. Protected endpoints provide various checks and rely on the JWT token that admin obtains after logging into the admin sections. There are three *roles* of admins that can access it, and each role is checked for performing various actions. It also fully covered with tests to ensure it's fully secure. Signing up is possible only by a special invitation provided by the administrator and strong passwords, email verification and 2FA are enforced for these users. 

#### OpenApi specification

API automatically builds an OpenApi v3 JSON file that can be used in Swagger and other tools to get used to the API calls and explore the possibilities. Admin endpoints remain undocumented there.

#### Crawler

To speed up the crawling a few processes running in parallel and controlled by PM2 are used.

There's an external crawling service that we've built to get information about active RPC nodes, but the code comes with a dump that can be efficiently used without the need to update the nodes list for a long time.
To achieve the perfect ratio of the crawling speed and at the same time to prevent hitting RPC's and network limits there are a few parameters set in the `.env` file that control the crawling behaviour. 

The crawling process happens in cycles. A typical cycle follow a few steps:

- Check the communication with the separate workers processes;
- Update prices and peers information from external services if it's configured (it's optional for system to work);
- Create a connection to available RPC nodes and use only those that are active, respond in the given time and return the same last block height;
- Schedule a batch of blocks to crawl and distribute them evenly between the workers;
- When creating each block, all transfers and deploys are queried and processed.
- If requests in a batch had any network errors, these blocks will be re-crawled in the next cycle;
- If batch was fully successful, it launches a process that creates Eras and calculates some values, that can't be calculated asynchronously and need a certain amount of blocks to be crawled in the order, without gaps.
- The cycle repeats.

Normally, after the full catchup, and when all database is populated there's just one block in the queue.

Records in Redis are used to mark blocks as crawled or calculated. That helps the system to always start from the correct state, even if it was stopped for some reason.

#### CasperMetrics.io frontend

This web platform consumes data from the API and can plot various graphs. It may serve as a good example and starting points for the projects you may want to build upon this API.

#### Run modes

Everything can be installed on a single machine, but it's possible just to run only the crawler, or just to serve the API GET endpoints. That allows to split it in production and to have multiple machines just serving API and being cover by a balancer. Please see the [Deploy In Production](https://github.com/a3mc/Casper-Metrics/blob/master/docs/PRODUCTION.md) for more details on the production set up.
