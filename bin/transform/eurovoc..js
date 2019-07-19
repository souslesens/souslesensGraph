/**
 * https://publications.europa.eu/en/web/eu-vocabularies/th-dataset/-/resource/dataset/eurovoc/version-20181220-0
 */

var fs = require('fs');
var xml2js = require('xml2js');
var jsonxml = require('jsontoxml');
var path = require('path');
var util = require('../util');
var async = require('async');
var dom = require('xmldom').DOMParser
var parser = new xml2js.Parser();

var eurovoc = {
    loadSkosToTree: function (thesaurus, langs, callback) {
        var rdfTag = "rdf:RDF";
        var file = path.resolve(__dirname, "../../config/thesaurii/" + thesaurus + ".rdf");
        fs.readFile(file, function (err, data) {
            if (err) {
                if (callback)
                    return callback(err);
            }
            var parser = new xml2js.Parser();
            parser.parseString("" + data, function (err, result) {
                    if (err) {
                        console.log(err)
                        if (callback)
                            return callback(err);

                    }

                    var rdf = "rdf:RDF";
                    if (!result[rdf])
                        rdf = "rdf:Rdf"
                    if (!result[rdf])
                        return callback("no RDF tag")


                    var conceptsMap = {}

                    function registerConcept(concepts) {
                        if (!concepts)
                            return;
                        concepts.forEach(function (concept) {
                            var about = concept["$"]["rdf:about"];
                            var id = about.substring(about.lastIndexOf("/") + 1)


                            var node = {}
                            node.synonyms = []
                            var prefLabels = concept["skos:prefLabel"];
                            if (prefLabels) {
                                prefLabels.forEach(function (prefLabel, index) {
                                    var lang = prefLabel["$"]["xml:lang"]
                                    if (langs.indexOf(lang) > -1) {
                                        if (!node.prefLabel)
                                            node.prefLabel = prefLabel._
                                        else {
                                            node.synonyms.push(prefLabel._)

                                        }


                                    }

                                })
                            } else {
                                var x = 1
                            }


                            if (concept["skos:narrower"])
                                node.narrower = concept["skos:narrower"]
                            if (concept["skos:NT"])
                                node.narrower = concept["skos:NT"]
                            if (concept["iso-thes:subGroup"])
                                node.narrower = concept["iso-thes:subGroup"]
                            if (concept["uneskos:hasMicroThesaurus"])
                                node.narrower = concept["uneskos:hasMicroThesaurus"]


                            if (concept["skos:broader"])
                                node.broader = concept["skos:broader"]
                            if (concept["skos:BT"])
                                node.broader = concept["skos:BT"]
                            if (concept["iso-thes:microThesaurusOf"])
                                node.broader = concept["iso-thes:microThesaurusOf"]
                            if (concept["iso-thes:superGroup"])
                                node.broader = concept["iso-thes:superGroup"]
                            if (concept["uneskos:memberOf"])
                                node.broader = concept["uneskos:memberOf"]


                            /*   if (concept["skos:topConceptOf"])
                                   node.broader = concept["skos:topConceptOf"]*/


                            var altLabels = concept["skos:altLabel"];
                            if (altLabels) {
                                for (var j = 0; j < altLabels.length; j++) {
                                    node.synonyms.push(altLabels[j]._)
                                }

                            }


                            conceptsMap[id] = node;
                        })
                    }


                    registerConcept(result[rdfTag]["rdf:Description"]);
                    //  registerConcept( result[rdf]["skos:ConceptScheme"]);
                    registerConcept(result[rdfTag]["iso-thes:ConceptGroup"]);
                    registerConcept(result[rdfTag]["iso-thes:microThesaurusOf"]);
                    registerConcept(result[rdfTag]["iso-thes:subGroup"]);


                    var treeData = []

                    for (var key in conceptsMap) {
                        var concept = conceptsMap[key];
                        var node = {
                            text: concept.prefLabel,
                            id: key,
                            data: {about: concept.about, synonyms: concept.synonyms}
                        };

                        var parents = concept.broader;

                        if (key == "COL007")
                            var xx = "aa";
                        if (parents && parents.length > 0) {
                            var parent = parents[0]["$"]["rdf:resource"]
                            var parent = parent.substring(parent.lastIndexOf("/") + 1)


                            //    var parent = conceptsMap[parent];
                            if (conceptsMap[parent]) {

                                // console.log(JSON.stringify(conceptsMap[parent], null,2))
                                if (!conceptsMap[parent])
                                    node.parent = "#";

                                else if (conceptsMap[parent].id == "#")
                                    node.parent = "#";


                                node.data.parentText = conceptsMap[parent].prefLabel;
                            }

                            if (typeof   node.data.parentText === "object")
                                node.data.parentText = node.data.parentText._
                            node.parent = parent;

                            if (parent == "CS000")
                                node.parent = "#";


                        }
                        else {

                            node.parent = "#";// "_" + thesaurus;

                        }

                        treeData.push(node);

                    }
                    // treeData.push({text: thesaurus, id: "_" + thesaurus, parent: "#"});//root
                    if (callback)
                        callback(null, treeData);


                }
            );
        });
    },
    parseRefFile: function (path, lang, length, callback) {

        var map = {
            concept: {regex: /<rdf:Description rdf:about="(.*)">/g, data: []},
            conceptEnd: {regex: /<\/rdf:Description(.*)>/g, data: []},
            prefLabel: {
                regex: new RegExp('<skos:prefLabel xml:lang="' + lang + '">(.*)<\/skos:prefLabel>', "g"),
                data: []
            },
            altLabel: {
                regex: new RegExp('<skos:altLabel xml:lang="' + lang + '">(.*)<\/skos:altLabel>', "g"),
                data: []
            },
            narrower: {
                regex: new RegExp('<skos:narrover rdf:resource="(.*)"\/>', "g"),
                data: []
            },
            broader: {
                regex: new RegExp('<skos:broader rdf:resource="(.*)"\/>', "g"),
                data: []
            },
            related: {
                regex: new RegExp('<skos:related rdf:resource="(.*)"\/>', "g"),
                data: []
            },
            scheme: {
                regex: new RegExp('<skos:inScheme rdf:resource="(.*)"/>', "g"),
                data: []
            },
        }


        var rest = "";
        var chunkOffset = 0
        const stream = fs.createReadStream(path, {encoding: 'utf8'});
        stream.on('data', data => {


            var index = data.lastIndexOf("</rdf:Description>")
            var str = rest + data.substring(0, index);
            rest = data.substring(index);


            for (var key in map) {

                var obj = map[key];
                var regex = obj.regex;
                var array;
                while ((array = regex.exec(str)) !== null) {
                    var value = array[(array.length - 1)];//cf 2 schemes on prend le dernier

                    map[key].data.push({offset: chunkOffset + array.index, value: value})
                }
            }
            chunkOffset += data.length;
        });
        stream.on('close', () => {

            callback(null, map)
        });
        stream.on('error', function (error) {
            console.log(error)
        });


    },
    buildConceptMap: function (map, callback) {
        var conceptsMap = {};
        if (map.concept.data.length != map.conceptEnd.data.length + 1)
            return console.log("error");

        var arrayConcepts = map.concept;
        map.concept.data.forEach(function (concept, indexConcept) {
            var startOffset = concept.offset;
            if (concept.value == "http://eurovoc.europa.eu/3640")
                var xx = 3;

            if (indexConcept >= (map.conceptEnd.data.length - 1))
                return;


//console.log(indexConcept)
            var endOffset = map.conceptEnd.data[indexConcept].offset;


            var obj = {id: concept.value, prefLabel: [], broader: [], narrower: [], related: [], altLabel: []};

            map.prefLabel.data.forEach(function (prefLabel) {
                if (prefLabel.offset > startOffset && prefLabel.offset < endOffset) {
                    obj.prefLabel.push(prefLabel.value);

                }
            })


            map.broader.data.forEach(function (broader) {
                if (broader.offset > startOffset && broader.offset < endOffset) {
                    obj.broader.push({id: broader.value});

                }
            })
            map.scheme.data.forEach(function (scheme) {
                if (scheme.offset > startOffset && scheme.offset < endOffset) {
                    obj.broader.push({id: scheme.value});

                }
            })


            map.related.data.forEach(function (related) {
                if (related.offset > startOffset && related.offset < endOffset) {
                    obj.related.push({id: related.value});

                }
            })

            map.altLabel.data.forEach(function (altLabel) {
                if (altLabel.offset > startOffset && altLabel.offset < endOffset) {
                    obj.altLabel.push(altLabel.value);

                }
            })


            conceptsMap[obj.id] = obj;

        })


        for (var key in conceptsMap) {
            conceptsMap[key].broader.forEach(function (broader, index) {
                if (!conceptsMap[broader.id])
                    return console.log(broader.id)
                conceptsMap[key].broader[index].value = conceptsMap[broader.id].prefLabel[0]
            })

            conceptsMap[key].related.forEach(function (related, index) {
                if (!conceptsMap[related.id])
                    return console.log(related.id)
                conceptsMap[key].related[index].value = conceptsMap[related.id].prefLabel[0]
            })

        }

        callback(null, conceptsMap);

    }
    ,
    conceptMapToJstree: function (map) {
        var jstree = [];
        for (var key in map) {
            var obj = map[key];
            var jstreeObj = {
                id: key,
                text: obj.prefLabel[0],
                data: {related: obj.related, altlabel: obj.altLabel, broader: obj.broader}
            }

            var broaders = obj.broader;
            if (broaders.length == 0)
                jstreeObj.parent = "#"
            else
                jstreeObj.parent = broaders[0].id;

            jstree.push(jstreeObj);

        }

        fs.writeFileSync("../../public/semanticWeb/eurovoc.json", JSON.stringify(jstree, null, 2));


    }


}


if (false) {
    //eurovoc.readBigBfile("C:\\Users\\claud\\Downloads\\eurovoc_skos.rdf", 100000);
    eurovoc.parseRefFile("C:\\Users\\claud\\Downloads\\eurovoc_in_skos_core_concepts.rdf", "fr", 100000, function (err, result) {

        eurovoc.buildConceptMap(result, function (err, result) {
            // return;
            eurovoc.conceptMapToJstree(result)

        });


    })


}
if (false) {
    eurovoc.loadSkosToTree("eurovoc_in_skos_core_concepts", "en", function (err, result) {
        if (err)
            return console.log(err);
        eurovoc.processMap(map)

    })
}


if (true) {

    function processMap(conceptsMap) {

        var treeMap = {};
        var schemesMap = {};
        var ancestorsMap = {};
        for (var key in conceptsMap) {

            var concept = conceptsMap[key];

            var obj = {
                text: concept.prefLabels["fr"],
                id: concept.id,
                data: {synonyms: ""},
                parent: "#"

            }


            for (var key2 in concept.prefLabels) {
                if (Array.isArray(concept.prefLabels[key2])) {
                    concept.prefLabels[key2].forEach(function (str) {
                        obj.data.synonyms += str + ";"
                    })
                }
                else {
                    obj.data.synonyms += concept.prefLabels[key2] + ";"
                }

            }

            for (var key2 in concept.altLabels) {
                if (Array.isArray(concept.altLabels[key2])) {
                    concept.altLabels[key2].forEach(function (str) {
                        obj.data.synonyms += str + ";"
                    })
                }
                else {
                    obj.data.synonyms += concept.altLabels[key2] + ";"
                }

            }


            /*  if(concept.broaders.length>0){
                  obj.parent=concept.broaders[0];


              }*/
            obj.ancestors=[];

            if (concept.topConcepts.length > 0) {
               obj.parent = concept.topConcepts[concept.topConcepts.length-1];
                obj.ancestors=concept.topConcepts;
            }

            else if (concept.schemes.length > 0) {
           obj.parent = concept.schemes[concept.schemes.length-1];
                obj.ancestors=concept.schemes;
            }
            else {
                if (concept.broaders.length > 0) {
                  obj.parent = concept.broaders[concept.broaders.length-1];
                    obj.ancestors=concept.broaders;
                }
            }

            // console.log(concept.id)
            treeMap[concept.id]=obj



        }



        for(var key in treeMap){
            concept=treeMap[key];
            if( concept.ancestors) {
                concept.ancestors.forEach(function (ancestor, index) {
                    if (index < concept.ancestors.length && treeMap[ancestor].parent=="#")
                        treeMap[ancestor].parent = concept.ancestors[index + 1]
                })
            }else{
                var xx=3
            }



        }
        var conceptsArray=[]
        for(var key in treeMap) {

            if(!treeMap[key].parent)
               treeMap[key].parent="#"
            conceptsArray.push(treeMap[key])
        }






        var str = JSON.stringify(conceptsArray, null, 2);
        fs.writeFileSync("./eurovocFr.json", str)
        fs.writeFileSync("D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\semanticWeb\\eurovocFr.json", str)


//console.log(JSON.stringify(schemesMap,null,2));


    }


    var conceptsMap = {}
    var currentConcept = null;
    var currentTagName = null;
    var strict = true; // set to false for html-mode
    var saxStream = require("sax").createStream(strict)
    saxStream.on("error", function (e) {
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e)
        // clear the error
        this._parser.error = null
        this._parser.resume()
    })

    saxStream.on("opentag", function (node) {
        var x = node;

        if (node.name == "rdf:Description") {
            currentConcept = {}
            var id = node.attributes["rdf:about"];
            currentConcept.id = id;
            currentConcept.prefLabels = {};
            currentConcept.altLabels = {};

            currentConcept.schemes = [];
            currentConcept.relateds = [];
            currentConcept.narrowers = [];
            currentConcept.broaders = [];
            currentConcept.topConcepts = [];

        }
        if (node.name == "skos:prefLabel") {

            var lang = node.attributes["xml:lang"];
            if (lang == "fr")
                currentTagName = "prefLabelFr";
            if (lang == "en")
                currentTagName = "prefLabelEn";
            if (lang == "es")
                currentTagName = "prefLabelEs";

        }
        if (node.name == "skos:altLabel") {

            var lang = node.attributes["xml:lang"];
            if (lang == "fr")
                currentTagName = "altLabelFr";
            if (lang == "en")
                currentTagName = "altLabelEn";
            if (lang == "es")
                currentTagName = "altLabelEs";

        }


        if (node.name == "skos:topConceptOf") {
            var type = node.attributes["rdf:resource"]
            currentConcept.topConcepts.push(type);
        }

        if (node.name == "rdf:type") {
            var type = node.attributes["rdf:resource"]
            if (type.indexOf("ConceptScheme") > -1) {
                currentConcept.isConceptScheme = true;
            }
        }

        if (node.name == "skos:inScheme") {

            currentConcept.schemes.push(node.attributes["rdf:resource"]);

        }
        if (node.name == "skos:broader") {

            currentConcept.broaders.push(node.attributes["rdf:resource"]);

        }
        if (node.name == "skos:narrower") {

            currentConcept.narrowers.push(node.attributes["rdf:resource"]);

        }
        if (node.name == "skos:related") {

            currentConcept.relateds.push(node.attributes["rdf:resource"]);

        }
    })

    saxStream.on("text", function (text) {
        if (currentTagName == "prefLabelFr")
            currentConcept.prefLabels.fr = text;
        if (currentTagName == "prefLabelEn")
            currentConcept.prefLabels.en = text;
        if (currentTagName == "prefLabelEs")
            currentConcept.prefLabels.es = text;

        if (currentTagName == "altLabelFr")
            currentConcept.altLabels.fr = text;
        if (currentTagName == "altLabelEn")
            currentConcept.altLabels.en = text;
        if (currentTagName == "altLabelEs")
            currentConcept.altLabels.es = text;

        currentTagName = null;
    })


    saxStream.on("closetag", function (node) {
        if (node == "rdf:Description") {

            conceptsMap[currentConcept.id] = currentConcept;
        }
    })
    saxStream.on("end", function (node) {
        var x = conceptsMap;

        processMap(conceptsMap)


    })


// pipe is supported, and it's readable/writable
// same chunks coming in also go out.
    fs.createReadStream("C:\\Users\\claud\\Downloads\\eurovoc_in_skos_core_concepts.rdf")
        .pipe(saxStream)
    //   .pipe(fs.createWriteStream("file-copy.xml"))


}

module.exports = eurovoc;