# Airtable Scripting App Upsert Example 

This example is for an [Airtable Scripting App](https://airtable.com/marketplace/blkQyAKhJoGKqnR0T/scripting) inside your base. It is setup to process input records and compare a unique field with existing records in the base. If the unique value is present in an existing record, the existing record will be updated. If the unique value is not found, a new record will be created.

The example code in this repository assumes your base has a table with the following fields: First Name (Single line text), Last Name (Single line text), Unique ID (Single line text), Job Title (Single line text), and Hire Number (Number). You can create a copy of a sample base with 200 records prepopulated [here](https://airtable.com/shrgakIqrpwtkQL2p).

Note that when using Airtable Scripting, you do not need a server or infrastructure to host your code. This example can be modified to work in an [Airtable Automation](https://support.airtable.com/hc/en-us/articles/360050974153-Automations-overview)'s [Run script action](https://support.airtable.com/hc/en-us/articles/360051792333-Run-a-script-Action-) too.

---

The software made available from this repository is not supported by Formagrid Inc (Airtable) or part of the Airtable Service. It is made available on an "as is" basis and provided without express or implied warranties of any kind.

---

### Local setup
1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values. Consider duplicating [this sample base](https://airtable.com/shrgakIqrpwtkQL2p) with the schema described above.
3. Install node dependencies using `npm install`
4. (Optional) Modify `inputRecords` in `index.js` with new static values or dynamically fetched values from your source of choice (API, file, etc.)
5. Run `npm start` to run the script

### [`script.js`](script.js)
[`script.js`](script.js) is the single code file you will need to copy into a [Airtable Scripting App](https://airtable.com/marketplace/blkQyAKhJoGKqnR0T/scripting) inside your base. When run, it will:
  - Reads in configuration variables from script settings
  - Defines a sample `inputRecords` array which should be modified to reference an external data source
  - Retrieves all existing records in the Airtable base and creates a mapping of the unqiue field's value to the existing record ID for later updating
  - Loops through each record from `inputRecords` array and determines if an existing record should be updated or a new one should be created
  - In chunks of 50, updates existing and creates new records

### Notes
- The field used for uniqueness does not have to be the primary field.
- Each existing and new record is expected to have a value for the field used for uniqueness. 
- [Mockaroo](https://www.mockaroo.com/) was used to generate example data used in this example.
