// Use dotenv to read the .env file and load into process.env
require('dotenv').config()

// Load external dependencies
const Airtable = require('airtable')
const fetch = require('node-fetch')

// Load helper functions from helpers.js
const { createMappingOfUniqueFieldToRecordId, actOnRecordsInChunks } = require('./helpers')

// Read in environment variable values
const {
  AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_ID,
  AIRTABLE_UNIQUE_FIELD_NAME,
  QUICKBASE_API_KEY,
  QUICKBASE_REALM_HOSTNAME,
  QUICKBASE_TABLE_ID
} = process.env

// Initialize Airtable.js, used for Base APIs
Airtable.configure({ apiKey: AIRTABLE_API_KEY })
const base = Airtable.base(AIRTABLE_BASE_ID)
const table = base(AIRTABLE_TABLE_ID);

(async function () {
  // Retrieve records from a provided table in Quickbase
  const response = await fetch('https://api.quickbase.com/v1/records/query', {
    method: 'POST',
    headers: {
      Authorization: QUICKBASE_API_KEY,
      'Content-Type': 'application/json',
      'QB-Realm-Hostname': QUICKBASE_REALM_HOSTNAME
    },
    body: JSON.stringify({ from: QUICKBASE_TABLE_ID })
  })

  const latestData = await response.json()
  const inputRecords = []

  for (const record of latestData.data) {
    const create = { fields: {} }
    for (const field of latestData.fields) {
      create.fields[field.label] = record[field.id].value ? record[field.id].value : null
    }
    inputRecords.push(create)
  }

  /*
        The rest of the code in this example is using the best practices
        we recommend when performing an UPSERT on data (update / create)

        You can find examples here: https://github.com/Airtable-Labs/upsert-examples
    */

  // Query existing records in Airtable
  const existingRecords = await table.select().all()

  // Create a map of Airtable Unique Field value and Airtable Record ID
  const mapOfUniqueIdToExistingRecordId = createMappingOfUniqueFieldToRecordId(existingRecords, AIRTABLE_UNIQUE_FIELD_NAME)

  // Two empty arrays to store records that will need to be either created or updated
  const recordsToCreate = []
  const recordsToUpdate = []

  // For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
  for (const record of inputRecords) {
    const uniqueKey = record.fields[AIRTABLE_UNIQUE_FIELD_NAME]

    // find matching key and record ID
    const recordMatch = mapOfUniqueIdToExistingRecordId[uniqueKey]

    // if no match, create new record, otherwise update existing
    if (recordMatch === undefined) {
      recordsToCreate.push(record)
    } else {
      recordsToUpdate.push({ id: recordMatch, fields: record.fields })
    }
  }

  // output how many records to be created and updated
  console.log(`Records to create: ${recordsToCreate.length}`)
  console.log(`Records to update: ${recordsToUpdate.length}`)

  // Perform record creation
  await actOnRecordsInChunks(table, 'create', recordsToCreate)

  // Perform record updates on existing records
  await actOnRecordsInChunks(table, 'update', recordsToUpdate)
})()
