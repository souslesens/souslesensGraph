/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/
var mongoProxy = require("./mongoProxy.js");
var ObjectID = require('mongodb').ObjectID;
var httpProxy = require("./httpProxy.js");
var neoProxy = require("./neoProxy.js");
var socket = require('../routes/socket.js');
var async = require('async');
var fs = require("fs");
var serverParams = require("./serverParams.js");
var util = require("./util");
var totalLines = 0;
var neoMappings = [];
var distinctNames = [];
var countNodes = 0;
var lastImports = [];
var neoCopyMappings = neoMappings;

var importDataIntoNeo4j = {

    clearVars: function () {
        distinctNames = [];
        totalLines = 0;
        neoMappings = [];
        countNodes = 0;
    },
    /**
     *
     *  import nodes using all params array each element contains one import directive
     *  params.type can be csv or json (parsed)
     *
     *
     *
     *
     */

    importNodes: function (allParams, callback) {
        var journal = "";
        if (!Array.isArray(allParams)) {
            allParams = [allParams];
        }
        async.eachSeries(allParams, function (params, callbackEachRequest) {
                var totalImported = 0;
                var dbName = params.sourceDB;
                var source = params.source;
                var nameSourceField = params.sourceField;
                var sourceKey = params.sourceKey;
                var subGraph = params.subGraph;
                var label = params.label;
                var isDistinct = params.distinctValues ? true : false;


                params.fields = importDataIntoNeo4j.setNodeSourceFieldsToExport(params);
                var params = importDataIntoNeo4j.setLoadParams(params);

                if (label == null)
                    label = source;

                // to avoid to import twice if browser timeout
                // see https://groups.google.com/a/chromium.org/forum/#!topic/chromium-dev/urswDsm6Pe0
                // timeout 2 min et retry delay <5sec
                if (lastImports.length > 0 && lastImports[lastImports.length - 1].label == label) {
                    var now = new Date();
                    if ((now - lastImports[lastImports.length - 1].startTime > (2 * 1000 * 60)) && (now - lastImports[lastImports.length - 1].endTime < (1000 * 5))) {
                        return callback(null, "Abort Retry on browser timeout");
                    }

                }

                lastImports.push({label: label, startTime: new Date()});
                console.log("------------Importing" + label)


                var dataSubsetsToImport = [];
                async.series([

                    //load data
                    function (callbackSeries) {
                        if (params.type == "csv") {
                            importDataIntoNeo4j.loadCsvData(params, function (err, result) {
                                if (err)
                                    return callbackSeries(err);
                                dataSubsetsToImport = result
                                callbackSeries(null, dataSubsetsToImport);
                            });
                        }
                        else if (params.type == "json") {
                            var data = [];

                            if (params.fields) {
                                params.data.data.forEach(function (line) {
                                    var obj={}
                                    for (var key in params.fields) {
                                        if (line[key])
                                            obj[key] = line[key];

                                    }
                                    data.push(obj);
                                })
                            } else {
                                data = params.data.data;
                            }



                            dataSubsetsToImport = [data];
                            callbackSeries(null, dataSubsetsToImport);
                        }


                        else if (params.type == "sourceDB") {
                            callbackSeries(null, dataSubsetsToImport);
                        }

                    },


                    //importToNeo each subset
                    function (callbackSeries) {

                        async.eachSeries(dataSubsetsToImport, function (subset, callbackEach) {
                            if (subset.length == 0)
                                callbackEach(null);
                            importDataIntoNeo4j.writeNodesToNeo(params, subset, function (err, result) {
                                    if (err) {
                                        return callbackSeries(err);
                                    }
                                    totalImported += result.results.length;
                                    var message = "Imported " + totalImported + " lines with label " + params.label;
                                    socket.message(message);
                                    callbackEach(null);

                                }
                            )

                        }, function (err, result) {// after all subset import in Neo
                            if (err)
                                return callbackSeries(err);
                            var message = "label :" + label + "import done : " + totalImported + "lines ";
                            journal += message + "<br>";
                            socket.message(message);
                            //  console.log(message);
                            callbackSeries(null, message);

                        })
                    }], function (err, result) {// at the end of series

                    callbackEachRequest(err, result[result.length - 1]);
                })
            },
            function (err) {
                callback(err, journal)
            })

    }
    ,
    /**
     *
     *  import relations using all params array each element contains one import directive
     *  params.type can be csv or json (parsed
     *
     *
     *
     *
     */
    importRelations: function (allParams, callback) {
        var journal = "";
        if (!Array.isArray(allParams)) {
            allParams = [allParams];
        }
        async.eachSeries(allParams, function (params, callbackEachRequest) {
                var totalImported = 0;
                var dbName = params.sourceDB;
                var source = params.source;
                var sourceSourceField = params.sourceSourceField;
                var neoSourceKey = params.neoSourceKey;
                var neoTargetKey = params.neoTargetKey;
                var sourceSourceField = params.sourceSourceField;
                var neoSourceLabel = params.neoSourceLabel;
                var sourceTargetField = params.sourceTargetField;
                var neoTargetLabel = params.neoTargetLabel;
                var relationType = params.relationType;
                var sourceQuery = params.sourceQueryR;
                var subGraph = params.subGraph;
                params.fields = importDataIntoNeo4j.setRelationsSourceFieldsToExport(params);
                params = importDataIntoNeo4j.setLoadParams(params);

                // to avoid to import twice if browser timeout
                // see https://groups.google.com/a/chromium.org/forum/#!topic/chromium-dev/urswDsm6Pe0
                // timeout 2 min et retry delay <5sec

                if (lastImports.length > 0 && lastImports[lastImports.length - 1].relationType == relationType) {
                    var now = new Date();
                    if ((now - lastImports[lastImports.length - 1].startTime > (2 * 1000 * 60)) && (now - lastImports[lastImports.length - 1].endTime < (1000 * 5))) {
                        return callback(null, "Abort Retry on browser timeout");
                    }

                }
                lastImports.push({relationType: relationType, startTime: new Date()});

                if (!neoSourceKey) {
                    neoSourceKey = sourceSourceField;
                }
                if (!neoTargetKey) {
                    neoTargetKey = sourceTargetField;
                }


                var sourceNeoSourceIdsMap = {};
                var sourceNeoTargetIdsMap = {};


                var dataSubsetsToImport = [];
                async.series([


                    //get neomappings in sourceNeoTargetIdsMap
                    function (callbackSeries) {
                        //retrieve in Neo4j mappings between neoIds and name field
                        var sourceNodeMappingsStatement = "match (n:" + neoSourceLabel + ") where n.subGraph=\"" + subGraph + "\"  return n." + params.neoSourceKey + " as sourceId, id(n) as neoId, labels(n)[0] as label; "
                        neoProxy.match(sourceNodeMappingsStatement, function (err, resultSource) {
                            if (err)
                                return callback(err);

                            var targetNodeMappingsStatement = "match (n:" + neoTargetLabel + ") where n.subGraph=\"" + subGraph + "\"  return n." + params.neoTargetKey + " as sourceId, id(n) as neoId, labels(n)[0] as label; "
                            neoProxy.match(targetNodeMappingsStatement, function (err, resultTarget) {

                                if (resultSource.length == 0 || resultTarget.length == 0) {
                                    return callback("ERROR : missing Neo4j nodes mapping: import nodes before relations");

                                }


                                for (var i = 0; i < resultSource.length; i++) {
                                    sourceNeoTargetIdsMap[neoSourceLabel + "_" + resultSource[i].sourceId] = resultSource[i].neoId;
                                }
                                for (var i = 0; i < resultTarget.length; i++) {
                                    sourceNeoTargetIdsMap[neoTargetLabel + "_" + resultTarget[i].sourceId] = resultTarget[i].neoId;
                                }
                                params.nodeMappings = {source: sourceNeoTargetIdsMap, target: sourceNeoTargetIdsMap};
                                params.missingMappings = [];
                                params.uniqueRelations = [];
                                callbackSeries(null, params)

                            })
                        })

                    },


                    //load data
                    function (callbackSeries) {
                        if (params.type == "csv") {
                            importDataIntoNeo4j.loadCsvData(params, function (err, result) {
                                if (err)
                                    return callbackSeries(err);
                                dataSubsetsToImport = result
                                callbackSeries(null, dataSubsetsToImport);
                            });
                        }
                        else if (params.type == "json") {
                            var data = params.data;
                            if (data.data)
                                data = [data.data];
                            dataSubsetsToImport = data;
                            callbackSeries(null, dataSubsetsToImport);
                        }
                        else if (params.type == "sourceDB") {
                            // to finish   callbackSeries(null, dataSubsetsToImport);
                        }

                    },


                    //importToNeo each subset
                    function (callbackSeries) {

                        async.eachSeries(dataSubsetsToImport, function (subset, callbackEach) {
                            if (subset.length == 0)
                                callbackEach(null);
                            importDataIntoNeo4j.writeRelationsToNeo(params, subset, function (err, result) {
                                    if (err)
                                        return callbackSeries(err);
                                    totalImported += result.length;
                                    var message = "Imported " + totalImported + " lines with type " + params.relationType;
                                    socket.message(message);
                                    callbackEach(null);
                                }
                            )


                        }, function (err, result) {// after all subset import in Neo
                            if (err)
                                return callbackSeries(err);
                            var message = "relation " + relationType + " import done : " + totalImported + "lines ";
                            journal += message + "<br>"

                            socket.message(message);
                            if (params.missingMappings.length > 0) {
                                var str = JSON.stringify(params.missingMappings, null, 2)
                                message += "<br> relation missingMappings " + str;
                                //   console.log(str);
                            }
                            //  console.log(message);

                            callbackSeries(null, message);

                        })
                    }
                ], function (err, result) {// at the end of series

                    callbackEachRequest(err, result[result.length - 1]);


                })
            },
            function (err) {

                callback(err, journal)
            })
    },


    writeNodesToNeo: function (params, data, callback) {

        var objs = [];
        for (var i = 0; i < data.length; i++) {
            var obj = data[i];
            if (obj._id)
                obj.sourceId = "" + obj._id;
            //    delete obj._id;
            var nameSourceFieldValue = obj[params.sourceField];
            //   console.log(nameSourceFieldValue+"   "+(countNodes++));
            if (!nameSourceFieldValue) {
                continue;
            }

            if (params.isDistinct & distinctNames.indexOf(nameSourceFieldValue) > -1) {
                //  console.log( "---!!!!!!!!!!!!   B   ");
                continue;
            }
            if (obj[params.sourceKey]) {
                obj.id = obj[params.sourceKey];
            } else {
                continue;
            }

            distinctNames.push(nameSourceFieldValue);

            if (!params.defaultNodeNameProperty)
                params.defaultNodeNameProperty = "name";
            obj[params.defaultNodeNameProperty] = nameSourceFieldValue;

            obj.subGraph = params.subGraph;
            if (params.label.indexOf("#") == 0) {
                var labelField = params.label.substring(1);
                var labelValue = obj[labelField];
                labelValue = ("" + labelValue).replace(/ /g, "_");
                if (labelValue)
                    obj._labelField = "" + labelValue;
                else
                    obj._labelField = labelField;

            }
            var keysToSolve = {};
            for (var key in obj) {// les champs neo ne doivent pas commencer par un chiffre (norme json) , on met un _devant
                if (/[0-9]+.*/.test(key)) {
                    keysToSolve[key] = obj[key];

                }
            }
            for (key in  keysToSolve) {
                obj["_" + key] = obj[key];
                delete obj.key;
            }
            objs.push(obj);
        }


        if (objs.length == 0) {
            return callback(null, {results: []})
        }
        var neo4jUrl = serverParams.neo4jUrl;

        // list Neo objects  whith same label and subgraph to check if they allready exist (not to import twice the same object)
        var existingNodesStatement = "match (n) where n.subGraph=\"" + objs[0].subGraph + "\" and labels(n) in [\"" + params.label + "\"] return n.name as name"
        neoProxy.match(existingNodesStatement, function (err, result) {
            if (err) {
                return callback(err);
            }
            var existingNodesWithSameLabelAndSubGraph = [];
            for (var i = 0; i < result.length; i++) {
                existingNodesWithSameLabelAndSubGraph.push(result[i].name)
            }
            var path = "/db/data/transaction/commit";


            var statements = [];
            for (var i = 0; i < objs.length; i++) {

                var obj = objs[i];
                if (existingNodesWithSameLabelAndSubGraph.indexOf(obj.name) > -1)
                    continue;

                obj = util.cleanFieldsForNeo(obj);
                var label = params.label;
                var labelFieldValue = obj._labelField;
                if (labelFieldValue != null) {
                    label = labelFieldValue;
                    delete  obj._labelField;
                }

                var attrs = JSON.stringify(obj).replace(/"(\w+)"\s*:/g, '$1:');// quote the keys in json
                var statement = {statement: "CREATE (n:" + label + attrs + ")  RETURN n.id,ID(n), labels(n)"};
                statements.push(statement);
            }

            var payload = {statements: statements};
            neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {
                if (err) {
                    callback(err);
                    return;

                }
                callback(null, result);

            });


        })


    }


    ,


    writeRelationsToNeo: function (params, dataRaw, callback) {
        var relations = [];
        var data = [];
//split multiple values properties
        dataRaw.forEach(function (obj) {
            var sourceSourceField = obj[params.sourceSourceField]
            var sourceTargetField = obj[params.sourceTargetField]


            if (Array.isArray(sourceSourceField)) {
                sourceSourceField.forEach(function (value) {
                    var obj2 = JSON.parse(JSON.stringify(obj));
                    obj2[params.sourceSourceField] = value;
                    data.push(obj2);
                })

            }
            else if (Array.isArray(sourceTargetField)) {
                sourceTargetField.forEach(function (value) {
                    var obj2 = JSON.parse(JSON.stringify(obj));
                    obj2[params.sourceTargetField] = value;
                    data.push(obj2);
                })

            }
            else {
                data.push(obj);
            }

        })

        for (var i = 0; i < data.length; i++) {

            var obj = data[i];
            obj.neoId = obj._id;
            // delete obj._id;


            var neoIdStart = params.nodeMappings.source[params.neoSourceLabel + "_" + obj[params.sourceSourceField]];
            var neoIdEnd = params.nodeMappings.target[params.neoTargetLabel + "_" + obj[params.sourceTargetField]];

            if (neoIdStart == null | neoIdEnd == null) {
                params.missingMappings.push(obj)
                continue;

            } else {


                var hashCode = "" + neoIdStart + neoIdEnd;

                if (params.uniqueRelations.indexOf(hashCode) < 0) {
                    params.uniqueRelations.push(hashCode);
                } else {
                    continue;
                }

                var properties = {};
                if (params.subGraph != null)
                    properties.subGraph = params.subGraph;
                if (params.neoRelAttributeField != null && params.neoRelAttributeField.length > 0) {
                    var relProps = params.neoRelAttributeField.split(";");
                    for (var j = 0; j < relProps.length; j++) {
                        var prop = relProps[j].trim();
                        if (obj[prop])
                            properties[prop] = obj[prop];
                    }
                }


                var relation = {
                    sourceId: neoIdStart,
                    targetId: neoIdEnd,
                    type: params.relationType,
                    data: properties
                }
                relations.push(relation);

            }
        }

        var path = "/db/data/batch";
        var payload = [];
        for (var i = 0; i < relations.length; i++) {
            // totalImported += 1;


            var neoObj = {
                method: "POST",
                to: "/node/" + relations[i].sourceId + "/relationships",
                id: 3,
                body: {
                    to: "" + relations[i].targetId,
                    data: relations[i].data,
                    type: relations[i].type
                }
            }
            payload.push(neoObj);

        }

        var neo4jUrl = serverParams.neo4jUrl;
        neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {

            if (err) {

                callback(err);
                return;
            }
            if (result.errors && result.errors.length > 0) {
                callback(JSON.stringify(result));
                return;

            }

            callback(null, result)

        })

    },
    copyNodes: function (data, callback) {
        var path = "/db/data/transaction/commit";
        var neoMappings = {}
        var mappingLabel = "";

        var statements = [];
        var oldIds = [];
        for (var i = 0; i < data.length; i++) {
            var obj = data[i];
            var label = obj.n.labels[0];
            var properties = obj.n.properties;
            oldIds.push(obj.n._id);


            var properties = JSON.stringify(properties).replace(/"(\w+)"\s*:/g, '$1:');// quote the keys in json
            var statement = {statement: "CREATE (n:" + label + properties + ")  RETURN ID(n) as newId, labels(n) as label"};
            statements.push(statement);
        }


        payload = {statements: statements};


        var subsets = [payload];
        var totalImported = 0;
        async.eachSeries(subsets, function (aSubset, callback) {
                var length = aSubset.length;
                var neo4jUrl = serverParams.neo4jUrl;
                neoProxy.cypher(neo4jUrl, path, aSubset, function (err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {

                        for (var i = 0; i < result.results.length; i++) {

                            var obj = result.results[i]
                            if (i == 0)
                                mappingLabel = obj.data[0].row[1][0];
                            var nodeMapping = {};
                            nodeMapping.newId = obj.data[0].row[0];
                            nodeMapping.oldId = oldIds[i];
                            nodeMapping.label = label;
                            neoMappings[nodeMapping.oldId] = nodeMapping
                        }


                        totalImported = totalImported + result.results.length;
                        var message = "Imported :" + (result.results.length);
                        console.log(message);
                        if (socket)
                            socket.message(message);
                        callback(null);
                    }
                });
            },
            function (err, done) {
                neoCopyMappings = neoMappings;
                totalImported = totalImported;
                var message = "total nodes imported total :" + (totalImported);

                if (err)
                    callback(err)
                else {
                    socket.message(message);
                    callback(null, message);
                }
            })


    },

    copyRelations: function (data, callback) {
        /*   try {
               var neoMappings = fs.readFileSync("./uploads/neoNodesMapping_cypher_copy.js");
           }
           catch (e) {
               callback(e)
           }
           neoMappings = JSON.parse("" + neoMappings);*/
        var neoMappings = neoCopyMappings;
        if (!neoMappings)
            return callback("Nodes have to be imported first in the same server session")

        var path = "/db/data/batch";
        var payload = [];
        var subsets = [];
        var aSubset = [];
        for (var i = 0; i < data.length; i++) {
            if (i % 200 == 0) {
                subsets.push(aSubset);
                aSubset = [];
            }
            if (!neoMappings[data[i].r._fromId]) {
                console.log("non existing source  node :" + data[i]);
                continue;
            }
            if (!neoMappings[data[i].r._toId]) {
                console.log("non existing target  node :" + data[i]);
                continue;
            }
            var neoObj = {
                method: "POST",
                to: "/node/" + neoMappings[data[i].r._fromId].newId + "/relationships",
                id: 3,
                body: {
                    to: "" + neoMappings[data[i].r._toId].newId,
                    data: data[i].r.properties,
                    type: data[i].r.type
                }
            }


            aSubset.push(neoObj);

        }
        subsets.push(aSubset);
        var totalImported = 0;
        async.eachSeries(subsets, function (aSubset, callback) {
                if (aSubset.length == 0)
                    return callback(null);
                var neo4jUrl = serverParams.neo4jUrl;
                neoProxy.cypher(neo4jUrl, path, aSubset, function (err, result) {

                    if (err) {
                        callback(err);
                    }
                    else {
                        totalImported = totalImported + result.length;
                        var message = " relations Imported :" + (result.length);
                        console.log(message);
                        if (socket)
                            socket.message(message);
                        callback(null, message);
                    }
                })
            }
            , function (err, done) {

                if (err)
                    callback(err)
                else {
                    var message = " relations Imported :" + totalImported;
                    socket.message(message);
                    callback(null, message);

                }


            })

    },


    setLoadParams: function (params) {

        var loadParams = params;
        if (params.type == "json") {
            loadParams.fetchSize = 10000000;
        }

        else if (params.source.toLowerCase().indexOf(".csv") > -1 || params.source.toLowerCase().indexOf(".txt") > -1) {//|| params.sourceDB.toLowerCase().indexOf(".txt") > -1) {
            loadParams.type = "csv";
            loadParams.filePath = "./uploads/" + params.source + ".json";
            loadParams.fetchSize = 500;
        } else {
            loadParams = params;
            loadParams.type = "mongoDB";
        }
        return loadParams;

    },

    loadCsvData: function (params, callback) {

        totalLines = 0;


        nodeMappings = [];

        try {
            var str = fs.readFileSync(params.filePath);
        } catch (e) {
            return callback(e)
        }
        var query = params.sourceQuery;
        var filterObj = null;
        if (query && query != '{}' && query != '') {
            try {
                filterObj = JSON.parse(query);
            }
            catch (error) {
                callback(error);
                return;
            }
        }

        var allData = JSON.parse("" + str);
        //if(allData.data)// cas des  l'import csv local mais pas upload csv
        allData = allData.data
        var dataSubsets = [];
        var aSubset = [];

        for (var i = 0; i < allData.length; i++) {
            var rawLine = allData[i];
            var importLine = {};


            var ok = true;
            if (filterObj) {// filter with or
                ok = false;
                for (var key in filterObj) {
                    if (rawLine[key]) {
                        var val1 = rawLine[key]
                        var val2 = filterObj[key];
                        ok = (val1 == val2)
                    }

                }
            }

            if (!ok == true)
                continue;

            if (params.fields) {
                for (var key in params.fields) {
                    if (rawLine[key])
                        importLine[key] = rawLine[key];

                }
            }
            else
                importLine = rawLine;

            aSubset.push(importLine);
            if (aSubset.length >= params.fetchSize) {
                dataSubsets.push(aSubset);
                aSubset = [];
            }

        }
        dataSubsets.push(aSubset);

        callback(null, dataSubsets);

    },


    loadsourceData: function (params, callback) {


        var dbName = loadParams.sourceDB;
        var source = loadParams.source;
        var query = params.sourceQuery;
        if (!query)
            query = {}
        else {
            try {
                query = eval('(' + query + ')');
            }
            catch (error) {
                callback(error);
                return;
            }
        }
        var currentIndex = 0;
        var resultSize = 1;

        async.whilst(
            function () {//test
                return resultSize > 0;
            },
            function (_callback) {//iterate
                var callback = _callback;
                mongoProxy.pagedFind(currentIndex, serverParams.sourceFetchSize, dbName, source, query, params.fields, function (err, resultsource) {
                    if (err)
                        return rootCallBack(err);

                    for (var i = 0; i < resultsource.length; i++) {
                        util.cleanFieldsForNeo(resultsource[i])
                    }
                    importFn(params, resultsource, function (err, result) {
                        if (err) {
                            return callback(err);

                        }
                        //
                        if (params.label) {//nodes
                            if (result.length > 0) {
                                nodeMappings = nodeMappings.concat(result);
                            }
                            totalLines += result.length;
                            var message = "Imported " + nodeMappings.length + " lines with label " + params.label;
                            socket.message(message);
                        }
                        // }

                        currentIndex += serverParams.sourceFetchSize;
                        resultSize = resultsource.length;
                        totalLines += result.length;
                        if (callback)
                            callback(null, resultSize);

                    });


                })
            }
            ,
            function (err, result) {//end
                lastImports[lastImports.length - 1].endTime = new Date();
                var message = "";
                if (err) {
                    var message = "  sourceDB:" + dbName + "  , source:" + source + "  ; " + JSON.stringify(err[0].message).substring(0, Math.min(200, err[0].message.length)) + "...";
                    socket.message(message);
                    console.log(message);
                    rootCallBack(message);
                    return;

                }
                if (params.label) {//nodes
                    ;
                } else {// relations
                    var message = "import done : " + totalLines + "lines for relation " + params.neoSourceLabel + "->" + params.neoTargetLabel;
                    socket.message(message);
                    console.log(message);
                    rootCallBack(null, message);

                }
            }
        )
    },


    setNodeSourceFieldsToExport: function (params) {
        var exportedFields = params.exportedFields;
        var fields = [];
        if (!exportedFields || exportedFields == "all")
            return null;// on exporte tous les champs source

        fields = exportedFields.trim().split(";");
        fields.push(params.sourceField);
        fields.push(params.sourceKey);
        if (params.label.indexOf("#") == 0)
            fields.push(params.label.substring(1));

        var result = {}
        for (var i = 0; i < fields.length; i++) {
            result[fields[i]] = 1;
        }
        return result;
    },

    setRelationsSourceFieldsToExport: function (params) {
        var exportedFields = params.neoRelAttributeField;
        var fields = [];
        if (exportedFields) {
            fields = exportedFields.trim().split(";");
        }
        fields.push(params.sourceSourceField);
        fields.push(params.sourceTargetField);

        var result = {}
        for (var i = 0; i < fields.length; i++) {
            result[fields[i]] = 1;
        }
        return result;
    }
}


module.exports = importDataIntoNeo4j;







