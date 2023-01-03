// Load dependencies
require('dotenv').config() // read in .env file
const axios = require('axios') // for calling Akeneo API
const Airtable = require('airtable') // for calling Airtable API

// Load local helpers
const airtableHelpers = require('./helpers/airtable')
const formatObjectHelpers = require('./helpers/formatObjects')
const akeneoHelpers = require('./helpers/akeneo')

// Read in environment variables
const {
  AKENEO_BASE_URL, AKENEO_CLIENT_ID, AKENEO_SECRET, AKENEO_USERNAME, AKENEO_PASSWORD,
  AIRTABLE_BASE_ID, AIRTABLE_PRODUCTS_TABLE, AIRTABLE_CATEGORIES_TABLE, AIRTABLE_FAMILIES_TABLE, AIRTABLE_ATTRIBUTES_TABLE
} = process.env

// Initialize Akeneo API client, powered by Axios
const akeneoClient = axios.create({
  baseURL: AKENEO_BASE_URL
})

// Initialize Airtable SDK
const base = Airtable.base(AIRTABLE_BASE_ID)

  ;

(async () => {
  // Get initial access token (TODO: handle refresh tokens)
  const { access_token: accessToken } = await akeneoHelpers.getInitialToken(
    akeneoClient, AKENEO_CLIENT_ID, AKENEO_SECRET, AKENEO_USERNAME, AKENEO_PASSWORD
  )
  akeneoClient.defaults.headers.Authorization = `Bearer ${accessToken}`

  // Get all products, transform the object, and upsert to Airtable
  const allProductsAsItems = await akeneoHelpers.getAll(akeneoClient, '/api/rest/v1/products?limit=100')
  const allProductsAsFields = allProductsAsItems.map(formatObjectHelpers.productItemToAirtableFields)
  await airtableHelpers.upsertRecordsInChunks(base(AIRTABLE_PRODUCTS_TABLE), allProductsAsFields, ['uuid'])

  // Get all categories, transform the object, and upsert to Airtable
  const allCategoriesAsItems = await akeneoHelpers.getAll(akeneoClient, '/api/rest/v1/categories')
  const allCategoriesAsFields = allCategoriesAsItems.map(formatObjectHelpers.categoryItemToAirtableFields)
  await airtableHelpers.upsertRecordsInChunks(base(AIRTABLE_CATEGORIES_TABLE), allCategoriesAsFields, ['code'])

  // Get all families, transform the object, and upsert to Airtable
  const allFamiliesAsItems = await akeneoHelpers.getAll(akeneoClient, '/api/rest/v1/families?limit=100')
  const allFamiliesAsFields = allFamiliesAsItems.map(formatObjectHelpers.familyItemToAirtableFields)
  await airtableHelpers.upsertRecordsInChunks(base(AIRTABLE_FAMILIES_TABLE), allFamiliesAsFields, ['code'])

  // Get all attributes, transform the object, and upsert to Airtable
  const allAttributesAsItems = await akeneoHelpers.getAll(akeneoClient, '/api/rest/v1/attributes?limit=100')
  const allAttributesAsFields = allAttributesAsItems.map(formatObjectHelpers.attributeItemToAirtableFields)
  await airtableHelpers.upsertRecordsInChunks(base(AIRTABLE_ATTRIBUTES_TABLE), allAttributesAsFields, ['code'])
})()
