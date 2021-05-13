const CoCreateCrud = require('@cocreate/crud-client')
const CoCreateSocket = require('@cocreate/socket-client')
const mime = require('mime-types')

const fs = require('fs');
const path = require('path');
let config;

let jsConfig = path.resolve(process.cwd(), 'CoCreate.config.js');
// let jsonConfig = path.resolve(process.cwd(), 'CoCreate.config.json')
if (fs.existsSync(jsConfig))
	config = require(jsConfig);
// else if (fs.existsSync(jsonConfig)) {
// 	config = require(jsonConfig)
// }
else {
	process.exit()
	console.log('config not found.')
}

const { crud, sources, config : socketConfig } = config;

/** init cocreatecrud and socket **/
let socket = new CoCreateSocket("ws");
CoCreateCrud.setSocket(socket);
socket.create({
	namespace: socketConfig.organization_Id,
	room: null,
	host: socketConfig.host
})

const commonParam = {
	apiKey : socketConfig.apiKey,
	organization_id : socketConfig.organization_Id,
	broadcast: false
}

async function runStore (info, type) {
	try {
		let status = false;
		const event = "docEvent" + Date.now()
		if (!info.document_id) {
			status = CoCreateCrud.createDocument({
				...commonParam,
				...info,
				event
			})
		} else {
			status = CoCreateCrud.updateDocument({
				...commonParam,
				...info,
				upsert: true,
				event
			})
		}
		if (status) {
			let response = await CoCreateCrud.listenAsync(event)
			console.log('type ------------------------- ', type)
			console.log(response)
			return response;
		}
	} catch (err) {
		console.log(err);
		return null;
	}
} 

/**
 * update and create document by config crud
 */

if (crud) {
	crud.forEach(async (info) => {
		await runStore(info, 'crud')
	})
}

/**
 * Store html files by config sources
 **/
if (sources) {
	let new_sources_list = [];

	async function runSources() {
		for (let i = 0; i < sources.length; i++) {
			const { entry, collection, document_id, key, data } = sources[i];
			
			let new_source = {...sources[i]};
			let response = {};
			if (entry) {
				
				try {
					let read_type = 'utf8'
					let mime_type = mime.lookup(entry) || 'text/html';
					if (/^(image|audio|video)\/[-+.\w]+/.test(mime_type)) {
						read_type = 'base64'
					}
					
					let binary = fs.readFileSync(entry);
					
					let content = new Buffer(binary).toString(read_type);

					if (content && key && collection) {
						if (!data) data = {};
						let storeData = {
							[key]: content,
							...data
						};
						
						response = await runStore({collection, document_id, data: storeData}, 'sources');
						
					}
				} catch (err) {
					console.log(err)
				}
				if (response.document_id) {
					new_source.document_id = response.document_id
				}
			}
			new_sources_list.push(new_source)
		}
		return new_sources_list

	}
	
	runSources().then((data) => {
		
		console.log(data)
		let new_config = {
			config: socketConfig,
			sources: new_sources_list,
			crud: crud,
		}
		
		let write_str = JSON.stringify(new_config, null, 4)
		write_str = "module.exports = " + write_str;

		fs.writeFileSync(jsConfig, write_str);
		// fs.writeFileSync(jsonConfig, write_str);

	})
}

console.log('end....')

setTimeout(function(){
	process.exit()
}, 1000 * 30)
