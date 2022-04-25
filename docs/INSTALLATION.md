### Installation / Quick Start

###### Described process is suitable for development, overview, review or populating database for various needs. Check: [Hardware Requirements](), for production please refer to [Deploy In Production](https://github.com/a3mc/Casper-Metrics/blob/master/docs/PRODUCTION.md). Network quality affects the crawler performance significantly, it is very important to have a strong internet connection in any case, at some tests we excite 500Mb/s. Each crawler instance can create ~ 600 connections, we recommend this deployment on datacenter grade environment.

* _**Crawler doesn't depend on the web UI modules and can run standalone for data gathering purpose.**_
* _**We've tested this on the road using Mac PRO, all works perfectly fine, in this case is highly recommended using a VPN connection to a remote datacenter to ensure crawler functionality.**_

Dependencies:

* [Docker](https://docs.docker.com/get-docker) _(we will use docker for `Redis` and `MySQL` installation, however it is personal choice how to deploy these components)_
* PM2
* Node v16.14.2
* MySQL 8.x
* Redis _(default port, no password)_
* dedicated user

##### System Preparation

Create user:

```bash
adduser <user_name>
```

Add user to docker group _( docker should be already installed )_:

```bash
  $ sudo usermod -aG docker <user_name>
```

For simplicity of this demo guide add user to sudo group as well:

```bash
  $ sudo usermod -aG sudo <user_name>
```

Disconnect session and login back to activate new groups membership, install dependency _( for JWT generation optionally add `pwgen` package )_:

```bash
  $ sudo apt update && sudo apt-get install mysql-client git wget
```

Build latest redis-cli: ( we use a default port here )

```bash
  $ cd ~
  $ wget http://download.redis.io/redis-stable.tar.gz
  $ tar xvzf redis-stable.tar.gz
  $ cd redis-stable
  $ make
  $ cp src/redis-cli /usr/local/bin/
  $ chmod 755 /usr/local/bin/redis-cli
```

Create folder for MySQL configuration and storage:

```bash
  $ mkdir -p $HOME/.mysql.conf/casper-metrics-mysql/conf.d
  $ mkdir -p $HOME/.mysql/casper-metrics-mysql/db
```

Create and populate MySQL configuration file: _( we will point docker here )_

```bash
cat <<EOF > $HOME/.mysql/casper-metrics-mysql/conf.d/my.cnf
[mysqld]
user                         = mysql
log_error = /tmp/error.log
key_buffer_size              = 16M
myisam-recover-options       = BACKUP
max_connections              = 250
max_binlog_size              = 100M
innodb_buffer_pool_size      = 4G
innodb_buffer_pool_instances = 8
innodb_log_file_size         = 128M
table_open_cache             = 2677
open_files_limit             = 5355
EOF
```

MySQL container will be deployed with configuration file created above, additionally need to create dedicated _user_ and dedicated _database_, all this variables are relative and can be freely adjusted, please refer to [example.env]() if necessary. In our example we set root password to `password123`, database `mainnet` will be created, user `apiuser` will be created and will control `mainnet` database accordingly, where also password set for user `apiuser` which is in our example same as root password `password123`. Oneliner for simplicity:

```bash
  $ docker run --name casper-metrics-mysql -e MYSQL_ROOT_PASSWORD=password123 -e MYSQL_DATABASE=mainnet -e MYSQL_USER=apiuser -e MYSQL_PASSWORD=password123 --restart=always -d -p 0.0.0.0:3306:3306/tcp --volume=/$HOME/.mysql/casper-metrics-mysql/conf.d:/etc/mysql/conf.d --volume=/$HOME/.mysql/casper-metrics-mysql/db:/var/lib/mysql mysql:latest
```

Check if database ready, should see _250_ as set in configuration:

```bash
  $ mysql -u apiuser -p -h 127.0.0.1 -P 3306 -e 'show global variables like "max_connections"';
```

Switch auth method for users, we need this to ensure password authentification works as expected:

```bash
  $ mysql -u root -p -h 127.0.0.1 -P 3306 -e "ALTER USER 'apiuser'@'%' IDENTIFIED WITH mysql_native_password BY 'password123';"
  $ mysql -u root -p -h 127.0.0.1 -P 3306 -e "ALTER USER 'root'@'%'    IDENTIFIED WITH mysql_native_password BY 'password123';"
```

Deploy Redis:

```bash
  $ docker run --name casper-metrics-redis --restart=always -d -p 127.0.0.1:6379:6379 redis
```

We provide relatively fresh ( block 729820 ) database dump: mysqldump_25_Apr_2022_15_14_35.sql

In any case, where we need to import database, Redis should be flushed to avoid calculation disorder:

Standard db import sequence:

* pm2 stop all
* flush Redis
* Import database

#### Import database

* flush Redis

```bash
  $ redis-cli -n 0 flushdb
```

Download database dump:

```bash
  $ cd ~ && wget http://path/to/mysqldump_25_Apr_2022_15_14_35.sql
```

Import in to previously created `mainnet` db:

```bash
  $ docker exec -i casper-metrics-mysql mysql -u"root" -p"password123" mainnet < mysqldump_25_Apr_2022_15_14_35.sql
```
Check last block ( 729820 ) and availability:

```bash
  $ mysql -u apiuser -p -h 127.0.0.1 -P 3306 -e 'use mainnet; select id from Block ORDER BY id desc LIMIT 1';
```

Adjust NodeJS version, currently _v16.14.2_, in this example we will use [nvm script](https://github.com/nvm-sh/nvm):

```bash
  $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

Export nvm path:

```bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Install required version and make default:

```bash
  $ nvm install v16.14.2 && node --version
```

Install PM2:

```bash
  $ npm install -g pm2 && pm2 --version
```

##### Install backend ( crawler & API )
```bash
  $ cd ~
  $ git clone https://github.com/a3mc/Casper-Metrics.git
  $ cd Casper-Metrics/
  $ npm install
```

We will use `example.env` as reference:

```bash
  $ cp example.env .env
```

Edit `.env` and adjust for your setup, in this demo we just need to generate `JWT_SECRET`, for example by using `pwgen` tool:

```bash
  $ pwgen -N 1 -s 96
  $ nano .env
```

Prepare database:

```bash
  $ npm run migrate
```

Run tests:

```bash
  $ npm run test
```

Start backend and check logs:

```bash
  $ npm run start && pm2 logs all
```

At this point we should see crawler in action. This will take a long time to catchup with current block ~ up to 12 hour or even more, depending on the hardware, connections speed and configured parameters, refer to [Code Overview](https://github.com/a3mc/Casper-Metrics/blob/master/docs/CODE_OVERVIEW.md).

##### Install Public Web Interface

Here, in this example for testing or development we will use [ng](https://github.com/angular/angular-cli):

```bash
  $ npm install -g @angular/cli
```

Continue ...

```bash
  $ cd ~
  $ git clone https://github.com/a3mc/Casper-Metrics-Front.git
  $ cd Casper-Metrics-Front
  $ npm install
```

Run with [ng](https://github.com/angular/angular-cli), it will take a while. Deploying this way is good for debugging, UI will act slow, be patient.

```bash
  $ ng serve
```

Keep this session open

##### Install Administrator Web Interface

Open new session in a separate terminal window _( we keep ng running )_

```bash
  $ cd ~
  $ git clone https://github.com/a3mc/Casper-Metrics-Admin.git
  $ cd Casper-Metrics-Admin/
  $ npm install
```

Use [ng](https://github.com/angular/angular-cli) to serve administrator interface:

```bash
  $ ng serve
```

From here we should have all components available at ports _( if default )_, for production deployment please refer [Deploy In Production](https://github.com/a3mc/Casper-Metrics/blob/master/docs/PRODUCTION.md)

* `4300` - Public Front
* `4200` - Administrator UI
* `3000` - API

If deployed remotely, to access all modules build tunnel as in example, or connect `<IP:<PORT>` directly _( not recommended )_:

```bash
  $ ssh <host> -L 4300:127.0.0.1:4300  -L 4200:127.0.0.1:4200  -L 3000:127.0.0.1:3000 -N
```
