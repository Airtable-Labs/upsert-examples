This sub folder (`data_source_examples`) includes data source specific upsert
examples.

If you don't see an example for your data source or are looking for data source
agnostic examples, visit out our top-level [README.md here](../README.md) which
has a list of generic examples.

---

There are currently several data source specific upsert examples available:

- [**Aha!**](aha/using_pyairtable/) - import your team's list of Features from
  [Aha.io](https://www.aha.io/) into Airtable
- [**Akeneo PIM**](akeneo/using_airtable.js/) - import a list of products and
  their associated hierarchy (categories, families, etc.) into an Airtable base
- [**BigQuery**](bigquery/using_pyairtable/) - import records from a provided
  BigQuery table or view into Airtable
- [**Figma**](figma/using_airtable.js/) - import metadata (name, ID, thumbnail
  when available) for each of your team's Figma projects, files, and pages into
  an Airtable base
- [**Frame.io Assets**](frameIO/using_pyairtable/) - import metadata (name, ID,
  type, status) from your team's Frame.io assets into a table in Airtable
- [**PostrgeSQL database**](postgresql/using_airtable.js/) - import rows from
  multiple PostgreSQL tables into an Airtable base while maintaining table to
  table relationships
- [**Salesforce**](salesforce/using_pyairtable/) - import records from a
  specified Salesforce object's Bulk Query API into Airtable
- [**ServiceNow**](servicenow/using_pyairtable/) - import records from a
  specified ServiceNow table into Airtable
- [**Slack Conversation History**](slack_conversation_history/using_airtable.js/) -
  bring messages from a Slack channel into a single Airtable table
- [**Snowflake**](snowflake/using_pyairtable/) - import records from a provided
  Snowflake table or view into Airtable
- [**Workday Reports**](workday) - leverage Workday's RaaS (reporting as a
  service) functionality to export data from Workday and import it into Airtable

---

Have an example you want to share? Please submit a pull request!
