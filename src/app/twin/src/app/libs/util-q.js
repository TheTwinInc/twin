//Q = QUERY

const $ = require('jquery')

import * as log from "loglevel"

import { ns, nu, nl, neo, trinity } from './ontologies'

import { rdfStore, $rdf } from './rdfStore'

import u from './util'
import ur from './util-rdf'
import store from './store'

const q = {}

q.substance = function (uri) {
	//return substance graph uri for a pod
}


q.cause = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		if (ur.isEvent(uri)) {
		    var qs = u.unique(rdfStore.match(null, neo.f_cause, $rdf.sym(uri)))
			if (qs && qs.length > 0) {
				var cause = []
				qs.forEach(q => cause.push(q.subject.value))
				return cause
			}
		}
	}
}

q.effect = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		if (ur.isEvent(uri)) {
		    var qs = u.unique(rdfStore.match($rdf.sym(uri), neo.f_cause))
			if (qs && qs.length > 0) {
				var effect = []
				qs.forEach(q => effect.push(q.object.value))
				return effect
			}
		}
	}
}

q.capability = function (item, Function) {
	var uri = u.getURI(item)
	if (uri) {
		if (ur.isEvent(uri)) {
			var quad = rdfStore.anyStatementMatching($rdf.sym(uri), neo.t_execute)
			if (quad) {
				return quad.object.value
			}
		} else {
			var func
			var funcNode = null
			if (Function) {
				func = u.getURI(Function)
				if (func) {
					funcNode = $rdf.sym(func)
				}
			}
		    var cqs = u.unique(rdfStore.match($rdf.sym(uri), neo.b_capable, funcNode))
			if (cqs.length > 0) {
				var caps = []
				//need to convert to state
				cqs.forEach(function (q) {
					var state = ur.quadToState(q)
					if (state) {
						caps.push(state)
					}
				})
				if (Array.isArray(caps) && caps.length > 0) {
					return caps
				}
			}
		}
	}
}

q.input = function (item) {
	var uri = u.getURI(item)
	var result = []
	if (uri) {
		var node = $rdf.sym(uri)
		if (ur.isEvent(uri)) {
		    var qs = u.unique(rdfStore.match(null, neo.i_input, node))
			if (qs.length > 0) {
				qs.forEach(q => result.push(q.subject.value))
			}
		} else if (ur.isState(uri)) {
		    var qs = u.unique(rdfStore.match(node, neo.i_input))
			if (qs.length > 0) {
				qs.forEach(q => result.push(q.object.value))
			}
		} else if (ur.isEntity(uri)) {
			var states = q.state(uri)
			if (states) {
				states.forEach(function (s) {
					var res = q.input(s)
					if (res.length > 0) {
					    result = u.unique(result.concat(res))
					}
				})
			}
		}
	}
    return u.unique(result)
}

q.output = function (item) {
	var uri = u.getURI(item)
	var result = []
	if (uri) {
		var node = $rdf.sym(uri)
		if (ur.isEvent(uri)) {
		    var qs = u.unique(rdfStore.match(node, neo.o_output))
			if (qs.length > 0) {
				qs.forEach(q => result.push(q.object.value))
			}
		} else if (ur.isState(uri)) {
		    var qs = u.unique(rdfStore.match(null, neo.o_output, node))
			if (qs.length > 0) {
				qs.forEach(q => result.push(q.subject.value))
			}
		} else if (ur.isEntity(uri)) {
			var states = q.state(uri)
			if (states) {
				states.forEach(function (s) {
					var res = q.output(s)
					if (res.length > 0) {
					    result = u.unique(result.concat(res))
					}
				})
			}
		}
	}
	return result
}

q.start = function(item){
    var uri = u.getURI(item)
    if (uri) {
	var start = rdfStore.anyStatementMatching($rdf.sym(uri), neo.t_start)
	if (start){
	    var elems = ur.attributeToElems(start.object)
	    if (elems){
		var lit = elems.a_result
		if (lit){
		    return lit.value
		}
	    }
	}
    }
}

q.end = function(item){
    var uri = u.getURI(item)
    if (uri) {
	var att = rdfStore.anyStatementMatching($rdf.sym(uri), neo.t_end)
	if (att){
	    var elems = ur.attributeToElems(att.object)
	    if (elems){
		var lit = elems.a_result
		if (lit){
		    return lit.value
		}
	    }
	}
    }
}

q.updateTime = function(item){
    return q.end(item) || q.start(item)
}

q.started = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		if (rdfStore.anyStatementMatching($rdf.sym(uri), neo.t_start)) {
			return true
		} else {
			return false
		}
	}
}

q.ended = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		if (rdfStore.anyStatementMatching($rdf.sym(uri), neo.t_end)) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}

q.active = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		if (q.started(uri) && !q.ended(uri)) {
			return true
		} else {
			return false
		}
	}
}

q.status = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		var status = []
		if (uri) {
			if (ur.isEvent(uri)) {
				status = q.status(q.effect(uri))
			} else {
				var node = $rdf.sym(uri)
			    var qs = u.unique(rdfStore.match(node, neo.m_status))
				if (qs && qs.length > 0) {
					qs.forEach(q => status.push(q.object.value))
				} else {
					var is = q.input(uri)
					if ($.type(is) === "array" && is.length > 0) {
						var status = []
						is.forEach(q => status.push(q.status(q)))
					}
				}
			}
			if ($.type(status) === "array" && status.length > 0) {
				return status
			} else {
				return null
			}
		}
	}
}

q.entity = function (item) {
	if (Array.isArray(item)) {
		var result = []
		var merged = []
		item.forEach(function (i) {
			result.push(q.entity(i))
		})
		result.forEach(e => {
			merged = merged.concat(e)
		})
	    return u.unique(merged)
	} else {
		var uri = u.getURI(item)
		if (uri) {
			if (ur.isState(uri)) {
			    var stmts = u.unique(rdfStore.match(null, ns.NEO('i_entity'), $rdf.sym(u.getURI(uri))))
				var ents = $.map(stmts, function (st) {
					var obj = st.subject.value
					if (!ur.isAttribute(obj)) {
						return obj
					}
				})
				if (ents) {
					return u.unique(ents)
				}
			} else if (ur.isEntity(uri)) {
				return uri
			}
		}
	}
}

q.state = function (item, func) {
    if (func){
	func = u.getURI(func)
    }
    var trys
    var uri = u.getURI(item)
    if (uri) {
	if (ur.isState(uri)) {
	    return uri
	} else if (ur.isAttribute(uri)) {
	    var quads = u.unique(rdfStore.match($rdf.sym(uri), neo.i_attribute))
	    return u.unique($.map(quads, function (quad) {
		return quad.object.value
	    }))
	} else {
	    var quads = u.unique(rdfStore.match($rdf.sym(uri), neo.i_entity))
	    return u.unique($.map(quads, function (quad) {
		if (func){
		    trys = q._function(quad.object)
		}
		if (!func || (Array.isArray(trys) && trys.includes(func))){
		    return quad.object.value
		}
	    }))
	}
    }
}

q.attribute = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		if (ur.isState(uri)) {
			var elems = ur.stateToElems(uri)
			if (typeof elems === 'object') {
				return [elems.a_attribute]
			}
		} else if (ur.isAttribute(uri)) {
			return [uri]
		} else if (ur.isEntity(uri)) {
			var states = q.state(uri)
			if (states) {
				return $.map(states, function (state) {
					return q.attribute(state)
				})
			}
		}
	}
}

q._function = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		if (Array.isArray(item)) {
			var result = []
			item.forEach(i => result.push(q._function(i)))
			return result
		} else if (ur.isEvent(uri)) {
			var cap = q.capability(uri)
			if (cap) {
				return q.result(cap)
			}
		} else {
			var elems = []
			var attributes = q.attribute(uri)
			//log.debug("function1",attributes)
			if (attributes) {
				$.map(attributes, function (attrib) {
					elems.push(ur.attributeToElems(attrib))
				})
				//log.debug("function2",elems)
				if (elems) {
					return u.unique($.map(elems, function (elem) {
						if ($.type(elem) === "object") {
							return elem.f_function
						}
					}))
				}
			}
		}
	}
}

q.result = function (item) {
	if (Array.isArray(item)) {
		var result = []
		item.forEach(i => result.push(ur.a_result(i)))
		return result
	} else {
		return ur.a_result(item)
	}
}

q.rank = function (item) {
	var uri = u.getURI(item)
	if (uri) {
	    var rank = u.unique(rdfStore.match($rdf.sym(uri), ns.NEO('m_rank')))
		if (rank && rank.length > 0) {
			return parseFloat(rank[0].object.value)
		} else {
			return 100
		}
	} else {
		return 100
	}
}

q.lastChange = function (item) {
	var uri = u.getURI(item)
	if (uri) {
		var last = rdfStore.anyStatementMatching($rdf.sym(uri), neo.m_lastChange)
		if (last) {
			return last.object.value
		}
	}
}

q.lastCapability = function (item){
    var uri = u.getURI(item)
    if (uri){
	var lastChange = q.lastChange(uri)
	var cap = q.capability(lastChange);
	if (cap){    
	    return cap
	}
    }
}

q.lastFunction = function (item){
    var cap = q.lastCapability(item)
    if (cap){
	return q.result(cap)
    }
}

q.lastSystem = function (item){
    var cap = q.lastCapability(item)
    if (cap){
	var system = q.entity(cap)
	if (Array.isArray(system)){
	    return system[0]
	}
    }
}

export default q
