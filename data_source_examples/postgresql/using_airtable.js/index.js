// Use dotenv to read the .env file and load into process.env
require('dotenv').config()

// Load external dependencies
const Airtable = require('airtable')
const { Client } = require('pg')

// Load helper functions from *_helpers.js
const { upsertRecordsInChunks } = require('./airtable_helpers')

// Define variables and initialize Airtable client
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_PRIMARY_FIELD_ID_OR_NAME } = process.env
Airtable.configure({ apiKey: AIRTABLE_API_KEY })
const base = Airtable.base(AIRTABLE_BASE_ID)

// Define variables and initialize PostgreSQL client/pool
const { POSTGRES_CONNECTION_STRING, POSTGRES_TABLE_PREFIX_IF_ANY } = process.env
const postgres = new Client({ connectionString: POSTGRES_CONNECTION_STRING })
postgres.connect()

// Define table names variable (the names of the tables in Postgres and Airtable should be identical)
const { TABLE_NAMES_AS_CSV_STRING } = process.env
const TABLE_NAMES = TABLE_NAMES_AS_CSV_STRING.split(',')
console.log(`Table names: ${TABLE_NAMES.join(', ')}`)

;

(async () => {
  /// /////////////////////////////////////////////////////////////////
  // Note: you should not need to edit the code below this comment
  /// /////////////////////////////////////////////////////////////////

  // Process each table one at a time
  for (const tableName of TABLE_NAMES) {
    console.log(`Processing table ${tableName}...`)

    // Retrieve rows from Postgres
    const postgresTableQuery = await postgres.query(`SELECT * FROM ${POSTGRES_TABLE_PREFIX_IF_ANY}${tableName}`)
    const inputRecords = postgresTableQuery.rows
    console.log(`\tFound ${inputRecords.length} rows in Postgres`)

    // Create reference to Airtable table
    const airtableTable = await base(tableName)

    // Format record data to be compatible with Airtable's API
    const recordsToUpsert = inputRecords.map((r) => {
      return { fields: r }
    })

    // Upsert records in Airtable
    await upsertRecordsInChunks(airtableTable, recordsToUpsert, [AIRTABLE_PRIMARY_FIELD_ID_OR_NAME])
  }

  console.log('\n\nScript execution complete')
  await postgres.end()
})()
