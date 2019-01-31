var buildPaths = (function () {
    var self = {};
    self.currentDataset;
    var currentDivIndex = -1;
    var globalHtml = "<div class='buildPaths'>";
    self.queryObjs = [];
    self.isEditing=false;


    self.show = function (addQueryObject) {
        self.isEditing=true;
        searchNodes.previousAction = "complexQueryUI";
        $("#searchDialog_newQueryButton").css('visibility', 'visible');
        $("#searchDialog_nextPanelButton").css('visibility', 'hidden');

        searchNodes.activatePanel("searchCriteriaDiv")
        searchNodes.setUIPermittedLabels(context.queryObject.label);

        if (currentDivIndex > -1 && context.queryObject.label == self.queryObjs[currentDivIndex].label) {// updateNodeQuery
            self.updateNodeQuery(currentDivIndex,context.queryObject);
        }
        else if (addQueryObject) {
            searchNodes.setNodeQueryUI();
            self.addNodeQuery(context.queryObject);
        }

        $("#dialogLarge").html(globalHtml);
        $("#dialogLarge").dialog("option", "modal", false );
        $("#dialogLarge").dialog( "option", "position", { of: $('#graphDiv') } );

        $("#dialogLarge").dialog("open");

    }

    self.addNodeQuery = function (queryObject) {
        var index = self.queryObjs.length;
        queryObject.inResult = true;
        self.queryObjs.push(queryObject)
        self.draw();


    }

    self.updateNodeQuery = function (index,queryObject) {

        self.queryObjs[index]=queryObject;

        $("#complexQuery_nodeConditionDiv_"+index).html(queryObject.globalText)


    }

    self.draw = function () {
        globalHtml = "<div class='buildPaths' id='buildPaths' style='visibility:visible'>";
        self.queryObjs.forEach(function (queryObject, index) {
            globalHtml += self.getNodeDivHtml(queryObject, index);
        })
        globalHtml += "</div>" +
            "<button onclick='buildPaths.executeQuery()'>execute query </button>" +
            "<button onclick='buildPaths.clear()'>clear all </button>" +
            "<br><div id='buildPaths_cypherDiv'></div>" +
            "<br><div id='buildPaths_resultDiv'></div>" +
            "<br><div id='buildPaths_resultActionDiv'></div>"
        $("#graphPopup").css("visibility", "hidden")
        $("#buildPaths").html(globalHtml)

    }

    self.getNodeDivHtml = function (queryObject, index) {
        var queryText = "";
        if (queryObject.value && queryObject.value != "")
            queryText = queryObject.property + " " + queryObject.operator + " " + queryObject.value;
        var color = nodeColors[queryObject.label];
        var classInResult = "";
        if (queryObject.inResult)
            classInResult = " buildPaths-nodeInResultDiv";


        var html = "<div id='complexQuery_nodeDiv_" + index + "' class=' buildPaths-nodeDiv " + classInResult + "'  onclick='buildPaths.onSelectNodeDiv(" + index + ")'>" +
            " <div class='buildPaths-partDiv' style='background-color: " + color + "'><b>Label : " + queryObject.label + "</b></div>" +
            "<div id='complexQuery_nodeConditionDiv_"  + index + "' class='buildPaths-partDiv'> Condition : " + queryText + "</div>" +
            " <div class='buildPaths-partDiv'><button  id='buildPaths_inResultButton'  onclick='buildPaths.nodeInResult(" + index + ")'>not in result</button> </div>" +
            // "<button onclick='buildPaths.removeQueryObj(" + index + ")'>X</button>" +
            "<input type='image' height='10px'  title='remove node' onclick='buildPaths.removeQueryObj(" + index + ")' src='images/trash.png'/>" +
            "</div>"


        return html;


    }


    self.onSelectNodeDiv = function (index) {
        currentDivIndex = index;
        $(".buildPaths-nodeDiv ").removeClass("buildPaths-nodeDivSelected")
        $("#complexQuery_nodeDiv_" + index).addClass("buildPaths-nodeDivSelected")
        $(".selectLabelDiv").css("visibility", "visible");

        context.queryObject = self.queryObjs[index];
        searchNodes.previousAction = "complexQueryNodeSelected";

        searchNodes.activatePanel("searchCriteriaDivFrombuildPaths");


    }
    self.removeQueryObj = function (index) {
        if (index == 0) {
            searchNodes.setUIPermittedLabels();
            searchNodes.resetQueryClauses();
            $("#buildPaths").html("");
        }
        else
            searchNodes.setUIPermittedLabels(self.queryObjs[index - 1].label);
        self.queryObjs.splice(index, 1)
        self.draw();


    }

    self.nodeInResult = function (index) {
        if (!self.queryObjs[index].inResult) {
            $("#complexQuery_nodeDiv_" + index).addClass("buildPaths-nodeInResultDiv");
            self.queryObjs[index].inResult = true;
            $(("#buildPaths_inResultButton")).html('Not in Result')
        } else {
            $("#complexQuery_nodeDiv_" + index).removeClass("buildPaths-nodeInResultDiv");
            self.queryObjs[index].inResult = false;
            $(("#buildPaths_inResultButton")).html('In Result')
        }
    }
    self.clear = function () {
        self.queryObjs = [];
        globalHtml="";
        self.draw();
        currentDivIndex = -1
    }
    self.reset = function () {
        self.queryObjs = [];
        $("#buildPaths").html("");
        currentDivIndex = -1
    }
    self.executeQuery = function () {
        $("#searchDialog_previousPanelButton").css('visibility', 'visible');
        var countResults = self.countResults();
        if (countResults == 0) {
            return alert("you must least include on label in return clause of the query")
        }


        var cypher = self.buildQuery();
        $("#buildPaths_cypherDiv").html(cypher)
        Cypher.executeCypher(cypher, function (err, result) {
            if (err) {
                return $("#buildPaths_resultDiv").html(err)
            }
            if (result.length == 0)
                return $("#buildPaths_resultDiv").html("no result")
            if (false && result.length > Gparams.graphMaxDataLengthToDisplayGraphDirectly)
                return $("#buildPaths_resultDiv").html("too many results" + result.length);

            self.currentDataset = self.prepareDataset(result);
            $("#buildPaths_resultDiv").html(+result.length + " pathes found")

            var html = "<button onclick='buildPaths.displayTable()'>table or stat</button>"
            if (countResults == 1)
                html += "<button onclick='buildPaths.defineAsSet()'>define as set</button>"
            // else {
            html += "<button onclick='buildPaths.displayGraph()'>Graph</button>";


            //  }
            globalHtml+=html
            $("#buildPaths_resultActionDiv").html(html)

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

    self.buildQuery = function () {
        if (self.queryObjs.length == 0)
            return console.log("self.queryObjs is empty")

        var matchCypher = "";
        var whereCypher = "";
        var returnCypher = "";
        var distinctWhere = "";
        var alphabet = "abcdefghijklmno"
        self.queryObjs.forEach(function (queryObject, index) {
            var symbol = alphabet.charAt(index)
            if (index > 0)
                matchCypher += "-[r" + index + "]-"
            matchCypher += "(" + symbol + ":" + queryObject.label + ")";

            if (queryObject.value && queryObject.value != "") {

                 whereCypher = searchNodes.buildWhereClauseFromUI(queryObject, symbol);

                if (context.queryObject.subQueries) {
                    context.queryObject.subQueries.forEach(function (suqQuery) {
                        whereCypher += " " + suqQuery.booleanOperator + " " + searchNodes.buildWhereClauseFromUI(suqQuery, symbol);
                    })
                }
            }

            if (queryObject.inResult) {

                if (returnCypher.length > 0) {
                    returnCypher += ",";
                    distinctWhere += "+'-'+"
                }
                returnCypher += symbol;
                distinctWhere += "ID(" + symbol + ")";
            }
        })
        if (whereCypher.length > 0)
            whereCypher = " where " + whereCypher;

        distinctWhere = "distinct(" + distinctWhere + ") as distinctIds";// pour supprimer les doublons
        var cypher = " match " + matchCypher + " " + whereCypher + " return " + distinctWhere + "," + returnCypher + " limit " + Gparams.maxResultSupported;
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
    self.hide=function() {
        self.isEditing = false;
        $("#dialogLarge").dialog("close");
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

       self.hide();
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

    }


    self.displayGraph = function () {
        self.hide()

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