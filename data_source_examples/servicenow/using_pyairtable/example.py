import os
from pysnc import ServiceNowClient
from pyairtable import Table
from dotenv import load_dotenv

load_dotenv()

# Configuration variables for Airtable and ServiceNow
SERVICENOW_INSTANCE_ID = os.environ["SERVICENOW_INSTANCE_ID"]
SERVICENOW_USERNAME = os.environ["SERVICENOW_USERNAME"]
SERVICENOW_PASSWORD = os.environ["SERVICENOW_PASSWORD"]

AIRTABLE_API_KEY = os.environ["AIRTABLE_API_KEY"]
AIRTABLE_BASE_ID = os.environ["AIRTABLE_BASE_ID"]
AIRTABLE_TABLE_ID = os.environ["AIRTABLE_TABLE_ID"]
AIRTABLE_UNIQUE_FIELD_NAME = os.environ["AIRTABLE_UNIQUE_FIELD_NAME"]

# Initialize Airtable Client
Table = Table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)


# Initialize ServiceNow Client
serviceNowClient = ServiceNowClient(
    SERVICENOW_INSTANCE_ID, (SERVICENOW_USERNAME, SERVICENOW_PASSWORD)
)

# Create a GlideRecord object for the incident table
incidentsGr = serviceNowClient.GlideRecord("incident", batch_size=100)

# Optionally, use a query to filter the records returned:
# incidentsGr.addEncodedQuery("active=true^priority=1")

# Execute the query
incidentsGr.query()

# Serialize all records to a list of dicts
inputRecords = incidentsGr.serialize_all(display_value=True)
print(f"{len(inputRecords)} records retrieved from ServiceNow.")

# Create an array of Airtable-formatted records to upsert
recordsToUpsert = []
for record in inputRecords:
    recordsToUpsert.append(
        dict(
            fields={
                "Sys ID": record["sys_id"],
                "Number": record["number"],
                "Short Description": record["short_description"],
                "Description": record["description"],
                "Status": record["state"],
                "Category": record["category"],
                "Impact": record["impact"],
                "Sys Created On": record["sys_created_on"],
                "Closed At": record["closed_at"],
            }
        )
    )

# Read out array sizes
print(f"{len(recordsToUpsert)} records to upsert.")

# Perform record upsert
Table.batch_upsert(recordsToUpsert, [AIRTABLE_UNIQUE_FIELD_NAME], typecast=True)

print("\n\nScript execution complete!")
