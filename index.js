'use strict';

var AWS = require('aws-sdk');
var url = require('url');
var https = require('https');
var _ = require('lodash');
const hookUrl = process.env.HOOK_URL;

var baseSlackMessage = {}

var postMessage = function(message, callback) {
  var body = JSON.stringify(message);
  var options = url.parse(hookUrl);
  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };

  var postReq = https.request(options, function(res) {
    var chunks = [];
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      return chunks.push(chunk);
    });
    res.on('end', function() {
      var body = chunks.join('');
      if (callback) {
        callback({
          body: body,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage
        });
      }
    });
    return res;
  });

  postReq.write(body);
  postReq.end();
};

var handleBounce = function(MAIL) {
  const timestamp = MAIL.timestamp;

  const title = `SES Message Bounce (${MAIL.bounce.bounceType} - ${MAIL.bounce.bounceSubType})`;
  var subject = "n/a";
  var from = MAIL.mail.source;    

  // Get better headers, if possible
  if(false == MAIL.mail.headersTruncated){
    subject = MAIL.mail.commonHeaders.subject;
    from = MAIL.mail.commonHeaders.from[0];
  }
  
  var recipients = '';
  MAIL.bounce.bouncedRecipients.forEach(function(recipient){
    recipients += `* ${recipient.emailAddress} (${recipient.action}): ${recipient.diagnosticCode}\n`;
  })

  var color = "danger";
  switch (MAIL.bounce.bounceType) {
    case 'Transient':
      color = "warning";
      break;
  }

  var slackMessage = {
    text: "*" + title + "*",
    attachments: [
      {
        "fields": [
          { "title": "Subject", "value": subject, "short": false},
          { "title": "From", "value": from, "short": false},
          { "title": "Recipients", "value": recipients, "short": false}
        ],
        "color": color,
        "ts":  timestamp,
        "icon_emoji": ":aws-ses:"
      }
    ]
  };

  return _.merge(slackMessage, baseSlackMessage);
};

var handleDelivery = function(MAIL) {
  const timestamp = MAIL.timestamp;

  const title = `SES Message Delivery`;
  var subject = "n/a";
  var from = MAIL.mail.source;    

  // Get better headers, if possible
  if(false == MAIL.mail.headersTruncated){
    subject = MAIL.mail.commonHeaders.subject;
    from = MAIL.mail.commonHeaders.from[0];
  }
  
  var recipients = '';
  MAIL.delivery.recipients.forEach(function(recipient){
    recipients += `* ${recipient}\n`;
  })

  var color = "good";

  var slackMessage = {
    text: "*" + title + "*",
    attachments: [
      {
        "fields": [
          { "title": "Subject", "value": subject, "short": false},
          { "title": "From", "value": from, "short": false},
          { "title": "Recipients", "value": recipients, "short": false}
        ],
        "color": color,
        "ts":  timestamp,
        "icon_emoji": ":aws-ses:"
      }
    ]
  };

  return _.merge(slackMessage, baseSlackMessage);
};

var handleComplaint = function(MAIL) {
  const timestamp = MAIL.timestamp;

  const title = `SES Message Complaint`;
  var subject = "n/a";
  var from = MAIL.mail.source;    

  // Get better headers, if possible
  if(false == MAIL.mail.headersTruncated){
    subject = MAIL.mail.commonHeaders.subject;
    from = MAIL.mail.commonHeaders.from[0];
  }
  
  var recipients = '';
  MAIL.complaint.complainedRecipients.forEach(function(recipient){
    recipients += `* ${recipient.emailAddress}: ${MAIL.complaint.complaintFeedbackType}\n`;
  })

  var color = "danger";
  switch (MAIL.complaint.complaintFeedbackType) {
    case 'abuse':
      color = "warning";
      break;
  }

  var slackMessage = {
    text: "*" + title + "*",
    attachments: [
      {
        "fields": [
          { "title": "From", "value": from, "short": false},
          { "title": "Subject", "value": subject, "short": false},
          { "title": "Recipients", "value": recipients, "short": false}
        ],
        "color": color,
        "ts":  timestamp,
        "icon_emoji": ":regas:"
      }
    ]
  };

  return _.merge(slackMessage, baseSlackMessage);
};

exports.handler = function(event, context) {
  console.log("message received:" + JSON.stringify(event, null, 2));
  const MAIL = JSON.parse(event.Records[0].Sns.Message);
  var slackMessage = '';

  switch(MAIL.notificationType) {
    case 'Delivery':
      slackMessage = handleDelivery(MAIL);
      break;
    case 'Bounce':
      slackMessage = handleBounce(MAIL);
      break;
    case 'Complaint':
      slackMessage = handleComplaint(MAIL);
      break;
  }

  postMessage(slackMessage, function(response) {
    if (response.statusCode < 400) {
      console.info('message posted successfully');
      context.succeed();
    } else if (response.statusCode < 500) {
      console.error("error posting message to slack API: " + response.statusCode + " - " + response.statusMessage);
      // Don't retry because the error is due to a problem with the request
      context.succeed();
    } else {
      // Let Lambda retry
      context.fail("server error when processing message: " + response.statusCode + " - " + response.statusMessage);
    }
  });
};
