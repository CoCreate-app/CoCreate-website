const CoCreateSocket = require('./CoCreate-socket')

module.exports.CoCreateSocketInit = function (config) {
	CoCreateSocket.create({
		namespace: config.organization_Id,
		room: null,
		host: config.host
	})
	CoCreateSocket.setGlobalScope(config.organization_Id);
}

module.exports.CoCreateUpdateDocument = function (info, config) {
	if (info === null) return;
	
	let commonParams = {
      "apiKey":           config.apiKey,
      "securityKey":      config.securityKey,
      "organization_id":  config.organization_Id,
	}
	
	let request_data = {...commonParams};
	
	if (!info.collection || !info.document_id ) return;
	
	if (!info.data.organization_id) {
		info.data.organization_id = config.organization_Id;
	}

	request_data['set'] = info.data;
	request_data['collection'] = info.collection
	request_data['document_id'] = info.document_id
	request_data['metadata'] = info['metadata']
	request_data['upsert'] = true;
	request_data['broadcast'] = false;

	CoCreateSocket.send('updateDocument', request_data, '');	
}

module.exports.CoCreateCreateDocument = function (info, config) {
	if (info === null) return;
	
	let commonParams = {
      "apiKey":           config.apiKey,
      "securityKey":      config.securityKey,
      "organization_id":  config.organization_Id,
	}
	
	if (!info.data.organization_id) {
		info.data.organization_id = config.organization_Id;
	}
	let request_data = {...info, ...commonParams};

	CoCreateSocket.send('createDocument', request_data, '')
}

CoCreateSocket.listen('updateDocument', function(data) {
	//. process after receive update document result
	console.log('updatedDocument', data)
})

CoCreateSocket.listen('createDocument', function(data) {
	//. createDocument result
	console.log('-----------------------------------------')
	console.log('createDocument', data)
})

