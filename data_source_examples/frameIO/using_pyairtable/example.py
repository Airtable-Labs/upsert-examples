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