# Airtable Upsert Example w/ [pyairtable](https://github.com/gtalarico/pyairtable)

This example uses [pyairtable](https://github.com/gtalarico/pyairtable), a community supported Python API client for the [Airtable REST API](https://airtale.com/api), to process input records and compare a unique field with existing records in an Airtable base. If the unique value is present in an existing record, the existing record will be updated. If the unique value is not found, a new record will be created.

The example code in this repository assumes your base has a table with the following fields: First Name (Single line text), Last Name (Single line text), Unique ID (Single line text), Job Title (Single line text), and Hire Number (Number). You can create a copy of a sample base with 200 records prepopulated [here](https://airtable.com/shrgakIqrpwtkQL2p).

[Mockaroo](https://www.mockaroo.com/) was used to generate example data used in this example.

---

The software made available from this repository is not supported by Formagrid Inc (Airtable) or part of the Airtable Service. It is made available on an "as is" basis and provided without express or implied warranties of any kind.

---

### Local setup
1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values
3. Install Python dependencies using `pip3 install -r requirements.txt`
4. (Optional) Modify `inputRecords` in `example.py` with new static values or dynamically fetched values from your source of choice (API, file, etc.)
5. Run `python3 example.py` to run the script

### Key files and their contents
- [`example.py`](example.py) is the main code file which is executed when `python3 example.py` is run. At a high level, it performs the following:
  - Loads dependencies and configuration variables
  - Defines a sample `inputRecords` array which should be modified to reference an external data source
  - Retrieves all existing records in the Airtable base and creates a mapping of the unqiue field's value to the existing record ID for later updated
  - Loops through each record from `inputRecords` array and determines if an existing record should be updated or a new one should be created
  - In chunks of 10, updates existing and creates new records
- [`.env.example`](.env.example) is an example file template to follow for your own `.env` file. The environment variables supported are:
  - `AIRTABLE_API_KEY` - [your Airtable API key](https://support.airtable.com/hc/en-us/articles/219046777-How-do-I-get-my-API-key-); it will always start with `key`
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's API docs from https://airtable.com/api. This will always start with `app`
  - `AIRTABLE_TABLE_ID` - the ID of the table you want to create/update records in; you can find this in the URL of your browser when viewing the table. It will start with `tbl`
  - `AIRTABLE_UNIQUE_FIELD_NAME` - the field name of the field that is used for determining if an existing records exists that needs to be updated (if no record exists, a new one will be created)

### Notes
- The [pyairtable](https://github.com/gtalarico/pyairtable) handles API rate limiting
- The field used for uniqueness does not have to be the primary field.
- The field name for the unique field is expected to remain consistent. If it changes, update the environment variable
- Each existing and new record is expected to have a value for the field used for uniqueness. 