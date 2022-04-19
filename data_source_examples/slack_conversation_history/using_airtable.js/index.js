// Use dotenv to read the .env file and load into process.env
require('dotenv').config()

// Load external dependencies
const Airtable = require('airtable')
const { WebClient: SlackWebClient } = require('@slack/web-api')

// Load helper functions from *_helpers.js
const { createMappingOfUniqueFieldToRecordId, actOnRecordsInChunks } = require('./airtable_helpers')
const { getMessages } = require('./slack_helpers')

// Define variables and initialize Airtable client
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_UNIQUE_FIELD_NAME } = process.env
Airtable.configure({ apiKey: AIRTABLE_API_KEY })
const base = Airtable.base(AIRTABLE_BASE_ID)
const table = base(AIRTABLE_TABLE_ID)

// Define variables and initialize Slack WebClient
const { SLACK_BOT_TOKEN, SLACK_CHANNEL_ID } = process.env;
const slackWebClient = new SlackWebClient(SLACK_BOT_TOKEN);

// Define a helper function to convert a Slack message object to an Airtable record
const convertSlackMessageToAirtableRecord = function (msg) {
  return {
    [AIRTABLE_UNIQUE_FIELD_NAME]: `${SLACK_CHANNEL_ID}-${msg.ts}`,
    'Channel ID': SLACK_CHANNEL_ID,
    'TS': msg.ts,
    'Type': msg.type,
    'Subtype': msg.subtype,
    'Slack User ID': msg.user,
    'Message Text': msg.text,
    'Reply Count': msg.reply_count,
    'Last Edited TS': msg.edited ? msg.edited.ts : null,
    'Full Message Payload (JSON)': JSON.stringify(msg, null, 2),
    // If msg.thread_ts exists and is different from msg.ts, then this is a threaded message; set the parent message accordingly:
    'Parent Message': (msg.thread_ts && (msg.thread_ts != msg.ts)) ? [`${SLACK_CHANNEL_ID}-${msg.thread_ts}`] : null,
  }
}

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

  ////////////////////////////////////////////////////////////////////
  // Note: you should not need to edit the code below this comment
  ////////////////////////////////////////////////////////////////////

  // Retrieve all existing records from the base through the Airtable REST API
  const existingRecords = await table.select().all()

  // Create an object mapping of the primary field to the record ID
  // Remember, it's assumed that the AIRTABLE_UNIQUE_FIELD_NAME field is truly unique
  const mapOfUniqueIdToExistingRecordId = createMappingOfUniqueFieldToRecordId(existingRecords, AIRTABLE_UNIQUE_FIELD_NAME)

  // First, upsert all parent messages, and then upsert all threaded replies
  // (This way threaded replies can be properly linked to their parent message
  //  which will exist in the base by the time threaded replies are upserted)
  for (const input of Object.entries({ parentMessageInputRecords, threadedRepliesInputRecords })) {
    const [inputRecordType, inputRecords] = input

    // Create two arrays: one for records to be created, one for records to be updated
    const recordsToCreate = []
    const recordsToUpdate = []

    // For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
    console.log(`Processing ${inputRecords.length} ${inputRecordType} to determine whether to update or create`)
    for (const inputRecord of inputRecords) {
      const recordUniqueFieldValue = inputRecord[AIRTABLE_UNIQUE_FIELD_NAME]
      console.debug(`\tProcessing record w/ '${AIRTABLE_UNIQUE_FIELD_NAME}' === '${recordUniqueFieldValue}'`)
      // Check for an existing record with the same unique ID as the input record
      const recordMatch = mapOfUniqueIdToExistingRecordId[recordUniqueFieldValue]

      if (recordMatch === undefined) {
        // Add record to list of records to update
        console.log('\t\tNo existing records match; adding to recordsToCreate')
        recordsToCreate.push({ fields: inputRecord })
      } else {
        // Add record to list of records to create
        console.log(`\t\tExisting record w/ ID ${recordMatch} found; adding to recordsToUpdate`)
        recordsToUpdate.push({ id: recordMatch, fields: inputRecord })
      }
    }

    // Read out array sizes
    console.log(`\nRecords to create: ${recordsToCreate.length}`)
    console.log(`Records to update: ${recordsToUpdate.length}\n`)

    try {
      // Perform record creation
      await actOnRecordsInChunks(table, 'create', recordsToCreate)

      // Perform record updates on existing records
      await actOnRecordsInChunks(table, 'update', recordsToUpdate)
      console.log(`\n\nFinished processing ${inputRecordType}`)

    } catch (error) {
      console.error('An error occured while creating or updating records using the Airtable REST API')
      console.error(error)
      throw (error)
    }

  }

  console.log('\n\nScript execution complete')

})()
