var specialQueries=(function(){
  var self={};

    self.searchSimilars = function (node, similarityTypes) {
        $("#similarsDialogSimilarsDiv").html("");
        var messageDivId = $("#similarsDialogMessageDiv");
        messageDivId.html("");
        if (!node)
            return messageDivId.html("no node selected");
        var label = node.label;
        if (node.labelNeo)
            label = node.labelNeo

        var statement = "match(n:" + label + ")-->(p)<--(m:" + label + ")";
        //  var statement = "match(n:" + label + ")-->(r)<--(m)";
        statement += " where id(n)=" + node.id + " ";

        if (similarityTypes && similarityTypes.length > 0) {
            var where2 = " and labels(p) in ["
            for (var i = 0; i < similarityTypes.length; i++) {
                if (i > 0)
                    where2 += ","
                where2 += '"' + similarityTypes[i] + '"';
            }
            where2 += "] "
            statement += where2;
        }

        statement += " return n as sourceNode,m as similarNode, collect(labels(p)[0]) as similarLabels,collect(p) as commonNodes, count(*) as count order by count desc";
        console.log(statement);
        var payload = {match: statement};


        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                savedQueries.addToCurrentSearchRun(statement);


                if (data.length == 0) {
                    $("#similarsDialogSimilarsDiv").html("no similarities found");
                    return;//messageDivId.html("nos similarities found");
                }
                self.self.similarOptions.similarLabels = []
                self.self.similarOptions.similarNodes = [node.id]
                toutlesensData.cachedResultArray = data;
                var str = "<ul>";
                var max = data[0].count;
                for (var i = 0; i < data.length; i++) {


                    var line = data[i]
                    if (line.count == max) {
                        var str2 = "<ul>";
                        if (self.self.similarOptions.similarNodes.indexOf(line.similarNode._id) < 0)
                            self.self.similarOptions.similarNodes.push(line.similarNode._id)
                        for (var j = 0; j < line.commonNodes.length; j++) {

                            if (self.self.similarOptions.similarLabels.indexOf(line.similarLabels[j]) < 0) {
                                self.self.similarOptions.similarLabels.push(line.similarLabels[j]);
                            }
                            var linkstr2 = "javascript:toutlesensController.generateGraph(" + line.commonNodes[j]._id + ")";
                            str2 += "<li>[" + line.similarLabels[j] + "]<a href='" + linkstr2 + "'>" + line.commonNodes[j].properties[Schema.getNameProperty()] + "</a> </li> "
                        }
                        str2 += "</ul>";
                        var linkstr = "javascript:toutlesensController.generateGraph(" + line.similarNode._id + ")";
                        str += "<li><a href='" + linkstr + "'>" + line.similarNode.properties[Schema.getNameProperty()] + " </a>: " + str2 + "</li>";
                    }
                }
                str += "</ul>"
                var str2 = data[0].sourceNode.properties[Schema.getNameProperty()] + " :<b>Most similar nodes</b><button onclick='advancedSearch.similarsDialogShowRefineDialog()'>Refine</button>";
                str2 += "&nbsp;<button onclick='advancedSearch.similarsGraphSimilars()'>Graph</button>"
                str2 += "<br>" + str
                $("#similarsDialogSimilarsDiv").html(str2);
            },
            error: function (err) {

                console.log(err.responseText)
            }
        })


    }

    self.similarsDialogShowRefineDialog = function () {
        $("#similarsDialogSimilarsDiv").html("");
        var labelsCxbs = "Select aspects of the similarities<ul>"
        for (var i = 0; i < self.self.similarOptions.similarLabels.length; i++) {
            var label2 = self.self.similarOptions.similarLabels[i];
            labelsCxbs += "<li><input type='checkbox' checked='checked' name='advancedSearchDialog_LabelsCbx' value='" + label2 + "'>" + label2 + "</li>"
        }
        labelsCxbs += "<ul>";

        var str = labelsCxbs + "<br><button onclick='advancedSearch.similarsDialogExecRefine()'>refine</button>";
        $("#dialog").html(str);
        $("#dialog").dialog({modal: false});
        $("#dialog").dialog("option", "title", "Refine similar");
        $("#dialog").dialog("open");

    }
    self.similarsDialogExecRefine = function () {
        var similarityTypes = [];
        $('.advancedSearchDialog_LabelsCbx:checked').each(function () {
            similarityTypes.push($(this).val());
        });
        self.searchSimilars(self.similarOptions, similarityTypes);
    }


    self.similarsGraphSimilars = function () {
        self.similarOptions.id = null;
        toutlesensData.setWhereFilterWithArray("_id", self.self.similarOptions.similarNodes, function (err, result) {

            toutlesensController.generateGraph(null, null, function (err, result) {
                var selectedNodes = []
                for (var i = 0; i < self.self.similarOptions.similarNodes.length; i++) {
                    selectedNodes.push({id: self.self.similarOptions.similarNodes[i], shape: "star", size: 50, color: "red"})
                }
                visjsGraph.nodes.update(selectedNodes)
                //  visjsGraph.paintNodes(self.self.similarOptions.similarNodes, null, null, null, "star")
            })
        })


    }


    self.searchLabelsPivots = function (sourceLabel, pivotLabel, sourceNodeId, pivotNumber, messageDivId) {

        var scope = $("#pivotsDialogScopeSelect").val();
        if (!sourceLabel) {
            return $(messageDivId).html("require source label");

        }
        var whereStatement = "";


        var inverseRel = false;
        var pivotLabelStr = "";
        if (pivotLabel && pivotLabel != "") {
            if (pivotLabel.indexOf("-") == 0) {
                inverseRel = true;
                pivotLabel = pivotLabel.substring(1);
            }

            pivotLabelStr = ":" + pivotLabel;

        }

        var strWhere = "";
        var limit = pivotNumber;
        if (sourceNodeId)
            strWhere = ' where id(n)=' + sourceNodeId + ' ';
        else if (scope == "currentGraph" && toutlesensData.currentStatement != null)
            strWhere = toutlesensData.getCurrentWhereClause()
        else if (subGraph) {
            if (strWhere == "")
                strWhere = ' where n.subGraph="' + subGraph + '" ';
            else
                strWhere += ' and n.subGraph="' + subGraph + '" ';
        }
        var statement = "Match path=((n:" + sourceLabel + ")-[r]-(p" + pivotLabelStr + ")--(m:" + sourceLabel + ")) " + strWhere + " RETURN distinct p, count(p) as countR order by countR desc limit " + limit;
        console.log(statement);
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: {match: statement},
            dataType: "json",
            success: function (pivotIds, textStatus, jqXHR) {
                var idsWhere = " where ID(m) in["
                for (var i = 0; i < pivotIds.length; i++) {
                    if (i > 0)
                        idsWhere += ","
                    idsWhere += pivotIds[i].p._id;
                }
                idsWhere += "] ";

                var where2 = "";
                if (sourceNodeId)
                    where2 = ' and id(n)=' + sourceNodeId + ' ';
                if (subGraph)
                    where2 += ' and n.subGraph="' + subGraph + '" ';

                var statement = "match path=((n:" + sourceLabel + ")--(m" + pivotLabelStr + "))";//--(m:" + sourceLabel + ")) "
                statement += idsWhere + where2 + toutlesensData.standardReturnStatement + " limit " + Gparams.maxResultSupported;

                var payload = {match: statement};

                $("#waitImg").css("visibility", "visible");
                $.ajax({
                    type: "POST",
                    url: self.neo4jProxyUrl,
                    data: payload,
                    dataType: "json",
                    success: function (data, textStatus, jqXHR) {
                        savedQueries.addToCurrentSearchRun(statement);

                        if (data.length == 0) {
                            return $(messageDivId).html("no pivot values found");
                            $("#graphDiv").html("no pivot values found");

                        }
                        var distinctSourceNodesArray = [];
                        var sourceNodesArray = [];
                        for (var i = 0; i < data.length; i++) {
                            var name = data[i].nodes[0].properties[Schema.getNameProperty()];
                            if (distinctSourceNodesArray.indexOf(name) < 0) {
                                sourceNodesArray.push({name: name, id: data[i].nodes[0]._id});
                                distinctSourceNodesArray.push(name);
                            }

                        }
                        sourceNodesArray.sort(function (a, b) {
                            if (a > b)
                                return 1;
                            if (a < b)
                                return -1;
                            return 0;
                        });
                        sourceNodesArray.splice(0, 0, "");
                        common.fillSelectOptions(pivotsDialogSourceNodeSelect, sourceNodesArray, "name", "id");

                        var setPivotsLayout = function () {
                            var updatedNodes = [];
                            var offsetX = 0;
                            offsetX = $("#graphDiv").width();
                            var offsetY = 0;
                            offsetY = $("#graphDiv").height();
                            var offsetX = (offsetX) - 200;
                            var offsety = (offsetY / 2) + 20;
                            var count0 = pivotIds[0].countR;
                            for (var i = 0; i < Math.min(pivotIds.length, 20); i++) {
                                var node = {id: pivotIds[i].p._id, shape: "star", shape: "star", size: 50, color: "red"}
                                if (i == 0 || count0 == pivotIds[i].countR) {
                                    node.size = 20;
                                }
                                node.x = -offsetX;//+(i*50);
                                node.y = -(offsetY / 2) + (i * 60);
                                node.label = pivotIds[i].p.properties[Schema.getNameProperty()];//+ " (" + pivotIds[i].countR + " relations)";

                                updatedNodes.push(node)
                            }

                            visjsGraph.nodes.update(updatedNodes);

                            var node = pivotIds[(Math.round(pivotNumber / 2)) - 2].p._id
                            visjsGraph.network.focus(node,
                                {
                                    scale: 0.7,
                                    animation: {
                                        duration: 1000,
                                    }
                                });
                            //  visjsGraph.network.fit()
                        }
                        toutlesensData.cachedResultArray = data;
                        currentDisplayType = "VISJS-NETWORK";

                        visjsGraph.setLayoutType("random", null);

                        var options = {
                            showNodesLabel: false,
                            stopPhysicsTimeout: 1000,
                            onFinishDraw: setPivotsLayout,
                            // clusterByLabels:["document"]
                        }
                        toutlesensController.displayGraph(data, options, function (err, result) {


                            $("#filtersDiv").html("");
                            $("#graphMessage").html("");


                        });


                    },
                    error: function (err) {
                        return console.log(err);
                    }
                });
            }
            ,
            error: function (err) {
                return console.log(err);
            }
        });


    }

    self.graphNodesAndSimilarNodes = function (err, query) {
        if (err)
            return console.log(err);
        var payload = {
            match: query
        }

        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                savedQueries.addToCurrentSearchRun(query);
                var ids = [];
                for (var i = 0; i < data.length; i++) {
                    ids.push(data[i].n._id)
                }


                toutlesensData.setWhereFilterWithArray("_id", ids, function (err, result) {
                    /*  if(context.cypherMatchOptions.sourceNodeWhereFilter!="")
                          context.cypherMatchOptions.sourceNodeWhereFilter+= " and " + self.filterLabelWhere;
                      else*/
                    //  context.cypherMatchOptions.sourceNodeWhereFilter =self.filterLabelWhere;
                    toutlesensController.generateGraph(null, {
                        applyFilters: true,
                        dragConnectedNodes: true
                    }, function () {

                        $("#filtersDiv").html("");
                        $("#graphMessage").html("");


                    });

                })
            }
        })


    }
    self.transitiveRelationsAction = function (action) {
        if (action == "add") {
            var label = $("#transitiveRelations_labelsSelect").val();
            $('#transitiveRelations_selectedLabels').append($('<option>', {
                value: label,
                text: label

            }));

            $("#transitiveRelations_labelsSelect option").remove();
            var getPermittedLabels = Schema.getPermittedLabels(label);
            getPermittedLabels.splice(0, 0, "");
            for (var i = 0; i < getPermittedLabels.length; i++) {
                var label2 = getPermittedLabels[i];//.replace("-","");
                if (label2 != label)

                    $('#transitiveRelations_labelsSelect').append($('<option>', {
                        value: label2,
                        text: label2

                    }));
            }
        }

        else if (action == "removeOption") {

            value = $("#transitiveRelations_selectedLabels").val();
            $('#transitiveRelations_selectedLabels').find('option[value="' + value + '"]').remove();


        }
        else if (action == "reset") {
            $("#transitiveRelations_selectedLabels option").remove();
            toutlesensController.initLabels(transitiveRelations_labelsSelect, true);


        }
        else if (action == "draw") {
            var match = "MATCH path=";
            var size = $('#transitiveRelations_selectedLabels option').size();
            $("#transitiveRelations_selectedLabels option").each(function (index, value) {
                var label = this.value;
                if (index == 0)
                    match += "(n:" + label + ")-[r]";
                else if (index >= (size - 1))
                    match += "->(m:" + label + ")";
                else
                    match += "->(:" + label + ")-[]";

            })
            toutlesensData.matchStatement = match;

            toutlesensController.generateGraph(null);


        }


    }

    self.graphNodesOnly = function (err, query) {
        if (err)
            return console.log(err);
        var payload = {
            match: query
        }

        return cards.drawCards("domain", null, "cards")

        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                savedQueries.addToCurrentSearchRun(query);
                var nodes = [];
                var labels = [];
                var data2 = [];
                // format data to be compliant with  connectors.neoResultsToVisjs
                for (var i = 0; i < data.length; i++) {
                    var node = data[i].n;
                    data2.push({nodes: [node]})
                }


                var json = connectors.neoResultsToVisjs(data2);

                visjsGraph.draw("graphDiv", json, {});
                visjsGraph.drawLegend(filters.currentLabels);
                if (paint.currentBIproperty && paint.currentBIproperty != "")
                    paint.paintClasses(paint.currentBIproperty)
            }
        })


    }




  return self;

})();


