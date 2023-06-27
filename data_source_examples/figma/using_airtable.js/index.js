// Use dotenv to read the .env file and load into process.env
require('dotenv').config()

// Load external dependencies
const Airtable = require('airtable')
const { Client } = require('figma-js')

// Load helper functions from *_helpers.js
const { upsertRecordsInChunks, createMappingOfUniqueFieldToRecordId } = require('./airtable_helpers')

// Define variables and initialize Airtable client
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
Airtable.configure({ apiKey: AIRTABLE_API_KEY })
const base = Airtable.base(AIRTABLE_BASE_ID)

// Define variables and initialize Figma API client
const { FIGMA_PERSONAL_ACCESS_TOKEN, FIGMA_TEAM_ID, POPULATE_PAGES_TABLE } = process.env
const figma = Client({ personalAccessToken: FIGMA_PERSONAL_ACCESS_TOKEN })

// Configuration object containing table and field names/IDs.
// By having this object defined, there is one place to update if you modify the template base's schema/naming.
// (You do not need to edit this if you did not change table names or fields from the duplicated example base.)
// Airtable recommends using table and field IDs instead of names. The example below uses names for readability.
const TABLES_AND_FIELDS = {
  PROJECTS: {
    TABLE_NAME: 'Figma Projects',
    FIELDS: {
      DISPLAY_NAME: 'Name',
      FIGMA_ID: 'Figma ID',
      FIGMA_TEAM_ID: 'Figma Team ID'
    }
  },
  FILES: {
    TABLE_NAME: 'Figma Files',
    FIELDS: {
      DISPLAY_NAME: 'Name',
      FIGMA_ID: 'Figma ID',
      THUMBNAIL: 'Thumbnail',
      LINKED_RECORD_TO_PROJECT: 'Figma Project'
    }
  },
  PAGES: {
    TABLE_NAME: 'Figma Pages',
    FIELDS: {
      DISPLAY_NAME: 'Name',
      FIGMA_FILE_ID_PLUS_NODE_RANGE: 'Figma File ID + Node Range', // because node range by itself is not unique
      LINKED_RECORD_TO_FILE: 'Figma File'
    }
  }
};

(async () => {
  /// /////////////////////////////////////////////////////////////////
  // Note: you should not need to edit the code below this comment
  /// /////////////////////////////////////////////////////////////////

  // === FIGMA PROJECTS ===
  console.info('Retrieving all Figma projects from the Figma API')
  const { data: { projects: figmaProjectsForTeam } } = await figma.teamProjects(FIGMA_TEAM_ID)
  const inputProjectRecords = figmaProjectsForTeam.map((p) => {
    return {
      fields: {
        [TABLES_AND_FIELDS.PROJECTS.FIELDS.DISPLAY_NAME]: p.name,
        [TABLES_AND_FIELDS.PROJECTS.FIELDS.FIGMA_ID]: p.id,
        [TABLES_AND_FIELDS.PROJECTS.FIELDS.FIGMA_TEAM_ID]: FIGMA_TEAM_ID
      }
    }
  })

  // Use upsertRecords helper function to update existing or create new project records
  const airtableProjectsTableNameOrId = TABLES_AND_FIELDS.PROJECTS.TABLE_NAME
  const airtableProjectsTable = base.table(airtableProjectsTableNameOrId)
  await upsertRecordsInChunks(airtableProjectsTable, inputProjectRecords, [TABLES_AND_FIELDS.PROJECTS.FIELDS.FIGMA_ID])

  // === FIGMA FILES ===

  // Retrieve latest list of records from the projects table in Airtable
  const airtableProjectRecords = await airtableProjectsTable.select().all()
  const airtableProjectRecordsMappingOfUniqueIdToRecordId = createMappingOfUniqueFieldToRecordId(airtableProjectRecords, TABLES_AND_FIELDS.PROJECTS.FIELDS.FIGMA_ID)

  // Retrieve all Figma files associated with the Figma projects
  console.info('Retrieving all Figma files related to projects from the Figma API')
  const inputFileRecords = []
  for (const [figmaProjectId, airtableRecordId] of Object.entries(airtableProjectRecordsMappingOfUniqueIdToRecordId)) {
    console.log(`Retrieving Figma file metadata for files within project ${figmaProjectId} which maps to Airtable record ${airtableRecordId}`)
    const { data: { files: figmaFilesForProject } } = await figma.projectFiles(figmaProjectId)
    const inputFileRecordsForProject = figmaFilesForProject.map((f) => {
      return {
        fields: {
          [TABLES_AND_FIELDS.FILES.FIELDS.DISPLAY_NAME]: f.name,
          [TABLES_AND_FIELDS.FILES.FIELDS.FIGMA_ID]: f.key,
          [TABLES_AND_FIELDS.FILES.FIELDS.LINKED_RECORD_TO_PROJECT]: [airtableRecordId],
          // Sometimes a thumbnail_url is not available from Figma, so populate the Airtable field only when a thumbnail is non-null
          ...(f.thumbnail_url && { [TABLES_AND_FIELDS.FILES.FIELDS.THUMBNAIL]: [{ url: f.thumbnail_url }] })
        }
      }
    })
    inputFileRecords.push(...inputFileRecordsForProject)
  }

  // Use upsertRecords helper function to update existing or create new file records
  const airtableFilesTableNameOrId = TABLES_AND_FIELDS.FILES.TABLE_NAME
  const airtableFilesTable = base.table(airtableFilesTableNameOrId)
  await upsertRecordsInChunks(airtableFilesTable, inputFileRecords, [TABLES_AND_FIELDS.FILES.FIELDS.FIGMA_ID])

  if (POPULATE_PAGES_TABLE === 'true') {
    // === FIGMA PAGES ===

    // Retrieve latest list of records from the files table in Airtable
    const airtableFileRecords = await airtableFilesTable.select().all()
    const airtableFileRecordsMappingOfUniqueIdToRecordId = createMappingOfUniqueFieldToRecordId(airtableFileRecords, TABLES_AND_FIELDS.FILES.FIELDS.FIGMA_ID)

    // Retrieve all Figma pages associated with the Figma files
    console.info('Retrieving all Figma pages related to files from the Figma API')
    const inputPageRecords = []
    for (const [figmaFileId, airtableRecordId] of Object.entries(airtableFileRecordsMappingOfUniqueIdToRecordId)) {
      console.log(`Retrieving Figma page metadata for pages within file ${figmaFileId} which maps to Airtable record ${airtableRecordId}`)

      // Fetch file metadata from Figma API
      const { data: { document: { children: figmaPagesForFile } } } = await figma.file(figmaFileId)

      // Format array of pages into Airtable record field-value pairs
      const inputPageRecordsForFile = figmaPagesForFile.map((p) => {
        return {
          fields: {
            [TABLES_AND_FIELDS.PAGES.FIELDS.DISPLAY_NAME]: p.name,
            [TABLES_AND_FIELDS.PAGES.FIELDS.FIGMA_FILE_ID_PLUS_NODE_RANGE]: `${figmaFileId} ${p.id}`, // because node range by itself is not unique
            [TABLES_AND_FIELDS.PAGES.FIELDS.LINKED_RECORD_TO_FILE]: [airtableRecordId]
          }
        }
      })
      inputPageRecords.push(...inputPageRecordsForFile)
    }

    // Use upsertRecords helper function to update existing or create new file records
    const airtablePagesTableNameOrId = TABLES_AND_FIELDS.PAGES.TABLE_NAME
    const airtablePagesTable = base.table(airtablePagesTableNameOrId)
    await upsertRecordsInChunks(airtablePagesTable, inputPageRecords, [TABLES_AND_FIELDS.PAGES.FIELDS.FIGMA_FILE_ID_PLUS_NODE_RANGE])
  }

  console.log('\nScript execution complete')
})()
