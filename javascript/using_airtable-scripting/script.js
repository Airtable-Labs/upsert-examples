// Click the "gear" icon in the top right to view settings
const config = input.config({
  title: 'Upsert Example',
  description: 'Powered by an Airtable Scripting app. Learn more at https://airtable.com/developers/scripting',
  items: [
    input.config.table('table', {
      label: 'Table to use',
      description: 'Pick a table in this base that follows the expected schema (see code comments)',
    }),
    input.config.field('uniqueField', {
      label: 'Field within selected table that contains a unique ID (ex: Unique ID)',
      parentTable: 'table',
    })
  ]
});

// Read in script settings
const { table, uniqueField } = config

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

// Helper function that takes an array of records and returns a mapping of primary field to record ID
const createMappingOfUniqueFieldToRecordId = function (records, fieldName) {
  const mapping = {}
  for (const existingRecord of records) {
    mapping[existingRecord.getCellValueAsString(fieldName)] = existingRecord.id
  }
  return mapping
}

// Helper function from https://stackoverflow.com/questions/8495687/split-array-into-chunks
const chunkArray = function (arrayToChunk, chunkSize = 50) {
  const arraysOfChunks = []
  for (var i = 0; i < arrayToChunk.length; i += chunkSize)
    arraysOfChunks.push(arrayToChunk.slice(i, i + chunkSize))
  return arraysOfChunks
}

// Helper functions that takes a table reference and array of un-chunked records
//   and updates/creates the records
const updateRecordsInChunks = async function (table, records) {
  const arrayOfChunks = chunkArray(records)
  for (const chunkOfRecords of arrayOfChunks) {
    const updateResult = await table.updateRecordsAsync(chunkOfRecords)
    console.info(`🔁  Updated ${chunkOfRecords.length} record(s) in the '${table.name}' table`)
  }
}
const createRecordsInChunks = async function (table, records) {
  const arrayOfChunks = chunkArray(records)
  for (const chunkOfRecords of arrayOfChunks) {
    const createResult = await table.createRecordsAsync(chunkOfRecords)
    console.info(`➕  Inserted ${createResult.length} record(s) into the '${table.name}' table`)
  }
}

// Retrieve all existing records from the base
const existingRecords = await table.selectRecordsAsync({ fields: table.fields })

// Create an object mapping of the primary field to the record ID
// Remember, it's assumed that the the unique field field is truly unique
const mapOfUniqueIdToExistingRecordId = createMappingOfUniqueFieldToRecordId(existingRecords.records, uniqueField.name)

// Create two arrays: one for records to be created, one for records to be updated
const recordsToCreate = []
const recordsToUpdate = []

// For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
console.log(`Processing ${inputRecords.length} input records to determine whether to update or create`)
for (const inputRecord of inputRecords) {
  const recordUniqueFieldValue = inputRecord[uniqueField.name]
  console.debug(`\tProcessing record w/ '${uniqueField.name}' === '${recordUniqueFieldValue}'`)
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
console.log(`Records to create: ${recordsToCreate.length}`)
console.log(`Records to update: ${recordsToUpdate.length}`)

// Perform record creation
await createRecordsInChunks(table, recordsToCreate)

// Perform record updates on existing records
await updateRecordsInChunks(table, recordsToUpdate)

console.log('Script execution complete!')
