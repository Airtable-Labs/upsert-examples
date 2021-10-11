// Load external dependencies
const fetch = require('node-fetch')

// Helper function to get all records from a base. Handles pagination for you.
const getAllRecordsFromBase = async function (baseApiUrl, headers, pageSize = 100, msToSleep = 150) {
  // Create empty array to hold all records
  const records = []

  // Set initial request URL
  let apiRequestUrl = `${baseApiUrl}?pageSize=${pageSize}`
  console.log(`Retrieving all records for ${apiRequestUrl}`)

  // As long as apiRequestUrl is truthy
  while (apiRequestUrl) {
    // Make request to API
    const apiRequest = await fetch(apiRequestUrl, { headers })
    const apiResponse = await apiRequest.json()

    // Add records from the API response to array
    records.push(...apiResponse.records)
    console.debug(`\trecords array now has ${records.length} items`)

    // Look at response to see if there is another page to fetch
    if (apiResponse.offset) {
      apiRequestUrl = `${baseApiUrl}?pageSize=${pageSize}&offset=${apiResponse.offset}`
      await sleepInMs(msToSleep)
    } else {
      console.debug('\tNo further pagination required')
      apiRequestUrl = null
    }
  }

  // Return all records
  console.debug(`\t${records.length} total records retrieved\n`)
  return records
}

// Helper function from https://stackoverflow.com/questions/8495687/split-array-into-chunks
const chunkArray = function (arrayToChunk, chunkSize = 10) {
  const arraysOfChunks = []
  for (let i = 0; i < arrayToChunk.length; i += chunkSize) { arraysOfChunks.push(arrayToChunk.slice(i, i + chunkSize)) }
  return arraysOfChunks
}

// Helper function to act on a chnunk of records
//   method="POST" -> create new records
//   method="PUT" -> update existing records, will clear all unspecified cell values
//   method="PATCH" -> update existing records, will only update the fields you specify, leaving the rest as they were
const actOnRecordsInChunks = async function (baseApiUrl, headers, records, method, msToSleep = 150) {
  console.log(`\n${method}'ing ${records.length} records at ${baseApiUrl}`)
  const arrayOfChunks = chunkArray(records)
  for (const chunkOfRecords of arrayOfChunks) {
    console.log(`\tProcessing batch of ${chunkOfRecords.length} records`)
    const body = JSON.stringify({ records: chunkOfRecords })
    const apiRequest = await fetch(baseApiUrl, { headers, method, body })
    console.log(`\t\t${apiRequest.status} (${apiRequest.statusText})`)
    await sleepInMs(msToSleep)
  }
}

// Function which sleeps for the specified number of milliseconds. Helpful for proactively staying under API rate limits.
async function sleepInMs (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  getAllRecordsFromBase,
  createMappingOfUniqueFieldToRecordId,
  actOnRecordsInChunks
}
