# Sync rows from multiple PostgreSQL tables into Airtable

This code example can be used to import rows in a PostgreSQL database into an
existing Airtable base. You can also schedule this script to run on a recurring
schedule to keep your Airtable base "in sync" with your PostgreSQL database.

This code example is based on
[the generic airtable.js upsert example](.../../../../../javascript/using_airtable.js/)
and uses [`airtable.js`](https://github.com/airtable/airtable.js) to interact
with the Airtable REST API and [`pg`](https://node-postgres.com/) to connect to
and query the PostgreSQL database.

---

The software made available from this repository is not supported by Formagrid
Inc (Airtable) or part of the Airtable Service. It is made available on an "as
is" basis and provided without express or implied warranties of any kind.

---

## Setup steps

This section will walk you through setting up three components:

- A. Your existing (i) Postgres database and (ii) Airtable base
- B. The [`index.js`](./index.js) script (which will `SELECT` rows from the
  specified Postgres tables and upsert (insert-or-update) them into your
  Airtable )

### A. PostgreSQL and Airtable Base Setup

Important: This code example assumes that your table names and field names in
Airtable and Postgres are identical with the exception of linked record fields
(see the screenshot link and table below for details)

For this example, the free tier of [supabase.com](https://supabase.com/)'s
Postgres-compatible database product was used. The test database had three
tables: `clients`, `projects`, and `tasks`. Each table has a `name` field.
Projects belong to one client (`projects.client_name` <=> `clients.name`) and
tasks belong to one project (`tasks.project_name` <=> `projects.name`). Exported
CSVs of each of the three tables can be found in the [`assets`](assets/) folder.

Given the example Postgres database defined above, the script will be able to
import the rows into an Airtable base that looks like
[this sample Airtable base](https://airtable.com/shr5pcwXTVGYMWNNq) which you
can copy into your own Airtable workspace using the "Copy base" button in the
top right.

[A screenshot showing the base schema for the Airtable base along with which fields should _not_ exist in the Postgres schema can be found here.](./assets/airtable_base_schema.png)

The table below shows the three tables' Postgres columns and Airtable fields.

| **Table Name** | **Column/Field Name** | **Postgres Column Type** | [**Airtable Field Type**](https://support.airtable.com/hc/en-us/articles/360055885353-Field-types-overview) | **Notes**                                                                        |
| -------------- | --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| clients        | name                  | VARCHAR                  | Single line text                                                                                            | Airtable primary field.                                                          |
| clients        | projects              |                          | Linked record to projects table                                                                             | ⚠️ _Airtable only field. Should not exist as a column in your Postgres database._ |
| clients        | about                 | TEXT                     | Long text                                                                                                   |                                                                                  |
| projects       | name                  | VARCHAR                  | Single line text                                                                                            | Airtable primary field                                                           |
| projects       | client_name           | TEXT                     | Linked record to clients table                                                                              |                                                                                  |
| projects       | tasks                 |                          | Linked record to tasks table                                                                                | ⚠️ _Airtable only field. Should not exist as a column in your Postgres database._ |
| projects       | category              | VARCHAR                  | Single select                                                                                               |                                                                                  |
| projects       | complete              | BOOLEAN                  | Checkbox                                                                                                    |                                                                                  |
| projects       | kickoff_date          | DATE                     | Date                                                                                                        |                                                                                  |
| projects       | due_date              | DATE                     | Date                                                                                                        |                                                                                  |
| projects       | notes                 | TEXT                     | Long text                                                                                                   |                                                                                  |
| tasks          | name                  | VARCHAR                  | Single line text                                                                                            | Airtable primary field                                                           |
| tasks          | project_name          | VARCHAR                  | Linked record to projects table                                                                             |                                                                                  |
| tasks          | completed             | BOOLEAN                  | Checkbox                                                                                                    |                                                                                  |
| tasks          | estimated_days        | DOUBLE PRECISION         | Number                                                                                                      |                                                                                  |

The fields listed as "⚠️ Airtable only fields" do not need to be manually created
in Airtable. When you create linked record fields in Airtable, the corresponding
field will be automatically added to the table you are linking to.

### B. Configuring and Running this Script

Now, let’s setup this script to run locally. You can later deploy this as a
scheduled task on a server or cloud function.

1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values (see description of
   `.env.example` below for details on each environment variable)
3. Install node dependencies by running `npm install`
4. Trigger the script to execute by running `npm run sync`
5. Records in the specified Airtable base’s tables should be created/updated.

## Key Files and Their Contents

- [`index.js`](index.js) is the main code file which is executed when
  `npm run sync` is run. At a high level, it performs the following:
  - Loads dependencies, helper functions, and configuration variables
  - Initializes clients for the Airtable API and PostgreSQL
  - For each table specified in the `TABLE_NAMES_AS_CSV_STRING` environment
    variable...
    - Retrieves all rows from Postgres (`SELECT * FROM ...`)
    - Upserts all rows to the Airtable table
- [`airtable_helpers.js`](airtable_helpers.js) is referenced by
  [`index.js`](index.js) and contains helper functions to for batching Airtable
  record upserts.
- [`.env.example`](.env.example) is an example file template to follow for your
  own `.env` file. The environment variables supported are:
  - `AIRTABLE_API_KEY` -
    [your Airtable personal access token](https://support.airtable.com/hc/en-us/articles/219046777-How-do-I-get-my-API-key-)
    with the
    [`data.records:write`](https://github.com/Airtable-Labs/upsert-examples/pull/47)
    scope and access to the base below
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base’s
    API docs from https://airtable.com/api. This will always start with `app`
  - `AIRTABLE_PRIMARY_FIELD_ID_OR_NAME` - the name (or ID) of your Airtable
    tables' primary field. The human-readable name should be `name` if using the
    example links in step A.
  - `TABLE_NAMES_AS_CSV_STRING` - A comma separated list of tables, for example
    `clients,projects,tasks`
  - `POSTGRES_CONNECTION_STRING` - the
    [Postgres connection URI string](https://www.postgresql.org/docs/current/libpq-connect.html#id-1.7.3.8.3.6)
    to connect and authenticate to your Postgres database
  - `POSTGRES_TABLE_PREFIX_IF_ANY` - the prefix to your Postgres database, if
    there is one
