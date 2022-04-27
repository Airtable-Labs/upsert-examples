// Use dotenv to read the .env file and load into process.env
require('dotenv').config()

// Load external dependencies
const Airtable = require('airtable')
const { Client } = require('pg')

// Load helper functions from *_helpers.js
const { createMappingOfUniqueFieldToRecordId, actOnRecordsInChunks } = require('./airtable_helpers')

// Define variables and initialize Airtable client
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_PRIMARY_FIELD_NAME } = process.env
Airtable.configure({ apiKey: AIRTABLE_API_KEY })
const base = Airtable.base(AIRTABLE_BASE_ID)

// Define variables and initialize PostgreSQL client/pool
const { POSTGRES_CONNECTION_STRING, POSTGRES_TABLE_PREFIX_IF_ANY } = process.env;
const postgres = new Client({ connectionString: POSTGRES_CONNECTION_STRING })
postgres.connect()

// Define table names variable (the names of the tables in Postgres and Airtable should be identical)
const { TABLE_NAMES_AS_CSV_STRING } = process.env
const TABLE_NAMES = TABLE_NAMES_AS_CSV_STRING.split(',')
console.log(`Table names: ${TABLE_NAMES.join(', ')}`)

  ;

(async () => {

  ////////////////////////////////////////////////////////////////////
  // Note: you should not need to edit the code below this comment
  ////////////////////////////////////////////////////////////////////


  // Process each table one at a time
  for (const tableName of TABLE_NAMES) {
    console.log(`Processing table ${tableName}...`)

    // Retrieve rows from Postgres
    const postgresTableQuery = await postgres.query(`SELECT * FROM ${POSTGRES_TABLE_PREFIX_IF_ANY}${tableName}`)
    const inputRecords = postgresTableQuery.rows
    console.log(`\tFound ${inputRecords.length} rows in Postgres`)

    // Retrieve rows from Airtable
    const table = await base(tableName)
    const airtableExistingRecords = await table.select().all()
    console.log(`\tFound ${airtableExistingRecords.length} rows in Airtable`)

    // Create an object mapping of the primary field to the record ID
    // Remember, it's assumed that the AIRTABLE_PRIMARY_FIELD_NAME field is truly unique
    const mapOfUniqueIdToExistingRecordId = createMappingOfUniqueFieldToRecordId(airtableExistingRecords, AIRTABLE_PRIMARY_FIELD_NAME)

    // Create two arrays: one for records to be created, one for records to be updated
    const recordsToCreate = []
    const recordsToUpdate = []

    // For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
    console.log(`\t\tProcessing ${inputRecords.length} records to determine whether to update or create`)
    for (const inputRecord of inputRecords) {
      const recordUniqueFieldValue = inputRecord[AIRTABLE_PRIMARY_FIELD_NAME]
      console.debug(`\t\tProcessing record w/ '${AIRTABLE_PRIMARY_FIELD_NAME}' === '${recordUniqueFieldValue}'`)
      // Check for an existing record with the same unique ID as the input record
      const recordMatch = mapOfUniqueIdToExistingRecordId[recordUniqueFieldValue]

      if (recordMatch === undefined) {
        // Add record to list of records to update
        console.log('\t\t\tNo existing records match; adding to recordsToCreate')
        recordsToCreate.push({ fields: inputRecord })
      } else {
        // Add record to list of records to create
        console.log(`\t\t\tExisting record w/ ID ${recordMatch} found; adding to recordsToUpdate`)
        recordsToUpdate.push({ id: recordMatch, fields: inputRecord })
      }
    }

    // Read out array sizes
    console.log(`\n\tRecords to create: ${recordsToCreate.length}`)
    console.log(`\tRecords to update: ${recordsToUpdate.length}\n`)

    try {
      // Perform record creation
      await actOnRecordsInChunks(table, 'create', recordsToCreate)

      // Perform record updates on existing records
      await actOnRecordsInChunks(table, 'update', recordsToUpdate)
    } catch (error) {
      console.error('An error occured while creating or updating records using the Airtable REST API')
      console.error(error)
      throw (error)
    }

    // console.log(`\tFinished processing table ${tableName}`)
  }

  console.log('\n\nScript execution complete')
  await postgres.end()

})()
