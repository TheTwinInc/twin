//C = CREATE things

const $ = require('jquery')

import * as log from 'loglevel'

import { ns, nu, nl, neo, trinity, namespaces, xsd, trinapp } from './ontologies'

import { rdfStore, $rdf } from './rdfStore'

import u from './util'
import ur from './util-rdf'
import q from './util-q'

import store from './store'

const N3 = require('n3')

import JSZip from 'jszip'

//import * as client from "@inrupt/solid-client"

const c = {}

c.isTrinApp = function (){
    if (store.state.crosslinkStatus){
	return true
    } else {
	return false
    }
}

c.attribute = function (Function, Result, obj) {
    if (!obj) {
	obj = {}
    }
    if (!obj.quads) {
	obj.quads = []
    }
    var uri = u.getURI(Function)
    store.commit('blankNodeIncrement')
    var id = store.state.blankNodeIndex
    obj.attribute = new N3.BlankNode(id)
    Function = $rdf.sym(uri)
    var rUri = u.getURI(Result)
    if (rUri) {
	Result = $rdf.sym(rUri)
    } else if (typeof Result === 'string') {
	Result = $rdf.lit(Result, null, xsd.string)
    } else if (typeof Result === 'number') {
	Result = $rdf.lit(Result, null, xsd.integer)
    }
    if (!obj.graph){
	obj.graph = new N3.DefaultGraph()
    }
    if (Function && Result && obj.graph) {
	obj.quads.push($rdf.st(obj.attribute, neo.i_function, Function, obj.graph))
	obj.quads.push($rdf.st(obj.attribute, neo.o_result, Result, obj.graph))
	return obj
    } else {
	log.debug("c.attribute missing function or result", Function, Result)
    }
}

c.state = function (entity, attribute, obj) {
    if (entity) {
	if ($.type(entity) !== 'object') {
	    entity = u.getURI(entity)
	    if (entity) {
		entity = $rdf.sym(entity)
	    }
	}
    }
    if (attribute) {
	if ($.type(attribute) === 'object' && attribute.termType === 'BlankNode') {
	} else if ($.type(attribute) !== 'object') {
	    attribute = u.getURI(attribute)
	    if (attribute) {
		attribute = $rdf.sym(attribute)
	    }
	}
    }
    if (entity && attribute) {
	if (!obj) {
	    obj = {}
	}
	if (!obj.quads) {
	    obj.quads = []
	}
	var start = obj.start
	var state = c.start(null, start, obj)
	state.state = state.event
	delete state.event //hack, make sure event comes later

	store.commit('blankNodeIncrement')
	var id = store.state.blankNodeIndex
	if (!obj.graph){
	    obj.graph = new N3.DefaultGraph()
	}
	obj.quads.push($rdf.st(entity, neo.i_entity, obj.state, obj.graph))
	obj.quads.push($rdf.st(attribute, neo.i_attribute, obj.state, obj.graph))
	return obj
    } else {
	log.debug("c.state missing entity or attribute", entity, attribute)
    }
}

c.time = function (time, obj) {
	var Time
	if (time) {
		Time = new Date(time)
	} else {
		Time = new Date()
	}
	return c.attribute(ns.TL('at'), $rdf.lit(Time.toISOString(), null, xsd.dateTime), obj)
}

c.start = function (event, time, obj) {
    //null event creates a new one
    if (!obj) {
	obj = {}
    }
    if (!obj.graph){
	obj.graph = new N3.DefaultGraph()
    }
    if (!event || (!obj.event)) {
	store.commit('blankNodeIncrement')
	var id = store.state.blankNodeIndex
	event = new N3.BlankNode(id)
    } else if (!event && obj && obj.event) {
	event = obj.event
    }
    if (!obj.startAttribute) {
	obj = c.time(time, obj)
	obj.startAttribute = obj.attribute
	obj.attribute = null
    }
    if (!obj.event) {
	obj.event = event
    }
    if (obj.startAttribute) {
	obj.quads.push($rdf.st(event, neo.t_start, obj.startAttribute, obj.graph))
	return obj
    }
}



c.capability = function (system, func, obj) {
    var func = u.getURI(func)
    var system = u.getURI(system)
    if (func && system) {
	var capability = q.capability(system, func)
	if (capability) {
	    return { capability: capability[0] }
	} //  TODO debug code below
	else {
	    if (!obj){
		obj = {}
	    }
	    var attrib = c.attribute(neo.b_capable, func, obj)
	    var cap = c.state(system,attrib.attribute,attrib)
	    cap.capability = cap.state
	    return cap
	}
	
    }
}


c.event = function (obj) {
    if (typeof obj === 'object') {
	var capability = obj.capability
	var start = obj.start //time
	var end = obj.end     //time
	var input = obj.input
	var output = obj.output
	var cause = obj.cause
	var effect = obj.effect
	if (capability) {
	    var capURI = u.getURI(capability)
	    if (capURI && !u.isBlankNode(capability)) {
		capability = $rdf.sym(capURI)
	    }
	    var eObj = c.start(null, start, obj)
	    if (eObj.event) {
		eObj.quads.push($rdf.st(eObj.event, neo.t_execute, capability))
		if (input) {
		    if ($.type(input) !== 'array') {
			input = [input]
		    }
		    input.forEach(function (item) {
			if ($.type(item) !== 'object') {
			    item = u.getURI(item)
			    if (item) {
				item = $rdf.sym(item)
			    }
			}
			if (item) {
			    eObj.quads.push($rdf.st(item, neo.i_input, eObj.event))
			}
		    })
		}
		if (output) {
		    if ($.type(output) !== 'array') {
			output = [output]
		    }
		    output.forEach(function (item) {
			eObj.quads.push($rdf.st(eObj.event, neo.o_output, $rdf.sym(u.getURI(item))))
		    })
		}
		return eObj
	    }
	}
    }
}

c.addStateForInput = function (entity, func, result, obj) {
	entity = u.getURI(entity)
	func = u.getURI(func)
	var rUri = u.getURI(result)
	if (rUri) {
		result = $rdf.sym(rUri)
	} else if (typeof result === 'string') {
		result = $rdf.lit(result, null, xsd.string)
	} else if (typeof result === 'number') {
		result = $rdf.lit(Result, null, xsd.integer)
	}
	if (entity && func && result) {
		if (!obj) {
			obj = {}
		}
		if (!obj.quads) {
			obj.quads = []
		}
		if (!obj.input) {
			obj.input = []
		}
		const attribute = c.attribute(func, result, obj)
		const state = c.state(entity, attribute.attribute, attribute)
		delete state.attribute
		state.input = state.input.concat(state.state)
		delete state.state
		return state
	} else {
		log.error("Bad Input to c.addStateForInput", entity, func, result, obj)
	}
}

c.getTrinpodFunction = function(trinpodType) {
    switch (trinpodType) {
    case "company":
	return trinapp.w_trinapp_add_business_pod.value;
    case "project":
	return trinapp.w_trinapp_add_project.value;
    case "building":
	return trinapp.w_trinapp_add_building.value
    case "organization":
	return trinity.f_add_organization_trinpod
    case "site":
	return trinity.f_add_site_trinpod
    case "sub_org":
	return trinity.f_add_suborg_trinpod
    case "group":
	return trinity.f_add_group_trinpod
    }
}


c.checkTrinpodID = async function(trinpodID){
    if (trinpodID){
	try {
	    var response = await window.solid.session
		.fetch(
		    store.state.server +
			"/trinpodIDExists?trinpodID=" +
			trinpodID,
		    {
			credentials: "include",
		    }
		)
	    var text = await response.text()
	    return text
	    //this.trinpodIDExists = text === "Exists";
	} catch(error) {
	    log.debug(error)
	    c.trinpodIDLookupTimeout = null;
	}
    } else {
	log.error("need trinpodID to check")
    }
}

c.createTrinpods = function(podArray){
    if (Array.isArray(podArray) && podArray.length > 0){
	var pods = []
	var start = performance.now()
	$.map(podArray, async function(pod){
	    var create = await c.createTrinpod(pod[0],pod[1],pod[2],pod[3],pod[4])
	    pods.push(create)
	    log.debug(create)
	})
	var end = performance.now()
	var duration = (end - start) / 1000
	return ["finished",pods,duration]
    }
}

c.createTrinpod = async function (trinpodID,trinpodName,parentPod,trinpodType,vertical) {
    if (trinpodID && trinpodName && u.getURI(parentPod) && trinpodType){
	//add trinpodID validity check
	if (/^[a-z][a-z0-9\-]+$/.test(trinpodID)){
	    var check = await c.checkTrinpodID(trinpodID)
	    if (check !== 'Exists'){
		//check that parentpod exists
		const parentId = u.getSubdomain(parentPod)
		if (parentId){
		    const parentCheck = await c.checkTrinpodID(parentId)
		    if (parentCheck === 'Exists'){
			const url = new URL(store.state.server)
			const trinpodUri = url.protocol + "//" + trinpodID + "." + url.host + "/i";
			const podNodeURI = u.getBaseURI(parentPod);
			const trinpodFunction = c.getTrinpodFunction(trinpodType)
			if (trinpodFunction && podNodeURI && trinpodUri){
			    var obj = c.capability(store.state.webId, trinpodFunction);
			    obj = c.addStateForInput(trinpodUri,neo.m_label,trinpodName,obj)
			    obj = c.addStateForInput(trinpodUri,ns.FOAF("maker"),parentPod, obj)
			    var verticalType = ns.NEO("a_pod-solid");
			    if (vertical === "construction") {
				verticalType = ns.NEO("a_pod-construction");
			    }
			    obj = c.addStateForInput(trinpodUri,ns.RDF("type"),verticalType,obj)
			    const event = c.event(obj);
			    const turtle = c.quadsToTurtle(event.quads);
			    //log.debug("event",event,obj)
			    var start = performance.now()
			    await window.solid.session.fetch(
				u.getBaseURI(parentPod) + "/node/Substance",
				{
				    credentials: "include",
				    method: "PATCH",
				    body: "INSERT DATA {" + turtle + "}",
				    headers: { "Content-Type": "application/sparql-update" },
				}
			    );
			    var finish = performance.now()
			    var duration = (finish - start) / 1000
			    return ["created",{uri: trinpodUri,
					       trinpodID: trinpodID,
					       duration: duration}]
			} else {
			    log.error("could not build pod info",{trinpodFunction: trinpodFunction,
								  podNodeURI: podNodeURI,
								  trinpodUri: trinpodUri})
			    c.createAlert("Error:",
					  "Could not build Pod information",
					  "TrinPod Function: " + ur.getLabel(trinpodFunction) +
					  " , Parent uri: " + podNodeURI + " , TrinPod uri: " + trinpodUri,
					  "danger",
					  true,
					  true,
					  "pageMessages"
					 )
			    return ["error","could not build pod info",{trinpodFunction: trinpodFunction,
									podNodeURI: podNodeURI,
									trinpodUri: trinpodUri}
				   ]
			}
		    } else {
			log.error("Unable to find parent pod",{parentId: parentId,
								    parentPod: parentPod,
								    trinpodID: trinpodID})
			c.createAlert("Error:",
				      "Unable to find Parent TrinPod",
				      "Parent TrinPod: " + parentPod + " , New TrinPod user: " + trinpodID,
				      "danger",
				      true,
				      true,
				      "pageMessages"
				     )
			return ["error","Unable to find parent pod",{parentId: parentId,
									  parentPod: parentPod,
									  trinpodID: trinpodID}]
		    }
		} else {
		    log.error("Unable to make parentId",{parentPod: parentPod,
							 trinpodID: trinpodID})
		    c.createAlert("Error:",
				  "Unable to make parentId",
				  "Parent TrinPod: " + parentPod + " , New TrinPod user: " + trinpodID,
				  "danger",
				  true,
				  true,
				  "pageMessages"
				 )
		    return ["error","Unable to make parentId",{parentPod: parentPod,
							       trinpodID: trinpodID}]
		}
	    } else {
		log.error("That trinpodID is already being used:",trinpodID)
		c.createAlert("Error:",
			      "That TrinPod ID is already being used",
			      "Parent TrinPod: " + trinpodID,
			      "danger",
			      true,
			      true,
			      "pageMessages"
			     )
		return ["error","That trinpodID is already being used:",trinpodID]
	    }
	} else {
	    log.error("Invalid trinpodID /^[a-z][a-z0-9\-]+$/.test(trinpodID)",trinpodID)
	    c.createAlert("Error:",
			  "Invalid TrinPod ID",
			  "ID must start with a letter and can include any letters or numbers",
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	    return ["error","Invalid trinpodID /^[a-z][a-z0-9\-]+$/.test(trinpodID)",trinpodID]
	}
    } else {
	log.error("missing information to build pod",{trinpodID: trinpodID,
						      trinpodName: trinpodName,
						      parentPod: parentPod,
						      trinpodType: trinpodType})
	c.createAlert("Error:",
		      "Missing information to build Pod",
		      "TrinPod ID: " + trinpodID +
		      " , Name: " + trinpodName + " , Parent TrinPod: " + parentPod
		      + " ,Type: " + trinpodType,
		      "danger",
		      true,
		      true,
		      "pageMessages"
		     )
	return ["error","missing information to build pod",{trinpodID: trinpodID,
							    trinpodName: trinpodName,
							    parentPod: parentPod,
							    trinpodType: trinpodType}]
    }
}

c.addMember = async function(parentWebid,memberWebids,addEmployee){
    var start = performance.now()
    const validParent = await ur.validateWebId(parentWebid)
    //note if one member fails whole command fails
    if (typeof(memberWebids) === 'string'){
	memberWebids = [memberWebids]
    }
    if (Array.isArray(memberWebids) && memberWebids.length > 0){
	var members = []
	var invalidMembers = []
	var alreadyMember = []
	if (validParent){
	    if (!addEmployee || (addEmployee && (ur.isPodBusiness(parentWebid) ||
						ur.isPodOrganization(parentWebid)))){
		var currentMembers = ur.getMember(parentWebid)
		if (!Array.isArray(currentMembers)){
		    currentMembers = []
		}
		if (ur.isPodProject(parentWebid) ||
		    ur.isPodBusiness(parentWebid) ||
		    ur.isPodOrganization(parentWebid) ||
		    ur.isPodGroup(parentWebid)){
		    await Promise.all(memberWebids.map(async (member) => {
			const validMember = await ur.validateWebId(member)
			if (validMember){
			    if (currentMembers.includes(member)){
				log.error("Already a member",{memberWebId: member,
							      parentWebid: parentWebid})
				
				alreadyMember.push(member)
			    } else {
				members.push(member)
			    }
			} else {
			    log.error("Invalid member",member)
			    invalidMembers.push(member)
			}
		    }))
		    if (alreadyMember.length > 0){
			log.error("Existing members included",{parentWebid: parentWebid,
							 alreadyMember: alreadyMember,
							       invalidMembers: invalidMembers})
			c.createAlert("Error:",
				      "Existing members included",
				      "Parent: " + parentWebid + " , Existing: " + alreadyMembers.join(),
				      "danger",
				      true,
				      true,
				      "pageMessages"
				     )
			return ["error","Existing members included",{parentWebid: parentWebid,
								     alreadyMember: alreadyMember,
								     invalidMembers: invalidMembers}]
		    } else if (invalidMembers.length > 0){
			log.error("Invalid member webids included",{parentWebid: parentWebid,
							      alreadyMember: alreadyMember,
								    invalidMembers: invalidMembers})
			c.createAlert("Error:",
				      "Existing member webids included",
				      "Parent: " + parentWebid + " , Invalid: " + invalidMembers.join(),
				      "danger",
				      true,
				      true,
				      "pageMessages"
				     )
			return ["error","Invalid member webids included",{parentWebid: parentWebid,
									  alreadyMember: alreadyMember,
									  invalidMembers: invalidMembers}]
		    } else {
			var Function
			if (addEmployee){
			    Function = trinapp.w_trinapp_add_employee.value
			} else {
			    Function = trinapp.w_trinapp_add_member.value
			}
			var obj = c.capability(store.state.webId,Function)
			if (obj){
			    for (const member of members){
				obj = c.addStateForInput(
				    parentWebid,
				    ns.VCARD("hasMember"), 
				    member,
				    obj
				)
			    }
			    const event = c.event(obj);
			    const turtle = c.quadsToTurtle(event.quads);
			    await window.solid.session.fetch(
				u.getBaseURI(parentWebid) + "/node/Substance",
				{
				    credentials: "include",
				    method: "PATCH",
				    body: "INSERT DATA {" + turtle + "}",
				    headers: { "Content-Type": "application/sparql-update" },
				}
			    )
			    var finish = performance.now()
			    var duration = (finish - start) / 1000
			    return ["added",{members: members,
					     parentWebid: parentWebid,
					     duration: duration}]
			} else {
			    log.error("User does not have required capability",{user: store.state.webId,
										Function: Function})
			    c.createAlert("Error:",
					  "Your webid does not have required capability",
					  "Webid: " + store.state.webid + " , Function: " + ur.getLabel(Function),
					  "danger",
					  true,
					  true,
					  "pageMessages"
					 )
			    return ["error","User does not have required capability",{user: store.state.webId,
										      Function: Function}]
			}
		    }
		} else {
		    log.error("Parent Pod type does not have members",parentWebid)
		    c.createAlert("Error:",
				  "Parent Pod type does not have members",
				  "Parent Webid: " + parentWebid,
				  "danger",
				  true,
				  true,
				  "pageMessages"
				 )
		    return ["error","Parent Pod type does not have members",parentWebid]
		}
	    } else {
		log.error("Parent Pod type does not have employees",parentWebid)
		c.createAlert("Error:",
			      "Parent Pod type does not have employees",
			      "Parent Webid: " + parentWebid,
			      "danger",
			      true,
			      true,
			      "pageMessages"
			     )
		return ["error","Parent Pod type does nt have employees",parentWebid]
	    }	    
	} else {
	    log.error("Invalid parentWebid",{parentWebid: parentWebid,
					     memberWebids: memberWebids})
	    c.createAlert("Error:",
			  "Invalid Parent Webid",
			  "Parent Webid: " + parentWebid,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	    return ["error","Invalid parentWebid",{parentWebid: parentWebid,
						   memberWebids: memberWebids}]
	}
    } else {
	log.error("Invalid memberWebids",{parentWebid: parentWebid,
					  memberWebids: memberWebids})
	c.createAlert("Error:",
		      "Invalid Member Webids",
		      "Member Webids: " + memberWebids.join(),
		      "danger",
		      true,
		      true,
		      "pageMessages"
		     )
	return ["error","Invalid memberWebids",{parentWebid: parentWebid,
						memberWebids: memberWebids}]
    }
}

c.createContainer = async function(podWebid,parentContainer,name){
    var start = performance.now()
    if (typeof(name) === 'string'){
	const validParent = await ur.validateWebId(podWebid)
	if (validParent){
	    await ur.aLoadURI(parentContainer)
	    if (ur.isContainer(parentContainer)){
		const newFolderUri =
		      parentContainer + encodeURIComponent(name) + "/";
		if (ur.isContainer(newFolderUri)){
		    var finish = performance.now()
		    var duration = (finish - start) / 1000
		    return ["exists",{containerUri: newFolderUri,
				      duration: duration}]
		} else {
		    try {
			const res = await window.solid.session.fetch(newFolderUri, {
			    method: "PUT",
			    body:
			    '<> <http://www.w3.org/2000/01/rdf-schema#label> "' +
				decodeURIComponent(name) +
				'" .',
			    headers: {
				"Content-Type": "text/turtle",
				link: '<http://www.w3.org/ns/ldp#Container>; rel="type", <http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
			    },
			});
			if (!res.ok){
			    throw res.status + " " + res.statusText;
			} else {
			    var finish = performance.now()
			    var duration = (finish - start) / 1000
			    return ["created",{uri: res.url,
					       duration: duration}]
			}
			
		    } catch (error) {
			alert(error);
		    }
		}
		
	    } else {
		log.error("Invalid parentContainer",{podWebid: podWebid,
						     parentContainer: parentContainer,
						     name: name})
		c.createAlert("Error:",
			      "Invalid Parent Container",
			      "Pod: " + podWebid + " , Parent Container: " + parentContainer +
			      " , Name: " + name,
			      "danger",
			      true,
			      true,
			      "pageMessages"
			     )
		return ["error",{podWebid: podWebid,
				 parentContainer: parentContainer,
				 name: name}]
	    }
	} else {
	    log.error("Invalid podWebid",{podWebid: podWebid,
					  parentContainer: parentContainer,
					  name: name})
	    c.createAlert("Error:",
			  "Invalid Pod Webid",
			  "Pod: " + podWebid + " , Parent Container: " + parentContainer +
			  " , Name: " + name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	    return ["error","Invalid podWebid",{podWebid: podWebid,
						parentContainer: parentContainer,
						name: name}]
	}
    } else {
	
    }
}

/*
https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle
https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle
https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
*/

c.count = 0

c.uploadSize = 0
c.totalSize = 0
c.toUploadCount = 0

c.allNodes = []

c.importDirectoryTree = async function(pod,rootPath){
    log.debug("importDirectory",pod, rootPath)
    if (!rootPath){
	rootPath = "/home/"
    }
    var start = performance.now()
    if (!pod){
	pod = store.state.webId
    }
    const isTrinApp = c.isTrinApp()
    const where = $rdf.blankNode()
    const rootFolder = await window.showDirectoryPicker()
    const rootNode = $rdf.blankNode()
    const zip = new JSZip()
    if ($.type(rootFolder) === 'object' && rootFolder.kind === 'directory' && rootFolder.name){
	rootNode.path = encodeURIComponent(rootFolder.name) + "/"
	rootNode.pod = pod
	rootNode.handle = rootFolder
	var errors = []
	rdfStore.add(rootNode,ns.RDF('type'),ns.LDP('BasicContainer'),where)
	rdfStore.add(rootNode,ns.RDFS('label'),"Root",where)
	rdfStore.add(rootNode,ns.NEO("m_folder"),"/home/" + rootFolder.name + "/",where)
	for await (const handle of rootFolder.values()) {
	    errors.push( await c.importDirectoryRecurse(rootNode,handle,where,errors))
	    log.debug(handle.kind, handle.name);
	}
	var finish = performance.now()
	var duration = (finish - start) / 1000
	
    } else {
	log.error("Cound not resove directory",{rootFolder: rootFolder})
	return ["error","Cound not resove directory",{rootFolder: rootFolder}]
    }
    //Now manage the uploads
    const directories = ur.getContents(rootNode)
    if (!directories){
	directories = rootNode
    }
    c.count = 0
    //first calculate overall size
     for (const directory of directories){
	const contents = ur.getContentsNested(directory)
	if (Array.isArray(contents) && contents.length > 0){
	    contents.forEach(item => {
		if (!item.permUri){
		    if (item.handle.kind === 'file'){
			c.totalSize += item.size
			c.count += 1
		    }
		}
	    })	    
	}
     }
    c.uploadSize = c.totalSize
    c.toUploadCount = c.count
    for (const directory of directories){
	const contents = ur.getContentsNested(directory)
	var toUpload = []
	if (Array.isArray(contents) && contents.length > 0){
	    contents.forEach(item => {
		if (!item.permUri){
		    if (item.handle.kind === 'file'){
			toUpload.push(item)
		    }
		}
	    })
	    c.appMessage("")
	    if (toUpload.length > 0){
		for (const item of toUpload){
		    var currentContainer = ur.getContainer(item)
		    if ($.type(currentContainer) === 'object'){
			currentContainer = currentContainer.name
		    }
		    if (typeof(currentContainer) !== 'string'){
			currentContainer = decodeURIComponent(item.path.split("/").reverse()[1])
		    }
		    if (item.handle.kind === 'file'){
			if (!isTrinApp){
			    c.appMessage("Uploading: " + Math.round(100 - ((c.uploadSize / c.totalSize) * 100)) + "% (" +
					 (c.count - c.toUploadCount) + " of " + c.count + ")<br>" +
					 currentContainer + "<br>" + item.name)
			    await c.uploadFile(item,null,null,null,rootPath)
			} else {
			    const file = await item.handle.getFile()
			    zip.file(item.path,file,{date: new Date(file.lastModifiedDate)})
			}
			c.toUploadCount -= 1
			c.uploadSize = c.uploadSize - item.size
			log.debug("item",item,ur.getContainer(item))
		    }
		}
		c.appMessage("")
	    }
	}
    }
    
    log.debug("zip",zip)
    if (isTrinApp){
	try {
	    var requestUri = u.getBaseURI(pod) + rootPath
	    var file = await zip.generateAsync({type: "uint8array"})
	    var result = await window.solid.session.fetch(requestUri, {
		method: "PUT",
		body: file,
		headers: { link: '<https://trinity.graphmetrix.net/node/t_2qv>; rel="type"'
			}
	    });
	    c.createAlert("Please Note:",
			  "I will send you an email notification when the bulk upload is complete",
			  "",
			  "success",
			  true,
			  true,
			  "pageMessages"
			 )
	} catch (error) {
	    alert(error);
	}
	//alert message email

	
    }
    //delete 
    rdfStore.removeMatches(null,null,null,where)
    return ["imported",{rootNode: rootNode,
			toUpload: toUpload,
			uploadSize: c.uploadSize,
			where: where,
			errors: errors.flat(),
			duration: duration
		       }]
    
}

c.appMessage = function(message){
    if (message === ""){
	message = null
    }
    if (c.isTrinApp() === true){
	store.commit("apiMessage",message)
    }
}

c.importDirectoryRecurse = async function(parentNode,handle,where,errors){
    const handleResults = await c.importHandleNode(handle,where,errors,parentNode)
    //log.debug(handleResults)
    if (Array.isArray(handleResults)){
	const node = handleResults[0]
	//log.debug("node",node)
	const obj = handleResults[1]
	if ($.type(obj) === 'object'){
	    errors = obj.errors	    
	    if ($.type(node) === 'object' && node.termType === 'BlankNode'){
		rdfStore.add(parentNode,ns.LDP('contains'),node,where)
		const kind = handleResults[1].kind
		if (kind && kind === "directory"){
		    //log.debug("handle",await handle.values())
		    for await (const entry of handle.values()) {
			//log.debug("entry", entry)
			
			errors.push( await c.importDirectoryRecurse(node,entry,where,errors.flat()))
			//log.debug(entry.kind, entry.name);
		    }
		    
		} else if (kind && kind === "file"){
		    //log.debug("file",node.path)
		}
		    
		    
	    } else {
		log.error("Unable to create handle node",{parentNode: parentNode,
							  handle: handle,
							  where: where})
		c.createAlert("Error:",
			  "Unable to create handle node",
			  "Kind: " + handle.kind + " , Name: " + handle.name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
		errors.push(["error","Unable to create handle node",{parentNode: parentNode,
								     handle: handle,
								     where: where}])
	    }
	} else {
	    log.error("Bad object returned from importHandleNode",{parentNode: parentNode,
								   node: node,
								   handleResults: handleResults,
								   handle: handle,
								   where: where})
	    c.createAlert("Error:",
			  "Bad object returned from import",
			  "Parent: " + parentNode.name + " , Node: " + node.name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	    errors.push(["error","Bad object returned from importHandleNode",{parentNode: parentNode,
								   node: node,
								   handleResults: handleResults,
								   handle: handle,
									      where: where}])
	}
    } else {
	log.error("Unable to get importHandleNode results",{parentNode: parentNode,
							    handle: handle,
							    where: where})
	c.createAlert("Error:",
			  "Unable to get import results",
			  "Parent: " + parentNode.name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	errors.push(["error","Unable to get importHandleNode results",{parentNode: parentNode,
								       handle: handle,
								       where: where}])
    }
    return errors.flat()
}

c.importHandleNode = async function(handle,where,errors,parentNode){
    const node = $rdf.blankNode()
    node.handle = handle
    c.count = c.count + 1
    //log.debug("count",c.count)
    c.allNodes.push(node)
    node.pod = parentNode.pod
    const name = handle.name
    //conditional character resolution when unzip missing encoding data between regions
    var encName = ""
    for (let letter of name) {
	var code = letter.codePointAt(0)
	if (code > 300){
	    node.encodingIssue = name
	}
	switch(code){
	case 1089:
	    encName += "ß"
	    delete node.encodingIssue
	    break;
	case 1044:
	    encName += "ä"
	    delete node.encodingIssue
	    break;
	case 1054:
	    encName += "Ä"
	    delete node.encodingIssue
	    break;
	case 1041:
	    encName += "ü"
	    delete node.encodingIssue
	    break;
	case 1066:
	    encName += "Ü"
	    delete node.encodingIssue
	    break;
	case 1060:
	    encName += "ö"
	    delete node.encodingIssue
	    break;
	case 1065:
	    encName += "Ö"
	    delete node.encodingIssue
	    break;
	case 1042:
	    encName += "é"
	    delete node.encodingIssue
	    break;
	default:
	    encName += letter
	    break;
	}
    }
    node.name = encName
    const kind = handle.kind
    node.path = parentNode.path + encodeURIComponent(node.name)
    var rawPath = parentNode.path + node.name
    rdfStore.add(node,ns.NEO("m_folder"),rawPath,where)
    var type
    if (kind === "directory"){
	type = ns.LDP('BasicContainer')
	node.path = node.path + "/"
    } else if (kind === "file"){
	type = ns.REG('file')
	const file = await handle.getFile(handle)
	node.size = file.size
	node.modified = file.lastModified
	node.mimeType = file.type
    }
    if (type){
	rdfStore.add(node,ns.RDF('type'),type,where)
    } else {
	log.error("Unable to determine type",{handle: handle,
					      node: node,
					      name: name,
					      kind: kind})
	c.createAlert("Error:",
			  "Unable to determine type",
			  "Name: " + name + " , Kind: " + kind,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	errors.push(["error","Unable to determine type",{handle: handle,
							 node: node,
							name: name,
							kind: kind}])
    }
    if (name){
	rdfStore.add(node,ns.RDFS('label'),name,where)
    } else {
	log.error("Unable to determine name",{handle: handle,
					      node: node,
					      name: name,
					      kind: kind})
	c.createAlert("Error:",
			  "Unable to determine name",
			  "Node: " + node.value + " , Kind: " + kind,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	errors.push(["error","Unable to determine name",{handle: handle,
							 node: node,
							name: name,
							kind: kind}])
    }
    return [node,{name: name,
		  kind: kind,
		  errors: errors.flat()}]
}
    
c.uploadFile = async function (handleOrBlank,containerNode,name,pod,rootPath){
    if (!rootPath){
	rootPath = "/home/"
    }
    var start = performance.now()
    var handle
    var newUri
    var isBlank
    if (u.isBlankNode(handleOrBlank)){
	isBlank = true
	handle = handleOrBlank.handle
	name = handleOrBlank.name
	var pod = handleOrBlank.pod
	if (!pod){
	    pod = store.state.webId
	} else if (handleOrBlank.name){
	    name = handleOrBlank.name
	}
	var path = handleOrBlank.path
	if (!path){
	    log.error("Could not find upload directory path",{handleOrBlank: handleOrBlank,
							    containerNode: containerNode,
							    name: name,
							     pod: pod})
	    c.createAlert("Error:",
			  "Could not find upload directory path",
			  "File: " + name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	    return ["error","Could not find upload directory path",{handleOrBlank: handleOrBlank,
								   containerNode: containerNode,
								   name: name,
								   pod: pod}]
	} else {
	    newUri = u.getBaseURI(pod) + rootPath + path
	}
    } else if (ur.isContainer(containerNode) && !u.isBlankNode(containerNode)){
	handle = handleOrBlank	
	newUri = u.getURI(containerNode) + encodeURIComponent(name)
    }
    if (!newUri){
	log.error("Unable to resove request uri",{handleOrBlank: handleOrBlank,
						  containerNode: containerNode,
						  handle: handle,
						  name: name,
						  pod: pod})
	 c.createAlert("Error:",
			  "Unable to resove request uri",
		       "Container: " + u.getURI(containerNode) + " , File: " + name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	return ["error","Unable to resove request uri",{handleOrBlank: handleOrBlank,
							containerNode: containerNode,
							handle: handle,
							name: name,
							pod: pod}]
    } else {
	if ($.type(handle) === 'object'){
	    if (handle.kind === 'file'){
		var file = await handle.getFile()
		if ($.type(file) === 'object' && file.size){
		    file = await file.arrayBuffer()
		    file = await new Uint8Array(file)
		    if (u.checkURL(newUri)){
			try {
			    var result = await window.solid.session.fetch(newUri, {
				method: "PUT",
				body: file,
			    });
			    if (!new RegExp("^2..$").test(result.status)) {
				alert("Upload failed:" + result.status + " - " + result.statusText);
				return;
			    } else {
				var finish = performance.now()
				var duration = (finish - start) / 1000
				var permUri = await result.headers.get('Content-Location')
				if (u.isBlankNode(handleOrBlank)){
				    handleOrBlank.permUri = permUri
				}
				var response = [result.statusText,{result: result,
								   uri: permUri,
								   duration: duration}]
				
				log.debug(response)
				return response
			    }
			}
			catch (error) {
			    alert(error);
			}
		    } else {
			log.error("Unable to resolve container uri",{handleOrBlank: handleOrBlank,
								     newUri: newUri,
								     containerNode: containerNode,
								     handle: handle,
								     name: name,
								     pod: pod})
			c.createAlert("Error:",
			  "Unable to resolve container uri",
			  "Path: " + path + " , File: " + name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
			return ["error","Unable to resolve container uri",{handleOrBlank: handleOrBlank,
									   newUri: newUri,
									   containerNode: containerNode,
									   handle: handle,
									   name: name,
									   pod: pod}]
		    }
		} else {
		    log.error("Unable to retrieve file",{containerNode: containerNode,
							 handle: handle,
							 file: file,
							 name: name})
		    c.createAlert("Error:",
			  "Unable to retrieve file",
			  "Path: " + path + " , File: " + name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
		    return ["error","Unable to retrieve file",{containerNode: containerNode,
							       handle: handle,
							       file: file,
							       name: name}]
		}
	    } else {
		log.error("Handle is not a file",{containerNode: containerNode,
						     handle: handle,
						     name: name})
		c.createAlert("Error:",
			  "Handle is not a file",
			  "Path: " + path + " , File: " + name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
		return ["error","Handle is not a file",{containerNode: containerNode,
							   handle: handle,
							   name: name}]
	    }
	} else {
	    log.error("Invalid file handle",{containerNode: containerNode,
					     handle: handle,
					     name: name})
	    c.createAlert("Error:",
			  "Unable to retrieve file",
			  "Container: " + u.getURI(containerNode) +
			  "Path: " + path + " , File: " + name,
			  "danger",
			  true,
			  true,
			  "pageMessages"
			 )
	    return ["error","Invalid file handle",{containerNode: containerNode,
						   handle: handle,
						   name: name}]
	}
    }
}
    


c.quadsToTurtle = function (quads) {
	if (quads && Array.isArray(quads)) {
		var triples = []
		var result
		var Ns = {}
		var Default = new N3.DefaultGraph()
		quads.forEach(function (q) {
			q.graph = Default
			triples.push(q)
		})
		Ns.u1 = ns.U1().value
		Ns.solid = ns.SOLID().value
		Ns.neo = ns.NEO().value
		Ns.ldp = ns.LDP().value
		Ns.rdf = ns.RDF().value
		Ns.rdfs = ns.RDFS().value
		Ns.sio = ns.SIO().value
		Ns.acl = ns.ACL().value
		Ns.vcard = ns.VCARD().value

		const writer = new N3.Writer({ prefixes: Ns })
		writer.addQuads(quads)
		writer.end((error, res) => result = res)
		return result
	}
}

////this was placed into util-c.js because the line "const N3 = require('n3')" seemed to cause problems in pod-main-properties-actions.vue
c.createReadTriple = function(uri){
	//blank node entity to represent the new authorization object to create states for :
    store.commit('blankNodeIncrement');
    const id = store.state.blankNodeIndex;
    var authorization = new N3.BlankNode(id);

    const triples = []
    const Default = new N3.DefaultGraph()//make a default node as per util-c
    triples.push($rdf.st(authorization,ns.ACL('accessTo'),$rdf.sym(uri),Default))
    triples.push($rdf.st(authorization,ns.ACL('agentClass'),ns.FOAF('Agent'),Default))
    triples.push($rdf.st(authorization,ns.ACL('mode'),ns.ACL('Read'),Default))
	triples.push($rdf.st(authorization,ns.RDF('type'),ns.ACL('Authorization'),Default))

    return triples;
}

c.createAlert = function(
    title,
    summary,
    details,
    severity,
    dismissible,
    autoDismiss,
    appendToId
) {
    var iconMap = {
	info: "fa fa-info-circle",
	success: "fa fa-thumbs-up",
	warning: "fa fa-exclamation-triangle",
	danger: "fa ffa fa-exclamation-circle",
    };
    
    var iconAdded = false;
    
    var alertClasses = ["alert", "animated", "flipInX"];
    alertClasses.push("alert-" + severity.toLowerCase());
    
    if (dismissible) {
	alertClasses.push("alert-dismissible");
    }
    
    var msgIcon = $("<i />", {
	class: iconMap[severity], // you need to quote "class" since it's a reserved keyword
    });
    
    var msg = $("<div />", {
	class: alertClasses.join(" "), // you need to quote "class" since it's a reserved keyword
    });
    
    if (title) {
	var msgTitle = $("<h4 />", {
	    html: title,
	}).appendTo(msg);
	
	if (!iconAdded) {
	    msgTitle.prepend(msgIcon);
	    iconAdded = true;
	}
    }
    
    if (summary) {
	var msgSummary = $("<strong />", {
	    html: summary,
	}).appendTo(msg);
	
	if (!iconAdded) {
	    msgSummary.prepend(msgIcon);
	    iconAdded = true;
	}
    }
    
    if (details) {
	var msgDetails = $("<p />", {
	    html: details,
	}).appendTo(msg);
	
	if (!iconAdded) {
	    msgDetails.prepend(msgIcon);
	    iconAdded = true;
	}
    }
    
    if (dismissible) {
	var msgClose = $("<span />", {
	    class: "close", // you need to quote "class" since it's a reserved keyword
	    "data-dismiss": "alert",
	    html: "<i class='fa fa-times-circle'></i>",
	}).appendTo(msg);
    }
    
    $("#" + appendToId).prepend(msg);
    
    if (autoDismiss) {
	setTimeout(function () {
	    msg.addClass("flipOutX");
	    setTimeout(function () {
		msg.remove();
	    }, 5000); //was 1000
	}, 6000);//was 5000
    }
}


export default c
