// Use dotenv to read the .env file and load into process.env
require('dotenv').config()

// Load external dependencies
const Airtable = require('airtable')

// Load helper functions from helpers.js
const { createMappingOfUniqueFieldToRecordId, actOnRecordsInChunks } = require('./helpers')

// Define variables and initialize Airtable client
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_UNIQUE_FIELD_NAME } = process.env
Airtable.configure({ apiKey: AIRTABLE_API_KEY })
const base = Airtable.base(AIRTABLE_BASE_ID)
const table = base(AIRTABLE_TABLE_ID)

  ;

(async () => {
  // Define input records (from the source system). This would usually be an API call or reading in a CSV or other format of data.
  const inputRecords = [
    // Existing person in the table, if using the sample data linked to in the README
    {
      'First Name': 'Juliette',
      'Last Name': 'Schimmang',
      'Unique ID': '16a05ea5-7bbd-4353-bc25-878a2245835e',
      'Job Title': 'Account Executive II'
    },
    // New user to be added to the table
    {
      'First Name': 'Marsha',
      'Last Name': 'Rickeard',
      'Unique ID': 'bf68da9d-805b-4117-90dc-d54eb46db19f',
      'Job Title': 'CTO',
      'Hire Number': 201
    }
  ]

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
