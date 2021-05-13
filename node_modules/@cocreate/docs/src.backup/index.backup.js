const CoCreateExtract = require('./extract')
const fs = require('fs');
const path = require('path');
let config;

let jsConfig = path.resolve(process.cwd(), 'CoCreate.config.js');
let jsonConfig = path.resolve(process.cwd(), 'CoCreate.config.json')
if (fs.existsSync(jsConfig))
	config = require(jsConfig);
else if (fs.existsSync(jsonConfig)) {
	// let content = fs.readFileSync(jsonConfig, 'utf8').toString();
	// console.log(jsonConfig, content);
	config = require(jsonConfig)
	// config = JSON.parse(content);
}
else {
	console.log('config not found.')
}


const { directory, ignores, extensions, socket, sources } = config;
const { CoCreateSocketInit, CoCreateUpdateDocument, CoCreateCreateDocument } = require("./socket_process.js")
/**
 * Socket init 
 */
CoCreateSocketInit(socket)

/**
 * Extract comments
 */
let result = CoCreateExtract(directory, ignores, extensions);
fs.writeFileSync('result.json', JSON.stringify(result), 'utf8')


/**
 * Store data into db
 */
// result.forEach((docs) => {
// 	docs.forEach((doc) => {
// 		if (!doc.document_id) {
// 			CoCreateCreateDocument(doc, socket.config);		
// 		} else {
// 			CoCreateUpdateDocument(doc, socket.config);
// 		}
// 	})
// })

/**
 * update document by config sources
 */



sources.forEach(({ path, collection, document_id, name, category, ...rest }) => {
	if (!path) return;
	// let content = fs.readFileSync(path, 'utf8');
	// console.log(content)
	process.exit()
	if (content) {
		CoCreateUpdateDocument({
			collection,
			document_id,
			data: {
				[name]: content,
				category,
				...rest
			},
			upsert: true
		}, socket.config);
	}
})

