while [ true ] ; do node collect.js ; node report.js ; node render.js ; pm2 restart ilp-node-server ; sleep 3600 ; done
