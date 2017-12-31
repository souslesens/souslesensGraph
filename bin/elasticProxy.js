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
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER optimist
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/

//did you mean
// http://www.bilyachat.com/2015/07/search-like-google-with-elasticsearch.html
var elasticsearch = require('elasticsearch');
var serverParams = require('./serverParams.js');
var mongoProxy = require('./mongoProxy.js');
var fs = require('fs');
var util = require('./util.js');
var request = require('request');
var async = require('async');
var path = require('path');
var classifierManager = require("./rdf/classifierManager.js");

var elasticCustom = require("./elasticCustom.js");

var socket = require('../routes/socket.js');
var logger = require('logger').createLogger(path.resolve(__dirname, "../logs/elastic.log"));
logger.setLevel('info');
/*logger.format =function(level,date,message){
 return  (level+"   "+date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear()+ " : "+message;
 }*/


var baseUrl = "http://vps254642.ovh.net:9200/"
var baseUrl = "http://localhost:9200/"
var maxContentLength = 150;
var elasticSchema = null;

var client = null;

var elasticProxy = {

    getSchema: function () {
        if (!elasticSchema) {
            var str = fs.readFileSync(__dirname + "/search/elasticSchema.json");

            try {
                console.log("" + str)
                elasticSchema = JSON.parse("" + str);
            }
            catch (e) {
                console.log(e)
                return null;
            }
        }
        return elasticSchema;
    },
    ping: function () {
        getClient().ping({
            // ping usually has a 3000ms timeout
            requestTimeout: Infinity
        }, function (error) {
            if (error) {
                console.trace('elasticsearch cluster is down!');
            } else {
                console.log('All is well');
            }
        });

    },
    searchWordAll: function (word, callback) {
        getClient().search({
            q: word
        }).then(function (body) {
            var hits = body.hits.hits;
            callback(null, hits);
        }, function (error) {
            callback(error);
        });
    }

    ,
    search: function (index, type, query, callback) {

        getClient().search({
            index: index,
            type: type,
            body: {
                query: {
                    match: {
                        body: query
                    }
                }
            }
        }).then(function (resp) {
            var hits = resp.hits.hits;
            callback(null, hits);
        }, function (err) {
            callback(err);
        });
    },

    /* body: [
     // action description
     { index:  { _index: 'myindex', _type: 'mytype', _id: 1 } },
     // the document to index
     { title: 'foo' },
     // action description
     { update: { _index: 'myindex', _type: 'mytype', _id: 2 } },
     // the document to update
     { doc: { title: 'foo' } },
     // action description
     { delete: { _index: 'myindex', _type: 'mytype', _id: 3 } },
     // no document needed for this delete
     ]*/
    bulk: function (payload, callback) {
        getClient().bulk({
            body: payload
        }, function (err, resp) {
            if (err) {
                callback(err);

            } else {
                callback(null, resp);
            }
        });
    },


    findDocumentsById: function (index, ids, words, callback) {

        var payload =
            {
                "from": "0",

                "query": {
                    "bool": {
                        "must": [
                            {
                                "ids": {
                                    "values": ids
                                }
                            }
                        ]
                    }
                }

                ,
                "highlight": {
                    "fields": {
                        "content": {"number_of_fragments": 100}
                    }
                }
            };
        var fields = elasticProxy.getShemaFields(index);
        if (fields.indexOf("content") < 0)
            fields.push("content");
        payload._source = fields;

        if (words) {
            for (var i = 0; i < words.length; i++) {
                if (words[i].indexOf("*") > -1) {
                    payload.query.bool.must.push({"wildcard": {"content": words[i]}})

                } else

                    payload.query.bool.must.push({"match": {"content": words[i]}})
            }
        }

        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + "/_search"
        };

        console.log(JSON.stringify(payload, null, 2));
        request(options, function (error, response, body) {
            elasticProxy.processSearchResult(error, index, body, callback);

        });
    },
    findSimilarDocuments: function (index, docId, minScore, size, callback) {


        var payload =
            {
                "size": size,
                "query": {
                    "more_like_this": {
                        "fields": ["content"],
                        "like": [
                            {
                                "_index": index,
                                "_type": "type_document",
                                "_id": docId
                            }],
                        "min_word_length": 5


                    },

                }
            }
        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + "/_search"
        };


        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (!body.hits) {
                return callback(null, []);
            }
            var hits = body.hits.hits;
            var docs = [];
            for (var i = 0; i < hits.length; i++) {
                var obj = {};
                var objElastic = hits[i]._source;
                obj.title = objElastic.title;
                obj._id = hits[i]._id;
                obj._score = Math.round(hits[i]._score * 10);
                obj.date = objElastic.date;
                obj.path = objElastic.path;
                if (objElastic.content) {
                    if (objElastic.content.length > maxContentLength)
                        obj.content = objElastic.content.substring(0, maxContentLength) + "...";
                    else
                        obj.content = objElastic.content;
                }

                docs.push(obj);

                docs.sort(function (a, b) {
                    if (a._score > b._score)
                        return -1;
                    if (a._score < b._score)
                        return 1;
                    return 0;
                })
            }
            return callback(null, docs);

        });
    },

    findTerms: function (index, type, field, terms, callback) {
        var termObj = {};
        termObj[field] = terms;
        var payload = {
            "size": serverParams.elasticMaxFetch,
            "query": {
                "terms": termObj,
            }
        }
        if (type != null)
            type = "/" + type;
        else type = "";
        var options = {

            method: 'POST',
            json: payload,
            url: baseUrl + index + type + "/_search"
        };

        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (body.error)
                return callback(body.error.type);

            var hits = body.hits.hits;
            var data = [];
            for (var i = 0; i < hits.length; i++) {
                data.push(hits[i]._source.content)

            }
            return callback(null, data)


        });

    },
    findDocuments: function (index, type, word, from, size, slop, fields, andWords, callback) {
        var match = {"content": word};
        if (!fields) {
            fields = elasticProxy.getShemaFields(index);

        }
        if (size)
            size = parseInt("" + size)
        var query = "";
        if (!slop || slop < 2) {
            query = {
                "match": match
            }
        } else {
            query = {

                "match_phrase": {
                    "content": {
                        "query": word,
                        "slop": util.convertNumStringToNumber(slop)
                    }
                }
            }
        }


        if (word == null || word == "*" || word == "")
            query = {"match_all": {}}

        if (word.indexOf("*") > -1) {
            query = {
                "wildcard": {"content": word}
            }
        }


        if (andWords && andWords.length > 0) {


            query =
                {
                    "bool": {
                        "must": [
                            query

                        ]
                    }
                }

            for (var i = 0; i < andWords.length; i++) {
                query.bool.must.push({"match": {"content": andWords[i]}})
            }

        }


        var payload = {
            "from": from,
            "size": size,
            "_source": fields,
            "query": query,
            "highlight": {
                "fields": {
                    "content": {}
                    //  "content":{"fragment_size" : 50, "number_of_fragments" : 10}
                }
            }

        }

        if (!type)
            type = "";
        else
            type = "/" + type;

        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + type + "/_search"
        };

        // console.log(JSON.stringify(options, null, 2));
        request(options, function (error, response, body) {
            elasticProxy.processSearchResult(error, index, body, callback);

        });
    },
    processSearchResult: function (error, index, body, callback) {

        if (error)
            return callback(error);
        if (!body.hits) {
            return callback(null, []);
        }
        var hits = body.hits.hits;

        var total = body.hits.total;
        var docs = [];

        var uiMappings = {}
        schema = elasticProxy.getSchema();
        if (schema && schema[index] && schema[index].uiMappings)
            uiMappings = schema[index].uiMappings;
        var icons = [];
        if (schema && schema[index] && schema[index].icons) {
            icons = schema[index].icons;
        }
        var mode = "read";

        if (schema && schema[index] && schema[index].mode)
            mode = schema[index].mode
        var csvFields = []
        if (schema && schema[index] && schema[index].csvFields)
            csvFields = schema[index].csvFields;

        for (var i = 0; i < hits.length; i++) {

            var obj = {};
            var objElastic = hits[i]._source;


            for (var key in objElastic) {
                var value = objElastic[key];
                if (value) {
                    if (typeof value === "string")
                        value = value.replace("undefined", "")
                    if (uiMappings[key]) {
                        obj[uiMappings[key]] = value;
                    }

                    obj[key] = value;
                }
            }
            if (hits[i].highlight && hits[i].highlight.content)
                obj.highlights = hits[i].highlight.content;
            else
                obj.highlights = [];

            obj.type = hits[i]._type;
            obj._id = hits[i]._id;

            docs.push(obj);
        }


        var result = {
            docs: docs,

            total: total,
            icons: icons,
            mode: mode,
            csvFields: csvFields,

        }

        return callback(null, result);


    }
    ,
    getAssociatedWords: function (index, word, size, slop, andWords, stopWords, classifierSource, iterations, callback) {
        if (!iterations || iterations == "")
            iterations = 0;
        else
            iterations = parseInt("" + iterations);

        if (typeof word === "object" && word.ids) {
            query = {
                "bool": {
                    "must": [
                        {
                            "ids": {
                                "values": word.ids
                            }
                        }
                    ]

                }
            }
        }
        else if (andWords && andWords.length > 0) {
            query =
                {
                    "bool": {
                        "must": [
                            {"match": {"content": word}}

                        ]
                    }
                }

            for (var i = 0; i < andWords.length; i++) {
                query.bool.must.push({"match": {"content": andWords[i]}})
            }
        }
        else {// word simple
            var match;
            if (word == null || word == "*" || word == "")
                match = {"match_all": {}}
            else if (word.indexOf("*") > -1) {
                query = {
                    "wildcard": {"content": word}
                }
            }

            else
                match = {"match": {"content": word}};


            var query = "";
            if (!slop || slop < 2) {
                query = match;
            } else {
                query = {

                    "match_phrase": {
                        "content": {
                            "query": word,
                            "slop": util.convertNumStringToNumber(slop)
                        }
                    }
                }
            }


        }

        var payload = {
            "query": query,
            "size": serverParams.elasticMaxFetch,
            _source: "",
            "aggs": {
                "associatedWords": {
                    "terms": {
                        "order" : { "_count" : "desc" },
                        "field": "content",
                        "size": size,
                        "exclude": ["le", "la", "les", "un", "une", "des", "je", "tu", "il", "à", "a",
                            "elle", "nous", "vous", "ils", "moi", "toi", "lui", "eux", "a", "est",
                            "sont", "si", "et", "pour", "dans", "du", "en", "par", "sur",
                            "etre", "que", "au", "qui", "plus", "pas", "ce", "avec", "aux", "au",
                            "cette", "ce", "ces", "non", "oui", "donc", "un", "une", "ceci", "est", "tres",
                            "fait", "entre", "trois", "apres", "avant", "pendant", "ete", "moins", "contre",
                            "dont", "ses", "sous", "son", "tout", "car", "cela", "comme", "bien", "mais",
                            "tout", "rien", "trop", "veut", "deux", "notre", "nos", "votre", "vos", "leurs",
                            "leur", "via", "ainsi", "chaque", "data", "deja", "faire",
                            "applications", "are", "aux", "avec", "afin", "aussi", "base", "but",
                            "cas", "etc", "exemple", "idee", "information", "lors",
                            "mettre", "mise", "mon", "meme", "part", "permet", "peut", "place",
                            "possible", "pourrait", "sans", "serait", "soit", "total",
                            "autres", "avoir", "avons", "chez", "ai", "meilleure", "permettant",
                            "plusieurs", "simple", "tous", "egalement",
                            "creer", "doit", "faut", "good", "groupe", "important", "jour",
                            "niveau", "nombre", "necessaire", "oeuvre", "permettre", "peuvent", "point",
                            "points", "possibilite", "toutes", "travail", "type", "vers",
                            "differents", "proposer", "null", "permettrait", "mieux", "sein", "000",
                            "fois", "local", "utiliser", "video", "videos", "images", "francois", "nicolas", "direct", 'même',
                            'monde',
                            'd’une',
                            'autre',
                            'selon',
                            'toute',
                            'c’est',
                            'd’un',
                            'forme',
                            'celle',
                            'très',
                            'certains',
                            'depuis',
                            'encore',
                            'alors',
                            'quand',
                            'certain',
                            'seulement',
                            'était',
                            'autour',
                            'avait',
                            'tant',
                            'étant',
                            'ceux',
                            'celui',
                            'différentes',
                            'elles',
                            'celle',
                            'd’autres',
                            'souvent',
                            'surtout',
                            'après',
                            'n’est',
                            'l’on',
                            'qu’il',
                            "de",
                            "ou",
                            "ne",
                            "on",
                            "se",
                            "sa",
                            "p",
                            "y",
                            "ont",
                            "où",
                            "été",
                            "toujours",
                            "dire", "ci", "là", "cet",
                            "dit",
                            "n",
                            "quelque",
                            "in",
                            "mêmes",
                            "t",
                            "b",
                            "peu",
                            "propre",
                            "ici",
                            "déjà",
                            "d",
                            "seule",
                            "celles",
                            "ni",
                            "tel",
                            "of",
                            "puis",
                            "va",
                            "rôle",
                            "telle",
                            "jamais",
                            "mis",
                            "côté",
                            "quelques",
                            "cependant",
                            "the",
                            "plutôt",
                            "autant",
                            "suite",
                            "également",
                            "dès",
                            "c",
                            "lequel",
                            "ensuite",
                            "qu’*",
                            "d'*",
                            "s'*",
                            "and",
                            "l",


                            "shall",
                            "be",
                            "to",
                            "for",
                            "with",
                            "or",
                            "as",
                            "by",
                            "all",
                            "at",
                            "is",
                            "not",
                            "this",
                            "from",
                            "any",
                            "that",
                            "used",
                            "each",
                            "if",
                            "an",
                            "when",
                            "case",
                            "have",
                            "during",
                            "than"


                        ]
                    }
                }
            }
        }


        /*    payload.aggs={

                    "significant_crime_types" : {
                        "significant_terms" : { "field" : "content" }

                }
            }*/
        if (stopWords) {
            for (var i = 0; i < stopWords.length; i++) {
                payload.aggs.associatedWords.terms.exclude.push(stopWords[i]);
            }
        }
        else
            stopWords = [];
        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + "/_search"
        };

        console.log(JSON.stringify(payload, null, 2))
        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (!body.hits) {
                return callback(null, []);
            }

            var types = [];
            var hits = body.hits.hits;
            for (var i = 0; i < hits.length; i++) {
                if (types.indexOf(hits[i]._type) < 0) {
                    types.push(hits[i]._type)
                }
            }


            var buckets = body.aggregations.associatedWords.buckets;

            var iterationNstopWords = 0;
            var words = [];
            for (var i = 0; i < buckets.length; i++) {

                var obj = {};
                var objElastic = buckets[i];
                obj.key = objElastic.key;
                obj.count = objElastic.doc_count;

                if (elasticProxy.acceptAssociatedWord(obj.key)) {

                    words.push(obj)
                }
                else {

                    stopWords.push(obj.key);
                    iterationNstopWords += 1;

                }
            }

           console.log(iterationNstopWords + "/" + words.length)
            if (iterations > 0 && ((iterationNstopWords * 4) > words.length)) {// condition for re-extract associated words with more stopwords
                iterations--;
                elasticProxy.getAssociatedWords(index, word, size, slop, andWords, stopWords, classifierSource, iterations, callback);

            }

            elasticProxy.extractWordNetNouns(words, function (err, buckets) {
                if (err) {
                    return callback(err);
                }
                var classifier;
                if (index && classifierSource && classifierSource.length > 0)
                    classifier = classifierManager.getClassifierOutput(index, classifierSource, hits);

                var result = {
                    buckets: buckets,
                    types: types,
                    classifier: classifier,

                };


                return callback(null, result);


            })


        });

    }
    ,
    extractWordNetNouns: function (_buckets, callback) {
        var buckets = _buckets;
        var words = [];
        for (var i = 0; i < buckets.length; i++) {
            words.push(buckets[i].key)
        }
        var validBuckets = [];

        elasticProxy.findTerms("wordnet_fr", null, "content.synonyms", words, function (err, data) {
            if (err)
                return callback(err);

            var allwords = []
            for (var i = 0; i < buckets.length; i++) {
                var word = buckets[i].key

                for (var j = 0; j < data.length; j++) {
                    if (data[j].synonyms.indexOf(word) > -1) {
                     //
                     if (data[i].pos == "n" && allwords.indexOf(word) < 0) {
                         console.log(word +" pos   "+data[i].pos)
                      //  if( allwords.indexOf(word) < 0) {
                            allwords.push(word)
                            validBuckets.push({key: word, count: buckets[i].count});
                        }
                    }


                }
            }
            return callback(null, validBuckets)
        })

    }
    ,
    acceptAssociatedWord: function (word) {
        if (word.length < 3)
            return false;
        if (word.match(/[0-9']+/))
            return false;

        return true;

    }












    //******************************************************************INDEXING**********************************************************
    //******************************************************************INDEXING**********************************************************
    //******************************************************************INDEXING**********************************************************


    ,
    indexOneDoc: function (index, type, id, payload, callback) {
        if (!id)
            id = "_" + Math.round(Math.random() * 10000000);
        var elasticFields = elasticProxy.getShemaFields(index);
        var content = "";
        for (var j = 0; j < elasticFields.length; j++) {
            var key = elasticFields[j];
            var value = payload[key];
            if (!value)
                continue;

            content += " " + value;
            payload[key] = value;

        }
        payload["content"] = content;

        getClient().index({
            index: index,
            type: type,
            id: id,
            body: payload
        }, function (err, response) {
            if (err) {
                console.log(err);
                callback(err);
                return;

            } else {
                callback(null, response);
            }
        });
    }
    ,
    indexDocumentDir: function (dir, index, type, recursive, callback) {

        var acceptedExtensions = ["doc", "docx", "xls", "xslx", "pdf", "ppt", "pptx", "html", "htm", "txt", "csv"];

        var indexedFiles = [];

        function getFilesRecursive(dir) {
            elasticProxy.sendMessage("indexing " + dir);
            dir = path.normalize(dir);
            if (dir.charAt(dir.length - 1) != '/')
                dir += '/';
            var files = fs.readdirSync(dir);
            for (var i = 0; i < files.length; i++) {
                var fileName = dir + files[i];
                var stats = fs.statSync(fileName);

                if (stats.isDirectory()) {
                    getFilesRecursive(fileName)
                }
                else {
                    var p = fileName.lastIndexOf(".");
                    if (p < 0)
                        continue;
                    var extension = fileName.substring(p + 1).toLowerCase();
                    if (acceptedExtensions.indexOf(extension) < 0) {
                        logger.info("!!!!!!  refusedExtension " + fileName);
                        continue;
                    }


                    // console.log("File" + fileName + " size " + stats.size + " ---------------" + (i++));
                    if (stats.size > serverParams.elasticsaerchMaxDocSizeForIndexing) {
                        logger.info("!!!!!! file  too big " + Math.round(stats.size / 1000) + " Ko , not indexed ");
                        continue;

                    }
                    indexedFiles.push(fileName);
                }
            }

        }

        getFilesRecursive(dir);

        indexedFiles.sort();
        var t0 = new Date().getTime();
        async.eachSeries(indexedFiles, function (fileName, callbackInner) {
                var base64Extensions = ["doc", "docx", "xls", "xslx", "pdf", "ppt", "pptx"];
                var p = fileName.lastIndexOf(".");
                if (p < 0)
                    callback("no extension for file " + fileName);
                var extension = fileName.substring(p + 1).toLowerCase();
                var base64 = false;

                if (base64Extensions.indexOf(extension) > -1) {
                    base64 = true;


                }
                var t1 = new Date().getTime();
                elasticProxy.indexDocumentFile(fileName, index, type, base64, function (err, result) {
                    if (err) {
                        logger.error(err)
                        return callbackInner(err)
                    }
                    var duration = new Date().getTime() - t1;
                    logger.info("file " + fileName + "   indexed .Duration (ms) : " + duration)

                    callbackInner(null)


                });


            }, function (err, result) {
                if (err)
                    return callback(err);
                var duration = new Date().getTime() - t0;
                var message = "indexation done " + indexedFiles.length + "documents  in " + duration + " msec.";
                console.log(message)
                return callback(null, message);

            }
        );


    },

    indexJsonArray: function (index, type, array, callback) {
        elasticPayload = [];
        var startId = 10000
        for (var i = 0; i < array.length; i++) {
            elasticPayload.push({index: {_index: index, _type: type, _id: "_" + (startId++)}})
            var payload = {"content": array[i]};
            elasticPayload.push(payload);
        }


        getClient().bulk({
            body: elasticPayload
        }, function (err, resp) {
            if (err) {
                console.log("ERROR " + err)
                console.log(JSON.stringify(elasticPayload, null, 2))

            } else {
                return callback(null, " done" + resp);
            }
        });
    }


    ,
    indexMongoCollection: function (mongoDB, mongoCollection, mongoQuery, elasticIndex, elasticType, callback) {
        if (typeof mongoQuery !== "object")
            mongoQuery = JSON.parse(mongoQuery);

        var currentIndex = 0;
        var resultSize = 1;
        var elasticFields = elasticProxy.getShemaFields(elasticIndex);
        var mongoFields = {};
        for (var i = 0; i < elasticFields.length; i++) {
            var field = elasticFields[i];
            if (field[i] == "mongoId")
                field = "_id";
            mongoFields[field] = 1;

        }
        async.whilst(
            function () {//test
                return resultSize > 0;
            },
            function (callbackWhilst) {//iterate

                if (mongoQuery && mongoQuery._id) {
                    mongoQuery = util.prepareJsonForMongo(mongoQuery)
                }

                mongoProxy.pagedFind(currentIndex, serverParams.mongoFetchSize, mongoDB, mongoCollection, mongoQuery, mongoFields, function (err, result) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    resultSize = result.length;
                    if (resultSize == 0) {
                        return callback(null, "end");
                    }

                    currentIndex += serverParams.mongoFetchSize;
                    var startId = Math.round(Math.random() * 10000000);
                    var elasticPayload = [];

                    // contcat all fields values in content field
                    for (var i = 0; i < result.length; i++) {


                        elasticPayload.push({index: {_index: elasticIndex, _type: elasticType, _id: "_" + (startId++)}})
                        var payload = {};
                        var content = "";
                        //    console.log("----"+JSON.stringify(elasticFields,null,2))
                        for (var j = 0; j < elasticFields.length; j++) {
                            var key = elasticFields[j];
                            var value = result[i][key];
                            if (key == "mongoId") {
                                value = result[i]["_id"].toString();
                            }

                            //  console.log("----"+key+":"+value)
                            if (!value)
                                continue;


                            content += " " + value;
                            payload[key] = value;


                        }
                        payload["content"] = content;
                        elasticPayload.push(payload);
                        //    resultSize = result.length;
                        //   return  callback(null,payload);
                    }


                    getClient().bulk({
                        body: elasticPayload
                    }, function (err, resp) {
                        if (err) {
                            console.log("ERROR " + err)
                            console.log(JSON.stringify(elasticPayload, null, 2))

                        } else {
                            return callbackWhilst(null);
                        }
                    });


                });

            }
            ,
            function (err, result) {//end
                if (err) {
                    callback(err);

                } else {
                    callback(null, "done");
                }

            });
    },

    deleteDoc: function (index, type, elasticId, callback) {

        var options = {
            method: 'DELETE',
            url: baseUrl + index + "/" + type + "/" + elasticId
        }
        request(options, function (error, response, body) {
            if (error) {
                return callback(error);
            }
            return callback(null, body);

        });


    },

    deleteIndex: function (index, force, callback) {
        var options = {
            method: 'HEAD',
            url: baseUrl + index + "/"
        }
        request(options, function (error, response, body) {

            var status = response.statusCode;
            if (!status) {
                return callback("elastic server did not respond, is the service on?")
            }
            if (status == 200 && force) {
                var options = {
                    method: 'DELETE',
                    url: baseUrl + index + "/"
                }
                request(options, function (error, response, body) {
                    if (error) {
                        logger.error(error)
                        return callback(error);
                    }
                    logger.info("-----index " + index + " deleted-----");
                    callback(null);
                })

            }
            else {
                logger.info("-----index " + index + " does not exist-----");
                callback(null);
            }
        })
    }
    ,


    initDocIndex: function (index, callback) {

        elasticProxy.deleteIndex(index, true, function (err) {
            if (err)
                return callback(err);
//******************************* init attachment Pipeline*******************************

            var options = {
                method: 'PUT',
                description: "Extract attachment information",
                url: baseUrl + "_ingest/pipeline/attachment",
                json: {
                    processors: [
                        {
                            "attachment": {
                                "field": "data"
                            }
                        }
                    ]
                }
            };


            request(options, function (error, response, body) {
                if (error)
                    return callback(error);

//******************************* init content Mapping*******************************
                var options = {
                    method: 'PUT',
                    description: "init mapping on attachment content",
                    url: baseUrl + index + "/",

                    json: {
                        "mappings": {
                            "type_document": {

                                "properties": {
                                    "content": {
                                        "type": "text",
                                        "index_options": "offsets",

                                        "fields": {
                                            "contentKeyWords": {
                                                "type": "keyword",
                                                "ignore_above": 256
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };

                request(options, function (error, response, body) {
                    if (error)
                        return callback(error);
                    //******************************* initfielddata*******************************
                    //    http://localhost:9200/my_index2/_mapping/my_type
                    var options = {
                        method: 'PUT',
                        description: "init fielddata",
                        url: baseUrl + index + "/_mapping/type_document",
                        json: {
                            "properties": {
                                "content": {
                                    "type": "text",
                                    "fielddata": true
                                }
                            }
                        }
                    }
                    request(options, function (error, response, body) {
                        if (error)
                            return callback(error);
                        if (body.error)
                            return callback(body.error);
                        callback(null, body)

                    });
                });
            });
        })

    },
    indexDocumentFile: function (_file, index, type, base64, callback) {
        var id = "R" + Math.round(Math.random() * 1000000000)
        //  var file = "./search/testDocx.doc";
        //  var file = "./search/testPDF.pdf";
        var fileContent;
        var file = _file;
        var options;
        if (base64) {
            index = index + "temp"
            fileContent = util.base64_encodeFile(file);
            options = {
                method: 'PUT',
                url: baseUrl + index + "/" + type + "/" + id + "?pipeline=attachment",
                json: {
                    "data": fileContent,
                    "path": file
                }
            }
        }
        else {
            fileContent = "" + fs.readFileSync(file);
            fileContent = elasticCustom.processContent(fileContent);
            var title = file.substring(file.lastIndexOf("/") + 1);
            options = {
                method: 'PUT',
                url: baseUrl + index + "/" + type + "/" + id,
                json: {
                    "content": fileContent,
                    "path": file,
                    "title": title
                }
            }
        }


        request(options, function (error, response, body) {
            if (error) {
                logger.error(file + " : " + error);
                console.error(file + " : " + error);
                // return callback(file+" : "+error);
            }
            if (body.error) {
                logger.error(file + " : " + body.error);
                console.error(file + " : " + body.error);
                if (body.error.reason) {
                    logger.error(file + " : " + body.error.reason);
                    console.error(file + " : " + body.error.reason);
                }
                //  return callback(file+" : "+body.error);
            }
            return callback(null, body);


        });

    },


    copyDocIndex: function (oldIndex, newIndex, type, callback) {

        var payload = {
            "from": 0, "size": serverParams.elasticMaxFetch,
            "_source": ["attachment.content", "path", "attachment.date", "attachment.title", "content"],
            "query": {
                "match_all": {}
            }
        }

        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + oldIndex + "/" + type + "/_search"
        };

        //      console.log(JSON.stringify(payload, null, 2));
        request(options, function (error, response, body) {

            if (error)
                return callback(error);
            if (!body.hits || !body.hits.hits)
                console.log("aaaaaaaaaaaaaaaaaaa")
            var hits = body.hits.hits;
            var result = [];
            var newObjs = []
            for (var i = 0; i < hits.length; i++) {
                var obj = {};
                var objElastic = hits[i]._source;
                var newObj = {};
                if (objElastic.attachment) {
                    newObj = objElastic.attachment;
                    newObj.path = objElastic.path;
                }
                else {
                    newObj = objElastic;

                }


                newObjs.push(newObj);
            }
            async.eachSeries(newObjs, function (newObj, callbackInner) {
                var id = "R" + Math.round(Math.random() * 1000000000)
                options.url = baseUrl + newIndex + "/" + type + "/" + id;
                options.json = newObj;
                request(options, function (error, response, body) {
                    if (error)
                        return callbackInner(error);
                    logger.info("index " + oldIndex + " copied to" + newIndex)
                    return callbackInner(null);
                });

            }, function (err) {
                callback(err, result);
            });


        });

    }


    ,
    indexDocDirInNewIndex: function (index, type, rootDir, doClassifier, callback) {

        if (!fs.existsSync(rootDir)) {
            var message = ("directory " + rootDir + " does not not exist on server")
            elasticProxy.sendMessage("ERROR" + message);
            return callback(message);
        }

        var indexTemp = index + "temp";
        elasticProxy.initDocIndex(index, function (err, result) {
            if (err) {
                elasticProxy.sendMessage("ERROR" + err);
                return callback(err);
            }
            elasticProxy.sendMessage("index " + index + " created");

            elasticProxy.initDocIndex(indexTemp, function (err, result) {
                if (err) {
                    elasticProxy.sendMessage("ERROR" + err);
                    return callback(err);
                }
                elasticProxy.sendMessage("index " + indexTemp + " created");


                elasticProxy.sendMessage("indexing  directory " + rootDir + "  and sub directories");
                elasticProxy.indexDocumentDir(rootDir, index, type, true, function (err, result) {
                    if (err) {
                        elasticProxy.sendMessage("ERROR" + err);
                        return callback(err);
                    }

                    elasticProxy.sendMessage("indexation in tempIndex successfull " + result);


                    elasticProxy.copyDocIndex(indexTemp, index, type, function (err, result) {
                        if (err) {
                            elasticProxy.sendMessage("ERROR" + err);
                            return callback(err);
                        }
                        elasticProxy.sendMessage("index " + indexTemp + " copied to " + index);

                        elasticProxy.deleteIndex(indexTemp, true, function (err, result) {
                            elasticProxy.sendMessage("delete temporary index " + indexTemp);
                            var message = "-----------Index " + index + " is ready to use-----------"
                            if (doClassifier.toLowerCase() == "y") {

                                classifierManager.createIndexClassifierFromFrequentWordsAndOntology(index, 200, null, null, 10, ["BNF"], "fr", 1, function (err, result) {
                                    elasticProxy.sendMessage("classifier done");

                                    elasticProxy.sendMessage(message);
                                })
                            }
                            return callback(null, message);

                        });
                    });

                });


            });
        })
    }
    ,
    indexDirInExistingIndex: function (index, type, rootDir, doClassifier, callback) {
        if (!fs.existsSync(rootDir)) {
            var message = ("directory " + rootDir + " does not not exist on server")
            elasticProxy.sendMessage("ERROR" + message);
            return callback(message);
        }
        var indexTemp = index + "temp";
        var options = {
            method: 'HEAD',
            url: baseUrl + index + "/"
        }
        request(options, function (error, response, body) {

            var status = response.statusCode;
            if (!status) {
                elasticProxy.sendMessage("ERROR :elastic server did not respond, is the service on?")
            }
            if (status != 200) {
                elasticProxy.sendMessage("ERROR index " + index + " does not exists")
            }


            elasticProxy.initDocIndex(indexTemp, function (err, result) {
                if (err) {
                    elasticProxy.sendMessage("ERROR" + err);
                    return callback(err);
                }
                elasticProxy.sendMessage("index " + indexTemp + " created");


                elasticProxy.sendMessage("indexing  directory " + rootDir + "  and sub directories");
                elasticProxy.indexDocumentDir(rootDir, index, type, true, function (err, result) {
                    if (err) {
                        elasticProxy.sendMessage("ERROR" + err);
                        return callback(err);
                    }

                    elasticProxy.sendMessage("indexation in tempIndex successfull " + result);


                    elasticProxy.copyDocIndex(indexTemp, index, type, function (err, result) {
                        if (err) {
                            elasticProxy.sendMessage("ERROR" + err);
                            return callback(err);
                        }

                        elasticProxy.sendMessage("index " + indexTemp + " copied to " + index);
                        elasticProxy.deleteIndex(indexTemp, true, function (err, result) {
                            var message = "-----------Index " + index + " is ready to use-----------"
                            elasticProxy.sendMessage("delete temporary index " + indexTemp);
                            if (doClassifier.toLowerCase() == "y") {
                                classifierManager.createIndexClassifierFromFrequentWordsAndOntology(index, 200, null, null, 10, ["BNF"], "fr", 1, function (err, result) {

                                    elasticProxy.sendMessage("classifier done");
                                    elasticProxy.sendMessage(message);
                                })
                            }
                            else {
                                elasticProxy.sendMessage("index " + index + " updated");
                            }
                            return callback(null, message);

                        });
                    });

                });


            });
        })
    }
    ,
    sendMessage: function (message) {
        socket.message(message);
        logger.info(message);
        console.log(message);
    }
    ,
    getShemaFields: function (index) {
        var fields = null;
        schema = elasticProxy.getSchema();
        if (schema && schema[index])
            fields = schema[index].fields
        if (!fields || fields.length == 0)
            fields = ["title", "date", "type", "path"];
        return fields;

    }


}


function getClient() {

    if (client)
        return client;
    return new elasticsearch.Client({
        host: serverParams.elasticUrl,
        log: 'trace'
    });
}

function indexJsonFile(filePath, ealasticUrl) {
    var payload = fs.readFileSync(filePath);
    payload = "" + payload,
        client.bulk({
            body: payload
        }, function (err, resp) {
            if (err) {
                callback(err);

            } else {
                callback(null, resp);
            }
        });

}

module.exports = elasticProxy;
elasticProxy.getSchema();

//**********************************************Command Line args***********************************
const args = process.argv;
if (args.length > 2) {
    if (args[2] == "indexDirInNewIndex") {

        var schema = {
            properties: {
                index: {
                    message: "indexName",
                    required: true
                },
                type: {
                    message: "mappings type",
                    required: true

                },
                rootDir: {
                    message: "root directory",
                    required: true
                },
                generateBNFclassifier: {
                    message: "generate BNF classifier ? confirm=Y cancel=N",
                },
                message: {
                    message: "create index " + index + " and index dir " + dirPath + " confirm=Y cancel=N",
                    required: true

                }
            }
        };
        var prompt = require('prompt');
        prompt.start();

        prompt.get(schema, function (err, result) {
            if (result.message.toLowerCase() == "y") {
                var index = result.index;
                var rootDir = result.rootDir;
                var doClassifier = result.generateBNFclassifier;
                elasticProxy.indexDocDirInNewIndex(index, type, rootDir, doClassifier, function (err, result) {
                    if (err)
                        console.log("ERROR " + err);
                    console.log("DONE");
                })

            }
        });


    }
    if (args[2] == "indexDirInExistingIndex") {
        var index = args[3];
        var dirPath = args[4];
        console.log("index dir " + dirPath + " in index " + index);
        var schema = {
            properties: {

                index: {
                    message: "indexName",
                    required: true

                },
                type: {
                    message: "mappings type",
                    required: true

                },
                rootDir: {
                    message: "root directory",
                    required: true

                },
                updateBNFclassifier: {
                    message: "generate BNF classifier ? confirm=Y cancel=N",


                },

                message: {
                    message: "create index " + index + " and index dir " + dirPath + " confirm=Y cancel=N",
                    required: true

                }
            }
        };
        var prompt = require('prompt');
        prompt.start();

        prompt.get(schema, function (err, result) {
            if (result.message.toLowerCase() == "y") {
                var index = result.index;
                var indexTemp = index + "Temp";
                var rootDir = result.rootDir;
                var doClassifier = result.updateBNFclassifier;
                elasticProxy.indexDirInExistingIndex(index, type, rootDir, doClassifier, function (err, result) {
                    if (err)
                        console.log("ERROR " + err);
                    console.log("DONE");
                })


            }
        });


    }


}

if (false) {
    elasticProxy.indexDocDirInNewIndex("dsi", "D:\\docsDSI", "false", function (err, result) {

    })

}


if (false) {
    elasticProxy.indexDocDirInNewIndex("jfm", "D:\\JFM\\ETUDES DOCTORALES", "false", function (err, result) {

    })

}


