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
                'NETWORK': 'mainnet'
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
                'NETWORK': 'testnet'
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
                'NETWORK': 'mainnet'
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
                'NETWORK': 'testnet'
            }
        },
        // {
        //     name: 'crawler-worker',
        //     script: './dist/workers/crawler.worker.js',
        //     instances: 4,
        //     exec_mode: 'cluster',
        //
        //     max_memory_restart: '4G',
        //     env: {
        //         'NODE_ENV': 'production',
        //     }
        // }
    ],
};
