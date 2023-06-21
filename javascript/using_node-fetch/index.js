// Use dotenv to read the .env file and load into process.env
require('dotenv').config()

// Load external dependencies
const fetch = require('node-fetch')

// Load helper functions from helpers.js
const { upsertRecordsInChunks } = require('./helpers')

// Define variables for base API and default headers
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_UNIQUE_FIELD_NAME_OR_ID, AIRTABLE_API_MS_TO_SLEEP } = process.env
const baseApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`
const airtableAuthHeaders = new fetch.Headers({
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json'
})

; (async () => {
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

  // Format record objects to match Airtable API format
  const recordsToUpsert = inputRecords.map(r => ({ fields: r }))

  // Read out array size
  console.log(`\nRecords to upsert: ${recordsToUpsert.length}`)

  // Perform record upserts
  await upsertRecordsInChunks(baseApiUrl, airtableAuthHeaders, recordsToUpsert, [AIRTABLE_UNIQUE_FIELD_NAME_OR_ID], AIRTABLE_API_MS_TO_SLEEP)

  console.log('\n\nScript execution complete!')
})()
