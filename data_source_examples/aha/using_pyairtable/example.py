import os
import requests
from pyairtable import Table
from dotenv import load_dotenv

load_dotenv()

# Configuration variables for Airtable and Snowflake
AHA_ACCOUNT_NAME = os.environ['AHA_ACCOUNT_NAME']
AHA_API_KEY = os.environ['AHA_API_KEY']
AIRTABLE_API_KEY = os.environ['AIRTABLE_API_KEY']
AIRTABLE_BASE_ID = os.environ['AIRTABLE_BASE_ID']
AIRTABLE_TABLE_ID = os.environ['AIRTABLE_TABLE_ID']
AIRTABLE_UNIQUE_FIELD_NAME = os.environ['AIRTABLE_UNIQUE_FIELD_NAME']

#Initialize Airtable Client
Table = Table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)

# Retrieve all features from Aha! account
endpoint = f'https://{AHA_ACCOUNT_NAME}.aha.io/api/v1/features'
headers = {'Authorization': f'Bearer {AHA_API_KEY}'}

# Start a session to paginate through multiple API calls
session = requests.Session()

# Paginate through features, returning a list of all features within the provided account
def getFeatures():
    print('\nRetrieving Features')
    firstPage = session.get(endpoint, headers=headers).json()
    features = firstPage.get('features')
    numPages = firstPage['pagination']['total_pages']

    for page in range(2, numPages +1): 
        nextPage = session.get(endpoint, headers=headers, params={'page': page}).json()
        features = features+ nextPage.get('features')

    return features

features = getFeatures()
print(f'All feature retrieved. Count: {len(features)}')

# Map feature details to Airtable field names
def mapFeatures(feature):
    return {
        'Name': feature.get('name'),
        'Aha ID': feature.get('id'),
        'Reference Num': feature.get('reference_num'),
        'Created At': feature.get('created_at'),
        'URL': feature.get('url'),
        'Product ID': feature.get('product_id')
    }

inputRecords = list(map(mapFeatures, features))

# For each feature, get additional details through another API call
print('\nGetting additional feature details. This may take several moments.')
for record in inputRecords:
    featureEndpoint = endpoint + '/' + record.get('Reference Num')
    featureResponse = requests.get(featureEndpoint, headers=headers).json()
    feature = featureResponse.get('feature')
    record['Start Date'] = feature.get('start_date')
    record['End Date'] = feature.get('due_date')
    record['Progress'] = feature.get('progress') * .01 if feature.get('progress') else None
    record['Progress Source'] = feature.get('progress_source')
print('Feature details retrieved')

# Retrieve all existing records from the base through the Airtable REST API
allExistingRecords = Table.all()
print(f'All existing records retrieved. Count: {len(allExistingRecords)}')

# Create an object mapping of the primary field to the record ID
# Remember, it's assumed that the AIRTABLE_UNIQUE_FIELD_NAME field is truly unique
upsertFieldValueToExistingRecordId = {
    existingRecord['fields'].get(AIRTABLE_UNIQUE_FIELD_NAME): existingRecord['id'] for existingRecord in allExistingRecords
}

# Create two arrays: one for records to be created, one for records to be updated
recordsToCreate = []
recordsToUpdate = []

# For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
for inputRecord in inputRecords:
    recordUniqueValue = inputRecord.get(AIRTABLE_UNIQUE_FIELD_NAME, None)
    # print('\tProcessing record w / \'{}\' === \'{}\''.format(
    #     AIRTABLE_UNIQUE_FIELD_NAME, recordUniqueValue))

    existingRecordIdBasedOnUpsertFieldValueMaybe = upsertFieldValueToExistingRecordId.get(
        recordUniqueValue)

    # and if the upsert field value matches an existing one...
    if existingRecordIdBasedOnUpsertFieldValueMaybe:
        # Add record to list of records to update
        recordsToUpdate.append(
            dict(id=existingRecordIdBasedOnUpsertFieldValueMaybe, fields=inputRecord))
    else:
        # Otherwise, add record to list of records to create
        recordsToCreate.append(inputRecord)

# Read out array sizes
print('\n{} records to create'.format(len(recordsToCreate)))
print('{} records to update'.format(len(recordsToUpdate)))

# Perform record creation
Table.batch_create(recordsToCreate)

# Perform record updates on existing records
Table.batch_update(recordsToUpdate)

# Uncomment the following block of code if you wish to set records in Airtable # that do not exist in
# your inputRecords dataset. The example code assumes you have a checkbox field named 'Inactive'
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
# print('\n{} records to set Inactive=true (unique ID exists in Airtable records but not in input data source)'.format(
#     len(recordsToUpdateAsInactive)))
# # Perform record updates on existing records that are now considered 'Inactive'
# Table.batch_update(recordsToUpdateAsInactive)

print('\n\nScript execution complete!')