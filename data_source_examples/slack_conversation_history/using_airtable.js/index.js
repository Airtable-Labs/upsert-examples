// Use dotenv to read the .env file and load into process.env
require('dotenv').config()

// Load external dependencies
const Airtable = require('airtable')
const { WebClient: SlackWebClient } = require('@slack/web-api')

// Load helper functions from *_helpers.js
const { upsertRecordsInChunks } = require('./airtable_helpers')
const { getMessages } = require('./slack_helpers')

// Define variables and initialize Airtable client
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID_OR_NAME, AIRTABLE_UNIQUE_FIELD_ID_OR_NAME } = process.env
Airtable.configure({ apiKey: AIRTABLE_API_KEY })
const base = Airtable.base(AIRTABLE_BASE_ID)
const table = base(AIRTABLE_TABLE_ID_OR_NAME)

// Define variables and initialize Slack WebClient
const { SLACK_BOT_TOKEN, SLACK_CHANNEL_ID } = process.env
const slackWebClient = new SlackWebClient(SLACK_BOT_TOKEN)

// Define a helper function to convert a Slack message object to an Airtable record
const convertSlackMessageToAirtableRecord = function (msg) {
  return {
    fields: {
      [AIRTABLE_UNIQUE_FIELD_ID_OR_NAME]: `${SLACK_CHANNEL_ID}-${msg.ts}`,
      'Channel ID': SLACK_CHANNEL_ID,
      Timestamp: msg.ts,
      Type: msg.type,
      Subtype: msg.subtype,
      'Slack User ID': msg.user,
      'Message Text': msg.text,
      'Reply Count': msg.reply_count,
      'Last Edited Timestamp': msg.edited ? msg.edited.ts : null,
      'Full Message Payload (JSON)': JSON.stringify(msg, null, 2),
      // If msg.thread_ts exists and is different from msg.ts, then this is a threaded message; set the parent message accordingly:
      'Parent Message': (msg.thread_ts && (msg.thread_ts !== msg.ts)) ? [`${SLACK_CHANNEL_ID}-${msg.thread_ts}`] : null
    }
  }
}

  ////////////////////////////////////////////////////////////////////
  // Note: you should not need to edit the code below this comment
  ////////////////////////////////////////////////////////////////////

  ;

(async () => {
  // Get all parent messages from Slack for the given channel
  const allParentMessages = await getMessages(slackWebClient, 'conversations.history', { channel: SLACK_CHANNEL_ID })

  // Create an array of threaded replies too
  const allParentMessagesWithReplies = allParentMessages.filter(message => message.reply_count > 0)
  const allThreadedReplies = await Promise.all(allParentMessagesWithReplies.map(async message => {
    const replies = await getMessages(slackWebClient, 'conversations.replies', { ts: message.ts, channel: SLACK_CHANNEL_ID })
    const repliesWithoutOriginalMessage = replies.filter(reply => reply.thread_ts !== reply.ts)
    return repliesWithoutOriginalMessage
  }))

  // Define two new inputRecords arrays that converts the objects received from the Slack API to use Airtable field names
  const parentMessageInputRecords = allParentMessages.map(msg => convertSlackMessageToAirtableRecord(msg))
  const threadedRepliesInputRecords = allThreadedReplies.flat().map(msg => convertSlackMessageToAirtableRecord(msg))

  // Upsert all parent messages, and then upsert all threaded replies
  // (This way threaded replies can be properly linked to their parent message
  //  which will exist in the base by the time threaded replies are upsert'ed)
  for (const input of Object.entries({ parentMessageInputRecords, threadedRepliesInputRecords })) {
    const [inputRecordType, inputRecords] = input

    console.log(`Upsert'ing ${inputRecords.length} ${inputRecordType}`)
    await upsertRecordsInChunks(table, inputRecords, [AIRTABLE_UNIQUE_FIELD_ID_OR_NAME])
  }

  console.log('\n\nScript execution complete')
})()
