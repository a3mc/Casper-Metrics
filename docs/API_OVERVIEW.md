## API Overview

**This documentation describes the usage and provides the examples for the Casper Metrics Public API.**

You can observe the available endpoints and try them out in the [Swagger interface](https://caspermetrics.io/api).

The Swagger interface is more to provide examples and the description of each endpoint. We recommend not to use high limits for data to prevent browser from hanging when rendering and highlighting the responses. In normal usage situations such big responses work quite well, fast and cause not much load on the backend. However, there are certain limitations and rate limits.

### General structure and purpose

The data is collected by crawling the Casper blockchain and stored in a database. It's served in an effective way, through some layers of caching and allows to easily get the blockchain data without crawling the network on your own with SDKs or directly. You may find it suitable for you analytical projects, websites, and other possible tools that may require fetching the historical and realtime data from the Casper network. In the [Charts](https://caspermetrics.io/charts) section you can find some graphs built upon calling this API endpoints.

There are a few sections, called "controllers", that accept some parameters and serve the data. You can easily get some important information by making queries to the following sections:
- Blocks
- Eras
- Health (just in case if you want to ping API to make sure it's active and well)
- Price (provided by Coingecko via a short-time cache)
- Transfers (query a range of transfers for a specific Era)
- Geodata (although it's used primarily for displaying a map with Validators, it also serves a lot of information about their status and properties)

Each section contains one or more endpoints for different usage scenarios. We'll go below through all endpoints with the examples and explanations on how to use them.

The production API is hosted on the [https://mainnet.cspr.art3mis.net](https://mainnet.cspr.art3mis.net), so you should make all your queries there.

### Rate limits and other limitations

You are free to use the API the way you want, as long as your will is good. There are certain limitations you should be aware of:

- Rate limit of 10 queries per second, or 100 per minute;
- When querying the range of Blocks, the maximum response limit is 10 blocks;
- There's a maximum limit of 10 eras when using a *Custom Filter*.

### Using endpoints

The simplest way for a quick start is to play around with the [Swagger interface](https://caspermetrics.io/api). When you expand each endpoint, you'll see a few input fields on some endpoints. Blocks and Eras also have a *Custom Filters* text areas, that expect a JSON object in a certain format. Please make sure you are using "strict JSON", with double quotes and no trailing commas. Whenever you use a *Custom Filter* other input fields are ignored.

As this project is built upon the Loopback 4 framework you can find the information on how to build your custom query filters [here](https://loopback.io/doc/en/lb4/Querying-data.html).

Each endpoint provides an example of the response and its schema. You may find it useful when building complex queries.
Once query is made you'll get a response that will be displayed in the Swagger interface. Please refer to [Swagger documentation](https://swagger.io/docs/) for more details on how to use it.


### Endpoints in detail

##### GET /block/circulating

When called without params, it returns the Circulating Supply of the recently completed Era. The response is a plain text with the number representing the supply.

You can optionally pass a `blockHeight` or `hash` in the query to get the Circulating Supply from the Era of the given Block. The returned value is denominated and represented in CSPR.

An example:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/block/circulating?blockHeight=10000' \
  -H 'accept: application/json'
```

##### GET /block/total

When called without params, it returns the *Total Supply* of the recently completed Era. The response is a plain text with the number representing the supply.

You can optionally pass a `blockHeight` or `hash` in the query to get the *Total Supply* from the Era of the given Block. The returned value is denominated and represented in CSPR.

An example:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/block/total' \
  -H 'accept: application/json'
```

##### GET /block

This returns a copy of the block with various properties. When called without params it returns the last block.
It can be queried by a block height or a block hash, but also a complex JSON filter can be used. In these case a range of blocks matching the criteria will be returned.

Block has some properties, some of them are inherited from its Era, and some are available only for *Switch* blocks. You can see th full list of the returned properties in the "example" and "schema" sections in the Swagger.

Let's take a look on some examples. For a deeper understanding how to make queries with a *Custom Filter* please see the returned properties of the Block and the syntax described in the Loopback 4 [documentation](https://loopback.io/doc/en/lb4/Querying-data.html).

A simple example, just the last block:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/block' \
  -H 'accept: application/json'
```

Block queried by its Hash:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/block?hash=fbbf5a6657879d2313f02b07c490aca5536b16b60dcff542db30b0e193ab9b62' \
  -H 'accept: application/json'
```

When using *Custom Filter* you should put a valid, "strict" JSON query there. It will be encoded along with the resulting query string so may be less readable in the curl. You can build more human-readable queries too (as described in Loopback 4 docs), without forming the JSON, but it's not supported in the Swagger interface. Please, keep in mind that maximum response limits apply when querying for a range of blocks.

Here's a complex example of using a *Custom Filter* that finds two switch Blocks between 10000 and 20000 height, sorted by `rewards` in the descending order and returning only the specified fields.

An object that you post in the *Filter* text area field:
```js
{
    "where": {
        "switch": true,
        "and": [
            {"blockHeight": {"gte": 10000}},
            {"blockHeight": {"lt": 20000}}
        ]
    },
    "fields": ["blockHeight", "eraId", "rewards", "switch"],
    "order" :["rewards DESC"],
    "limit": 2
}
```

As the result you'll get only the blocks that match the criteria with only the fields you need:
```js
[
  {
    "blockHeight": 16765,
    "eraId": 152,
    "rewards": 172289,
    "switch": true
  },
  {
    "blockHeight": 16655,
    "eraId": 151,
    "rewards": 171936,
    "switch": true
  }
]
```

If you omit `fields`, all properties of each block will be returned. If you omit `order`, the default sorting by height will be applied. If you don't set a limit, either all found results will be returned or just a part, if the number of found blocks will exceed the maximum limit. You can use `skip` to get the next range, so that will help to overcome this limitation by making a few subsequent queries.

##### GET /era/circulating

Similar to `/block/circulating`, when called without params, it returns the Circulating Supply of the recently completed Era. The response is a plain text with the number representing the supply.

You can optionally pass `eraId` in the query to get the Circulating Supply from a particular Era. The returned value is denominated and represented in CSPR.

An example:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/era/circulating?eraId=1000' \
  -H 'accept: application/json'
```

##### GET /era/total

When called without params, it returns the *Total Supply* of the recently completed Era. The response is a plain text with the number representing the supply.

You can optionally pass `eraId` in the query to get the *Total Supply* from a particular Era. The returned value is denominated and represented in CSPR.

An example:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/era/total' \
  -H 'accept: application/json'
```

##### GET /era

When called without params it returns the last completed Era. There are a few parameters that can help to get a single Era - by its `id`, by any `blockHeight` inside that Era or by a `timestamp`. Just one parameter can be used at time.

An example of getting a single era by Block height:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/era?blockHeight=1000' \
  -H 'accept: application/json'
```

There are three more parameters for getting a range of Eras: `limit`, `order` and `skip`. The can be used together to get a range. While the maximum response limit when using these three parameters is 10000, we'd recommend not to try launching it in the Swagger interface, as it may hang your browser for a while when rendering. When making the call programmatically, for example via `curl` the response is quite fast.

An example of getting a range of Eras (10 Eras between starting Era 1000, sorted by descending `validatorsRewards`):
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/era?limit=10&order=validatorsRewards%20DESC&skip=1000' \
  -H 'accept: application/json'
```

It's also possible to use a *Custom Filter* to get a range of Eras or a single one. For the syntax on composing the request please see the Loopback 4 [docs]() and Era's properties in the `example` sections. *Custom Filter* overrides other parameters and has a limitation of 10 items to be returned at once. Please keep in mind that only "strict" JSON (with no trailing commas and with double qutoes) is accepted.

An example of getting 3 Eras between (including) Blocks 1000 and 3000 sorted by descnding `rewards`. Only `id`, `rewards`, `start` and `end` will be returned in this example.

What you put into the `filter` text area:
```js
{
    "where": {
        "and": [
            { "startBlock": { "gte": 1000 } },
            { "startBlock": { "lte": 3000 } }
        ]
    },
    "fields": ["id", "rewards", "start", "end"],
    "order": ["rewards DESC"],
    "limit": 3
}
```

What you get is an array of 3 Eras as requested:
```js
[
    {
        "id": 27,
        "start": "2021-04-03T04:05:47.000Z",
        "end": "2021-04-03T06:04:49.000Z",
        "rewards": 172027
    },
    {
        "id": 25,
        "start": "2021-04-03T00:05:29.000Z",
        "end": "2021-04-03T02:04:32.000Z",
        "rewards": 171089
    },
    {
        "id": 26,
        "start": "2021-04-03T02:05:38.000Z",
        "end": "2021-04-03T04:04:40.000Z",
        "rewards": 170946
    }
]
```

##### GET /health

In automated systems you might want to ensure that the API is accessible. It's just an easy way to ping it. It responds with "I'm fine!" message and accepts no paramaters.

An example:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/health' \
  -H 'accept: */*'
```

##### GET /price

This endpoint returns a short-time cached value of the current price of CSPR in USD from [CoinGecko](https://www.coingecko.com/en/coins/casper-network). It accepts no parameters and returns a single value in USD.

An example:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/price' \
  -H 'accept: application/json'
```

##### GET /transfersByEraId

This endpoint accepts two parameters - `eraId` and `limit`. The default limit is 20 and the maximum is 200. It returns data about transfers for the given Era, sorted by the amount in the descending order. Every transfer has `account-hash` address from which account and to which account the transfer was made. When possible it also returns the `hex` addresses of these accounts as well. When there are circular transfers inside one Era, it prefixes the duplicated accounts with `dup-`, allowing to visually represent it like on the "Transfers Flow" diagram in [Charts](https://caspermetrics.io/charts).

An example:

```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/transfersByEraId?eraId=1000' \
  -H 'accept: application/json'
```

##### GET /validators

This endpoint serves information about the currently active Validators, that expose their geolocation, so can be easily shown on the map. The list is updated every few hours.

An example of getting all available validators with the exposed geolocation:
```shell
curl -X 'GET' \
  'https://mainnet.cspr.art3mis.net/validators' \
  -H 'accept: application/json'
```
