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
input_records = [
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
all_existing_records = Table.all
puts "#{all_existing_records.count} existing records found"

# Create an object mapping of the primary field to the record ID
# Remember, it's assumed that the AIRTABLE_UNIQUE_FIELD_NAME field is truly unique
upsert_field_value_to_existing_record = {}
all_existing_records.each do |existing_record|
  upsert_field_value_to_existing_record[existing_record[AIRTABLE_UNIQUE_FIELD_NAME]] = existing_record
end

# Create two arrays: one for records to be created, one for records to be updated
records_to_create = []
records_to_update = []

# # For each input record, check if it exists in the existing records. If it does, update it. If it does not, create it.
puts "\nProcessing #{input_records.count} input records to determine whether to update or create"
input_records.each do |input_record|
  record_unique_value = input_record[AIRTABLE_UNIQUE_FIELD_NAME.to_sym]
  puts "  Processing record w / \'#{AIRTABLE_UNIQUE_FIELD_NAME}\' == \'#{record_unique_value}\'"
  existing_record_based_on_upsert_field_value_maybe = upsert_field_value_to_existing_record[record_unique_value]

  # and if the upsert field value matches an existing one...
  if existing_record_based_on_upsert_field_value_maybe
    # Add record to list of records to update
    puts "    Existing record w / ID #{existing_record_based_on_upsert_field_value_maybe.id} found; adding to records_to_update"
    records_to_update.push({:existing_record => existing_record_based_on_upsert_field_value_maybe, :input_record => input_record})
  else
    # Otherwise, add record to list of records to create
    puts '    No existing records match; adding to records_to_create'
    records_to_create.push(input_record)
  end
end

# Read out array sizes
puts "\n#{records_to_create.count} records to create"
puts "#{records_to_update.count} records to update"

# Perform record creation, one at a time (Airrecord does not support batch updates at the moment)
records_to_create.each do |record_to_create|
  Table.create(record_to_create)
end

# Perform record updates on existing records, one at a time (Airrecord does not support batch updates at the moment)
records_to_update.each do |record_to_update|
  existing_record = record_to_update[:existing_record]
  input_record = record_to_update[:input_record]

  # Loop through all input records' fields and set the existing record's fields to the input record's fields
  input_record.keys.each do |field_name|
    existing_record[field_name.to_s] = input_record[field_name]
  end
  # Save the record
  existing_record.save
end

puts "\n\nScript execution complete!"