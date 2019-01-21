var requests = (function () {
    var self = {};
    var localStorageKey = "SouslesensNeo4jImportParams";
    var allParams;
    var subGraph;
    var source;
    self.init = function (_subGraph) {
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
        self.loadSubGraphCSVsources()
        self.list(subGraph, requestsSelect);
      //  $("#importSourceType").val("localCSV");
        if(allParams[subGraph])
        setCsvImportFields(allParams[subGraph]);
    }

    self.clearLocalStorage = function () {
        if (confirm("clear all requests for subGraph" + subGraph))
            delete  allParams[subGraph]
        localStorage.setItem(localStorageKey,  JSON.stringify(allParams, null, 2));
        self.init(subGraph)
    }


    self.importParams=function(){
        if(!allParams)
            return alert("select a subGraph first")
        var str=$("#savedQueries_importParamsTA").val()
        var data=JSON.parse(str);
        var subGraph=data.subGraph;
        allParams[subGraph]=data;

        localStorage.setItem(localStorageKey,  JSON.stringify(allParams, null, 2));
        self.init(subGraph)

    }
    self.export = function (subGraph) {
        if (!allParams)
            self.init();
        allParams[subGraph].subGraph=subGraph;
      //  console.log(JSON.stringify(allParams[subGraph]));
        $("#savedQueries_importParamsTA").val(JSON.stringify(allParams[subGraph]))
        return allParams[subGraph];

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
        /*   if (!allParams[data.subGraph][data.name]) {
            allParams[data.subGraph][data.name] = data;
            allParams[data.subGraph][data.name].requests = [];*/
        allParams[data.subGraph][data.name]=data
            localStorage.setItem(localStorageKey, JSON.stringify(allParams, null, 2))
            self.loadSubGraphCSVsources();

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
        if (!allParams[subGraph][source].requests)
            allParams[subGraph][source].requests = [];
        if (!allParams[subGraph].requests)
            allParams[subGraph].requests = {};
        allParams[subGraph].requests[name] = json;
        allParams[subGraph][source].requests.push(name);
        localStorage.setItem(localStorageKey, JSON.stringify(allParams, null, 2));
        self.list(subGraph, requestsSelect);
        return;

    }
    self.list = function (subGraph, select) {
        if (!allParams)
            self.init();
        var requests = []
        if(!allParams[subGraph])
            return;
        for (var key in allParams[subGraph].requests) {
            requests.push({value:key, label:key.replace(subGraph+".","")})
        }

        requests.sort(function(a,b){
            if(a.label>b.label)
                return 1;
            if(a.label<b.label)
                return -1;
            return 0;
        });
        if (select)
            common.fillSelectOptions(select, requests,"label","value", true)
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
            self.list (subGraph, requestsSelect) ;

        }
    }






    self.loadRequest = function (name) {
        var request = allParams[subGraph].requests[name];
        var header = allParams[subGraph][request.source].header;
        var obj = request;

        $("#exportMessageLinks").html("source : "+request.source)
        $("#sourceNode").val(request.source)
        $("#sourceRel").val(request.source)
        admin.initImportDialogSelects(header)

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
        if(name.indexOf("Node")>-1)
            tab=2
        else
            tab=3
       importNeoAccordion.accordion("option", "active", tab);


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
        });


    }


    return self;


})()