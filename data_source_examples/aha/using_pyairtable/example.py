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

# Format inputRecords to include a fields object
recordsToUpsert = []
for record in inputRecords:
    recordsToUpsert.append( 
        dict(fields=record))

# Read out array sizes
print(f'{len(recordsToUpsert)} records to upsert.')

# Perform record upsert
Table.batch_upsert(recordsToUpsert, [AIRTABLE_UNIQUE_FIELD_NAME])

print("\n\nScript execution complete!")