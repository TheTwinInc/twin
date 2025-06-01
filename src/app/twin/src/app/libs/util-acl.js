const $ = require('jquery')

import { rdfStore, rdfFetcher, $rdf, auth } from './rdfStore'

import { ns } from './ontologies'

import u from './util'
import ur from './util-rdf'

import store from './store'

import { graph } from './graph.js'

const ua = {}

import * as log from 'loglevel'


ua.canEdit = function (node){
    
}

/*
ua.getAuthorizations = async function (node, recurse) {
    //this is direct auth - TODO inheritance! (need to recurse up until acl found)
    //note, acls are set on document URLs only, so fragments (hash) are ignored
    log.debug("ua.getAuthorizations",node, recurse)
    if (node === recurse){
	//we've tried this already - give up
	log.error("Error: no authorizations found",node,recurse)
    } else if (u.checkURL(node)){
	//need to check if it's an authorization which then takes it's own acl
	//authorization control inherited by item authorized
	var types = ur.getTypes(node)
	var aclURI;
	//console.log("authorization types",types)
	if ($.inArray(ns.ACL('Authorization').uri,types) === 0){
	    //need to find item authorized, but make sure auth loaded first
	    await rdfStore.fetcher.load(node)
	    var item = rdfStore.any($rdf.sym(node),ns.ACL("accessTo"))
	    if (item){
		//return ua.getAuthorizations(item.uri,node)
	    }
	} else {
	    if (!ur.getNamespace(node)){
		node = node.split("#")[0]
	    }
	    
	    
	    var aclURI = rdfStore.any($rdf.sym(node),$rdf.sym("http://www.iana.org/assignments/link-relations/acl"))
	    if (aclURI){
		aclURI = aclURI.uri;
		log.debug("right before rdfFetcher",aclURI)
		try {
		    await rdfStore.fetcher.load(aclURI) 
		    var auths = rdfStore.each(null,ns.ACL("accessTo"),$rdf.sym(node)) //returns terms
		    if (auths) {
			var results = {};
			var terms = [] //need to load all terms for labels etc
			var allAgents = []
			$.map(auths,function(Auth){ //mode,  agent, agentClass  (all returns are terms)
			    //need to put auths into 'statements' bucket
			    var statement = $rdf.st(Auth,ns.ACL("accessTo"),$rdf.sym(node),'statements')
			    log.debug("statement",statement)
			    rdfStore.addStatement(statement)
			    //also need to add to graph
			    graph.addStatement(statement)
			    var agents = rdfStore.each(Auth,ns.ACL('agent'))
			    var agentClasses = rdfStore.each(Auth,ns.ACL('agentClass'))
			    var modes = rdfStore.each(Auth,ns.ACL('mode'))
			    log.debug("auths",agents,agentClasses,modes)
			    terms = terms.concat(agentClasses,modes)
			    allAgents = allAgents.concat(agents)
			    results[Auth.uri] = {agents: agents, agentClasses: agentClasses, modes: modes}
			});
			setTimeout(function () {
			    graph.network.stopSimulation()
			}, 1500 )
			//await ur.loadOntology(terms)
			allAgents = $.map(allAgents,function(agent){
			    if (u.checkURL(agent)){
				return agent
			    }
			});
			//await rdfFetcher.load(allAgents)
			return results;
		    }
		} catch (error) {
		    log.debug("ACL file not found - trying container",error)
		    await rdfFetcher.load(node)
		    var container = ur.getContainer(node)
		    if (container){
			//return await ua.getAuthorizations(container.uri, node)
		    }
		}
	    } else {
		//check to see if item contained, and if so find container acl - assume only one container controls - if failed after this call again, abandon
		await rdfFetcher.load(ur.getGmxLoad(node))
		var container = ur.getContainer(node)
		if (container){
		    log.debug("check container acl",container,node)
		   // return await ua.getAuthorizations(container.uri, node)
		}
	    }
	}
    }
}
*/

ua.parseWacModes = function (modes){
    var result = []
    if (typeof(modes) === 'string'){
	modes = modes.split("=")
	if (Array.isArray(modes)){
	    modes = modes[1]
	    if (typeof(modes) === 'string'){
		modes = modes.replaceAll('"','')
		if (modes !== ""){
		    result =  modes.split(" ")
		}
	    }
	}
    }
    return u.unique(result)
}

ua.parseWacString = function(wac){
    var allow = {}
    if (typeof(wac) === 'string'){
	var split = wac.split(",")
	if (Array.isArray(split)){
	    var User = split[0]
	    var Public = split[1]
	    allow.user = ua.parseWacModes(User)
	    allow.public = ua.parseWacModes(Public)
	}
    }
    return allow
}


ua.getAvailableModes = function (node) {
    //return terms of all available modes to the user
    //log.debug("ua.getAvailableModes",node)
    //var ds = store.state.dataSets[u.getURI(node)]
    var uri = u.getURI(node)
    var redirect // = store.state.dataRedirect[uri]
    if (redirect){
	uri = redirect
    }
    var parse = {}
    if (uri){
	var header = ur.getWacAllow(uri) //rdfFetcher.getHeader($rdf.sym(uri),"Wac-Allow")
	//if (ds){
	if (header){
	    parse = ua.parseWacString(header)
	}
		
	    /*var acl = ds.internal_resourceInfo.permissions
		var user = []
		var Public = []
		    
	    
	    if (acl){
		var pKeys = Object.keys(acl.public)
		if (pKeys){
		    pKeys.forEach(function(k){
			if (acl.public[k]){
			    Public.push(k)
			}
		    })
		}
		var uKeys =  Object.keys(acl.user)
		if (uKeys){
		    uKeys.forEach(function(k){
			if (acl.user[k]){
			    user.push(k)
			}
		    })
		}
		parse.user = user
		parse.public = Public
	} */
    }
    return parse
}

ua.userCanRead = function (node){
    if (node) {	
	//log.debug("ua.userCanRead",node)
	var available = ua.getAvailableModes(node)
	if (available){
	    if ((available.user && $.inArray("read",available.user) > -1) ||
		(available.public && $.inArray("read",available.public) > -1) ){
		return true
	    }
	}
    }
}

ua.userCanEdit = function (node){
    if (node) {	
	//log.debug("ua.userCanEdit",node)
	var available = ua.getAvailableModes(node)
	if (available){
	    if ((available.user && $.inArray("write",available.user) > -1) ||
		(available.public && $.inArray("write",available.public) > -1)){
		return true
	    } 
	} 
    }
}

ua.userCanControl = function (node){
    if (node) {	
	//log.debug("ua.userCanEdit",node)
	var available = ua.getAvailableModes(node)
	if (available){
	    if ((available.user && $.inArray("control",available.user) > -1) ||
		(available.public && $.inArray("control",available.public) > -1)){
		return true
	    } 
	} 
    }
}


ua.formatMode = function (mode) {
   // mode = u.getURI(mode)
    if (mode === "read"){ //ns.ACL('Read').uri){
	return ['Read','read']
    } else if (mode === "append"){ //ns.ACL('Append').uri) {
	return ['Append','append']
    } else if (mode === 'write'){ //ns.ACL('Write').uri) {
	return ['Write','write']
    } else if (mode === 'control'){ //ns.ACL('Control').uri) {
	return ['Control','control']
    }
}


	       
export default ua
