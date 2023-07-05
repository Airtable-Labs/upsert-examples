<?php

require 'vendor/autoload.php';

use GuzzleHttp\Client;

function read_csv($csvFilePath) {
    // Read CSV file and convert it into an array of records
    $records = [];
    $file = fopen($csvFilePath, 'r');
    $header = fgetcsv($file);
    while (($row = fgetcsv($file)) !== false) {
        $record = array_combine($header, $row);
        $records[] = $record;
    }
    fclose($file);

    return $records;
}

function upsert_to_airtable($baseId, $tableId, $apiKey, $records, $fieldsToMergeOn) {
    // Prepare the data payload for the API request
    $chunks = array_chunk($records, 10); // Chunk records into batches of 10
    $totalSent = 0;

    $client = new Client([
        'base_uri' => 'https://api.airtable.com/v0/',
        'headers' => [
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json'
        ]
    ]);

    foreach ($chunks as $chunk) {
        $dataPayload = [
            'typecast' => true,
            'performUpsert' => [
                'fieldsToMergeOn' => [$fieldsToMergeOn]
            ],
            'records' => []
        ];

        foreach ($chunk as $record) {
            $dataPayload['records'][] = [
                'fields' => $record
            ];
        }

        // Send the API request
        $url = "{$baseId}/{$tableId}";
        $response = $client->patch($url, [
            'json' => $dataPayload
        ]);

        // Handle the response
        $responseData = json_decode($response->getBody(), true);
        if (isset($responseData['records'])) {
            $importedCount = count($responseData['records']);
            $totalSent += $importedCount;
            echo "Successfully imported {$importedCount} records to Airtable\n";
        } else {
            echo "Import to Airtable failed. Error message: {$responseData['error']['message']}\n";
        }
    }

  return $totalSent;
}

?>