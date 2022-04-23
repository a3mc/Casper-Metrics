# Casper Metrics API

Initial approach of this work is to calculate CSPR circulating supply. Although some parts of the supply are distributed on protocol level, there is a significant amount of transactions which are processed manually. We've decided to bring such transactions flow to atomic level of transparency, as we believe this is an important component for the blockchain where decentralization and transparency are playing fundamental role in the architecture. Manual funds distribution make calculation process very difficult, as transactions are passing between many inputs; these inputs are unknown and distribution flow can be very confusing for an outside observer. We made a lot of research on this subject and came up with the provided solution.

This engine was built specifically for circulating supply calculation, however not limited and can become a foundation of new tools, for example, collecting and plotting employees salaries, donations and all sort of transactions flows for unlimited needs. The crawler builds a dependency tree connecting HEX addresses with accounts hashes. Users will be able to see connections between different inputs and represent this in a form of diagrams. Crawler is able to collect data very fast and provides user with a populated database for the future network analysis.

##### Platform developed under [MIT license](https://github.com/a3mc/Casper-Metrics/blob/master/license.txt) and contains 3 core modules split between 3 repositories:

1) [Casper-Metrics](https://github.com/a3mc/Casper-Metrics) **>>> You are here <<<**

    * _high performance asynchronous crawler - we want data crawling process to be as fast as possible_
    * _API - provides a wide range of metrics with an ability to filter through history, can be used by researchers and dApps and was built with the scalability in mind_

2) [Casper-Metrics-Front](https://github.com/a3mc/Casper-Metrics-Front)

    * _Complete web user interface with various charts_
    * _API web interface_

3) [Casper-Metrics-Admin](https://github.com/a3mc/Casper-Metrics-Admin)

    * _Secure administration panel with the permissions management allows administrators to select the transfers which they believe are a part of circulating supply._
    * _Administration panel includes a tool to adjust vesting schedule of initial genesis validators accounts._

Current work can be observed at [caspermetrics.io](https://caspermetrics.io), administrator panel is accessible at [admin.caspermetrics.io](https://admin.caspermetrics.io), API endpoint [mainnet.cspr.art3mis.net](https://mainnet.cspr.art3mis.net)

All elements are independent and can be deployed separately, depending on the particular needs, as for example to run only the crawler to populate the database with transactions. Admin interface has a search section which accepts _input HEX_ as well as _account hash_ and _transaction hash_.

### General architecture:

API engine is constructed on top of the Loopback framework. Multiple crawler processes are managed by PM2. MySQL is used as a primary data storage and Redis provides a communication layer between all processes and is used as temporary in-memory storage bringing crawling process to the next level of performance.

![Overview](https://github.com/a3mc/Casper-Metrics/blob/master/overview.jpg)

### Documentation:

* [Hardware Requirements](https://github.com/a3mc/Casper-Metrics/blob/master/docs/REQUIREMENTS.md)
* [Installation](https://github.com/a3mc/Casper-Metrics/blob/master/docs/INSTALLATION.md) _(introduction basic)_
* [Deploy In Production](https://github.com/a3mc/Casper-Metrics/blob/master/docs/PRODUCTION.md)
* [Code Overview](https://github.com/a3mc/Casper-Metrics/blob/master/docs/CODE_OVERVIEW.md)
* [API Overview](https://github.com/a3mc/Casper-Metrics/blob/master/docs/API_OVERVIEW.md)

*Docs to be delivered with the Milestone 3:*
* Front Functional Description
* Admin Panel Functional Description

The project was initiated with the proposal [#86](https://portal.devxdao.com/app/proposal/86) and successfully passed [DevDao](https://www.devxdao.com) pipeline on 9/29/2021

Current development stage: milestone #2

Based on [casper.network](https://casper.network/en/network)

### Opensource components:
* [Loopback](https://loopback.io)
* [Apache ECharts](https://echarts.apache.org/en/index.html)
* [Angular](https://angular.io)
* [Swagger](https://swagger.io)
* [MySQL](https://www.mysql.com/)
* [Redis](https://redis.io)
* [Dsa.js](https://www.npmjs.com/package/dsa.js)
* [D3](https://d3js.org)
* [NodeJS](https://nodejs.org)
* [PM2](https://pm2.keymetrics.io)


### Documentation

Documentation can be found in the `docs` folder and will be significantly updated in the Milestone 3 of the project.

### Contributing and Code of Conduct

You are welcome to add your suggestions and to contribute to the project. Please create PRs against develop branch if you want to contribute. We reserve the right to ignore or decline any PRs and not to respond to the messages.

Please follow the best practices, follow the code structure and make sure that your suggestion is really valuable for the project and well-formed. When you open an issue, please make sure you provide enough details on how to reproduce it. Don't use explicit lexis and be polite to other members.

### License

This project is licensed under [MIT license](https://github.com/a3mc/Casper-Metrics/blob/master/license.txt).

### About us:
* [ART3MIS.CLOUD](https://art3mis.cloud)
