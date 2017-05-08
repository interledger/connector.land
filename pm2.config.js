module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : 'connector.land',
      script    : './src/index.js',
      env: {
        COMMON_VARIABLE: 'true',
        NODE_ENV: 'production',
        DEBUG: 'ilp*,connector*',
        STATS_FILE: 'data/stats.json',
        CREDS_FILE: 'data/creds.json',
        PUBLIC_FOLDER: 'public/',
        PROBE_INTERVAL: 10000,
        PORT: 6000
      }
    }
  ]
};
