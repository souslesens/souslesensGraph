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

var fileUpload = require("./fileUpload.js");
var fs = require("fs");
var path = require("path");
//var exportsourceToNeao=require("./importDataIntoNeo4j.js");
var csv = require('csvtojson');
var socket = require('../routes/socket.js');
var util=require("./util.js")

var uploadCsvForNeo = {

    /*  getNormalizedCsvHeader: function (file, callback) {


          function getseparator(line) {
              var separators = [";", ",", "\t"];
              var scoreSep = [];
              separators.forEach(function (_sep, index) {
                  var array = line.split(_sep)
                  scoreSep[index] = array.length;
              })
          //    var indexOfMaxValue = scoreSep.reduce((iMax, x, i, arr) = > x > arr[iMax] ? i : iMax, 0
          )
              ;
              return separators[indexOfMaxValue];
          }

          accentsTidy = function (s) {
              //  var r=s.toLowerCase();
              var r = s;
              r = r.replace(new RegExp("\\s", 'g'), "");
              r = r.replace(new RegExp("[àáâãäå]", 'g'), "a");
              r = r.replace(new RegExp("æ", 'g'), "ae");
              r = r.replace(new RegExp("ç", 'g'), "c");
              r = r.replace(new RegExp("[èéêë]", 'g'), "e");
              r = r.replace(new RegExp("[ìíîï]", 'g'), "i");
              r = r.replace(new RegExp("ñ", 'g'), "n");
              r = r.replace(new RegExp("[òóôõö]", 'g'), "o");
              r = r.replace(new RegExp("œ", 'g'), "oe");
              r = r.replace(new RegExp("[ùúûü]", 'g'), "u");
              r = r.replace(new RegExp("[ýÿ]", 'g'), "y");
              r = r.replace(new RegExp("\\W", 'g'), "");
              return r;
          };


          sep = getseparator(line);
          if (!sep)
              return callback("no correct separator : ; , or \t")
          header = lineStr.split(sep)
          // normalize columnNames
          header.forEach(function (column, index) {
              column = column.toLowerCase();
              column = column.replace(/[\s-_]+\w/g, function (txt) {
                  return txt.charAt(txt.length - 1).toUpperCase()
              })
              column = accentsTidy(column);
              header[index] = column;
          })


      },*/


    loadLocal: function (file, subGraph, callback) {
        var headers = [];


        processValues = function (header, value) {

            if (false && value.indexOf("\n") > -1) {
                //  value = value.replace(/\n/g, "")
                var array = value.split("\n");
                //value= JSON.stringify(array)
                value = array;
            }
            return value


        }



        const csv = require('csv-parser')
        const fs = require('fs')
        const results = [];
        util.getCsvFileSeparator(file, function(_separator) {
            var count = 0;
            var separator = _separator
            var countLines = 0
            fs.createReadStream(file)
                .pipe(csv(
                    {
                        separator: separator,
                        mapHeaders: ({header, index}) =>
                            util.normalizeHeader(headers, header)
                        ,
                        /*   mapValues: ({header, index, value}) =>
                               processValues(header, value),*/


                    })
                    .on('header',(header)=>{
                      headers.push(header);
                    })

                    .on('data', function (data) {

                        results.push(data)

                    })
                    .on('end', function () {
                        console.log(countLines)
                        var xx = results;
                        var yy = headers;

                        var fileName = file.substring(file.lastIndexOf(path.sep) + 1)
                        var filePath = path.resolve("uploads/" + fileName + ".json");
                        // headers = headers.sort();
                        fs.writeFileSync(filePath, JSON.stringify({headers: headers, data: results}, null, 2));
                        var result = {
                            message: "listCsvFields",
                            remoteJsonPath: filePath,
                            name: fileName,
                            header: headers,
                            subGraph: subGraph
                        };
                        socket.message("file " + fileName + "loaded");
                        callback(null, result);
                    }))
            /*  .on('headers', (headers) => {
                  console.log(`First header: ${headers[0]}`)
              })*/


        })
    }


    ,
    upload: function (req, callback) {
        fileUpload.upload(req, 'csv', function (err, req) {
            if (err) {
                console.log(err);
                return;
            }
            if (req.file && req.file.buffer) {

                var data = "" + req.file.buffer;
                var fileName = req.file.originalname;

                var jsonArray = [];
                var header = []
                var i = 0;
                csv({noheader: false, trim: true, delimiter: "auto"})

                    .fromString(data)
                    .on('json', function (json) {

                        for (var key in json) {
                            if (header.indexOf(key) < 0)
                                header.push(key);


                        }

                        var jsonArrayMultiple = [];
                        // var jsonArrayMultiple = uploadCsvForNeo.splitMultipleValuesInColumns(json, ";");
                        if (true && jsonArrayMultiple.length > 0) {
                            for (var i = 0; i < jsonArrayMultiple.length; i++) {
                                jsonArray.push(jsonArrayMultiple[i]);
                            }
                        }
                        else
                            jsonArray.push(json);

                    })
                    .on('done', function () {
                        var path = "./uploads/" + fileName + ".json";
                        header = header.sort();
                        fs.writeFileSync(path, JSON.stringify(jsonArray));
                        var result = {message: "listCsvFields", remoteJsonPath: path, name: fileName, header: header};
                        socket.message(JSON.stringify(result));
                        callback(null, result);
                    });
            }

        });
    }
    ,
    splitMultipleValuesInColumns: function (json, sep) {
        var multipleKeys = []
        for (var key in json) {
            if (json[key].indexOf(";") > -1)
                multipleKeys.push(key)
        }

        var jsonArray = [json];

        for (var i = 0; i < multipleKeys.length; i++) {
            var jsonMultiple = []
            var key = multipleKeys[i];
            var rowsToRemove = [];
            for (var j = 0; j < jsonArray.length; j++) {
                var json = jsonArray[j];

                if (json[key].indexOf(";") > -1) {

                    var values = json[key].split(sep);
                    for (var k = 0; k < values.length; k++) {

                        var clone = JSON.parse(JSON.stringify(json));
                        clone[key] = values[k];
                        jsonMultiple.push(clone);

                    }
                }
                else {
                    jsonMultiple.push(json);
                }
            }
            jsonArray = JSON.parse(JSON.stringify(jsonMultiple));
        }

        return jsonArray;
    }


}

if (false) {

    uploadCsvForNeo.loadLocal("D:\\keolis\\Dec2018\\fichiersKeolis\\personnesFR.csv", function (err, result) {
        var x = result;
    })

}

module.exports = uploadCsvForNeo;




