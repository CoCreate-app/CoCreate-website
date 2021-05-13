
var g_moduleSelectors = [];

// CoCreateLogic.init();

function registerModuleSelector(selector) {
  if (g_moduleSelectors.indexOf(selector) === -1) {
    g_moduleSelectors.push(selector);
  }
}


// rename to initDeleteDocument
function initDeleteTags() {
  var dTags = document.querySelectorAll('.delete-document');
  
  for (var i=0; i<dTags.length; i++) {
    var dTag = dTags[i];
    
    dTag.addEventListener('click', function(e) {
      e.preventDefault();
      
      var collection = this.getAttribute('data-collection') || 'module_activity';
      var documentId;
      
      documentId = this.getAttribute('data-document_id');

      if (document) {
        CoCreate.crud.deleteDocument({
          'collection': collection, 
          'document_id': documentId,
          'metadata': '' 
        });
      }
    })
  }
}

// this is for updating float label to active after data is inserted
function updateFloatLabel(node, value) {}

const CoCreate = {
  modules: {},
  socketInitFuncs: [],
  host: 'server.cocreate.app',
  
  init: function(host, namespace) {
    if (host) {
      this.host = host;
    }
    
    this.createGeneralSocket(host, namespace);
    this.initSocketListener();
    
    this.createUserSocket(host);
  },
  
  initSocketListener: function() {
    const self = this;
    
    CoCreateSocket.listen('connect', function (data, room) {
      
      if (room == CoCreateSocket.getGlobalScope()) {
        self.socketInitFuncs.forEach((func) => {
          func.initFunc.call(func.instance);
        })
        initDeleteTags();
        self.fetchModules();
      }
    })
    
    CoCreateSocket.listen('readDocument', function(data){
      const metadata = data.metadata;
      if (metadata && metadata.type == 'crdt') {
        self.initRenderCrdtData(data);
      } else {
        self.renderModules(data)
      }
    })
    
    CoCreateSocket.listen('updateDocument', function(data) {
      self.renderModules(data)
    })
    
    CoCreateSocket.listen('deletedDocument', function(data) {
      console.log(data);
    })
    
    CoCreateSocket.listen('sendMessage', function(data) {
      console.log(data);
    })
    
    this.listenMessage('downloadFileInfo', function(data) {
      CoCreateSocket.saveFileName = data.file_name;
    })
    
  },
  
  createUserSocket: function(host) {
    var user_id = localStorage.getItem('user_id');
    if (user_id) {
      CoCreateSocket.create({
        namespace: 'users',
        room: user_id,
        host: host
      })
    }
  },
  
  createGeneralSocket: function(host, namespace) {
    if (namespace) {
    	CoCreateSocket.create({
    	  namespace: namespace, 
    	  room: null,
    	  host: host
    	});
    	CoCreateSocket.setGlobalScope(namespace);
    } else {
    	CoCreateSocket.create({
    	  namespace: null, 
    	  room: null,
    	  host: host
    	});
    }
  },
  
  registerSocketInit: function(initFunc, instance) {
    this.socketInitFuncs.push({
      initFunc,
      instance : instance || window
    });
  },
  
  registerModule: function(name, instance, initFunc, fetchFunc, renderFunc) {
    
    if (this.modules[name]) {
      return;
    }
    
    this.modules[name] = {
      instance, 
      fetchFunc,
      renderFunc,
      initFunc
    }
  },
  
  /** Module Processing Functions **/
  initModules: function(container) {
    let keys = Object.keys(this.modules);
    
    for (var i = 0; i < keys.length; i++) {
      const module = this.modules[keys[i]];
      if (module && module.initFunc) {
        module.initFunc.call(module['instance'], container);
      }
    }
  },
  
  runInitModule: function (key, container) {
    if (!this.modules[key]) {
      return;
    }
    const module = this.modules[key];
    module.initFunc.call(module['instance'], container);
  },
  
  fetchModules: function(container) {
    var fetchDocuments = []; 
    
    let keys = Object.keys(this.modules);
    for (var i = 0; i < keys.length; i++) {
      const module = this.modules[keys[i]]
      if (module && module.fetchFunc) {
        fetchDocuments = fetchDocuments.concat(module.fetchFunc.call(module['instance'], container));
      }
    }
  
    /** remove duplication information **/
    let fetchInfo = [];
    let _this = this;
    fetchDocuments.forEach((item) => {
      if (!fetchInfo.some((info) => (info['collection'] == item['collection'] && info['document_id'] === item['document_id']))) {
        _this.readDocument({
          'collection': item['collection'], 
          'document_id': item['document_id']
        });
        fetchInfo.push(item);
      }
    })
  },
  
  renderModules: function(data, container) {
    let keys = Object.keys(this.modules);
    
    for (var i = 0; i < keys.length; i++) {
      const key = keys[i];
      const module = this.modules[keys[i]];
      if (module && module.renderFunc) {
        module.renderFunc.call(module['instance'], data, container)
      }
    }
  },
  
  
  /** Get common paraeter  **/
  getCommonParams: function() {
    return {
      "apiKey":           config.apiKey,
      "securityKey":      config.securityKey,
      "organization_id":  config.organization_Id,
    }
  },
  
 
  /*   
    readDcoumentList {
      collection: "modules",
      element: "xxxx",
      metadata: "",
      operator: {
        fetch: {
          name: 'xxxx',
          value: 'xxxxx'
        },
        filters: [{
          name: 'field1',
          operator: "contain | range | eq | ne | lt | lte | gt | gte | in | nin",
          value: [v1, v2, ...]
        }, {
          name: "_id",
          opreator: "in",
          value: ["id1"]
        }, {
          ....
        }],
        orders: [{
          name: 'field-x',
          type: 1 | -1
        }],
        search: {
          type: 'or | and',
          value: [value1, value2]
        },
        
        startIndex: 0 (integer),
        count: 0 (integer)
      },
      
      is_collection: true | false,
      //. case fetch document case
      created_ids : [id1, id2, ...],
      
      
      -------- additional response data -----------
      data: [] // array
    }
  */
  
  readDocumentList(info){
    if( !info ) return;
    let request_data = this.getCommonParams();
    
    if (!info.collection || !info.operator) {
      return;
    }
    
    request_data = {...request_data, ...info};
    
    console.log(request_data)
    CoCreateSocket.send('readDocumentList', request_data);
  },
  
  
  /*
  createDocument({
    namespace:'',
    room:'',
    broadcast: true/false, (default=ture)
    broadcast_sender: true/false, (default=true) 
    
    collection: "test123",
    data:{
    	name1:“hello”,
    	name2:  “hello1”
    },
    element: “xxxx”,
    metaData: "xxxx"
  }),
  */
  createDocument: function(info) {
    if (info === null) {
      return;
    }
    let request_data = this.getCommonParams()
    request_data['collection'] = info['collection'] || 'module_activities';
    
    let data = info.data || {};
    
    if (!data['organization_id']) {
      data['organization_id'] = config.organization_Id
    }

    request_data['data'] = data;
    if (info['metadata']) {
      request_data['metadata'] = info['metadata']
    }
    
    request_data['element'] = info['element'];
    
    /** socket parameters **/
    // if (info['broadcast'] === undefined) {
    //   request_data['broadcast'] = true;
    // }
    // if (info['broadcast_sender'] === undefined) {
    //   request_data['broadcast_sender'] = true;
    // }
    
    const room = this.generateSocketClient(info.namespace, info.room);
    CoCreateSocket.send('createDocument', request_data, room);
  },
  
  generateSocketClient: function (namespace, room) {
    let ns = namespace || config.organization_Id
    let rr = room || '';
    if (rr) {
      return `${ns}/${rr}`
    } else {
      return ns;
    }
  },
  

  /**
  @value_start
  updateDocument({
    collection: "test123",
    document_id: "document_id",
    data:{
    	example: “some example can be html json etc”,
    	description:  “update documnets if document does not exist otherwise create”
    },
  })
  @value_end
  */
  updateDocument: function(info) {
    if( !info || !info['document_id'] ) return;
    
    let request_data = this.getCommonParams();
    request_data['collection'] = info['collection'] || 'module_activities';
    request_data['document_id'] = info['document_id'];
    
    if( typeof info['data'] === 'object' ) request_data['set'] = info['data'];
    if( Array.isArray(info['delete_fields']) ) request_data['unset'] = info['delete_fields'];
    
    if(!request_data['set'] && !request_data['unset']) return;
    
    request_data['element'] = info['element'];
    request_data['metadata'] = info['metadata'];
    
    if (info.broadcast === false) {
      request_data['broadcast'] = false;
    }
    
    /** socket parameters **/
    // if (info['broadcast'] === undefined) {
    //   request_data['broadcast'] = true;
    // }
    // if (info['broadcast_sender'] === undefined) {
    //   request_data['broadcast_sender'] = true;
    // }
    
    const room = this.generateSocketClient(info.namespace, info.room);
    CoCreateSocket.send('updateDocument', request_data, room);
  },
  
  
  /**
   @value_start
  readDocument({
    collection: "test123",
    document_id: "document_id",
    element: “xxxx”,
    metaData: "xxxx",
    exclude_fields: [] 
  })
  @value_end
  */
  readDocument: function(info) {
    if (info === null) {
      return;
    }
    if (!info['document_id'] || !info) {
      return;
    }
    
    let request_data = this.getCommonParams();
    request_data['collection'] = info['collection'];
    request_data['document_id'] = info['document_id'];
    if (info['exclude_fields']) {
      request_data['exclude_fields'] = info['exclude_fields'];
    }
    
    if (info['element']) {
      request_data['element'] = info['element'];
    }
    
    request_data['metadata'] = info['metadata']
    CoCreateSocket.send('readDocument', request_data);
  },
  
  
  /**
   * @value_start
  deleteDocument({
    namespace: '',
    room: '',
    broadcast: true/false,
    broadcast_sender: true/false,
    
    collection: "module",
    document_id: "",
    element: “xxxx”,
    metadata: "xxxx"
  })
  @value_end
  */
  deleteDocument: function(info) {
    if (!info['document_id'] || !info) {
      return;
    }
    
    let request_data = this.getCommonParams();
    request_data['collection'] = info['collection'];
    request_data['document_id'] = info['document_id'];
    
    if (info['element']) {
      request_data['element'] = info['element'];
    }
    
    request_data['metadata'] = info['metadata']
    
    /** socket parameters **/
    // if (info['broadcast'] === undefined) {
    //   request_data['broadcast'] = true;
    // }
    // if (info['broadcast_sender'] === undefined) {
    //   request_data['broadcast_sender'] = true;
    // }
    
    const room = this.generateSocketClient(info.namespace, info.room);
    CoCreateSocket.send('deleteDocument', request_data, room);
  },


  /*
    Private function to get id of ydoc
  */
  __getYDocId: function(collection, document_id, name) {
    if (!collection || !document_id || !name) {
      return null;
    }
    return CoCreateYSocket.generateID(config.organization_Id, collection, document_id, name);

  },

  /*. init data function
  replaceDataCrdt({
    collection: "module",
    document_id: "",
    name: "",
    value: "",
    update_crud: true | false,
    element: dom_object,
    metadata: "xxxx"
  })
  */
  
  replaceDataCrdt: function(info){
    if (!info) return;

    const id = this.__getYDocId(info.collection, info.document_id, info.name)
    if (!id) return;
    if (CoCreateCrdt.getType(id)) {
      let oldData = CoCreateCrdt.getType(id).toString();
      CoCreatecrdt.deleteText(id, 0, Math.max(oldData.length, info.value.length));
      CoCreatecrdt.insertText(id, 0, info.value);
    } else {
      this.updateDocument({
        collection: info.collection,
        document_id: info.document_id,
        data: {[info.name]: info.value},
        element: info.element,
        metadata:info.metadata,
        namespace: info.namespace,
        room: info.room,
        broadcast: info.broadcast,
      })
    }
    
    if (info.update_crud !== false) {
    }
  },
  
  /*
  inintDataCrdt({
    collection: "module",
    document_id: "",
    name: "",
    element: dom_object,
    metadata: "xxxx"
  })
  */
  initDataCrdt: function(info) {
    try {
      this.validateKeysJson(info, ['collection', 'document_id', 'name']);
      
      const id = this.__getYDocId(info['collection'], info['document_id'], info['name'])

      if (!id) return;
      const status = CoCreateCrdt.createDoc(id, info.element)
    console.log("InitCrdt")
    } catch(e) {
      console.log('Invalid param', e);
    }
  },
  

  validateKeysJson: function(json,rules){
    let keys_json = Object.keys(json);
    keys_json.forEach(key=>{
      const index = rules.indexOf(key);
      if(index != -1)
        rules.splice(index, 1);
    });
    if( rules.length )
      throw "Requires the following "+ rules.toString();
  },
  
  
  /*
  CoCreate.crdt.insertText({
  	collection: 'module_activities',
  	document_id: '5e4802ce3ed96d38e71fc7e5',
  	name: 'name',
  	value: 'T',
  	position:'8
  	attributes: {bold: true}
  })
  */
  insertDataCrdt: function (info) {
      try {
        this.validateKeysJson(info,['collection','document_id','name','value','position']);
        let id = this.__getYDocId(info['collection'], info['document_id'], info['name'])
        if (id) {
          CoCreatecrdt.insertText(id, info['position'], info['value'], info['attributes']);
        }
      }
      catch (e) {
         console.error(e); 
      }
  }, //end inserData
  
  
  /*
  CoCreate.crdt.deleteText({
  	collection: 'module_activities',
  	document_id: '5e4802ce3ed96d38e71fc7e5',
  	name: 'name',
  	position:8,
  	length:2,
  })
  */
  deleteDataCrdt: function(info) {
    try{
      this.validateKeysJson(info,['collection','document_id','name', 'position','length']);
      let id = this.__getYDocId(info['collection'], info['document_id'], info['name'])
      if (id) {
        CoCreatecrdt.deleteText(id, info['position'], info['length']);
      }
    }
    catch (e) {
       console.error(e); 
    }
  },
  
  
  /*
  CoCreate.crdt.getText({
  	collection: 'module_activities',
  	document_id: '5e4802ce3ed96d38e71fc7e5',
  	name: 'name'
  })
  */
  getDataCrdt: function(info) {
    try{
      this.validateKeysJson(info,['collection','document_id','name']);
      let id = this.__getYDocId(info['collection'], info['document_id'], info['name'])
      if (id) {
        return CoCreateCrdt.getWholeString(id);
      } else {
        return "";
      }
    }
    catch (e) {
       console.error(e); 
    }
  },

  
  /*  
  CoCreate.sendPosition({
      collection:"module_activities",
      document_id:"5e4802ce3ed96d38e71fc7e5",
      name:"name",
      startPosition: 2,
      endPositon: 2,
  })
  */
 sendPosition: function(json) {
   CoCreateCrdt.sendPosition(json);
 },


  /* 
  CoCreate.getPosition(function(data))
  CoCreate.getPosition(function(data){console.log(" EScuchando ahora  ",data)})
  */
 getPosition: function(callback){
   if(typeof miFuncion === 'function')
    CoCreateCrdt.changeListenAwereness(callback);
   else
    console.error('Callback should be a function')
 },
 
  
 /*
 CoCreate.sendMessage({
    namespace: '',
    room: '',
    broadcast: true/false,
    broadcast_sender: true/false
    
    rooms: [r1, r2],
    emit: {
      message': 'nice game',
      data': 'let's play a game ....'
    }
  })
 */
 sendMessage: function(data) {
    let request_data = this.getCommonParams();
    
    if (!data || !data.emit) {
      return;     
    }
    request_data = {...request_data, ...data}
    
    const room = this.generateSocketClient(data.namespace, data.room);
    
    CoCreateSocket.send('sendMessage', request_data, room)
 },
 
 listenMessage: function(message, fun) {
   CoCreateSocket.listen(message, fun);
 },
 
 createSocket: function(config) {
   CoCreateSocket.create(config);
 },
 
 /* 
 config: 
 {
    namespace, 
    room
 }
 */
 destroySocket: function(config) {
   const {namespace, room} = config;
   const key = CoCreateSocket.getKey(namespace, room);
   let socket = CoCreateSocket.sockets.get(key);
   
   if (!socket) {
     return
   }
   CoCreateSocket.destroy(socket, key);
 },
 
 initRenderCrdtData: function(data) {
    const metadata = data.metadata
    const id = metadata.id;
    const selected_doc = CoCreateCrdt.docs[id];
		if (!selected_doc) return;
		
		const info = CoCreateYSocket.parseTypeName(id);
		
		console.log(selected_doc.socket.awareness.getStates().size);
		
		console.log(CoCreateCrdt.getWholeString(id))
 },
 
 
 /** export / import db functions **/
 
   /*
  readDocument({
    collection: "test123",
    element: “xxxx”,
    metaData: "xxxx",
  }),
  */
  exportCollection: function(info) {
    if (info === null) {
      return;
    }

    let request_data = this.getCommonParams();
    request_data['collection'] = info['collection'];
    request_data['export_type'] = info['export_type'];

    request_data['metadata'] = info['metadata']
    CoCreateSocket.send('exportDB', request_data);
  },
  
  /*
  readDocument({
    collection: "test123",
    file: file
  }),
  */
  importCollection: function(info) {
    const {file} = info;
    if (info === null || !(file instanceof File)) {
      return;
    }

    const extension = file.name.split(".").pop();
    
    if (!['json','csv'].some((item) => item === extension)) {
      return;
    }
    
    let request_data = this.getCommonParams()
    request_data['collection'] = info['collection']
    request_data['import_type'] = extension;
    CoCreateSocket.send('importDB', request_data)
    CoCreateSocket.sendFile(file);
  }
}


CoCreate.init('server.cocreate.app:8088', config.organization_Id);

