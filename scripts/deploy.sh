#!/bin/sh

docker run \
-d \
--name ptt-stock-browse \
--restart=unless-stopped \
--memory-swappiness=0 \
--log-driver json-file \
--log-opt max-size=50m \
--log-opt max-file=10 \
-p 3000:3000 \
-v $(pwd):/app \
-e NODE_ENV=production \
-w /app \
node:16-alpine \
/bin/sh -c "npm i --production --legacy-peer-deps && npm start"
