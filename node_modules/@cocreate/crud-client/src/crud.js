// import {getCommonParams, getCommonParamsExtend, generateSocketClient} from "@cocreate/socket-client/src/common-fun.js"

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["@cocreate/socket-client/src/common-fun.js", "./utils.crud.js"], function(commonFunc, utilsCrud) {
        	return factory(window, commonFunc, utilsCrud)
        });
    } else if (typeof module === 'object' && module.exports) {
      let wnd = {
        config: {},
        File: {}
      }
      const commonFunc = require("@cocreate/socket-client/src/common-fun.js")
      const utils = require("./utils.crud.js")
      module.exports = factory(wnd, commonFunc, utils);
    } else {
        root.returnExports = factory(window, root["@cocreate/socket-client/src/common-fun.js"], root["./utils.crud.js"]);
  }
}(typeof self !== 'undefined' ? self : this, function (wnd, commonFunc, utilsCrud) {
  
  const CoCreateCRUD = {
    socket: null,
    setSocket: function(socket) {
      this.socket = socket;
    },

    readDocumentList(info){
      if( !info ) return false;
      let request_data = commonFunc.getCommonParams();
      if (!info.collection) {
        return false;
      }
      
      request_data = {...request_data, ...info};
      
      this.socket.send('readDocumentList', request_data);
      return true;
    },
    
    createDocument: function(info) {
      if (info === null) {
        return false;
      }
      let commonData = commonFunc.getCommonParamsExtend(info);
      let request_data = {...info, ...commonData};
  
      let data = info.data || {};
      
      if (!data['organization_id']) {
        data['organization_id'] = wnd.config.organization_Id
      }
      if (info['data']) {
        data = {...data, ...info['data']}
      }
      
      //. rebuild data
      request_data['data'] = data;
  
      const room = commonFunc.generateSocketClient(info.namespace, info.room);
      this.socket.send('createDocument', request_data, room);
      return true;
    },
    
    updateDocument: function(info) {
      if (!info || !utilsCrud.checkDocumentId(info['document_id'])) return false;
      
      let commonData = commonFunc.getCommonParamsExtend(info);
      
      let request_data = {...info, ...commonData};
      
      if( typeof info['data'] === 'object' ) {
        request_data['set'] = info['data']
      }
      if( Array.isArray(info['delete_fields']) ) request_data['unset'] = info['delete_fields'];
      
      if(!request_data['set'] && !request_data['unset']) return false;
      
      if (info.broadcast === false) {
        request_data['broadcast'] = false;
      }
      
      /** socket parameters **/
      if (info['broadcast_sender'] === undefined) {
        request_data['broadcast_sender'] = true;
      }
      
      const room = commonFunc.generateSocketClient(info.namespace, info.room);
      this.socket.send('updateDocument', request_data, room);
      
      return true;
    },
    
    readDocument: function(info) {
      if (info === null) {
        return false;
      }
      
      if (!info || !utilsCrud.checkDocumentId(info['document_id'])) {
        return false;
      }
      
      let commonData = commonFunc.getCommonParamsExtend(info);
      let request_data = {...info, ...commonData};
      console.log("crud.readDocument => ",request_data)
      this.socket.send('readDocument', request_data);
      return true;
    },
    
    
    deleteDocument: function(info) {
      if (!info || !utilsCrud.checkDocumentId(info['document_id'])) {
        return false;
      }
      
      let commonData = commonFunc.getCommonParamsExtend(info);
      let request_data = {...info, ...commonData};
      
      const room = commonFunc.generateSocketClient(info.namespace, info.room);
      this.socket.send('deleteDocument', request_data, room);
      return true;
    },
  
  
   /** export / import db functions **/
    exportCollection: function(info) {
      if (info === null) return;
  
      let request_data = commonFunc.getCommonParamsExtend(info);
      request_data['collection'] = info['collection'];
      request_data['export_type'] = info['export_type'];
  
      request_data['metadata'] = info['metadata']
      this.socket.send('exportDB', request_data);
    },
    
    importCollection: function(info) {
      const {file} = info;
      if (info === null || !(file instanceof wnd.File)) return;
  
      const extension = file.name.split(".").pop();
      
      if (!['json','csv'].some((item) => item === extension)) return;
  
      let request_data = commonFunc.getCommonParamsExtend(info)
      request_data['collection'] = info['collection']
      request_data['import_type'] = extension;
      this.socket.send('importDB', request_data)
      this.socket.sendFile(file);
    },
    
    listen: function(message, fun) {
      this.socket.listen(message, fun);
    },
    
    listenAsync: function(eventname) {
      return this.socket.listenAsync(eventname);
    },
  
  	createSocket: function(host, namespace) {
  		if (namespace) {
  			this.socket.create({
  				namespace: namespace, 
  				room: null,
  				host: host
  			});
  			this.socket.setGlobalScope(namespace);
  		} else {
  			this.socket.create({
  				namespace: null, 
  				room: null,
  				host: host
  			});
  		}
  	},
  	
  	...utilsCrud
  }
  
  return CoCreateCRUD;
}));

