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

# Format inputRecords to include a fields object
recordsToUpsert = []
for record in inputRecords:
    recordsToUpsert.append( 
        dict(fields=record))

# Read out array sizes
print(f'{len(recordsToUpsert)} records to upsert.')

# Perform record upsert
Table.batch_upsert(recordsToUpsert, ['Unique ID'])

print("\n\nScript execution complete!")