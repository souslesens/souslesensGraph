var requests = (function () {
    var self = {};
    var localStorageKey = "SouslesensNeo4jImportParams";
    var allParams;
    var subGraph;
    var source;
    self.init = function (_subGraph, callback) {
        subGraph = _subGraph;
        allParams = localStorage.getItem(localStorageKey)
//console.log(allParams);
        if (!allParams) {
            allParams = {}
            allParams[subGraph] = {requests: {}};
        }
        else {
            try {
                allParams = JSON.parse(allParams);
            }
            catch (e) {
                allParams = {}
                allParams[subGraph] = {requests: {}};
            }
        }
        context.storedRequestsParams = allParams[subGraph];

        return callback()
    }

    self.clearLocalStorage = function () {
        if (confirm("clear all requests for subGraph" + subGraph))
            delete  allParams[subGraph]
        localStorage.setItem(localStorageKey, JSON.stringify(allParams, null, 2));
        self.init(subGraph)
    }


    self.importParams = function () {
        if (!allParams)
            return alert("select a subGraph first")
        var str = $("#savedQueries_importParamsTA").val()
        var data = JSON.parse(str);
        var subGraph = data.subGraph;
        allParams[subGraph] = data;

        localStorage.setItem(localStorageKey, JSON.stringify(allParams, null, 2));
        self.init(subGraph)

    }
    self.export = function (subGraph) {
        if (!allParams)
            self.init();
        allParams[subGraph].subGraph = subGraph;
        //  console.log(JSON.stringify(allParams[subGraph]));
        $("#savedQueries_importParamsTA").val(JSON.stringify(allParams[subGraph], null, 2))
        return allParams[subGraph];

    }


    self.saveCSVsource = function (data) {
        source = data.name;
        if (!allParams[data.subGraph])
            allParams[data.subGraph] = {};
        /*   if (!allParams[data.subGraph][data.name]) {
            allParams[data.subGraph][data.name] = data;
            allParams[data.subGraph][data.name].requests = [];*/
        allParams[data.subGraph][data.name] = data
        localStorage.setItem(localStorageKey, JSON.stringify(allParams, null, 2))
        ui.listCSVsources();

        // }
    }


    self.saveRequest = function (json) {
        var subGraph = $("#subGraphSelect").val();
        var query = "action=saveQuery";
        var sourceDB = $("#dbSelect").val();
        var source = $("#sourceNode").val();
        var sourceField = $("#sourceField").val();
        //var json = $("#exportParams").val();
        var name = "";
        var type = "";
        if (json["relationType"]) {
            json.sourceCollection = json.sourceRel;
            type = "relation";
            name = "Rels_" + $("#subGraphSelect").val() + "." + $("#neoSourceLabel").val()
                + "->" + $("#neoTargetLabel").val() + ":" + json.relationType;
        }
        if (json["label"]) {
            json.sourceCollection = json.sourceNode;
            type = "node";
            name += "Nodes_" + $("#subGraphSelect").val() + "." + $("#label").val() + "_" + sourceField;
        }
        json.source = source;
        if (!allParams[subGraph][source])
            allParams[subGraph][source] = {}
        if (!allParams[subGraph][source].requests)
            allParams[subGraph][source].requests = [];
        if (!allParams[subGraph].requests)
            allParams[subGraph].requests = {};
        allParams[subGraph].requests[name] = json;
        allParams[subGraph][source].requests.push(name);
        localStorage.setItem(localStorageKey, JSON.stringify(allParams, null, 2));
        self.listStoredRequests(subGraph, requestsSelect);
        if (json.label && context.labels.indexOf(json.label) < 0) {
            context.labels.push(json.label);
            common.fillSelectOptionsWithStringArray(neoSourceLabel, context.labels);
            common.fillSelectOptionsWithStringArray(neoTargetLabel, context.labels);

        }
        requests.setSchemaFromRequests();
        return;

    }
    self.listStoredRequests = function (subGraph, updateUI) {
        if (!allParams)
            self.init();
        var requests = []
        if (!allParams[subGraph])
            return;
        for (var key in allParams[subGraph].requests) {
            requests.push({value: key, label: key.replace(subGraph + ".", "")})
        }

        requests.sort(function (a, b) {
            if (a.label > b.label)
                return 1;
            if (a.label < b.label)
                return -1;
            return 0;
        });
        if (updateUI)
            common.fillSelectOptions(requestsSelect, requests, "label", "value", true)

        return requests;
    }

    self.deleteRequest = function () {

        var name = $("#requestsSelect").val()[0];
        if (confirm("delete import query " + name)) {
            console.log(name);
            var request = allParams[subGraph].requests[name];
            var xxx = JSON.stringify(allParams[subGraph][request.source].requests)
            console.log(xxx);
            var index = allParams[subGraph][request.source].requests.indexOf(name);
            if (index > -1) {
                allParams[subGraph][request.source].requests.splice(index, 1)
            }
            delete allParams[subGraph].requests[name];
            localStorage.setItem(localStorageKey, JSON.stringify(allParams, null, 2));
            self.listStoredRequests(subGraph, requestsSelect);

        }
    }


    self.loadRequest = function (name) {
        var request =context.storedRequestsParams.requests[name];
        var header =context.storedRequestsParams[request.source].header;
        var obj = request;

        $("#exportMessageLinks").html("source : " + request.source)
        $("#sourceNode").val(request.source)
        $("#sourceRel").val(request.source)
        ui.initImportDialogSelects({header:header,name:request.source})

        for (var key in obj) {

            $("#" + key).val(obj[key]);
            if (key == "distinctValues" && obj[key] == true) {
                $("#distinctValues").prop('checked', 'checked');
            }

        }

        $("#sourceNode").val(obj.source);
        $("#neoTargetKey").html("").append('<option>' + obj["neoTargetKey"] + '</option>');
        $("#neoSourceKey").html("").append('<option>' + obj["neoSourceKey"] + '</option>');
        var tab;
        if (name.indexOf("Node") > -1)
            tab = 2
        else
            tab = 3
        $("#accordion").accordion("option", "active", tab);


    }
    self.executeRequestsUI = function (type) {
        var selectedRequests = $("#requestsSelect").val();
        self.executeRequests(subGraph, type, selectedRequests);
    }

    self.executeRequests = function (subGraph, type, requestNames) {
        var requestsMap = allParams[subGraph].requests;

        if (requestNames == null) {//all
            requestNames = [];
            for (var key in requests) {
                requestNames.push(key)

            }
        }

        var requestsArray = [];
        requestNames.forEach(function (requestName) {
            if (requestsMap[requestName])
                if (type == "node" && requestName.indexOf("Node") == 0)
                    requestsArray.push(requestsMap[requestName]);
                else if (type == "relation" && requestName.indexOf("Rel") == 0)
                    requestsArray.push(requestsMap[requestName]);


        })
        callExportToNeo(type, requestsArray, function (err, result) {
            loadLabels();
            admin.drawVisjsGraph();
            admin.drawVisjsGraph();
        });


    }


    self.setSchemaFromRequests = function () {


        var schema = {
            defaultNodeNameProperty: "name",
            labels: {},
            properties: {},
            relations: {
                "hasConcept": {
                    "startLabel": "document",
                    "endLabel": "concept",
                    "type": "hasConcept"
                },
            }
        }

        for (var key in allParams[subGraph]) {
            var params = allParams[subGraph]
            if (key != "requests") {
                for (var requestName in params.requests) {
                    var label = params.requests[requestName].label;
                    schema.labels[label] = {
                        "color": "#ccc"
                    }
                    schema.properties[label] = {}
                    params[params.requests[requestName].source].header.forEach(function (colName) {
                        if (colName != "")
                            schema.properties[label][colName] = {"type": "text"}
                    })
                }
            }
            context.schema = schema;
        }

    }


    return self;


})()