<?php

// helper functions to upsert to Airtable in the helpers.php file
include 'helpers.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Set up your Airtable credentials
$baseId = $_ENV['AIRTABLE_BASE_ID'];
$tableId = $_ENV['AIRTABLE_TABLE_ID'];
$apiKey = $_ENV['AIRTABLE_API_KEY'];
$fieldToMergeOn = $_ENV['AIRTABLE_UNIQUE_FIELD_NAME_OR_ID'];

$inputRecords = [
        [
            'Unique ID' => '00480185-0cd2-4010-bfe7-486546d64fd1',
            'Job Title' => 'Manager, Help Desk Support'
        ],
        [
            'First Name' => 'Sam',
            'Last Name' => 'Smith',
            'Unique ID' => '34dasfaf7aa1-4974-9f41-e494b111330c',
            'Job Title' => 'VP, Operations',
            'Hire Number' => '201'
        ],
    ];

// Upsert data to Airtable
upsert_to_airtable($baseId, $tableId, $apiKey, $inputRecords, $fieldToMergeOn);

?>
