/**
 * Created by claud on 10/01/2017.
 */
var mongoProxy = require("./mongoProxy.js");
var httpProxy = require("./httpProxy.js");
var neoProxy = require("./neoProxy.js");
var socket = require('../routes/socket.js');
var async = require('async');
var fs = require("fs");
var serverParams = require("./serverParams.js");
var totalLines = 0;
var neoMappings = [];
var distinctNames = [];
var countNodes=0;
var exportMongoToNeo = {


    exportNodes: function (params, callback) {
        var totalImported = 0;
        var dbName = params.mongoDB;
        var collection = params.mongoCollection;

        var nameMongoField = params.mongoField;
        var idMongoField = params.mongoIdField;
        var subGraph = params.subGraph;
        var label = params.label;
        var isDistinct = params.distinctValues ? true : false;


        params.fields = setNodeMongoFieldsToExport(params);

        if (label == null)
            label = collection;

        loadAndFetchDataToImport(params, importNodes, callback);

        function importNodes(params, data, callback) {

            var objs = [];
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                delete obj._id;
                var nameMongoFieldValue = obj[nameMongoField];
             //   console.log(nameMongoFieldValue+"   "+(countNodes++));
                if (isDistinct & distinctNames.indexOf(nameMongoFieldValue) > -1)
                    continue;
                if (obj[idMongoField]) {// on stocke dans neo et neoMappings dans id la valeur de mongoIdField
                    obj.id = obj[idMongoField];
                } else {
                    continue;
                }
                totalImported += 1;
                distinctNames.push(nameMongoFieldValue);

                if (!obj.nom)
                    obj.nom = nameMongoFieldValue;
                obj.subGraph = subGraph;
                if (label.indexOf("#") == 0) {
                    var labelField = label.substring(1);
                    var labelValue = obj[labelField];
                    labelValue = ("" + labelValue).replace(/ /g, "_");
                    if (labelValue)
                        obj._labelField = "" + labelValue;
                    else
                        obj._labelField = labelField;

                }
                var keysToSolve = {};
                for (var key in obj) {// le schamps neo ne doivent pascommencer par un chiffre (norme json) , on met un _devant
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

            writeNodesToNeoNodes(label, objs, function (_result) {
                var result = _result;

                callback(null, result);
            });


            function writeNodesToNeoNodes(label, _objs, callback) {
                var objs = _objs;
                var path = "/db/data/transaction/commit";


                var statements = [];
                for (var i = 0; i < objs.length; i++) {
                    var obj = objs[i];

                    obj = cleanFieldsForNeo(obj);

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
                var neo4jUrl = serverParams.neo4jUrl;
                neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {
                    if (err) {

                        callback(err);
                        return;

                    }

                    var nodeMappings = [];
                    for (var i = 0; i < result.results.length; i++) {
                        var obj = result.results[i]
                        var label = obj.data[0].row[2][0];
                        var id = obj.data[0].row[1];
                        var nodeMapping = {};
                        nodeMapping.neoId = id;
                        nodeMapping.mongoId = objs[i].id;
                        nodeMapping.label = label;
                        nodeMappings.push(nodeMapping);
                    }
                    callback(nodeMappings);

                });


            }

        }

    }


    ,


    exportRelations: function (params, callback) {
        var totalImported = 0;
        var dbName = params.mongoDB;
        var mongoCollection = params.mongoCollection;
        var mongoSourceField = params.mongoSourceField;
        var neoSourceLabel = params.neoSourceLabel;
        var mongoTargetField = params.mongoTargetField;
        var neoTargetLabel = params.neoTargetLabel;
        var relationType = params.relationType;
        params.fields = setRelationsMongoFieldsToExport(params);

        var mongoQuery = params.mongoQueryR;
        var subGraph = params.subGraph;

        var mongoNeoSourceIdsMap = {};
        var mongoNeoTargetIdsMap = {};
        try {
            var sourceNodeMappings = fs.readFileSync("./uploads/neoNodesMapping_" + dbName + "_" + neoSourceLabel + "_" + mongoSourceField+  ".js");
            var targetNodeMappings = fs.readFileSync("./uploads/neoNodesMapping_" + dbName + "_" + neoTargetLabel + "_" + mongoTargetField+  ".js");
        } catch (e) {
            callback(e)
        }

        sourceNodeMappings = JSON.parse("" + sourceNodeMappings);
        targetNodeMappings = JSON.parse("" + targetNodeMappings);
        //   nodeMappings.splice(0,0,nodeMappings2);

        if (sourceNodeMappings.length == 0 || targetNodeMappings.length == 0) {
            // callback("ERROR : missing Neo4j nodes mapping: import nodes before relations");
            //   return;
        }

        var missingMappings = [];
        var uniqueRelations = [];
        for (var i = 0; i < sourceNodeMappings.length; i++) {
            mongoNeoTargetIdsMap["_" + sourceNodeMappings[i].mongoId] = sourceNodeMappings[i].neoId;
        }
        for (var i = 0; i < targetNodeMappings.length; i++) {
            mongoNeoTargetIdsMap["_" + targetNodeMappings[i].mongoId] = targetNodeMappings[i].neoId;
        }

        params.nodeMappings = mongoNeoTargetIdsMap;
        loadAndFetchDataToImport(params, importRelations, callback);

        function importRelations(params, data, callback) {
            var relations = [];
            for (var i = 0; i < data.length; i++) {

                var obj = data[i];
                delete obj._id;


                var neoIdStart = params.nodeMappings["_" + obj[mongoSourceField]];
                var neoIdEnd = params.nodeMappings["_" + obj[mongoTargetField]];

                if (neoIdStart == null | neoIdEnd == null) {
                    missingMappings.push(obj)
                    continue;

                } else {

                    var hashCode = "" + neoIdStart + neoIdEnd;

                    if (uniqueRelations.indexOf(hashCode) < 0) {
                        uniqueRelations.push(hashCode);
                    } else {
                        continue;
                    }

                    var properties = {};
                    if (subGraph != null)
                        properties.subGraph = subGraph;
                    if (params.neoRelAttributeField != null && params.neoRelAttributeField.length > 0)
                        properties[params.neoRelAttributeField] = obj[params.neoRelAttributeField];

                    var relation = {
                        sourceId: neoIdStart,
                        targetId: neoIdEnd,
                        type: relationType,
                        data: properties
                    }
                    relations.push(relation);

                }
            }
            var path = "/db/data/batch";
            var payload = [];
            for (var i = 0; i < relations.length; i++) {
                totalImported += 1;


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

                var message = "Imported " + totalImported + "relations  with type " + relationType;
                socket.message(message);
                callback(null, result)

            })


        };


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
                try {
                    fs.writeFile("./uploads/neoNodesMapping_cypher_copy.js", JSON.stringify(neoMappings));
                }
                catch (e) {
                    callback(e)
                }
                totalImported = totalImported;
                var message = "total nodes importedtotal :" + (totalImported);

                if (err)
                    callback(err)
                else {
                    socket.message(message);
                    callback(null, message);
                }
            })


    },

    copyRelations: function (data, callback) {
        try {
            var neoMappings = fs.readFileSync("./uploads/neoNodesMapping_cypher_copy.js");
        }
        catch (e) {
            callback(e)
        }
        neoMappings = JSON.parse("" + neoMappings);
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

}
function cleanFieldsForNeo(obj) {
    for (var key in obj) {

        var key2 = key.replace(/-/g, "_");

        key2 = key2.replace(/ /g, "_");
        var valueObj = obj[key];

        var value = "" + valueObj;
        value = value.replace(/[\n|\r|\t]/g, " ");
        value = value.replace(/&/g, " and ");
        value = value.replace(/"/g, "'");
        value = value.replace(/,/g, "\\,");
        value = value.replace(/\//g, "%2F");
        obj[key] = value;
    }

    return obj;

}


function getLoadParams(params) {

    var loadParams = {};
    if (params.mongoDB.toLowerCase().indexOf(".csv") > -1) {
        loadParams.type = "csv";
        loadParams.filePath = "./uploads/" + params.mongoCollection + ".json";
        loadParams.fetchSize = 50;
    } else {
        loadParams = params;
        loadParams.type = "MongoDB";
    }
    return loadParams;

}
function loadAndFetchDataToImport(params, importFn, _rootCallBack) {
    var rootCallBack=_rootCallBack;
    var loadParams = getLoadParams(params);
    totalLines = 0;
    nodeMappings = [];
    if (loadParams.type == "csv") {
        try {
            var str = fs.readFileSync(loadParams.filePath);
        } catch (e) {
            callback(e)
        }

        var allData = JSON.parse("" + str);
        var dataSubsets = [];
        var aSubset = [];

        for (var i = 0; i < allData.length; i++) {
            var rawLine = allData[i];
            var importLine = {};
            if (params.fields) {
                for (var key in params.fields) {
                    if (rawLine[key])
                        importLine[key] = rawLine[key];
                }
            }
            else
                importLine = rawLine;

            aSubset.push(importLine);
            if (aSubset.length >= loadParams.fetchSize || i == allData.length - 1) {
                dataSubsets.push(aSubset);
                aSubset = [];
            }
        }

        async.eachSeries(dataSubsets, function (subset, _callback) {
                var callback = _callback;
                importFn(params, subset, function (err, result) {
                        if (err)
                            return callback(err);
                        if (params.label) {//nodes
                            nodeMappings = nodeMappings.concat(result);
                        }
                        ;
                        totalLines += result.length;
                        var message = "Imported " + nodeMappings.length + " lines with label " + params.label;
                        socket.message(message);
                        callback(null);
                    }
                )


            }, function (err, result) {// after all series
                if (err)
                    return rootCallBack(err);
                var message = "";
                if (params.label) {//nodes

                    //   fs.writeFile("./uploads/neoNodesMapping_" + params.mongoDB + "_" + params.label + ".js", JSON.stringify(nodeMappings));
                    mergeNodesMappingsAndSaveFile("./uploads/neoNodesMapping_" + params.mongoDB + "_" + params.label+ "_" + params.mongoField + ".js", nodeMappings, params.label, rootCallBack)


                } else {
                    message = "import done : " + totalLines + "lines ";
                    socket.message(message);
                    console.log(message);
                    rootCallBack(null, message);

                }




            }
        )
    } else if (loadParams.type == "MongoDB") {

        var dbName = loadParams.mongoDB;
        var collection = loadParams.mongoCollection;
        var query = params.mongoQuery;
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
                var callBack=_callback;
                mongoProxy.pagedFind(currentIndex, serverParams.mongoFetchSize, dbName, collection, query, params.fields, function (err, resultMongo) {
                    if (err)
                        return rootCallBack(err);

                    importFn(params, resultMongo, function (err, result) {
                        if (err)
                            return callback(err);

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

                        currentIndex += serverParams.mongoFetchSize;
                        resultSize = resultMongo.length;
                        totalLines += result.length;
                        if(callBack)
                            callBack(null, resultSize);

                    });


                })
            }
            ,
            function () {//end
                var message = "";

                if (params.label) {//nodes
                    mergeNodesMappingsAndSaveFile("./uploads/neoNodesMapping_" + params.mongoDB + "_" + params.label+ "_" + params.mongoField + ".js", nodeMappings, params.label, rootCallBack)


                } else {
                    var message = "import done : " + totalLines + "lines for relation " + params.neoSourceLabel + "->" + params.neoTargetLabel;
                    socket.message(message);
                    console.log(message);
                    rootCallBack(null, message);

                }
            }
        )
    }







}


function setNodeMongoFieldsToExport(params) {
    var exportedFields = params.exportedFields;
    var fields = [];
    if (!exportedFields)
        return null;// on exporte tous les champs mongo

    fields = exportedFields.trim().split(";");
    fields.push(params.mongoField);
    fields.push(params.mongoIdField);
    if (params.label.indexOf("#") == 0)
        fields.push(params.label.substring(1));

    var result = {}
    for (var i = 0; i < fields.length; i++) {
        result[fields[i]] = 1;
    }
    return result;
}
function setRelationsMongoFieldsToExport(params) {
    var exportedFields = params.neoRelAttributeField;
    var fields = [];
    if (exportedFields) {
        fields = exportedFields.trim().split(";");
    }
    fields.push(params.mongoSourceField);
    fields.push(params.mongoTargetField);

    var result = {}
    for (var i = 0; i < fields.length; i++) {
        result[fields[i]] = 1;
    }
    return result;
}

function mergeNodesMappingsAndSaveFile(path, nodeMappings,label, callback) {
    if (nodeMappings.length == 0)
        return;

  /*  if (fs.existsSync(path)) {// we add existing mappings in new mapping replacing old records with old mongoId by new Neo Value
        try {
            var str = fs.readFileSync(path);
            var oldMappings = JSON.parse("" + str);
            var newMongoIds = [];
            for (var i = 0; i < nodeMappings.length; i++) {
                newMongoIds.push(nodeMappings[i].mongoId);
            }

            for (var i = 0; i < oldMappings.length; i++) {
                if (newMongoIds.indexOf(oldMappings[i].mongoId) < 0) {
                    nodeMappings.push(oldMappings[i]);
                }
            }


        }
        catch (e) {
            callback(e)
        }
        // Do something
    }*/
    try {

        fs.writeFile(path, JSON.stringify(nodeMappings));
        var message = "Imported " + nodeMappings.length + " lines with label " + label;
        socket.message(message);
        console.log(message);
        callback(null, message);
    }
    catch (e) {
        callback(e)
    }

}


module.exports = exportMongoToNeo;







