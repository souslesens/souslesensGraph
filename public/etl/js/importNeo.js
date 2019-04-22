var importNeo=(function(){

    var self={};



    self.validatesourceQuery=function(sourceQuery) {
        if (!sourceQuery || sourceQuery.length == 0) {
            sourceQuery = "{}";
            return sourceQuery;
        }
        else {
            try {

                sourceQuery = eval('(' + sourceQuery + ')');
                //  sourceQuery = JSON.stringify(sourceQuery);
                return JSON.stringify(sourceQuery);
            }
            catch (e) {
                $("#messageDiv").html("indalid json for field sourceQuery");
                return null;
            }
        }
    }
self.exportNeoNodes=    function (execute, save) {
        importType = "NODE";
        var sourceDB = $("#dbSelect").val();
        var sourceNode = $("#sourceNode").val();
        var exportedFields = $("#exportedFields").val();
        if (exportedFields == "")
            exportedFields = "none";
        var sourceField = $("#sourceField").val();
        var sourceKey = $("#sourceKey").val();
        var label = $("#label").val();
        var sourceQuery = $("#sourceQuery").val();
        var subGraph = $("#subGraphSelect").val();
        var distinctValues = $("#distinctValues").prop('checked');
        // var sourceIdField = $("#sourceIdField").val();
        var sourceIdField = sourceField;// change : more simple !!

        sourceQuery = self.validatesourceQuery(sourceQuery);
        if (!sourceQuery)
            return;

        var query = "action=exportsource2NeoNodes";

        var data = {
            source: sourceNode,
            exportedFields: exportedFields,
            sourceField: sourceField,
            sourceKey: sourceKey,
            distinctValues: distinctValues,
            sourceIdField: sourceIdField,
            label: label,
            sourceQuery: sourceQuery,
            subGraph: subGraph
        };

        var message = "";
        for (var key in data) {
            if (!data[key] || data[key] == "") {
                if (key != "exportedFields" && key != "distinctValues")
                    message += "<br>" + key + " cannot be empty";
            }

        }
        $("#exportMessageNodes").html(message);
        if (message.length > 0)
            return;

        $("#exportParams").val(JSON.stringify(data).replace(/,/, ",\n"));
        if (save)
            requests.saveRequest(data);
        // saveRequest(JSON.stringify(data).replace(/,/, ",\n"));
        if (execute) {
            $("#exportResultDiv").html("");
            self.callExportToNeo("node", data, function (err, result) {
                if (err)
                    $("#importJournalTA").val(err)
                $("#importJournalTA").val(result)
            });

        }


    }



   self.exportNeoLinks=    function (execute, save) {
        importType = "LINK";
        var sourceDB = $("#dbSelect").val();
        var sourceRel = $("#sourceRel").val();
        var sourceSourceField = $("#sourceSourceField").val();
        var neoSourceLabel = $("#neoSourceLabel").val();
        var neoSourceKey = $("#neoSourceKey").val();
        var sourceTargetField = $("#sourceTargetField").val();
        var neoTargetLabel = $("#neoTargetLabel").val();
        var neoTargetKey = $("#neoTargetKey").val();
        var relationType = $("#relationType").val();
        var neoRelAttributeField = $("#neoRelAttributeField").val();
        var sourceQueryR = $("#sourceQueryR").val();
        var subGraph = $("#subGraphSelect").val();

        sourceQueryR = self.validatesourceQuery(sourceQueryR);

        var data = {
            sourceDB: sourceDB,
            source: sourceRel,
            sourceSourceField: sourceSourceField,
            neoSourceKey: neoSourceKey,
            neoSourceLabel: neoSourceLabel,
            sourceTargetField: sourceTargetField,
            neoTargetLabel: neoTargetLabel,
            neoTargetKey: neoTargetKey,
            relationType: relationType,
            neoRelAttributeField: neoRelAttributeField,
            sourceQueryR: sourceQueryR,
            subGraph: subGraph
        };
        var message = "";
        for (var key in data) {
            if (key.indexOf("sourceQuery") == 0 & data[key] == "")
                data[key] = "{}";

            if (!data[key] || data[key] == "") {
                if (key != "neoRelAttributeField")
                    message += "<br>" + key + " cannot be empty";
            }

        }
        $("#exportMessageLinks").html(message);
        if (message.length > 0)
            return;

        $("#exportParams").val(JSON.stringify(data).replace(/,/, ",\n"));

        if (save)
            requests.saveRequest(data);
        if (execute) {
            $("#exportResultDiv").html("");
            self.callExportToNeo("relation", data, function (err, result) {
                if (err)
                    $("#importJournalTA").val(err)
                $("#importJournalTA").val(result)


            });

        }


    }

    self.clearImportFields  =  function () {
        $("#messageDiv").html("");

        $("#exportedFields").val("none");
        $("#sourceField").val("");
        $("#sourceKey").val("");
        $("#label").val("");
        $("#sourceQuery").val("");
        $("#distinctValues").prop("checked", "checked");


        $("#sourceSourceField").val("");
        $("#neoSourceLabel").val("");
        $("#neoSourceKey").val("");
        $("#sourceTargetField").val("");
        $("#neoTargetLabel").val("");
        $("#neoTargetKey").val("");
        $("#relationType").val("");
        $("#neoRelAttributeField").val("");
        $("#sourceQueryR").val("");

    }

   self.callExportToNeo=function(type, data, callback) {
        $("#messageDiv").val("Processing Import ...");
        $("#waitImg").css("visibility", "visible");
        var subGraph = $("#subGraphSelect").val();
        var db = $("#dbSelect").val();
        var importSourceType = $("#importSourceType").val();
        if (!subGraph || subGraph.length == 0)
            subGraph = prompt("pas de subGraph selectionné , en céer un ? (necesaaire à l'export)");
        else if (!confirm("Export data to subGraph " + subGraph))
            return;
        if (!subGraph || subGraph.length == 0)
            return;
        var payload = {
            type: type,
            sourceType: importSourceType,
            subGraph: subGraph,
            data: JSON.stringify(data),
            dbName: db
        };
        $.ajax({
            type: "POST",
            url: "../../.." + Gparams.importDataIntoNeo4j,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var xx = data;
                $("#messageDiv").html(data.result);
                $("#messageDiv").css("color", "green");
                $("#waitImg").css("visibility", "hidden");
                if (callback)
                    callback(null, data);
            },
            error: function (xhr, err, msg) {

                $("#waitImg").css("visibility", "hidden");
                console.log(xhr);
                console.log(err);
                console.log(msg);
                if (err.result) {
                    $("#messageDiv").html(err.result);
                    $("#messageDiv").css("color", "red");

                }
                else {
                    $("#messageDiv").html(err);

                }
                if (callback)
                    callback(err, data);
            }
        });

    }




    return self;


})()