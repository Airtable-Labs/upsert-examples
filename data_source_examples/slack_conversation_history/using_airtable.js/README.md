# Bring Slack Conversation History into Airtable

This example brings the messages in a Slack (public or private channel, DM, or MPDM) conversation into an Airtable table. Based on [the generic airtable.js upsert example](.../../../../../javascript/using_airtable.js/), this example uses [`airtable.js`](https://github.com/airtable/airtable.js) to interact with the Airtable REST API and [`@slack/web-api`](https://slack.dev/node-slack-sdk/web-api) to interact with Slack's API.

At this time, threaded "replies" are not included -- only "parent" messages.

---

The software made available from this repository is not supported by Formagrid Inc (Airtable) or part of the Airtable Service. It is made available on an "as is" basis and provided without express or implied warranties of any kind.

---

## Setup steps

### Airtable Base Setup
First, create a table in a base you have creator-level access to and create a table with the following fields: 'Channel ID + TS' (Single line text), 'Channel ID' (Single line text), 'TS' (Single line text), 'Last Edited TS' (Single line text), 'Type' (Single line text), and 'Subtype' (Single line text), 'Slack User ID' (Single line text), 'Message text' (Long text), 'Reply Count' (Number), and 'Full Message Payload (JSON)' (Long text). You may also want to add a formula field named 'TS (Human Readable)' with the formual `DATETIME_PARSE({TS}, 'X')`. You can create a copy of a sample table with these fields [here](https://airtable.com/shrB2653wGPc4KwoZ).

If you choose other field names, be sure to update the code in [index.js](./index.js).

- **Slack app Setup**
  - Create a custom app from https://api.slack.com/apps?new_app=1, making sure to select the Slack workspace that contains the channel you want to extract messages from.
  - Add a **bot token scope** grom the app's 'OAuth & Permissions' page. If you are extracting messages from a public mesage, you'll want to add `channels:history`. For private channels add `groups:history`. For DMs or MPDMs, use `im:history` or `mpim:history`, respectively.
  - Retrieve a **bot user token** for your workspace by clicking 'Install to Workspace' near the top of your app's 'OAuth & Permissions' page. This may require Slack admin approval.
  - Once the app has been installed, be sure to add the app to the channel you want to extract messages from. You can type `/invite @<your app name here>`.
- 