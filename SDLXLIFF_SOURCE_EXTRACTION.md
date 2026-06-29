# SDLXLIFF Source Extraction - Análisis Detallado

## Función Principal: `parseSdlxliffFile(filePath)`

### Flow Completo

```
1. Leer archivo del disco
   └─ fs.readFileSync(filePath, 'utf8')

2. Parsear XML
   └─ xml2js.Parser({ explicitArray: false })
   └─ parseStringPromise(fileContent)

3. Validar estructura SDLXLIFF
   ├─ Verificar: xliff element existe
   ├─ Verificar: file element existe
   ├─ Extraer: source-language
   └─ Extraer: target-language

4. Extraer sources de trans-units
   └─ extractSourcesFromTransUnits(xliffFile)

5. Normalizar lenguajes
   └─ "es-ES" → "es" (tomar solo código de país)

6. Retornar objeto con:
   ├─ sourceLanguage: "es"
   ├─ targetLanguage: "fr"
   ├─ sources: [array de objetos con id + source]
   └─ originalData: el XML parseado (para futura reutilización)
```

## Función: `extractSourcesFromTransUnits(xliffFile)`

### Estructura esperada del SDLXLIFF

```xml
<xliff>
  <file source-language="es-ES" target-language="fr-FR">
    <body>
      <group>
        <trans-unit id="1">
          <source>Hola mundo</source>
          <target>Bonjour monde</target>
        </trans-unit>
        <trans-unit id="2">
          <source>¿Cómo estás?</source>
        </trans-unit>
      </group>
      <group>
        <trans-unit id="3">
          <source>Buenos días</source>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
```

### Algoritmo de Extracción

**Paso 1: Acceder al body**
```javascript
const body = xliffFile.body;
if (!body) return sources; // Si no hay body, retornar array vacío
```

**Paso 2: Normalizar groups (puede haber 1 o varios)**
```javascript
// xml2js con { explicitArray: false } retorna:
// - Un solo group: body.group = {...}
// - Múltiples groups: body.group = [{...}, {...}]

const groups = Array.isArray(body.group) 
  ? body.group                    // Si es array, usar directamente
  : body.group 
    ? [body.group]                // Si existe pero no es array, envolver
    : [];                          // Si no existe, array vacío
```

**Paso 3: Iterar groups y extraer trans-units**
```javascript
groups.forEach((group) => {
  // Normalizar trans-units (similar a groups)
  const transUnits = Array.isArray(group['trans-unit'])
    ? group['trans-unit']
    : group['trans-unit']
      ? [group['trans-unit']]
      : [];
  
  // Procesar cada trans-unit
  transUnits.forEach((transUnit) => {
    const sourceElement = transUnit.source;
    if (sourceElement) {
      const sourceText = extractTextFromElement(sourceElement);
      if (sourceText && sourceText.trim()) {
        sources.push({
          id: transUnit.$?.id,
          source: sourceText,
        });
      }
    }
  });
});
```

## Función: `extractTextFromElement(element)`

### Propósito
Extraer texto de elementos `<source>` que pueden contener:
- Texto plano
- Elementos anidados (`<g>`, `<mrk>`, etc.)
- Mezcla de texto y elementos

### Casos Manejados

#### Caso 1: Texto Plano
```xml
<source>Hola mundo</source>
```
**Resultado:** `"Hola mundo"`

**Código:**
```javascript
if (typeof element === 'string') {
  return element;  // Si es string directo, retornar
}
```

#### Caso 2: Objeto con propiedad `_` (texto dentro de elemento)
```xml
<source>Hola mundo</source>
```

Cuando xml2js parsea, esto se convierte a:
```javascript
{
  _: 'Hola mundo'  // El contenido de texto está en propiedad '_'
}
```

**Código:**
```javascript
if (element._) {
  return element._;  // Retornar el texto
}
```

#### Caso 3: Elementos `<g>` (group)
```xml
<source>
  <g id="1">Hola</g> mundo
</source>
```

**Resultado:** `"Hola mundo"`

**Código:**
```javascript
if (element.g) {
  const gElements = Array.isArray(element.g) 
    ? element.g 
    : [element.g];
  
  return gElements
    .map((g) => extractTextFromElement(g))  // Recursivo
    .filter((text) => text)                 // Filtrar vacíos
    .join(' ');                             // Unir con espacio
}
```

#### Caso 4: Elementos `<mrk>` (marker)
```xml
<source>
  <mrk mtype="seg" mid="1">Hola mundo</mrk>
</source>
```

**Resultado:** `"Hola mundo"`

**Código:**
```javascript
if (element.mrk) {
  const mrkElements = Array.isArray(element.mrk) 
    ? element.mrk 
    : [element.mrk];
  
  return mrkElements
    .map((mrk) => extractTextFromElement(mrk))  // Recursivo
    .filter((text) => text)                     // Filtrar vacíos
    .join(' ');                                 // Unir con espacio
}
```

#### Caso 5: Default
```javascript
return '';  // Si no matchea nada, retornar string vacío
```

## Ejemplo Real: SDLXLIFF Complejo

### Input SDLXLIFF
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
          <source>Apunte número 829</source>
        </trans-unit>
        
        <trans-unit id="2">
          <source>
            <g id="1">El espejismo</g> blanco
          </source>
        </trans-unit>
        
        <trans-unit id="3">
          <source>
            <mrk mtype="seg" mid="1">En los últimos</mrk> 
            dos años
          </source>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
```

### Procesamiento Paso a Paso

**Trans-unit 1:**
```javascript
transUnit = {
  $: { id: '1' },
  source: 'Apunte número 829'
}
// extractTextFromElement recibe string
// typeof element === 'string' → return 'Apunte número 829'
sources.push({
  id: '1',
  source: 'Apunte número 829'
})
```

**Trans-unit 2:**
```javascript
transUnit = {
  $: { id: '2' },
  source: {
    g: { _: 'El espejismo' },
    _: ' blanco'
  }
}
// extractTextFromElement recibe object con 'g'
// element.g existe → Array: [{ _: 'El espejismo' }]
// map: extractTextFromElement({ _: 'El espejismo' }) → 'El espejismo'
// result: 'El espejismo' + ' blanco' = 'El espejismo blanco'
sources.push({
  id: '2',
  source: 'El espejismo blanco'
})
```

**Trans-unit 3:**
```javascript
transUnit = {
  $: { id: '3' },
  source: {
    mrk: { _: 'En los últimos' },
    _: ' dos años'
  }
}
// extractTextFromElement recibe object con 'mrk'
// element.mrk existe → Array: [{ _: 'En los últimos' }]
// map: extractTextFromElement({ _: 'En los últimos' }) → 'En los últimos'
// result: 'En los últimos' + ' dos años' = 'En los últimos dos años'
sources.push({
  id: '3',
  source: 'En los últimos dos años'
})
```

### Output Array
```javascript
[
  { id: '1', source: 'Apunte número 829' },
  { id: '2', source: 'El espejismo blanco' },
  { id: '3', source: 'En los últimos dos años' }
]
```

## Envío a NexRelay

Los sources extraídos se envían así:

```javascript
const sourceTexts = sources.map(s => s.source);
// ['Apunte número 829', 'El espejismo blanco', 'En los últimos dos años']

const translationSegments = await translateWithNexRelay({
  texts: sourceTexts,  // Array de strings puros
  sourceLanguage: 'es',
  targetLanguage: 'fr',
  tmMode: 'standard',
  tmThreshold: 0.75,
  tmIds: [],
  glossaryIds: [],
});
```

### Payload enviado a NexRelay
```json
{
  "source_language": "es",
  "target_language": "fr",
  "texts": [
    "Apunte número 829",
    "El espejismo blanco",
    "En los últimos dos años"
  ],
  "tm_mode": "standard",
  "tm_threshold": 0.75,
  "tm_ids": [],
  "glossary_ids": []
}
```

## Respuesta de NexRelay

```json
{
  "segments": [
    {
      "source": "Apunte número 829",
      "target": "Note numéro 829",
      "tm_info": [],
      "glossary_info": [],
      "mtqe_score": -3.0
    },
    {
      "source": "El espejismo blanco",
      "target": "Le mirage blanc",
      "tm_info": [...],
      "glossary_info": [],
      "mtqe_score": -3.0
    },
    {
      "source": "En los últimos dos años",
      "target": "Au cours des deux dernières années",
      "tm_info": [...],
      "glossary_info": [],
      "mtqe_score": -3.0
    }
  ]
}
```

## Creación de TUs

Los segments de NexRelay se convierten a TUs:

```javascript
const tusData = normalizeNexRelaySegmentsToTusData(
  translationSegments,
  projectId,
  'es',
  'fr'
);

// Resultado:
[
  {
    projectId: 'proj-123',
    count: 0,
    srcLiteral: 'Apunte número 829',
    translatedLiteral: 'Note numéro 829',
    sourceLanguage: 'es',
    targetLanguage: 'fr',
    Status: 'NOT_REVIEWED',
    ...
  },
  {
    projectId: 'proj-123',
    count: 1,
    srcLiteral: 'El espejismo blanco',
    translatedLiteral: 'Le mirage blanc',
    sourceLanguage: 'es',
    targetLanguage: 'fr',
    Status: 'ACCEPTED',  // Si TM 100%
    ...
  },
  {
    projectId: 'proj-123',
    count: 2,
    srcLiteral: 'En los últimos dos años',
    translatedLiteral: 'Au cours des deux dernières années',
    sourceLanguage: 'es',
    targetLanguage: 'fr',
    Status: 'NOT_REVIEWED',
    ...
  }
]
```

## Consideraciones Importantes

### 1. Orden Preservado
- El array de sources mantiene el orden exacto del SDLXLIFF
- Los indices coinciden 1:1 con los segments de respuesta
- Al exportar, se usa este order para rellenar targets

### 2. Manejo de Espacios
- `extractTextFromElement` une elementos con espacio: `.join(' ')`
- Esto significa: `<g>Hola</g>mundo` → `"Hola mundo"` (con espacio)
- Si necesitas sin espacio, se debe modificar el `join('')`

### 3. Caracteres Especiales
- xml2js parsea automáticamente entidades XML: `&quot;` → `"`
- Se preservan caracteres especiales: acentos, signos de puntuación

### 4. Elementos Anidados
- La función es recursiva: puede manejar `<g><g>texto</g></g>`
- Procesa profundidad ilimitada

### 5. Validación Mínima
- Solo se valida que `sourceText.trim()` no esté vacío
- No se valida unicidad (si hay duplicados, se procesan todos)
- No se valida longitud máxima

## Mejoras Potenciales

### 1. Control de Espacios
```javascript
// Opción: permitir configurar si unir con espacio o no
const JOIN_SEPARATOR = process.env.SDLXLIFF_TEXT_JOIN || ' ';
```

### 2. Deduplicación Opcional
```javascript
const sources = extractSourcesFromTransUnits(xliffFile);
const deduped = [...new Set(sources.map(s => s.source))];
```

### 3. Filtrado por Criterios
```javascript
// Filtrar por longitud mínima
const filtered = sources.filter(s => s.source.length >= 3);

// Filtrar por patrón (no vacíos, sin solo números)
const filtered = sources.filter(s => /[a-záéíóúñ]/i.test(s.source));
```

### 4. Logging Detallado
```javascript
sources.forEach((s, i) => {
  console.log(`[${i}] ID: ${s.id}, Length: ${s.source.length}, Text: "${s.source}"`);
});
```

### 5. Validación Strict
```javascript
if (!sourceLanguage || !targetLanguage) {
  throw new HttpError(400, 'Languages required');
}

if (sources.length === 0) {
  throw new HttpError(400, 'No sources found');
}

const MAX_SOURCES = process.env.MAX_SDLXLIFF_SOURCES || 10000;
if (sources.length > MAX_SOURCES) {
  throw new HttpError(413, `Too many sources: ${sources.length}/${MAX_SOURCES}`);
}
```
