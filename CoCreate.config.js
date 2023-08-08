module.exports = {
    "organization_id": "5ff747727005da1c272740ab",
    "key": "2061acef-0451-4545-f754-60cf8161",
    "host": "cocreate.app",
    "directories": [
        {
            "entry": "./src",
            "exclude": [
                "demos"
            ],
            "array": "files",
            "object": {
                "name": "{{name}}",
                "src": "{{source}}",
                "host": [
                    "*",
                    "general.cocreate.app"
                ],
                "directory": "/{{directory}}",
                "path": "{{path}}",
                "content-type": "{{content-type}}",
                "public": "true",
                "website_id": "644d4c4f8036fb9d1d1fd69d"
            }
        }
    ],
    "sources": [
        {
            "array": "demos",
            "object": {
                "_id": "619d495ca8b6b4001a9e6127",
                "collaboration-demo": "{{./src/demos/collaboration.html}}"
            }
        },
        {
            "array": "demos",
            "object": {
                "_id": "639b325f6f44f0f162f0bcbf",
                "demo-code": "{{./src/demos/demo.html}}"
            }
        }
    ]
};