import os
import snowflake.connector
import pandas as pd
from pyairtable import Table
from dotenv import load_dotenv

load_dotenv()

# Configuration variables for Airtable and Snowflake
SNOWFLAKE_USERNAME = os.environ['SNOWFLAKE_USERNAME']
SNOWFLAKE_PASSWORD = os.environ['SNOWFLAKE_PASSWORD']
SNOWFLAKE_ACCOUNT = os.environ['SNOWFLAKE_ACCOUNT']
SNOWFLAKE_TABLE_OR_VIEW = os.environ['SNOWFLAKE_TABLE_OR_VIEW']
AIRTABLE_API_KEY = os.environ['AIRTABLE_API_KEY']
AIRTABLE_BASE_ID = os.environ['AIRTABLE_BASE_ID']
AIRTABLE_TABLE_ID = os.environ['AIRTABLE_TABLE_ID']
AIRTABLE_UNIQUE_FIELD_NAME = os.environ['AIRTABLE_UNIQUE_FIELD_NAME']

#Initialize Airtable Client
Table = Table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)

#Initialize Snowflake Client
conn = snowflake.connector.connect(
    user = SNOWFLAKE_USERNAME,
    password = SNOWFLAKE_PASSWORD,
    account = SNOWFLAKE_ACCOUNT
)

# Define input variables from Snowflake
cur = conn.cursor()
cur.execute('select * from '+ SNOWFLAKE_TABLE_OR_VIEW)
df = cur.fetch_pandas_all()

# Map df rows to Airtable records
inputRecords = df.to_dict('records')

# Retrieve all existing records from the base through the Airtable REST API
allExistingRecords = Table.all()

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
print("\n{} records to create".format(len(recordsToCreate)))
print("{} records to update".format(len(recordsToUpdate)))

# Perform record creation
Table.batch_create(recordsToCreate)

# Perform record updates on existing records
Table.batch_update(recordsToUpdate)

print("\n\nScript execution complete!")