var fs = require('fs');
var path = require('path');
var jsonxml = require('jsontoxml');

var filePrams=[
    {
        fileName: "tagsFR.csv.json",
        urlName: "keosphereTags",
        rdfName: "keosphereTags",
    },
    {
        fileName: "categoriesFR.csv.json",
        urlName: "keosphereCategories",
        rdfName: "keosphereCategories",
    },
    {
        fileName: "categoriesFR.csv.json",
        urlName: "keosphereCategories2",
        rdfName: "keosphereCategories2",
    }
]
var currentFileParamIndex=2;



var file = path.resolve(__dirname , "D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\toutlesens\\plugins\\keolis\\"+filePrams[currentFileParamIndex].fileName);
fs.readFile(file, function (err, data) {
    var thesaurusUri = "http://keolis.com/"+filePrams[currentFileParamIndex].urlName+"/";

    var parentsMap={}
    var json = JSON.parse("" + data);
    json.data.forEach(function(line) {
        if(!parentsMap[line.parentID])
            parentsMap[line.parentID]={nom:line.parent,iD:line.parentID,children:[]}
        parentsMap[line.parentID].children.push (line);
    })





    var uniqueNodes={};
var checkUniques=function(node){
    if(true) {
        if (!uniqueNodes[node.nom]) {
            uniqueNodes[node.nom] = node.iD;
        } else {
            node.iD= uniqueNodes[node.nom];

        }
        return node;
    }
    return node;
}

    var xx=parentsMap;

    var skosJsonNodes=[]
    for (var key in parentsMap){
        var parent=parentsMap[key]

        parent=checkUniques(parent);


        var concept = {
            name: "skos:Concept",
            attrs: {"rdf:about": thesaurusUri+key}
            , children: [
                {
                    name: "skos:prefLabel",
                    text: parent.nom
                },


            ]
        }
        parent.children.forEach(function(child){
            child=checkUniques(child);
            var  childConcept = {
                name: "skos:Concept",
                attrs: {"rdf:about": thesaurusUri+child.iD}
                , children: [
                    {
                        name: "skos:prefLabel",
                        text: child.nom
                    },
                    {name: "skos:broader", attrs: {"rdf:resource": thesaurusUri+key}},
                ]
            }
            skosJsonNodes.push(childConcept)
            concept.children.push( {name: "skos:narrower", attrs: {"rdf:resource": thesaurusUri+child.iD}})
        })
        skosJsonNodes.push(concept)



    }



    var thesaurus = {};

    thesaurus["rdf:RDF"] = skosJsonNodes;

    var xml = jsonxml(thesaurus, {indent: " ", prettyPrint: 1, xmlHeader: 1});
    var header =
        '<rdf:RDF' +
        ' xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
        ' xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"' +
        '  xmlns:skos="http://www.w3.org/2004/02/skos/core#"' +
        '>'

    xml = xml.replace('<rdf:RDF>', header);
    xml=xml.replace(/&/g,"and")
    var file = path.resolve(__dirname , "../../config/thesaurii/"+filePrams[currentFileParamIndex].rdfName+".rdf");
    fs.writeFile(file, xml, {}, function (err, xml) {
        if (err)
            return console.log(err);
        return (null, "thesaurus keosphereTags saved")

    });



})