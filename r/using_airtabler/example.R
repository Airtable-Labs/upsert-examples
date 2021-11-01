# Install external dependencies
install.packages("dotenv") # for loading our .env file
remotes::install_github('bergant/airtabler') # for interacting with the Airtable REST API

# Load dependencies
library(dotenv) # reads .env file on library load
library(airtabler)


# Configure and initialize Airtable client
airtable_table_id <- Sys.getenv("AIRTABLE_TABLE_ID")
airtable_base <- airtable(
  base = Sys.getenv("AIRTABLE_BASE_ID"), 
  tables = c(airtable_table_id)
)

# Define input records(from the source system).
# This would usually be an API call or reading in a CSV or other format of data.

# Existing person in the table, if using the sample data linked to in the README
input_record1 <- data.frame(
  `First Name` = c("Juliette"),
  `Last Name` = c("Schimmang"),
  `Unique ID` = c("16a05ea5-7bbd-4353-bc25-878a2245835e"),
  `Job Title` = c("Account Executive II"),
  `Hire Number` = c(2),
  check.names = FALSE
)

# New user to be added to the table
input_record2 <- data.frame(
  `First Name` = c("Marsha"),
  `Last Name` = c("Rickeard"),
  `Unique ID` = c("bf68da9d-805b-4117-90dc-d54eb46db19f"),
  `Job Title` = c("CTO"),
  `Hire Number` = c(201),
  check.names = FALSE
)

# Combine into a single dataframe with 2 obs
input_records <- rbind(input_record1, input_record2)

# Retrieve all existing records from the base through the Airtable REST API
table_records <- airtable_base[[airtable_table_id]]$select_all()
cat(nrow(table_records), 'existing records found in table')

# Create two data frames: one for records to be created, one for records to be updated
records_to_create = data.frame()
records_to_update = data.frame()

# For each input record, check if it exists in the existing records.
# If it does, add it to the list of records to update. If it does not, add to the list of records to create it.
for(i in 1:nrow(input_records)) {
  input_record <- input_records[i,]
  input_record_unique_field_value <- input_record[[Sys.getenv('AIRTABLE_UNIQUE_FIELD_NAME')]]
  
  # Look for existing records from the live table that have the same unique field value as the input record
  existing_records <- table_records[table_records[[Sys.getenv('AIRTABLE_UNIQUE_FIELD_NAME')]] == input_record_unique_field_value, ]

  # If exactly 1 record exists with the input record's unique ID,
  # add the record to the list of records to be updated
  if(nrow(existing_records) == 1){
    input_record["existing_airtable_record_id"] = existing_records$id
    #input_record <- cbind(input_record, existing_airtable_record_id = c(existing_records$existing_airtable_record_id))     # Add new column to data
    records_to_update <- rbind(records_to_update, input_record)
  } else {
    # Otherwise, add the input record to the list of records to be created
    records_to_create <- rbind(records_to_create, input_record)
  }
  
}

# Read out array sizes
cat(nrow(records_to_create), 'records to create')
cat(nrow(records_to_update), 'records to update')

# Perform record creation
# "insert" Loops through and creates one record at a time
airtable_base[[airtable_table_id]]$insert(records_to_create) 

# Perform record updates on existing records
# Loop through each record that needs to be updated
for(i in 1:nrow(records_to_update)) {
  record_to_update = records_to_update[i,]
  print(record_to_update)
  # Create list of fields that excludes existing_airtable_record_id (which we do not want to 
  record_to_update_fields_as_list <- as.list(subset(record_to_update, select = -c(existing_airtable_record_id) ))
  airtable_base[[airtable_table_id]]$update(record_id = record_to_update$existing_airtable_record_id, record_data = record_to_update_fields_as_list)
}

cat("Script execution complete!")
