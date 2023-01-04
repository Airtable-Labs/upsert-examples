# Import Records from Snowflake into Airtable 

This code example can be used to update or insert ("upsert") the list of records from a Snowflake Table or View into Airtable. This example assumes that your column names in Snowflake match your Airtable field names exactly. You can schedule this script to run on a recurring schedule to keep your Airtable base "in sync" with Snowflake.

This code is based on [the generic pyAirtable upsert example]((.../../../../../javascript/using_pyAirtable/)) and uses [pyAirtable](https://github.com/gtalarico/pyairtable) (maintained by our community) to interact with the Airtable REST API and [Snowflake's python connector](https://docs.snowflake.com/en/user-guide/python-connector.html) to interact with Snowflake.

---

The software made available from this repository is not supported by Formagrid Inc (Airtable) or part of the Airtable Service. It is made available on an "as is" basis and provided without express or implied warranties of any kind.

---

### Local setup
1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values
    - Explanations of each environment variable is available below
3. Install Python dependencies using `pip3 install -r requirements.txt`
4. Run `python3 query.py` to run the script

### Key files and their contents
- [`query.py`](index.py) is the main code file which is executed when `python3 query.py` is run. At a high level, it performs the following:
  - Loads dependencies and configuration variables
  - Connects to Snowflake using the Snowflake Python Connector
  - Queries all records from the specified Snowflake Table or View and sets this list to the variable `inputRecords`
  - Retrieves all existing records in the Airtable base and creates a mapping of the unqiue field's value to the existing record ID for later updating
  - Loops through each record from the `inputRecords` list and determines if an existing record should be updated or a new one should be created
  - In chunks of 10, updates existing and creates new records
- [`.env.example`](.env.example) is an example file template to follow for your own `.env` file. The environment variables supported are:
  - `AIRTABLE_API_KEY` - [your Airtable API key or personal access token](https://support.airtable.com/docs/creating-and-using-api-keys-and-access-tokens)
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's API docs from https://airtable.com/api. This will always start with `app`
  - `AIRTABLE_TABLE_ID` - the ID of the table you want to create/update records in; you can find this in the URL of your browser when viewing the table. It will start with `tbl`
  - `AIRTABLE_UNIQUE_FIELD_NAME` - the field name of the field that is used for determining if an existing records exists that needs to be updated (if no record exists, a new one will be created)
  - `SNOWFLAKE_USERNAME` - your Snowflake username
  - `SNOWFLAKE_PASSWORD` - your Snowflake password
  - `SNOWFLAKE_ACCOUNT` - your [Snowflake Account identifier](https://docs.snowflake.com/en/user-guide/admin-account-identifier.html)
  - `SNOWFLAKE_TABLE_OR_VIEW` - the name of the table or view you want to retrieve records from


### Notes
- [pyairtable](https://github.com/gtalarico/pyairtable) handles API rate limiting
- The field used for uniqueness does not have to be the primary field.
- The field name for the unique field is expected to remain consistent. If it changes, update the environment variable
- Each existing and new record is expected to have a value for the field used for uniqueness. 