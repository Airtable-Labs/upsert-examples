/*
    This script is an example of how to make a request to a RaaS URL that Workday can provide.
    With Basic Auth, the data can be retrieved as JSON, and parsed to import into Airtable using
    the airtable.js library that Airtable supports.
*/

require('dotenv').config();
const axios = require('axios');
const Airtable = require('airtable');

// Load helper functions from helpers.js
const { createMappingOfUniqueFieldToRecordId, actOnRecordsInChunks } = require('./helpers')

// Read in environment variable values
const { 
    AIRTABLE_API_KEY, 
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    AIRTABLE_UNIQUE_FIELD_NAME,
    WORKDAY_USERNAME,
    WORKDAY_PASSWORD,
    WORKDAY_RAAS_URL
} = process.env;

// Initialize Airtable.js, used for Base APIs
Airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = Airtable.base(AIRTABLE_BASE_ID);
const table = base(AIRTABLE_TABLE_ID);

// Initialize Axios client, used for Workday RaaS Endpoint
const axiosClient = axios.create({
  baseURL: WORKDAY_RAAS_URL,
  headers: {
    'Authorization': 'Basic ' + Buffer.from(WORKDAY_USERNAME + ":" + WORKDAY_PASSWORD).toString('base64'),
    'Content-Type': 'application/json'
  }
});

// Helper function to make request to Workday URL
const getWorkdayData = async () => {
    try {
        const response = await axiosClient.get();
        if (response.status === 200) {
            console.log('Successful response from Workday');
            return response.data['Report_Entry'];
        }

    } catch (err) {
        throw err;
    }
}

(async function () {
    // Retrieve Workday data
    const purchaseOrders = await getWorkdayData();

    // Create empty array to story shaped objects of flattened Workday data
    // this will be easier to work with when performing upsert logic
    const dataForAirtable = [];

    // Loop through Workday data and flatten the nested object

    // This example uses a specific schema
    // !! This will need to be updated to match the report you're pulling from
    for (const purchaseOrder of purchaseOrders) {
        purchaseOrder['Purchase_Order_Line_group'].map(lineItem => {
            dataForAirtable.push({
                fields: {
                    'Purchase Order': lineItem.Purchase_Order,
                    'Purchase Order Date': purchaseOrder.Purchase_Order_Date,
                    'Buyer': purchaseOrder.Buyer,
                    'PO Days Passed': Number(purchaseOrder.FIN_DD_PODaysPassed),
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

    /*
        The rest of the code in this example is using the best practices
        we recommend when performing an UPSERT on data (update / create)
        
        You can find examples here: https://github.com/Airtable-Labs/upsert-examples
    */

    // Query existing records in Airtable
    const existingRecords = await table.select().all();

    // Create a map of Airtable Unique Field value and Airtable Record ID
    const mapOfUniqueIdToExistingRecordId = createMappingOfUniqueFieldToRecordId(existingRecords, AIRTABLE_UNIQUE_FIELD_NAME);
    
    // Two empty arrays to store records that will need to be either created or updated
    const recordsToCreate = [];
    const recordsToUpdate = [];

    // Loop through Workday data that's been shaped
    for (const record of dataForAirtable) {

        // create unique key that exists in Airtable. This will be used to identify whether a record already exists and should be updated
        // This is specific to the fields in the Workday report and fields in Airtable. Update accordingly
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

    // Perform record creation
    await actOnRecordsInChunks(table, 'create', recordsToCreate);

    // Perform record updates on existing records
    await actOnRecordsInChunks(table, 'update', recordsToUpdate);
})();

