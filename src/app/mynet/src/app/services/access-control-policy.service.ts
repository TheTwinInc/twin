import { Injectable } from '@angular/core';
import { AgentAccess } from '@app/interfaces';
import { RdfService } from '@app/services';
import { ns } from '@app/utils';

@Injectable({
    providedIn: 'root'
})
export class AccessControlPolicyService {

    constructor(
        private rdfService: RdfService
    ) {
        
    }

    private async getAcpUrl(resourceUrl: string): Promise<string> {
        // Convention: resource + ".acp"
        return resourceUrl.endsWith('.acp') ? resourceUrl : `${resourceUrl}.acp`;
    }

    async getAccess(resourceUrl: string, agentWebId: string): Promise<AgentAccess | null> {
        let result = null;
        const acpUrl = await this.getAcpUrl(resourceUrl);
        await this.rdfService.loadResource(acpUrl);

        // Find all policies mentioning this agent
        const policies = this.rdfService.getStatements(null, ns.ACP('agent'), agentWebId);
        if (policies.length) {
            const modes = new Set<string>();

            policies.forEach(pol => {
                const policy = pol.subject;
                const allowModes = this.rdfService.getStatements(policy.value, ns.ACP('allow'));
                allowModes.forEach(m => modes.add(m.object.value));
            });

            result = {
                webId: agentWebId,
                read: modes.has(ns.ACL('Read').value),
                write: modes.has(ns.ACL('Write').value),
                append: modes.has(ns.ACL('Append').value),
                control: modes.has(ns.ACL('Control').value)
            };
            
        };
        return result;
    }

    async setAccess(resourceUrl: string, access: AgentAccess): Promise<void> {
        const acpUrl = await this.getAcpUrl(resourceUrl);
        await this.rdfService.loadResource(acpUrl);

        // Remove old policies for this agent
        const oldPolicies = await this.rdfService.getTriples(null, ns.ACP('agent'), access.webId);
        if (undefined != oldPolicies) {
            oldPolicies.forEach(s => this.rdfService.removeStatements(this.rdfService.getStatements(s.subject)));    
        }
        

        // Define new policy and access control nodes
        const policyNode = this.rdfService.sym(`#policy-${btoa(access.webId).replace(/=/g, '')}`);
        const acNode = this.rdfService.sym(`#ac-${btoa(resourceUrl).replace(/=/g, '')}`);

        // Build the policy triples
        this.rdfService.addTriple(policyNode, ns.RDF('type'), ns.ACP('Policy'));
        this.rdfService.addTriple(policyNode, ns.ACP('agent'), this.rdfService.sym(access.webId));

        if (access.read) this.rdfService.addStatement(this.rdfService.toQuad(policyNode, ns.ACP('allow'), ns.ACL('Read')));
        if (access.write) this.rdfService.addStatement(this.rdfService.toQuad(policyNode, ns.ACP('allow'), ns.ACL('Write')));
        if (access.append) this.rdfService.addStatement(this.rdfService.toQuad(policyNode, ns.ACP('allow'), ns.ACL('Append')));
        if (access.control) this.rdfService.addStatement(this.rdfService.toQuad(policyNode, ns.ACP('allow'), ns.ACL('Control')));

        // Build the AccessControl triples
        this.rdfService.addTriple(acNode, ns.RDF('type'), ns.ACP('AccessControl'));
        this.rdfService.addTriple(acNode, ns.ACP('apply'), policyNode);
        this.rdfService.addTriple(acNode, ns.ACP('accessTo'), this.rdfService.sym(resourceUrl));

        // Serialize and PUT back to Pod
        const newAcpTurtle = this.rdfService.serialize(null, null, acpUrl);

        await fetch(acpUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/turtle' },
        body: newAcpTurtle,
        credentials: 'include'
        });
    }
}
