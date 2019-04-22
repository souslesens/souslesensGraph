var ui = (function () {
    var self = {}
    self.onSubGraphSelect = function (subGraphName, showGraph) {

        if (subGraphName == "")
            return;
        context.subGraph = subGraphName;


        //initialize requests of subgraph stored in localstorage
        requests.init(subGraphName, function (err, result) {
            requests.setSchemaFromRequests();
            self.listCSVsources();
           var requestObjects= requests.listStoredRequests(subGraphName,true);
            self.initImportDialogSelects(context.storedRequestsParams);


        });


        var labels = [];
        for (var key in context.schema.labels) {
            labels.push(key);
        }
        labels.splice(0, 0, "");
        common.fillSelectOptionsWithStringArray(labelsSelect, labels)
        context.labels = labels;


        if (showGraph) {
            graph.drawVisjsGraph()
            //   drawNeoModel(subGraph);
            $("#tabs-center").tabs({
                active: 3
            });
        }

    }
    self.loadSubgraphs = function (defaultSubGraph) {
        var match = "Match (n)  return distinct n.subGraph as subGraph";
        Cypher.executeCypher(match,function (err,data) {
            if (data && data.length > 0) {// } && results[0].data.length >
                var subgraphs = []
                for (var i = 0; i < data.length; i++) {
                    var value = data[i].subGraph;
                    subgraphs.push(value);
                }
                subgraphs.splice(0, 0, "");

                common.fillSelectOptionsWithStringArray(subGraphSelect, subgraphs);
                if (subGraphSelect)
                    common.fillSelectOptionsWithStringArray(subGraphExportSelect, subgraphs)
            }
        });


    };

    self.addSubGraph = function () {
        var newSubGraph = prompt("New Subgraph name ");
        if (!newSubGraph || newSubGraph.length == 0)
            return;

        $("#subGraphSelect").append($('<option>', {
            text: newSubGraph,
            value: newSubGraph
        }));

        $("#subGraphSelect").val(newSubGraph);
        requests.init(newSubGraph);
    }

    self.listCSVsources = function () {
        var files = [];

        for (var key in context.storedRequestsParams) {
            files.push(key)
        }
        common.fillSelectOptionsWithStringArray(localCSVSelect, files, true)
    }


    self.initImportDialogSelects = function (json) {
        currentCsvObject = json;
        if (!json.header)
            return;
        json.header.splice(0, 0, "")
        common.fillSelectOptionsWithStringArray(fieldSelect, json.header);
        common.fillSelectOptionsWithStringArray(sourceKey, json.header);
        common.fillSelectOptionsWithStringArray(sourceField, json.header);
        common.fillSelectOptionsWithStringArray(sourceSourceField, json.header);
        common.fillSelectOptionsWithStringArray(sourceTargetField, json.header);

        common.fillSelectOptionsWithStringArray(neoSourceLabel, context.labels);
        common.fillSelectOptionsWithStringArray(neoTargetLabel, context.labels);


        common.fillSelectOptionsWithStringArray(collSelect, [json.name]);
        $("#collSelect").val(json.name);
        $("#sourceRel").val(json.name);
        $("#sourceNode").val(json.name);
        common.fillSelectOptionsWithStringArray(dbSelect, [json.name]);

        try {
            loadRequests();
        }
        catch (e) {

        }


    }


    self.setImportSourceType=function() {


        var type = $("#importSourceType").val();
        $(".dataSourceDiv").css("display", "none");
        if (type == "uploadCSV") {
            $("#uploadCSVdiv").css("display", "inline");
            $("#importCSVdiv").css("visibility", "visible");
            $("#importsourceDiv").css("visibility", "hidden");
            $(".dbInfos").css("visibility", "visible");

        } else if (type == "localCSV") {

            $("#localCSVdiv").css("display", "inline");
            $("#importCSVdiv").css("visibility", "hidden");
            $("#importsourceDiv").css("visibility", "visible");
            $(".dbInfos").css("visibility", "visible");


        } else if (type == "localXLSX") {

            $("#localXLSXdiv").css("display", "inline");
            $("#importCSVdiv").css("visibility", "hidden");
            $("#importsourceDiv").css("visibility", "visible");
            $(".dbInfos").css("visibility", "visible");


        } else if (type == "sourceDB") {
            initDBs();
            $('#dbSelect').empty();
            $('#collSelect').empty();
            $('#fieldSelect').empty();
            $("#sourceSourceDiv").css("display", "inline");
            $("#importCSVdiv").css("visibility", "hidden");
            $("#importsourceDiv").css("visibility", "visible");
            $(".dbInfos").css("visibility", "visible");

        }

    }
    self.loadLocalCSV = function () {
        var subGraph = $("#subGraphSelect").val();
        if (!subGraph || subGraph == "")
            return alert(" select or create a subGraph first")
        var localCSVpath = $("#localCSVpath").val();
        if (!localCSVpath || localCSVpath == "")
            return alert("Enter local CSV file path")

        var payload = {filePath: localCSVpath, subGraph: subGraph}
        $.ajax({
            type: "POST",
            url: context.serverUrl + "loadLocalCsvForNeo",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                ui.initImportDialogSelects(data);
                // loadRequests();
                $("#messageDiv").css("color", "green");
                $("#messageDiv").html("file loaded " + data.name);
                requests.saveCSVsource(data);
                var requestObjects= requests.listStoredRequests(subGraphName,true);
                requests.listCSVsources()
            },
            error: function (xhr, err, msg) {
                $("#messageDiv").css("color", "red");
                $("#messageDiv").html(err);
                console.log(xhr);
                console.log(err);
                console.log(msg);
            }
        });


    }

    self.loadLocalXLSXsheetNames = function () {
        var subGraph = $("#subGraphSelect").val();
        if (!subGraph || subGraph == "")
            return alert(" select or create a subGraph first")
        var localXLSXpath = $("#localXLSXpath").val();
        if (!localXLSXpath || localXLSXpath == "")
            return alert("Enter local CSV file path")

        var payload = {
            filePath: localXLSXpath,
            listSheets: 1
        }
        $.ajax({
            type: "POST",
            url: context.serverUrl + "loadLocalXLSXforNeo",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                common.fillSelectOptionsWithStringArray(localXLSXsheetSelect, data.sheetNames);
                requests.init(subGraph,function(err, result){
                    if(err)
                        return $("#message").html(err)
                    requests.listStoredRequests(subGraph, true);
                });


                // requests.listCSVsources()
            },
            error: function (xhr, err, msg) {
                $("#messageDiv").css("color", "red");
                $("#messageDiv").html(err);
                console.log(xhr);
                console.log(err);
                console.log(msg);
            }
        });


    }
    self.loadXLSsheetFields = function (sheetName) {
        var subGraph = $("#subGraphSelect").val();
        $("#sourceNode").val(sheetName);
        if (!subGraph || subGraph == "")
            return alert(" select or create a subGraph first")
        var localXLSXpath = $("#localXLSXpath").val();
        if (!localXLSXpath || localXLSXpath == "")
            return alert("Enter local CSV file path")

        var payload = {
            filePath: localXLSXpath,
            sheetName: sheetName,
            listSheetColumns: 1
        }
        $.ajax({
            type: "POST",
            url: context.serverUrl + "loadLocalXLSXforNeo",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var header = data.sheetColNames;

                var obj={
                    header:header,
                    name:sheetName,
                    subGraph:subGraph
                }
                ui.initImportDialogSelects(obj)
                requests.saveCSVsource(obj);
               requests.listStoredRequests(subGraph, requestsSelect);
                ui.listCSVsources()
                // loadRequests();

            },
            error: function (xhr, err, msg) {
                $("#messageDiv").css("color", "red");
                $("#messageDiv").html(err);
                console.log(xhr);
                console.log(err);
                console.log(msg);
            }
        });


    }

    self.setNeoKey = function (select, targetSelect, columnSelect) {

        var label = $(select).val();
        var column = $(columnSelect).val();


        var properties = [];
        for (var prop in context.schema.properties[label]) {
            properties.push(prop);
        }
        properties.splice(0, 0, "");
        common.fillSelectOptionsWithStringArray(targetSelect, properties);
        if (!column || column == "") {
            return;
        }
        else if (properties.indexOf(column) < 0) {
            ;// alert ("choose the property corresponding to the column 'id' ")
        } else {
            $(targetSelect).val(column);
        }


    }

    return self;
})()