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
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;
Util = {

    prepareJsonForsource: function (obj) {
        /*  if (!(typeof obj === "object"))
         obj = JSON.parse(obj);*/

        for (var key in obj) {

            var value = obj[key];
            if (!(typeof value === "object")) {
                if (key == "_id") {
                    /*  if(ObjectID.isValid(value))
                     obj[key] = new ObjectID(id);*/
                    var id = "" + obj[key];
                    if (id.length > 24)
                        id = id.substring(id.length - 24);


                    while (id.length < 24) {
                        id = "F" + id;
                    }
                    console.log(id);
                    obj[key] = new ObjectID.createFromHexString(id);
                    // obj[key] = new ObjectID(id);

                }

                else if (!isNaN(value) && value.indexOf) {
                    if (value.indexOf(".") > -1)
                        value = parseFloat(value)
                    else
                        value = parseInt(value)
                    obj[key] = value;
                }
            }
        }
        return obj;
    }
    ,
    base64_encodeFile: function (file) {
        // read binary data
        var bitmap = fs.readFileSync(file);
        // convert binary data to base64 encoded string
        return new Buffer(bitmap).toString('base64');
    }
    ,
    convertNumStringToNumber: function (value) {
        if (value.match && value.match(/.*[a-zA-Z\/\\$].*/))
            return value;
        if (Util.isInt(value))
            return parseInt(value)
        if (Util.isFloat(value))
            return parseFloat(value)
        if (value == "true")
            return true;
        if (value == "false")
            return false;
        return value;

    },
    isNumber: function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    ,

    isInt: function (value) {
        return /-?[0-9]+/.test("" + value);

    },
    isFloat: function (value) {
        return /-?[0-9]+[.,]+[0-9]?/.test("" + value);

    },

    cleanFieldsForNeo: function (obj) {
        var obj2 = {};
        for (var key in obj) {

            var key2 = key.replace(/-/g, "_");

            key2 = key2.replace(/ /g, "_");
            if (key2 != "") {
                var valueObj = obj[key];
                if (valueObj) {

                    if (isNaN(valueObj) && valueObj.indexOf && valueObj.indexOf("http") == 0) {
                        value = encodeURI(valueObj)
                    } else {
                        var value = "" + valueObj;
                        if (isNaN(valueObj)) {
                            //escape non ascii
                          /*  var str = "";
                            for (var i = 0; i < value.length; i++) {
                                var c = value.charCodeAt(i);
                                var s=value.charAt(i)
                                if (c < 48 || (c > 57 && c < 65) || c > 122) {
                                    str += '\\' + s;
                                }
                                else
                                    str += s;
                            }
                            value=str;*/


                              value = value.replace(/[\n|\r|\t]+/g, " ");
                              value = value.replace(/&/g, " and ");
                              value = value.replace(/"/g, "'");
                              value = value.replace(/,/g, "\\,");
                              value = value.replace(/\[/g, "\\,");
                              // value = value.replace(/\//g, "%2F");
                              value = value.replace(/\\/g, "")
                              //  value = value.replace(/:/g, "")
                        }
                        else if (value.indexOf(".") > -1)
                            value = parseFloat(value)
                        else
                            value = parseInt(value)
                    }

                    obj2[key2] = value;
                }
            }
        }

        return obj2;

    },
    capitalizeFirstLetter: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },


    getCsvFileSeparator: function (file, callback) {
        var readStream = fs.createReadStream(file, {start: 0, end: 5000, encoding: 'utf8'});
        var separator = ",";
        readStream.on('data', function (chunk) {
            var separators = [",", "\t", ";"];
            var p = chunk.indexOf("\n")
            if (p < 0)
                p = chunk.indexOf("\r")
            if (p < 0) {
                readStream.destroy();
                console.log("no line break or return in file")
                return null;
            }
            var firstLine = chunk.substring(0, p)
            for (var k = 0; k < separators.length; k++) {
                if (firstLine.indexOf(separators[k]) > 0)
                    callback(separators[k]);
            }


            readStream.destroy();
        }).on('end', function () {
            var xx = 3
            return;
        })
            .on('close', function () {
                return;
            })
        ;

    },

    normalizeHeader: function (headerArray, s) {
        //   var   r = s.toLowerCase();
        var r = s;
        r = r.replace(/[\(\)'.]/g, "")
        r = r.replace(/[\s-_]+\w/g, function (txt) {
            return txt.charAt(txt.length - 1).toUpperCase()
        });
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
        r = "" + r.charAt(0).toLowerCase() + r.substring(1);
        headerArray.push(r);
        return r;
    }

}
/*var array=[128,1430,8324]
for(var i=0;i<array.length;i++){
    var x=array[i]
    console.log(x+"  "+Math.round(Math.log10(x)));
}*/

module.exports = Util;