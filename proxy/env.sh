#!/bin/sh
# line endings must be \n, not \r\n !
echo "window._env_ = {" > ./env-config.js
awk -F '=' '{ print $1 ": \"" ENVIRON[$1] "\"," }' >> ./env-config.js
echo "}" >> ./env-config.js