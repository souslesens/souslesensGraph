var complexQueries = (function () {
    var self = {};
    self.currentDataset;
    var currentDivIndex=-1;
    var globalHtml = "<div class='complexQueries'>";
    var queryObjs = [];


    self.addNodeQuery = function (queryObj) {
        var index = queryObjs.length;
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


        var html = "<div id='complexQuery_nodeDiv_" + index + "' class=' complexQueries-nodeDiv " + classInResult +"'  onclick='self.setNodeDivIndex("+index+")'>" +
            " <div class='complexQueries-partDiv' style='background-color: " + color + "'><b>Label : " + queryObj.label + "</b></div>" +
            "<div class='complexQueries-partDiv'> Condition : " + queryText + "</div>" +
            " <div class='complexQueries-partDiv'> <button onclick='complexQueries.includeInResult(" + index + ")'>in result</button> </div>" +
            "<button onclick='complexQueries.removeQueryObj(" + index + ")'>X</button>" +

            "</div>"


        return html;


    }


    self.setNodeDivIndex=function(index){
        currentDivIndex=index;
    }
    self.removeQueryObj = function (index) {
        queryObjs.splice(index, 1)
        self.draw();

    }

    self.includeInResult = function (index) {
        if (!queryObjs[index].inResult) {
            $("#complexQuery_nodeDiv_" + index).addClass("complexQueries-nodeInResultDiv");
            queryObjs[index].inResult = true;
        } else {
            $("#complexQuery_nodeDiv_" + index).removeClass("complexQueries-nodeInResultDiv");
            queryObjs[index].inResult = false;
        }
    }
    self.clear = function () {
        queryObjs = [];
        self.draw();
        currentDivIndex=-1
    }
    self.reset = function () {
        queryObjs = [];
        $("#graphDiv").html("");
        currentDivIndex=-1
    }
    self.executeQuery = function () {
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
                html += "<button onclick='complexQueries.displayTable()'>table or stat</button>" +
                    "<button onclick='complexQueries.displayGraph()'>Graph</button>";


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
        neoResult.forEach(function (line) {// define columns and structure objects by line
            var lineObj = {}
            for (var key in line) {// each node type
                var props = line[key].properties;
                for (var keyProp in props) {
                    if (columns.indexOf(keyProp) < 0) {
                        columns.push(keyProp);
                    }
                }
                props.neoId = line[key]._id;
                props.labelNeo = line[key].labels[0]
                var obj = {
                    id: line[key]._id,
                    neoAttrs: props,
                    label: props.labelNeo
                }
                lineObj[key] = obj;

            }
            dataset.push(lineObj)

        })
        return {columns: columns, data: dataset};


    }


    self.displayTable = function () {
        var tableDataset = [];
        var columns = self.currentDataset.columns;
        self.currentDataset.data.forEach(function (line) {
            for (var nodeKey in line) {
                var datasetLine = {};
                columns.forEach(function (col) {
                    var value = line[nodeKey].neoAttrs[col];
                    if (!value)
                        value = "";
                    datasetLine[col] = value;
                })
                tableDataset.push(datasetLine);
            }


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


    }

    return self;
})
()