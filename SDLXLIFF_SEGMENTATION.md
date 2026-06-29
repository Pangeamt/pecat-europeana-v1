# SDLXLIFF Segmentation Support

## Overview

SDLXLIFF files pueden tener dos estructuras para el contenido:

### 1. Non-Segmented Structure (Simple)
```xml
<trans-unit id="1">
  <source>Hola mundo</source>
  <target>Bonjour monde</target>
</trans-unit>
```

### 2. Segmented Structure (Complex)
```xml
<trans-unit id="1">
  <source>
    <g id="8">Hola mundo completo sin segmentar</g>
  </source>
  
  <seg-source>
    <g id="8">
      <mrk mtype="seg" mid="1">Hola mundo.</mrk>
      <mrk mtype="seg" mid="2">Esto es más texto.</mrk>
    </g>
  </seg-source>
  
  <target>
    <g id="8">
      <mrk mtype="seg" mid="1">Bonjour monde.</mrk>
      <mrk mtype="seg" mid="2">Ceci est plus de texte.</mrk>
    </g>
  </target>
</trans-unit>
```

## Implementation Details

### Source Extraction Priority

El código ahora usa esta estrategia:

1. **Opción A (Preferida): Usar `<seg-source>` si existe**
   - Extrae cada `<mrk mtype="seg">` como un segmento separado
   - Respeta la segmentación original del documento
   - Preserva IDs de segmento (`mid`)
   - Mantiene sincronización con `<target>`

2. **Opción B (Fallback): Usar `<source>` si no existe `<seg-source>`
   - Extrae el texto completo de `<source>`
   - Se usa cuando no hay segmentación

### Función: `extractSegmentedSources(segSourceElement)`

```javascript
function extractSegmentedSources(segSourceElement) {
  // 1. Accede a <g> dentro de <seg-source>
  const gElement = segSourceElement.g;
  
  // 2. Obtiene todos los <mrk mtype="seg">
  const mrkElements = [...];
  
  // 3. Para cada <mrk mtype="seg">:
  //    - Extrae el texto
  //    - Solo procesa si mtype === 'seg'
  //    - Ignora otros tipos de marcadores
  
  // 4. Retorna array de textos segmentados
  return segments;
}
```

### Función: `fillSegmentedTarget(transUnit, tusMap)`

Cuando se exporta, esta función:

1. Lee segmentos de `<seg-source>`
2. Busca traducción para cada segmento en TUs
3. Reconstruye `<target>` con misma estructura
4. Preserva atributos de segmento (`mid`)

## Example Workflow

### Input SDLXLIFF
```xml
<trans-unit id="42">
  <source>
    <g id="8">En los últimos dos años, los principales puertos han registrado una caída. A simple vista, esto es un éxito. Sin embargo, un análisis profundo revela otra realidad.</g>
  </source>
  
  <seg-source>
    <g id="8">
      <mrk mtype="seg" mid="3">En los últimos dos años, los principales puertos han registrado una caída.</mrk>
      <mrk mtype="seg" mid="4">A simple vista, esto es un éxito.</mrk>
      <mrk mtype="seg" mid="5">Sin embargo, un análisis profundo revela otra realidad.</mrk>
    </g>
  </seg-source>
</trans-unit>
```

### Extraction Process

```javascript
// Paso 1: Detecta <seg-source>
segSourceElement = transUnit['seg-source'] // ✓ Existe

// Paso 2: Extrae segmentos
segments = [
  { mid: "3", text: "En los últimos dos años, los principales puertos han registrado una caída." },
  { mid: "4", text: "A simple vista, esto es un éxito." },
  { mid: "5", text: "Sin embargo, un análisis profundo revela otra realidad." }
]

// Paso 3: Crea array de sources para traducir
sourceTexts = [
  "En los últimos dos años, los principales puertos han registrado una caída.",
  "A simple vista, esto es un éxito.",
  "Sin embargo, un análisis profundo revela otra realidad."
]

// Paso 4: Ordena en sources array con metadata
sources = [
  { id: "42", source: "En los últimos...", segmentIndex: 0, isSegmented: true },
  { id: "42", source: "A simple vista...", segmentIndex: 1, isSegmented: true },
  { id: "42", source: "Sin embargo...", segmentIndex: 2, isSegmented: true }
]
```

### NexRelay Translation

```json
{
  "source_language": "es",
  "target_language": "fr",
  "texts": [
    "En los últimos dos años, los principales puertos han registrado una caída.",
    "A simple vista, esto es un éxito.",
    "Sin embargo, un análisis profundo revela otra realidad."
  ]
}
```

### NexRelay Response

```json
{
  "segments": [
    {
      "source": "En los últimos dos años, los principales puertos han registrado una caída.",
      "target": "Au cours des deux dernières années, les principaux ports ont enregistré une baisse.",
      "mtqe_score": -3.0
    },
    {
      "source": "A simple vista, esto es un éxito.",
      "target": "À première vue, c'est un succès.",
      "mtqe_score": -3.0
    },
    {
      "source": "Sin embargo, un análisis profundo revela otra realidad.",
      "target": "Cependant, une analyse approfondie révèle une autre réalité.",
      "mtqe_score": -3.0
    }
  ]
}
```

### TU Creation

```javascript
[
  {
    projectId: "proj-123",
    count: 0,
    srcLiteral: "En los últimos dos años, los principales puertos han registrado una caída.",
    translatedLiteral: "Au cours des deux dernières années, les principaux ports ont enregistré une baisse.",
    Status: "NOT_REVIEWED"
  },
  {
    projectId: "proj-123",
    count: 1,
    srcLiteral: "A simple vista, esto es un éxito.",
    translatedLiteral: "À première vue, c'est un succès.",
    Status: "NOT_REVIEWED"
  },
  {
    projectId: "proj-123",
    count: 2,
    srcLiteral: "Sin embargo, un análisis profundo revela otra realidad.",
    translatedLiteral: "Cependant, une analyse approfondie révèle une autre réalité.",
    Status: "NOT_REVIEWED"
  }
]
```

### Export Process

Al descargar, `fillSegmentedTarget()` hace:

1. Lee segmentos de `<seg-source>`
2. Busca TU para cada segmento: "En los últimos..." → busca en tusMap
3. Obtiene traducción: "Au cours des deux..."
4. Reconstruye `<target>` con estructura original:

```xml
<target>
  <g id="8">
    <mrk mtype="seg" mid="3">Au cours des deux dernières années, les principaux ports ont enregistré une baisse.</mrk>
    <mrk mtype="seg" mid="4">À première vue, c'est un succès.</mrk>
    <mrk mtype="seg" mid="5">Cependant, une analyse approfondie révèle une autre réalité.</mrk>
  </g>
</target>
```

## Key Points

### ✓ Order Preservation
- Segmentos en `<seg-source>` → orden en array → orden en NexRelay
- NexRelay response → mismo orden → TUs en BD
- TUs → mismo orden en export → mismo orden en `<target>`

### ✓ Metadata Preservation
- Atributos `mid` de segmentos preservados
- Atributos `id` de `<g>` preservados
- Estructura XML exacta reconstruida

### ✓ Backward Compatibility
- Si `<seg-source>` no existe, fallback a `<source>`
- Funciona con archivos simples y complejos
- No rompe archivos existentes

### ✓ Synchronization
- `<source>` y `<seg-source>` pueden coexistir
- Durante export, se usa segmentación si existe
- Si no existe, se rellena `<target>` como texto completo

### ✓ Segment Matching
- Cada `<mrk mtype="seg">` se busca individualmente
- Si un segmento no tiene traducción, se preserva el original
- Transiciones suaves entre fuente y destino

## Data Structure Changes

### Source Object (con segmentación)
```javascript
{
  id: "trans-unit-id",           // ID del trans-unit original
  source: "Texto del segmento",  // Texto a traducir
  segmentIndex: 0,               // Índice dentro del trans-unit (si segmentado)
  isSegmented: true              // Flag: ¿fue extraído de seg-source?
}
```

## Edge Cases

### Caso 1: Solo `<source>`, sin `<seg-source>`
```xml
<trans-unit id="1">
  <source>Hola mundo</source>
</trans-unit>
```
**Acción:** Extrae como non-segmented, usa `<source>`

### Caso 2: `<seg-source>` vacío o sin segmentos
```xml
<trans-unit id="1">
  <seg-source>
    <g id="1"><!-- vacío --></g>
  </seg-source>
</trans-unit>
```
**Acción:** Ignora `<seg-source>`, fallback a `<source>` si existe

### Caso 3: `<source>` con estructura, `<seg-source>` con segmentación
```xml
<trans-unit id="1">
  <source>
    <g id="1">Texto completo con formato</g>
  </source>
  <seg-source>
    <g id="1">
      <mrk mtype="seg" mid="1">Primer segmento</mrk>
      <mrk mtype="seg" mid="2">Segundo segmento</mrk>
    </g>
  </seg-source>
</trans-unit>
```
**Acción:** Usa `<seg-source>` (preferencia), extrae dos segmentos

### Caso 4: Segmentos con otros marcadores
```xml
<seg-source>
  <g id="1">
    <mrk mtype="seg" mid="1">Primer segmento</mrk>
    <mrk mtype="comment">Comentario ignorado</mrk>
    <mrk mtype="seg" mid="2">Segundo segmento</mrk>
  </g>
</seg-source>
```
**Acción:** Solo extrae `<mrk mtype="seg">`, ignora otros tipos

## Migration Notes

Si migras desde sistema anterior:

1. **Archivos sin `<seg-source>`:** Sin cambios, funciona igual
2. **Archivos con `<seg-source>`:** Ahora se respeta la segmentación
3. **TU anteriores:** Se conservan en BD, export mantiene orden

## Performance Impact

- Mínimo: solo agrega validación de atributo `mtype`
- Parsing XML igual (xml2js)
- Array building es O(n) independiente de segmentación
- Export es más eficiente (mapeo directo por segmento)

## Testing

```bash
# Test 1: Non-segmented file
curl -X POST /api/projects \
  -F "file=@simple.sdlxliff"

# Test 2: Segmented file
curl -X POST /api/projects \
  -F "file=@segmented.sdlxliff"

# Test 3: Export preserves segmentation
curl /api/projects/{id}/export > exported.sdlxliff
# Verify: <target> tiene misma estructura que <seg-source>
```
