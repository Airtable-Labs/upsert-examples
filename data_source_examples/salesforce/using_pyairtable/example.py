import os
from datetime import datetime
from simple_salesforce import Salesforce
from pyairtable import Table
from dotenv import load_dotenv

load_dotenv()

# Configuration variables for Airtable and Salesforce
SALESFORCE_INSTANCE_URL = os.environ["SALESFORCE_INSTANCE_URL"]
SALESFORCE_USERNAME = os.environ["SALESFORCE_USERNAME"]
SALESFORCE_PASSWORD = os.environ["SALESFORCE_PASSWORD"]
SALESFORCE_SECURITY_TOKEN = os.environ["SALESFORCE_SECURITY_TOKEN"]

AIRTABLE_API_KEY = os.environ["AIRTABLE_API_KEY"]
AIRTABLE_BASE_ID = os.environ["AIRTABLE_BASE_ID"]
AIRTABLE_TABLE_ID = os.environ["AIRTABLE_TABLE_ID"]
AIRTABLE_UNIQUE_FIELD_ID_OR_NAME = os.environ["AIRTABLE_UNIQUE_FIELD_ID_OR_NAME"]

# Initialize Airtable Client
Table = Table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)

# Initialize Salesforce Client
salesforceClient = Salesforce(
    instance_url=SALESFORCE_INSTANCE_URL,
    username=SALESFORCE_USERNAME,
    password=SALESFORCE_PASSWORD,
    security_token=SALESFORCE_SECURITY_TOKEN,
)

# Query Account records in bulk
allAccountsQuery = """
    SELECT
        Id, Name, Website, Industry, Owner.Id, Owner.Name, Owner.Email, CreatedDate, LastModifiedDate
    FROM
        Account
    WHERE
        LastModifiedDate >= 2022-01-01T00:00:00Z
"""

# Perform query and return a generator
print(f"Querying Salesforce for records.")
allAccountsFetch = salesforceClient.bulk.Account.query_all(
    allAccountsQuery, lazy_operation=True
)

# Paginate through the generator and create an array containing all input records
inputRecords = []
for results in allAccountsFetch:
    inputRecords.extend(results)
print(f"{len(inputRecords)} records retrieved from Salesforce.")

# Create an array of Airtable-formatted records to upsert
recordsToUpsert = []
for record in inputRecords:
    recordsToUpsert.append(
        dict(
            fields={
                "SFDC ID": record["Id"],
                "Account Name": record["Name"],
                "Website": record["Website"],
                "Industry": record["Industry"],
                "Owner SFDC ID": record["Owner"]["Id"],
                "Owner Name": record["Owner"]["Name"],
                "Owner Email": record["Owner"]["Email"],
                # Convert Salesforce (epoch in ms) timestamps to ISO 8601 format that Airtable expects
                "SFDC Created Date": datetime.utcfromtimestamp(
                    record["CreatedDate"] / 1000
                ).isoformat(),
                "SFDC Last Modified Date": datetime.utcfromtimestamp(
                    record["LastModifiedDate"] / 1000
                ).isoformat(),
            }
        )
    )

# Read out array sizes
print(f"{len(recordsToUpsert)} records to upsert.")

# Perform record upsert
Table.batch_upsert(recordsToUpsert, [AIRTABLE_UNIQUE_FIELD_ID_OR_NAME], typecast=True)

print("\n\nScript execution complete!")
