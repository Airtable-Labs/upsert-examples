const {
    workdayUrl,
    username,
    password
} = input.config();

// this is needed to authenticate the request to the Workday RaaS URL 
// it's a base64 encoded string of username:password
const b64encodedString = ''

/*************** HELPER FUNCTIONS ********************************/

// Make request to RaaS URL and return data
const getWorkdayData = async (url, authKey) => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + authKey,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    return data['Report_Entry'];
}

// Takes an array of records and returns a mapping of primary field to record ID
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
    // console.info(`🔁  Updated ${chunkOfRecords.length} record(s) in the '${table.name}' table`)
  }
}
const createRecordsInChunks = async function (table, records) {
  const arrayOfChunks = chunkArray(records)
  for (const chunkOfRecords of arrayOfChunks) {
    const createResult = await table.createRecordsAsync(chunkOfRecords)
    // console.info(`➕  Inserted ${createResult.length} record(s) into the '${table.name}' table`)
  }
}

/************* Get Data from Workday *******************************/

// make request to workday and return purchase order data
const purchaseOrders = await getWorkdayData(workdayUrl, b64encodedString);

// load the Airtable table we need to write data to
const purchaseOrderTable = base.getTable('Workday Purchase Orders - new');

// create empty array to store transformed data
const dataForAirtable = [];

// This example uses a specific schema
// This will need to be updated to match the report you're pulling from
for (const purchase of purchaseOrders) {
    purchase['Purchase_Order_Line_group'].map(lineItem => {
        dataForAirtable.push({
            fields: {
                'Purchase Order': lineItem.Purchase_Order,
                'Purchase Order Date': purchase.Purchase_Order_Date,
                'Buyer': purchase.Buyer,
                'PO Days Passed': Number(purchase.FIN_DD_PODaysPassed),
                'Amount Received': Number(lineItem.Amount_Received),
                'Extended Amount': Number(lineItem.Extended_Amount),
                'Cost_Center': lineItem.Cost_Center,
                'Quantity': Number(lineItem.Quantity),
                'Supplier_Text': lineItem.Supplier ,
                'Item_Description': lineItem.Item_Description,
                'Spend_Category_as_Worktag': lineItem.Spend_Category_as_Worktag
            }
        })
    });
}

/******************************************************************/
/*
    The rest of the code in this example is using the best practices
    we recommend when performing an UPSERT on data (update / create)
    
    You can find examples here: https://github.com/Airtable-Labs/upsert-examples
*/


// load existing records in Airtable
const existingRecords = await purchaseOrderTable.selectRecordsAsync({ fields: ['Unique Key'] });

// create a map object of the primary field and Airtable record id
/*
  Example:
  {
    PO-10000048: rec12413adwd,
    PO-100059: rec7637adaad
  }
*/
const mapOfUniqueIdToExistingRecordId = createMappingOfUniqueFieldToRecordId(existingRecords.records, 'Unique Key');

// // create two empty arrays, one for records to create in Airtable and one to update existing records
const recordsToCreate = [];
const recordsToUpdate = [];

// // loop through data transformed in previous steps, create unique key to compare against existing data
for (const record of dataForAirtable) {

  // Create unique key that exists in Airtable. This will be used to identify whether a record already exists and should be updated
  // This is specific to the fields in the Workday report and the fields in Airtable. Update accordingly
  const uniqueKey = record.fields['Purchase Order'] + '|' + record.fields['Spend_Category_as_Worktag'] + '|' + record.fields['Extended Amount'];

  // find matching key and record ID
  const recordMatch = mapOfUniqueIdToExistingRecordId[uniqueKey];

  // if no match, create new record, otherwise update existing
  if (recordMatch === undefined) {
    recordsToCreate.push(record);
  } else {
    recordsToUpdate.push({ id: recordMatch, fields: record.fields });
  }

}

// output how many records to be created and updated
console.log(`Records to create: ${recordsToCreate.length}`);
console.log(`Records to update: ${recordsToUpdate.length}`);

// // create and update records in chunks
await createRecordsInChunks(purchaseOrderTable, recordsToCreate);
await updateRecordsInChunks(purchaseOrderTable, recordsToUpdate);
