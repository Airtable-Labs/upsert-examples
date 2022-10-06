This sub folder (`data_source_examples`) includes data source specific upsert examples.

If you don't see an example for your data source or are looking for data source agnostic examples, visit out our top-level [README.md here](../README.md) which has a list of generic examples.

---

There are currently four data source specific upsert examples available:

- [**Figma**](figma/using_airtable.js/) - import metadata (name, ID, thumbnail when available) for each of your team's Figma projects, files, and pages into an Airtable base 
- [**PostrgeSQL database**](postgresql/using_airtable.js/) - import rows from multiple PostgreSQL tables into an Airtable base while maintaining table to table relationships
- [**Slack Conversation History**](slack_conversation_history/using_airtable.js/) - bring messages from a Slack channel into a single Airtable table 
- [**Workday Reports**](workday) - leverage Workday's RaaS (reporting as a service) functionality to export data from Workday and import it into Airtable

---

Have an example you want to share? Please submit a pull request!
