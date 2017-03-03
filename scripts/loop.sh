while [ true ] ; do node probe.js ; pm2 restart statsServer.js ; sleep 3600 ; done
