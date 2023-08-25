# Install external dependencies
install.packages("dotenv") # for loading our .env file
install.packages("httr") # for interacting making HTTP requests to the Airtable API
install.packages("jsonlite") # for converting data structures to JSON

# Load dependencies
library(dotenv)
library(httr)
library(jsonlite)

# Load .env file into environment variables
load_dot_env(file = ".env")

# Assign environment variables to local variables
airtable_api_key <- Sys.getenv("AIRTABLE_API_KEY")
airtable_base_id <- Sys.getenv("AIRTABLE_BASE_ID")
airtable_table_id <- Sys.getenv("AIRTABLE_TABLE_ID")
airtable_unique_field_name_or_id <-
  Sys.getenv("AIRTABLE_UNIQUE_FIELD_NAME_OR_ID")

# Define input records(from the source system).
# This would usually be an API call or reading in a CSV or other format of data.
input_records <- list(
  list(
    `First Name` = c("Marsha"),
    `Last Name` = c("Rickeard"),
    `Unique ID` = c("bf68da9d-805b-4117-90dc-d54eb46db19f"),
    `Job Title` = c("CTO"),
    `Hire Number` = c(201)
  ),
  list(
    `First Name` = c("Juliette"),
    `Last Name` = c("Schimmang"),
    `Unique ID` = c("16a05ea5-7bbd-4353-bc25-878a2245835e"),
    `Job Title` = c("Account Executive II"),
    `Hire Number` = c(2)
  )
)

# Transform each element in input_records to be in the format Airtable expects
input_records_airtable_fmt <-
  lapply(input_records, function(record) {
    list(fields = record)
  })

# Function to chunk a list of records into batches of chunk_size
# (Airtable's API can accept up to 10 records per request)
chunk_list <- function(lst, chunk_size) {
  num_chunks <- ceiling(length(lst) / chunk_size)
  split(lst, rep(1:num_chunks, each = chunk_size, length.out = length(lst)))
}

# Function to perform Airtable upsert with retries
airtable_upsert_records <-
  function(api_key,
           base_id,
           table_name,
           records,
           fields_to_merge_on,
           typecast = TRUE,
           batch_size = 10) {
    # Construct base URL for the API call to https://airtable.com/developers/web/api/update-multiple-records
    base_url <-
      sprintf("https://api.airtable.com/v0/%s/%s", base_id, table_name)

    # Define authentication and content type headers
    headers <- c(
      `Authorization` = paste("Bearer", api_key),
      `Content-Type` = "application/json"
    )

    # Split records into batches of batch_size
    record_chunks <- chunk_list(records, batch_size)

    # For each chunk of records, construct the payload and make the API call
    for (batch_records in record_chunks) {
      payload <- list(
        typecast = typecast,
        performUpsert = list(fieldsToMergeOn = list(fields_to_merge_on)),
        records = batch_records
      )
      payload_json <- toJSON(payload, auto_unbox = TRUE)

      # Implement a custom retry loop
      attempt <- 1
      success <- FALSE

      while (!success && attempt <= 3) {
        response <- PATCH(
          url = base_url,
          body = payload_json,
          add_headers(headers)
        )

        if (status_code(response) == 200) {
          success <- TRUE
          cat(
            "Batch of ",
            length(batch_records),
            " records upserted successfully"
          )
        } else if (status_code(response) == 429) {
          Sys.sleep(10) # Sleep for 10 seconds
        } else {
          stop(
            "ERROR upserting batch of records:",
            content(response, "text")
          )
        }

        attempt <- attempt + 1
      }
    }
  }


cat(
  "Upserting ",
  length(input_records_airtable_fmt),
  " records:\n\n"
)

# Upsert records
airtable_upsert_records(
  airtable_api_key,
  airtable_base_id,
  airtable_table_id,
  input_records_airtable_fmt,
  c(airtable_unique_field_name_or_id)
)


cat("\nScript execution complete!")
