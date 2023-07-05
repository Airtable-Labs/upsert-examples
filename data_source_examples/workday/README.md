# Using RaaS and Airtable.js to Import Workday Data into Airtable

This example demonstrates how to use Workday RaaS to export data from Workday and Airtable's REST API to import that data into Airtable using [Airtable.js](https://github.com/airtable/airtable.js/). 

Alternatively, you can use [Airtable Automations](https://support.airtable.com/hc/en-us/articles/360050974153-Automations-overview) with [Run a Script action](https://support.airtable.com/hc/en-us/articles/360051792333) which is detailed at the bottom of this README.

#### ？What is Workday?
Workday delivers user and administrative tools across financials, HR, planning, talent, payroll, analytics, and more.

Just like any other ERP, it consists of data sources and business objects that make up the underlying building blocks to create a report.

#### 🤔 What is RaaS?
Workday has a _Reporting as a Service_ (RaaS) interface which allows you to export most data from Workday by creating a custom report within Workday then exposing it as a web service. The output can be various formats such as CSV, XML, JSON, etc.


#### ⚙️ Prerequisites
- Permissions to create/modify a RaaS URL for a Workday Advanced report
- Access to an Airtable base
- Node.js development environment and experience coding in Javascript

## Quick Start
1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values:
    * `AIRTABLE_API_KEY` - [your Airtable API key](https://airtable.com/developers/web/guides/personal-access-tokens); it will always start with `pat`
    * `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's API docs from https://airtable.com/api. This will always start with `app`: https://airtable.com/**appXXXXXXXXXXXX**
    * `AIRTABLE_TABLE_ID` - the ID of the table you want to create/update records in; you can find this in the URL of your browser when viewing the table. It will start with `tbl`: https://airtable.com/appXXXXXXXXXXXX/**tblXXXXXXXXXXX**
    * `AIRTABLE_UNIQUE_FIELD_NAME_OR_ID` - the field name of the field that is used for determining if an existing records exists that needs to be updated (if no record exists, a new one will be created)
    * `WORKDAY_USERNAME`
    * `WORKDAY_PASSWORD`
    * `WORKDAY_RAAS_URL` - see instructions in the next section
3. Install node dependencies using `npm install`
    * dotenv
    * axios
    * airtable.js
5. Run `node index.js` to run the script

#### How to setup the Workday Raas URL
1. Configure Workday report to support RaaS
    * View a custom report detail page (Advanced report type):
![Custom Report to Edit](https://p-xBFZb7R.b0.n0.cdn.getcloudapp.com/items/KouAd4Pg/99a2bd9c-e19b-4ef2-93fd-889f7f4ae1f3.png?source=viewer&v=bcf3288d54aa56514389931ffd62b868)
2. To enable a report for RaaS:
    * Check the `Enable as a Web Service` under `Web Services Options`
    * Select the _API version_ - make sure it's a recent and stable version
    * _Namespace_ is automatically generated
    * Click OK
![Enable as Web Service](https://p-xBFZb7R.b0.n0.cdn.getcloudapp.com/items/2NuzwldK/b6a0b37a-7a3e-498c-a117-0eb470e322d4.png?source=viewer&v=22493e775438e2215c2c0a1ffdb01729)
3. Back on the Reports page, back in the menu, _Web Service_ will now be an option at the bottom. This is where the URL is available.
![View RaaS URL](https://p-xBFZb7R.b0.n0.cdn.getcloudapp.com/items/z8uL6rEk/0e93c1e7-28e4-4de7-84e8-266a7fa04d5c.png?source=viewer&v=6ad7418eab6b9df6751097bf0ad316c8)
4. A screen will display different format options. Right-click on one and click Copy URL. This generates the RaaS URL needed to retrieve the data. **For Airtable, the JSON option is best**.
![](https://p-xBFZb7R.b0.n0.cdn.getcloudapp.com/items/geumbAxp/fa7a31e9-6727-44b0-88fe-0e877622731a.png?source=viewer&v=37e032eeebe3b22b17f52e494c18b67e)
5. Here is an example URL:
```sh
https://wd2-impl-services1.workday.com/ccx/service/customreport2/...&format=json
```

## Base Setup
The base should have a table with a field that represents a _unique identifier_ for the row.
If the Workday report does not have an ID, an Airtable formula can be used to concatenate multiple field values together to create a unique string. 
The script in this example uses this logic to check for existing records.

Here is an example of that formula:
```sh
{Purchase Order} & "|" & {Spend_Category_as_Worktag} & "|" & {Extended Amount}
```

## Alternative Approach

##### _Airtable Automation's + Run a Script action_

Rather than host a node script on a server, Airtable can execute Javascript code within Automations.
For example, an automation can be scheduled to run every day at 12am, and similar code can run to make the request to retrieve the Workday data.
![Airtable Automation's example](https://p-xBFZb7R.b0.n0.cdn.getcloudapp.com/items/ApuJY91R/b14389e8-c109-4265-a039-4a51d15dd847.png?source=viewer&v=735325a590e896ab7e4136e125ad4ba1)


