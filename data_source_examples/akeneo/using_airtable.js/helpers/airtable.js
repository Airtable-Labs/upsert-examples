// credit https://stackoverflow.com/questions/8495687/split-array-into-chunks
const chunkArray = function (arrayToChunk, chunkSize = 10) {
  const arraysOfChunks = []
  for (let i = 0; i < arrayToChunk.length; i += chunkSize) { arraysOfChunks.push(arrayToChunk.slice(i, i + chunkSize)) }
  return arraysOfChunks
}

const upsertRecordsInChunks = async function (table, records, fieldsToMergeOn) {
  console.log(`\nupsert'ing ${records.length} records`)
  const arrayOfChunks = chunkArray(records)
  for (const chunkOfRecords of arrayOfChunks) {
    console.log(`\tProcessing batch of ${chunkOfRecords.length} records`)
    await table.update(chunkOfRecords, { typecast: true, performUpsert: { fieldsToMergeOn } })
  }
}

module.exports = {
  upsertRecordsInChunks
}
