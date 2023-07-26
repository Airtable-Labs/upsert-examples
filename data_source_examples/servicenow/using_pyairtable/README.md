# Import Records from ServiceNow into Airtable

This code example can be used to update or insert ("upsert") the list of records
from a ServiceNow Table into Airtable. You can schedule this script to run on a
recurring schedule to keep your Airtable base "in sync" with ServiceNow.

This code is based on
[the generic pyAirtable upsert example]((.../../../../../javascript/using_pyAirtable/))
and uses [pyAirtable](https://github.com/gtalarico/pyairtable) (maintained by
the community) to interact with the Airtable REST API and
[ServiceNow's python connector](https://github.com/ServiceNow/PySNC) to interact
with
[ServiceNow's Table API](https://docs.servicenow.com/en-US/bundle/utah-api-reference/page/integrate/inbound-rest/concept/c_TableAPI.html).

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
  - Connects to Airtable and ServiceNow using the respective Python libraries
  - Queries all records from the specified ServiceNow and sets this list to the
    variable `inputRecords`
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
  - `AIRTABLE_UNIQUE_FIELD_NAME` - the field name of the field that is used for
    determining if an existing records exists that needs to be updated (if no
    record exists, a new one will be created). In this case, we use the record's
    system ("sys") generated ID.
  - `SERVICENOW_INSTANCE_ID` - your ServiceNow instance ID (for example,
    `devXXX` if your ServiceNow URL is https://dev158562.service-now.com/)
  - `SERVICENOW_USERNAME` - your integration account's username
  - `SERVICENOW_PASSWORD` - your integration account's password

### Notes

- In this example, a ServiceNow username and password are used to authenticate
  with the API. Other options are also available and
  [documented by PySNC here](https://servicenow.github.io/PySNC/user/authentication.html).
- The ServiceNow Table API appears to return date/time fields in the timezone of
  the authenticated user. Unless specified with a GMT offset (which the
  ServiceNow API does not appear to return), the Airtable API assumes timestamps
  to be in GMT. We therefore recommend configuring your integration user account
  in ServiceNow to use GMT.
- [pyairtable](https://github.com/gtalarico/pyairtable) handles API rate
  limiting
- The field used for uniqueness does not have to be the primary field.
- The field name for the unique field is expected to remain consistent. If it
  changes, update the environment variable
- Each existing and new record is expected to have a value for the field used
  for uniqueness.
