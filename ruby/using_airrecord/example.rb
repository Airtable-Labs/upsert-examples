# Load dependencies
require 'bundler/setup'
require 'airrecord' # to interact with Airtable REST API
require 'dotenv'  # to load .env files with environment variables

# Load .env file
Dotenv.load

# Configuration variables for Airtable
AIRTABLE_API_KEY = ENV.fetch('AIRTABLE_API_KEY')
AIRTABLE_BASE_ID = ENV.fetch('AIRTABLE_BASE_ID')
AIRTABLE_TABLE_ID = ENV.fetch('AIRTABLE_TABLE_ID')
AIRTABLE_UNIQUE_FIELD_NAME = ENV.fetch('AIRTABLE_UNIQUE_FIELD_NAME')

# Initialize Airtable client using Airrecord's 'ad-hoc API' (https://github.com/sirupsen/airrecord#ad-hoc-api)
Table = Airrecord.table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)

# Define input records(from the source system). This would usually be an API call or reading in a CSV or other format of data.
inputRecords = [
  # Existing person in the table, if using the sample data linked to in the README
  {
    'First Name': 'Juliette',
    'Last Name': 'Schimmang',
    'Unique ID': '16a05ea5-7bbd-4353-bc25-878a2245835e',
    'Job Title': 'Account Executive II'
  },
  # New user to be added to the table
  {
    'First Name': 'Marsha',
    'Last Name': 'Rickeard',
    'Unique ID': 'bf68da9d-805b-4117-90dc-d54eb46db19f',
    'Job Title': 'CTO',
    'Hire Number': 201
  }
]

# Retrieve all existing records from the base through the Airtable REST API
allExistingRecords = Table.all
puts "#{allExistingRecords.count} existing records found"

# Create an object mapping of the primary field to the record ID
# Remember, it's assumed that the AIRTABLE_UNIQUE_FIELD_NAME field is truly unique
upsertFieldValueToExistingRecord = {}
allExistingRecords.each do |existingRecord|
  upsertFieldValueToExistingRecord[existingRecord[AIRTABLE_UNIQUE_FIELD_NAME]] = existingRecord
end

# Create two arrays: one for records to be created, one for records to be updated
recordsToCreate = []
recordsToUpdate = []

# # For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
puts "\nProcessing #{inputRecords.count} input records to determine whether to update or create"
inputRecords.each do |inputRecord|
  recordUniqueValue = inputRecord[AIRTABLE_UNIQUE_FIELD_NAME.to_sym]
  puts "  Processing record w / \'#{AIRTABLE_UNIQUE_FIELD_NAME}\' === \'#{recordUniqueValue}\'"
  existingRecordBasedOnUpsertFieldValueMaybe = upsertFieldValueToExistingRecord[recordUniqueValue]

  # and if the upsert field value matches an existing one...
  if existingRecordBasedOnUpsertFieldValueMaybe
    # Add record to list of records to update
    puts "    Existing record w / ID #{existingRecordBasedOnUpsertFieldValueMaybe.id} found; adding to recordsToUpdate"
    recordsToUpdate.push({:existingRecord => existingRecordBasedOnUpsertFieldValueMaybe, :inputRecord => inputRecord})
  else
    # Otherwise, add record to list of records to create
    puts '    No existing records match; adding to recordsToCreate'
    recordsToCreate.push(inputRecord)
  end
end

# Read out array sizes
puts "\n#{recordsToCreate.count} records to create"
puts "#{recordsToUpdate.count} records to update"

# Perform record creation, one at a time (Airrecord does not support batch updates at the moment)
recordsToCreate.each do |recordToCreate|
  Table.create(recordToCreate)
end

# Perform record updates on existing records, one at a time (Airrecord does not support batch updates at the moment)
recordsToUpdate.each do |recordToUpdate|
  existingRecord = recordToUpdate[:existingRecord]
  inputRecord = recordToUpdate[:inputRecord]

  # Loop through all input records' fields and set the existing record's fields to the input record's fields
  inputRecord.keys.each do |fieldName|
    existingRecord[fieldName.to_s] = inputRecord[fieldName]
  end
  # Save the record
  existingRecord.save
end

puts "\n\nScript execution complete!"