# SDLXLIFF Workflow Documentation

## Overview

This document describes the complete workflow for importing and processing SDLXLIFF (SDL XLIFF) translation files in the PECAT-E system. The process includes:

1. **File Upload & Validation** - Verify SDLXLIFF file format
2. **Project Creation** - Create a project in the database
3. **Source Extraction** - Extract all source texts from translation units
4. **Translation** - Call NexRelay API (translate-pecat-e endpoint) for translation
5. **TU Creation** - Create Translation Units with translation data

## Architecture

### New Module: `modules/projects/sdlxliff-service.js`

This module contains all SDLXLIFF-specific operations:

#### `parseSdlxliffFile(filePath)`
- **Purpose**: Parse SDLXLIFF XML file and extract sources
- **Input**: File path to SDLXLIFF file
- **Returns**: 
  ```javascript
  {
    sourceLanguage: "es",      // Extracted from xliff/@source-language
    targetLanguage: "fr",      // Extracted from xliff/@target-language
    sources: [                 // Array of all source texts
      { id: "trans-unit-id", source: "text" },
      ...
    ],
    originalData: {...}        // Parsed XML data (for future reference)
  }
  ```
- **Error Handling**: 
  - Returns HTTP 400 if XML is invalid
  - Returns HTTP 400 if xliff/file structure is missing
  - Returns HTTP 400 if source/target languages not specified
  - Returns HTTP 400 if no translation units found

#### `translateWithNexRelay({texts, sourceLanguage, targetLanguage, tmMode, tmThreshold, tmIds, glossaryIds})`
- **Purpose**: Call NexRelay translation API
- **Endpoint**: `http://prod.pangeamt.com:8080/NexRelay/v1/translate-pecat-e`
- **API Key**: Read from `NEXRELAY_API_KEY` env var (default: `pcat-7d9a3f8e2b4c1d6f-default`)
- **Returns**: Array of translation segments
  ```javascript
  [
    {
      source: "original text",
      target: "translated text",
      tm_info: [...],           // Translation Memory matches
      glossary_info: [...],     // Glossary entries
      mtqe_score: -3.0          // Quality score
    },
    ...
  ]
  ```
- **Error Handling**:
  - Returns HTTP 401 if API key is invalid
  - Returns HTTP 400 if request is invalid
  - Returns HTTP 500 if service is unavailable

#### `normalizeNexRelaySegmentsToTusData(segments, projectId, sourceLanguage, targetLanguage)`
- **Purpose**: Convert NexRelay response to TU data format
- **Returns**: Array of TU objects ready for database insertion
- **Automatically Determines**:
  - `Status`: ACCEPTED (if TM match with 100% score) or NOT_REVIEWED
  - `block`: true if TM 100% match
  - `levenshteinDistance`: TM similarity score

### Modified: `modules/projects/import-service.js`

#### New Function: `processSdlxliffProjectInBackground()`
- Runs in background (doesn't block upload response)
- Flow:
  1. Parse SDLXLIFF file
  2. Extract source language & target language (can be overridden by user input)
  3. Call NexRelay translation API
  4. Create TUs in database
  5. Set project status to READY on success, FILE_ERROR on failure

#### Modified: `importProjectsFromUploadService()`
- Now detects file extension `.sdlxliff`
- Routes SDLXLIFF files to `processSdlxliffProjectInBackground()` instead of `processUploadedProjectInBackground()`
- All other files continue with existing workflow

### Updated: `lib/utils.js`
- Added `"sdlxliff"` to `ALLOWED_FILE_EXTENSIONS`

### API Endpoint: `POST /api/projects`
- **No changes needed** - endpoint already supports SDLXLIFF via FormData

## Usage

### Upload SDLXLIFF File

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Cookie: next-auth.session-token=..." \
  -F "file=@document.sdlxliff" \
  -F "src=es" \
  -F "tgt=fr" \
  -F "tm_mode=standard" \
  -F "tm_threshold=0.75" \
  -F "tm_ids=[\"tm-id-1\"]" \
  -F "glossary_ids=[\"glossary-id-1\"]"
```

### Response
```json
{
  "projectIds": ["project-uuid"]
}
```

### Project Status
- `UPLOADED` - File received
- `PROCESSING` - Parsing SDLXLIFF and translating
- `READY` - Complete, TUs created
- `FILE_ERROR` - Error during processing

## Environment Variables

```bash
NEXRELAY_API_HOST=http://prod.pangeamt.com:8080        # NexRelay API host
NEXRELAY_API_KEY=pcat-7d9a3f8e2b4c1d6f-default          # NexRelay API key
```

## Data Flow Diagram

```
Upload SDLXLIFF
    ↓
POST /api/projects
    ↓
importProjectsFromUploadService()
    ├─ Create Project (status: UPLOADED)
    ├─ Link TMs and Glossaries
    └─ async: processSdlxliffProjectInBackground()
         ├─ parseSdlxliffFile()
         │  └─ Extract sources + languages
         ├─ translateWithNexRelay()
         │  ├─ Call NexRelay API
         │  └─ Get translation segments
         ├─ normalizeNexRelaySegmentsToTusData()
         │  └─ Convert to TU format
         ├─ prisma.tu.createMany()
         │  └─ Insert TUs in database
         └─ Update Project (status: READY)
```

## Example SDLXLIFF Structure

```xml
<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" 
  xmlns="urn:oasis:names:tc:xliff:document:1.2"
  source-language="es-ES"
  target-language="fr-FR">
  
  <file original="document.docx">
    <body>
      <group>
        <trans-unit id="1">
          <source>Hola mundo</source>
          <target>Bonjour monde</target>
        </trans-unit>
        <trans-unit id="2">
          <source>¿Cómo estás?</source>
          <target>Comment allez-vous?</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
```

## Error Handling

### User-Facing Errors

| Scenario | HTTP | Response |
|----------|------|----------|
| Invalid XML format | 400 | `"Invalid SDLXLIFF file format..."` |
| Missing xliff/file | 400 | `"Invalid SDLXLIFF structure..."` |
| Missing languages | 400 | `"SDLXLIFF file must specify source-language..."` |
| No translation units | 400 | `"No translation units found..."` |
| Invalid API key | 401 | `"Invalid API key for translation service"` |
| NexRelay error | 500 | `"Translation service unavailable..."` |

### Processing Errors
- Logged to console (stderr)
- Project status set to `FILE_ERROR`
- User can view project status via GET `/api/projects/{id}`

## Testing

### Test File

Create a minimal SDLXLIFF file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" 
  xmlns="urn:oasis:names:tc:xliff:document:1.2"
  source-language="es-ES"
  target-language="fr-FR">
  <file>
    <body>
      <group>
        <trans-unit id="1">
          <source>Test</source>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
```

### Upload Command

```bash
curl -X POST http://localhost:3000/api/projects \
  -b "next-auth.session-token=YOUR_TOKEN" \
  -F "file=@test.sdlxliff" \
  -F "src=es" \
  -F "tgt=fr"
```

## Differences from Standard Upload

| Aspect | Standard (JSON/PDF/etc) | SDLXLIFF |
|--------|------------------------|----------|
| Parser | Oxigen API | NexRelay API |
| Source Extraction | File type specific | XML parsing |
| Language Detection | From user input | From SDLXLIFF + user override |
| Response Format | Oxigen trans_units | NexRelay segments |
| TM/Glossary | Via Oxigen | Via NexRelay |

## Export/Download Workflow

### Overview

Once translations are complete, users can export the SDLXLIFF file with translations. The system:

1. **Preserves Original Structure** - Uses the original uploaded SDLXLIFF file as a template
2. **Fills Target Elements** - Populates `<target>` elements with translations from TUs
3. **Maintains Order** - Keeps the exact same order and structure as original
4. **Supports Multiple Formats** - Export as SDLXLIFF (XML) or JSON

### Architecture

#### New Module: `modules/projects/export-service.js`

##### `exportProjectAsSdlxliffService(projectId, actorUser)`
- **Purpose**: Export project as SDLXLIFF with translations
- **Returns**: XML string with `<target>` elements populated
- **Validations**:
  - Project must be SDLXLIFF format
  - Project must have status READY
  - User must have access to project
- **Error Codes**:
  - 400: Not an SDLXLIFF project or invalid format
  - 404: Project not found or no TUs found
  - 409: Project still processing

##### `exportProjectAsJsonService(projectId, actorUser)`
- **Purpose**: Export project as JSON for API/programmatic use
- **Returns**: JSON object with metadata and translation units
- **Structure**:
  ```json
  {
    "projectName": "document.sdlxliff",
    "sourceLanguage": "es",
    "targetLanguage": "fr",
    "totalUnits": 15,
    "units": [
      {
        "id": "tu-uuid",
        "source": "Hola mundo",
        "target": "Bonjour monde",
        "status": "ACCEPTED",
        "score": -3.0
      }
    ]
  }
  ```

### API Endpoint: `GET /api/projects/[id]/export`

#### Download as SDLXLIFF

```bash
curl -X GET "http://localhost:3000/api/projects/project-uuid/export?format=sdlxliff" \
  -H "Cookie: next-auth.session-token=..." \
  -o export.sdlxliff
```

**Response**: XML file with translations
- Content-Type: `application/xml`
- Disposition: `attachment; filename="export-{projectId}.sdlxliff"`

#### Export as JSON

```bash
curl -X GET "http://localhost:3000/api/projects/project-uuid/export?format=json" \
  -H "Cookie: next-auth.session-token=..."
```

**Response**: JSON object with project and translation data

#### Default Format

If no format is specified, defaults to SDLXLIFF:

```bash
curl -X GET "http://localhost:3000/api/projects/project-uuid/export" \
  -H "Cookie: next-auth.session-token=..."
```

### Export Data Flow

```
GET /api/projects/{id}/export
           │
           ├─ User Authentication
           ├─ Project Access Check
           ├─ Project Status Check (must be READY)
           └─ exportProjectAsSdlxliffService()
                ├─ Read original SDLXLIFF file
                ├─ Parse XML
                ├─ Get all TUs for project
                ├─ Match TUs to trans-units by source text
                ├─ Fill <target> elements with translations
                ├─ Preserve original structure & order
                ├─ Rebuild XML
                └─ Return file for download
```

### Example: Full Workflow

**1. Upload SDLXLIFF**
```bash
curl -X POST http://localhost:3000/api/projects \
  -b "next-auth.session-token=TOKEN" \
  -F "file=@original.sdlxliff" \
  -F "src=es" \
  -F "tgt=fr"
# Returns: {"projectIds": ["proj-uuid"]}
```

**2. Check Project Status**
```bash
curl -X GET http://localhost:3000/api/projects \
  -b "next-auth.session-token=TOKEN"
# Returns: Project with status READY after processing
```

**3. Get Translation Units**
```bash
curl -X GET http://localhost:3000/api/projects/proj-uuid/tus \
  -b "next-auth.session-token=TOKEN"
# Returns: Array of TUs with translations
```

**4. Download Translated SDLXLIFF**
```bash
curl -X GET http://localhost:3000/api/projects/proj-uuid/export \
  -b "next-auth.session-token=TOKEN" \
  -o translated.sdlxliff
```

**5. Result**
- `translated.sdlxliff` contains the original SDLXLIFF structure
- All `<trans-unit>` elements have `<target>` elements filled with translations
- File maintains exact same order and grouping as original
- Ready for import into SDL Trados or other CAT tools

### Original SDLXLIFF Example

```xml
<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" source-language="es-ES" target-language="fr-FR">
  <file original="document.docx">
    <body>
      <group>
        <trans-unit id="1">
          <source>Hola mundo</source>
        </trans-unit>
        <trans-unit id="2">
          <source>¿Cómo estás?</source>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
```

### Downloaded SDLXLIFF (With Translations)

```xml
<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" source-language="es-ES" target-language="fr-FR">
  <file original="document.docx">
    <body>
      <group>
        <trans-unit id="1">
          <source>Hola mundo</source>
          <target>Bonjour monde</target>
        </trans-unit>
        <trans-unit id="2">
          <source>¿Cómo estás?</source>
          <target>Comment allez-vous?</target>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
```

### Matching Algorithm

The export process matches translations to original trans-units using:

1. **Source Text Matching**
   - Normalizes source text (trim whitespace)
   - Matches TU `srcLiteral` to original `<source>` element text
   - Order-preserving: maintains original trans-unit sequence

2. **Fallback Behavior**
   - If no TU found for a trans-unit, `<target>` element is not created
   - Original empty `<trans-unit>` is preserved as-is
   - No data loss

### Translation Status Mapping

| TU Status | SDLXLIFF Action |
|-----------|-----------------|
| NOT_REVIEWED | Include in export (for review in CAT tool) |
| TRANSLATED_MT | Include in export (machine translation) |
| EDITED | Include in export (user-reviewed) |
| ACCEPTED | Include in export (confirmed/TM match) |
| REJECTED | Include in export (user can re-edit) |

All statuses are preserved through the export.

### Error Handling

| Scenario | HTTP | Message |
|----------|------|---------|
| Project not SDLXLIFF format | 400 | "Project is not an SDLXLIFF project..." |
| Project not ready | 409 | "Project is not ready yet..." |
| No TUs found | 404 | "No translation units found in project" |
| XML parse error | 500 | "Error generating SDLXLIFF export..." |
| Invalid format param | 400 | "Invalid export format..." |

## Future Enhancements

1. **Target Text Preservation** - If SDLXLIFF already has `<target>` elements, optionally preserve them instead of retranslating
2. **Partial Translation** - Update only source translations, preserve existing targets
3. **Metadata Preservation** - Store and restore SDLXLIFF metadata (file attributes, context groups)
4. **Batch Processing** - Handle multiple SDLXLIFF files in one upload
5. **Selective Export** - Export only reviewed/approved segments
6. **Format Conversion** - Support export to other formats (TMX, XLIFF 2.0)
