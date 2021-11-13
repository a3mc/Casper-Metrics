module.exports = {
    apps: [
        {
            script: './dist/index.js',
            name: 'api',
            max_memory_restart: '2G',
            exec_mode: 'fork',
            watch: false,
            env: {
                'NODE_ENV': 'production',
            }

        },
        // {
        //     script: './dist/workers/crawler.worker.js',
        //     instances: 4,
        //     exec_mode: 'cluster',
        //     name: 'crawler-worker',
        //     max_memory_restart: '4G',
        //     env: {
        //         'NODE_ENV': 'production',
        //     }
        // }
    ],
};
