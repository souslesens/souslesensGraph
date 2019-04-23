const XLSX = require('xlsx');
var socket = require('../../routes/socket.js');
const async = require("async");
const fs = require('fs');
const importDataIntoNeo4j = require("../importDataIntoNeo4j");



var xlsxToNeo = {


    extractWorkSheets: function (sourcexlsx, sheetNames, callback) {
        var workbook
        if (typeof(sourcexlsx) == "string")
            workbook = XLSX.readFile(sourcexlsx);
        else
            workbook = XLSX.read(sourcexlsx);

        var sheet_name_list = workbook.SheetNames;

        var sheets = {};

        sheet_name_list.forEach(function (sheetName) {
            if (!sheetNames || sheetNames.indexOf(sheetName) > -1) {

                sheets[sheetName] = workbook.Sheets[sheetName];

            }
        })
        callback(null, sheets)


    },


    listSheets: function (file, callback) {
        var workbook = XLSX.readFile(file);
        var sheet_name_list = workbook.SheetNames;
        var result = {
            sheetNames: sheet_name_list
        };

        callback(null, result);

    },

    listSheetColumns: function (file, sheetName, callback) {

        var workbook = XLSX.readFile(file);
        var sheet = workbook.Sheets[sheetName];

        var columns = []
        for (var key in sheet) {
            if (key.match(/[A-Z]+1$/))
                columns.push(sheet[key].v)

        }


        var result = {
            message: "listCsvFields",
            sheetColNames: columns
        };

        callback(null, result);
    },


    worksheetJsonToSouslesensJson: function (worksheet, callback) {

        var headers = [];
        var data = [];
        var ref = worksheet["!ref"];
        var range = (/([A-Z])+([0-9]+):([A-Z]+)([0-9]+)/).exec(ref);
        var lineDebut = range[2];
        var lineFin = range[4];
        var colDebut = range[1]
        var colFin = range[3]
        var alphabet = "A,";
        var dbleLetterColName = colFin.length > 1
        var colNames = [];
        for (var j = 65; j < 120; j++) {
            var colName
            if (j <= 90)
                colName = String.fromCharCode(j);
            else
                colName = "A" + String.fromCharCode(j - 25);


            colNames.push(colName);
            if (colName == colFin)
                break;

        }

        for (var i = lineDebut; i <= lineFin; i++) {
            for (var j = 0; j < colNames.length; j++) {


                var key = colNames[j] + i;

                if (!worksheet[key]) {
                    continue;
                }
                var value = worksheet[key].v;
                if (i == lineDebut)
                    headers.push(value);
                else {
                    if (j == 0) {
                        data[i] = {}
                    }

                    if (!data[i]) {
                        continue;
                    }
                    data[i][headers[j]] = value;

                }


            }
        }
        var dataArray = [];
        for (var key in data) {
            dataArray.push(data[key]);
        }

        return callback(null, {headers: headers, data: dataArray})


    },

    souslesensJsonToNeo: function (subGraph, sheets, mappingJson, callbackOuter) {
        var mappings;

        async.series([
                function (callback) {
                    var message="parsing mappings file";
                    console.log(message)
                    socket.message(message);

                    var jsonStr;
                    if(mappingJson.indexOf(".json")>-1 && mappingJson.indexOf(".json")<100 )
                       jsonStr=""+fs.readFileSync("" + mappingRequestsPath);
                    else
                        jsonStr=mappingJson;

                    mappings = JSON.parse(jsonStr)

                    return callback();

                },
                function (callback) {
                    var requests = mappings.requests;
                    var mappingKeys = Object.keys(requests);
                    mappingKeys = mappingKeys.sort();// nodes first
                    async.eachSeries(mappingKeys, function (mappingKey, callbackEachSheet) {
                        var params = requests[mappingKey];
                        var header = mappings[params.source].header;


                        var type;


                        var sheetName = params.source;
                        var json = sheets[sheetName];



                        var message="processing request " + mappingKey + " on sheet " + sheetName;
                        console.log(message)
                        socket.message(message);

                        if (json) {

                            //select only columns in mappings.header;
                            if (params.exportedFields == "all") {
                                var str = "";
                                header.forEach(function (columnName, index) {
                                    if (columnName == params.sourceField || columnName == params.sourceKey)
                                        return;
                                    if (index > 0)
                                        str += ";"
                                    str += columnName;
                                })
                                params.exportedFields = str;
                            }


                            params.type = "json";
                            params.data = json;
                            params.subGraph = subGraph;

                            if (mappingKey.indexOf("Nodes_") == 0) {

                                importDataIntoNeo4j.importNodes(params, function (err, result) {

                                    var message=result;
                                   // console.log(message)
                                  //  socket.message(message);
                                    callbackEachSheet(err);
                                })
                            }
                            else if (mappingKey.indexOf("Rels_") == 0) {
                                importDataIntoNeo4j.importRelations(params, function (err, result) {
                                    var message=result;
                                    console.log(message)
                                    socket.message(message);
                                    callbackEachSheet(err);
                                })
                            }
                            else {

                                callbackEachSheet();
                            }


                        }
                        else {
                            var message=" no mappings for sheet " + sheetName;
                            console.log(message)
                            socket.message(message);
                            callbackEachSheet();
                        }


                    }, function (err) {

                        if (err){
                            var message=err;
                            console.log(message)
                            socket.message(message);
                        }

                        return callback(err)
                    })

                },


            ],

            function (err) {

                if (err) {
                    var message=err;
                    console.log(message)
                    socket.message(message);
                }
                callbackOuter(err);

            }
        )


    },


    toNeo: function (subGraph,sourceXlsx,mappingJson, sheetNames,callbackOuter) {
        var sheets = {}

        async.series([
            function (callback) {
                var message="parsing xls file";
                console.log(message)
                socket.message(message);
                xlsxToNeo.extractWorkSheets(sourceXlsx, sheetNames, function (err, result) {
                    sheets = result;
                    return callback();
                })


            },
            function (callback) {
                for (var key in sheets) {
                    console.log(key)
                    xlsxToNeo.worksheetJsonToSouslesensJson(sheets[key], function (err, result) {
                        sheets[key] = result;
                    })
                }
                return callback();


            },


            function (callback) {

                xlsxToNeo.souslesensJsonToNeo(subGraph, sheets, mappingJson, function (err, result) {

                    return callback();
                })


            }


        ], function (err) {
            if (err)
                console.log(err);
            console.log("done");
                if(callbackOuter){
                    return callbackOuter(err,"All Done!")
                }


        })


    }


}


if (false) {
    var sourcexlsxFile = 'D:\\Total\\quantum\\avril2019\\MDM_Quantum.xlsx';
    var sheetNames = [
        "tblAttribute",
        "tblAttributePickListValue",
        "tblAttribToAttribPickListValue",
        "tblDocumentType",
        "tblDisciplineDocumentType",
        "tblDiscipline",
        "tblFunctionalClass",
        "tblPhysicalClass",
        "tblFunctionalClToPhysicalCl",
        "tblFunPhyDiscDocTyToAttribute",
        "tblFunPhyCLToDiscDocumentTy",

    ]

    var mappingRequestsPath = "D:\\Total\\quantum\\avril2019\\mappingRequests.json";

    xlsxToNeo.toNeo("quantum-04-22",sourcexlsxFile,mappingRequestsPath, sheetNames);


}


module.exports = xlsxToNeo;
