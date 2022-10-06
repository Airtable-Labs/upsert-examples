// Helper function from https://stackoverflow.com/questions/8495687/split-array-into-chunks
const chunkArray = function (arrayToChunk, chunkSize = 10) {
  const arraysOfChunks = []
  for (let i = 0; i < arrayToChunk.length; i += chunkSize) {
    arraysOfChunks.push(arrayToChunk.slice(i, i + chunkSize))
  }
  return arraysOfChunks
}

// Helper function to act on a chnunk of records
const actOnRecordsInChunks = async function (table, createOrUpdate, records) {
  // console.log(`\t${createOrUpdate}'ing ${records.length} records`)
  const arrayOfChunks = chunkArray(records)
  for (const chunkOfRecords of arrayOfChunks) {
    // console.log(`\t\tProcessing batch of ${chunkOfRecords.length} records`)
    try {
      if (createOrUpdate === 'create') {
        await table.create(chunkOfRecords, { typecast: true }) // typecast=true so that we can specify values instead of record IDs with the Airtable REST API
      } else if (createOrUpdate === 'update') {
        await table.update(chunkOfRecords, { typecast: true })
      } else {
        throw new Error(`Unexpected value for createOrUpdate: ${createOrUpdate}`)
      }
    } catch (err) {
      console.error('\t\t\t!!! Error occured while creating or updating records')
    }
  }
}

// Helper function that takes an array of records and returns a mapping of primary field to record ID
const createMappingOfUniqueFieldToRecordId = function (records, fieldName) {
  const mapping = {}
  for (const existingRecord of records) {
    mapping[existingRecord.fields[fieldName]] = existingRecord.id
  }
  return mapping
}

// Helper function to update or create records
async function upsertRecords (table, tableNameOrId, airtableUniqueFieldName, inputRecords) {
  console.log(`Upserting records on table '${tableNameOrId}'`)

  // Retrieve all existing records from the base through the Airtable REST API
  const existingRecords = await table.select().all()

  // Create an object mapping of the primary field to the record ID
  // Remember, it's assumed that the AIRTABLE_UNIQUE_FIELD_NAME field is truly unique
  const mapOfUniqueIdToExistingRecordId = createMappingOfUniqueFieldToRecordId(existingRecords, airtableUniqueFieldName)

  // Create two arrays: one for records to be created, one for records to be updated
  const recordsToCreate = []
  const recordsToUpdate = []

  // For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
  console.log(`\tProcessing ${inputRecords.length} input records to determine whether to update or create in table '${tableNameOrId}'`)
  for (const inputRecord of inputRecords) {
    const recordUniqueFieldValue = inputRecord[airtableUniqueFieldName]
    // console.debug(`\t\tProcessing record w/ '${airtableUniqueFieldName}' === '${recordUniqueFieldValue}'`)
    // Check for an existing record with the same unique ID as the input record
    const recordMatch = mapOfUniqueIdToExistingRecordId[recordUniqueFieldValue]

    if (recordMatch === undefined) {
      // Add record to list of records to update
      // console.log('\t\t\tNo existing records match; adding to recordsToCreate')
      recordsToCreate.push({ fields: inputRecord })
    } else {
      // Add record to list of records to create
      // console.log(`\t\t\tExisting record w/ ID ${recordMatch} found; adding to recordsToUpdate`)
      recordsToUpdate.push({ id: recordMatch, fields: inputRecord })
    }
  }

  // Read out array sizes
  console.log(`\n\tRecords to create in table '${tableNameOrId}': ${recordsToCreate.length}`)
  console.log(`\tRecords to update in table '${tableNameOrId}': ${recordsToUpdate.length}\n`)

  // Perform record creation
  await actOnRecordsInChunks(table, 'create', recordsToCreate)

  // Perform record updates on existing records
  await actOnRecordsInChunks(table, 'update', recordsToUpdate)
}

module.exports = {
  createMappingOfUniqueFieldToRecordId,
  upsertRecords
}
