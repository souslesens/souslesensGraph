var complexQueries = (function () {
    var self = {};
    self.currentDataset;
    var currentDivIndex = -1;
    var globalHtml = "<div class='complexQueries'>";
    var queryObjs = [];


    self.addNodeQuery = function (queryObj) {
        var index = queryObjs.length;
        queryObj.inResult = true;
        queryObjs.push(queryObj)
        self.draw();


    }
    self.draw = function () {
        globalHtml = "<div class='complexQueries'>";
        queryObjs.forEach(function (queryObj, index) {
            globalHtml += self.getNodeDivHtml(queryObj, index);
        })
        globalHtml += "</div>" +
            "<button onclick='complexQueries.executeQuery()'>execute query </button>" +
            "<button onclick='complexQueries.clear()'>clear all </button>" +
            "<br><div id='complexQueries_cypherDiv'></div>" +
            "<br><div id='complexQueries_resultDiv'></div>" +
            "<br><div id='complexQueries_resultActionDiv'></div>"

        $("#graphDiv").html(globalHtml)

    }

    self.getNodeDivHtml = function (queryObj, index) {
        var queryText = "";
        if (queryObj.value && queryObj.value != "")
            queryText = queryObj.property + " " + queryObj.operator + " " + queryObj.value;
        var color = nodeColors[queryObj.label];
        var classInResult = "";
        if (queryObj.inResult)
            classInResult = " complexQueries-nodeInResultDiv";


        var html = "<div id='complexQuery_nodeDiv_" + index + "' class=' complexQueries-nodeDiv " + classInResult + "'  onclick='self.setNodeDivIndex(" + index + ")'>" +
            " <div class='complexQueries-partDiv' style='background-color: " + color + "'><b>Label : " + queryObj.label + "</b></div>" +
            "<div class='complexQueries-partDiv'> Condition : " + queryText + "</div>" +
            " <div class='complexQueries-partDiv'><button  id='complexQueries_inResultButton'  onclick='complexQueries.nodeInResult(" + index + ")'>not in result</button> </div>" +
            // "<button onclick='complexQueries.removeQueryObj(" + index + ")'>X</button>" +
            "<input type='image' height='10px'  title='remove node' onclick='complexQueries.removeQueryObj(\" + index + \")' src='images/trash.png'/>" +
            "</div>"


        return html;


    }


    self.setNodeDivIndex = function (index) {
        currentDivIndex = index;
    }
    self.removeQueryObj = function (index) {
        queryObjs.splice(index, 1)
        self.draw();

    }

    self.nodeInResult = function (index) {
        if (!queryObjs[index].inResult) {
            $("#complexQuery_nodeDiv_" + index).addClass("complexQueries-nodeInResultDiv");
            queryObjs[index].inResult = true;
            $(("#complexQueries_inResultButton")).html('Not in Result')
        } else {
            $("#complexQuery_nodeDiv_" + index).removeClass("complexQueries-nodeInResultDiv");
            queryObjs[index].inResult = false;
            $(("#complexQueries_inResultButton")).html('In Result')
        }
    }
    self.clear = function () {
        queryObjs = [];
        self.draw();
        currentDivIndex = -1
    }
    self.reset = function () {
        queryObjs = [];
        $("#graphDiv").html("");
        currentDivIndex = -1
    }
    self.executeQuery = function () {
        $("#searchDialog_previousPanelButton").css('visibility', 'visible');
        var countResults = self.countResults();
        if (countResults == 0) {
            return alert("you must least include on label in return clause of the query")
        }


        var cypher = self.buildQuery();
        $("#complexQueries_cypherDiv").html(cypher)
        toutlesensData.executeCypher(cypher, function (err, result) {
            if (err) {
                return $("#complexQueries_resultDiv").html(err)
            }
            if (result.length == 0)
                return $("#complexQueries_resultDiv").html("no result")
            if (false && result.length > Gparams.graphMaxDataLengthToDisplayGraphDirectly)
                return $("#complexQueries_resultDiv").html("too many results" + result.length);

            self.currentDataset = self.prepareDataset(result);
            $("#complexQueries_resultDiv").html(+result.length + " pathes found")

            var html = "<button onclick='complexQueries.displayTable()'>table or stat</button>"
            if (countResults == 1)
                html += "<button onclick='complexQueries.defineAsSet()'>define as set</button>"
            else {
                html += "<button onclick='complexQueries.displayGraph()'>Graph</button>";


            }
            $("#complexQueries_resultActionDiv").html(html)

        })


    }

    self.countResults = function () {
        var count = 0;

        queryObjs.forEach(function (queryObj, index) {
            if (queryObj.inResult)
                count += 1;
        })
        return count;
    }

    self.buildQuery = function () {
        if (queryObjs.length == 0)
            return console.log("queryObjs is empty")

        var matchCypher = "";
        var whereCypher = "";
        var returnCypher = "";
        var alphabet = "abcdefghijklmno"
        queryObjs.forEach(function (queryObj, index) {
            var letter = alphabet.charAt(index)
            if (index > 0)
                matchCypher += "-[r" + index + "]-"
            matchCypher += "(" + letter + ":" + queryObj.label + ")";

            if (queryObj.value && queryObj.value != "") {
                var where = ""
                if (queryObj.operator == "contains")
                    where = queryObj.property + "=~" + "'(?i).*" + queryObj.value.trim() + ".*'";
                else {
                    var value = queryObj.value;
                    if (!(/^-?\d+\.?\d*$/).test(value))//not number
                        value = "\"" + value + "\"";
                    where = queryObj.property + queryObj.operator + value + ".*'";
                }
                if (whereCypher.length > 0)
                    whereCypher += " and "
                whereCypher += " " + letter + "." + where + " "
            }
            if (queryObj.inResult) {
                if (returnCypher.length > 0)
                    returnCypher += ","
                returnCypher += letter
            }
        })
        if (whereCypher.length > 0)
            whereCypher = " where " + whereCypher;

        var cypher = " match " + matchCypher + " " + whereCypher + " return " + returnCypher + " limit " + Gparams.maxResultSupported;
        return cypher;
    }


    self.prepareDataset = function (neoResult) {
        var dataset = []
        var columns = [];
        var labelSymbols = [];
        var labels = [];
        neoResult.forEach(function (line) {// define columns and structure objects by line
            var lineObj = {};

            for (var key in line) {// each node type
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


    self.displayTable = function () {
        var tableDataset = [];
        var columns = self.currentDataset.columns;
        self.currentDataset.data.forEach(function (line) {
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
                        label: visjsNodeLabel,
                        title: visjsNodeLabel
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
                        width: 1

                    }
                    visjsData.edges.push(relObj)
                }
                previousSymbol = symbol;

            })
        })

        visjsGraph.draw("graphDiv", visjsData, {}, function (err, result) {
            var xx = err;
        })


    }

    return self;
})
()