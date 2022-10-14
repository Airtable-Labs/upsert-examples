# Load dependencies
import os
from pyairtable import Table  # to interact with Airtable REST API
from dotenv import load_dotenv  # to load .env files with environment variables
import requests

# Load .env file
load_dotenv()

# Configuration variables for Airtable
AIRTABLE_API_KEY = os.environ['AIRTABLE_API_KEY']
AIRTABLE_BASE_ID = os.environ['AIRTABLE_BASE_ID']
AIRTABLE_TABLE_ID = os.environ['AIRTABLE_TABLE_ID']
AIRTABLE_UNIQUE_FIELD_NAME = os.environ['AIRTABLE_UNIQUE_FIELD_NAME']
FRAME_API_KEY = os.environ['FRAME_API_KEY']
FRAME_ACCOUNT_ID = os.environ['FRAME_ACCOUNT_ID']

# Function to retreieve 1 page of Frame.io Assets
def getAssets(pageNumber):
    url = 'https://api.frame.io/v2/search/assets?account_id='+FRAME_ACCOUNT_ID
    headers = { 
        'Authorization': 'Bearer '+FRAME_API_KEY
    }
    params = {
        'page_size': 1000,
        'page': pageNumber
    }

    r = requests.get(url, headers=headers, params=params)
    assets = []
    for x in r.json():
        assets.append({
            'Asset ID': x.get('id'),
            'Name': x.get('name'),
            'Status': x.get('label')
        })
    totalPages = r.headers.get('total-pages')
    return assets, totalPages

# Initialize Airtable client
Table = Table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)

# Retrieve assets from Frame.io
inputRecords, totalPages = getAssets(1)
if int(totalPages) > 1:
    for x in range(int(totalPages)-1):
        newRecords,totalPages = getAssets(x+2)
        inputRecords.extend(newRecords)

# Retrieve all existing records from the base through the Airtable REST API
allExistingRecords = Table.all()
print('{} existing records found'.format(len(allExistingRecords)))

# Create an object mapping of the primary field to the record ID
# Remember, it's assumed that the AIRTABLE_UNIQUE_FIELD_NAME field is truly unique
upsertFieldValueToExistingRecordId = {
    existingRecord['fields'].get(AIRTABLE_UNIQUE_FIELD_NAME): existingRecord['id'] for existingRecord in allExistingRecords
}

# Create two arrays: one for records to be created, one for records to be updated
recordsToCreate = []
recordsToUpdate = []

# For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
print('\nProcessing {} input records to determine whether to update or create'.format(
    len(inputRecords)))
for inputRecord in inputRecords:
    recordUniqueValue = inputRecord.get(AIRTABLE_UNIQUE_FIELD_NAME, None)
    print('\tProcessing record w / \'{}\' === \'{}\''.format(
        AIRTABLE_UNIQUE_FIELD_NAME, recordUniqueValue))

    existingRecordIdBasedOnUpsertFieldValueMaybe = upsertFieldValueToExistingRecordId.get(
        recordUniqueValue)

    # and if the upsert field value matches an existing one...
    if existingRecordIdBasedOnUpsertFieldValueMaybe:
        # Add record to list of records to update
        print('\t\tExisting record w / ID {} found; adding to recordsToUpdate'.format(
            existingRecordIdBasedOnUpsertFieldValueMaybe))
        recordsToUpdate.append(
            dict(id=existingRecordIdBasedOnUpsertFieldValueMaybe, fields=inputRecord))
    else:
        # Otherwise, add record to list of records to create
        print('\t\tNo existing records match; adding to recordsToCreate')
        recordsToCreate.append(inputRecord)

# Read out array sizes
print("\n{} records to create".format(len(recordsToCreate)))
print("{} records to update".format(len(recordsToUpdate)))

# Perform record creation
Table.batch_create(recordsToCreate)

# Perform record updates on existing records
Table.batch_update(recordsToUpdate)

print("\n\nScript execution complete!")