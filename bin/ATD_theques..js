var async = require("async");
var elasticProxy = require("./elasticProxy.js")
var mySQLproxy = require("./mySQLproxy..js")


var ATD_theques = {

    indexDescriptions: {
        "phototheque": {
            type: "mySQL",
            schema: "phototheque",
            settings: "ATD",
            connOptions: {host: "localhost", user: "root", password: "vi0lon", database: 'phototheque'},
            sqlQuery: "select * from phototheque",


        },
        "artotheque": {
            type: "mySQL",
            schema: "phototheque",
            settings: "ATD",
            connOptions: {host: "localhost", user: "root", password: "vi0lon", database: 'artotheque'},
            sqlQuery: "select * from artotheque",


        },
        "audiotheque": {
            type: "mySQL",
            schema: "default",
            settings: "ATD",
            connOptions: {host: "localhost", user: "root", password: "vi0lon", database: 'audiotheque'},
            sqlQuery: "select * from audiotheque"
        },
        "videotheque": {
            type: "mySQL",
            schema: "default",
            settings: "ATD",
            connOptions: {host: "localhost", user: "root", password: "vi0lon", database: 'videotheque'},
            sqlQuery: "select * from videotheque"
        },
        "bordereaux": {
            type: "fs",
            settings: "ATD",
          //  dir: "H:\\ATD\\Instruments_de_RECHERCHE",
            dir:"D:\\ATD_Baillet\\versements2018",
            schema: "officeDocument"
        },
        "ocr": {
            type: "fs",
            settings: "ATD",
            dir: "H:\\ATD\\ATD_QUART_MONDE_Cde2017_2128_Cde01_BP10_PDF",
            schema: "officeDocument",

        },
        "testatd": {
            type: "fs",
            settings: "ATD",
            dir: "C:\\Users\\claud\\Downloads\\test",
            schema: "officeDocument",

        }


    },

    indexTheques: function (indexes) {

        async.eachSeries(indexes, function (index, callbackEachIndex) {
                console.log("processing " + index)
                var schema = elasticProxy.getIndexMappings(index);

                var description = ATD_theques.indexDescriptions[index];


                elasticProxy.initIndex(index, description.settings, function (err, result) {
                        if (err) {
                            console.log(err);
                            return callbackEachIndex(err);
                        }


                        var callbackAfterIndexation = function (err, result) {
                            if (err)
                                console.log(err);
                            console.log("done");
                            callbackEachIndex()
                        }

                        if (description.type == "mySQL") {
                            elasticProxy.indexSqlTable(description.connOptions, description.sqlQuery, index, index, callbackAfterIndexation);
                        }
                        else if (description.type == "mongoDB") {

                        }
                        else if (description.type == "webPage") {

                        }
                        else if (description.type == "fs") {
                            elasticProxy.indexDocDirInNewIndex(index, "officeDocument", description.dir, false, "ATD", callbackAfterIndexation)


                        }

                    }
                )

            },
            function (err) {
                if (err)
                    console.log(err);
                console.log("all done !!!!");

            })
    }


}

module.exports = ATD_theques


//ATD_theques.indexTheques(["bordereaux"]);


const args = process.argv;
console.log(args.length)
if (args.length > 2) {

    if (args[2] == "indexTheques") {
        console.log(2);
        var str = args[3];
        var theques = str.split(",");

        ATD_theques.indexTheques(theques);

    }
    ;


} else {
    console.log("Usage : node ATD_theques indexTheques  index1,index2...");
}

