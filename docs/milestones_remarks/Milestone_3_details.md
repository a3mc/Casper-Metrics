### Milestone 3 Details

#### The purpose of this document is to help reviewers to analyse the parts of Milestone 3 of the project and how they correlate with the defined acceptance criteria.

As the development part was submitted, reviewed and delivered in the first two Milestones, this Milestone is more about the documentation updates and various improvements. All the changes are live in production and can be observed on [caspermetrics.io](https://caspermetrics.io) and the [API endpoints](https://mainnet.cspr.art3mis.net) accordingly.


#### Acceptance Criteria and the implementation

- __Check generated metrics in various ways to ensure it’s always accurate;__

We've done an extensive manual and automated research to ensure that system contains and serves valid data. We compared the data served by our API with queries from mainnet active validator directly. We've created a bash script that make calls to both API and a mainnet RPC and compares the results. It can be found in the [E2E](https://github.com/a3mc/Casper-Metrics/blob/master/e2e/e2e.sh).

- __Create technical documentation on the project;__

The full documentation of the Quick Installation, Code Overview, Deployment in production, Hardware Requirements is created and can be observed in the [Docs folder](https://github.com/a3mc/Casper-Metrics/blob/master/docs/). The code itself contains comments in parts that need explanation or theoretically can be hard to understand.

- __Create user documentation, explaining how to use API;__

The user documentation on how to use the API, limitations and other details is created and available at [caspermetrics.io](https://caspermetrics.io/docs). It is also available in the `docs` folder, in [API Overview](https://github.com/a3mc/Casper-Metrics/blob/master/docs/API_OVERVIEW.md)

- __Create unit and e2e tests to make sure no parts have errors__

Project contains over a hundred of positive and negative tests covering all the endpoints, including Admin endpoints. Tests are located in the [Tests folder](https://github.com/a3mc/Casper-Metrics/blob/master/src/__tests__/acceptance/). The E2E tests and load tests are created, and can be found in [E2E](https://github.com/a3mc/Casper-Metrics/blob/master/e2e/) folder.

- __Add or alter the endpoints as requested by the community. This may include new metrics to track or more filters to apply__

As been asked by the community members we added complex filters that are available for getting a range of Blocks, Eras or filtering Validators data, output limit has been increased to 1000 to help one of the researcher from community to achieve his goals, we made switch blocks available with single query, this simplifies any sorts of research process as crawling through chain data is not necessary. This filters can be observed in the [Swagger UI](https://caspermetrics.io/api) and the details are covered in the [Public documentation](https://caspermetrics.io/docs). All new filters are covered with the tests. Additional fields were added to the existing endpoints to simplify usage. Swagger interface has been updated accordingly, filters can be used from web interface wisely. We've also added a more accurate block time, as was requested by a community member.

- __Improve and validate caching mechanisms to ensure greater performance;__

Caching mechanisms implemented on the servers are configured via multiple types of cache rules which contain micro cache, archive cache, each type of cache type are custom for public and admin endpoints, cache stored in multiple mounted tmpfs partitions. Details are explained in [Deploy In Production](https://github.com/a3mc/Casper-Metrics/blob/master/docs/PRODUCTION.md)

- __Add more graphs, and ability to change dates and parameters when drawing them;__

More charts were added with ability to manually select an Era for the Transfers flow, or to select a range of dates for other charts. Clicking on a point in a chart or on the part of Transfers flow opens a separate section with the detailed data, transfers flow is following the selected eras automatically. Links have been added close to the addresses and transactions ID’s fields, thus giving ability to observe additional data on the external explorer cspr.live as easy as in one click. Please explore [Charts](https://caspermetrics.io/charts) for more details.

- __Investigate and validate differences that other tools or available metrics may return;__

We've been investigating the possible difference by using automated tools, scripts that we made and manually, by comparing data with the available explorers and currently found no difference in the general data returned.
