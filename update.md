MTQEv1

APIKEY=pangeanic

endpoint=http://vsvoz01.pangeanic.local:8080/service/mtqe/v1/combined-score-with-references

{
"pairs": [
{
"references": [
{
"source": "The cat is on the roof.",
"target": "El gato está sobre el techo."
}
],
"source": "The cat is on the roof.",
"target": "El gato está en el tejado."
}
],
"source_language": "en",
"target_language": "es"
}

MTQE v2
apikey: PAN26
http://vsvoz01.pangeanic.local:8800/mtqe/v2/score-with-references

{
"source": "Please save your work before closing the application.",
"target": "Guarde su trabajo antes de cerrar la aplicación.",
"source_language": "en-us",
"target_language": "es-es",
"ape": false,
"tm": [
{
"source": "",
"target": ""
}
],
"glossary": [
{
"source": "",
"target": ""
}
]
}
