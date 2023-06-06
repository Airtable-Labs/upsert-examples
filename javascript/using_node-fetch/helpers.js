// Load external dependencies
const fetch = require('node-fetch')

// Helper function from https://stackoverflow.com/questions/8495687/split-array-into-chunks
const chunkArray = function (arrayToChunk, chunkSize = 10) {
  const arraysOfChunks = []
  for (let i = 0; i < arrayToChunk.length; i += chunkSize) { arraysOfChunks.push(arrayToChunk.slice(i, i + chunkSize)) }
  return arraysOfChunks
}

// Helper function to upsert a chunk of records
//   method="PUT" -> upsert (insert-or-update) records, will clear all unspecified cell values
//   method="PATCH" -> upsert (insert-or-update) records, will only update the fields you specify, leaving the rest as they were
const upsertRecordsInChunks = async function (baseApiUrl, headers, records, fieldsToMergeOn,  msToSleep = 150, method = "PATCH") {
  console.log(`\nupsert'ing ${records.length} records at ${method} ${baseApiUrl}`)
  const arrayOfChunks = chunkArray(records)
  for (const chunkOfRecords of arrayOfChunks) {
    console.log(`\tProcessing batch of ${chunkOfRecords.length} records`)
    const body = JSON.stringify({ records: chunkOfRecords, typecast: true, performUpsert: { fieldsToMergeOn } })
    const apiRequest = await fetch(baseApiUrl, { headers, method, body })
    console.log(`\t\t${apiRequest.status} (${apiRequest.statusText})`)
    await sleepInMs(msToSleep)
  }
}

// Function which sleeps for the specified number of milliseconds. Helpful for proactively staying under API rate limits.
async function sleepInMs (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
  upsertRecordsInChunks
}
