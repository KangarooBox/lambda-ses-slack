NODE_LAMBDA=./node_modules/node-lambda/bin/node-lambda

$NODE_LAMBDA run -x test/context.json -j test/ses-bounce-transient.json
$NODE_LAMBDA run -x test/context.json -j test/ses-bounce-transient-noheaders.json
