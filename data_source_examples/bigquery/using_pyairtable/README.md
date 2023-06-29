# Import Records from BigQuery into Airtable 

This code example can be used to update or insert ("upsert") the list of records from a BigQuery Table or View into Airtable. This example assumes that your column names in BigQuery match your Airtable field names exactly. You can schedule this script to run on a recurring schedule to keep your Airtable base "in sync" with BigQuery.

This code is based on [the generic pyAirtable upsert example]((.../../../../../python/using_pyairtable/)) and uses [pyAirtable](https://github.com/gtalarico/pyairtable) (maintained by our community) to interact with the Airtable REST API and [BigQuery's python client library](https://github.com/googleapis/python-bigquery) to interact with BigQuery.

---

The software made available from this repository is not supported by Formagrid Inc (Airtable) or part of the Airtable Service. It is made available on an "as is" basis and provided without express or implied warranties of any kind.

---

### Local setup
1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values
    - Explanations of each environment variable is available below
3. Install Python dependencies using `pip3 install -r requirements.txt`
4. Run `python3 index.py` to run the script

### Google Cloud Platform setup
1. Enable the BigQuery API in your Google Cloud project. [Read more here on enabling APIs in your Google Cloud project](https://cloud.google.com/endpoints/docs/openapi/enable-api).
2. Create a Service Account that will be used to authenticate with your Google Cloud project when running the script locally
    - Assign the Service Account the `BigQuery User` role. This enables the ability to run queries, read dataset metadata, etc.
    - After creating the Service Account, within the Service Account details page, go to the `Keys` tab, then click `Add Key`, and select the `JSON` key type. This will download a file that contains the private key. You'll need to reference this file in the `.env` file. This will be used to authenticate the BigQuery python client library.

### Key files and their contents
- [`index.py`](index.py) is the main code file which is executed when `python3 index.py` is run. At a high level, it performs the following:
  - Loads dependencies and configuration variables
  - Connects to BigQuery using the BigQuery Python Client Library
  - Queries all records from the specified BigQuery Table or View and sets this list to the variable `bigquery_data`
  - In chunks of 10, upserts records
- [`.env.example`](.env.example) is an example file template to follow for your own `.env` file. The environment variables supported are:
  - `AIRTABLE_API_KEY` - [your Airtable personal access token](https://support.airtable.com/docs/creating-and-using-api-keys-and-access-tokens)
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's API docs from https://airtable.com/api. This will always start with `app`
  - `AIRTABLE_TABLE_ID` - the ID of the table you want to create/update records in; you can find this in the URL of your browser when viewing the table. It will start with `tbl`
  - `AIRTABLE_UNIQUE_FIELD_NAME_OR_ID` - the field name of the field that is used for determining if an existing record exists that needs to be updated (if no record exists, a new one will be created)
  - `GOOGLE_SERVICE_ACCOUNT_FILE_PATH` - The file path for the service account private key. 
  - `GOOGLE_BIGQUERY_QUERY` - The SQL query to execute against BigQuery to retrieve table or view data


### Notes
- [pyairtable](https://github.com/gtalarico/pyairtable) handles API rate limiting, retries, batch requests and upsert.
- The field used for uniqueness does not have to be the primary field.
- The field name for the unique field is expected to remain consistent. If it changes, update the environment variable
- Each existing and new record is expected to have a value for the field used for uniqueness.
- Airtable field names are expected to match BigQuery column names.
- If you'd like to see both update and create operations execute, you can apply these operations on your BigQuery data after the initial import. Here is a sample SQL query:
  - ```sql
BEGIN
  -- update query
  UPDATE `dataset.table_or_view`
  SET 
    column1 = 'value_a',
    column2 = 'value_b'
  WHERE column3 = 'value_c';

  -- insert query 
  INSERT `dataset.table_or_view` (column1, column2, column3)
  VALUES ('value1', 'value2', 'value3');
END;
```
  - Then, run the script a 2nd time to see the upsert applied to the data in Airtable.