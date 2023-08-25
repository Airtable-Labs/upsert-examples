# Load dependencies
require "bundler/setup"
require "faraday" # to interact with Airtable REST API
require "faraday/retry" # to retry requests on failure
require "dotenv"  # to load .env files with environment variables

# Load .env file
Dotenv.load

# Configuration variables for Airtable
AIRTABLE_API_KEY = ENV.fetch("AIRTABLE_API_KEY")
AIRTABLE_BASE_ID = ENV.fetch("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_ID = ENV.fetch("AIRTABLE_TABLE_ID")
AIRTABLE_UNIQUE_FIELD_NAME_OR_ID = ENV.fetch("AIRTABLE_UNIQUE_FIELD_NAME_OR_ID")

# Set up Faraday connection to be used with the Airtable upsert endpoint
connection = Faraday.new(url: "https://api.airtable.com/v0/#{AIRTABLE_BASE_ID}/#{AIRTABLE_TABLE_ID}") do |conn|
  # Configure retry middleware for Faraday
  conn.request :retry, {
                 retry_statuses: [429],
                 max: 3, # maximum number of retries
                 interval: 10, # initial interval between retries in seconds
               }
  # Configure default HTTP headers for each request
  conn.headers["Authorization"] = "Bearer #{AIRTABLE_API_KEY}"
  conn.headers["Content-Type"] = "application/json"
end

# Define helper function to upsert records in batches
def upsert_records_in_batches(connection, records, fields_to_merge_on, typecast = true, batch_size = 10)
  # Split records into batches of size batch_size (Airtable API has a limit of 10 records per request)
  records.each_slice(batch_size) do |chunk_of_records|

    # Create payload (HTTP request body)
    payload = {
      'typecast': typecast,
      'performUpsert': {
        'fieldsToMergeOn': fields_to_merge_on,
      },
      'records': chunk_of_records,
    }

    # Make request to Airtable API
    response = connection.patch do |req|
      req.body = payload.to_json
    end

    # Handle response
    if response.status === 200
      puts "Batch of records #{chunk_of_records.size} upserted successfully"
    else
      puts "ERROR upserting batch of records:
        RESPONSE BODY: #{response.body}
        REQUEST BODY: #{payload.to_json}"
    end
  end
end

input_records = [
  # Existing person in the table, if using the sample data linked to in the README
  {
    'First Name': "Juliette",
    'Last Name': "Schimmang",
    'Unique ID': "16a05ea5-7bbd-4353-bc25-878a2245835e",
    'Job Title': "Account Executive II",
  },
  # New user to be added to the table
  {
    'First Name': "Marsha",
    'Last Name': "Rickeard",
    'Unique ID': "bf68da9d-805b-4117-90dc-d54eb46db19f",
    'Job Title': "CTO",
    'Hire Number': 201,
  },
]

# Convert input records to Airtable format (field key-value pairs within a "fields" object)
input_records_in_airtable_format = input_records.map do |input_record|
  { fields: input_record }
end

# Call helper function defined above to perform call the API endpoint
puts "Upserting #{input_records_in_airtable_format.count} records:\n\n"
upsert_records_in_batches(connection, input_records_in_airtable_format, [AIRTABLE_UNIQUE_FIELD_NAME_OR_ID])

puts "\nScript execution complete!"
