# Load dependencies
import os
from pyairtable import Table  # to interact with Airtable REST API
from dotenv import load_dotenv  # to load .env files with environment variables

# Load .env file
load_dotenv()

# Configuration variables for Airtable
AIRTABLE_API_KEY = os.environ['AIRTABLE_API_KEY']
AIRTABLE_BASE_ID = os.environ['AIRTABLE_BASE_ID']
AIRTABLE_TABLE_ID = os.environ['AIRTABLE_TABLE_ID']
AIRTABLE_UNIQUE_FIELD_NAME = os.environ['AIRTABLE_UNIQUE_FIELD_NAME']

# Initialize Airtable client
Table = Table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)

# Define input records(from the source system). This would usually be an API call or reading in a CSV or other format of data.
inputRecords = [
    # Existing person in the table, if using the sample data linked to in the README
    {
        'First Name': 'Juliette',
        'Last Name': 'Schimmang',
        'Unique ID': '16a05ea5-7bbd-4353-bc25-878a2245835e',
        'Job Title': 'Account Executive II'
    },
    # New user to be added to the table
    {
        'First Name': 'Marsha',
        'Last Name': 'Rickeard',
        'Unique ID': 'bf68da9d-805b-4117-90dc-d54eb46db19f',
        'Job Title': 'CTO',
        'Hire Number': 201
    }
]

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

# Uncomment the following block of code if you wish to set records in Airtable # that do not exist in
# your inputRecords dataset. The example code assumes you have a checkbox field named "Inactive"
# # Create sets of unique ID values for both input and existing records
# inputRecordsUpsertFieldValues = set([
#     d[AIRTABLE_UNIQUE_FIELD_NAME] for d in inputRecords])
# allExistingRecordsUpsertFieldValues = set([
#     d['fields'][AIRTABLE_UNIQUE_FIELD_NAME] for d in allExistingRecords])
# # Determine which unique ID values are not present in input records
# existingRecordsUpsertFieldValuesNotPresentInInputRecords = allExistingRecordsUpsertFieldValues.difference(
#     inputRecordsUpsertFieldValues)
# # Create list of dictionaries representing Airtable update record API payloads
# recordsToUpdateAsInactive = [{'id': upsertFieldValueToExistingRecordId.get(
#     recordUniqueValue), 'fields': {'Inactive': True}}
#     for recordUniqueValue in existingRecordsUpsertFieldValuesNotPresentInInputRecords]
# print("\n{} records to set Inactive=true (unique ID exists in Airtable records but not in input data source)".format(
#     len(recordsToUpdateAsInactive)))
# # Perform record updates on existing records that are now considered 'Inactive'
# Table.batch_update(recordsToUpdateAsInactive)

print("\n\nScript execution complete!")
