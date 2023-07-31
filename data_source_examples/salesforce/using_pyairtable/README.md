# Import Records from Salesforce into Airtable via Web API

This code example can be used to update or insert ("upsert") the list of records
from a Salesforce object into Airtable. You can schedule this script to run on a
recurring schedule to keep your Airtable base "in sync" with Salesforce.

ℹ️ **Note:** This code example is an alternative to
[Airtable's native and no-code Salesforce
Sync](https://support.airtable.com/docs/airtable-sync-integration-salesforce).
The native Salesforce Sync is typically recommended and this code example is
available as an alternative in certain circumstances.

---

This specific example syncs all `Account` records in Salesforce to Airtable and
assumes your Airtable table has fields that match the values in lines 59-72 of
[`example.py`](./example.py).

This code is based on
[the generic pyAirtable upsert example]((.../../../../../javascript/using_pyAirtable/))
and uses [pyAirtable](https://github.com/gtalarico/pyairtable) (maintained by
the community) to interact with the Airtable REST API and
[the simple-salesforce python connector](https://github.com/simple-salesforce/simple-salesforce)
to interact with
[Salesforce's REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm)
(and more specifically
[the Bulk API for querying records](https://developer.salesforce.com/docs/atlas.en-us.232.0.api_asynch.meta/api_asynch/asynch_api_bulk_query_intro.htm).

---

The software made available from this repository is not supported by Formagrid
Inc (Airtable) or part of the Airtable Service. It is made available on an "as
is" basis and provided without express or implied warranties of any kind.

---

### Local setup

1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values
   - Explanations of each environment variable is available below
3. Install Python dependencies using `pip3 install -r requirements.txt`
4. Run `python3 example.py` to run the script

### Key files and their contents

- [`example.py`](example.py) is the main code file which is executed when
  `python3 example.py` is run. At a high level, it performs the following:
  - Loads dependencies and configuration variables
  - Connects to Airtable and Salesforce using the respective
    community-maintained Python libraries
  - Queries all records from the specified Salesforce object and sets this list
    to the variable `inputRecords`
  - In chunks of 10, upserts records
- [`.env.example`](.env.example) is an example file template to follow for your
  own `.env` file. The environment variables supported are:
  - `AIRTABLE_API_KEY` -
    [your Airtable API key or personal access token](https://support.airtable.com/docs/creating-and-using-api-keys-and-access-tokens)
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's
    API docs from https://airtable.com/api. This will always start with `app`
  - `AIRTABLE_TABLE_ID` - the ID of the table you want to create/update records
    in; you can find this in the URL of your browser when viewing the table. It
    will start with `tbl`
  - `AIRTABLE_UNIQUE_FIELD_ID_OR_NAME` - the field ID or name of the field that
    is used for determining if an existing records exists that needs to be
    updated (if no record exists, a new one will be created). In this case, we
    use the record's system ("sys") generated ID.
  - `SALESFORCE_INSTANCE_URL` - your Salesforce instance URL (for example,
    `https://xxx-yyy-zzz.trailblaze.my.salesforce.com`)
  - `SALESFORCE_USERNAME` - your integration account's username
  - `SALESFORCE_PASSWORD` - your integration account's password
  - `SALESFORCE_SECURITY_TOKEN` - your integration account's
    [security token](https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_concepts_security.htm#logintoken)

### Notes

- In this example, a Salesforce instance URL, username, password, and security
  token are used to authenticate with the Salesforce REST API. Other options are
  also available and
  [documented by simple-salesforce here](https://simple-salesforce.readthedocs.io/en/latest/user_guide/examples.html).
- [pyairtable](https://github.com/gtalarico/pyairtable) handles API rate
  limiting
- The field used for uniqueness does not have to be the primary field.
- The field name for the unique field is expected to remain consistent. If it
  changes, update the environment variable
- Each existing and new record is expected to have a value for the field used
  for uniqueness.
