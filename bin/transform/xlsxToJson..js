const XLSX = require('xlsx');

const async = require("async");

var sourcexlsxFile = 'D:\\Total\\quantum\\avril2019\\MDM_Quantum.xlsx';
var sheetNames = [
    "tblAttribute",
    "tblAttributePickListValue",
    "tblAttribToAttribPickListValue",
    "tblDiscipline",
    "tblDocumentType",
    "tblDisciplineDocumentType",
    "tblFunctionalClass",
    "tblPhysicalClass",
    "tblFunctionalClToPhysicalCl",
    "tblFunPhyDiscDocTyToAttribute",
    "tblFunPhyCLToDiscDocumentTy",

]

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

        return callback(null, {headers: headers, data: data})


    },

    souslesensJsonToNeo: function (subGraph, worksheetName, worksheet, mappings, callback) {


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
                return callback();
                for (var key in sheets) {
                    xlsxToJson.souslesensJsonToNeo(subGraph, worksheetName, worksheet, mappings, function (err, result) {
                        sheets[key] = result;
                    })
                }
                return callback();


            }


        ], function (err) {
            if (err)
                console.log(err);

        })


    }


}


if (true) {

    xlsxToJson.toNeo(sourcexlsxFile, sheetNames);


}


module.exports = xlsxToJson;
