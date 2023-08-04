<?php

require 'vendor/autoload.php';

use GuzzleHttp\Client;

function prepare_data_payload($chunk, $fieldsToMergeOn) {
    $dataPayload = [
        'typecast' => true,
        'performUpsert' => [
            'fieldsToMergeOn' => [$fieldsToMergeOn]
        ],
        'records' => array_map(function($record) {
            return ['fields' => $record];
        }, $chunk)
    ];
    return $dataPayload;
}

function send_request($client, $url, $dataPayload) {
    $response = $client->patch($url, [
        'json' => $dataPayload
    ]);
    $responseData = json_decode($response->getBody(), true);
    return $responseData;
}

function upsert_to_airtable($baseId, $tableId, $apiKey, $records, $fieldsToMergeOn) {
    $chunks = array_chunk($records, 10); // Chunk records into batches of 10

    $client = new Client([
        'base_uri' => 'https://api.airtable.com/v0/',
        'headers' => [
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json'
        ]
    ]);
    $url = "{$baseId}/{$tableId}";

    foreach ($chunks as $chunk) {
        $dataPayload = prepare_data_payload($chunk, $fieldsToMergeOn);
        
        $responseData = send_request($client, $url, $dataPayload);

        if (isset($responseData['records'])) {
            echo "Successfully upserted " . count($responseData['records']) . " records to Airtable\n";
        } else {
            echo "Upsert to Airtable failed. Error message: {$responseData['error']['message']}\n";
        }
    }
}

?>



