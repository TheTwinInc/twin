Turtle and RDF/XML Codes to Represent RDF Bags and Lists

This code has been discussed in the previous video, you can copy it and keep it to reuse it. 

Describing a Bag of Literals in Turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix inria: <http://inria.fr/schema#> . 
<http://inria.fr/rr/doc.html> inria:author [ a rdf:Bag ;
   rdf:li "Fabien", "Catherine", "Olivier" . ] . 

Describing a Bag of Literals in RDF/XML
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:inria="http://inria.fr/schema#">
    <rdf:Description rdf:about="http://inria.fr/rr/doc.html">
      
        <inria:author>
          
            <rdf:Bag>
              
                 <rdf:li>Fabien</rdf:li>
                <rdf:li>Catherine</rdf:li>
                
                <rdf:li>Olivier</rdf:li>
                
            </rdf:Bag>
            
        </inria:author>
        
    </rdf:Description>

</rdf:RDF>

Describing a List of Resources in Turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix inria: <http://inria.fr/schema#> . 
<http://inria.fr/rr/doc.html> inria:author 
    ( <http://ns.inria.fr/fabien.gandon#me> <http://ns.inria.fr/catherine.faron#me>
<http://ns.inria.fr/olivier.corby#me> ) . 

Describing a List of Resources in RDF/XML
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:inria="http://inria.fr/schema#">
    <rdf:Description rdf:about="http://inria.fr/rr/doc.html">
      
        <inria:author rdf:parseType="Collection">
            <rdf:Description rdf:about="http://ns.inria.fr/fabien.gandon#me"/>
            
            <rdf:Description rdf:about="http://ns.inria.fr/catherine.faron#me"/>
            
            <rdf:Description rdf:about="http://ns.inria.fr/olivier.corby#me"/>
        </inria:author>
        
    </rdf:Description>

</rdf:RDF>

