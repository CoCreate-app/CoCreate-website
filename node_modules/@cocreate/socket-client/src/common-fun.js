(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function() {
        	return factory(window)
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(null);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(window);
  }
}(typeof self !== 'undefined' ? self : this, function (wnd) {
  function getCommonParams() 
  {
    let config = {};
    if (wnd && wnd.config) {
      config = wnd.config
    }
    
    return {
      "apiKey":           config.apiKey,
      "organization_id":  config.organization_Id,
    }
  }
  
  function getCommonParamsExtend(info) 
  {
    let config = {};
    if (wnd && wnd.config) config = wnd.config
    
    return {
      "apiKey":           info.apiKey || config.apiKey,
      "organization_id":  info.organization_id || config.organization_Id,
    }
  }
  
  function generateSocketClient (namespace, room) 
  {
    let config = {};
    if (wnd && wnd.config) config = wnd.config
    
    let ns = namespace || config.organization_Id
    let rr = room || '';
    if (rr) {
      return `${ns}/${rr}`
    } else {
      return ns;
    }
  }
  
  function GenerateUUID(length = 36) {
    let d = new Date().getTime();
    let d2 = 0;
    let pattern = "uxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  
    if (length <= pattern.length) {
      pattern = pattern.substr(0, length);
    } else {
      let add_len = length - pattern.length;
      let sub_pattern = "-xxxyyxxx";
  
      let group_n = Math.floor(add_len / sub_pattern.length);
  
      for (let i = 0; i < group_n; i++) {
        pattern += sub_pattern;
      }
  
      group_n = add_len - group_n * sub_pattern.length;
      pattern += sub_pattern.substr(0, group_n);
    }
  
    let uuid = pattern.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16;
      if (d > 0) {
        var r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {
        var r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }
      return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
    });
    return uuid;
  }
  
  return {getCommonParams, getCommonParamsExtend, generateSocketClient, GenerateUUID};
}));
