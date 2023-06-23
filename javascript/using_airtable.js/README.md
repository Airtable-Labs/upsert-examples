# Airtable Upsert Example w/ [Airtable.js](https://github.com/Airtable/airtable.js)
This example uses [airtable.js](https://github.com/Airtable/airtable.js), Airtable's first-party Node Javascript SDK, to process input records and call
[Airtable's update multiple records endpoint](https://airtable.com/developers/web/api/update-multiple-records#upserts)
to upsert (insert-or-update) a record based on a unique field. If the unique
value is present in an existing record, the existing record will be updated. If
the unique value is not found, a new record will be created.

The example code in this repository assumes your base has a table with the following fields: First Name (Single line text), Last Name (Single line text), Unique ID (Single line text), Job Title (Single line text), and Hire Number (Number). You can create a copy of a sample base with 200 records prepopulated [here](https://airtable.com/shrgakIqrpwtkQL2p).

---

The software made available from this repository is not supported by Formagrid Inc (Airtable) or part of the Airtable Service. It is made available on an "as is" basis and provided without express or implied warranties of any kind.

---

### Local setup
1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values. Consider duplicating [this sample base](https://airtable.com/shrgakIqrpwtkQL2p) with the schema described above.
3. Install node dependencies using `npm install`
4. (Optional) Modify `inputRecords` in `index.js` with new static values or dynamically fetched values from your source of choice (API, file, etc.)
5. Run `npm start` to run the script

### Key files and their contents
- [`index.js`](index.js) is the main code file which is executed when `npm start` is run. At a high level, it performs the following:
  - Loads dependencies, [`helpers.js`](helpers.js), and configuration variables
  - Defines a sample `inputRecords` array which should be modified to reference an external data source
  - In chunks of 10, sends records to
    [Airtable's update multiple records endpoint](https://airtable.com/developers/web/api/update-multiple-records#upserts),
    configured to upsert on the `AIRTABLE_UNIQUE_FIELD_NAME_OR_ID` field
  - In chunks of 10, updates existing and creates new records
- [`helpers.js`](helpers.js) is referenced by [`index.js`](index.js) and contains helper functions for batching record actions.
- [`.env.example`](.env.example) is an example file template to follow for your own `.env` file. The environment variables supported are:
  - `AIRTABLE_API_KEY` - [your Airtable API key](https://airtable.com/developers/web/guides/personal-access-tokens); it will always start with `pat`
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's API docs from https://airtable.com/api. This will always start with `app`
  - `AIRTABLE_TABLE_ID` - the ID of the table you want to create/update records in; you can find this in the URL of your browser when viewing the table. It will start with `tbl`
  - `AIRTABLE_UNIQUE_FIELD_NAME_OR_ID` - the field name of the field that is used for determining if an existing records exists that needs to be updated (if no record exists, a new one will be created)

### Notes
- [Airtable.js](https://github.com/Airtable/airtable.js) handles rate-limiting
- The field used for uniqueness does not have to be the primary field. The
  following field types are supported: number, text, long text, single select,
  multiple select, and date.
- The field name for the unique field is expected to remain consistent. If it
  changes, update the environment variable.
- Each existing and new record is expected to have a value for the field used
  for uniqueness. 
- [Mockaroo](https://www.mockaroo.com/) was used to generate example data used in this example.
