# Import Assets from Frame.io into Airtable 

This code example can be used to update or insert ("upsert") the list of assets from a Frame.io account into Airtable. This can help you organize your assets, their statuses, and additional metadata. You can schedule this script to run on a recurring schedule to keep your Airtable base "in sync" with Frame.io.

This code is based on [the generic pyAirtable upsert example]((.../../../../../javascript/using_pyAirtable/)) and uses [pyAirtable](https://github.com/gtalarico/pyairtable) (maintained by our community) to interact with the Airtable REST API and HTTPS Requests to interact with Frame.io.

The assetScraper.py file is based on [Frame.io's asset scaper example](https://github.com/Frameio/python-frameio-client/blob/556b835503fca776fdb2dceda3ee6d76f2f1121f/examples/assets/asset_scraper.py).

---

The software made available from this repository is not supported by Formagrid Inc (Airtable) or part of the Airtable Service. It is made available on an "as is" basis and provided without express or implied warranties of any kind.

---

### Local setup
1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values
  - Explanations of each environment variable is available below
  - Use [this sample base](https://airtable.com/shrR9RNplr0U9SCM1) which has correctly named fields.
3. Install Python dependencies using `pip3 install -r requirements.txt`
4. (Optional) Modify the list of attributes mapped from Frame.io in the `mapAssets` function to capture the desired metadata
5. Run `python3 index.py` to run the script

### Key files and their contents
- [`index.py`](index.py) is the main code file which is executed when `python3 index.py` is run. At a high level, it performs the following:
  - Loads dependencies and configuration variables
  - Defines a sample `inputRecords` array which should be modified to reference an external data source
  - Retrieves all existing records in the Airtable base and creates a mapping of the unqiue field's value to the existing record ID for later updating
  - Loops through each record from `inputRecords` array and determines if an existing record should be updated or a new one should be created
  - In chunks of 10, updates existing and creates new records
- [`.env.example`](.env.example) is an example file template to follow for your own `.env` file. The environment variables supported are:
  - `AIRTABLE_API_KEY` - [your Airtable API key](https://support.airtable.com/hc/en-us/articles/219046777-How-do-I-get-my-API-key-); it will always start with `key`
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's API docs from https://airtable.com/api. This will always start with `app`
  - `AIRTABLE_TABLE_ID` - the ID of the table you want to create/update records in; you can find this in the URL of your browser when viewing the table. It will start with `tbl`
  - `AIRTABLE_UNIQUE_FIELD_NAME` - the field name of the field that is used for determining if an existing records exists that needs to be updated (if no record exists, a new one will be created)
  - `FRAME_API_KEY` - [your Frame.io Developer Token](https://developer.frame.io/app/tokens). Your Developer token will need the following scopes:
    - `account.read`
    - `team.read`
    - `project.read`
    - `asset.read`

### Notes
- The [pyairtable](https://github.com/gtalarico/pyairtable) and [frameioclient](https://github.com/Frameio/python-frameio-client/tree/556b835503fca776fdb2dceda3ee6d76f2f1121f) handle API rate limiting
- The field used for uniqueness does not have to be the primary field.
- The field name for the unique field is expected to remain consistent. If it changes, update the environment variable
- Each existing and new record is expected to have a value for the field used for uniqueness. 