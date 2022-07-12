## End to end & load tests

Platform API not only replies on traditional queries, but also provides various filtering options. As filters can be relatively complex to understand at first glance, we provide here e2e.sh script which not only goes trough a significant amount of functions and combinations of queries, but also gives a brief overview of the API functionality in general. This script can be run by anyone for education or testing purposes and gives some cool ideas on what is possible to be done with API itself.


**Folder content:**

* _e2e.sh_ - end-to-end tests and educational script
* _example_x.json_ - files contain filters examples, they are used by e2e.sh

* _caspermetrics.io.load.test.jmx_ - [Apache JMeter™](https://jmeter.apache.org/) load test example scenario, which covers all the available endpoints
* _log.csv_ - load test log files
* _Reports_ - folder contains detailed load test report built with [Apache JMeter™](https://jmeter.apache.org/)

**e2e.sh how to:**

Requirements:

* A CSPR synced mainnet Node set in script header _( we provide ready to go RPC, but please validate )_
* Link to the platform API in script header _( already set to https://mainnet.cspr.art3mis.net )_
* [Ubuntu](https://help.ubuntu.com) or any [Debian](https://www.debian.org/) base, can be run on Mac
* bash shell
* access to internet

* `jq` for json processing _( install: `apt install jq` )_
* `bc` for precision calculation  _( install: `apt install bc`)_

* make sure all 3 `example_x.json` files are present in the same folder with `e2e.sh`

_Please take a look on the content of the e2e script._

Make file is executable: `chmod +x e2e.sh`

Execute: `./e2e.sh` or `bash e2e.sh`

In rare case, if for some reason you want to do own load tests _( not recommended )_ , we provide [Apache JMeter™](https://jmeter.apache.org/) template:

* `caspermetrics.io.load.test.jmx`

Please follow [Apache JMeter™ documentation](https://jmeter.apache.org/usermanual/get-started.html) on how to run tests from server console and generate html report. Please keep in mind that rate limits will apply after the review of the current milestone.

**Report:** _[temporary hosted web page](http://161.97.84.146/load-test)_

Report folder contains the generated load test spreadsheet in HTML format. This report can be easily observed by cloning repository and opening `index.html` in appropriate web browser or navigate to our temporary hosted page [here](http://161.97.84.146/load-test).
