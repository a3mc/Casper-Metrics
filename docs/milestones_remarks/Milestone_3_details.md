### Milestone 3 Details

#### The purpose of this document is to help the reviewers to analyze the parts of Milestone 3 of the project and how they correlate with the defined acceptance criteria.

As the development part was already submitted, reviewed and delivered in the first two Milestones, this Milestone is more about the documentation updates and various improvements. All the changes are already live in production and can be observed on [caspermetrics.io](https://caspermetrics.io) and the [API endpoints](https://mainnet.cspr.art3mis.net).


#### Acceptance Criteria and the implementation

- __Check generated metrics in various ways to ensure it’s always accurate;__

We've done an extensive manual and automated research to ensure that system contains and serves valid data. We compared the data served by our API with other external tools and by directly querying. We've also created a bash script that make calls to both API and an RPC node and compares the results. It can be found in the [Validation Tests folder](https://github.com/a3mc/Casper-Metrics/blob/master/docs/validation_tests/)

- __Create technical documentation on the project;__

The full documentation of the Quick Start, Code Overview, Deployment in production, Requirements is created and can be observed in the [Docs folder](https://github.com/a3mc/Casper-Metrics/blob/master/docs/). The code itself also contains comments in parts that need explanation or can be hard to understand.

- __Create user documentation, explaining how to use API;__

The user documentation on how to use the API, limitations and other details is created and available at (caspermetrics.io)[https://caspermetrics.io/docs]. It is available in the `docs` folder as well, in [API Overview](https://github.com/a3mc/Casper-Metrics/blob/master/docs/API_OVERVIEW.md)

- __Create unit and e2e tests to make sure no parts have errors;__

Project contains over a hundred of positive and negative tests covering all the endpoints, including Admin endpoints. Test are located in the [Tests folder](https://github.com/a3mc/Casper-Metrics/blob/master/src/__tests__/acceptance/). The E2E tests are created using Apache jMeter tool and cover the same endpoint that high-load tests (a part of the Milestone 4) do. As well some addditional E2E testing happens in the [Validation Tests](https://github.com/a3mc/Casper-Metrics/blob/master/docs/validation_tests/).Please see Validation and Highload folders for the details

- __Add or alter the endpoints as requested by the community. This may include new metrics to track or more filters to add;__

As been asked by the community members we added complex filters that are available for getting a range of Blocks, Eras or filtering Validators data. This filters can be observed in the [Swagger UI](https://caspermetrics.io/api) and the details are covered in the [Public documentation](https://caspermetrics.io/docs). All new filters are covered with the tests. Also some additional fields were added to the existing endpoints to more easy filter and get the data.

- __Improve and validate caching mechanisms to ensure create performance;__

Caching mechanisms are implemented on the server configuration via two types of cache and are explained in [Deploy In Production](https://github.com/a3mc/Casper-Metrics/blob/master/docs/PRODUCTION.md)

- __Add more graphs, and ability to change dates and parameters when drawing them;__

More charts were added with ability to manually select an Era for the Transfers flow, or to select a range of dates for other charts. Clicking on a point in a chart or on the part of Transfers flow open a separate section with the detailed data. Please explore [Charts](https://caspermetrics.io/charts) for the details.

- __Investigate and validate all differences that other tools or available metrics may return;__

We've been investigating the possible difference by using automated tools, scripts that we made and manually, by comparing data with the available explorers and currently found no significant difference in the general data returned.
