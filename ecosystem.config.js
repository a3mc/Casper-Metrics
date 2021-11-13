module.exports = {
    apps: [
        {
            script: './dist-testnet/index.js',
            name: 'testnet',
            max_memory_restart: '2G',
            env: {
                'NODE_ENV': 'production',
            }
        },
        {
            script: './dist-mainnet/index.js',
            name: 'mainnet',
            max_memory_restart: '2G',
            env: {
                'NODE_ENV': 'production',
            }
        }
    // }, {
    //     script: './dist/workers/crawler.worker.js',
    //     instances: 4,
    //     exec_mode: 'cluster',
    //     name: 'crawler-worker',
    //     max_memory_restart: '4G',
    //     env: {
    //         'NODE_ENV': 'production',
    //     }
    ],
};
