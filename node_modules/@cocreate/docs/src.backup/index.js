const CoCreateCrud = require('@cocreate/crud-client')
const CoCreateSocket = require('@cocreate/socket-client')

const CoCreateExtract = require('./extract')

const fs = require('fs');
const path = require('path');
let config;

let jsConfig = path.resolve(process.cwd(), 'CoCreate.config.js');
let jsonConfig = path.resolve(process.cwd(), 'CoCreate.config.json')
if (fs.existsSync(jsConfig))
	config = require(jsConfig);
else if (fs.existsSync(jsonConfig)) {
	config = require(jsonConfig)
}
else {
	process.exit()
	console.log('config not found.')
}

const { crud, extract, sources, config : socketConfig } = config;

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
		}
	} catch (err) {
		console.log(err);
	}
} 

/**
 * Extract comments and store into db
 */
if (extract) {
	let result = CoCreateExtract(extract.directory, extract.ignores, extract.extensions);
	fs.writeFileSync('result.json', JSON.stringify(result), 'utf8')
	
	result.forEach((docs) => {
		docs.forEach(async(doc) => {
			if (!doc.collection) return;
			await runStore(doc, 'extract')
		})
	})
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
	sources.forEach(async ({path, collection, document_id, key, data}) => {
		if (!path) return;

		let content = fs.readFileSync(path, 'utf8');

		if (content && key && collection) {
			if (!data) data = {};
			let storeData = {
				[key]: content,
				...data
			};
			await runStore({collection, document_id, data: storeData}, 'sources');
		}
	})
}

console.log('end....')

