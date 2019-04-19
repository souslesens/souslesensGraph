var admin = (function () {

    var self = {};
    self.labels = [];
    self.serverUrl = "../../../"


    self.loadLocalCSV = function () {
        var subGraph=$("#subGraphSelect").val();
        if (!subGraph || subGraph == "")
            return alert(" select or create a subGraph first")
        var localCSVpath = $("#localCSVpath").val();
        if (!localCSVpath || localCSVpath == "")
            return alert("Enter local CSV file path")

        var payload = {filePath: localCSVpath,subGraph:subGraph}
        $.ajax({
            type: "POST",
            url: self.serverUrl + "loadLocalCsvForNeo",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                setCsvImportFields(data);
               // loadRequests();
                $("#message").css("color", "green");
                $("#message").html("file loaded " + data.name);
                requests.saveCSVsource(data);
                requests.list(subGraph,requestsSelect);
                requests.loadSubGraphCSVsources()
            },
            error: function (xhr, err, msg) {
                $("#message").css("color", "red");
                $("#message").html(err);
                console.log(xhr);
                console.log(err);
                console.log(msg);
            }
        });


    }


    self.drawVisjsGraph = function () {

        subGraph = $("#subGraphSelect").val();
        if (subGraph == "") {
            return alert("select a Neo4j subGraph first")
        }
        Schema.createSchema(subGraph,function (err, result) {
            Schema.save(subGraph);
            self.labels = Schema.getAllLabelNames().sort();
            self.labels.splice(0, 0, "");
            common.fillSelectOptionsWithStringArray(neoSourceLabel, self.labels);
            common.fillSelectOptionsWithStringArray(neoTargetLabel, self.labels);

            dataModel.getDBstats(subGraph, function (err, result) {
                var data = connectors.toutlesensSchemaToVisjs(Schema.schema);

              //  visjsGraph.draw("graphDiv", data, {scale: 2});
            });


        });
    }


    self.onPageLoaded = function () {
        messageDivId = message;
        $("#importNodesDiv").load("htmlSnippets/importNodesDialog.html", function () {

        })
        $("#importRelationsDiv").load("htmlSnippets/importRelationsDialog.html", function () {

        })

        $("#savedQueriesDiv").load("htmlSnippets/savedQueriesDialog.html", function () {

        })

        $("#neoDbDiv").load("htmlSnippets/neoDbDialog.html", function () {
            loadSubgraphs();
        })

        $("#importGraphDbDiv").load("htmlSnippets/importGraphDbDialog.html", function () {

        })
        $("#exportGraphDbDiv").load("htmlSnippets/exportGraphDbDialog.html", function () {
            loadSubgraphs();
        })

        $("#adminDiv").load("htmlSnippets/adminDialog.html", function () {

        })


    }

    self.initImportDialogSelects = function (_columnNames) {
       var columnNames=[];
        _columnNames.forEach(function(column){
            if(column!="")
                columnNames.push(column)
            })


        columnNames.splice(0, 0, "");
        common.fillSelectOptionsWithStringArray(sourceKey, columnNames);
        common.fillSelectOptionsWithStringArray(sourceField, columnNames);

        common.fillSelectOptionsWithStringArray(sourceSourceField, columnNames);
        common.fillSelectOptionsWithStringArray(sourceTargetField, columnNames);

        common.fillSelectOptionsWithStringArray(neoSourceLabel, self.labels);
        common.fillSelectOptionsWithStringArray(neoTargetLabel, self.labels);

        //  common.fillSelectOptionsWithStringArray(sourceKey,columnNames);

    }

    self.dispatchAction = function (action) {
        if (action == "linkSource") {
            $("#neoSourceLabel").val(currentObject.label)
        }
        if (action == "linkTarget") {
            $("#neoTargetLabel").val(currentObject.label)
        }

        $("#popupMenu").css("visibility", "hidden")
    }


    self.showPopupMenu = function (x, y) {
        var graphDivPosition = {
            x: $("#graphDiv").css('left'),
            y: $("#graphDiv").css('top'),

        }
        $("nodeInfos").html(JSON.stringify(currentObject.neoAttrs))
        $("#popupMenu").css("visibility", "visible").css("top", y + 10).css("left", x)

    }

    self.setNeoKey = function (select, targetSelect, columnSelect) {

        var label = $(select).val();
        var column = $(columnSelect).val();


        var properties = [];
        for (var prop in Schema.schema.properties[label]) {
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