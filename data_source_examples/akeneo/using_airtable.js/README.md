# Sync product and related information from Akeneo into Airtable

This code example can be used to update or insert ("upsert") a list of products
and their associated information hierarchy (categories, families, etc.) from
[Akeneo, a Product Information Management (PIM) solution](https://www.akeneo.com/what-is-a-pim/),
account into their own tables in Airtable. This can help you organize your
products, their categories, and additional metadata. You can schedule this
script to run on a recurring schedule to keep your Airtable base "in sync" with
Akeneo.

This code uses [Axios](https://github.com/axios/axios) to interact with
[Akeneo's REST API](https://api.akeneo.com/documentation/introduction.html) and
[Airtable.js](https://github.com/airtable/airtable.js) to
[upsert records](https://airtable.com/developers/web/api/update-multiple-records)
in Airtable.

---

The software made available from this repository is not supported by Formagrid
Inc (Airtable) or part of the Airtable Service. It is made available on an "as
is" basis and provided without express or implied warranties of any kind.

---

### Local setup

1. Clone/unzip code
2. Copy `.env.example` to `.env` and populate values
   - Explanations of each environment variable are available below
   - Use [this sample base](https://airtable.com/shrOVu5Pjb8SosHK0) which has
     the Product, Categories, Families, and Attributes tables (and fields) setup
     for you.
3. Install Node dependencies using `npm install`
4. (Optional) Modify the list of attributes mapped from items returned from
   Akeneo into objects sent to Airtable in the
   [`helpers/formatObjects.js`](./helpers/formatObjects.js) file
5. Run `npm run sync` to run [`index.js`](./index.js)

### Key files and their contents

- [`index.js`](index.js) is the main code file and is executed when
  `npm run sync` is run. At a high level, it performs the following:
  - Loads dependencies and configuration variables
  - For each different level of data (such as products, categories, families,
    and attributes; represented as `___` in the explanation below):
    - Defines an array `all___AsItems` which is populated with all items of that
      type retrieved from the appropriate Akeneo REST API GET endpoint
    - Defines another array `all___AsFields` which is populated with the mapping
      of Akeneo item objects (which can be highly nested and have more
      information than you may want to populate into Airtable) into an object
      that the Airtable API can accept
    - Upserts the contents of `all___AsFields` into the respective Airtable
      table using the
      [PATCH version of the Airtable update multiple records API](https://airtable.com/developers/web/api/update-multiple-records)
- [`.env.example`](.env.example) is an example file template to follow for your
  own `.env` file. The environment variables expected are:
  - `AIRTABLE_API_KEY` -
    [your Airtable API key](https://support.airtable.com/hc/en-us/articles/219046777-How-do-I-get-my-API-key-);
    we suggest using a personal access token
  - `AIRTABLE_BASE_ID` - the ID of your base; you can find this on the base's
    API docs from https://airtable.com/api. This will always start with `app`
  - `AIRTABLE_PRODUCTS_TABLE`, `AIRTABLE_CATEGORIES_TABLE`,
    `AIRTABLE_FAMILIES_TABLE`, `AIRTABLE_ATTRIBUTES_TABLE` - the table ID or
    name of the respective table in Airtable; these tables must already exist
  - `AKENEO_BASE_URL` - the base URL for your Akeneo PIM instance, such as
    "https://tested-with.trial.akeneo.cloud/"
  - `AKENEO_CLIENT_ID`, `AKENEO_SECRET`, `AKENEO_USERNAME`, `AKENEO_PASSWORD` -
    Akeneo integration details explained
    [here](https://api.akeneo.com/documentation/authentication.html)
- Helper functions are organized into files in the [`helpers/`](./helpers/)
  directory

### Known Limitations / Areas for improvement

- Akeneo
  - API calls are not set up to handle rate limiting
  - API calls not setup for refresh tokens (which should not matter as long as
    the script takes less than the access token expire time which is 3600
    seconds [1 hour])
  - Only a select number of fields are extracted from Akeneo API responses and
    are sent to Airtable (see
    [helpers/formatObjects.js](./helpers/formatObjects.js)), for example, only
    [products' English names](./helpers/formatObjects.js#L9)
- General
  - As a prototype, the current code does not have robust error handling or
    retry logic
