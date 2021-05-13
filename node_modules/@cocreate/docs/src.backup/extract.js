const extract = require('extract-comments');
const fs = require('fs');
const path = require("path")
const glob = require('glob');
const parseHtmlComments = require('parse-html-comments')

class ExtractComment {
	constructor() {

	}

	run(filePath, collection, name) {
		let content = fs.readFileSync(filePath, 'utf8');
		let extension = path.extname(filePath)
		
		let comments = [];
		let docItems = [];

		if (extension == '.html') {
			comments = this.extractHtml(content)
		} else {
			comments = extract(content)
		}
		
		comments.forEach(({value}) => {
			let ret_value = this.extractValue(value)
			if (ret_value) {
				docItems.push({
					collection,
					data: {
						[name]:ret_value,
						extension,
						file_path: filePath
					},
					metaData: filePath
				})
			}
		})
		return docItems;
	}

	extractValue(valueStr) {
		var regResult = /@value_start(?<value>.*?)@value_end/gs.exec(valueStr);
		if (regResult) {
			return regResult.groups.value.trim()
		} else {
			return null
		}
	}
	
	extractHtml(content) {
		let htmlComments = parseHtmlComments(content)
		let result_comment = [];

		htmlComments.matches.forEach(({groups}) => {
			let comment_value = groups.commentOnly;
			comment_value = comment_value.replace(/<!--|-->/gs, '');

			result_comment.push({
				value: comment_value
			})
		})
		return result_comment;
	}
}

const extractInstance = new ExtractComment()

function CoCreateExtract (directory, ignoreFolders, extensions ) {
	let extensionsStr = "*";
	let ignoreFolderStr = "";

	if (extensions && extensions.length > 0) {
		extensionsStr = extensions.join(',');
	}
	
	if (ignoreFolders && ignoreFolders.length > 0) {
		ignoreFolderStr = ignoreFolders.join('|');
	}

	let result = [];
	
	if (!directory) {
		directory = ".";
	}
	
	const files = glob.sync(directory + `/**/*.{${extensionsStr}}`, {});
	
	files.forEach((file) => {
		var regex = new RegExp(ignoreFolderStr, 'g');
		if (!regex.test(file)) {
			const docData = extractInstance.run(file, 'docs', 'description');
			if (docData.length > 0) {
				const fileName = path.basename(file);
				result.push(docData)
			}
		}
	})
	
	return result;
}



module.exports = CoCreateExtract

