# Airtable Upsert Example w/ [httr](https://cran.r-project.org/web/packages/httr/index.html)

This example uses [httr](https://cran.r-project.org/web/packages/httr/index.html),
a popular R HTTP client library to call the [Airtable REST API](https://airtale.com/api)'s
[update/upsert multiple records endpoint](https://airtable.com/developers/web/api/update-multiple-records).
All input records are sent to the API endpoint and if the unique ID is present
in an existing record, the existing record will be updated. If the unique value
is not found, a new record will be created.

The example code in this repository assumes your base has a table with the
following fields: First Name (Single line text), Last Name (Single line text),
Unique ID (Single line text), Job Title (Single line text), and Hire Number
(Number). You can create a copy of a sample base with 200 records pre-populated
[here](https://airtable.com/shrgakIqrpwtkQL2p).

---

The software made available from this repository is not supported by Formagrid Inc
(Airtable) or part of the Airtable Service. It is made available on an "as is"
basis and provided without express or implied warranties of any kind.

---

## Local setup

1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values
3. (Optional) Modify `input_records` in `example.R` with new static values or
dynamically fetched values from your source of choice (API, file, etc.)
4. Run `Rscript example.R` to run the example. Note that the first few lines
install external dependencies which you may want to comment out once they have
been added to your local R installation.

## Key files and their contents

- [`example.R`](example.R) is the main code file which is executed when
`Rscript example.R` is run. At a high level, it performs the following:
  - Loads dependencies and configuration variables
  - Defines a sample `input_records` array which should be modified to reference
  an external data source
  - In chunks of 10, sends records to
  [the upsert endpoint](https://airtable.com/developers/web/api/update-multiple-records)
  which will result in records being updated or created based on the unique ID
  field(s) define

- [`.env.example`](.env.example) is an example file template to follow for your
own `.env` file. The environment variables supported are:
  - `AIRTABLE_API_KEY` -
    [your Airtable personal access token](https://airtable.com/developers/web/guides/personal-access-tokens);
    it will always start with `pat`; the scope
    [`data.records:write`](https://airtable.com/developers/web/api/scopes#data-records-write)
    is required
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's
  API docs from <https://airtable.com/api>. This will always start with `app`
  - `AIRTABLE_TABLE_ID` - the ID of the table you want to create/update records
  in; you can find this in the URL of your browser when viewing the table.
  It will start with `tbl`
  - `AIRTABLE_UNIQUE_FIELD_NAME_OR_ID` - the field name or ID of the field that
  is used for determining if an existing records exists that needs to be
  updated (if no record exists, a new one will be created)

## Notes

- The code in [`example.R`](./example.R) has been setup to configure automatic
  retries if requests are rate limited
- The field used for uniqueness does not have to be the primary field.
- The field name or ID for the unique field is expected to remain consistent. If
  it changes, update the environment variable
- Each existing and new record (in `input_records`) is expected to have a value
  for the field used for uniqueness.
- [Mockaroo](https://www.mockaroo.com/) was used to generate example data used
  in this example.
