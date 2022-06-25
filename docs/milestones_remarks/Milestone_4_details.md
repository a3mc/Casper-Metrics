### Milestone 4 Details

#### The purpose of this document is to help reviewers to analyse the parts of Milestone 4 of the project and how they correlate with the defined acceptance criteria.

As the development part was submitted, reviewed and delivered in the first two Milestones, documentation and improvements tests were submitted in Milestone 3, this Milestone is about load testing and making sure the system is production ready. All the changes are live in production and can be observed on [caspermetrics.io](https://caspermetrics.io) and the [API endpoints](https://mainnet.cspr.art3mis.net) accordingly.

#### Acceptance Criteria and the implementation

__At this stage API is ready for well enough load and provide data to users without visible restrictions.__

As our end-to-end testing and load testing analysis shows, the system is fully ready to be used by the end users. Here are the details on what was done and how we measured its productivity.

- __Improve load balancers and prepare for easy scaling when needed;__

Load balancer is production ready now and can upscale in its performance pointing to more replica operator servers if needed. As tests show it's good enough now.

- __Load testing of the endpoints and static frontend. Estimate the amount of requests / connections per second, that system can handle without the need of scaling;__

The load was tested heavily under various conditions from a separate, very performant servers. We used Apache jMeter, as well as other tools to find the optimal load that current configuration can handle. That also gives us information, what needs to be done if we want to handle more load. 

The static front is set up on AWS, using CloudFront with the top settings. As for now we don't have any doubt in its performance and availability.

- __Move the project to a performant dedicated server;__

We set up a MySql Cluster and the code base on performant dedicated bare-metal servers. Byuilt with scalability in mind, the architecture allows us to add more Replicas and additional servers if the load on the API increases. However, as our load testing demonstrates, the system is perfect to be used for production purposes for now.

- __Add integration with the explorer, through any external explorer or by using SDK if needed;__

We use SDK and direct calls to RPC nodes when crawling, but we've also added some handy links to the [external explorer](https://cspr.live) on our [Frontend](https://caspermetrics.io/charts). When you select some transfer or a validator on the map, you'll see the accounts and buttons to copy the link on to just open in straight in the external explorer in a new tab.

- __Testing the load.__

As previously mentioned, we tested the load from external servers, as well as were monitory the actual load of servers while performing these tests.
