## Hardware requirements

__In this document we provide a basic overview on the hardware specification depending on user needs.__

The platform is designed with scalability in mind and can handle a decent amount of load, thousands calls per second and more, all depends on the infrastructure configuration. However, the current project can be used by individuals for various purposes, as the platform supports partial components deployment and can be run in private networks as simple as on a laptop or gaming PC. Please have a look our [Basic Installation Guide](https://github.com/a3mc/Casper-Metrics/blob/master/docs/INSTALLATION.md) for additional information.

Example environment configuration file can be found here: [example.env](https://github.com/a3mc/Casper-Metrics/blob/master/example.env)

__Individual researchers or a small team deployment:__

If you are looking just for a data crawler and want to populate your local database with data for further analysis, where no need any fancy hardware to do so, as for example, something similar can easily crawl data up to era 5000 in less than 48 hours: _( example )_

* **MacBook Pro M1,2020** _( 8-core, 16GB RAM, ~500Gb NVMe free space )_

Such laptop can handle the crawling process on a moderate speed if parameters in .env doesn't set to something extraordinary. See [example.env](https://github.com/a3mc/Casper-Metrics/blob/master/example.env) that provides quite safe values for running on a simple machine such as the one in example above.

_This setup will do just fine, but the connection quality plays the main role, as some internet providers can find abnormal simultaneous connections as suspicious, packets loss can force crawler to do same batch of blocks again and again, which will significantly decrease the crawling speed. After deploying, pay attention to the logs flow, we've been trying to craft logs as detailed as possible in a hope that it will make debugging process easy and less time-consuming._

##### High load environment:

Deploying in production in a highload space will require more approach. We recommend MySQL cluster implementation with multiple replication instances. Please check [Deploy In Production](https://github.com/a3mc/Casper-Metrics/blob/master/docs/PRODUCTION.md) for the details.

**x2 baremetal servers or more in cloud equivalet:**

* **64Gb RAM multi-core "AMD Ryzen™ 5 3600" and newer**
* **1T high speed enterprise NVMe** _( currently, Era 5000 mainnet,  500Gb storage is enough, but this will increase exponentially with time )_
* **Dedicated 1GBit uplink**.

**1GBit** uplink is important only when we need to crawl aggressively from lets say _15 ~ 50 RPC_ endpoints or more, otherwise, if crawling process from scratch not planned, for example we already have a database for importing, or we don't care about speed much and ready to leave crawler for a couple of days to complete his job, then platform can operate below ~100Mb/s wisely with 2 dedicated servers from our example.

Only one server is used for crawling, but it uses multiple threads to speed up the process. Additional servers are needed just for serving the API endpoints more effectively. This additional servers only do read operations and communicate only with MySQL replicas. If you are not planning to process a lot of API calls per second, then one baremetal server is a perfect solution.

This deployment can be perfectly processed on equivalent cloud instance, however, aggressive crawling from scratch consume high amount on bandwidth and such solution can lead to additional expenses, process with caution.

As in this example, the deployment is done with multiple servers and use a MySQL cluster for API load reduction, such configuration require load balancers, this can be achieved in many ways, depending on a personal experience and existing infrastructure policy. Again, if API is not the thing in your roadmap and doesn't require a lot of queries per second, one server or cloud instance will do job without any issues.

We host our front-end (both Public and Admin parts) on AWS for stability and high-availability purpose, however, this can be implemented in different ways by using different cloud provider of even settled on dedicated servers together with crawler or replica or on separate server, cloud or whatsoever.

* _Our platform is developed from scratch with love, based on a top-notch API framework, and have unique features which we've never seen previously in "similar" projects. We will upgrade this documentation, in the future, when the platform usage grow and gains more users base, who hopefully can provide great feedback and so theoretically increase the load or maybe not._

**For more details:** [ Deploy In Production ](https://github.com/a3mc/Casper-Metrics/blob/master/docs/PRODUCTION.md)
