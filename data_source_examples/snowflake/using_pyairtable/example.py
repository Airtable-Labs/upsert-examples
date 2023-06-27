import os
import snowflake.connector
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

# Retrieve all rows from Snowflake table or view
cur = conn.cursor()
cur.execute('select * from '+ SNOWFLAKE_TABLE_OR_VIEW)
df = cur.fetch_pandas_all()

# Map df rows to Airtable records
inputRecords = df.to_dict('records')

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