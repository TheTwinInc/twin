
const $ = require('jquery')

import * as log from 'loglevel'

import config from './config'

//import { ns } from './ontologies'

import * as URI from "uri-js";

import * as client from "@inrupt/solid-client"

const N3 = require('n3')

const truncate = require("truncate-utf8-bytes");

import Vue from 'vue'

import store from './store'
import router from './router'
import { hostpart } from 'rdflib/lib/uri';

/*  CANT USE THIS CONFLICT WITH PDF VIEWER
Array.prototype.unique = function () {
    return this.filter(
        function (a) { return !this[a] ? this[a] = true : false; }, {}
    );
}
*/


const u = {};

u.rowsLoaded = function (uri){
    var uri = u.getURI(uri)
    if (uri){
	var totalRows = store.state.nodePaging[uri]
	if (totalRows){
	    return totalRows.totalRows
	}
    }
}

u.isEncoded = function (uri) {
  uri = uri || '';
    try {
	return uri !== decodeURIComponent(uri);
    } catch (e) {
	log.debug(e)
	return false
    }
}

u.unique = function (array){
    if (Array.isArray(array)){
	return array.filter(
            function (a) { return !this[a] ? this[a] = true : false; }, {}
	);
    }
}

u.deNullify = function (array){
    if (Array.isArray(array)){
	return array.filter(e => e != null);
    }
}

u.deEmptyQuotes = function (array){
    if (Array.isArray(array)){
	return array.filter(e => e != "")
    }
}

u.ajaxError = function (URL,
    jqXHR,
    textStatus,
    errorThrown,
    data,
    callback) {
    log.error("ERROR lobe.Ajax", {
        jqXHR: jqXHR,
        textStatus: textStatus,
        errorThrown: errorThrown,
        url: URL,
        data: JSON.stringify(data),
        callback: JSON.stringify(callback)
    });
    alert("Internal error - please request help from graphMetrix admin (or see developer console)." +
        "\nError: " + errorThrown +
        "\nStatus: " + textStatus +
        "\nURL: " + URL);
}


u.ajax = function (URL, callback, Type, dataType, data, cache, Asyn) {
    var Async;
    if (!Type) {
        Type = "POST";
    }
    if (!cache) {
        cache = false;
    }
    if (!dataType) {
        dataType = "json";
    }
    if (typeof (Asyn) === "boolean") {
        Async = Asyn;
    } else {
        Async = true;
    }
    $.ajaxSetup({
        async: Async
    });
    $.ajax({
        type: Type,
        url: URL,
        data: data,
        async: Async,
        cache: cache,
        success: function (Data) {
            callback(Data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            u.ajaxError(URL, jqXHR, textStatus, errorThrown, data, callback);
        },
        dataType: dataType
    });
}

u.isTrinPod = function () {
    var xpower = store.state.xPoweredBy
    if (xpower && xpower.match('TrinPod')) {
        return true
    } else {
        return false
    }
}


/*
u.isTrinityOEM = async function () {
    await store.dispatch('getBrainAndServer')
    log.debug("config.server:" + store.state.server);
    var response = await fetch(store.state.server + "/isTrinityOEM")
    var Final = await response.text()
    if (Final === "true") {
        Final = true
    } else if (Final === "false") {
        Final = false
    }
    store.commit('OEM', Final)
}
*/


/* https://jasonwatmore.com/post/2018/09/10/vuejs-set-get-delete-reactive-nested-object-properties
Example: to set a new property foo.bar.baz = true on a Vuex state object 
you would call setProp(state, ['foo', 'bar', 'baz'], true). 
The function creates any nested properties that don't already exist.
*/

u.setProp = function (obj, props, value) {
    //log.debug('u.setProp',obj,props,value)
    const prop = props.shift()
    if (!obj[prop]) {
        Vue.set(obj, prop, {})
    }
    if (!props.length) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            obj[prop] = { ...obj[prop], ...value }
        } else {
            obj[prop] = value
        }
        return
    }
    u.setProp(obj[prop], props, value)
}

u.statementP = function (statement) {
    if ($.type(statement) === "object") {
        if (statement.subject && statement.predicate && statement.object) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

u.termP = function (term) {
    if ($.type(term) === "object") {
        if (term.termType === "NamedNode") {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

u.getURL = function (string) {
    var result
    if ($.type(string) === "object") {
        if (string.termType === "NamedNode") {
            result = string.value
        } else {
            result = string.uri;
        }
    }
    if (!result && $.type(string) === "string") {
        result = string
    }
    if (result) {
        if (u.checkURL(result)) {
            return string;
        } else if (u.checkIRI(result)) {
            return string.substr(1, string.length - 2);
        } else {
            return null;
        }
    } else {
        return null
    }
}

u.gmxSolidP = function (item) {
    var url = u.getURL(item);
    //if (config.logServerAndBrain) log.debug("config.brain:" + store.state.brain);
    if (url && url.match(store.state.brain + "/ns/")) {
        return true
    } else {
        return false
    }
}

u.removeURIfragment = function (uri) {
    var uri = u.getURI(uri);
    if ($.type(uri) === 'string') {
        var pURI = URI.parse(uri)
        pURI = u.deleteKeys(pURI, 'fragment')
        return URI.serialize(pURI);
    }
}

/*
u.isDataset = function (item) {
    if ($.type(item) === "object") {
        if (!client.isThing(item) && item.quads) {
            return true
        }
    }
}*/

u.uriToNamedNode = function (uri) {
    uri = u.getURI(uri)
    if (uri) {
        return N3.termFromId(u.getURI(uri))
    }
}

u.getBaseURI = function (item) {
    return u.getPodNode(item)
}

/*    var uri = u.getURI(item)
    if (uri) {
        var parse = URI.parse(uri)
        var port = parse.port
        var std = [80, 443]
        if (!port || std.includes(port)) {
            port = ""
        } else {
            port = ":" + port
        }
        return parse.scheme + "://" + parse.host + port
    }
} */

u.getURI = function (string) {
    if ($.type(string) === "array") {
	if (string.length === 0){
	    return
	} else {
            return $.map(string, function (item) {
		return u.getURL(item)
            })
	}
    } else if (u.isTreeNode(string)){
	return string.data.uri
    } else if ($.type(string) === 'object') {
       if (string.termType === "NamedNode") {
            return string.value
       } else if (string.termType === "BlankNode"){
	   return string
       }
    } else {
        if (u.gmxSolidP(string)) { //converts solid call back to node uri
            var base = string.replace(store.state.brain + "/ns/", "")
            var parse = base.split("/")
            if ($.type(parse) === 'array') {
                var NS = parse[0]
                var term = decodeURIComponent(parse[1])
                return ns[NS](term).uri
            }
        } else {
	    if (typeof(string) === 'string'){
		string = string.replace("<","").replace(">","")
	    }
            return u.getURL(string);
        }
    }
}

u.getURIs = function (array) {
    if ($.type(array) === "array") {
        return $.map(array, function (item) {
            return u.getURI(item);
        });
    }
}

u.getSolidHost = function (uri) {
    if (!uri){
	uri = store.state.server //u.getURI(string);
    }
    var uri = u.getURI(uri)
    if (uri) {
        var pURI = URI.parse(uri);
        var port = pURI.port
        var host = pURI.host
        if (host.match('localhost')) {
            return host + ":" + port
        } else {
            return host
        }
    }
}

u.getIRI = function (string) {
    if (u.checkIRI(string)) {
        return string;
    } else if (u.checkURL(string)) {
        if (string.indexOf("?") > -1) {
            string = string.split("?")[0];
        }
        return "<" + string + ">";
    } else {
        return null;
    }
}

u.checkIRI = function (string) {
    if ($.type(string) === "string") {
        if (string.indexOf("<http") == 0 && string.indexOf(">") > -1 && string.indexOf("?") == -1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

u.checkURL = function (string) {
    let url
    try {
	url = new URL(string);
	return true;
    } catch (_) {
	return false;  
    }
}

/*
    
    if ($.type(string) === "string") {
        if (/^(https?|ftp):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(string)) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}
*/

u.deparam = function (querystring) {
    // remove any preceding url and split
    //danger: this function takes time and cannot return synchronous when using window
    if (!querystring) {
        querystring = window.location.href;
    }
    querystring = querystring.substring(querystring.indexOf('?') + 1).split('&');
    var params = {}, pair, d = decodeURIComponent;
    // march and parse
    for (var i = querystring.length - 1; i >= 0; i--) {
        pair = querystring[i].split('=');
        params[d(pair[0])] = d(pair[1] || '');
    }

    return params;
}

u.isMobile = function(){
    var width = store.state.windowWidth;
    if (width < 576) {
	return true
    } else {
	return false
    }
}

u.mobileQuery = function (qObj) {   
    if (!qObj) {
        qObj = u.deparam() // current web browser location 
    }
    if (u.isMobile()){
        var eObj = {};
        eObj.select = qObj.select;
        eObj.location = qObj.location;
        return eObj;
    } else {
        return qObj;
    }
}

u.deleteKeys = function (qObj, keys) {
    //if keys is null, uses all keys in qObj
    if (qObj) {
        var eObj = u.getEObj(qObj)
        if (keys) {
            if ($.type(keys) !== "array") {
                keys = [keys]
            }
        } else {
            keys = Object.keys(eObj)
        }
        $.map(keys, function (key) {
            delete eObj[key]
        })
        return eObj
    }
}

u.removeItem = function (item, array) {
    array = $.grep(array, function (value) {
        return value != item;
    })
    return array
}

u.addQuery = function (key, value, qObj) {
    if (key && value/* && qObj*/) {
        if (!qObj) {
            qObj = u.deparam()
        }
        var eObj = u.getEObj(qObj)
        eObj[key] = value
        return eObj
    }
}

u.checkQuery = function (key, value, qObj) {
    if (!qObj) {
        qObj = u.deparam() //creates the qObj
    }
    var keys = Object.keys(qObj)
    log.debug('query', qObj, key, qObj[key])

    if (qObj[key] === value || !$.inArray(key, keys)) {
        return true;
    } else {
        return false;
    }
}

u.queryFocus = function (key, value, keys, qObj) {
    if (!qObj) {
        qObj = u.deparam() //creates the qObj
    }

    var eObj = u.deleteKeys(qObj, keys)
    eObj = u.addQuery(key, value, eObj)
    return eObj

}

u.getEObj = function (qObj) {
    if (!qObj) {
        qObj = u.deparam()
    }
    return Object.assign({}, qObj)
    //return JSON.parse(JSON.stringify(qObj))
}

u.toggleMode = function (mode, value, qObj) {
    if (mode && value && qObj) {
        var eObj = u.getEObj(qObj)
        if (eObj[mode]) {
            return u.deleteKeys(eObj, mode)
        } else {
            eObj[mode] = value
            return eObj
        }
    }
}

u.select = function (URI, qObj) {
    return u.toggleMode('select', URI, qObj)
}
/*
    log.debug("qObj",URI,qObj)
    if (!qObj){
    qObj = {}
    }
    var eObj = JSON.parse(JSON.stringify(qObj));
    if (eObj.select === URI){
    eObj.select = ""
    } else {
    eObj.select = URI
    }
    return eObj
} */

u.checkEmail = function (email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}




u.getReload = function (qObj) {
    var eObj = JSON.parse(JSON.stringify(qObj))
    var reload = eObj.reload;
    if (reload === "true") {
        reload = "false";
    } else if (reload === "false") {
        reload = "true";
    } else {
        reload = "true";
    }
    eObj.reload = reload;
    return eObj;
}



u.getIntersection = function (array1, array2) {
    if ($.type(array1) === "array" && $.type(array2) === "array") {
        return array1.filter(value => -1 !== array2.indexOf(value));
    } else if ($.type(array1) === "array") {
        return array1;
    } else if ($.type(array2) === "array") {
        return array2;
    }
}

u.getUnion = function (array1, array2) {
    if ($.type(array1) === 'array' && $.type(array2) === 'array') {
        return array1.concat(array2)
    } else if ($.type(array1) === 'array') {
        return array1
    } else if ($.type(array2) === 'array') {
        return array2
    }
}

u.getDifference = function (array1, array2) {
    if (Array.isArray(array1) && Array.isArray(array2)){
	var diff = []
	array1.forEach(it => {
	    if (!array2.includes(it)){
		diff.push(it)
	    }
	})
	array2.forEach(it => {
	    if (!array1.includes(it)){
		diff.push(it)
	    }
	})
	return diff
    }
}

u.dynamicSort = function (property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property].toLowerCase() < b[property].toLowerCase()) ? -1 : (a[property].toLowerCase() > b[property].toLowerCase()) ? 1 : 0;
        return result * sortOrder;
    }
}

u.functionSort = function (func, sortOrder) {
    if (!sortOrder) {
        sortOrder = 1;
    }
    if (sortOrder === "-") {
        sortOrder = -1;
    }
    return function (a, b) {
        var result = (func(a) < func(b)) ? -1 : (func(a) > func(b)) ? 1 : 0;
        return result * sortOrder;
    }
}

u.areObjsEquiv = function (a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}

u.areArraysEqual = function(a1,a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1)==JSON.stringify(a2);
}

const STRICT_EQUALITY_BROKEN = (a,b)=> a===b;
const STRICT_EQUALITY_NO_NAN = (a,b)=> {
    if (typeof a=='number' && typeof b=='number' && ''+a=='NaN' && ''+b=='NaN')
        // isNaN does not do what you think; see +/-Infinity
        return true;
    else
        return a===b;
};
u.deepEquals = function (a,b, areEqual=STRICT_EQUALITY_NO_NAN, setElementsAreEqual=STRICT_EQUALITY_NO_NAN) {
    /* compares objects hierarchically using the provided 
       notion of equality (defaulting to ===);
       supports Arrays, Objects, Maps, ArrayBuffers */
    if (a instanceof Array && b instanceof Array)
        return u.arraysEqual(a,b, areEqual);
    if (a && b && Object.getPrototypeOf(a)===Object.prototype && Object.getPrototypeOf(b)===Object.prototype)
        return u.objectsEqual(a,b, areEqual);
    if (a instanceof Map && b instanceof Map)
        return u.mapsEqual(a,b, areEqual);        
    if (a instanceof Set && b instanceof Set) {
        if (setElementsAreEqual===STRICT_EQUALITY_NO_NAN)
            return u.setsEqual(a,b);
        else
            throw "Error: set equality by hashing not implemented because cannot guarantee custom notion of equality is transitive without programmer intervention."
    }
    if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b)))
        return typedArraysEqual(a,b);
    return areEqual(a,b);  // see note[1] -- IMPORTANT
}

u.arraysEqual = function (a,b, areEqual) {
    if (a.length!=b.length)
        return false;
    for(var i=0; i<a.length; i++)
        if (!u.deepEquals(a[i],b[i], areEqual))
            return false;
    return true;
}
u.objectsEqual = function (a,b, areEqual) {
    var aKeys = Object.getOwnPropertyNames(a);
    var bKeys = Object.getOwnPropertyNames(b);
    if (aKeys.length!=bKeys.length)
        return false;
    aKeys.sort();
    bKeys.sort();
    for(var i=0; i<aKeys.length; i++)
        if (!areEqual(aKeys[i],bKeys[i])) // keys must be strings
            return false;
    return u.deepEquals(aKeys.map(k=>a[k]), aKeys.map(k=>b[k]), areEqual);
}
u.mapsEqual = function (a,b, areEqual) { // assumes Map's keys use the '===' notion of equality, which is also the assumption of .has and .get methods in the spec; however, Map's values use our notion of the areEqual parameter
    if (a.size!=b.size)
        return false;
    return [...a.keys()].every(k=> 
        b.has(k) && u.deepEquals(a.get(k), b.get(k), areEqual)
    );
}
u.setsEqual = function (a,b) {
    // see discussion in below rest of StackOverflow answer
    return a.size==b.size && [...a.keys()].every(k=> 
        b.has(k)
    );
}
u.typedArraysEqual = function(a,b) {
    // we use the obvious notion of equality for binary data
    a = new Uint8Array(a);
    b = new Uint8Array(b);
    if (a.length != b.length)
        return false;
    for(var i=0; i<a.length; i++)
        if (a[i]!=b[i])
            return false;
    return true;
}

u.arrayGroups = function (arr, n, empty) {
    if (!empty) {
        empty = {}
    }
    //we want to fill empty item in arrays for cards
    var rows = Math.ceil(arr.length / n)
    var length = n * rows
    log.debug("arrayGroups - n, row,length", n, rows, length)
    var result = []
    for (var i = 0; i < rows; i += 1) {
        var row = []
        for (var c = 0; c < n; c += 1) {
            var item = arr.slice((i * n) + c, (i * n) + c + 1)
            log.debug("col arrayGroups", row, item, i, c)
            if (item.length > 0) {
                row = row.concat(item)
            } else {
                row = row.concat([empty])
            }
        }
        result.push(row)
        log.debug("row arrayGroups", row)
    }
    return result
}

u.getHash = function () {
    return window.location.hash.split('?')[0].substr(1);
}

u.getNode = function () {
    return decodeURIComponent(u.getHash().substr(1))
}

u.getParameterByName = function (name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results === null)
        return null;
    else
        return decodeURIComponent(results[1]);
}

u.appWindowWidthCalc = function (qObj, windowWidth, windowHeight,sentFrom) {
    var leftMenuWidth = 0
    var rightMenuWidth = 0
    var result
    var mobile = u.isMobile()
    if (mobile && window.screen.width > windowWidth){
	result = window.screen.width
    } else {
	result = windowWidth
    }
    if (qObj.settings) {
         if (mobile && window.screen.width < 480){
	     leftMenuWidth = window.screen.width
	 } else {
	     leftMenuWidth = 480
	 }//330
    } else if (qObj.navigator === 'default') {
	if (mobile && window.screen.width < 720){
	    leftMenuWidth = window.screen.width
	} else {
            leftMenuWidth = 720
	}
    } else if (qObj.navigator === 'search' && (!mobile || (mobile && (!qObj.preview && !qObj.pdfRow)))) {
	if (mobile && window.screen.width < 480){
	    leftMenuWidth = window.screen.width
	} else {
            leftMenuWidth = 480 //was 330
	}
    } else if (qObj.connections) {
	if (mobile && window.screen.width < 720){
	    leftMenuWidth = window.screen.width
	} else {
            leftMenuWidth = 720
	}
    }
    if (qObj.properties) {
	if (mobile && window.screen.width < 500){
	    rightMenuWidth = window.screen.width
	} else {
            rightMenuWidth = 500
	}
    }
    log.debug("windowWidth",{width: result, left: leftMenuWidth, right: rightMenuWidth, qObj: qObj, sentFrom: sentFrom})
    result = result - rightMenuWidth - leftMenuWidth
    store.commit('leftMenuWidth', leftMenuWidth)
    store.commit('rightMenuWidth', rightMenuWidth)
    store.commit('appWindowWidth', result)
    store.commit('appWindowHeight', windowHeight)  //was - 108
    //log.debug("appWindowWidthCalc", leftMenuWidth, result, rightMenuWidth,  windowWidth, windowHeight)
    store.commit('windowWidth', windowWidth)
}

u.getSubdomain = function (uri) {
    if (!uri)
        uri = router.currentRoute.query.location;
    try {
        const url = new URL(uri);
        const hostParts = url.hostname.split(".");
        if (hostParts.length > 1)
            return hostParts[0];
    } catch (err) {
        log.error(err);
    }
}

u.getPodNode = function (uri){
    uri = u.getURI(uri)
    if (!uri)
        uri = router.currentRoute.query.location;
    try {
        const url = new URL(uri);
        return url.origin
    } catch (err) {
        log.error(err);
    }
}

u.getPodServer = function (uri){
    uri = u.getURI(uri)
    if (uri){
	var base = u.getPodNode(uri)
	if (base){
	    var subdomain = u.getSubdomain(base)
	    if (subdomain){
		if (base.includes(subdomain)){
		    return base.replace(subdomain + ".","")
		}
	    }
	}
    }
}
		   

u.getSubstance = function (uri){
    var podNode = u.getPodNode(uri)
    if (podNode){
	return podNode + "/node/Substance"
    }
}

u.getCard = function (uri) {
    var podNode = u.getPodNode(uri)
    if (podNode){
	return podNode + "/profile/card"
    }
}

u.getHome = function (uri) {
    var podNode = u.getPodNode(uri)
    if (podNode){
	return podNode + "/home/"
    }
}

u.getSettings = function (uri) {
    var podNode = u.getPodNode(uri)
    if (podNode){
	return podNode + "/profile/settings/"
    }
}

u.getSystemSettings = function (uri) {
    var podNode = u.getPodNode(uri)
    if (podNode){
	return podNode + "/profile/settings/System/"
    }
}

u.base64ToUint8Array = function(base64) {
    //log.debug('u.base64ToUint8Array',base64)
    var raw = base64 //atob(base64);
    var uint8Array = new Uint8Array(raw.length);
    for(var i = 0; i < raw.length; i++) {
	uint8Array[i] = raw.charCodeAt(i);
    }
    return uint8Array;
}

u.blobToBase64 = function(blob) {
    //log.debug('u.blobToBase64',blob)
    return new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onloadend = () => resolve(reader.result);
	reader.readAsDataURL(blob);
	reader.onerror = error => reject(error);
    });
}

u.blobToUint8Array = async function(blob){
    var base64 = await u.blobToBase64(blob)
    if (base64){
	return u.base64ToUint8Array(base64)
    }
}

u.getFile = async function(uri){
    if (uri){
	const blob = await client.getFile(uri, {
	    fetch: window.solid.session.fetch,
	})
	return blob
    }
}

u.getFileData = async function(uri){
    var blob = await u.getFile(uri)
    log.debug(blob)
    var buffer = await blob.arrayBuffer()
    var pdfData = await new Uint8Array(buffer)
    return pdfData
}

u.getArrayBuffer = async function(uri){
    var blob = await u.getFile(uri)
    var buffer = await blob.arrayBuffer()
    log.debug("buffer",buffer)
    var binary_string = await window.atob(buffer)
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

u.getId = function(uri){
    var item = u.getURI(uri)
    var parse = item.split("#");
    if (parse.length > 1) {
	parse = parse.reverse();
	return parse[0];
    } else {
	var parse = item.split("/");
	if (parse.length > 1) {
	    parse = parse.reverse();
	    if (parse[0] === "") {
		parse.shift();
	    }
	    return decodeURIComponent(parse[0]);
	} else {
	    return decodeURIComponent(item);
	}
    }
}

u.isBlankNode = function(node){
    if ($.type(node) === 'object'){
	if (node.termType === 'BlankNode'){
	    return true
	} else {
	    return false
	}
    } else {
	return false
    }
}

u.stringEscapeXml = function(str){
    var final = ""
    if (typeof(str) === 'string'){
	[...str].forEach(c => {
	    if (c === '&'){
		c = "&amp;"
	    } else if (c === "'"){
		c = "&apos;"
	    } else if (c === '"'){
		c = "&quot;"
	    } else if (c === "<"){
		c = "&lt;"
	    } else if (c === ">"){
		c = "&gt;"
	    }
	    final = final + c
	    /*var hex = c.charCodeAt(0).toString(16);
	    final = final + [, "&#x0", "&#x", "&#u0", "&#u"][hex.length] + hex + ';'*/
	})
	return final
    }
}

u.areEqualObjects = (a, b) => { 
  let s = (o) => Object.entries(o).sort().map(i => { 
     if(i[1] instanceof Object) i[1] = s(i[1]);
     return i 
  }) 
  return JSON.stringify(s(a)) === JSON.stringify(s(b))
}

u.getClientID = function(){
    var store = window.localStorage
    var client_id
    if ($.type(store) === 'object'){
	var keys = Object.keys(window.localStorage)
	if (Array.isArray(keys)){
	    keys.some(k => {
		//log.debug(k)
		if (k.search("solidClientAuthenticationUser:") > -1){
		    //log.debug(k,store[k])
		    var payload = JSON.parse(store[k])
		    if (payload.clientId){
			client_id = payload.clientId
			return client_id
		    }
		}
	    })
	}
    }
    return client_id
}

u.getOracleOIDCKey = function (){
    var store = window.localStorage
    var key
    if ($.type(store) === 'object'){
	var keys = Object.keys(window.localStorage)
	if (Array.isArray(keys)){
	    keys.some(k => {
		if (k.search("oidc.") > -1){
		    var payload = JSON.parse(store[k])
		    var redirect = payload.redirect_uri
		    if (redirect && redirect.search("/Oracle") > -1){
			key = k
			return key
		    }
		}
	    })
	}
    }
    return key
}
		      

u.systemStart = function(query){
    if (!query){
	query = Vue.router.history.current.query
    }
    return $.type(query) === 'object' && Object.keys(query).length === 0
}

u.cloneArray = function(arr){
    if (Array.isArray(arr)){
	return arr.map(a => {return {...a}})
    }
}

u.sanitize = function(input, replacement){
    var illegalRe = /[\/\?<>\\:\*\|"]/g;
    var controlRe = /[\x00-\x1f\x80-\x9f]/g;
    var reservedRe = /^\.+$/;
    var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    var windowsTrailingRe = /[\. ]+$/;

    if (typeof input !== 'string') {
	log.error('Input must be string')
    } else {
	var sanitized = input
	    .replace(illegalRe, replacement)
	    .replace(controlRe, replacement)
	    .replace(reservedRe, replacement)
	    .replace(windowsReservedRe, replacement)
	    .replace(windowsTrailingRe, replacement)
	return truncate(sanitized, 255);
    }
}

u.sanitizeFilename = function(input, options){
    var replacement = (options && options.replacement) || '';
    var output = u.sanitize(input, replacement);
    var Final
    if (replacement === '') {
	Final = output;
    } else {
	Final = u.sanitize(output, '');
    }
    if (typeof(Final) === 'string'){
	return encodeURIComponent(Final)
    }
}

u.isTree = function(tree){
    if ($.type(tree) === 'object' && typeof(tree.edgeSize) === 'number'){
	return true
    } else {
	return false
    }
}

u.isTreeNode = function(node){
    if ($.type(node) === 'object' && node.data && node.data.uri){
	return true
    } else {
	return false
    }
}

u.isRdfNode = function(node){
    if ($.type(node) === 'object' && node.termType && node.termType === "NamedNode"){
	return true
    } else {
	return false
    }
}

u.findTreeNode = function(uri,tree){
    var uri = u.getURI(uri)
    var find
    if (uri){
	if (u.isTree(tree)){
	    tree.traverse(node => {
		if (node.data.uri === uri){
		    find = node
		    return true
		}
	    })
	}
    }
    return find
}

u.getRegister = async function(trinityAPILocation, folder){
    var _store = store
    var url1 =
	trinityAPILocation +
	"trinityMetaReviewLoad?folder=" +
	folder;
    var url2 = url1 + "&ext=si.json";
    url1 += "&ext=sibk.json";
    try {
	var response = await fetch(url1)
	log.debug(url1,response.status);
	var json = await response.json()
	u.addRegister(json)
	u.decodeRegister(json)
	_store.commit('registerInitialLoad',true)
    } catch (error){
	log.error(error)
	var response = await fetch(url2)
	log.debug(url2,response.status);
	var json = await response.json()
	u.addRegister(json)
	u.decodeRegister(json)
	_store.commit('registerInitialLoad',true)
    }
}

/*   $.getJSON(url1, function (json, status) {
	log.debug(url1);
	u.decodeRegister(json)
    }).then(function (){
	_store.commit('registerInitialLoad',true)
    }).
	fail(function (json, status) {
	    log.debug(url2);
	    $.getJSON(url2, function (json, status) {
		u.decodeRegister(json)
	    }).fail(function (json, status) {
		log.debug(status);
	    });
	});
	}*/

u.addRegister = function(json){
    var _store = store
    if (Array.isArray(json)){
	_store.commit('clearRegister')
	json.forEach(function (page, index){
	    _store.commit('registerAdd',{obj: page, idx: index})
	})
    }
}

u.decodeRegister = function (){
    var _store = store
    var register = store.state.register
    if (Array.isArray(register)){
	//_store.commit('clearRegister')
	register.forEach(function (sheetInfo, index) {	    
	    //_store.commit('registerAdd',{obj: sheetInfo, idx: index})
	    var keys = Object.keys(sheetInfo)
	    log.debug("u.decodeRegister index",index,keys)
	    if (Array.isArray(keys)){
		keys.forEach(p => {
		    _store.commit("registerDecode",{idx: index, decode: true, key: p, target: sheetInfo, value: sheetInfo[p]})
		})
	    }
	})
    }
}

u.encodeRegisterClone = function(){
    if (Array.isArray(store.state.register) && store.state.register.length > 0){
	var clone = u.cloneArray(store.state.register)
	clone.forEach( obj => {
	    var keys = Object.keys(obj)
	    if (Array.isArray(keys)){
		keys.forEach(k => {
		    var value = obj[k]
		    if ($.type(value) === "string"){
			obj[k] = encodeURIComponent(obj[k])
		    }
		})
	    }
	})
	return clone
    }
}
			    
    

u.getSchemaItem = function(schema,identifier,notIdentifier){
    //log.debug("u.getSchemaItem",schema,identifier,notIdentifier)
    var result
    var bunch = []
    if (Array.isArray(schema)){
	schema.forEach(s => {
	    if (identifier === s.Identifier){
		//log.debug("getSchemaItem",s)
		result = s
	    } else if (Array.isArray(notIdentifier) && notIdentifier.includes(s.Identifier)){
		bunch.push(s)
	    }
	})
	if (notIdentifier){
	    //log.debug("getSchemaItem",bunch)
	    result = bunch
	}
    }
    return result
}

u.getSchema = async function(trinityAPILocation,folder){
    var _store = store
    var url =
	trinityAPILocation +
	"trinityMetaReviewLoad?folder=" +
	folder + "&ext=schema.json";
    try {
	var response = await fetch(url)
	log.debug("u.getSchema",response.status)
	var json = await response.json()
	_store.commit("registerSchema",json)
	log.debug(json)
    } catch (error) {
	log.error(error)
    }
}

u.getMandatoryIds = function(){
    if (store.state.registerSchema){
	var mand = []
	store.state.registerSchema.forEach(s => {
	    if (s.MandatoryStatus && s.MandatoryStatus === "MANDATORY" && s.Identifier !== "HasFile"){
		mand.push(u.convertIdentifier(s.Identifier))
	    }
	})
	return mand
    }
}

u.getAdditionalMandatoryIds = function(){
    var mand = u.getMandatoryIds()
    if (mand){
	var add = u.getDifference(mand,["docType","docType","discipline","tag","issueDate","title","HasFile","status","issueReason"])
	if (Array.isArray(add) && add.length > 0){
	    return add
	}
    }
}

u.getAdditionalMetaIds = function(){
    var mand = u.getMandatoryIds()
    mand = mand.concat(["DocumentNumber","Title","Revision","RevisionDate","DocumentTypeId","Discipline","DocumentStatusId","HasFile"])
    var add = []
    if (store.state.registerSchema){
	store.state.registerSchema.forEach(s => {
	    if (!mand.includes(s.Identifier)){
		add.push(s.Identifier)
	    }
	})
    }
    if (Array.isArray(add) && add.length > 0){
	return add.sort()
    }
}
    

u.convertIdentifier = function(id){
    if (id === "DocumentNumber"){
	return "tag"
    } else if (id === "Title"){
	return "title"
    } else if (id === "Revision"){
	return "issueReason"
    } else if (id === "RevisionDate"){
	return "issueDate"
    } else if (id === "DocumentTypeId"){
	return "docType"
    } else if (id === "Discipline"){
	return "discipline"
    } else if (id === "Comments"){
	return "comments"
    } else if (id === "DocumentStatusId"){
	return "status"
    } else {
	return id
    }
}

u.checkRegisterValid = function(){
    var mand = u.getMandatoryIds()
    var register = store.state.register
    if (mand && register){
	var valid = true
	register.forEach(r => {
	    mand.forEach(m => {
		//log.debug("valid",{r: r, m: m, rm: r[m]})
		if (!r[m]){
		    valid = false
		    return
		}
	    })
	    if (valid === false){
		return
	    }
	})
	return valid
    } else {
	return true
    }
}

u.openHelp = function() {
    window.open('https://graphmetrix.com/Aconex/help', 
                'Graphmetrix Help', 
                'width=1140,height=640'); 
            return false;
}

u.tokenizeSearch = function(str){
    var finds = []
    while (str && str !== ""){
	var find = [...str.matchAll(/\"/g)]
	var qty = find.length
	var div = qty / 2
	var quotes =  qty > 0 && (2 * div) === qty //aborts if using " for inches etc
	var find_
	if (quotes){
	    find_ = find
	} else {
	    find_ = [...str.matchAll(/ /g)]
	}
	var start
	var end
	if (quotes){
	    start = find_.shift().index
	    end = find_.shift().index + 1
	} else if (Array.isArray(find_) && find_.length > 0){
	    start = 0
	    end = find_[0].index
	}
	log.debug({find_: find_, start: start, end: end, str: str, finds: finds})
	if (typeof(start) === 'number' && typeof(end) === 'number'){
	    var res = str.slice(start,end)
	    log.debug("res",res)
	    finds.push(res)
	    str = str.replace(res,'').trim()
	} else if (str){
	    finds.push(str)
	    str = ""
	}
	start = null
	end = null
    }
    return finds
}



export default u

     
