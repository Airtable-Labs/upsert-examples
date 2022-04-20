# Bring Slack Conversation History into Airtable

This code example can be used to import messages from a Slack conversation (public or private channel, DM, or multi-party DM) into an Airtable table. You can also schedule this script to run on a recurring schedule to keep your table in Airtable up to date with new messages from Slack.

This code example is based on [the generic airtable.js upsert example](.../../../../../javascript/using_airtable.js/) and uses [`airtable.js`](https://github.com/airtable/airtable.js) to interact with the Airtable REST API and [`@slack/web-api`](https://slack.dev/node-slack-sdk/web-api) to interact with Slack's API.

---

The software made available from this repository is not supported by Formagrid Inc (Airtable) or part of the Airtable Service. It is made available on an "as is" basis and provided without express or implied warranties of any kind.

---

## Setup steps

This section will walk you through setting up three components:

- A. An Airtable base where this example script will store messages from the Slack conversation you specify
- B. A custom Slack app and retrieving your Slack bot token, allowing you to retrieve messages from Slack
- C. This script (which will pull messages from the Slack converstion, compare it to existing records in you base, and create-or-update records in your base so they mirror the latest messages in Slack)

### A. Airtable Base Setup

First, create a table in a base you have creator-level access to. You can do so by creating a copy of [this sample table]([from here](https://airtable.com/shrB2653wGPc4KwoZ)) by selecting the "Use data" button in the top right corner of the page (recommended).

Alternatively, you can create a table with the following fields: 'Channel ID + TS' (Single line text), 'Channel ID' (Single line text), 'TS' (Single line text), 'Last Edited TS' (Single line text), 'Type' (Single line text), and 'Subtype' (Single line text), 'Slack User ID' (Single line text), 'Message text' (Long text), 'Reply Count' (Number), 'Parent Message' (self-linking Linked Record), and 'Full Message Payload (JSON)' (Long text).
- You may also want to add a formula field named 'TS (Human Readable)' with the formula `DATETIME_PARSE({TS}, 'X')` and another named 'Parent or Thread?' with the formula `IF({Parent Message},"Threaded reply","Parent message")`.
- If you choose other field names, be sure to update the code in [index.js](./index.js) in the `convertSlackMessageToAirtableRecord` function.

### B. Slack App Setup

Follow these instructions to set up a Slack app, retrieve an API token, and add your new bot to the channel(s) you want to extract history from.

1. Create a custom app from https://api.slack.com/apps?new_app=1, making sure to select the Slack workspace that contains the channel you want to extract messages from.
2. Add a **bot token scope** from your new app's 'OAuth & Permissions' page. If you are extracting messages from a public mesage, you'll want to add `channels:history`. For private channels add `groups:history`. For DMs or MPDMs, use `im:history` or `mpim:history`, respectively. 
3. Retrieve a **bot user token** for your workspace by clicking 'Install to Workspace' near the top of your app's 'OAuth & Permissions' page. This may require Slack admin approval.
4. Once the app has been installed, be sure to add the app to the channel you want to extract messages from. You can type `/invite @<your app name here>`.

### C. Configuring and Running this Script

Finally, let's setup this script to run locally. You can later deploy this as a scheduled task on a server or cloud function.

1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values (see below for details on each environment variable)
3. Install node dependencies including Airtable and Slack's official SDKs by running `npm install`
4. Trigger the script to execute by running `npm run sync`
5. Records in the specified Airtable base's table should be created. Try adding new messages to the Slack channel and re-run the previous step.
 
### Key Files and Their Contents

- [`index.js`](index.js) is the main code file which is executed when `npm start` is run. At a high level, it performs the following:
  - Loads dependencies, helper functions, and configuration variables
  - Initializes API clients for the Airtable and Slack APIs
  - Retrieves Slack messages (both "parent" and "threaded replies") from the Slack API and transforms the objects to be flat and suitable for our base template (setup section A)
  - Retrieves all existing records in the Airtable base and creates a mapping of the unqiue field's value to the existing record ID for later updating
  - First loops through each of the parent messages, determining if a new record needs to be created or an existing record updated. This step then repeats for all threaded replies.
    - Note: This example is more complicated than the generic examples as we first loop through all parent Slack messages to update-or-create them and then loop through all threaded replies so that they can be properly associated them with the correct parent Slack message. This can be observed in [index.js](./index.js); look for `// First, upsert all parent messages, and then upsert all threaded replies`
- `*_helpers.js`
  - [`airtable_helpers.js`](airtable_helpers.js) is referenced by [`index.js`](index.js) and contains helper functions to for batching Airtable record actions.
  - [`slack_helpers.js`](slack_helpers.js) is referenced by [`index.js`](index.js) and contains a helper function to recursively fetch Slack messages.
- [`.env.example`](.env.example) is an example file template to follow for your own `.env` file. The environment variables supported are:
  - `AIRTABLE_API_KEY` - [your Airtable API key](https://support.airtable.com/hc/en-us/articles/219046777-How-do-I-get-my-API-key-); it will always start with `key`
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's API docs from https://airtable.com/api. This will always start with `app`
  - `AIRTABLE_TABLE_ID` - the ID of the table you want to create/update records in; you can find this in the URL of your browser when viewing the table. It will start with `tbl`
  - `AIRTABLE_UNIQUE_FIELD_NAME` - the field name of the field that is used for determining if an existing records exists that needs to be updated (if no record exists, a new one will be created)
  - `SLACK_BOT_TOKEN` - the Slack API key you retrieved in setup section B. It will likely start with "xoxb-"
  - `SLACK_CHANNEL_ID` - the Slack channel ID you want to extract messages from. One way to find a channel ID is to right click the channel name, select "Copy link", and paste the value to a notepad. The channel ID will be what follows the last "/" and start with a C, D, or X. 
