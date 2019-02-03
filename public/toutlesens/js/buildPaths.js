var buildPaths = (function () {
    var self = {};
    self.currentDataset;
    var currentDivIndex = -1;
    var alphabet = "abcdefghijklmno";
    var currentSetType;
    self.queryObjs = [];
    self.isEditing = false;
    self.currentCypher = "";

    var globalHtml = "";

    var init = function () {
        var globalHtmlButtons = "</div>" +
            "<div style='width: 100%;'><textarea id='buildPaths_cypherTA' onchange='buildPaths.cypher=$(this).val();' rows='2' style='width: 100%;background: #ede4d4;visibility: hidden' ></textarea><br></div>" +
            "<div style=' justify-content: center;display: flex;flex-direction: row'></div>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.executeQuery('count')>Count </button>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.executeQuery('dataTable')>Table</button>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.executeQuery('graph')>Graph </button>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.showMoreParams('set')>Create set </button>" +
            "<button class='buildPathsButtons' onclick=buildPaths.editCypher()>Edit Cypher</button>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.showMoreParams('others')>Others... </button>" +

            "</div>"
            + "<br><div id='buildPaths_resultDiv'></div>" //+


        globalHtml = "<div class='buildPaths' id='buildPaths_matchNodesWrapper'  onclick='buildPaths.onUnSelectNodeDiv()' style='visibility:visible'>" +
            globalHtmlButtons +
            "<div style='width: 100%;visibility:hidden' id='buildPath_moreParamsDiv'> choose label <select class='buildPathsButtons' id='buildPaths_labelSelect'></select><button class='buildPathsButtons' onclick=buildPaths.executeQuery('set') >ok</button>" +
            "<span style='visibility:hidden' id='buildPath_moreParamsSetDiv'>set name<inputclass='buildPathsButtons' id='buildPaths_setName'> comment<textarea class='buildPathsButtons' id='buildPaths_setCommentTA'></textarea></textarea></span> </div>" +


            "</div>"
        ;


    }

    self.show = function (booleanOperator) {
        self.isEditing = true;

        if (!$("#buildPaths_matchNodesWrapper").length)
            init()


        if (booleanOperator) {
            searchNodes.setContextNodeQueryObjectFromUI(booleanOperator, function () {
                if (currentDivIndex > -1 && context.queryObject.label == self.queryObjs[currentDivIndex].label) // updateNodeQuery
                    self.updateNodeQuery(currentDivIndex, context.queryObject);
                else
                    self.addNodeQuery(context.queryObject);

            });
        }
        else {

            searchNodes.activatePanel("searchCriteriaDivFrombuildPaths")

        }


        searchNodes.setUIPermittedLabels(context.queryObject.label);
        $("#graphPopup").css("visibility", "hidden")
        $("#searchDialog_newQueryButton").css('visibility', 'visible');
        $("#searchDialog_nextPanelButton").css('visibility', 'hidden');


        $("#buildGraphDiv").html(globalHtml);
        $("#buildGraphDiv").css("visibility", "visible")

        /*  $("#dialogLarge").html(globalHtml);
          $("#dialogLarge").dialog("option", "modal", false);
          $("#dialogLarge").dialog("option", "position", {of: $('#graphDiv')});

          $("#dialogLarge").dialog("open");*/

    }


    self.addNodeQuery = function (queryObject) {
        var index = self.queryObjs.length;
        queryObject.inResult = true;
        self.queryObjs.push(queryObject)
        self.drawNodeQueryDivs();
        //   self.onSelectNodeDiv(index);


    }

    self.updateNodeQuery = function (index, queryObject) {

        self.queryObjs[index] = queryObject;

        $("#complexQuery_nodeConditionDiv_" + index).html(queryObject.globalText)
        globalHtml = $("#buildGraphDiv").html()
        self.cypher = self.buildQuery();
        $("#buildPaths_cypherTA").text(self.cypher)


    }

    self.drawNodeQueryDivs = function (withButtons) {
        var html = ""
        self.queryObjs.forEach(function (queryObject, index) {
            html += self.getNodeDivHtml(queryObject, index);
        })


        $("#buildPaths_matchNodesWrapper").html(html);
        globalHtml = $("#buildGraphDiv").html();
        self.cypher = self.buildQuery();
        $("#buildPaths_cypherTA").text(self.cypher)

    }

    self.getNodeDivHtml = function (queryObject, index) {
        var queryText = queryObject.text;
        var queryCountNodes = "<b>" + queryObject.nodeIds.length + " nodes" + "</b>";

        var color = nodeColors[queryObject.label];
        var classInResult = "";
        if (queryObject.inResult)
            classInResult = " buildPaths-nodeInResultDiv";


        var html = "<div id='complexQuery_nodeDiv_" + index + "' class=' buildPaths-nodeDiv " + classInResult + "'  onclick='buildPaths.onSelectNodeDiv(" + index + ")'>" +
            " <div class='buildPaths-partDiv' style='background-color: " + color + "'><b>" + queryObject.label + "</b></div>" +
            "<div id='complexQuery_nodeConditionDiv_" + index + "' class='complexQuery-nodeConditionDiv buildPaths-partDiv'> " + queryText + "</div>" +
            "<div id='complexQuery_resultCountDiv_" + index + "' class='complexQuery-resultCountDiv buildPaths-partDiv'> " + queryCountNodes + "</div>" +
            // " <div class='buildPaths-partDiv'><button  id='buildPaths_inResultButton'  onclick='buildPaths.nodeInResult(" + index + ")'>not in result</button> </div>" +
            "<span><input type='checkbox' id='buildPaths-inResultCbx_" + index + "' checked='checked' >in result </span><br>"
        // " <span><input type='checkbox' id='buildPaths-inResultCbx' checked='checked' onclick='buildPaths.nodeInResult(" + index + ")'>in result </span><br>";

        if (false && index > 0)
            html += "<span><input type='checkbox' id='buildPaths-clusterCbx'  onclick='buildPaths.clusterNodesInGraph(" + index + ")'>cluster</span> <br> ";

        // "<button onclick='buildPaths.removeQueryObj(" + index + ")'>X</button>" +
        html += "<div style='display: flex'><input type='image' height='15px'  title='move left' onclick='buildPaths.moveDivLeft(" + index + ")' src='images/left.png'/>" +
            "<input type='image' height='15px'  title='remove node' onclick='buildPaths.removeQueryObj(" + index + ")' src='images/trash.png'/>" +
            "<input type='image' height='15px'  title='move right' onclick='buildPaths.moveDivRight(" + index + ")' src='images/right.png'/></div>" +
            "</div>"


        return html;


    }

    self.moveDivLeft = function (index) {
    }
    self.moveDivRight = function (index) {

    }
    self.editCypher = function () {
        var visibility = $('#buildPaths_cypherTA').css('visibility');
        if (visibility == "hidden")
            visibility = "visible"
        else
            visibility = "hidden"
        $('#buildPaths_cypherTA').css('visibility', visibility);
    }
    self.onUnSelectNodeDiv = function () {
        currentDivIndex = -1;
        var index = self.queryObjs.length - 1;
        var label = null;
        if (index > -1)
            label = self.queryObjs[label];

        searchNodes.resetQueryClauses();
        searchNodes.setUIPermittedLabels(label);


        $(".buildPaths-nodeDiv ").removeClass("buildPaths-nodeDivSelected")
        event.stopPropagation()
    }
    self.onSelectNodeDiv = function (index) {
        currentDivIndex = index;
        $(".buildPaths-nodeDiv ").removeClass("buildPaths-nodeDivSelected")
        $("#complexQuery_nodeDiv_" + index).addClass("buildPaths-nodeDivSelected")
        $(".selectLabelDiv").css("visibility", "visible");

        context.queryObject = self.queryObjs[index];


        searchNodes.setUpdateContextQueryObject();
        $("#mainAccordion").accordion("option", "active", 0);
        $("#searchDialog_booleanOperatorsDiv").css('visibility', 'visible');
        event.stopPropagation()


    }
    self.removeQueryObj = function (index) {
        if (index == 0) {
            searchNodes.setUIPermittedLabels();
            searchNodes.resetQueryClauses();
            $("#buildPaths_matchNodesWrapper").html("");
        }
        else
            searchNodes.setUIPermittedLabels(self.queryObjs[index - 1].label);
        self.queryObjs.splice(index, 1)
        self.drawNodeQueryDivs();


    }

    /*self.nodeInResult = function (index) {
        if (!self.queryObjs[index].inResult) {
            $("#complexQuery_nodeDiv_" + index).addClass("buildPaths-nodeInResultDiv");
            self.queryObjs[index].inResult = true;
            $(("#buildPaths_inResultButton")).html('Not in Result')
        } else {
            $("#complexQuery_nodeDiv_" + index).removeClass("buildPaths-nodeInResultDiv");
            self.queryObjs[index].inResult = false;
            $(("#buildPaths_inResultButton")).html('In Result')
        }
    }*/

    self.clusterNodesInGraph = function (index) {
        if (!self.queryObjs[index].clusterInResult) {
            self.queryObjs[index].clusterInResult = true;
        } else {
            delete self.queryObjs[index].clusterInResult;
        }
    }

    self.clear = function () {
        self.queryObjs = [];
        globalHtml = "";
        currentDivIndex = -1;
        $("#buildPaths_cypherTA").text("")
        self.cypher = "";
        $("#buildGraphDiv").html("")
        //  $("#buildPaths_matchNodesWrapper").html("")
        globalHtml = ""


    }
    self.showMoreParams = function (type) {
        currentSetType = type
        var labels = [];
        self.queryObjs.forEach(function (queryObject, index) {
            labels.push({label: (queryObject.label + "-" + index), index: index})
        })
        common.fillSelectOptions(buildPaths_labelSelect, labels, "label", "index", true)

        if (type == "others" || type == "set") {
            $("#buildPath_moreParamsDiv").css("visibility", "visible")
            if (type == "set")
                $("#buildPath_moreParamsSetDiv").css("visibility", "visible")


        }
    }
    /*  self.reset = function () {
          self.queryObjs = [];
          $("#buildPaths_matchNodesWrapper").html("");
          currentDivIndex = -1
      }*/

    self.executeQuery = function (type) {


        $("#searchDialog_previousPanelButton").css('visibility', 'visible');
        var countResults = self.countResults();
        /* if (countResults == 0) {
             return alert("you must least include on label in return clause of the query")
         }*/
        if (!currentSetType) {
            $("#buildPath_moreParamsDiv").css('visibility', 'hidden')
        }
        self.cypher = self.buildQuery(type);
        $('#buildPaths_cypherTA').val(self.cypher);

        Cypher.executeCypher(self.cypher, function (err, result) {

            if (err) {
                console.log("ERROR " + self.cypher)
                return $("#buildPaths_resultDiv").html(err)
            }
            if (result.length == 0)
                return $("#buildPaths_resultDiv").html("no result")
            if (false && result.length > Gparams.graphMaxDataLengthToDisplayGraphDirectly)
                return $("#buildPaths_resultDiv").html("too many results" + result.length);


            if (type == "count") {
                $("#buildPaths_resultDiv").html(+result[0].cnt + " pathes found");
                return;
            }
            else if (type == "dataTable") {
                $("#buildPaths_resultDiv").html(+result.length + " pathes found");
                self.currentDataset = self.prepareDataset(result);
                return buildPaths.displayTable();
            }
            else if (type == "graph") {
                $("#buildPaths_resultDiv").html(+result.length + " pathes found");
                self.currentDataset = self.prepareDataset(result);
                return buildPaths.displayGraph();
            }
            else if (currentSetType) {
                var index = $("#buildPaths_labelSelect").val();
                if (index == "" || index < 0)
                    return;
                index = parseInt(index);
                var queryObj = self.queryObjs[index];
                if (currentSetType == "set") {
                    currentSetType = null;
                    var name = $("#buildPaths_setName").val();
                    var comment = $("#buildPaths_setCommentTA").val();
                    nodeSets.create(name, queryObj.label, comment, self.cypher, result[0].setIds, function (err, resultSet) {
                        var message = "";
                        if (err)
                            message = "ERROR " + err;
                        else
                            message = "Set " + name + "created :" + result[0].set.length + " nodes"
                        $("#buildPaths_resultDiv").html(message)

                    })

                }
                else if(currentSetType=="others"){
                    if(!context.currentSet)
                        context.currentSet={}
                        context.currentSet.nodeIds= result[0].setIds;


                    searchNodes.activatePanel("searchActionDiv");
                }

            }


        })


    }

    self.countResults = function () {
        var count = 0;

        self.queryObjs.forEach(function (queryObject, index) {
            if (queryObject.inResult)
                count += 1;
        })
        return count;
    }

    self.buildQuery = function (type) {
        if (self.queryObjs.length == 0)
            return console.log("self.queryObjs is empty")

        var matchCypher = "";
        var whereCypher = "";
        var returnCypher = "";
        var distinctWhere = "";

        self.queryObjs.forEach(function (queryObject, index) {
            var symbol = alphabet.charAt(index);
            queryObject.inResult = $("#buildPaths-inResultCbx_" + index).is(':checked');

            if (index > 0)
                matchCypher += "-[r" + index + "]-"
            matchCypher += "(" + symbol + ":" + queryObject.label + ")";

            if (queryObject.value && queryObject.value != "") {
                if (whereCypher != "")
                    whereCypher += " AND "
                whereCypher += searchNodes.buildWhereClauseFromUI(queryObject, symbol);
            }
            if (context.queryObject.subQueries) {
                context.queryObject.subQueries.forEach(function (suqQuery) {
                    if (suqQuery.value && suqQuery.value != "") {
                        whereCypher += " " + suqQuery.booleanOperator + " " + searchNodes.buildWhereClauseFromUI(suqQuery, symbol);
                    }
                })
            }


            else if (queryObject.inResult) {


                if (returnCypher.length > 0) {
                    returnCypher += ",";
                    distinctWhere += "+'-'+"
                }
                returnCypher += symbol;
                distinctWhere += "ID(" + symbol + ")";
            }

        })
        if (whereCypher.length > 0)
            whereCypher = " WHERE " + whereCypher;

        if (type == "count") {
            returnCypher = "count(a) as cnt";
            distinctWhere = "";
        }
        else if (type == "set") {
            var index = $("#buildPaths_labelSelect").val();
            var symbol = alphabet.charAt(index);
            returnCypher = "collect(ID(" + symbol + ")) as setIds";
            distinctWhere = "";
        }
        else {
            distinctWhere = "DISTINCT(" + distinctWhere + ") as distinctIds,";// pour supprimer les doublons
        }


        var cypher = " MATCH p=(" + matchCypher + ") " + whereCypher + " RETURN " + distinctWhere + returnCypher + " LIMIT " + Gparams.maxResultSupported;
        return cypher;
    }


    //var union=   "match (a:personne)-[r1]-(b:tag)  with  a,count(b) as cntR  where  a.name=~'(?i).*art.*' and  cntR> 5 match(a)-[r]-(b2) return a , collect(id(b2)) as bx limit 100 union match (a:personne)-[r1]-(b:tag)  with  a,count(b) as cntR  where cntR<5 match(a)-[r]-(b2) return a,b2 as bx limit 100"

    self.prepareDataset = function (neoResult) {
        var dataset = []
        var columns = [];
        var labelSymbols = [];
        var labels = [];
        neoResult.forEach(function (line) {// define columns and structure objects by line
            var lineObj = {};

            for (var key in line) {// each node type
                if (key == "distinctIds")
                    continue;
                if (labelSymbols.indexOf(key) < 0)
                    labelSymbols.push(key);

                var props = line[key].properties;
                for (var keyProp in props) {
                    if (columns.indexOf(keyProp) < 0) {
                        columns.push(keyProp);
                    }
                }
                props.neoId = line[key]._id;
                props.labelNeo = line[key].labels[0];
                if (labels.indexOf(props.labelNeo) < 0)
                    labels.push(props.labelNeo);
                var obj = {
                    id: line[key]._id,
                    neoAttrs: props,
                    label: props.labelNeo
                }
                lineObj[key] = obj;

            }
            dataset.push(lineObj)

        })
        return {columns: columns, data: dataset, labelSymbols: labelSymbols, labels: labels};


    }
    self.expandCollapse = function () {
        if ($("#buildGraphDiv").html() == "") {
            $("#buildGraphDiv").html(globalHtml);
        } else {
            $("#buildGraphDiv").html("");
        }


    }


    self.displayTable = function () {

        function getConnections(line) {
            var connections = {}
            var nodeKeys = Object.keys(line);
            nodeKeys.forEach(function (key) {
                connections[key] = "";
                nodeKeys.forEach(function (key2, indexKey2) {
                    if (key2 != key) {
                        if (connections[key] != "")
                            connections[key] += ","
                        connections[key] += line[key2].neoAttrs[Schema.getNameProperty(line[key2].label)] + "[" + line[key2].label + "]"
                    }

                })
            })
            return connections;
        }

        self.expandCollapse();
        var tableDataset = [];
        var columns = self.currentDataset.columns;
        self.currentDataset.data.forEach(function (line) {

            var connections = getConnections(line);
            for (var nodeKey in line) {

                var datasetLine = {};
                datasetLine["label"] = line[nodeKey].neoAttrs["labelNeo"];
                columns.forEach(function (col) {
                    if (col != "labelNeo") {
                        var value = line[nodeKey].neoAttrs[col];
                        if (!value)
                            value = "";
                        datasetLine[col] = value;
                    }
                })
                if (connections[nodeKey].length > 0)
                    datasetLine.connectedTo = connections[nodeKey]


                tableDataset.push(datasetLine);
            }


        })
        tableDataset.sort(function (a, b) {
            if (a.label > b.label) {
                return 1;
            }
            if (a.label < b.label) {
                return -1;
            }
            return 0;

        })

        var xx = tableDataset;
        $("#dialog").load("htmlSnippets/exportDialog.html", function () {
            dialog.dialog("open");

            dialog.dialog({title: "Select table columns"});
            exportDialog.init(tableDataset)


        })

    }
    self.defineAsSet = function () {
        var setName = prompt("set name ?")
        if (!setName || setName == "")
            return;

    }


    self.displayGraph = function () {
        self.expandCollapse()

        toutlesensController.setGraphMessage("Working...")
        var visjsData = {nodes: [], edges: [], labels: []};
        visjsData.labels = self.currentDataset.labels;
        var uniqueNodes = []
        self.currentDataset.data.forEach(function (line, indexLine) {
            for (var nodeKey in line) {
                var nodeNeo = line[nodeKey];
                if (uniqueNodes.indexOf(nodeNeo.id) < 0) {
                    uniqueNodes.push(nodeNeo.id);
                    var visjsNodeLabel = nodeNeo.neoAttrs[Schema.getNameProperty(nodeNeo.label)];
                    var visjsNode = {
                        labelNeo: nodeNeo.label,// because visjs where label is the node name
                        color: nodeColors[nodeNeo.label],
                        myId: nodeNeo.id,
                        id: nodeNeo.id,
                        children: [],
                        neoAttrs: nodeNeo.neoAttrs,
                        value: 8,
                        endRel: "",
                        //   label: visjsNodeLabel,
                        hiddenLabel: visjsNodeLabel,
                        // title: visjsNodeLabel
                    }
                    visjsData.nodes.push(visjsNode);
                }
            }
            var previousSymbol;
            self.currentDataset.labelSymbols.forEach(function (symbol, indexSymbol) {
                if (indexSymbol > 0) {
                    var fromNode = line[previousSymbol];
                    var toNode = line[symbol];
                    var relObj = {
                        from: fromNode.id,
                        to: toNode.id,
                        type: "NA",
                        neoId: "" + fromNode.id + "_" + toNode.id,
                        neoAttrs: {},
                        color: "#555",
                        width: 1,

                    }
                    visjsData.edges.push(relObj)
                }
                previousSymbol = symbol;

            })
        })

        visjsGraph.draw("graphDiv", visjsData, {});
        visjsGraph.drawLegend(visjsData.labels);
        $("#toTextMenuButton").css("visibility", "visible");
        searchNodes.onExecuteGraphQuery()


    }

    return self;
})
()