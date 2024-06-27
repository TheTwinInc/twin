Values and Resources

This code has been discussed in the previous video, you can copy it and keep it to reuse it. 

Typing Literals with XML Schema Datatypes in the Turtle Syntax
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix inria: <http://inria.fr/schema#> .
<http://inria.fr/rr/doc.html>  inria:date "1995-09-18"^^xsd:date .

Typing Literals with XML Schema Datatypes in the RDF/XML Syntax
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:inria="http://inria.fr/schema#">
    <rdf:Description rdf:about="http://inria.fr/rr/doc.html">
        <inria:date rdf:datatype="http://www.w3.org/2001/XMLSchema#date">1995-09-18</inria:date>
    </rdf:Description>
</rdf:RDF>

Indicating the Language of Literals in the Turtle Syntax
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix inria: <http://inria.fr/schema#> .
<http://inria.fr/rr/doc.html>  inria:topic "Web of Data"@en , "Web de données"@fr .

Indicating the Language of Literals in the RDF/XML Syntax
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:inria="http://inria.fr/schema#">
    <rdf:Description rdf:about="http://inria.fr/rr/doc.html">
        <inria:topic xml:lang='en'>Web of Data</inria:topic>
        <inria:topic xml:lang='fr'>Web de données</inria:topic>
    </rdf:Description>
</rdf:RDF>

Typing Resources in the Turtle Syntax
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix inria: <http://inria.fr/schema#> .
<http://ns.inria.fr/catherine.faron#me> a inria:Woman , inria:Researcher .

Typing Resources in the RDF/XML Syntax
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:inria="http://inria.fr/schema#">
    <inria:Researcher rdf:about="http://ns.inria.fr/catherine.faron#me">
        <rdf:type rdf:resource="http://www.inria.fr/schema#Woman"/>
    </inria:Researcher>
</rdf:RDF>