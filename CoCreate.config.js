module.exports = {
  host: {
    $branch: {
      master: "wss://cocreate.app",
      dev: "wss://dev.cocreate.app",
      test: "wss://test.cocreate.app",
    },
  },
  directories: [
    {
      entry: "./src",
      exclude: ["demos"],
      array: "files",
      object: {
        name: "{{name}}",
        src: "{{source}}",
        host: ["*"],
        directory: "/",
        path: "{{path}}",
        pathname: "{{pathname}}",
        "content-type": "{{content-type}}",
        public: "true",
      },
    },
  ],
  sources: [
    {
      array: "demos",
      object: {
        _id: "619d495ca8b6b4001a9e6127",
        "collaboration-demo": "{{./src/demos/collaboration.html}}",
      },
    },
    {
      array: "demos",
      object: {
        _id: "639b325f6f44f0f162f0bcbf",
        "demo-code": "{{./src/demos/demo.html}}",
      },
    },
  ],
};
