<?php

// include helper functions to read from CSV and upsert to Airtable in the helpers.php file
include 'helpers.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Set up your Airtable credentials and CSV file path
$baseId = $_ENV['AIRTABLE_BASE_ID'];
$tableId = $_ENV['AIRTABLE_TABLE_ID'];
$apiKey = $_ENV['AIRTABLE_API_KEY'];
$fieldToMergeOn = $_ENV['AIRTABLE_UNIQUE_FIELD_NAME_OR_ID'];
$csvFilePath = "data.csv";

// Read data from CSV
$records = read_csv($csvFilePath);

// Import data to Airtable
$totalSent = upsert_to_airtable($baseId, $tableId, $apiKey, $records, $fieldToMergeOn);

// Output the total number of records sent to Airtable
echo "Total # of records imported to Airtable: {$totalSent}\n";

?>
