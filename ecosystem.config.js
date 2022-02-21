module.exports = {
    apps: [
        {
            script: './dist/index.js',
            name: 'metrics-api',
            max_memory_restart: '8G',
            exec_mode: 'fork',
            watch: false,
            env: {
                'NODE_ENV': 'production',
                'PUBLIC_API_PORT': '3000',
                'REDIS_DB': 0
            }
        },
        {
            name: 'crawler-worker',
            script: './dist/workers/crawler.worker.js',
            instances: 4,
            exec_mode: 'cluster',
            max_memory_restart: '8G',
            watch: false,
            env: {
                'NODE_ENV': 'production',
                'REDIS_DB': 0
            }
        }
    ],
};
