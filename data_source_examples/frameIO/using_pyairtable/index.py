# Load dependencies
import os
from pyairtable import Table  # to interact with Airtable REST API
from dotenv import load_dotenv  # to load .env files with environment variables
from assetScraper import *

# Load .env file
load_dotenv()

# Configuration variables for Airtable and Frameio
AIRTABLE_API_KEY = os.environ['AIRTABLE_API_KEY']
AIRTABLE_BASE_ID = os.environ['AIRTABLE_BASE_ID']
AIRTABLE_TABLE_ID = os.environ['AIRTABLE_TABLE_ID']
AIRTABLE_UNIQUE_FIELD_NAME = os.environ['AIRTABLE_UNIQUE_FIELD_NAME']
FRAME_API_KEY = os.environ['FRAME_API_KEY']

# Initialize Frameio Client
client = FrameioClient(FRAME_API_KEY)

# Call functions from assetScraper.py to gather all assets in the account
projects = get_projects_from_account(client)
assets_in_account = scrape_asset_data_from_projects(client, projects)

# Create function to map desired Asset fields to Airtable field names
def mapAssets(asset):
    return {
        'Asset ID': asset.get('id'),
        'Name': asset.get('name'),
        'Status': asset.get('label'),
        'Type': asset.get('type')
    }
inputRecords = list(map(mapAssets, assets_in_account))

# Initialize Airtable client
Table = Table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)

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