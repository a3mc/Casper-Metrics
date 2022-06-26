### Milestone 4 Details

#### The purpose of this document is to help reviewers to analyse the parts of Milestone 4 of the project and how they correlate with the defined acceptance criteria.

As the development part was submitted, reviewed and delivered in the first two Milestones, documentation, improvements and additional tests were submitted in Milestone 3, this Milestone is about load testing and making sure the system is production ready. All the changes are live in production and can be observed on [caspermetrics.io](https://caspermetrics.io) and the [API endpoints](https://mainnet.cspr.art3mis.net) accordingly.

#### Acceptance Criteria and the implementation

__At this stage API is ready for well enough load and provide data to users without visible restrictions.__

As our [end-to-end](https://github.com/a3mc/Casper-Metrics/blob/master/e2e/e2e.sh) testing and [load testing](https://github.com/a3mc/Casper-Metrics/blob/master/e2e/Reports/) analysis shows, the system is fully ready to be used by the end users. Here are the details on what was done and how we measured its productivity.

#### Details of what was delivered in milestone

- __Improve load balancers and prepare for easy scaling when needed;__

Load balancer is production ready now and can upscale in its performance pointing to more replica operator servers if needed. As tests show it's good enough now.

- __Load testing of the endpoints and static frontend. Estimate the amount of requests / connections per second, that system can handle without the need of scaling;__

The load was tested heavily under various conditions from a separate, very performant servers. We used Apache jMeter, as well as other tools to find the optimal load that current configuration can handle. That also gives us information, what needs to be done if we want to handle more load. The report can be observed [here](http://161.97.84.146/load-test/) and also available together with the scenario script used for testing in the [e2e](https://github.com/a3mc/Casper-Metrics/blob/master/e2e/) folder.

The static front is set up on AWS, using CloudFront with the top settings and edge availability for all locations. As for now we don't have any doubt in its performance and availability.

- __Move the project to a performant dedicated server;__

We've set up a MySql Cluster and the code base on performant dedicated bare-metal servers. Built with scalability in mind, the architecture allows us to add more Replicas and additional servers if the load on the API increases. However, as our [load testing](http://161.97.84.146/load-test/) demonstrates, the system is perfect to be used for production purposes for now.

- __Add integration with the explorer, through any external explorer or by using SDK if needed;__

We use SDK and direct calls to RPC nodes when crawling, but we've also added some handy links to the [external explorer](https://cspr.live) on our [frontend](https://caspermetrics.io/charts). When you select some transfer or a validator on the map, you'll see the accounts and buttons to copy the link on to just open in straight in the external explorer in a new tab.

- __Testing the load.__

As previously mentioned, we tested the load from external servers, as well as were monitoring the actual load of servers while performing these tests. While we can see how to scale up the system, currently it's well-balanced as the [Reports](http://161.97.84.146/load-test/) show.

__Need to mention, for load tests we disabled the rate limit. Rate limit will be adjusted accordingly after the review and balanced time to time based on the platform usage and user needs.__
