# Manual de usuario de PECAT-E

Verificado 2026-10-13 · Fuente: la aplicación en el entorno de pruebas (mismo código que producción, `stable` `97d2c17`)
y el código de este repositorio. Las capturas son de un espacio de demostración con datos de ejemplo.

## Qué es PECAT-E

PECAT-E es una plataforma de posedición. Subes un documento, la plataforma lo traduce automáticamente con las
memorias, los glosarios y los ajustes que hayas elegido, y después las personas revisan la traducción segmento a
segmento. Al terminar se descarga el documento traducido en el mismo formato en que entró.

## Los dos roles de este manual

| | Administrador | Usuario |
|---|---|---|
| Quién es | Quien gestiona el trabajo de un espacio | Quien traduce o revisa |
| Menú | Proyectos, Perfiles, Memorias, Glosarios, Usuarios, Cuenta | Proyectos, Cuenta |
| Usuarios | Los da de alta y los edita | — |
| Memorias, glosarios y perfiles | Los crea, importa y mantiene | Sin acceso |
| Proyectos y documentos | Crea proyectos, sube documentos y asigna traductor y revisor | Solo ve los documentos que tiene asignados |
| Editor | Revisa cualquier documento y puede bloquear segmentos | Revisa sus documentos |
| Entrega | Marca la traducción y la revisión como entregadas, y descarga aunque falte trabajo | Descarga cuando el documento está terminado |

Existe un tercer rol, el superadministrador de la plataforma, que crea los espacios de trabajo y sus
administradores. No se trata en este manual.

## Cómo se trabaja

1. El **Administrador** prepara los recursos: importa memorias y glosarios, y crea un **perfil** que los agrupa.
2. Crea un **proyecto** con ese perfil y sube los **documentos**. La plataforma los traduce sola.
3. **Asigna** un traductor y un revisor a cada documento.
4. Los **Usuarios** revisan la traducción en el **editor**: confirman, corrigen o rechazan cada segmento.
5. El Administrador sigue el avance, marca las **entregas** y **descarga** el documento traducido.

## Páginas del manual

| Página | Para quién | Contenido |
|---|---|---|
| [Acceso y cuenta](acceso.md) | Todos | Iniciar sesión, idioma, contraseña |
| [Administrador](administrador.md) | Administrador | Usuarios, memorias, glosarios, perfiles, proyectos, documentos, entregas |
| [Usuario](usuario.md) | Usuario | Encontrar tus documentos, revisarlos y terminar |
| [El editor](editor.md) | Todos | La pantalla de revisión, paso a paso |
| [Formatos y ejemplos](formatos.md) | Todos | Qué ficheros admite y cómo trata cada uno, con ficheros de prueba |

## Vocabulario

| Término | Qué es |
|---|---|
| Espacio de trabajo | El ámbito de tu organización. Todo lo que ves pertenece a tu espacio |
| Proyecto | Un grupo de documentos que comparten perfil |
| Documento | Un fichero subido para traducir |
| Segmento | Cada frase o unidad del documento. Es lo que se revisa |
| Memoria | Traducciones anteriores que se reutilizan (fichero TMX) |
| Glosario | Lista de términos con su traducción obligada |
| Perfil | Ajustes de traducción reutilizables: formalidad, instrucciones, memorias, glosarios y preajuste |
| Preajuste de DAAIT | El nivel de calidad del motor de traducción: `basic`, `medium` o `advanced` |
| AT | Traducción automática. Marca los segmentos que tradujo la plataforma |
| MTQE | Nota de calidad estimada de cada segmento, de 0 a 1 |

## Idioma de la interfaz

La interfaz está en español y en inglés; cada persona elige el suyo en [Cuenta](acceso.md#cuenta). En esta versión
quedan pantallas sin traducir que salen en inglés aunque elijas español: la mayor parte del editor, el detalle de una
memoria o de un glosario y la ventana de editar un usuario. El manual nombra cada botón tal como aparece en pantalla.
