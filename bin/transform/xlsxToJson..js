const XLSX = require('xlsx');

const async = require("async");
const fs = require('fs');
const importDataIntoNeo4j = require("../importDataIntoNeo4j");

var sourcexlsxFile = 'D:\\Total\\quantum\\avril2019\\MDM_Quantum.xlsx';
var sheetNames = [
    /*"tblAttribute",
    "tblAttributePickListValue",
    "tblAttribToAttribPickListValue",
    "tblDocumentType",*/
    "tblDisciplineDocumentType",
  /*  "tblDiscipline",
    "tblFunctionalClass",
    "tblPhysicalClass",*/
    "tblFunctionalClToPhysicalCl",
 //   "tblFunPhyDiscDocTyToAttribute",
    "tblFunPhyCLToDiscDocumentTy",

]

var mappingRequestsPath = "D:\\Total\\quantum\\avril2019\\mappingRequests.json";


var xlsxToJson = {


    extractWorkSheets: function (sourcexlsxFile, sheetNames, callback) {
        var workbook = XLSX.readFile(sourcexlsxFile);
        var sheet_name_list = workbook.SheetNames;

        var sheets = {};

        sheet_name_list.forEach(function (sheetName) {
            if (sheetNames.indexOf(sheetName) > -1) {

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
        var range = (/([A-Z])+([0-9]+):([A-Z])+([0-9]+)/).exec(ref);
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

    souslesensJsonToNeo: function (subGraph, sheets, mappingRequestsPath, callbackOuter) {
        var mappings;
        async.series([
                function (callback) {

                    mappings = JSON.parse(fs.readFileSync("" + mappingRequestsPath)).requests;
                    return callback();

                },
                function (callback) {
                    var mappingKeys = Object.keys(mappings);
                    mappingKeys = mappingKeys.sort();// nodes first
                    async.eachSeries(mappingKeys, function (mappingKey, callbackEachSheet) {
                        var params = mappings[mappingKey];
                        var type;


                        var sheetName = params.source;
                        var json = sheets[sheetName];
                        console.log("processing request " + mappingKey + " on sheet " + sheetName)

                        if (json) {
                            params.type = "json";
                            params.data = json;
                            params.subGraph = subGraph;

                            if (mappingKey.indexOf("Nodes_") == 0) {

                                importDataIntoNeo4j.importNodes(params, function (err, result) {
                                    var xxx = result;
                                    console.log(result);
                                    callbackEachSheet(err);
                                })
                            }
                            else if (mappingKey.indexOf("Rels_") == 0) {
                                importDataIntoNeo4j.importRelations(params, function (err, result) {
                                    var xxx = result;
                                    console.log(result);
                                    callbackEachSheet(err);
                                })
                            }
                            else{

                                callbackEachSheet();
                            }


                        }
                        else {
                            console.log(" no mappings for sheet" + sheetName)

                            callbackEachSheet();
                        }


                    }, function (err) {

                        if(err)
                        console.log(err)
                        return callback(err)
                    })

                },


            ],

            function (err) {
                console.log("7", err)
                if (err) {

                    console.log(err);
                }
                callbackOuter(err);

            }
        )


    },


    toNeo: function (sourcexlsxFile, sheetNames) {
        var sheets = {}

        async.series([
            function (callback) {
                xlsxToJson.extractWorkSheets(sourcexlsxFile, sheetNames, function (err, result) {
                    sheets = result;
                    return callback();
                })


            },
            function (callback) {
                for (var key in sheets) {
                    console.log(key)
                    xlsxToJson.worksheetJsonToSouslesensJson(sheets[key], function (err, result) {
                        sheets[key] = result;
                    })
                }
                return callback();


            },


            function (callback) {

                xlsxToJson.souslesensJsonToNeo("quantum-04-22", sheets, mappingRequestsPath, function (err, result) {

                    return callback();
                })


            }


        ], function (err) {
            if (err)
                console.log(err);
            console.log("done")

        })


    }


}


if (true) {

    xlsxToJson.toNeo(sourcexlsxFile, sheetNames);


}


module.exports = xlsxToJson;
