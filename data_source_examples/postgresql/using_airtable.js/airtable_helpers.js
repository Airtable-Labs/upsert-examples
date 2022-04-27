// Helper function from https://stackoverflow.com/questions/8495687/split-array-into-chunks
const chunkArray = function (arrayToChunk, chunkSize = 10) {
  const arraysOfChunks = []
  for (let i = 0; i < arrayToChunk.length; i += chunkSize) { arraysOfChunks.push(arrayToChunk.slice(i, i + chunkSize)) }
  return arraysOfChunks
}

// Helper function to act on a chnunk of records
const actOnRecordsInChunks = async function (table, createOrUpdate, records) {
  console.log(`\t${createOrUpdate}'ing ${records.length} records`)
  const arrayOfChunks = chunkArray(records)
  for (const chunkOfRecords of arrayOfChunks) {
    console.log(`\t\tProcessing batch of ${chunkOfRecords.length} records`)
    if (createOrUpdate === 'create') {
      await table.create(chunkOfRecords, { typecast: true }) // typecast=true so that we can specify values instead of record IDs with the Airtable REST API
    } else if (createOrUpdate === 'update') {
      await table.update(chunkOfRecords, { typecast: true })
    } else {
      throw new Error(`Unexpected value for createOrUpdate: ${createOrUpdate}`)
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

module.exports = {
  createMappingOfUniqueFieldToRecordId,
  actOnRecordsInChunks
}
