// import { NamedNode } from "rdflib";
// import * as $rdf from 'rdflib';
import { NamedNode } from 'rdflib/lib/tf-types';
// import { NamedNode } from "@rdfjs/types";

export interface IValueUpdate {
    predicate: NamedNode;
    value: string;
    isLiteral?: boolean;
    lang?: string;
}

export interface IProfile {
    webId: string;
    name?: string;
    email?: string;
    img?: string;
    role?: string;
    org?: string;
    phone?: string;
    [key: string]: string | undefined;
}

export interface IContactProfile {
    webId: string;
    name: string;
    email?: string;
    img?: string;
    role?: string;
    org?: string;
    // img: string | null;
}

export interface IProfileData {
    name: string;
    img: string | null;
    org: string | null;
    role: string | null;
}

export interface IVCardData {
    fullName: string;
    org?: string;
    title?: string;
    email?: string;
    phone?: string;
}