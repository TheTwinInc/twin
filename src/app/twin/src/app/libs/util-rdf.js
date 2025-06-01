const $ = require('jquery')

import * as URI from "uri-js";

//import * as client from "@inrupt/solid-client"

import { rdfStore, rdfFetcher, rdfUpdater, $rdf } from './rdfStore'

import config from './config'
import { graph } from '@/graph.js';

import { ns, nu, nl, neo, trinity, trinapp } from './ontologies'

import u from './util'
import ua from './util-acl'
import q from './util-q'
import c from './util-c'

import store from './store'
import Vue from 'vue'

const ur = {};

import * as log from 'loglevel'

ur.error = function (err) {
	log.error("***ERROR***", err);
}

ur.login = async function () {
    //const session =
    await window.solid.session
    var oracle
    log.debug("login", store.state.webId);
    if (store.state.webId) {
	var URIp = URI.parse(store.state.webId)
	var port = URIp.port;
	if (!port) {
	    port = ""
	} else {
	    port = ":" + port;
	}
	store.state.podNs = URIp.scheme + "://" + URIp.host + port + "/node/" // + "/";
	store.state.pod = URIp.host + port;
	ns.U1 = $rdf.Namespace(store.state.podNs)
	nu.U1 = store.state.podNs
	const cardData = await store.dispatch('loadDataSet', { uri: store.state.webId, sentFrom: "util-rdf.login" })
	if (cardData) {
	    var me = $rdf.sym(store.state.webId) //client.getThing(cardData,store.state.webId)


	    store.state.userName = ur.getLabel(me);

	    var storage = rdfStore.anyStatementMatching(me, ns.SPACE('storage'))
	    if (storage) {
		storage = storage.object
	    }
	    var profile = rdfStore.anyStatementMatching(me, ns.FOAF('PersonalProfileDocument'))
	    if (profile) {
		profile = profile.object
	    }
	    log.debug("session", window.solid.session, storage, profile);
	    if (storage) {
		store.state.storage = storage.value
	    }

	    if (profile) {
		store.state.profile = profile.value
	    } else {
		store.state.profile = store.state.webId;
	    }
	    var cRoute = Vue.router.currentRoute

	    var hash = cRoute.hash
	    var path = cRoute.path
	    var qObj = cRoute.query
	    var node = decodeURIComponent(path) //(hash.substr(1));
	    //set default view if none set
	    log.debug("route", cRoute, hash, path, qObj, node)
	    if (path && path === "/Oracle"){
		oracle = true
		path = "/"
	    }
	    //await store.dispatch('loadDataSet',{ uri: store.state.storage}) //, forceHead: true})
	    if (window.localStorage.getItem('oracleLogin')){
		log.debug("oracleLogin",true)
		window.localStorage.removeItem('oracleLogin')
		store.commit("oracleLogin",true)
	    }
	    var eObj = u.deleteKeys(qObj, ["code", "state", "qr", "idp", "params", "webid", "email"])

	    var qr = window.localStorage.getItem('qr')
	    if (qr){
		var qri = decodeURIComponent(qr)
		eObj.select = qri
		eObj.location = qri
		eObj.app = "Documents"
		await store.dispatch("loadDataSet", { uri: qri, sentFrom: "ur.login.qr"})
		var tag = ur.getFTag(qri)
		if (tag){
		    eObj.search = "#" + tag
		    eObj.navigator = "search"
		}
		log.debug("qrRedirect",qri,tag)
	    }
	    //if (!eObj.select) {
	    //eObj.select = store.state.webId //store.state.storage
	    //}
	    //check for redirect
	    var lastVisited = window.localStorage.getItem('redirect_uri')
	    if (lastVisited && !qr && (!eObj || (eObj && !eObj.location))){
		lastVisited = URI.parse(decodeURIComponent(lastVisited))
		var lastQuery = u.deparam(lastVisited.query)
		if ($.type(lastQuery) === 'object' && lastQuery.location){
		    eObj = lastQuery
		}
		
	    }

	    
	    store.commit('loggedIn', true)
	    if (!eObj.location) {
		eObj.location = store.state.webId //store.state.storage
		if (!eObj.select){
		    eObj.select = store.state.webId
		}
		if (!eObj.app){
		    eObj.app = "LaunchPad"
		}
	    }
	    log.debug("state.storage", store.state.storage, eObj)
	    store.state.node = store.state.webId
	    store.commit('location', store.state.webId)
	    store.commit("loading", {value: false, sentFrom: "ur.login.end"})
	    Vue.router.push({ path: path, query: eObj }); //u.getReload(
	}
    }
}


//EVENTS

ur.getIssuer = function (uri) {
    //log.debug("getIssuer",uri)
    var uri = u.getURI(uri)
    if (uri){
	var webId = ur.getWebId(uri);
	if (webId){
	    var st = rdfStore.anyStatementMatching($rdf.sym(webId), ns.SOLID('oidcIssuer'))
	    if ($.type(st) === 'object' && st.object){
		return st.object.value;
	    } 
	} else {
	    return u.getBaseURI(uri)
	}
    }
}

ur.getInbox = function (uri) {
    var uri = u.getURI(uri)
    if (uri){
	var webId = ur.getWebId(uri);
	if (webId){
	    var st = rdfStore.anyStatementMatching($rdf.sym(webId), ns.LDP('inbox'))
	    if ($.type(st) === 'object' && st.object){
		return st.object.value;
	    }
	}
    }
}

ur.getPermanentURI = function (uri){
    var uri = u.getURI(uri)
    if (uri){
	var st = rdfStore.anyStatementMatching($rdf.sym(uri), ns.VCARD('url'))
	if ($.type(st) === 'object' && st.object){
		return st.object.value;
	}
    }
}

ur.isNeo = function (item) {
	var ns = ur.getNamespace(item)
	return ns === 'NEO'
}

ur.isConstructionPod = function(item){
    var base = u.getURI(item)
    if (base){
	var types = ur.getTypes(base)
	if (Array.isArray(types) && types.includes(ns.NEO('a_pod-construction').value)){
	    return true
	} else {
	    return false
	}
    } else {
	return false
    }
}

ur.isChildPod = function (item){
    var webid = ur.getWebId(item)
    if (webid){
	var match = u.unique(rdfStore.match($rdf.sym(webid), $rdf.sym(ns.ACL('owner'))))
	if (Array.isArray(match) && match.length > 0){
	    return true
	} else {
	    return false
	}
    }
}

ur.isParentPod = function (item){
    var uri = u.getURI(item)
    if (uri){
	var webid = ur.getWebId(uri)
	if (webid){
	    var match = u.unique(rdfStore.match(null, $rdf.sym(ns.ACL('owner')),$rdf.sym(webid)))
	    if (Array.isArray(match) && match.length > 0){
		return true
	    } else {
		return false
	    }
	}
    }
}

ur.isParentPodCapable = function (item){
    var uri = u.getURI(item)
    if (uri){
	if (uri === ur.getWebId(uri) && (ur.isParentPod(uri) || !ur.isChildPod(uri))){
	    return true
	} else {
	    return false
	}
    } else {
	return false
    }
}

ur.isAconexProject = function(item){
    return ur.isPodType(item,ns.NEO('p_aconex-project'))
}

ur.isPodProject = function (item){
    return ur.isPodType(item,ns.DOAP('Project'))
}

ur.isPodBusiness = function (item){
    return ur.isPodType(item,ns.GR('BusinessEntity'))
}

ur.isPodOrganization = function (item){
    return ur.isPodType(item,ns.ORG('Organization'))
}

ur.isPodGroup = function (item){
    return ur.isPodType(item,ns.VCARD('Group'))
}

ur.isPodBuilding = function (item){
    return ur.isPodType(item,ns.BOT('Building'))
}

ur.isPodSite = function (item){
    return ur.isPodType(item,ns.BOT('Site'))
}

ur.isPodPersonal = function (item){
    var uri = u.getURI(item)
    if (uri){
	var webid = ur.getWebId(uri)
	if (uri === webid){
	    var types = u.getURIs(ur.getTypes(uri))
	    if (Array.isArray(types) && types.includes(ns.FOAF('Person').value)){
		return true
	    } else {
		return false
	    }
	} else {
	    return false
	}
    }
}


ur.isPodType = function(item,type){
    var uri = ur.getWebId(item)
    if (uri){
	return ur.isType(uri,type)
    } else {
	return false
    }
}

/*
    var uri = u.getURI(item)
    if (uri){
	var types = ur.getTypes(uri)
	if (Array.isArray(types)){
	    if (types.includes(ns.DOAP('Project').value)){
		return true
	    } else {
		return false
	    }
	} else {
	    return false
	}
    } else {
	return false
    }
}*/

ur.isType = function (item,type){
    var type = u.getURI(type)
    var uri = u.getURI(item)
    if (uri && type){
	var types = ur.getTypes(uri)
	if (Array.isArray(types)){
	    if (types.includes(type)){
		return true
	    } else {
		return false
	    }
	} else {
	    return false
	}
    } else {
	return false
    }
}

ur.isProcess = function (item) {
    return ur.isType(item,ns.OPMV('Process'))
}

ur.isAccount = function (item) {
    var uri = u.getURI(item)
    if (ur.isType(uri,ns.SOLID('Account')) ||
	uri === store.state.storage){
	return true
    } else {
	return false
    }
}

ur.isContainer = function (item) {
	return ur.containerP(item)
}

ur.containerP = function (item) {
    return (ur.isType(item,ns.LDP('Container')) ||
	    ur.isType(item,ns.LDP('BasicContainer')) ||
	    ur.isType(item,ns.LDP('IndirectContainer')) ||
	    ur.isType(item,ns.LDP('DirectContainer')))
}

ur.isPort = function (item){
    return (ur.isType(item,ns.NEO('x_port')) ||
	    ur.isObjectPort(item))
}

ur.isControlledProject = function (item){
    if (ur.isPodProject(item) && ua.userCanControl(item)){
	return true
    } else {
	return false
    }
}




    

ur.isConcept = function (item) {
    var uri = u.getURI(item)
    if (uri) {
	if (rdfStore.anyStatementMatching($rdf.sym(uri), neo.m_cid) ||
	    uri.includes("http://www.w3.org/ns/iana/media-types/") ||
	    uri.includes("https://w3id.org/idsa/core/")) {
	    return true
	} else {
	    return false
	}
    } else {
	return false
    }
}

ur.isQuad = function (quad) {
	if ($.type(quad) === "object" && quad.subject) {
		return true
	} else {
		return false
	}
}

ur.isEvent = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		var node = $rdf.sym(uri)
		if (rdfStore.anyStatementMatching(null, neo.i_input, node) ||
			rdfStore.anyStatementMatching(node, neo.o_output) ||
			rdfStore.anyStatementMatching(node, neo.t_execute)) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}

ur.isAttribute = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		var types = ur.getTypes(uri)
		if (types) {
			types = u.getURIs(types)
			if (types.includes(ns.SIO("SIO_000614").value)) {
				return true
			} else {
				return false
			}
		} else {
			return false
		}
	} else {
		return false
	}
}

ur.isState = function (item) {
    if (!u.isBlankNode(item)){
	var uri = u.getURI(item)
	if (uri) {
	    var types = ur.getTypes(uri)
	    if (types) {
		types = u.getURIs(types)
		if (types.includes(ns.NEO('s_state').value)) {
		    return true
		} else {
		    return false
		}
	    } else {
		return false
	    }
	} else {
	    return false
	}
    }
}

ur.isEntity = function (item) {
	var uri = u.getURI(item)
	if (uri) {
	    var quads = u.unique(rdfStore.match($rdf.sym(uri), neo.i_entity))
		if ($.type(quads) === "array" && quads.length > 0) {
			return true
		} else {
			return false
		}
	}
}


ur.isObjectContains = function (item) {
	var uri = u.getURI(item)
    if (uri) {
		if (rdfStore.anyStatementMatching(null,neo.m_contains,$rdf.sym(uri))) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}


ur.isObjectJoin = function (item) {
	var uri = u.getURI(item)
    if (uri) {
		if (rdfStore.anyStatementMatching(null,neo.m_join,$rdf.sym(uri))) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}


ur.isObjectPort = function (item) {
	var uri = u.getURI(item)
    if (uri) {
		if (rdfStore.anyStatementMatching(null,neo.m_port,$rdf.sym(uri))) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}

ur.isObjectRelation = function(item, funcNode){
    var check = false
    var uri = u.getURI(item)
    if (uri && u.isRdfNode(funcNode)) {
	if (rdfStore.anyStatementMatching($rdf.sym(uri),funcNode)) {
	    check = true
	}
    }
    return check
}

ur.isRelation = function(item, funcNode){
    var check = false
    var uri = u.getURI(item)
    if (uri && u.isRdfNode(funcNode)) {
	if (rdfStore.anyStatementMatching(null,funcNode,$rdf.sym(uri)) ||
	    rdfStore.anyStatementMatching($rdf.sym(uri),funcNode)) {
	    check = true
	}
    }
    return check
}

ur.isRelationPort = function (item){
    return ur.isRelation(item, neo.m_port)
}

ur.isRelationJoin = function (item){
    return ur.isRelation(item, neo.m_join)
}

ur.isRelationContains = function (item){
    return ur.isRelation(item, neo.m_contains)
}

ur.isObjectDo = function (item) {
	var uri = u.getURI(item)
    if (uri) {
		if (rdfStore.anyStatementMatching(null,neo.j_do,$rdf.sym(uri))) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}

ur.getSubject = function(item, funcNode){
    if (Array.isArray(item)){
	item = item[0]
    }
    var uri = u.getURI(item)
    var up = []
    //log.debug("ur.getSubject",uri,item,funcNode)
    if (uri && u.isRdfNode(funcNode)) {
	var sts = rdfStore.match(null,funcNode,$rdf.sym(uri))
	if (Array.isArray(sts) && sts.length > 0){
	    sts.forEach(st => {
		up.push(st.subject.value)
	    })
	}
	if (up.length > 0){
	    up = u.unique(up)
	    if (up.length === 1){
		return up[0]
	    } else {
		return up
	    }
	}
    }
}

ur.getObject = function(item, funcNode){
    if (Array.isArray(item)){
	item = item[0]
    }
    var uri = u.getURI(item)
    //log.debug("ur.getObject",uri,item,funcNode)
    var down = []
    if (uri && u.isRdfNode(funcNode)) {
	var sts = rdfStore.match($rdf.sym(uri),funcNode)
	//log.debug("ur.getObject",sts)
	if (Array.isArray(sts) && sts.length > 0){
	    sts.forEach(st => {
		down.push(st.object.value)
	    })
	}
    }
    if (down.length > 0){
	down = u.unique(down)
	if (down.length === 1){
	    return down[0]
	} else {
	    return down
	}
    }
}

ur.getRank = function(item){
    var object = ur.getObject(item,ns.NEO('m_rank'))
    if (object){
	return +object
    }
}

ur.getSystemUp = function(item){
    if (Array.isArray(item)){
	item = item[0]
    }
    var up = null
    var item = u.getURI(item)
    if (item){
	var contains = ur.getSubject(item, neo.m_contains)
	var bound = ur.getSubject(item, neo.m_bound)
	var ports = ur.getSubject(item, neo.m_port)
	var portsO = ur.getObject(item, neo.m_port)
	var join = ur.getSubject(item, neo.m_join)
	var inter =  ur.getSubject(item, neo.f_interface)
	var interO = ur.getObject(item, neo.f_interface)
	//var up = (ur.getSubject(item, neo.m_contains) || ur.getSubject(item, neo.m_bound) || ur.getSubject(item, neo.m_port) || ur.getSubject(item, neo.m_join) || ur.getSubject(item, neo.f_interface))
	//port, join and inter need special attention as they are not inherently directional
	//log.debug({contains: contains, bound: bound, ports: ports, portsO: portsO, join: join, inter: inter, interO: interO})
	if (contains){
	    up = contains
	} else if (bound){
	    up = bound
	} else if (join){
	    up = join
	} else if (ports || portsO){
	    
	    up = []
	    if (ports){
		if (!Array.isArray(ports)){
		    ports = [ports]
		}
		ports.forEach(port => {
		    /*var pUp = ur.getObject(port, neo.m_port)
		    if (pUp){
			if (!Array.isArray(pUp)){
			    pUp = [pUp]
			}
		    }
		    //log.debug("port S",port,pUp)
		    if (!pUp || (pUp && !pUp.includes(item))){*/
			up.push(port)
		    //}
		})
	    }
	    if (portsO){
		if (!Array.isArray(portsO)){
		    portsO = [portsO]
		}
		portsO.forEach(portO => {
		    var pUp = ur.getSubject(portO, neo.m_port)
		    if (pUp){
			if (!Array.isArray(pUp)){
			    pUp = [pUp]
			}
		    }
		    //log.debug("port O",portO,pUp)
		    if (!pUp || (pUp && !pUp.includes(item))){
			up.push(portO)
		    }
		})
	    }
	    
	}
	//log.debug("getSystemUp",item,up)
	return up
	/*if (Array.isArray(up)){
	    up = up[0]
	}*/
    }
}

ur.getSystemDown = function(item,tree,app){
    var down = []
    if (Array.isArray(item)){
	item = item[0]
    }
    //log.debug("getSystemDown",item)
    var up = []
    if (tree){
	var node = u.findTreeNode(item,tree)
	if (node){
	    up = ur.vectorUpTree(node,tree)
	}
    }
    var contains = ur.getObject(item, neo.m_contains)
    if (contains){
	if (Array.isArray(contains)){
	    down = down.concat(contains)
	} else {
	    down.push(contains)
	}
    }
    var join = ur.getObject(item, neo.m_join)
    if (join){
	if (Array.isArray(join)){
	    down = down.concat(join)
	} else {
	    down.push(join)
	}
    }
    var portsOut =  ur.getObject(item, neo.m_port)
    var portsIn = ur.getSubject(item, neo.m_port)
    //log.debug("ports in out",item,up,portsOut,portsIn)
    if (portsOut){
	if (!Array.isArray(portsOut)){
	    portsOut = [portsOut]
	}
	portsOut.forEach(port => {
	    if (!up.includes(port)){
		var pDown = ur.getObject(port, neo.m_port)
		if (pDown && !Array.isArray(pDown)){
		    pDown = [pDown]
		}
		if (!pDown || pDown && !pDown.includes(item)){
		    down.push(port)
		}
	    }
	})
    }
    if (portsIn){
	if (!Array.isArray(portsIn)){
	    portsIn = [portsIn]
	}
	portsIn.forEach(port => {
	    if (!up.includes(port)){
		var pDown = ur.getSubject(port, neo.m_port)
		if (pDown && !Array.isArray(pDown)){
		    pDown = [pDown]
		}
		if (!pDown || (pDown && !pDown.includes(item))){
		    down.push(port)
		}
	    }
	})
    }
    var bound = ur.getObject(item, neo.m_bound)
    if (bound){
	if (Array.isArray(bound)){
	    down = down.concat(bound)
	} else {
	    down.push(bound)
	}
    }
    var intS = ur.getSubject(item, neo.f_interface)
    if (intS && app !== "Projects" && !(ur.isPodProject(intS) && ur.isWebId(intS))){
	if (Array.isArray(intS)){
	    down = down.concat(intS)
	} else {
	    down.push(intS)
	}
    }
    var intO = ur.getObject(item, neo.f_interface)
    if (intO && (app === "Projects" || (app !== "Projects" &&  !(ur.isPodProject(intO) && ur.isWebId(intO))))){
	if (Array.isArray(intO)){
	    down = down.concat(intO)
	} else {
	    down.push(intO)
	}
    }
    //log.debug("sysdown",intS,intO)
    if (down.length === 0){
	down = null
    } else {
	down = u.unique(down)
    }
    return down
}

ur.isSystemObj = function(item){
    var types = ur.getTypes(item)
    if (Array.isArray(types) &&
	(types.includes(ns.SIO('SIO_000110').value) ||
	 types.includes(ns.SIO('SIO_000114').value)) ||
	ur.isContainer(item) || ur.isFile(item)){
	return false
    } else if ((ur.getSystemUp(item) || ur.getSystemDown(item) || ur.isWebId(item)) 
       ){
	//(ur.vectorUpSystem(item,true) || ur.isWebId(item)){
	return true
    } else {
	return false
    }
}

ur.getPortTo = function (item){
    var uri = u.getURI(item)
    if (uri){
	var ports = ur.getInherit(uri, ns.NEO('m_port'))
	if (ports){
	    return u.getURIs(ports)
	}
    }
}

ur.getPortFrom = function (item){
    var uri = u.getURI(item)
    if (uri){
	var ports = ur.getInherit(uri, ns.NEO('m_port'),true)
	if (ports){
	    return u.getURIs(ports)
	}
    }
}

ur.stateToElems = function (state) {
	if (ur.isState(state)) {
		var uri = u.getURI(state)
		var elems = {}
		var e_entity
		var a_attribute
		if (uri) {
		    var eQuads = u.unique(rdfStore.match(null, neo.i_entity, $rdf.sym(uri)))
			if ($.type(eQuads) === "array") {
				var eQuad = eQuads[0]
				if ($.type(eQuad) === "object") {
					e_entity = eQuad.subject.value
				}
			}
		    var aQuads = u.unique(rdfStore.match(null, neo.i_attribute, $rdf.sym(uri)))
			if ($.type(aQuads) === "array") {
				var aQuad = aQuads[0]
				if ($.type(aQuad) === "object") {
					a_attribute = aQuad.subject.value
				}
			}
			if (e_entity) {
				elems.e_entity = e_entity
			}
			if (a_attribute) {
				elems.a_attribute = a_attribute
			}
		}
		//log.debug("stateToElems",elems)
		return elems
	}
}

ur.attributeToElems = function (attribute) {
	if (ur.isAttribute(attribute)) {
		var uri = u.getURI(attribute)
		var elems = {}
		var f_function
		var a_result
		if (uri) {
		    var fQuads = u.unique(rdfStore.match($rdf.sym(uri), neo.i_function))
			if ($.type(fQuads) === "array") {
				var fQuad = fQuads[0]
				if ($.type(fQuad) === "object" && $.type(fQuad.object) === "object") {
					f_function = fQuad.object.value
				}
			}
		    var rQuads = u.unique(rdfStore.match($rdf.sym(uri), neo.o_result))
			if ($.type(rQuads) === "array") {
				var rQuad = rQuads[0]
				if ($.type(rQuad) === "object") {
					var obj = rQuad.object
					if (obj.termType === "NamedNode") {
						a_result = rQuad.object.value
					} else {
						a_result = rQuad.object
					}
				}
			}

			if ($.type(f_function) === "string") {
				elems.f_function = f_function
			}
			elems.a_result = a_result
		}
		return elems
	}
}

ur.f_function = function (item, recurse) {
	if (ur.isState(item) && !recurse) {
		var sElems = ur.stateToElems(item)
		if ($.type(sElems) === "object") {
			return ur.f_function(sElems.a_attribute, true)
		}
	} else {
		var elems = ur.attributeToElems(item)
		if ($.type(elems) === "object") {
			return elems.f_function
		}
	}
}


ur.a_result = function (item, recurse) {
	if (ur.isState(item) && !recurse) {
		var sElems = ur.stateToElems(item)
		if (sElems) {
			return ur.a_result(sElems.a_attribute, true)
		}
	} else if (ur.isAttribute(item)) {
		var elems = ur.attributeToElems(item)
		if ($.type(elems) === "object") {
			return elems.a_result
		}
	} else if (ur.isEntity(item)) {
	    var quads = u.unique(rdfStore.match(null, ns.NEO('o_result'), $rdf.sym(u.getURI(item))))
		var result = []
		quads.forEach(q => result.push(q.subject.value))
		return result
	}
}

ur.literalEqual = function (lit1, lit2) {
	if (lit1.value === lit2.value &&
		lit1.language === lit2.language) {
		if (lit1.datatype && lit2.datatype) {
			return lit1.datatype.value === lit2.datatype.value
		} else if (!lit1.datatype && !lit2.datatype) {
			return true
		}
	} else {
		return false
	}
}

ur.stateToQuad = function (state) {
	var uri = u.getURI(state)
	if (uri) {
		if (ur.isState(uri)) {
			var entity = q.entity(uri)[0]
			var func = q._function(uri)[0]
			var result = q.result(uri)
			var s
			var p
			var o
			if (entity) {
				s = $rdf.sym(entity)
			}
			if (func) {
				p = $rdf.sym(func)
			}
			if ($.type(result) === "object") {
				if (result.termType === "Literal") {
					o = result
					//o = new $rdf.Literal(result.value,result.language,result.datatypeString)
				} else if (result.termType === "NamedNode") {
					o = $rdf.sym(result.value)
				}
			} else {
				o = $rdf.sym(result)
			}
			//log.debug("stateToQuad",state,uri,entity,func,result,s,p,o)
		    return u.unique(rdfStore.match(s, p, o))
		} else if (ur.isEntity(state)) {
			return ur.stateToQuad(q.state(uri))
		} else if ($.type(state) === "array") {
			return $.map(state, function (item) {
				return ur.stateToQuad(item)
			})
		}
	}
}

ur.quadToState = function (quad) {
	var result
	if (ur.isQuad(quad)) {
		var s = quad.subject
		var p = quad.predicate.value
		var o = quad.object
		var isLiteral = o.termType === "Literal"
		var oc
		if (isLiteral) {
			oc = o
		} else {
			oc = o.value
		}
		var states = q.state(s.value)
		if (states && Array.isArray(states)) {
			states.forEach(function (state) {
				var func = q._function(state)
				if (func && Array.isArray(func)) {
					func = func[0]
				} else {
					func = null
				}
				var res = q.result(state)
				//log.debug("quadToState",state,s,p,oc,func,res)
				if (func === p && res === oc) {
					result = state
					return
				}
			})
		}
	}
	return result
}

ur.tripleToState = function (s, p, o){
    s = u.getURI(s)
    p = u.getURI(p)
    var oObj = $.type(o) === 'object'
    var isLiteral = (oObj && o.termType === "Literal")
    var oc
    if (isLiteral) {
	oc = o
    } else if (oObj){
	oc = o
    } else {
	oc = $rdf.sym(u.getURI(o))
    }
    return ur.quadToState($rdf.st($rdf.sym(s),
				  $rdf.sym(p),
				  oc)
			 )
}


ur.sourceQuads = function (item) {
	var uri = u.getURI(item)
	if (uri) {
	    return u.unique(rdfStore.match($rdf.sym(uri)))
	}
}

ur.targetQuads = async function (item) {
	var uri = u.getURI(item)
	if (uri) {
	    return u.unique(rdfStore.match(null, null, $rdf.sym(uri)))
	}
}

ur.location = function (uri, app) {
	//log.debug("ur.location",uri,app)
	var node
	if (app === "Files") {
	    node = u.getURI(uri)
	    if (!ur.isSystemObj(node)){		
		if (!ur.containerP(node) && !ur.getObject(uri,neo.m_contains)) {
		    node = ur.getContainer(node)
		}
	    }
	}
	if (!node) {
		node = uri
	}
    log.debug("ur.location",node,app)
	return u.getURI(node)
}

//need to load acl information

ur.aLoadURI = async function (uri, doc, options) {
    log.debug("aLoadURI", uri, doc);
    if (!options) {
	options = {}
    }
    options.fetch = window.solid.hyperFetch
    uri = ur.getGmxLoad(uri, options)
    options.headers = {hypergraph: 'U2FsdGVkX1/S0rANmPZVe3xCIXvlGoGnGudwlp4wFSMFtte++kYYPt0l4B4407c+'}
    if (uri) {
	try {

	    var resp = await rdfFetcher.load(uri, options);
	    log.debug("ur.aLoadURI response",resp)
	    var statements = u.unique(rdfStore.match(null, null, null, $rdf.sym(uri)));
	    log.debug("URI loaded", uri, statements.length);
	    return [statements,resp];
	} catch (err) {
	    log.debug("Cant load URI", uri, err)
	    c.createAlert("Error:",
			  err,
			  "",
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	    store.commit('dequeueDataSet', uri)
	    return err
	}
    } else {
	log.error("ERROR: bad URI to loadURIa");
	return "ERROR: bad URI to loadURIa"
    }
}

ur.loadPropertiesNode = async function (node) {
	////MOVED TO STORE DISPATCH select
	log.debug("ur.loadPropertiesNode", node)
	var IRI = u.getIRI(node);
	node = $rdf.sym(IRI)
	if (IRI) {
		/*
		  var route = Vue.router.currentRoute;
		  try {
		  var nProps = await ur.loadSelect(node);
		  } catch (err) {
		  log.debug("ur.loadPropertiesNode - couldn't fetch", err, node)
		  } */
		//now assoc loaded props with node

		//var nProps = rdfStore.match(null,ns.RDFS('domain'),$rdf.sym(u.getURI(node)),"ontology")
		var types = ur.getTypes(IRI, true); //can only use properties set with state
		if (types) {
			log.debug("***TYPES", types);

			var domainNode = u.uriToNamedNode(ns.RDFS('domain').value)

			var nProps = []
			var dTypes = []
		    var ds = await store.dispatch('loadDataSet', { uri: IRI, sentFrom: "util-rdf.loadPropertiesNode" })
			log.debug("property ds", ds)
			if (ds) {
				var nPs = ds.match(null, domainNode)

				//rdfStore.match(null, ns.RDFS('domain'), $rdf.sym(Type)) //, "ontology");
				log.debug("properties - nPs", ds, nPs)
				log.debug("WOW")


				if (nPs) {
					nPs.quads.forEach(nP => dTypes.push($rdf.sym(nP.object.value)))
					nPs.quads.forEach(nP => nProps.push($rdf.sym(nP.subject.value)))
				}
				log.debug("nProps", node, nProps, dTypes)
			}
			if (nProps) {
				nProps = u.unique(nProps)
				var prop
				for (prop of nProps) {
					store.commit('selectProperties', false)
				    var pds = await store.dispatch('loadDataSet', { uri: prop.value, sentFrom: "util-rdf.loadPropertiesNode2" })
					var ptypes = ur.getTypes(prop)
					prop.label = ur.getLabel(prop);
					var attrib
					log.debug("prop", ptypes, prop)
					//if (ptypes) {
					var match = ds.match(u.uriToNamedNode(IRI), u.uriToNamedNode(prop))
					var values = []
					match.quads.forEach(q => values.push(q))
					if (!values) {
						values = [];
					}

					prop.values = values;
					attrib = ur.getPropCategory(prop)
					prop.category = attrib[0]
					var props = store.getters.Properties(node)
					if (!props[attrib[0]]) {
						props[attrib[0]] = {}
					}
					props[attrib[0]][prop.value] = prop
					log.debug("props", prop, attrib, prop.uri, values)


					store.commit('properties',
						{
							node: u.getURI(node),
							cat: attrib[0],
							prop: prop.value,
							value: prop
						})
					store.commit('selectProperties', true)

					// }
				}
			}

			//store.commit('loading', false)


		}
	}
}

ur.aLoadNode = async function (node, forceLoad) {
	var URI = ur.getGmxLoad(node);
	var pod = store.state.pod
	var options = {}
	if (forceLoad) {
		options.force = true
	}
	if (URI) {
		if (config.logServerAndBrain) log.debug("config.brain:" + store.state.brain);
		if (!URI.match(store.state.brain)) {
			//options.withCredentials = false;
		}
		log.debug("aLoadNode", URI, options);
		await ur.aLoadURI(URI, null, options);
		ua.getAvailableModes(node)
		//lobe.store.commit('loaded',node);
	} else if (ur.getNamespace(node) !== "U1") {
		if (!URI.match(pod)) {
			log.error("ERROR - missing NS", node);
		}
	}
}

ur.loadOntology = async function (Props, properties, index) {
	//console.log("loadOntology",Props);
	if (Props || index) {
		if ($.type(Props) !== "array") {
			Props = [Props];
		}
		var pURIs = $.map(Props, function (prop) {
			var pURI;
			if (properties) {
				pURI = ur.getGmxLoad(prop);
				//pURI = ur.getGmxProperty(prop); 
			} else {
				pURI = ur.getGmxLoad(prop);
			}
			if (pURI && !pURI.match("ERROR")) {
				return pURI;
			}
		});
		if (index) {
			if (config.logServerAndBrain) log.debug("config.brain:" + store.state.brain);
			pURIs = [store.state.brain + "/ns/GMX"]
		}
		if (pURIs) {
			await rdfStore.fetcher.load(pURIs); //.catch(ur.error);
			//console.log("Ontology fetched",pURIs);
			//add loaded props to ontology
			$.map(pURIs, function (prop) {
			    var statements = u.unique(rdfStore.match(null, null, null, $rdf.sym(prop)))
				if (statements) {
					for (let i = 0; i < statements.length; i++) {
						var st = statements[i];
						//rdfStore.add(st.subject,st.predicate,st.object,"statements");
						rdfStore.add(st.subject, st.predicate, st.object); //, "ontology");
					}
				}
			});
		}
	} else {
		log.error("ERROR: no valid Nodes to load");
	}
}

ur.loadType = async function (Typ, node) {
	var URI;
	var NS = ur.getNamespace(Typ);
	if (NS) {
		var Term = ur.getNsTerm(Typ, NS);
		if (Term) {
			URI = ur.getGmxLoad(Typ)
			//config.brain + "/props/" + NS + "/" + Term;
		}
	} else {
		log.error("ERROR NS not present", Typ);
	}
	if (URI) {
		//await ur.aLoadNode(Typ)
		await ur.aLoadURI(URI, "ontology")
	    var Props = u.unique(rdfStore.match(null, ns.RDFS('domain'), $rdf.sym(Typ))) //, "ontology");
		if (Props) {
			var sProps = [];
			$.map(Props, function (nprop) {
				//rdfStore.add(nprop.subject,nprop.predicate,$rdf.sym(node),"ontology");
				sProps.push(nprop.subject);
			});
			await ur.loadOntology(sProps, true);
			log.debug("Type loaded", Typ, node, Props);
			return Props;
		} else {
			log.debug("Type loaded - no Props", Typ, node);
		}
	}
}

ur.loadSelect = async function (node, recurse) {
	log.debug("ur.loadSelect", node)
	await ur.aLoadNode(node);
	//move loadProps to here....https://davidwalsh.name/combining-js-arrays
	var IRI = u.getIRI(node);
	if (IRI) {
		var types = ur.getTypes(IRI);
		if (!types) {
			types = [];
		}
		//types.push(node);
		if (types) {
			log.debug("***TYPES", types);
			if ($.inArray(ns.SIO('SIO_000135').uri, types) > -1) {
				await ur.loadType(node)
			}
			const results = types.map(async (Typ) => { return ur.loadType(Typ, node); });

			var props = await Promise.all(results).then(function (tProps) {
				log.debug("Types Loaded", types, tProps);
				return tProps;
			});
			props = $.map(props, function (prop) {
				return prop
			})
			var fProps = $.map(props, function (prop) {
				return prop.subject
			})
			if (fProps) {
				return u.unique(fProps)
			}
		}
	}
}

ur.getContainer = function (item) {
    //return container term of item if exists
    //need to recursively find top level m_contains before ldp-contains check
    var uri = u.getURI(item)
    if (uri) {
	var ject
	if (u.isBlankNode(uri)){
	    ject = uri
	} else {
	    ject = $rdf.sym(uri)
	}
	var nested = rdfStore.any(null, $rdf.sym(ns.SIO('SIO_000202').value), ject)
	//TODO added recursive nested support
	if (nested) {
	    uri = nested.value
	    log.debug("nested", uri)
	}
	if (uri) {
	    var cont = rdfStore.any(null, $rdf.sym(ns.LDP('contains').value), ject)
	    if (cont) {
		if (u.isBlankNode(cont)){
		    return cont
		} else {
		    return cont.value
		}
	    }
	}
    }
}

ur.getInherit = function (uri, predicate, inverse) {
    //log.debug("getInherit",uri,predicate,inverse)
    var uri = u.getURI(uri)
    var contents = []
    if (uri && $.type(predicate) === 'object' && predicate.termType === 'NamedNode') {
	if (ur.isState(uri) && !inverse) {
	    var elems = ur.stateToElems(uri)
	    if (elems && elems.e_entity && elems.e_entity != uri) {
		//log.debug(elems)
		return ur.getInherit(elems.e_entity,predicate,inverse)
		//	return ur.getContents(elems.e_entity)
	    }
	} else {
	    var subject
	    if (u.isBlankNode(uri)){
		subject = uri
	    } else {
		subject = $rdf.sym(uri)
	    }
	    var object
	    if (inverse){
		object = subject
		subject = null
	    }
	    var items = u.unique(rdfStore.match(subject, predicate, object))
	    if (items && items.length > 0) {
		items.forEach(function (i){
		    if (inverse){
			contents.push(i.subject)
		    } else {
			contents.push(i.object)
		    }
		})
		//log.debug("ur.getInherit result",contents)
		return contents
	    }
	}
    }
}

ur.getParentPod = function (uri){
    var up = ur.getSystemUp(uri)
    if (up && ur.isWebId(up)){
	return up
    } else {
	return ur.getInherit(uri, ns.ACL('owner')) || ur.getInherit(uri, ns.FRBR('owner'))
    }
}

ur.getParentPodLoad = async function (uri){
    if (u.checkURL(uri)){
	await store.dispatch("loadDataSet",{uri: uri, sentFrom: "util-rdf.getParentPodLoad"})
	return ur.getInherit(uri, ns.ACL('owner'))
    }
}

ur.getChildPod = function (uri){
    var uri = u.getURI(uri)
    var Final = []
    if (uri){
	var children = ur.getInherit(uri,ns.ACL('owner'),true)
	var owns = ur.getInherit(uri,ns.FRBR('owner'),true)
	var subs = ur.getContains(uri)
	if (!children){
	    children = []
	}
	if (Array.isArray(owns)){
	    children = children.concat(owns)
	}
	if (Array.isArray(subs)){
	    children = children.concat(subs)
	}
	//log.debug("getChildPod",{children: children, owns: owns})
	//make sure none of the children are children of the children
	if (children.length !== 0){
	    children = u.getURIs(children)
	    children.forEach(c => {
		var up = ur.getSystemUp(c)
		if (!up || !children.includes(up)){
		    Final.push(c)
		}
	    })
	}
	if (Final.length === 0){
	    Final = null
	}
	if (Array.isArray(Final)){
	    Final = u.unique(Final)
	}
	return Final
    }
}

ur.getContents = function (uri) {
    var uri = u.getURI(uri)
    if (uri){
	return ur.getInherit(uri, ns.LDP('contains'))
    }
}

ur.getContains = function (uri) {
    var uri = u.getURI(uri)
    if (uri){
	var c = ur.getInherit(uri, ns.SIO('SIO_000202'))
	if (!c){
	    c = ur.getInherit(uri, ns.DCTERMS('hasVersion'))
	}
	return c
    }
}

ur.getContainees = function (uri){
    var uri = u.getURI(uri)
    if (uri){
	var c = ur.getInherit(uri, ns.SIO('SIO_000202'), true)
	if (!c){
	    c = ur.getInherit(uri, ns.DCTERMS('hasVersion'), true)
	}
	return c
    }
}

ur.getLdpContainees = function (uri){
    var result = ur.getInherit(uri, ns.LDP('contains'), true)
    if (result){
	return u.getURIs(result)
    }	
}

ur.getAclOwner = function (uri){
    return ur.getInherit(uri, ns.ACL('owner'))
}

ur.getAclOwnee = function (uri){
    return ur.getInherit(uri, ns.ACL('owner'), true)
}

ur.getMember = function (uri){
    return ur.getInherit(uri, ns.VCARD('hasMember'))
}

ur.getMembee = function (uri){
    return ur.getInherit(uri, ns.VCARD('hasMember'), true)
}

/*
ur.getContents = function (uri) {
	var uri = u.getURI(uri)
	var contents = []
	if (uri) {
		if (ur.isState(uri)) {
			var elems = ur.stateToElems(uri)
			if (elems) {
				return ur.getContents(elems.e_entity)
			}
		} else {
			var items = rdfStore.match($rdf.sym(uri), $rdf.sym(ns.LDP('contains').value))
			if (items && items.length > 0) {
				items.forEach(i => contents.push(i.object.value))
				return contents
			}
		}
	}
}*/

/*
ur.getContentsNested = function (uri, recurse, Final) {
	var result = ur.getContents(uri)
	if (Final) {
		Final.push(uri)
	} else {
		Final = [uri]
	}
	if (!result || result.length === 0) {
		if (recurse && recurse.length > 0) {
			return ur.getContentsNested(recurse.pop(), recurse, Final)
		} else {
			return Final
		}
	} else {
		if (recurse) {
			recurse = recurse.concat(result)
		} else {
			recurse = result
		}
		return ur.getContentsNested(recurse.pop(), recurse, Final)
	}
	}*/

ur.getParentPodNested = function (uri){
    return ur.returnOnlyWebIds(ur.getInheritNested(uri,ur.getParentPod).reverse())
}

ur.getParentPodNestedLoad = async function (uri, load){
    if (u.checkURL(uri)){
	var pods = await ur.getInheritNestedLoad(uri,ur.getParentPod)
	if (Array.isArray(pods)){
	    return pods.reverse()
	}
    }
}

ur.getChildPodNested = function (uri){
    return ur.returnOnlyWebIds(ur.getInheritNested(uri,ur.getChildPod))
}

ur.getContentsNested = function (uri) {
	return ur.getInheritNested(uri, ur.getContents)
}

ur.getContainsNested = function (uri) {
	return ur.getInheritNested(uri, ur.getContains)
}

ur.getContaineesNested = function (uri) {
    var containees = ur.getInheritNested(uri, ur.getContainees)
    if (Array.isArray(containees) && containees.length > 0){
	return containees.reverse()
    } else {
	return []
    }
}

ur.getLdpContaineesNested = function (uri){
    var containees = ur.getInheritNested(uri, ur.getLdpContainees)
    if (containees){
	return containees.reverse()
    }
}

ur.getResourceUpHierarchy = function(item){
    var uri = u.getURI(item)
    if (uri){
	//log.debug("resourceUpHierarchy",uri)
	var podEntity
	if (u.isBlankNode(uri)){
	    podEntity = uri.pod
	} else {
	    ur.getWebId(uri)
	}
	var containees = ur.getContaineesNested(uri)
	//log.debug("containees",containees)
	var ldpees = []
	var subject
	if (u.isBlankNode(uri)){
	    subject = uri
	} else {
	    subject = $rdf.sym(uri)
	}
	var owners = rdfStore.match(subject,ns.ACL('owner'))
	if (Array.isArray(owners) && owners.length > 0){
	    owners.forEach((st) => {
		ldpees.push(st.object.value)
	    })
	}
	ldpees.push(podEntity)
	//log.debug("resources",containees,ldpees)
	if (Array.isArray(containees)){
	    containees.forEach((con) => {
		ldpees = ldpees.concat(ur.getLdpContaineesNested(con))
	    })
	}
	return u.unique(ldpees)
    }
}

ur.getEntityDownHierarchy = function(item){
    var uri = u.getURI(item)
    if (uri){
	//first check ldp hierarchy
	var ldps = ur.getContentsNested(uri)
	var last
	if (ldps){
	    //TODO!!!!
	}
    }
}

/*
ur.getTopPod = function(item){
    var uri = u.getURI(item)
    if (uri){
	*/
			      

ur.getInheritNested = function (uri, func, recurse, Final) {
    
    //log.debug('ur.getInheritNested',{uri: uri, func: func, recurse: recurse, Final: Final})
    if (Array.isArray(Final) && Final.includes(uri)){
	//log.debug("ur.getInheritNested result",Final)
	return Final
    } else if (Array.isArray(recurse) && recurse.includes(uri)){
	//log.debug("ur.getInheritNested result",Final)
	return Final
    } else {
	var result = func(uri) //ur.getContents(uri)
	
	//var uriExists = rdfStore.objectIndex["<" + uri + ">"]
	if (Final){ // && uriExists) {
	    Final.push(uri)
	} else { //if (uriExists){
	    Final = [uri]
	}
	if (!result || result.length === 0) {
	    if (Array.isArray(recurse) && recurse.length > 0) {
		return ur.getInheritNested(recurse.pop(), func, recurse, Final)
	    } else {
		//log.debug("ur.getInheritNested result",Final)
		return Final
	    }
	} else {
	    if (Array.isArray(recurse) && recurse.length > 0) {
		recurse = recurse.concat(result)
	    } else {
		recurse = result
	    }
	    if (!Array.isArray(recurse)){
		if (recurse){
		    recurse = [recurse]
		} else {
		    recurse = []
		}
	    }
	    return ur.getInheritNested(recurse.pop(), func, recurse, Final)
	}
    }
}

ur.getInheritNestedLoad = async function (uri, func, recurse, Final) {
    log.debug("inheritLoad",uri)
    if (!store.state.dataLoad.includes(uri)){
	await store.dispatch("loadDataSet",{uri: uri, sentFrom: "util-rdf.getInheritNestedLoad"})
    }
    var result = func(uri) //ur.getContents(uri)
    if (Final) {
	Final.push(uri)
    } else {
	Final = [uri]
    }
    if (!result || result.length === 0) {
	if (Array.isArray(recurse) && recurse.length > 0) {
	    var result2 = ur.getInheritNestedLoad(recurse.pop(), func, recurse, Final)
	    return result2
	} else {
	    return Final
	}
    } else {
	if (Array.isArray(recurse)) {
	    recurse = recurse.concat(result)
	} else {
	    recurse = result
	}
	var result3 = ur.getInheritNestedLoad(recurse.pop(), func, recurse, Final)
	return result3
    }
}

ur.getCollabObjects = function(uri, inverse){
    var uri = u.getURI(uri)//assume uri webid
    if (uri){
	var webid = ur.getWebId(uri)
	var trips
	var collabs = []
	if (webid){
	    if (inverse){
		trips = rdfStore.match(null,ns.NEO('m_collaborate-on'),$rdf.sym(uri))
	    } else {
		trips = rdfStore.match($rdf.sym(webid),ns.NEO('m_collaborate-on'))
	    }
	    //log.debug('getCollabs trips',trips,sentFrom)
	    if (Array.isArray(trips) && trips.length > 0){
		trips.forEach(trip => {
		    if ($.type(trip) === 'object'){
			var collab = trip.object
			if (collab){
			    collab = u.getURI(collab)
			    if (collab){
				collabs.push(collab)
			    }
			}
		    }
		})
	    }
	}
	return collabs
    }
}

ur.getCollaborators = function(uri, sentFrom, inverse){
    var uri = u.getURI(uri)//assume uri webid
    if (uri){
	var collabs = ur.getCollabObjects(uri, inverse)
	var webids = []
	var trips	    
	if (collabs.length > 0){
	    collabs.forEach(collab => {
		var cWebid = ur.getWebId(collab)
		//log.debug("collab cWebid",collab,cWebid)
		if (cWebid){
		    webids.push(cWebid)
		}
	    })
	}
	webids = u.unique(webids)
	//log.debug('collabs',collabs,webids,sentFrom)
	return webids
    }
}

ur.getCollaboratorsLoad = async function(uri){
    var uri = u.getURI(uri)//assume uri webid
    if (uri){
	var webid = await ur.loadWebId(uri)
	var collabs = []
	var webids = []
	if (webid){	
	    var trips = rdfStore.match($rdf.sym(webid),ns.NEO('m_collaborate-on'))
	    log.debug('getCollabsLoad trips',trips)
	    if (Array.isArray(trips) && trips.length > 0){
		trips.forEach(trip => {
		    if ($.type(trip) === 'object'){
			var collab = trip.object
			if (collab){
			    collab = u.getURI(collab)
			    if (collab){
				collabs.push(collab)
			    }
			}
		    }
		})
	    }	    
	    log.debug('collabsLoad',collabs)
	    if (collabs.length > 0){
		var toLoad = []
		collabs.forEach(co => {
		    co = u.getURI(co)
		    if (co && !store.state.dataLoad.includes(co)){
			toLoad.push(co)
		    } else if (co){
			webids.push(co)
		    }
		})
		if (toLoad.length > 0){
		    await Promise.all(toLoad.map(async (collab) => {
			const cWebid = await ur.loadWebId(collab)
			if (cWebid){
			    webids.push(cWebid)
			}               
		    }))
		}
		return webids
	    }
	}
    }
}

ur.getAllPodServers = function(uri){
    if (!uri){
	uri = store.state.webId
    }
    var uri = u.getURI(uri)
    var allPods = ur.getAllPods(uri)
    var obj = {}
    if (Array.isArray(allPods) && allPods.length > 0){
	allPods.forEach(pod => {
	    var serv = u.getPodServer(pod)
	    if (!obj[serv]){
		obj[serv] = []
	    }
	    obj[serv].push(pod)
	})
	return obj
    }
}

ur.getAllProjects = function(uri){
    if (!uri){
	uri = store.state.webid
    }
    var allPods = ur.getAllPods(uri)
    var projects = []
    if (Array.isArray(allPods) && allPods.length > 0){
	allPods.forEach(p => {
	    if (ur.isAconexProject(p) || ur.isPodProject(p)){
		projects.push(p)
	    }
	})
    }
    return projects
}

ur.getAllProjectsWip = function (uri){
    if (!uri){
	uri = store.state.webid
    }
    var allProjects = ur.getAllProjects(uri)
    var wip = []
    if (Array.isArray(allProjects) && allProjects.length > 0){
	allProjects.forEach(p => {
	    if (p.search(/wip/) > 0){
		wip.push(p)
	    }
	})
    }
    return wip
}

ur.getAllProjectsCde = function (uri){
    if (!uri){
	uri = store.state.webid
    }
    var allProjects = ur.getAllProjects(uri)
    var cde = []
    if (Array.isArray(allProjects) && allProjects.length > 0){
	allProjects.forEach(p => {
	    if (p.search(/cde/) > 0){
		cde.push(p)
	    }
	})
    }
    return cde
}

ur.getAllProjectsNotWipCde = function (uri){
    if (!uri){
	uri = store.state.webid
    }
    var allProjects = ur.getAllProjects(uri)
    var all = []
    if (Array.isArray(allProjects) && allProjects.length > 0){
	allProjects.forEach(p => {
	    if (p.search(/cde/) < 0 && p.search(/wip/) < 0){
		all.push(p)
	    }
	})
    }
    return all
}
			

ur.getAllPods = function(uri){
    if (!uri){
	uri = store.state.webId
    }
    var uri = u.getURI(uri)
    var children = []
    var collabs = []
    if (uri){
	var parents = ur.getJustTopParents(uri)
	if (Array.isArray(parents) && parents.length > 0){
	    parents.forEach(parent => {
		var c = ur.getChildPodNested(parent)
		if (c){
		    children = children.concat(c)
		}
	    })
	    if (children.length > 0){
		children = children.flat()
		children.forEach(child => {
		    var c = ur.getCollaborators(child)
		    if (c){
			collabs = collabs.concat(c)
		    }
		})
	    }
	    var all = u.unique(u.getURIs(children.concat(collabs)))
	    return all
	}
    }
}

ur.initializeLaunchpad = function (){
    var uri = store.state.webId
    uri = u.getURI(uri)
    if (uri){
	var membees = u.getURIs(ur.getMembeeNested(uri))
	if (Array.isArray(membees) && membees.length > 0){
	    $.map(membees, async function(m){
		if (!ur.getRequestNodes(m)){
		    await store.dispatch("loadDataSet",{uri: m, sentFrom: "ur.initializeLaunchpad", force: true})
		}
	    })
	}
	var all = ur.getAllPods(uri)
	if (Array.isArray(all) && all.length > 0){
	    $.map(all, async function(p){
		if (!ur.getRequestNodes(p)){
		    await store.dispatch("loadDataSet",{uri: p, sentFrom: "ur.initializeLaunchpad", force: true})
		}
	    })
	}
	return all
    }
}

ur.getJustTopParents = function(uri){
    var uri = u.getURI(uri)
    var parents
    if (uri){
	var topParents = ur.getTopParents(uri)
	parents = []
	if (Array.isArray(topParents) && topParents.length > 0){
	    topParents.forEach(top => {
		parents.push(top[0])
		})
	    }
	parents = u.unique(parents)
    }
    if (Array.isArray(parents) && parents.length > 0){
	return parents
    }
}

ur.returnOnlyWebIds = function (items){
    if (Array.isArray(items)){
	return items.filter((item) => ur.maybeWebId(item))
    } else if (ur.maybeWebId(items)){
	return items
    }
}
	

ur.getTopParents = function (uri){
    var membees = ur.getMembeeNested(uri)
    var collabs = ur.getCollaborators(uri)
    var pods = []
    var leafs = []
    var result = []
    if (collabs && Array.isArray(collabs) && collabs.length > 0){
	if (Array.isArray(membees)){
	    membees = u.unique(membees.concat(collabs))
	} else {
	    membees = collabs
	}
    }
    if (Array.isArray(membees)){
	var up
	var down
	membees = u.getURIs(membees)
	membees.forEach((m) => {
	    up = u.getURIs(ur.getParentPodNested(m))
	    down = u.getURIs(ur.getChildPodNested(m))
	    //get all the pods, then determine the leafs, then vector up from each leaf
	    pods = pods.concat(up)
	    pods = pods.concat(down)
	    pods.push(m)
	    //pods = pods.concat(membees)
	    //log.debug({uri: uri, membees: membees, collabs: collabs, up: up, down: down, pods: pods})
	})
	pods = u.unique(u.getURIs(ur.returnOnlyWebIds(pods)))
	
	if (Array.isArray(pods)){
	    pods.forEach((p) => {
		if (ur.maybeWebId(p)){
		    if (ur.getParentPod(p)){
			//ignore
		    } else {
			leafs.push(p)
		    }
		}
	    })
	    //log.debug("leafs", leafs)
	    if (Array.isArray(leafs)){
		leafs.forEach((l) => {
		    result.push(u.getURIs(ur.returnOnlyWebIds(ur.getParentPodNested(l))))
		})
	    }
	    log.debug("ur.getTopParents",{uri: uri, membees: membees, collabs: collabs, up: up, down: down, pods: pods, leafs: leafs, result: result})
	    return result
	}
    }
}

/*
	    log.debug({m: m, up: up, down: down})
	    if (up[0] === down[0] && up.length !== 1){
		//ignore this one
	    } else {
		if (up.length > down.length){
		    result.push(up)
		} else {
		    result.push(down)
		}
	    }
	})
	return u.unique(result)
    }
}*/

ur.getTopParentsLoad = async function (uri){
    var membees = ur.getMembeeNested(uri)
    var result = []
    if (Array.isArray(membees)){
	membees.forEach(async function(m){
	    var parents = await ur.getParentPodNestedLoad(m)
	    result.push(parents)
	})
	return result
    }
}


ur.getMembeeNested = function (uri, load){
    return ur.getInheritNested(uri, ur.getMembee, load)
}

ur.getMemberNested = function (uri){
    return ur.getInheritNested(uri, ur.getMember)
}

ur.hasContainedItems = function (uri) {
	var uri = u.getURI(uri)
	if (uri) {
	    const items = u.unique(rdfStore.match($rdf.sym(uri), $rdf.sym(ns.LDP('contains').value)))
		return (items && items.length > 0)
	} else {
		return false
	}
}

ur.hasContainItems = function (uri) {
	var uri = u.getURI(uri)
	if (uri) {
	    const items = u.unique(rdfStore.match($rdf.sym(uri), $rdf.sym(ns.NEO('m_contains').value)))
		return (items && items.length > 0)
	} else {
		return false
	}
}

ur.getAllContainers = function (item, results) {
	//log.debug("getAllContainers",item,results)
	if (!results) {
		results = []
	}
	item = u.getURI(item)
	if (item) {
		//await ur.aLoadNode(item)
		if (ur.containerP(item) && $.inArray(item, results) === -1) {
			results = results.concat(item)
		}
		var cont = ur.getContainer(item)
		if (cont) {
			results = results.concat(cont.uri)
			return ur.getAllContainers(cont, results)
		} else {
			return $.grep(results, function (r) { return r !== undefined }).reverse()
		}
	} else {
		return $.grep(results, function (r) { return r !== undefined }).reverse()
	}
}

ur.getContentsCached = function (item) {
	var URI = u.getURI(item)
	var stuff = rdfStore.each($rdf.sym(URI), ns.LDP('contains'))
	if (stuff) {
		return u.unique(stuff);
	}
}


ur.isContains = function (item){
    var uri = u.getURI(item)
    if (uri){
	if (ur.getContains(uri)){
	    return true
	} else {
	    return false
	}
    }
}

ur.qLastModifier = function (item) {
	return store.state.webId;
}

ur.qModifiedTime = function (item) {
	var uri = u.getURI(item)
	//log.debug("cid",uri,cid)
	if (uri) {
	    var modifiedTime = u.unique(rdfStore.match($rdf.sym(uri), ns.POSIX("ctime")))
		if (modifiedTime && modifiedTime.length > 0) {
			if (modifiedTime[0].object) {
				return new Date(modifiedTime[0].object.value).toLocaleString();
			}
		}
	}
}

ur.qCollaborators = function (item) {
	var num = Math.floor(Math.random() * Math.floor(5));
	var collaborators = new Array();
	for (let i = 0; i < num; i++) {
		collaborators.push(store.state.webId);
	}
	return collaborators;
}

ur.getTag = function (item) {
	var uri = u.getURI(item)
	if (uri) {
	    var tag = u.unique(rdfStore.match($rdf.sym(uri), ns.NEO('m_tag')))
		if (tag.length > 0) {
			return tag[0].object.value
		}
	}
}

ur.getFTag = function (item) {
    var uri = u.getURI(item)
    if (uri) {
	var tag = rdfStore.anyStatementMatching($rdf.sym(uri), neo.f_tag)
	if (tag) {
	    return tag.object.value
	}
    }
}


ur.rankConcepts = function (items) {
	//filter out concepts that don't have properties
	var concepts = []
	if ($.type(items) === "array") {
		items.forEach(function (i) {
			if (ur.isConcept(i)) {
				if (q.rank(i)) {
					concepts.push(i)
				}
			}
		})
		var rankIt = function (a, b) {
			var rankA = q.rank(a)
			var rankB = q.rank(b)
			if (rankA === 100) {
				//log.debug("no ranking",a)
			}
			if (rankB === 100) {
				//log.debug("no ranking",b)
			}
			return rankA - rankB
		}
		var sorted = concepts.sort(rankIt)
		return sorted
	}
}

ur.getCID = function (item, recurse) {
	//if item is not a concept, return cid of type for the item
	//for now, highest ranked type wins
	//log.debug("CID 1",item)
	var uri = u.getURI(item)
	if (ur.isConcept(uri)) {
		//log.debug("CID",uri)
	    var cid = u.unique(rdfStore.match($rdf.sym(uri), $rdf.sym(ns.NEO('m_cid').value)))
		//log.debug("cid",uri,cid)
		if (cid && cid.length > 0) {
			if (cid[0].object) {
				return cid[0].object.value
			}
		} else if (item.includes("http://www.w3.org/ns/iana/media-types/")){
		    return "a_file"
		}
	} else if (!recurse){
	    var Type = ur.getType(uri,true)
		if (Type) {
		    return ur.getCID(Type, true)
		}
	}
}

ur.getType = function (item, direct) {
	var uri = u.getURI(item)
	if (uri) {
	    var types = ur.getTypes(uri,direct)
	    if (Array.isArray(types)) {
		if (types.includes(ns.EVENT('Event').value)){
		    return ns.EVENT('Event').value
		} else {
		    var ranked = ur.rankConcepts(types)
		    if ($.type(ranked) === "array") {
			if (ranked && ranked.length > 0) {
			    return ranked.reverse()[0]
			}
		    }
		}
	    }
	}
}

ur.getText = function (item){
    var uri = u.getURI(item)
    if (uri){
	var text = rdfStore.match($rdf.sym(uri),ns.SCHEMA('text'))
	if (Array.isArray(text)){
	    text = u.unique(text)
	}
	//grab just first one for now
	if (Array.isArray(text) && text.length > 0){
	    var literal = text[0].object
	    if ($.type(literal) === 'object'){
		return literal.value
	    }
	}
    }
}

ur.getLabel = function (item, noLabel) {
    //right now only takes URL string - TODO all things - add names
    var label
    var uri = u.getURI(item)
    if ($.type(item) === "object" && !u.isBlankNode(item)){ // && !client.isThing(item)) { //for $rdf nodes
	/*if (u.isDataset(item)) {//new solid-client
	    label = ur.getLabel(u.getURI(item))
	    } else */
	if (item.termType === "BlankNode"){
	    label = item.value;
	} else if (item.termType === "NamedNode") {
	    label = ur.getLabel(item.value);
	} else if (item.termType === "Literal") {
	    var val = decodeURIComponent(item.value);
	    if (val.substr(0, 1) === '"' && val.substr(val.length - 1, 1) === '"') {
		label = val.substr(1, val.length - 2);
	    } else {
		label = val;
	    }
	} else if (item.title) {
	    label = item.title
	} else {
	    label = item.value;
	}
    } else if ($.type(item) === "array") {
	return $.map(item, function (it) {
	    label = ur.getLabel(it)
	})
    } else {
	var orig = item
	item = u.getURI(uri);
	if (item) {
	    var thing
	    if (u.isBlankNode(item)){
		thing = item
	    } else {
		thing = $rdf.sym(item)
	    }
	    //log.debug("getLabel",item,thing,orig)

	    var title = u.unique(rdfStore.match(thing, ns.DCTERMS('title')))
	    var labels = u.unique(rdfStore.match(thing, ns.RDFS('label')))
	    //rdfStore.match($rdf.sym(item), ns.RDFS('label'))
	    var fn = u.unique(rdfStore.match(thing, ns.VCARD('fn')))
	    var name = u.unique(rdfStore.match(thing, ns.FOAF('name')))
	    var tag = u.unique(rdfStore.match(thing, ns.NEO('m_tag')))
	    var ftag = u.unique(rdfStore.match(thing, ns.TAG('tag')))
	    var cid = u.unique(rdfStore.match(thing, ns.NEO('m_cid')))
	    var path = u.unique(rdfStore.match(thing, ns.URI4URI('path')))
	    //log.debug("getLabel",labels,fn,name
	    if (title.length > 0) {
		label = ur.getLabel(title[0].object)
	    } else if (labels.length > 0) {
		//TODO search for default language - use en now
		var result = []
		$.map(labels, function (label) {
		    if (label.object.language === "en" || label.object.language === "") {
			result.push(label.object)
		    }
		})
		if (result.length > 0) {
		    label = ur.getLabel(result[0])
		} else {
		    label = ur.getLabel(labels[0].object);
		}
	    } else if (fn.length > 0) {
		label = ur.getLabel(fn[0].object);
	    } else if (name.length > 0) {
		label = ur.getLabel(name[0].object);
	    } else if (ftag.length > 0){
		label = ur.getLabel(ftag[0].object)
	    } else if (tag.length > 0) {
		//urldecode for file/containers
		//return decodeURIComponent(ur.getLabel(tag[0].object))
		label = ur.getLabel(tag[0].object)
	    } else if (cid.length > 0) {
		label = ur.getLabel(cid[0].object)
	    } else if (path.length > 0){
		label = decodeURIComponent(path.split("/").reverse())
	    } else {
		var types = ur.getTypes(item)
		if (Array.isArray(types)){
		    if (types.includes(ns.SIO('SIO_000114').value)){
			//label = "Word: "
			var text = ur.getText(item)
			if (text){
			    label = text
			}
		    } else if (types.includes(ns.SIO('SIO_000110').value)){
			//label = "UoT: "
			var text = ur.getText(item)
			if (text){
			    label = text
			}
		    } else if (types.includes(ns.EVENT('Event').value)){
			label = "Event: " + u.getId(item)			
		    } else if (types.includes(ns.FABIO('Page').value)){
			label = "Page: " + u.getId(item)
		    } else if (types.includes(ns.SIO('SIO_000112').value)){
			label = "Capability: " + u.getId(item)
		    } else if (item.search("/i$")){
			return item
		    } else if (!noLabel){
			return u.getId(item)
		    }
		} else if (item.search("/i$")){
		    return item
		} else if (!noLabel){
		    return u.getId(item)
		}
	    }
	}
    }
   /* if (ur.isContainer(item)){
	var Final = ur.getTag(ur.getWebId(item)) + ": " + label
	return Final
    } else {*/
	return label
   // }
}


ur.getTypes = function (item, direct) {
    //Type inheritance:  Only direct types recognized and then predication inherited through the entire hierarchy of classes/predications linked to via type
    //If item does not have a direct type, use subproperty or subclass hierarhcy recursively to find direct type - recursive type search better handled on server.
    var URI;
    var result = []
    var types = []
    var isBlank = u.isBlankNode(item)
    if ($.type(item) === "array") {
	return item.forEach(thing => {
	    return ur.getTypes(thing)
	})
    } else {	    
	URI = u.getURI(item);
	if (typeof(URI) === 'string' || isBlank) {
	    var subject
	    if (isBlank){
		subject = URI
	    } else {
		subject = $rdf.sym(URI)
	    }
	    if (direct){
		var aTypes = u.unique(rdfStore.match(subject,$rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")))
		if (Array.isArray(aTypes) && aTypes.length > 0){
		    aTypes.forEach(t => {
			var g = t.graph
			if (g && u.getURI(g.value)){
			    types.push(t.object.value)
			}
		    })
		    return types
		}
	    } else {
		var hTypes = ur.parseLinkHeader(URI).type
		var webid = ur.getWebId(URI)
		if (hTypes && webid !== URI){
		    return hTypes
		} else {
		    var rTypes = u.unique(rdfStore.match(subject,$rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")))
		    if (rTypes && rTypes.length > 0) {
			/*if (thing) {
			  var tTypes = client.getTermAll(thing, u.uriToNamedNode(ns.RDF('type').value))
			  if (tTypes.length > 0) {
			  result = $.map(tTypes, function (tType) {
			  return tType.value;
			  })
			  }
			  }*/
			//if (rTypes.length > 0) {
			var rResult = $.map(rTypes, function (q) {
			    var g = q.graph
			    if (g && !u.isBlankNode(g)){
				return q.object.value
			    }
			})
			if (rResult) {
			    result = result.concat(rResult)
			}
			//	}
			/*if (!stateOnly || !isBlank) {
			  var types = ur.parseLinkHeader(URI).type
			  //ds.internal_resourceInfo.linkedResources.type
			  }*/
			//result = result.concat(types)
			//log.debug("ur.getTypes",URI,result)
			return u.unique(result.filter(Boolean));
		    }
		}
	    }
	}
    }
}

/*
ur.what = function (predicate, item) {
	if ($.type(item) === "object") {
		if (client.isThing(item)) { //client thing
			return client.getTermAll(item, predicate)
		} else if (u.isDataset(item)) { //dataset
			return $.unique(
				$.map(client.getThingAll(item), function (thing) {
					return ur.what(predicate, thing)
				})
			)
		}
	}
}*/

ur.getEntities = function (items, eType) {
	if (Array.isArray(items)) {
		return items.forEach(function (i) {
			return ur.getEntity(i, eType)
		})
	}
}

ur.getEntity = function (item, eType) {
	//eType as string
	var result
	var noType
	var uri = u.getURI(item)
	var eTypeUri = u.getURI(eType)
	var finished = []
	if (ur.isState(item)) {
		result = [ur.stateToElems(item).e_entity]
	} else if (ur.isAttribute(item)) {
		var a_result = ur.attributeToElems(item).a_result
		if (a_result && a_result.termType === "NamedNode") {
			result = [a_result]
		} else {
		    var ents = u.unique(rdfStore.match($rdf.sym(uri), ns.NEO("i_attribute")))
			if (ents) {
				var objs = ents.forEach(function (e) {
					return e.object
				})//returns states
				if (objs) {
					result = ur.getEntities(u.unique(objs))
				}
			}
		}
	} else {
		if ($.type(item) === "object") {
			if (!eType) {
				result = [item]
			}/* else if (u.isDataset(item)) { //dataset
				result = client.getThingAll(item)
			}*/ else {
				result = [item]
			}
		} else {
			result = [item]
		}
	}
	if (eType && result) {
		$.map(result, function (thing) {
			if ($.inArray(eTypeUri, u.getURIs(ur.getTypes(thing))) > -1) {
				finished.push(thing)
			}
		})
		return finished
	} else {
		return result
	}
}

ur.getRange = function (item) {
	var URI;
	if ($.type(item) === "object") { //for $rdf nodes
		if (item.termType === "NamedNode") {
			URI = item.uri;
		}
	} else {
		URI = u.getURI(item);
	}
	if (URI) {
		var range = rdfStore.each($rdf.sym(URI), ns.RDFS('range')) //, null, "ontology");
		if (range.length > 0) {
			var result = $.map(range, function (Type) {
				return Type.value;
			});
			if (result) {
				return u.unique(result);
			}
		}
	}
}

ur.getInverse = function (property) {
	//assumes property already loaded
	if ($.type(property) === "object" && property.termType === "NamedNode") {
		prop = property;
	} else {
		var prop = $rdf.sym(u.getURI(property));
	}
	if (prop) {
		var result;
		$.map([rdfStore.any(null, ns.OWL('inverseOf'), prop), //, "ontology"),
		rdfStore.any(prop, ns.OWL('inverseOf'), null), //, "ontology"),
		rdfStore.any(null, ns.OWL('inverse'), prop), //, "ontology"),
		rdfStore.any(prop, ns.OWL('inverse'), null)], //, "ontology")],
			function (term) {
				if (term) {
					result = term;
				}
			});
		return result;
	}
}


ur.getNsTerm = function (item, NS) {
	//supports both https and http ontologies
	var uri = u.getURI(item);
	if (!NS) {
		NS = ur.getNamespace(uri);
	}
	if (NS) {
		var puri = URI.parse(uri);
		var pNS = URI.parse(ns[NS]().uri);
		puri.scheme = "http"
		uri = URI.serialize(puri)
		pNS.scheme = "http"
		return uri.replace(URI.serialize(pNS), "");
	}
}

ur.getGmxLoad = function (item) {
	var uri = u.getURI(item)
	var podRoot = store.state.storage
	if (podRoot) {
		var parse = URI.parse(podRoot)
		podRoot = parse.scheme + "://" + parse.host
		var ports = [80, 443, undefined]
		if (!ports.includes(parse.port)) {
			podRoot = podRoot + ":" + parse.port
		}

	} else {
		podRoot = store.state.brain
	}
	if (uri) {
		var redirect = store.state.dataRedirect[uri]
		if (redirect) {
			uri = redirect
		}

		/*if (ur.isConcept(uri) || uri.search("https://trinity.graphmetrix.net") > -1) { //digital twin for now
			return podRoot + "/ns/" + encodeURIComponent(uri)
		} else {*/
			return uri
		//}
	}
}

/*
ur.getGmxSolid = function (item, api) {
  if (item && api) {
  var uri = u.getURI(item);	
  if (uri) {
	  if (ur.isConcept(uri)){
	  return store.state.brain + api + encodeURIComponent(uri)
	  } else {
	  return uri
	  }
  }
  }
}


	  // && URI.match("http:") - need to accept https ontologies as well
	  var NS = ur.getNamespace(uri);
	  //log.debug("getGmxSolid NS",NS)
	  if (NS && NS !== "U1") {
	  var Term = ur.getNsTerm(uri, NS);
	  //log.debug("getGmxSolid Term",Term)
	  if (Term) {
		  // if (config.logServerAndBrain) log.debug("config.brain:" + store.state.brain);
		  return store.state.brain + api + NS + "/" + Term;
		  //}
	  } else {
		  return u.removeURIfragment(uri);
	  }
	  } else {
	  return u.removeURIfragment(uri);
	  }
  }
  }
}*/

ur.getNamespace = function (item) {
	//allows matching of either https or http for an ontology
	var uri = u.getURI(item);
    var pod = store.state.pod
    //log.debug("ur.getNamespace",item)
    if (u.checkURL(uri)) {
		var URIp = URI.parse(uri);
		var NS;
		if (URIp) {
			var uriPort = URIp.port;
			if (!uriPort) {
				uriPort = "";
			} else {
				uriPort = ":" + uriPort;
			}
			var uri2 = URIp.host + uriPort + URIp.path;
			//log.debug("ur.getNamespace",uri2)
			$.map(Object.keys(nu), function (key) {
				var ontURI = u.getURI(ns[key]());
				if (ontURI) {
					var OntP = URI.parse(ontURI)
					if (OntP) {
						var ontPort = OntP.port;
						var ontFrag = OntP.fragment;
						if (!ontPort) {
							ontPort = ""
						} else {
							ontPort = ":" + ontPort;
						}
						if (!ontFrag) {
							ontFrag = ""
						}
						var ontology = OntP.host + ontPort + OntP.path + ontFrag;
						//log.debug("ur.getNamespace",ontology,uri2)
						if (uri.match(ontology)) {

							NS = key;
						}
					}
				}
			})
			if (NS && NS !== "U1") {
				return NS;
			} else if (!uri.match(pod)) {
				//log.info("*** MISSING Namespace", uri);
			}
		}
	}
}

ur.dataP = function (item) {
	//returns true if item is part of user's pod data
	var uri = u.getURI(item)
	var NS = ur.getNamespace(uri)
	if (!NS || NS === "U1") {
		return true
	} else {
		return false
	}
}

ur.propertyP = async function (prop) {
	prop = u.getURI(prop)
	if (prop) {
		await ur.aLoadNode(prop)
		var types = ur.getTypes(prop)
		if ($.inArray(ns.OWL('DatatypeProperty').uri, types) > -1) {
			return true
		} else {
			return false
		}
	}
}

ur.getDataProperties = async function (item) {
	//given a class or property, return all data properties
	item = u.getURI(item)
	if (item) {
		await ur.aLoadNode(item)
		var props = rdfStore.each(null, ns.RDFS('domain'), $rdf.sym(item))
		if (props) {
			return $.map(u.unique(props), function (prop) {
				if (ur.dataPropertyP(prop)) {
					return prop
				}
			})
		}
	}
}

ur.getPropCategory = function (item) {
	var URI = u.getURI(item)
	if (URI) {
		var categories = [["annotations", ns.OWL('AnnotationProperty')],
		["properties", ns.OWL('DatatypeProperty')],
		["relationships", ns.OWL('ObjectProperty')],
		["unknown", ns.RDF("Property")]]
		var types = ur.getTypes(URI)
		var Category
		$.map(categories, function (category) {
			$.map(types, function (type) {
				if (!Category && category[1].value === type) {
					Category = category
				}
			})
		})
		if (Category) {
			return Category
		} else {
			return ["unknown", ns.RDF("Property")]
		}
	}
}

ur.cleanURI = function (item) {
	//primarily to remove double // in container names for solid
	item = u.getURI(item)
	if (item) {
		if (item.substr(item.length - 1) === "/") {
			item = item.substr(0, item.length - 1)
		}
		var rx = /[^:]\/{2}/g
		return item.replace(rx, item.substr(item.search(rx), 1) + "/")
	}
}

ur.superCleanURI = function (item) {
	var clean = ur.cleanURI(item)
	if (clean) {
		return clean.replace(/[^\w\s]/gi, '')
	}
}

ur.triplesToTable = function (triples) {
	if (triples) {
		var objects = {}
		var columns = {}
		$.map(triples, function (triple) {
			var subject = triple.subject
			var eVal = objects[subject.value]
			if (eVal) {
				objects[subject.value] = eVal.concat([triple])
			} else {
				objects[subject.value] = [triple]
			}
			var predicate = triple.predicate
			if (!columns[predicate.value]) {
				columns[predicate.value] = predicate
			}
		})
		var fields = []
		var items = []
		$.each(objects, function (obj, props) {
			var row = {}
			$.map(props, function (prop) {
				var key = prop.predicate.value
				row[key] = ur.renderObj(prop)
				if (key === ns.RDF('type').uri) {
					row.type = prop.object.value;
				}
			})
			items.push(row)
		})
		$.each(columns, function (pred, obj) {
			var col = {}
			col.key = pred
			col.label = ur.getLabel(pred)
			col.sortable = true
			if (pred === ns.RDF('type').uri) {
				col.class = 'typeClass';
			}
			if (pred === ns.FOAF('name').uri) {
				col.class = 'nameClass';
			}
			fields.push(col)
		})


		return { fields: fields, items: items }
	}
}

ur.renderObj = function (statement) {
	if (statement && $.type(statement) === "object") {
		var prop = statement.predicate
		var object = statement.object
		//log.debug("renderObj",statement,prop,object)
		if (statement.inverse) {
			object = statement.subject
		}
		if (object && $.type(object) === "object") {
			if (object.termType === "NamedNode") {
				return ur.getLabel(object.value)
			} else {
				if (ur.htmlP(prop)) {

					var val = object.value.replace(/<(?:.|\n)*?>/gm, '');
					if (val.length > 65) {
						val = val.substr(0, 40) + "..."
					}
					return val
				} else {
					/*if (u.getURI(statement.predicate) === ns.NEO('m_tag').value) {
						return decodeURIComponent(object.value)
					} else {*/
					return object.value;
					//	}
				}
			}
		}
	}
}

ur.htmlP = function (prop) {
	if ($.type(prop) === "string") {
		prop = u.getURI(prop)
		if (prop) {
			prop = $rdf.sym(prop)
		}
	}
	if ($.type(prop) === "object") {
		if ($.inArray(ns.RDF('HTML').value, ur.getRange(prop)) > -1) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}

ur.getStatements = function (item, NS, term) {
	var uri = u.getURI(item)
    return u.unique(rdfStore.match($rdf.sym(uri), ns[NS](term), null, 'statements'))
}

ur.dataHeadCheck = async function (uri, origUri, ds, forceHead) {
    if (($.inArray(uri, store.state.headLoad) === -1 ||
	 $.inArray(origUri, store.state.headLoad) === -1) ||
	forceHead
	//&& !ur.isConcept(origUri)
       ) {
	store.commit("queueHead", uri)
	//log.debug("ur.dataHeadCheck",uri,origUri,ds,forceHead)
	var redirectUri
	var redirectDs
	var redirectEtag
	var appAuthReq
	var current
	var eTag
	var status
	var notFound
	var expired
	var xPoweredBy
	var dsUri
	var dsEtag
	//check that ds is up to date - first make sure its been more than 5 secs since last check
	var lastHead = store.state.lastHead[uri]
	if (lastHead) {
	    expired = (Date.now() - lastHead) > 7000
	}
	//log.debug("lastHead", uri,Date.now(),lastHead,expired)
	if (!lastHead || expired === true || forceHead) { // || $.inArray(origUri,store.state.dataLoad) === -1){
	    try {
		store.commit('queueDataSet', origUri)
		store.commit('lastHead', uri)
		var dsHead = await window.solid.session.fetch(uri, { credentials: 'include', method: 'HEAD' })
		if (dsHead) {
		    
		    eTag = dsHead.headers.get('eTag')
		    xPoweredBy = dsHead.headers.get('x-powered-by')
		    status = dsHead.status
		    log.debug("dsHead", dsHead, eTag)
		    appAuthReq = dsHead.headers.get('App-Authorization-Required')
		    
		    if (xPoweredBy) {
			store.commit('xPoweredBy', xPoweredBy)
		    }
		    if (dsHead.redirected) {
			redirectUri = dsHead.url
			redirectDs = store.state.dataSets[redirectUri] //rdfStore.whyIndex[$rdf.sym(redirectUri)]
			//redirectEtag = store.state.eTags[ur.getSourceUrl(redirectDs)]
			store.commit('dataRedirect', { from: origUri, to: redirectUri })
			store.commit('heads', {eTag: eTag, uri: redirectUri})
		    } else {
			store.commit('heads', {eTag: eTag, uri: uri})
		    }
		    if (status === 401 && appAuthReq) {
			window.location.href = appAuthReq + '&redirect_uri=' + window.location.href
		    } else if (status !== 401) {
			/*if (ds){ //ds = last eTag for that request
			  dsUri = store.state.heads[ds] //ur.getSourceUrl(ds)
			  dsEtag = ds //store.state.eTags[dsUri]
			  }*/
			current = (ds && eTag === ds ||
				   redirectDs === eTag )
			if (!current) {
			    log.debug("Updating out of sync ds", eTag)
			} else {
			    store.commit('dequeueDataSet', origUri)
			}
		    }
		} else {
		    notFound = true
		    store.commit('dataNotFound', origUri)
		}
		var result = {
		    current: current, redirectUri: redirectUri,
		    redirectDs: redirectDs, dsHead: dsHead,
		    eTag: eTag, notFound: notFound, xPoweredBy: xPoweredBy,
		    status: status, appAuthReq: appAuthReq

		}
		//log.debug("dataHeadCheck",result)
		return result
	    } catch (e) {
		log.error(e)
		log.debug("Head not found - dequeueing")
		store.commit('dataNotFound', origUri)
		store.commit('dequeueDataSet', origUri)
		store.commit('dequeueHead', uri)
		var result = {
		    current: current, redirectUri: redirectUri,
		    redirectDs: redirectDs, dsHead: dsHead,
		    eTag: eTag, notFound: true, xPoweredBy: xPoweredBy
		}
		return result
	    }
	} else {
	    store.commit('dequeueHead', uri)
	    var result = {
		current: true, redirectUri: redirectUri,
		redirectDs: redirectDs, dsHead: dsHead,
		eTag: eTag, notFound: notFound, xPoweredBy: xPoweredBy
	    }
	    return result
	}
    } else {
	return {}
    }
}

ur.getNodeColor = function (node) {
    var nodeColor = "#6c757d"
    var cid = ur.getCID(node)
    var types = ur.getTypes(node)
    if (types){
	if (cid) {
	    
	    var firstLetter = cid.charAt(0);
	    if (cid === 'p_process'){
		firstLetter = 'e'
	    }
	    var cidColor = store.state.nodeColors[firstLetter]
	    if (cidColor) {
		nodeColor = cidColor
	    } else {
		nodeColor = "#003b00"
	    }
	} else {
	    nodeColor = "#bbb9ff"
	}
    }
    return nodeColor
}

ur.getWebId = function (uri) {
    var uri = u.getURI(uri)
    if (uri){
	var cardUri = u.getCard(uri);
	if (cardUri){
	    var statements = rdfStore.match($rdf.sym(cardUri), ns.FOAF('primaryTopic'))
	    if (Array.isArray(statements) && statements.length > 0){
		var state = statements[0]
		if ($.type(state) === 'object' && state.object){
		    return state.object.value;
		}
	    }
	}
    } 
}

ur.isWebId = function (uri){
    var webid = ur.getWebId(uri)
    if (webid && webid === uri){
	return true
    } else {
	return false
    }
}

ur.maybeWebId = function (uri){
    var uri = u.getURI(uri)
    var check = false
    if (uri){
	if (ur.isWebId(uri)){
	    check = true
	} else if (typeof(uri) === 'string' && uri.search("/i$|/profile/card#.*") > 0){
	    check = true
	}
    }
    return check
}

ur.guessWebId = function (uri){
    var webid = ur.getWebId(uri)
    if (webid){
	return webid
    } else {
	var base = u.getBaseURI(uri)
	if (base){
	    return base + "/i"
	}
    }
}

ur.maybeWebIdSysRelation = function(uri){
    //where uri and sys related uri are both webids in both directions
    var uri = u.getURI(uri)
    var check = false
    if (uri){
	if (ur.maybeWebId(uri)){
	    return true
	}
    }
}

ur.loadWebId = async function (uri){
    return ur.fetchWebId(uri)
}

ur.validateWebId = async function (item) {
    var uri = u.getURI(item)
    var valid = false
    if (uri){
	var card = u.getCard(uri)
	var webid = ur.getWebId(card)
	
	if (webid){
	    webid = $rdf.sym(uri)
	    if (rdfStore.anyStatementMatching(webid, ns.LDP("inbox"))
		&&
		rdfStore.anyStatementMatching(webid, ns.SOLID("oidcIssuer"))
		&&
		rdfStore.anyStatementMatching(webid, ns.SPACE("storage"))
	       ){
		valid = true
	    }
	}
	if (!valid){
	    try {	    
		var dsStore = new $rdf.graph()
		var resp = await fetch(card,{headers: {accept: "text/turtle"}})
		var text = await resp.text()
		if (typeof(text) === 'string'){
		    await $rdf.parse(text,dsStore,card)
		    if (!webid){
			var st = dsStore.anyStatementMatching($rdf.sym(card), ns.FOAF('primaryTopic'))
			if (st){
			    webid = st.object
			}
		    }
		    if (webid &&
			dsStore.anyStatementMatching(webid, ns.LDP("inbox"))
			&&
			dsStore.anyStatementMatching(webid, ns.SOLID("oidcIssuer"))
			&&
			dsStore.anyStatementMatching(webid, ns.SPACE("storage"))
		       ){
			dsStore.removeMatches()
			valid = true;
		    } else {
			dsStore.removeMatches()
		    }
		} else {
		    dsStore.removeMatches()
		}
	    } catch (err) {
		log.debug(err);
		return false;
	    }		
	} 	
    } 
    return valid
}

ur.getParentWebId = function (uri){
    var uri = u.getURI(uri) //to convert node (or anything convertible) to uri
    if (uri){
	var webid = ur.getWebId(uri)
	if (ur.isAconexProject(webid)){
	    return ur.getSubject(webid,neo.f_interface)
	//check if a parent
	} else if (ur.isParentPod(uri) || !ur.isChildPod(uri)){
	    return ur.getWebId(uri)
	} else {
	    if (u.checkURL(webid)){
		//use the query to determine if that webid has a parent
		//the parents of a project are found with:
		const parent = u.unique(rdfStore.match(
		    $rdf.sym(webid),//child
		    ns.ACL('owner'),//predicate - determines the parent/child relation
		    null));//parent

		//log.debug("parent",parent);
		if ( Array.isArray(parent) && parent.length >= 1) {
		    return parent[0].object.value//take the first one and the .object value to get the parent
		} /*else {
		    return undefined
		    }*/
	    }
	}
    }
}

ur.getChildWebId = function (uri){
    var uri = u.getURI(uri) //to convert node (or anything convertible) to uri
    if (uri){
	var webid = ur.getWebId(uri)
	//check if a child
	if (ur.isChildPod(webid)){
	    return webid
	} else {
	    return null
	}
    }
}

ur.getPodChildren = function (item){
    var children = []
    var podOwners = ur.getPodOwners(item)
    if (podOwners && Array.isArray(podOwners)){
	podOwners.forEach((pod) => {
	    if ($.type(pod) === 'object' && $.type(pod.subject) === 'object'){
		children.push(pod.subject.value)
	    }
	})
    }
    var podMembers = ur.getPodMembers(item)
    if (podMembers && Array.isArray(podMembers)){
	podMembers.forEach((pod) => {
	    if ($.type(pod) === 'object' && $.type(pod.object) === 'object'){
		var child = pod.object.value
		if (ur.isChildPod(child)){
		    children.push(child)
		}
	    }
	})
    }
    //log.debug("getPodChildren",children)
    return u.unique(children)
}

ur.getPodParents = function (item){
    var parents = []
    var webid = ur.getWebId(item)
    if (webid && ur.isParentPodCapable(webid)){
	parents.push(webid)
    }
    var podOwners = ur.getPodOwners(item)
    if (podOwners && Array.isArray(podOwners)){
	podOwners.forEach((pod) => {
	    if ($.type(pod) === 'object' && $.type(pod.object) === 'object'){
		parents.push(pod.object.value)
	    }
	})
    }
    var podMembers = ur.getPodMembers(item)
    if (podMembers && Array.isArray(podMembers)){
	podMembers.forEach((pod) => {
	    if ($.type(pod) === 'object' && $.type(pod.subject) === 'object'){
		var parent = pod.subject.value
		//if (ur.isParentPod(parent)){
		    parents.push(parent)
		//}
	    }
	})
    }
    //log.debug("getPodParents",parents)
    return u.unique(parents)
}

ur.getPodOwners = function (item){
    var uri = u.getURI(item)
    var owners = []
    var own
    if (uri){
	own = $rdf.sym(uri)
    }
    var podA = u.unique(rdfStore.match(
	own,
	ns.ACL("owner")	    
    ))
    var podA1 = u.unique(rdfStore.match(
	own,
	ns.FRBR("owner")	    
    ))
    var podB = u.unique(rdfStore.match(
	null,
	ns.ACL("owner"),
	own
    ))
    var podB1 = u.unique(rdfStore.match(
	null,
	ns.FRBR("owner"),
	own
    ))
    var pods = u.unique(podA.concat(podA1.concat(podB.concat(podB1))))
    if (pods && Array.isArray(pods)){
	pods.forEach((pod) => {
	    owners.push(pod)
	})
    }
    return u.unique(owners)
}

ur.getPodMembers = function (item){
    var uri = u.getURI(item)
    var members = []
    var mem
    if (uri){
	mem = $rdf.sym(uri)
    }
    var podA = u.unique(rdfStore.match(
	mem,
	ns.VCARD("hasMember")	    
    ))
    var podB = u.unique(rdfStore.match(
	null,
	ns.VCARD("hasMember"),
	mem
    ))
    var pods = u.unique(podA.concat(podB))
    if (pods && Array.isArray(pods)){
	pods.forEach((pod) => {
	    members.push(pod)
	})
    }
    return u.unique(members)
}

ur.getSourceUrl = function(ds){
    //where ds is the list of quads from the rdfStore.whyIndex
    if (Array.isArray(ds)){
	var st = ds[0]
	if (st && $.type(st) === 'object'){
	    var why = st.why
	    if (why && $.type(why) === 'object'){
		return why.value
	    }
	}
    }
}

ur.parseLinkHeader = function(item){
    var result = {}
    var uri = u.getURI(item)
    if (uri){
	var link = ur.getLinkHeader(uri)
	if (typeof(link) === 'string'){
	    var links = link.split(",")
	    if (Array.isArray(links)){
		links.forEach(function (lk){
		    var row = lk.split(";")
		    if (Array.isArray(row)){
			var iri = row[0].trim()
			var URI = u.getURI(iri)
			if (URI){
			    var Type = row[1]
			    if (typeof(Type) === 'string'){
				Type = Type.split("=")
				if (Array.isArray(Type)){
				    Type = Type[1]
				    if (typeof(Type) === 'string'){
					Type = Type.replaceAll('"',"")
					if (result[Type]){
					    result[Type].push(URI)
					} else {
					    result[Type] = [URI]
					}
				    }
				}
			    }
			}
		    }
		})
	    }
	}
    }
    return result
}

ur.getPropValues = function(item,property){
    var propUri = u.getURI(property)
    var uri = u.getURI(item)
    var values = []
    var isTrinpod = u.isTrinPod()
    var isType =  propUri === ns.RDF('type').value
    var isRedirect = store.state.dataRedirect[uri]
    var quads = u.unique(rdfStore.match($rdf.sym(uri)))
    if (!quads){
	quads = []
    }
    if (isType && !isRedirect){
	var types = ur.parseLinkHeader(uri)
	if (types){
	    types = types.type
	}
	if (Array.isArray(types)){
	    types.forEach((typ) => {
		values.push($rdf.st($rdf.sym(uri),ns.RDF('type'),$rdf.sym(typ)))
	    })
	}	      
    }
    //log.debug("ur.getPropValues values",isTrinpod,isType,quads,this.select)
    if (Array.isArray(quads)){
	quads.forEach(q=> {
	    if (u.getURI(q.graph.value)){
		if (q.predicate.value === propUri){
		    //log.debug("props2 pred match",q)
		    if (isType && isTrinpod && ur.quadToState(q) && !isRedirect){
			values.push(q)
		    } else if (isType && isTrinpod && !isRedirect){
			//nope
		    } else {
			values.push(q)
		    }
		}
	    }
	})
    }
    if (isType){
	log.debug("ur.getPropValues",propUri,uri,values)
    }
    return  u.unique(values)
}


ur.findPdfContainee = function (item) {
    var uri = u.getURI(item)
    var pdf
    if (uri){
	if (ur.isPdf(uri)){
	    pdf = uri
	} else {
	    var containees = ur.getContaineesNested(uri)
	    if (Array.isArray(containees)){
		containees = containees.reverse()
		containees.some(c => {
		    var isPdf = ur.isPdf(c)
		    //log.debug('isPdf',isPdf,c)
		    if (isPdf){
			pdf = c
			return pdf
		    }
		})
	    }
	    //log.debug('findPdfContainee', pdf,uri,containees)
	}
    }
    return pdf
}

ur.isFile = function (item){
    var uri = u.getURI(item)
    var isFile = false
    if (uri){
	var types = ur.getTypes(uri)
	if (types && Array.isArray(types)){
	    types.forEach(typ => {
		if (typ.includes("www.w3.org/ns/iana/media-types/") || ur.isPdf(item)){
		    isFile = true
		}
	    })
	}
    }
    return isFile
}

ur.isImage = function (item){
    var uri = u.getURI(item)
    var label = ur.getLabel(item)
    if (label){
	label = label.toLowerCase()
    }
    var isImage = false
    if (uri){
	var types = ur.getTypes(uri)
	if (types && Array.isArray(types)){
	    types.forEach(typ => {
		if (typ.includes("www.w3.org/ns/iana/media-types/image/")/* ||
		    (label && label.match("\.jpg$|\.jpeg$|\.gif$|\.png$")) */
		   ){
		    isImage = true
		}
	    })
	}
    }
    return isImage
}

ur.isPdf = function (item) {
    var uri = u.getURI(item)
    if (uri){
	var types = ur.getTypes(uri)
	var pdfs = [ns.NEO("s_pdf-intelligent-oracle").value,ns.NEO("s_pdf-intelligent").value,'http://www.w3.org/ns/iana/media-types/application/pdf#Resource']
	if (types && !types.includes(ns.SIO('SIO_000186').value)){
	    var check = u.getIntersection(types,pdfs)
	    if (check.length > 0)
		return true
	} else {
	    var tag = ur.getTag(uri) || uri
	    if (uri.match(new RegExp("^.+\\.pdf", "i"))) {
		return true;
	    } else {
		return false;
	    }
	}
    } else {
	return false;
    }
}

ur.isIntelligentPdf = function (item){
    var uri = u.getURI(item)
    if (ur.isPdf(uri)){
	var types = ur.getTypes(uri)
	var node = $rdf.sym(uri)
	var child = rdfStore.anyStatementMatching(node,ns.SIO('SIO_000202'),null)
	var cTypes = ur.getTypes(child)
	if (cTypes && cTypes.includes(ns.SIO('SIO_000186').value)){
	    child = null
	}
	if (child || (types && types.includes(ns.NEO('s_pdf-intelligent').value)) || 
	    rdfStore.anyStatementMatching(node,ns.NEO('c_crosslink')) ||
	    rdfStore.anyStatementMatching(node,ns.NEO('c_trinpod-read'))
	   ){
	    return true
	} else {
	    return false
	}
    } else {
	return false
    }
}

ur.isIntelligentPdfNew = function (item){
    var uri = u.getURI(item)
    if (uri){
	var types = ur.getTypes(uri)
	if (Array.isArray(types) && types.includes(ns.NEO('a_pdf-intelligent-new').value)){
	    return true
	} else {
	    return false
	}
    } else {
	return false
    }
}

ur.isRdfSpreadsheetImport = function (item){
    var uri = u.getURI(item)
    if (uri){
	var types = ur.getTypes(uri)
	if (Array.isArray(types) && types.includes(ns.NEO('im_rdf-spreadsheet-import').value)){
	    return true
	} else {
	    return false
	}
    } else {
	return false
    }
}

ur.isSpreadsheet = function (item){
    var uri = u.getURI(item)
    if (ur.isFile(uri) && uri.match(/.xls$|.xlsx$/)){
	return true
    } else {
	return false
    }
}
	

ur.canImportRdfSpreadsheet = function (item){
    var uri = u.getURI(item)
    var container = ur.getContainer(uri)
    if (ur.isSpreadsheet(uri) &&
	!ur.isRdfSpreadsheetImport(uri) &&
	container && 
	rdfStore.anyStatementMatching($rdf.sym(container),ns.SOLID("forClass"),ns.NEO("im_rdf-spreadsheet-import"))){
	return true
    } else {
	return false
    }
}
    

ur.vectorUpContainers = function(item,app){
    var uri = u.getURI(item)
    var vector
    var containeesUp = ur.getContaineesNested(uri)
    var isContainees = Array.isArray(containeesUp)
    var ldpStart
    if (isContainees){
	containeesUp = u.getURIs(containeesUp)
	ldpStart = containeesUp[0]
    } else {
	ldpStart = uri
    }
    var ldpContaineesUp = ur.getLdpContaineesNested(ldpStart)
    //log.debug("vectorUp",ldpStart,containeesUp,ldpContaineesUp)
    if (isContainees){
	ldpContaineesUp.pop()
	vector = ldpContaineesUp.concat(containeesUp)
    } else {
	vector = ldpContaineesUp
    }
    //log.debug("vector",vector)
    if (Array.isArray(vector)){
	vector = u.unique(u.getURIs(vector))
    }
    return vector
}

ur.vectorUpSystem = function(item,returnItem){
    //does not return anything if root is not a webid
    var ups = []
    if (returnItem){
	ups.push(item)
    }
    var up = ur.getSystemUp(item)
    if (!Array.isArray(up)){
	up = [up]
    }
    while (up){
	var upc = []
	up.forEach(u => {
	    if (!ups.includes(u)){
		ups.push(u)
		upc.push(u)
	    }
	})
	if (upc.length > 0){
	    var upp = []
	    upc.forEach(u => {
		var uu = ur.getSystemUp(u)
		if (uu){
		    if (Array.isArray(uu)){
			upp = upp.concat(uu)
		    } else {
			upp.push(uu)
		    }
		}
	    })
	    if (upp.length > 0){
		up = upp
	    } else {
		up = null
	    }
	} else {
	    up = null
	}
    }
    //log.debug("ups",ups)
    if (ur.isSystemObj(ups[ups.length - 1])){
	return ups
    } else {
	return null
    }
}

ur.vectorUpTree = function(node, tree, returnItem){
    if ($.type(node) === 'object' && $.type(tree) === 'object' && node.path){
	var path = node.path
	var nodes = []
	if (returnItem){
	    var uri = u.getURI(node)
	    if (uri){
		nodes = [uri]
	    }
	}
	if (Array.isArray(path) && path.length > 0){
	    path = path.slice()
	    path.pop()
	    while (path.length >0){
		var node = tree.getNode(path)
		if ($.type(node) === 'object' && node.data && node.data.uri){
		    nodes.push(node.data.uri)
		}
		path.pop()
		}
	    return nodes
	}
    }
}

ur.getAllTreeURIs = function(tree){
    var uris = []
    if (u.isTree(tree)){	
	tree.traverse(it => {
	    uris.push(it.data.uri)
	})
    }
    return uris
}

ur.getTreeNodeParent = function(uri,tree,app){
    var uri = u.getURI(uri)
    var isTree = u.isTree(tree)
    var Final
    if (uri && isTree){
	var node = u.findTreeNode(uri,tree)
	log.debug("node",node,uri)
	if (u.isTreeNode(node) && node.path.length > 1){
	    var Path = node.path.slice()
	    Path.pop()
	    Final = tree.getNode(Path)
	} else {
	    var parents = []
	    var allURIs = ur.getAllTreeURIs(tree)
	    if (!allURIs.includes(uri)){
		allURIs.push(uri)
	    }
	    if (!Array.isArray(allURIs)){
		allURIs = []
	    }
	    if (ur.isObjectPort(uri)){
		var portsTo = ur.getPortTo(uri)
		if (portsTo){
		    portsTo.forEach(port => {
			if (!allURIs.includes(port) && !parents.includes(port)){
			    parents.push(port)
			    allURIs.push(port)
			}
		    })
		}
	    }
	    var portsFrom = ur.getPortFrom(uri)
	    if (portsFrom){
		portsFrom.forEach(port => {
		    if (!allURIs.includes(port) && !parents.includes(port)){
			parents.push(port)
		    }
		})
	    }
	    if (app === "Documents" || app === "Files") {
		var parent = u.getURIs(ur.getInherit(uri, ns.LDP('contains'), true))
		if (Array.isArray(parent) && parent.length > 0){
		    parents = u.unique(parents.concat(parent))
		}
		//log.debug({content: content, contents: contents})
		var parent2 = ur.getInherit(uri, ns.SIO('SIO_000202'), true)
		if (parent2) {
		    if (Array.isArray(parents)) {
			parents = parents.concat(parent2);
		    } else {
			parents = parent2;
		    }
		}
	    } else if (app === "Projects"){	    
		var raw = u.getURI(ur.getParentPod(uri))
		if (raw){
		    if (raw !== uri && !allURIs.includes(raw)){
			log.debug("wow1",raw)
			Final = u.findTreeNode(raw,tree)
		    }
		}
		if (!Final){
		    var cCollab = ur.getCollaborators(uri,"appContents")
		    if (cCollab){
			cCollab.forEach(col => {
			    var nested = ur.getParentPodNested(col)
			    if (Array.isArray(nested) && nested.length > 0){
				var puri = u.getURI(nested[0])
				if (!allURIs.includes(puri)){
				    parents.push(puri)
				    allURIs.push(puri)
				}
			    } else {
				if (!allURIs.includes(col)){
				    parents.push(col)
				    allURIs.push(col)
				}
			    }
			})		
		    }
		}
	    }
	    //log.debug("ur.getTreeNodeParent",{
	    if (!Final && Array.isArray(parents) && parents.length > 0){
		log.debug("wow2",parents)
		Final = u.findTreeNode(parents[0],tree)
	    }
	}
	log.debug("getTreeNodeParent",uri,Final,tree)
	return Final
    }
}

	
ur.getTreeContents = function(uri,tree,app,parent){
    //log.debug("getTreeContents",uri,tree,app)
    var uri = u.getURI(uri)
    if (uri && u.isTree(tree)){
	var contents = []
	var down = ur.getSystemDown(uri,tree,app)
	if (down){
	    if (!Array.isArray(down)){
		down = [down]
	    }
	    contents = down
	}
	/*
	var allURIs = ur.getAllTreeURIs(tree)
	if (!allURIs.includes(uri)){
	    allURIs.push(uri)
	}
	var portsTo = ur.getPortTo(uri)
	if (portsTo){
	    portsTo.forEach(port => {
		if (!allURIs.includes(port) && !contents.includes(port) && port !== parent){
		    contents.push(port)
		    allURIs.push(port)
		}
	    })
	}
	var portsFrom = ur.getPortFrom(uri)
	if (portsFrom){
	    portsFrom.forEach(port => {
		if (!allURIs.includes(port) && !contents.includes(port) && port !== parent){
		    contents.push(port)
		}
	    })
	}*/
	if (!ur.isSystemObj(uri) && (app === "Documents" || app === "Files")) {
	    var content = ur.getContents(uri);
	    var vers = ur.getInherit(uri, ns.DCTERMS('hasVersion'))
	    if (Array.isArray(content) && content.length > 0){
		contents = contents.concat(content)
	    }
	    if (Array.isArray(vers) && vers.length > 0){
		contents = contents.concat(vers)
	    }
	    //log.debug({content: content, contents: contents})
	} else if (app === "Projects"){
	    
	    var raw = u.getURIs(ur.getChildPod(uri))
	    if (Array.isArray(raw) && raw.length > 0){
		raw.forEach(child => {
		    if (child !== uri){
			contents.push(child)
		    }
		})
	    }
	    /*
	    var groups = ur.getMembeeNested(uri)
	    if (Array.isArray(groups)){
		groups.forEach(group => {
		    group = u.getURI(group)
		    if (group !== uri){
			contents.push(group)
			var subs = ur.getChildPod(group)
			if (Array.isArray(subs)){
			    subs.forEach(sub => {
				sub = u.getURI(sub)
				if (sub !== uri && !contents.includes(sub)){
				    contents.push(sub)
				}
			    })
			}
		    }
		})
	    }*/
	    
	    var cCollab = ur.getCollaborators(uri,"appContents")
	    if (cCollab){
		cCollab.forEach(col => {
		    var nested = ur.getParentPodNested(col)
		    if (Array.isArray(nested) && nested.length > 0){
			var puri = u.getURI(nested[0])
			contents.push(puri)
		    } else {
			contents.push(col)
		    }
		})		
	    }
	    var Final = []
	    if (contents.length > 0){
		contents.forEach(it => {
		    if (ur.maybeWebIdSysRelation(it)){
			Final.push(it)
		    }
		})
	    }
	    contents = Final
				 
	}
	var Final = u.unique(u.deNullify(u.getURIs(contents)))
	//log.debug("Ports",{contents: contents, Final: Final, app: app, uri: uri})
	if (Array.isArray(Final)){
	    return Final
	} else {
	    return []
	}
    }
}

ur.updateTree = function(uri,tree,app){
    log.debug("ur.updateTree",uri,tree,app)
    if (u.isTree(tree)){
	if (app === "Projects"){
	    var all = ur.getAllTreeURIs(tree)
	    var root = tree.getNode([0])
	    var roots = ur.getJustTopParents(uri)
	    var eRoots = u.getURIs(tree.nodes)
	    log.debug("roots",roots)
	    if (Array.isArray(roots)){
		roots.forEach((oroot,idx) => {
		    if (!eRoots.includes(oroot)){
			var loc = idx - 1
			ur.insertNode(oroot,tree,tree.getNode([loc]),app,"after",{treeUris: all})
		    }
		})
		var paths = []
		tree.nodes.forEach(node => {
		    if (!roots.includes(node.data.uri)){
			paths.push(node.path)
		    } else {
			if (node.children.length > 0 && node.isLeaf){
			    tree.updateNode(node.path,{isLeaf: false, isExpanded: true})
			} else if (node.children.length === 0){
			    tree.updateNode(node.path,{isLeaf: true, isExpanded: false})
			}
			    
			if (!ur.getRequestNodes(node.data.uri)){
			    store.dispatch("loadDataSet",{uri: node.data.uri, sentFrom: "ur.updateTree", force: true})
			}
		    }
		})
		if (paths.length > 0){
		    tree.remove(paths)
		}
	    }
	    
	    if (Array.isArray(all) && all.length >0){
		all.forEach(turi => {
		    //log.debug("tree uri",turi)
		    if (!ur.getRequestNodes(turi)){
			store.dispatch("loadDataSet",{uri: turi, sentFrom: "ur.initializeTree"})
		    }
		    //check for collaborators
		    var collabs = ur.getCollabObjects(turi)
		    if (Array.isArray(collabs) && collabs.length > 0){
			collabs.forEach(async function(collab){
			    log.debug("collab",collab)
			    const webid = await ur.fetchWebId(collab)
			    if (webid && !ur.getRequestNodes(webid)){
				store.dispatch("loadDataSet",{uri: webid, sentFrom: "ur.initializeTree.collab", force: true})
			    }
			})
		    }			
		})
	    }
	    //store.commit("projTreeNodes",tree.nodes.slice())
	}
    }
}

ur.initializeTree = function(uri,tree,app,options){
    if (u.isTree(tree)){
	//var children = ur.getTreeContents(uri,tree,app)
	if (tree.nodes && tree.nodes.length > 0){
	    var root = tree.getNode([0])
	    var paths = []
	    tree.nodes.forEach(node => {
		if (node.data.uri !== root.data.uri){
		    paths.push(node.path)
		}
	    })
	    tree.remove(paths)
	    var eNodes
	    if (app === "Projects"){
		uri = store.state.webId
		//eNodes = store.state.projTreeNodes
	    }
	    /*
	    if (Array.isArray(eNodes) && eNodes.length > 0){
		
		eNodes.forEach((node, idx) => {
		    log.debug("eNode",node)
		    tree.insert({node: tree.getNode([idx]), placement: "after"}, node)
		})
		tree.remove([[0]])
	    
	    } else {*/
		if (!options){
		    options = {}
		}
		options.sentFrom = "ur.initializeTree" + " " + options.sentFrom
		var update = ur.makeTreeNode(uri,tree,app,options)
		
		if (u.isTreeNode(root) && u.isTreeNode(update)){
		    //log.debug("root",root,update)
		    //tree.nodes.push(update)
		    //tree.$forceUpdate()
		    if (!update.children || update.children.length === 0){
			update.isExpanded = false
			update.isLeaf = true
		    } else {
			update.isExpanded = true
			update.isLeaf = false
		    }
		    log.debug("root",root,"update",update)
		    tree.insert({node: root, placement: "after"},update)
		    tree.remove([[0]])
		/*} else {
		    tree.nodes.push(update)
		    tree.$forceUpdate()
		    }*/
		if (app === "Documents"){
		    tree.traverse(it => {
			tree.updateNode(it.path,{isExpanded: false, isSelected: false})
		    })
		    tree.updateNode([0],{isExpanded: true, isSelected: true})
		    if (!ur.getRequestNodes(uri)){
			store.dispatch("loadDataSet",{uri: uri, sentFrom: "ur.initializeTree", force: true})
		    }
		}
		if (app === "Projects"){
		    var roots = ur.getJustTopParents(uri)
		    log.debug("roots",roots)
		    if (Array.isArray(roots)){
			options.treeUris = [uri]
			roots.forEach((oroot,idx) => {
			    if (oroot !== uri){
				var loc = idx - 1
				ur.insertNode(oroot,tree,tree.getNode([loc]),app,"after",options)
			    }
			})
		    }
		    ur.updateTree(uri,tree,app)
		    tree.traverse(it => {
			if (it.children.length > 0){
			    tree.updateNode(it.path,{isExpanded: true})
			}
		    })
		}   	
		    log.debug("initializeTree", uri,tree,app,options)
		
		return tree.nodes
	    }
	}
    }
}

ur.getTreeNodeChildren = function(uri,tree,app,options,parent){
    //log.debug("ur.getTreeNodeChildren",uri,tree,app,options)
    if (app === "Projects" || (options.sentFrom && !options.sentFrom.includes("ur.getTreeNodeChildren"))){
	if ($.type(options) !== 'object'){
	    options = {}
	}
	options.sentFrom = options.sentFrom + " ur.getTreeNodeChildren"
	var treeUris = options.treeUris
	if (!Array.isArray(treeUris)){
	    treeUris = []
	}
	var uri = u.getURI(uri)
	var children
	if (uri){
	    children =  ur.getTreeContents(uri,tree,app,parent)
	    if (children){
		children = ur.makeTreeNode(children,tree,app,options,uri)
		if (Array.isArray(children) && children.length > 1){
		    //log.debug("sorting now2",uri)
		    children = children.sort(function (a, b){
			var pa = ""
			var pb = ""
			if (ur.isSystemObj(uri)){
			    if (a){
				var predA = rdfStore.anyStatementMatching($rdf.sym(uri),null,$rdf.sym(a.data.uri))
				if (predA){
				    pa = predA.predicate.value
				}
			    }
			    if (b){
				var predB = rdfStore.anyStatementMatching($rdf.sym(uri),null,$rdf.sym(b.data.uri))
				if (predB){
				    pb = predB.predicate.value
				}
			    }
			}
			var aTag = ur.getFTag(a)
			var bTag = ur.getFTag(b)
			var aLabel
			var bLabel
			if (!aTag){
			    aLabel = ur.getLabel(a)
			}
			if (!bTag){
			    bLabel = ur.getLabel(b)
			}
			
			var aL = pa + (aTag || aLabel) //ur.getLabel(a)
			var bL = pb + (bTag || bLabel) //ur.getLabel(b)
			if (aL && bL){ // && !treeUris.includes(a) && !treeUris.includes(b)){
			    return aL.toLowerCase().localeCompare(bL.toLowerCase())
			}
		    })
		}
	    }
	}
	var finals = []
	if (Array.isArray(children)){
	    children.forEach(child => {
		if (u.isTreeNode(child)){
		    finals.push(child)
		}
	    })
	}
	return finals
    }
}

ur.makeTreeNode = function(uri,tree,app,options,parent){
    log.debug("ur.makeTreeNode",uri,tree,app,options)
    if (!options){
	options = {}
    }
    options.sentFrom = options.sentFrom + " ur.makeTreeNode"
    var treeUris = options.treeUris
    /*if (!Array.isArray(treeUris) && app === "Projects"){
	treeUris = ur.getAllTreeURIs(tree)
    }*/
    if (Array.isArray(uri) && uri.length > 0){
	var nodes = []
	uri.forEach(ui => {
	    var uuri = u.getURI(ui)
	    
	    if (uuri && (app === "Projects" || !options.sentFrom.includes("ur.makeTreeNodeArray"))){ // && (app !== "Projects" || (app === "Projects" && !treeUris.includes(ui)))){
		options.treeUris = treeUris
		var node = u.findTreeNode(uuri,tree)
		if (!node){
		    node = ur.makeTreeNode(uuri,tree,app,options,parent)
		}
		if (u.isTreeNode(node)){
		    if (app === "Projects" && !ur.getRequestNodes(uuri)){
			store.dispatch("loadDataSet",{uri: uuri, sentFrom: "ur.makeTreeNode.child"})
		    }
		    nodes.push(node)
		}
	    }
	})
	options.sentFrom = options.sentFrom + " ur.makeTreeNodeArray"
	return nodes
    } else {
	var uri = u.getURI(uri)
	if (uri){ // && (app !== "Projects" || (app === "Projects" && !treeUris.includes(uri)))){
	    var count = ur.getCount(uri)
	    if (app === "Projects"){
		//treeUris.push(uri)
		if (!ur.getRequestNodes(uri)){
		    store.dispatch("loadDataSet",{uri: uri, sentFrom: "ur.makeTreeNode"})
		}
	    }
	    var children = ur.getTreeNodeChildren(uri,tree,app,options,parent)
	    if (!Array.isArray(children)){
		children = []
	    }
	    var node = u.findTreeNode(uri,tree)
	    var ePath
	    var isNode = u.isTreeNode(node)
	    var isExpanded = options.isExpanded
	    if (typeof(isExpanded) !== "boolean" && !isNode){
		isExpanded = false
	    } else if (isNode){
		isExpanded = node.isExpanded
	    }
	    if (isNode){
		ePath = node.path
	    }
	    var isContainer = (ur.isContainer(uri) || ur.isIntelligentPdf(uri) || children.length > 0 || ur.isSystemObj(uri) || count)
		&& !ur.isType(uri,ns.SIO("SIO_000114").value)
	    if (count && count > children.length && app != "Projects"){
		var newRow = { title: "Load More",
			       children: [],
			       isLeaf: true,
			       isExpanded: false,
			       data: {
				   uri: "loadMore",
				   parent: uri
			       }
			     }
		children.push(newRow)
	    }
	    node = {
		title: ur.getLabel(uri),
		children: children,
		isLeaf: !isContainer,
		isExpanded: isExpanded,
		data: {
		    uri: uri
		}
	    }
	    if (u.isTreeNode(node)){
		if (ePath){
		    log.debug("update",node)
		    //update only allows one level of children at a time, so clear out childrens children
		    
		    if (children.length > 0){
			children.forEach(child => {
			    //send child to make node to restore children down hierarchy
			    if (app !== "Projects"){
				//ur.makeTreeNode(child.data.uri,tree,app,options,node)
			    }
			    child.children = []			    
			})
		    }
		    tree.updateNode(ePath,node)
		}
		//log.debug("final node",node)
		return node
	    }
	}
    }
}

ur.sortTreeContents = function(contents,app){
    if (Array.isArray(contents) && contents.length > 0){
	contents = u.getURIs(contents)
	return contents.sort(function (a, b) {
	    var aL = ur.getLabel(a)
	    var bL = ur.getLabel(b)
	    if (aL && bL){
		return bL.toLowerCase().localeCompare(aL.toLowerCase())
	    }
	})
    } else {
	return contents
    }
}
    


ur.insertNode = function(uri,tree,parent,app,placement,options){
    //log.debug('ur.insertNode',uri,tree,parent,app,placement,options)
    if (!options){
	options = {}
    }
    options.sentFrom = options.sentFrom + " ur.insertNode"
    var treeUris = options.treeUris
    if (!Array.isArray(treeUris)){
	treeUris = []
    }
    var uri = u.getURI(uri)
    //var isContainer = ur.isContainer(uri) || ur.isIntelligentPdf(uri) || ur.isPort(uri)
    if (app === "Projects" && !ur.getRequestNodes(uri)){
	store.dispatch("loadDataSet",{uri: uri, sentFrom: "ur.insertNode"})
    }
    if (!placement){
	placement = "inside"
    }
    if (uri){
	if (u.isTree(tree) && u.isTreeNode(parent) && !treeUris.includes(uri)){
	    options.treeUris = treeUris
	    var node = ur.makeTreeNode(uri,tree,app,options,u.getURI(parent))
	    if (u.isTreeNode(node)){
		log.debug("insertNode node",node,parent)
		if (parent && !u.getURIs(parent.children).includes(uri)){
		    try {
			tree.insert({node: parent, placement: placement},node)
		    } catch(error) {
			log.debug(error)
		    }
		    if (parent.isLeaf && placement === 'inside'){
			tree.updateNode(parent.path,{isLeaf: false})
		    }
		    
		    return u.findTreeNode(uri,tree)
		}
	    }
	}
    }
}	

ur.getLinkHeader = function (uri){
    var response = ur.getResponseNodes(uri,true)
    if (response){
	var st = rdfStore.anyStatementMatching(response,$rdf.sym("http://www.w3.org/2007/ont/httph#link"))
	if (st){
	    return st.object.value
	}
    }
}

ur.getWacAllow = function (uri){
    var allow
    var response = ur.getResponseNodes(uri,true)
    if (response){
	var st = rdfStore.anyStatementMatching(response,$rdf.sym("http://www.w3.org/2007/ont/httph#wac-allow"))
	if (st){
	    allow = st.object.value
	}
    }
    return allow
}

ur.getEtag = function (uri){
    var uri = u.getURI(uri)
    var eTag
    if (uri){
	var response = ur.getResponseNodes(uri,true)
	if (response){
	    var st = rdfStore.anyStatementMatching(response,$rdf.sym("http://www.w3.org/2007/ont/httph#etag"))
	    if (st){
		eTag = st.object.value
	    }
	}
    }
    return eTag
}

ur.getFileVersion = function (uri){
    var uri = u.getURI(uri)
    if (ur.isFile(uri)){
	var st = rdfStore.anyStatementMatching($rdf.sym(uri),ns.DCTERMS("hasVersion"))
	if (st)
	    return st.object.value
    }
}
    
ur.eTagToResponseNodes = function (eTag){
    if (typeof(eTag) === 'string'){
	var responses = []
	var sts = rdfStore.match(null,$rdf.sym("http://www.w3.org/2007/ont/httph#etag"),$rdf.lit(eTag))
	if (Array.isArray(sts) && sts.length > 0){
	    sts.forEach(st => {
		responses.push(st.subject)
	    })
	    return responses
	}
    }
}
ur.getRequestNodes = function (uri){
    var uri = u.getURI(uri)	
    var requests = []
    if (uri){
	//first check etags
	var eTag = store.state.eTags[uri]
	if (eTag){
	    var responses = ur.eTagToResponseNodes(eTag)
	    if (Array.isArray(responses) && responses.length > 0){
		responses.forEach(response => {
		    var st = rdfStore.anyStatementMatching(null,$rdf.sym('http://www.w3.org/2007/ont/link#response'),response)
		    if (st){
			requests.push(st.subject)
		    }
		})
	    }
	    return requests
	} else {
	    /*var webid = ur.getWebId(uri)
	    if (webid === uri){
		uri = u.getCard(uri)
	    }*/
	    var sts = rdfStore.match(null,$rdf.sym("http://www.w3.org/2007/ont/link#requestedURI"),$rdf.literal(uri))
	    if (Array.isArray(sts) && sts.length > 0){
		sts.forEach(st => {
		    requests.push(st.subject)
		})
	    }
	    if (requests.length > 0){
		return requests
	    } /*else {
		//work up hierarchy
		var ups = ur.vectorUpContainers(uri)
		if (Array.isArray(ups) && ups.length > 0){
		    ups = ups.reverse()
		    ups.forEach(up => {
			var reqs = []
			var sts = rdfStore.match(null,$rdf.sym("http://www.w3.org/2007/ont/link#requestedURI"),$rdf.literal(up))
			if (Array.isArray(sts) && sts.length > 0){
			    sts.forEach(st => {
				reqs.push(st.subject)
			    })
			}
			if (reqs.length > 0){
			    return reqs
			}
		    })
		}
	    }*/
	}		   
    }
}
	    
ur.getResponseNodes = function (uri,latest){
    var responses = []
    var uri = u.getURI(uri)
    if (uri){
	var requests = ur.getRequestNodes(uri) 
	if (Array.isArray(requests) && requests.length > 0){
	    requests.forEach(req => {
		var response = rdfStore.anyStatementMatching(req,$rdf.sym('http://www.w3.org/2007/ont/link#response'))
		if (response){
		    responses.push(response.object)
		    }
	    })
	    if (responses.length > 0){
		if (latest){
		    var sort = responses.sort(function (a,b){
			var aL = a.value
			var bL = b.value
			if (aL && bL){
			    return aL.localeCompare(bL)
			}
		    })
		    if (Array.isArray(sort)){
			return sort[0]
		    }
		} else {
		    return responses
		}
	    }
	}
    }
}

ur.getAuthRedirect = function (uri){
    var responses = ur.getResponseNodes(uri)
    if (responses){
	var st = rdfStore.anyStatementMatching(responses[0],$rdf.sym('http://www.w3.org/2007/ont/httph#app-authorization-required'))
	if (st){
	    return st.object.value
	}
    }
}
		
ur.isTrinPod = function (uri){
    var uri = u.getURI(uri)
    var yes = false
    if (uri){
	var responses = ur.getResponseNodes(uri)
	if (responses){
	    responses.forEach(response => {
		var trin = rdfStore.anyStatementMatching(response,$rdf.sym('http://www.w3.org/2007/ont/httph#x-powered-by'))
		if (trin){
		    var text = trin.object.value
		    if (typeof(text) === 'string'){
			if (text.match('TrinPod')){
			    yes = true
			}
		    }
		}
	    })	    
	}
    }
    return yes
}

ur.fetchWebId = async function (uri){
    var card = u.getCard(uri)
    var webid = ur.getWebId(card)
    if (webid){
	return webid
    } else {
	var dsStore = new $rdf.graph()
	try {
	    var resp = await fetch(card,{headers: {accept: "text/turtle"}})
	    var text = await resp.text()
	    if (typeof(text) === 'string'){
		await $rdf.parse(text,dsStore,card)
		var st = dsStore.anyStatementMatching($rdf.sym(card), ns.FOAF('primaryTopic'))
		dsStore.removeMatches()
		if (st){
		    return st.object.value
		}
	    }
	} catch (e) {
	    log.error(e)
	}
    }
}

ur.getCurrentLocation = function (uri){
    var uri = u.getURI(uri)
    if (uri){
	var webid = ur.getWebId(uri)
	if (uri !== webid){
	    return uri
	}
    }	
}

ur.getCurrentPod = function (uri){
    return ur.getWebId(uri)	
}

ur.getCurrentParentPod = function (uri){
    var parent =  ur.getParentWebId(uri);
    var current = ur.getCurrentPod(uri)
    if (parent && parent !== current){
	return parent
    } else if (current){
	parent = ur.getObject(current,ns.FRBR('owner'))
	if (parent && parent !== current){
	    return parent
	}
    }
}

ur.getCount = function (item){
    var uri = u.getURI(item)
    if (uri){
	var st = rdfStore.anyStatementMatching($rdf.sym(uri),ns.SIO('SIO_000794'))
	if (st && st.object){
	    return st.object.value
	}
    }
}

ur.getAconexDocTypes = function(){
    var sts = rdfStore.match(null,ns.RDF('type'),ns.NEO('s_aconex-document-type'))
    if (!sts){
	sts = rdfStore.match(null,ns.RDF('type'),ns.NEO('a_aconex-document-type'))
    }
    if (Array.isArray(sts) && sts.length > 0){
	var types = []
	sts.forEach(st => {
	    types.push(st.subject.value)
	})
	return types
    }
}

ur.getStateFunctions = function(item){
    var uri = u.getURI(item)
    if (uri){
	var functions = q._function(q.state(uri))
	if (Array.isArray(functions)){
	    return u.unique(functions.flat())
	}
    }
}

ur.getStateTypes = function(item){
    var uri = u.getURI(item)
    if (uri){
	var functions = ur.getStateFunctions(uri)
	if (Array.isArray(functions) && functions.length > 0){

	}
    }
}

ur.deleteStatements = async function(item){
    var uri = u.getURI(item)
    var kill =  await rdfStore.match($rdf.sym(uri))
    while (kill.length > 0){
	log.debug("kill",kill.length)
	await rdfStore.remove(kill)
	kill = await rdfStore.match($rdf.sym(uri))
    }
}

export default ur

