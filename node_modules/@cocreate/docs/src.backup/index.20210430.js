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

const { crud, extract, sources } = config;
const { CoCreateSocketInit, CoCreateUpdateDocument, CoCreateCreateDocument } = require("./socket_process.js")
/**
 * Socket init 
 */
CoCreateSocketInit(config.config)

/**
 * Extract comments and store into db
 */
if (extract) {
	let result = CoCreateExtract(extract.directory, extract.ignores, extract.extensions);
	fs.writeFileSync('result.json', JSON.stringify(result), 'utf8')
	
	result.forEach((docs) => {
		docs.forEach((doc) => {
			if (!doc.collection) return;
			if (!doc.document_id) {
				CoCreateCreateDocument(doc, config.config);		
			} else {
				CoCreateUpdateDocument(doc, config.config);
			}
		})
	})
}


/**
 * update and create document by config crud
 */

if (crud) {
	crud.forEach(({collection, document_id, data}) => {
		if (!document_id) {
			CoCreateCreateDocument({
				collection,
				data
			}, config.config);
		} else {
			CoCreateUpdateDocument({
				collection,
				document_id,
				data,
				upsert: true
			}, config.config);
			
		}
	})
}

/**
 * Store html files by config sources
 **/
if (sources) {
	sources.forEach(({path, collection, document_id, key, data}) => {
		if (!path) return;
		
		let content = fs.readFileSync(path, 'utf8');

		if (content && key && collection) {
			if (!data) data = {};
			
			let storeData = {
				[key]: content,
				...data
			};
			if (!document_id) {
				CoCreateCreateDocument({
					collection,
					data: storeData,
				}, config.config)
			} else {
				CoCreateUpdateDocument({
					collection,
					document_id,
					data: storeData,
					upsert: true
				}, config.config)
			}
		}
	})
}

setTimeout(function(){
	process.exit()
}, 1000 * 30)


