### Code Overview

*This document will be updated with more details in the Milestone 3 of the project.*

#### API Framework and Standards

The API backend is build on top of the IBM's `Loopback 4` framework, that has been proved to be a winning solution for NodeJS API applications.

We follow the common code style throughout the project, with comments in the parts that are not self-explanatory or can be hard to understand.

All code is written in Typescript.

All public endpoints are read-only and are available in the OpenApi specification.
Admin enpoints are not expected to be consumed directly, so they are protected and undocumented in the OpenAPI specs.

#### Tests

To ensure the system is stable and secure, all endpoints are covered with the acceptance tests, including complex scenarios of using Admin endpoints.
When running the tests suite, an in-memory database is used instead of the MySQL one, populated with mock data. That ensures that nothing can be broken in the production database, and we can test various negative and positive cases.

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
