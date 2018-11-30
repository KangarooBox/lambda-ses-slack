# lambda-ses-slack

An [AWS Lambda](http://aws.amazon.com/lambda/) function for better Slack notifications generated from SES notification events.
This work is a direct descendant of [lambda-cloudwatch-slack](https://github.com/assertible/lambda-cloudwatch-slack) and wouldn't be possible without it.


## Overview

This function was originally derived from the [lambda-cloudwatch-slack](https://github.com/assertible/lambda-cloudwatch-slack) project which was originally derived from the [AWS blueprint named `cloudwatch-alarm-to-spark`](https://aws.amazon.com/blogs/aws/new-spark-integration-blueprints-for-aws-lambda/). The function in this repo allows SES Notifications to generate Slack notifications.


## Configuration

* Clone this repository
* Visit the [Slack Apps page](https://api.slack.com/apps) to create a new App
* Copy `env.example` to `.env`
* Update the `.env` file with the app credentials from Slack

## Tests

With the variables filled in, you can test the function:

```
npm install
npm test
```

## License

MIT License