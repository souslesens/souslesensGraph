var requests = (function () {
    var self = {};
    var localStorageKey = "SouslesensNeo4jImportParams";
    var allParams;
    var subGraph;
    var source;
    self.init = function (_subGraph) {
        subGraph = _subGraph;
        allParams = localStorage.getItem(localStorageKey)

        if (!allParams) {
            allParams = {}
            allParams[subGraph] = {};
        }
        else {
            try {
                allParams = JSON.parse(allParams);
            }
            catch (e) {
                allParams = {}
                allParams[subGraph] = {};
            }
        }
        self.loadSubGraphCSVsources()

    }


    self.loadSubGraphCSVsources = function () {
        var files = [];

        for (var key in allParams[subGraph]) {
            files.push(key)
        }
        common.fillSelectOptionsWithStringArray(localCSVSelect, files, true)
    }


    self.loadFields = function (_source) {
        source = _source;
        setCsvImportFields(allParams[subGraph][source])

    }


    self.saveCSVsource = function (data) {
        source = data.name;
        if (!allParams[data.subGraph])
            allParams[data.subGraph] = {};
        if (!allParams[data.subGraph][data.name]) {
            allParams[data.subGraph][data.name] = data;
            allParams[data.subGraph][data.name].requests = {};
            localStorage.setItem(localStorageKey, JSON.stringify(allParams, null, 2))
            self.loadSubGraphCSVsources();

        }
    }


    self.saveImportParams = function (json) {
        var subGraph = $("#subGraphSelect").val();
        var query = "action=saveQuery";
        var sourceDB = $("#dbSelect").val();
        var sourceField = $("#sourceField").val();
        //var json = $("#exportParams").val();
        var name = "";
        var type = "";
        if (json["relationType"]) {
            json.sourceCollection = json.sourceCollectionRel;
            type = "relation";
            name = "Rels_" + $("#subGraphSelect").val() + "." + $("#neoSourceLabel").val()
                + "->" + $("#neoTargetLabel").val() + ":" + jsonObj.relationType;
        }
        if (json["label"]) {
            json.sourceCollection = json.sourceCollectionNode;
            type = "node";
            name += "Nodes_" + $("#subGraphSelect").val() + "." + $("#label").val() + "_" + sourceField;
        }

        if (!allParams[subGraph][source].requests)
            allParams[subGraph][source].requests = {};
        allParams[subGraph][source].requests[name] = json;
        localStorage.setItem(localStorageKey, JSON.stringify(allParams, null, 2));

        return;
        data = {
            sourceDB: sourceDB,
            type: type,
            request: json,
            name: name,
            date: new Date()
        }
        var query = {name: name};

        if (sourceDB.indexOf(".csv") > -1) {
            var requestsObj = {}
            if (currentRequests) {
                for (var i = 0; i < currentRequests.length; i++) {
                    requestsObj[currentRequests[i].name] = currentRequests[i];
                }

            }
            else {
                currentRequests = [];
            }

            currentRequests.push(data)

            requestsObj[name] = data;
            var path = "./uploads/requests_" + $("#collSelect").val() + ".json";
            var paramsObj = {


                path: path,
                store: true,
                data: requestsObj
            }
            $.ajax({
                type: "POST",
                url: "../../.." + serverRootUrl + "/jsonFileStorage",
                data: paramsObj,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    common.setMessage(data.result, "green");
                    try {
                        // loadRequests();
                    }
                    catch (e) {
                        console("!!!loadRequests!!!" + e);
                    }
                    return;
                },

                error: function (xhr, err, msg) {
                    common.setMessage(err, "red");
                    console.log(xhr);
                    console.log(err);
                    console.log(msg);
                },

            });


        } else {
            callsource("", {
                updateOrCreate: 1,
                dbName: sourceDB,
                collectionName: "requests",
                query: query,
                data: data
            }, function (result) {

                loadRequests()
            });

        }
    }

    self.loadRequests = function () {
        var dbName = $("#dbSelect").val();
        var subGraph = $("#subGraphSelect").val();

        if ($("#importSourceType").val().indexOf("CSV") > -1) {
            var path = "./uploads/requests_" + $("#collSelect").val() + ".json";
            var paramsObj = {
                path: path,
                retrieve: true,

            }
            $.ajax({
                type: "POST",
                url: "../../.." + serverRootUrl + "/jsonFileStorage",
                data: paramsObj,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    if (!data)
                        return;
                    //   var currentRequestsObj = data;
                    //  var requestsArray = [];
                    currentRequests = [];
                    for (var key in data) {
                        if (typeof data[key].request == "string")
                            data[key].request = JSON.parse(data[key].request);
                        currentRequests.push(data[key]);


                    }

                    /*  for (var key in currentRequestsObj) {

                     var obj = currentRequestsObj[key];
                     if(typeof obj.request=="string")
                     obj.request=JSON.parse( obj.request);
                     currentRequests.push(obj);
                     }*/
                    common.fillSelectOptions(requests, currentRequests, "name", "name");
                    // setRequestSubGraphFilterOptions();
                },

                error: function (xhr, err, msg) {
                    console.log(xhr);
                    console.log(err);
                    console.log(msg);
                },

            });
        }
        else {
            callsource("", {
                find: 1,
                dbName: dbName,
                collectionName: "requests",
                sourceQuery: "{}"
            }, function (data) {


                data.sort(function (a, b) {
                    if (a.name > b.name)
                        return 1;
                    if (a.name < b.name)
                        return -1;
                    return 0;
                });

                currentRequests = data;
                for (var i = 0; i < currentRequests.length; i++) {
                    if (currentRequests[i].request) {
                        currentRequests[i].request = JSON.parse(currentRequests[i].request);
                        if (currentRequests[i].sourceIdField)//patch
                            currentRequests[i].sourceKey = currentRequests.sourceIdField
                    }
                }

                common.common.fillSelectOptions(requests, currentRequests, "name", "name");
                setRequestSubGraphFilterOptions();


            });
        }


    }


    return self;


})()