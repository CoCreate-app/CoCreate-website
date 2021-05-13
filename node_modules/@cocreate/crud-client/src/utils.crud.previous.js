function 	__mergeObject(target, source) 
{
	target = target || {};
	for (let key of Object.keys(source)) {
		if (source[key] instanceof Object) {
			Object.assign(source[key], __mergeObject(target[key], source[key]))
		}
	}
	
	Object.assign(target || {}, source)
	return target
}

function __createObject(data, path) 
{
	if (!path) return data;
	
	let keys = path.split('.')
	let newObject = data;

	for (var  i = keys.length - 1; i >= 0; i--) {
		newObject = {[keys[i]]: newObject}				
	}
	return newObject;
}

function __createArray(key, data)
{
  try {
    let item = /([\w\W]+)\[(\d+)\]/gm.exec(key)
    if (item && item.length == 3) {
      let arrayKey = item[1];
      let index = parseInt(item[2]);
      
      if (!data[arrayKey] || !Array.isArray(data[arrayKey])) {
        data[arrayKey] = [];
      } 
      data[arrayKey][index] = data[key];
      delete data[key];
      key = arrayKey;
    }
  } catch {
    console.log('create array error');
  }
  return key;
}

function isObject(item) {
  return (!!item) && (item.constructor === Object);
}
function isArray(item) {
  return (!!item) && (item.constructor === Array);
}

function decodeObject(data) {
  let keys = Object.keys(data)
  let objectData = {};
  
  keys.forEach((k) => {
    k = __createArray(k, data);
    if (k.split('.').length > 1) {
      let newData = __createObject(data[k], k);
      delete data[k];
      
      objectData = __mergeObject(objectData, newData);
    } else {
      objectData[k] = data[k];
    }
  })
  return objectData;
}

function encodeObject(data) {
  let keys = Object.keys(data);
  let newData = {};
  keys.forEach((k) => {
    let data_value = data[k];
    if (isObject(data[k])) {
      let new_obj = encodeObject(data[k]);
      
      let newKeys = Object.keys(new_obj);
      newKeys.forEach((newKey) => {
        let value = new_obj[newKey];
        newKey = k + "." + newKey;
        newData[newKey] = value;
      })
      
    } else if (isArray(data_value)){
      data_value.forEach((v, index) => {
        newData[`${k}[${index}]`] = v;
      })
    } else {
      newData[k] = data[k];
    }
  })
  return newData;
}

function getAttr(el) {
  if (!el) return

  let collection = el.getAttribute('data-collection')
  let document_id = el.getAttribute('data-document_id')
  let name = el.getAttribute('name')
  return { collection, document_id, name }
}

function getFlagAttr(el) {
  if (!el) return {}
  let is_realtime = isRealtimeAttr(el);
  let is_save = isSaveAttr(el);
  let is_read = isReadAttr(el);
  let is_update = isUpdateAttr(el);
  return { is_realtime, is_save, is_read, is_update }
}

const isReadAttr = (el) => ( __isValueOfAttr(el, 'data-read_value'));
const isSaveAttr = (el) => ( __isValueOfAttr(el, 'data-save_value'));
const isUpdateAttr = (el) => ( __isValueOfAttr(el, 'data-update_value'));
// const isRealtimeAttr = (el) => ( __isValueOfAttr(el, 'data-realtime'));
const isRealtimeAttr = (el) => {
  if (!el) return false
  let flag = el.getAttribute('data-realtime') == "false" ? false : true;
  return flag
};

function __isValueOfAttr(el, attr) {
  if (!el) return false;
  let flag = el.getAttribute(attr) === "false" ? false : true;
  return flag
}

function checkValue(value) {
  if (!value) return false;
  if (/{{\s*([\w\W]+)\s*}}/g.test(value)) {
    return false;
  }

  return true;
}

function isJsonString(str_data) {
  try {
    let json_data = JSON.parse(str_data);
    if (typeof json_data === "object" && json_data != null) {
      return true;
    }
    else {
      return false;
    }
  }
  catch (e) {
    return false;
  }
}

function isCRDT(input) {
  const { collection, document_id, name } = getAttr(input)
  
  if (isJsonString(collection)) return false;
  if (isJsonString(name)) return false;

  if ((input.tagName === "INPUT" && ["text", "email", "tel", "url"].includes(input.type)) || input.tagName === "TEXTAREA") {
    
    if (!name) return false;
    if (!isRealtimeAttr(input)) return false;
    if (input.getAttribute("data-unique") === "true") return false;
    if (input.type === 'password') return false;
    if (!isReadAttr(input)) return false;
    return true;
    
  }
  return false;
}


export default {
  decodeObject,
  encodeObject,
  getAttr,
  getFlagAttr,
  isRealtimeAttr,
  isReadAttr,
  isSaveAttr,
  isUpdateAttr,
  checkValue,
  isCRDT
}
