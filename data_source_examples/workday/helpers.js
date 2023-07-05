// Helper function from https://stackoverflow.com/questions/8495687/split-array-into-chunks
const chunkArray = function (arrayToChunk, chunkSize = 10) {
  const arraysOfChunks = []
  for (let i = 0; i < arrayToChunk.length; i += chunkSize) { arraysOfChunks.push(arrayToChunk.slice(i, i + chunkSize)) }
  return arraysOfChunks
}
  
// Helper function to upsert a chunk of records
const upsertRecordsInChunks = async function (table, records, fieldsToMergeOn) {
  console.log(`\n${createOrUpdate}'ing ${records.length} records`)
  const arrayOfChunks = chunkArray(records)
  for (const chunkOfRecords of arrayOfChunks) {
    console.log(`\tProcessing batch of ${chunkOfRecords.length} records`)
    try {
      await table.update(chunkOfRecords, {'performUpsert': {'fieldsToMergeOn': fieldsToMergeOn}});
    } catch (error) {
      console.error(`Error occurred while upserting records: ${error.message}`);
    }
  }
}
  
module.exports = {
  upsertRecordsInChunks
}