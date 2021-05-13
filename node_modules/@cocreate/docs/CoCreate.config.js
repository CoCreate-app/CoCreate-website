module.exports = {
    config: {
        apiKey: "c2b08663-06e3-440c-ef6f-13978b42883a",
        securityKey: "f26baf68-e3a9-45fc-effe-502e47116265",
        organization_Id: "5de0387b12e200ea63204d6c",
        host: "server.cocreate.app:8088"
    },
 
    sources: [{
            path: "./docs/index.html",
            collection: "files",
            document_id: "601460b19f64ba1680b8669b",
            key: "html",
            data:{
                name: "Document Generator Docs",
            }
        },
    ],
   
    crud: [{
            collection: "routes",
            document_id: "601460b19f64ba1680b86696",
            data:{
                collection: "files",
                document_id: "601460b19f64ba1680b8669b",
                name: "html",
                domains: ["cocreate.app", "server.cocreate.app", "ws.cocreate.app"],
                route: "/docs/document-generator",
            }
        }
    ],

    extract: {
        directory: "./test_files/",
        extensions: [
            "js",
            "css",
            "html"
        ],
        // "media": [
        //     "jpg", "png", ...
        // ],
        ignores: [
            "node_modules",
            "vendor",
            "bower_components",
            "archive"
        ],
    }
}
