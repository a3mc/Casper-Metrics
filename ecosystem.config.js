module.exports = {
    apps: [
        {
            script: './dist/index.js',
            name: 'mainnet-prod',
            max_memory_restart: '2G',
            exec_mode: 'fork',
            watch: false,
            env: {
                'NODE_ENV': 'production',
                'PUBLIC_API_PORT': '3000',
                'DATABASE': 'mainnet',
                'NETWORK': 'mainnet',
                'REDIS_DB': 0
            }
        },
        {
            script: './dist/index.js',
            name: 'testnet-prod',
            max_memory_restart: '2G',
            exec_mode: 'fork',
            watch: false,
            env: {
                'NODE_ENV': 'production',
                'PUBLIC_API_PORT': '3001',
                'DATABASE': 'testnet',
                'NETWORK': 'testnet',
                'REDIS_DB': 1
            }
        },
        {
            script: './dist/index.js',
            name: 'mainnet-dev',
            max_memory_restart: '2G',
            exec_mode: 'fork',
            watch: false,
            env: {
                'NODE_ENV': 'production',
                'PUBLIC_API_PORT': '3010',
                'DATABASE': 'devmainnet',
                'NETWORK': 'mainnet',
                'REDIS_DB': 2
            }
        },
        {
            script: './dist/index.js',
            name: 'testnet-dev',
            max_memory_restart: '2G',
            exec_mode: 'fork',
            watch: false,
            env: {
                'NODE_ENV': 'production',
                'PUBLIC_API_PORT': '3011',
                'DATABASE': 'devtestnet',
                'NETWORK': 'testnet',
                'REDIS_DB': 3
            }
        },
        // {
        //     script: './dist/crawler.js',
        //     name: 'mainnet-dev-crawler',
        //     max_memory_restart: '2G',
        //     exec_mode: 'fork',
        //     watch: false,
        //     env: {
        //         'NODE_ENV': 'production',
        //         'DATABASE': 'devtestnet',
        //         'NETWORK': 'devmainnet',
        //         'REDIS_DB': 2
        //     }
        // },
        {
            name: 'mainnet-dev-crawler-worker',
            script: './dist/workers/crawler.worker.js',
            instances: 2,
            exec_mode: 'cluster',
            max_memory_restart: '2G',
            watch: false,
            env: {
                'NODE_ENV': 'production',
                'DATABASE': 'devmainnet',
                'REDIS_DB': 2
            }
        }
    ],
};
