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
