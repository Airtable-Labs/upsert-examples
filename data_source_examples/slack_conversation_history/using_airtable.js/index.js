// Use dotenv to read the .env file and load into process.env
require('dotenv').config()

// Load external dependencies
const Airtable = require('airtable')
const { WebClient: SlackWebClient } = require('@slack/web-api')

// Load helper functions from *_helpers.js
const { createMappingOfUniqueFieldToRecordId, actOnRecordsInChunks } = require('./airtable_helpers')
const { getFullConvoHistory } = require('./slack_helpers')

// Define variables and initialize Airtable client
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_UNIQUE_FIELD_NAME } = process.env
Airtable.configure({ apiKey: AIRTABLE_API_KEY })
const base = Airtable.base(AIRTABLE_BASE_ID)
const table = base(AIRTABLE_TABLE_ID)

// Define variables and initialize Slack WebClient
const { SLACK_BOT_TOKEN, SLACK_CHANNEL_ID } = process.env;
const slackWebClient = new SlackWebClient(SLACK_BOT_TOKEN);

;

(async () => {

  // Get all messages from Slack for the given channel
  const allMessages = await getFullConvoHistory(slackWebClient, { channel: SLACK_CHANNEL_ID })

  // Define a new inputRecords array that converts the objects received from the Slack API to use Airtable field names
  const inputRecords = allMessages.map(msg => {
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
      'Full Message Payload (JSON)': JSON.stringify(msg, null, 2)
    }
  })

  ////////////////////////////////////////////////////////////////////
  // Note: you should not need to edit the code below this comment
  ////////////////////////////////////////////////////////////////////

  // Retrieve all existing records from the base through the Airtable REST API
  const existingRecords = await table.select().all()

  // Create an object mapping of the primary field to the record ID
  // Remember, it's assumed that the AIRTABLE_UNIQUE_FIELD_NAME field is truly unique
  const mapOfUniqueIdToExistingRecordId = createMappingOfUniqueFieldToRecordId(existingRecords, AIRTABLE_UNIQUE_FIELD_NAME)

  // Create two arrays: one for records to be created, one for records to be updated
  const recordsToCreate = []
  const recordsToUpdate = []

  // For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
  console.log(`Processing ${inputRecords.length} input records to determine whether to update or create`)
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

  // Perform record creation
  await actOnRecordsInChunks(table, 'create', recordsToCreate)

  // Perform record updates on existing records
  await actOnRecordsInChunks(table, 'update', recordsToUpdate)

  console.log('\n\nScript execution complete!')
})()
