module.exports = {
    "config": {
        "apiKey": "2061acef-0451-4545-f754-60cf8160",
        "organization_id": "5ff747727005da1c272740ab",
        "host": "general.cocreate.app",
        "url": "wss://general.cocreate.app/ws/5ff747727005da1c272740ab"
    },
    "directories": [
        {
            "entry": "./src",
            "exclude": [
                "demos"
            ],
            "collection": "files",
            "document": {
                "name": "{{name}}",
                "src": "{{source}}",
                "hosts": [
                    "*",
                    "general.cocreate.app"
                ],
                "directory": "/{{directory}}",
                "path": "{{path}}",
                "content-type": "{{content-type}}",
                "public": "true",
                "website_id": "61381ed8829b690010a4f2b2"
            }
        }
    ],
    "sources": [
        {
            "collection": "demos",
            "document": {
                "_id": "619d495ca8b6b4001a9e6127",
                "collaboration-demo": "{{./src/demos/collaboration.html}}"
            }
        },
        {
            "collection": "demos",
            "document": {
                "_id": "639b325f6f44f0f162f0bcbf",
                "demo-code": "{{./src/demos/demo.html}}"
            }
        }
    ]
}