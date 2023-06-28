import os
from dotenv import load_dotenv
from google.cloud import bigquery
from google.oauth2 import service_account
from pyairtable import Table

load_dotenv()

# Configuration variables for Airtable and Snowflake
AIRTABLE_API_KEY = os.environ['AIRTABLE_API_KEY']
AIRTABLE_BASE_ID = os.environ['AIRTABLE_BASE_ID']
AIRTABLE_TABLE_ID = os.environ['AIRTABLE_TABLE_ID']
AIRTABLE_UNIQUE_FIELD_NAME_OR_ID = os.environ['AIRTABLE_UNIQUE_FIELD_NAME_OR_ID']
GOOGLE_SERVICE_ACCOUNT_FILE_PATH = os.environ['GOOGLE_SERVICE_ACCOUNT_FILE_PATH']
GOOGLE_BIGQUERY_QUERY = os.environ['GOOGLE_BIGQUERY_QUERY']


def query_bigquery(query):
    # load service account to run locally
    credentials = service_account.Credentials.from_service_account_file(GOOGLE_SERVICE_ACCOUNT_FILE_PATH)
    # Initialize bigquery client
    client = bigquery.Client(credentials=credentials, project=credentials.project_id)

    # query bigquery
    query_job = client.query(query)
    result = query_job.result()

    return result

def transform_into_airtable_records(bigquery_data):
    # transform bigquery data where each row (record) is nested within a 'fields' property
    records = [{"fields": dict(row)} for row in bigquery_data]
    return records

def upsert_data_to_airtable(api_key, base_id, table_id, airtable_records, unique_id):
    #Initialize airtable client
    table = Table(api_key, base_id, table_id)

    # call the airtable upsert operation
    table.batch_upsert(airtable_records, [unique_id])

if __name__ == "__main__":

    print('Querying BigQuery...')
    bigquery_data = query_bigquery(GOOGLE_BIGQUERY_QUERY)
    print('Query Complete.')

    airtable_records = transform_into_airtable_records(bigquery_data)

    print(f'Upserting {len(airtable_records)} records to Airtable base: {AIRTABLE_BASE_ID} - and table: {AIRTABLE_TABLE_ID}.')
    upsert_data_to_airtable(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, airtable_records, AIRTABLE_UNIQUE_FIELD_NAME_OR_ID)

    print('Upsert Complete.')