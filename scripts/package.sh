NODE_LAMBDA=./node_modules/node-lambda/bin/node-lambda

$NODE_LAMBDA package -A build -n lambda-ses-slack-`date +"%s"`
