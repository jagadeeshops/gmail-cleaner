/**
 * @license
 * Copyright Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// [START gmail_cleaner]
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var _ = require('lodash');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), pullMessages);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    //set the auth global variable
    AUTH = oAuth2Client;
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      //set the auth global variable
      AUTH = oAuth2Client;
      callback(oAuth2Client);
    });
  });
}


// After authentication,  Processing starts here 

/**
 * calls the function to list messages
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function pullMessages(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  listMessages(gmail, 'me', 'is:unread',unreadMessages)
}

/**
 * calls the function to to collect details about all the messages
 *
 * @param data List of messages which has id and thread id
 */
function unreadMessages(data, gmail) {
  // console.log(data);
  console.log("Found " + data.length + " unread messages from the mailbox");
  console.log("Going to read them one by one now... ");
  getMessages(gmail, data, unreadEmailsWithDetails);
}

/**
 * calls the function to which categorized messages according to the senders
 *
 * @param emails List of messages which has all details about that message
 */
function unreadEmailsWithDetails(emails, gmail) {
  groupedMessages = _.groupBy(emails, element => element.from);
  groupedMessagesWithCount = _.map(groupedMessages, (value, key) => ({ from: key, mails: value, count: value.length }))
  messages = _.sortBy(groupedMessagesWithCount, (element) => element.count)
  for(var i = messages.length - 1; i > 0; i--) {
    console.log(messages[i].count + " --- " + messages[i].from ) 
  }
  debugger
}

// Helper functions

/**
 * Retrieves Messages.
 *
 * @param  {String} emailIds Array of email ids.
 * @param  {Function} callback Function to call when the request is complete.
 */
function getMessages(gmail, emailIds, callback) {
  var getaMessage = function(request, result, index) {
    gmail.users.messages.get(request, function(err, resp) {
      if (err) return console.log('The API returned an error: ' + err);
      var eachEmail = {}
      eachEmail.id = resp.data.id
      eachEmail.isUnread = resp.data.labelIds.find(function(element) { return element == "UNREAD"})
      var from = resp.data.payload.headers.find(function(element) { return element.name == "From"})
      if (from.value) {
        eachEmail.from = from.value
      }
      else {
        eachEmail.from = null
      }
      result.push(eachEmail)
      var nextEmailId = emailIds[index + 1]
      if (nextEmailId) {
        console.log('Getting a email with id ' + nextEmailId.threadId);
        request = {
          'userId': 'me',
          'id': emailIds[index + 1].threadId
        };
        getaMessage(request, result, index + 1);
      } else {
        callback(result, gmail);
      }
    });
  };
  var initialRequest = {
    'userId': 'me',
    'id': emailIds[0].threadId
  };
  getaMessage(initialRequest, [], 0);
}

/**
 * Retrieve Messages in user's mailbox matching query.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} query String used to filter the Messages listed.
 * @param  {Function} callback Function to call when the request is complete.
 */
function listMessages(gmail, userId, query, callback) {
  var getPageOfMessages = function(request, result) {
    gmail.users.messages.list(request, function(err, resp) {
      if (err) return console.log('The API returned an error: ' + err);
      result = result.concat(resp.data.messages);
      // var nextPageToken = resp.data.nextPageToken;
      var nextPageToken = null
      if (nextPageToken) {
        console.log('Getting another page with token ' + nextPageToken);
        request = {
          'userId': userId,
          'pageToken': nextPageToken,
          'q': query,
          'maxResults': 500
        };
        getPageOfMessages(request, result);
      } else {
        callback(result, gmail);
      }
    });
  };
  var initialRequest = {
    'userId': userId,
    'q': query,
    'maxResults': 500
    // 'maxResults': 5
  };
  getPageOfMessages(initialRequest, []);
}
// [END gmail_cleaner]

module.exports = {
  SCOPES,
  pullMessages,
};
