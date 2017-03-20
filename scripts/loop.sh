while [ true ] ; do node collect.js ; node reports.js ; node render.js ; pm2 restart statsServer.js ; sleep 3600 ; done
