var buildPaths = (function () {
    var self = {};
    self.currentDataset;
    var currentDivIndex = -1;
    var alphabet = "abcdefghijklmno";
    var currentSetType;

    self.queryObjs = [];
    self.isEditing = false;
    self.currentCypher = "";


    var cardCliked = false;
    var stopExpand = false;

    var globalHtml = "";

    self.init = function () {
        var globalHtmlButtons = "</div>" +
            "<div style='width: 100%;'><textarea id='buildPaths_cypherTA' onchange='buildPaths.cypher=$(this).val();' rows='2' style='width: 100%;background: #ede4d4;visibility: hidden' ></textarea><br></div>" +
            "<div style=' justify-content: center;display: flex;flex-direction: row'></div>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.executeQuery('count')>Count </button>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.executeQuery('dataTable')>Table</button>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.executeQuery('graph')>Graph </button>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.showStatsDialog('stats')>Stats</button>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.showMoreParams('set')>Create set </button>" +
            "<button  class='buildPathsButtons' onclick=buildPaths.showMoreParams('others')>Others... </button>" +
            "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
            "<button class='buildPathsButtons' onclick=buildPaths.editCypher()>Edit Cypher</button>" +
            "<button  class='buildPathsButtons' onclick= searchNodes.activatePanel('searchCriteriaDiv')>New query </button>" +

            "</div>"
            + "<br><div id='buildPaths_resultDiv'></div>" //+


        globalHtml = "<div class='buildPaths stopPropag' id='buildPaths_matchNodesWrapper'  onclick='buildPaths.onUnSelectNodeDiv($(this))' style='visibility:visible'>" +
            globalHtmlButtons +
            "<div style='width: 100%;visibility:hidden' id='buildPath_moreParamsDiv'> choose label <select class='buildPathsButtons' id='buildPaths_labelSelect'></select><button class='buildPathsButtons' onclick=buildPaths.executeQuery('set') >ok</button>" +
            "<span style='visibility:hidden' id='buildPath_moreParamsSetDiv'>set name<input class='buildPathsButtons' id='buildPaths_setName'> comment<textarea rows='1'cols='50' class='buildPathsButtons' id='buildPaths_setCommentTA'></textarea></textarea></span> </div>" +


            "</div>"


    }


    self.show = function (booleanOperator) {
        self.isEditing = true;


        if (context.queryObject.nodeSetIds) {// cas we use a nodeSet
            context.queryObject.nodeIds = context.queryObject.nodeSetIds;
            self.addQueryObjectDiv();
        } else if (booleanOperator) {
            searchNodes.setContextNodeQueryObjectFromUI(booleanOperator, function () {
                if (currentDivIndex > -1 && context.queryObject.label == self.queryObjs[currentDivIndex].label) {
                    // updateNodeQuery
                    self.updateQueryDiv(currentDivIndex, context.queryObject);
                    //   searchNodes.setUpdateContextQueryObject();
                }
                else {
                    self.addQueryObjectDiv();
                    self.onSelectNodeDiv(self.queryObjs.length - 1);
                }

            });
        }
        else {

            searchNodes.activatePanel("searchCriteriaDivFrombuildPaths")

        }

        // searchNodes.configBooleanOperatorsUI(true);


        $("#graphPopup").css("visibility", "hidden")
        $("#searchDialog_newQueryButton").css('visibility', 'visible');
        $("#searchDialog_nextPanelButton").css('visibility', 'hidden');


        $("#buildGraphDiv").html(globalHtml);
        $("#buildGraphDiv").css("visibility", "visible");


    }


    self.addQueryObjectDiv = function () {

        context.queryObject.inResult = true;
        self.queryObjs.push(JSON.parse(JSON.stringify(context.queryObject)));//clone
        self.drawNodeQueryDivs();
        //   self.onSelectNodeDiv(index);


    }

    self.updateQueryDiv = function (index, queryObject) {

        self.queryObjs[index] = queryObject;

        $("#buildPath_nodeConditionDiv_" + index).html(queryObject.globalText)
        globalHtml = $("#buildGraphDiv").html()

        self.currentCypher = self.buildQuery();
        $("#buildPaths_cypherTA").text(self.currentCypher)
        var maxStr = "";
        if (queryObject.nodeIds.length >= Gparams.listDisplayLimitMax)
            maxStr = ">"
        var queryCountNodes = "<b>" + maxStr + queryObject.nodeIds.length + " nodes" + "</b>";
        $("#buildPath_resultCountDiv_" + index).html(queryCountNodes);
        searchNodes.setUIPermittedLabels(queryObject.label);


    }


    self.drawNodeQueryDivs = function (withButtons) {
        var html = ""
        self.queryObjs.forEach(function (queryObject, index) {
            html += self.getRelDivHtml(index);
            html += self.getNodeDivHtml(queryObject, index);
        })


        if (globalHtml == "") {
            self.init()
            $("#buildGraphDiv").html(globalHtml);
        }
        $("#buildPaths_matchNodesWrapper").html(html);
        globalHtml = $("#buildGraphDiv").html();
        self.currentCypher = self.buildQuery();
        $("#buildPaths_cypherTA").text(self.currentCypher)

    }

    self.getNodeDivHtml = function (queryObject, index) {
        var queryText = queryObject.text;
        var maxStr = ""
        if (queryObject.nodeIds.length >= Gparams.listDisplayLimitMax)
            maxStr = ">"
        var queryCountNodes = "<b>" + maxStr + queryObject.nodeIds.length + " nodes" + "</b>";

        var color = context.nodeColors[queryObject.label];
        var classInResult = "";
        if (queryObject.inResult)
            classInResult = " buildPaths-nodeInResultDiv";


        var html = "<div id='buildPath_nodeDiv_" + index + "' class=' buildPaths-nodeDiv  stopPropag" + classInResult + "'  onclick='buildPaths.onSelectNodeDiv(" + index + ")'>" +
            " <div class='buildPaths-partDiv' style='background-color: " + color + "'><b>" + queryObject.label + "</b></div>" +
            "<div id='buildPath_nodeConditionDiv_" + index + "' class='buildPath-nodeConditionDiv buildPaths-partDiv'> " + queryText + "</div>" +
            "<div id='buildPath_resultCountDiv_" + index + "' class='buildPath-resultCountDiv buildPaths-partDiv'> " + queryCountNodes + "</div>" +
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

    self.getRelDivHtml = function (index) {
        if (index == 0)
            return "";
        var startLabel = self.queryObjs[index - 1].label;
        var endLabel = self.queryObjs[index].label;
        var permittedRels = Schema.getPermittedRelations(startLabel, "both");
        var rels = [];
        var relTypes = [];
        permittedRels.forEach(function (rel) {
            if (rel.endLabel == endLabel || rel.startLabel == endLabel) ;

            rels.push(rel)
            relTypes.push(rel.type)
        })


            searchRelations.setEdgeColors(relTypes)
        self.queryObjs[index].incomingRelation = {
            candidates: rels,
            selected: null
        }


        var html = "<div id='buildPath_relDiv_" + index + "' class=' buildPaths-relDiv  stopPropag '  onclick='buildPaths.onRelDivClick(" + index + ")' >" +
            // " <div class='buildPaths-relPartDiv' style='display: flex;margin: 2px'><i>" + rels[0].name + "</i>" +//
            // "<input type=\"image\" height=\"15px\" src=\"images/filter.png\" onclick='buildPaths.onRelFilterClick(" + index + ")'></div>" +//
            "<div id='buildPath_relConditionsDiv_" + index + "' class=' buildPaths-relConditionDiv  stopPropag' ><-></div>" +
            "</div>"


        /*  if (rels.length > 1) {// choose witch relation**************!!!
              self.onRelDivClick(index);


          }*/

        return html;


    }

    self.onRelDivClick = function (index) {
        $("#dialog").load("htmlSnippets/searchRelationsDialog.html", function () {
            dialog.dialog("open");

            dialog.dialog({title: "Relation conditions"});
            self.queryObjs.selectedIndex = index;
            searchRelations.initDialog(self.queryObjs[index].incomingRelation.candidates)


        })
    }

    self.updateRelation = function (relation) {
        self.queryObjs[self.queryObjs.selectedIndex].incomingRelation.selected = relation;
        dialog.dialog("close");
        var html = relation.name + "<br>" + relation.queryObject.text;
        $("#buildPath_relConditionsDiv_" + self.queryObjs.selectedIndex).html(html);

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
        $('#buildPaths_cypherTA').val(self.currentCypher)
    }
    self.onUnSelectNodeDiv = function () {
        self.currentDivIndex = -1
        if (cardCliked) {
            cardCliked = false;
            return;

        }
        currentDivIndex = -1;
        var index = self.queryObjs.length - 1;
        var label = null;
        if (index > -1)
            label = self.queryObjs[index].label;

        searchNodes.resetQueryClauses();
        searchNodes.setUIPermittedLabels(null);


        $(".buildPaths-nodeDiv ").removeClass("buildPaths-nodeDivSelected")
        $("#mainAccordion").accordion("option", "active", 0);
        $("#searchDialog_booleanOperatorsDiv").css('visibility', 'hidden');


    }
    self.onSelectNodeDiv = function (index) {
        currentDivIndex = index;
        if (self.queryObjs[index].type && self.queryObjs[index].type.indexOf("nodeSet") == 0)
            return;

        $(".buildPaths-nodeDiv ").removeClass("buildPaths-nodeDivSelected")
        $("#buildPath_nodeDiv_" + index).addClass("buildPaths-nodeDivSelected")
        $(".selectLabelDiv").css("visibility", "visible");
        context.queryObject = self.queryObjs[index];


        $("#mainAccordion").accordion("option", "active", 0);
        $("#searchDialog_booleanOperatorsDiv").css('visibility', 'visible');
        searchNodes.setUIPermittedLabels(context.queryObject.label);
        searchNodes.setUpdateContextQueryObject();
        cardCliked = true;
        /* if  (event && typeof event !== 'undefined')
           event.stopPropagation()*/
        //   (typeof event !== 'undefined')
        //  event.stopPropagation()
        /*     if(window.event)
                 window.event.stopPropagation();*/


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
            $("#buildPath_nodeDiv_" + index).addClass("buildPaths-nodeInResultDiv");
            self.queryObjs[index].inResult = true;
            $(("#buildPaths_inResultButton")).html('Not in Result')
        } else {
            $("#buildPath_nodeDiv_" + index).removeClass("buildPaths-nodeInResultDiv");
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
        self.currentCypher = "";
        $("#buildGraphDiv").html("")
        //  $("#buildPaths_matchNodesWrapper").html("")
        globalHtml = ""


    }
    self.showMoreParams = function (type) {
        currentSetType = type;
        var labels = [];
        self.queryObjs.forEach(function (queryObject, index) {
            labels.push({label: (queryObject.label + "-" + index), index: index})
        })
        if (labels.length > 1)
            common.fillSelectOptions(buildPaths_labelSelect, labels, "label", "index", true)
        else {
            common.fillSelectOptions(buildPaths_labelSelect, labels, "label", "index", false);
            $("#buildPaths_labelSelect").val(labels[0].index)

        }


        if (type == "others" || type == "set") {
            $("#buildPath_moreParamsDiv").css("visibility", "visible")
            if (type == "set")
                $("#buildPath_moreParamsSetDiv").css("visibility", "visible")
            else
                $("#buildPath_moreParamsSetDiv").css("visibility", "hidden")


        }
    }
    /*  self.reset = function () {
          self.queryObjs = [];
          $("#buildPaths_matchNodesWrapper").html("");
          currentDivIndex = -1
      }*/


    self.checkQueryExceedsLimits = function () {
        var ok = true;
        var cartesianProduct = 1
        self.queryObjs.forEach(function (line) {
            if (line.nodeIds)
                cartesianProduct *= line.nodeIds.length
            else if (line.nodeSetIds)
                cartesianProduct *= line.nodeIds.length

        })
        var amount
        if (self.queryObjs.length > 1)
            var amount = Math.pow(cartesianProduct, 1 / (self.queryObjs.length - 1))
        if (amount > 1000000)
            return true;
        return false;

    }
    self.executeQuery = function (type, callback) {

        if (false && self.checkQueryExceedsLimits())
            return alert("query too large. put  conditions on nodes or relations")

        $("#searchDialog_previousPanelButton").css('visibility', 'visible');
        var countResults = self.countResults();
        /* if (countResults == 0) {
             return alert("you must least include on label in return clause of the query")
         }*/
        if (!currentSetType) {
            $("#buildPath_moreParamsDiv").css('visibility', 'hidden')
        }
        self.currentCypher = self.buildQuery(type);
        $('#buildPaths_cypherTA').val(self.currentCypher);

        Cypher.executeCypher(self.currentCypher, function (err, result) {

            if (err) {
                console.log("ERROR " + self.currentCypher)
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
                return buildPaths.displayTable(callback);
            }
            else if (type == "graph") {
                $("#buildPaths_resultDiv").html(+result.length + " pathes found");
                self.currentDataset = self.prepareDataset(result);
                return buildPaths.displayGraph(callback);
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
                    if (!name || name == "")
                        return alert('enter set name')
                    var comment = $("#buildPaths_setCommentTA").val();
                    if (!comment)
                        comment = ""
                    nodeSets.create(name, queryObj.label, comment, self.currentCypher, result[0].setIds, function (err, resultSet) {
                        var message = "";
                        if (err)
                            message = "ERROR " + err;
                        else
                            message = "Set " + name + "created :" + result[0].setIds.length + " nodes"
                        $("#buildPaths_resultDiv").html(message)

                    })

                }
                else if (currentSetType == "others") {
                    context.queryObject = queryObj;
                    context.queryObject.nodeSetIds = result[0].setIds;

                    self.expandCollapse()


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

    self.buildQuery = function (type, returnQueryObj) {
        if (self.queryObjs.length == 0)
            return console.log("self.queryObjs is empty")

        var cypherObj = {
            match: [],
            whereNode: [],
            whereRelation: [],
            with: [],
            return: [],
            distinct: []


        }


        self.queryObjs.forEach(function (queryObject, index) {
            var matchCypher = "";
            var whereCypher = "";
            var whereRelationCypher = "";


            var symbol = alphabet.charAt(index);
            queryObject.inResult = $("#buildPaths-inResultCbx_" + index).is(':checked');


            // set relation where
            var relType = "";
            if (queryObject.incomingRelation) {
                var relation = queryObject.incomingRelation.selected
                if (index > 0 && relation) {
                    relType = ":" + relation.type;

                    var queryRelObject = relation.queryObject;
                    if (queryRelObject.property == "numberOfRelations") {
                        cypherObj.with.push(queryRelObject);
//with n,count(r) as cnt  MATCH (n:personne)-[r]-(m:communaute) where cnt>3  return n,m
                    }
                    else if (queryRelObject.value != "") {
                        var withStr = searchNodes.getWhereClauseFromQueryObject(queryRelObject, symbol)
                        cypherObj.whereRelation.push(withStr)


                    }
                }
            }

            if (index == 0) {
                matchCypher = "(" + symbol + ":" + queryObject.label + ")";
            } else {

                matchCypher += "-[r" + index + relType + "]-"
                matchCypher += "(" + symbol + ":" + queryObject.label + ")";
                cypherObj.return.push("r" + index);
            }


            if (queryObject.nodeSetIds) {//nodeSet
                whereCypher += "id(" + symbol + ") in [" + queryObject.nodeSetIds.toString() + "]";
            }
            else if (queryObject.value && queryObject.value != "") {

                whereCypher += searchNodes.getWhereClauseFromQueryObject(queryObject, symbol);
            }
            if (queryObject.subQueries) {
                queryObject.subQueries.forEach(function (suqQuery) {
                    if (suqQuery.value && suqQuery.value != "") {
                        whereCypher += " " + suqQuery.booleanOperator + " " + searchNodes.getWhereClauseFromQueryObject(suqQuery, symbol);
                    }
                })
            }


            if (queryObject.inResult) {
                cypherObj.return.push(symbol)
                cypherObj.distinct.push("ID(" + symbol + ")")
            }

            if (subGraph)
                cypherObj.whereNode.push(symbol + ".subGraph='" + subGraph + "'")


            cypherObj.match.push(matchCypher)
            cypherObj.whereNode.push(whereCypher)


            cypherObj.whereRelation.push(whereRelationCypher)


        })


        function concatClauses(clausesArray, sep) {
            var str = "";
            clausesArray.forEach(function (clause, index) {
                if (clause != "") {
                    if (index > 0 && sep != "") {
                        str += " " + sep + " "
                    }
                    str += clause
                }
            })
            return str;
        }

        cypherObj.match.cypher = concatClauses(cypherObj.match, "")


        cypherObj.whereNode.cypher = concatClauses(cypherObj.whereNode, "AND");
        if (cypherObj.whereNode.cypher.length != "")
            cypherObj.whereNode.cypher = " WHERE " + cypherObj.whereNode.cypher;

        cypherObj.whereRelation.cypher = concatClauses(cypherObj.whereRelation, "AND")
        if (cypherObj.whereRelation.cypher != "") {
            if (cypherObj.whereNode.cypher == "")
                cypherObj.whereRelation.cypher = " WHERE " + cypherObj.whereRelation.cypher;
            else
                cypherObj.whereRelation.cypher = " AND " + cypherObj.whereRelation.cypher;

        }


        cypherObj.return.cypher = concatClauses(cypherObj.return, ",")
        cypherObj.distinct.cypher = concatClauses(cypherObj.distinct, "+\"-\"+")


// return clause
        if (type == "count") {
            cypherObj.return.cypher = "count(a) as cnt";
            cypherObj.distinct.cypher = "";
        }
        else if (type == "set") {
            var index = $("#buildPaths_labelSelect").val();
            var symbol = alphabet.charAt(index);
            cypherObj.return.cypher = "collect(ID(" + symbol + ")) as setIds";
            cypherObj.distinct.cypher = "";
        }
        else {
            cypherObj.distinct.cypher = "DISTINCT(" + cypherObj.distinct.cypher + ") as distinctIds,";// pour supprimer les doublons

        }


        var cypher = "";
        if (cypherObj.with.length == 0) {// without with clause

            cypher = " MATCH p=(" + cypherObj.match.cypher + ") " + cypherObj.whereRelation.cypher + cypherObj.whereNode.cypher + " RETURN " + cypherObj.distinct.cypher + cypherObj.return.cypher + " LIMIT " + Gparams.maxResultSupported;
        }
        else {//use of WITH : count relations for example...
            for (var key in withClauses) {

            }
        }
        if (returnQueryObj)
            return {
                match: cypherObj.match.cypher,
                where: cypherObj.whereNode.cypher,
                return: cypherObj.return.cypher,
                distinctWhere: cypherObj.distinct.cypher
            };
        return cypher;
    }


    //var union=   "match (a:personne)-[r1]-(b:tag)  with  a,count(b) as cntR  where  a.name=~'(?i).*art.*' and  cntR> 5 match(a)-[r]-(b2) return a , collect(id(b2)) as bx limit 100 union match (a:personne)-[r1]-(b:tag)  with  a,count(b) as cntR  where cntR<5 match(a)-[r]-(b2) return a,b2 as bx limit 100"

    self.prepareDataset = function (neoResult) {
        var dataset = {nodes: [], relations: []}
        var columns = [];
        var labelSymbols = [];
        var labels = [];
        var relTypes = [];
        var currentRel;
        neoResult.forEach(function (line, index) {// define columns and structure objects by line
            var lineObj = {};

            for (var key in line) {// each node type
                var subLine = line[key];
                if (key == "distinctIds")
                    continue;
                if (key.indexOf("r") == 0) {// relation
                    if (relTypes.indexOf(subLine.type) < 0)
                        relTypes.push(subLine.type);
                    currentRel = {id: subLine._id, neoAttrs: subLine.properties, type: subLine.type};

                }
                else {

                    if (labelSymbols.indexOf(key) < 0)
                        labelSymbols.push(key);

                    var props = subLine.properties;
                    for (var keyProp in props) {
                        if (columns.indexOf(keyProp) < 0) {
                            columns.push(keyProp);
                        }
                    }
                    props.neoId = subLine._id;
                    props.labelNeo = subLine.labels[0];
                    if (labels.indexOf(props.labelNeo) < 0)
                        labels.push(props.labelNeo);
                    var obj = connectors.getVisjsNodeFromNeoNode(subLine, false)
                    obj.incomingRelation = currentRel;
                    lineObj[key] = obj;


                }
                dataset.nodes.push(lineObj)
            }

        })
        return {columns: columns, data: dataset, labelSymbols: labelSymbols, labels: labels, relTypes: relTypes};


    }
    self.expandCollapse = function (expand) {
        if (expand) {
            stopExpand = false;
            return;
        }
        else
            stopExpand = true;

        if ($("#buildGraphDiv").html() == "" || expand) {
            $("#buildGraphDiv").html(globalHtml);
            $("#BIlegendDiv").css("visibility", "hidden")
        } else {
            $("#buildGraphDiv").html("");
        }


    }


    self.displayTable = function (callback) {

        function getConnections(line) {
            var connections = {}
            var nodeKeys = Object.keys(line);
            nodeKeys.forEach(function (key) {
                connections[key] = "";
                nodeKeys.forEach(function (key2, indexKey2) {
                    if (key2 != key) {
                        if (connections[key] != "")
                            connections[key] += ","
                        connections[key] += line[key2].neoAttrs[Schema.getNameProperty(line[key2].label)] + "[" + line[key2].labelNeo + "]"
                    }

                })
            })
            return connections;
        }

        //  self.expandCollapse();
        var tableDataset = [];
        var columns = self.currentDataset.columns;
        columns.push("neoId")
        self.currentDataset.data.nodes.forEach(function (line) {

            var connections = getConnections(line);
            for (var nodeKey in line) {

                var datasetLine = {};
                datasetLine["label"] = line[nodeKey].neoAttrs["labelNeo"];
                datasetLine["label"].neoId = line[nodeKey].id;
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


        //group all connections
        var datasetGroupedMap = {}
        tableDataset.forEach(function (line) {
            if (!datasetGroupedMap[line.id]) {
                datasetGroupedMap[line.id] = line
            } else if (line.connectedTo)
                datasetGroupedMap[line.id].connectedTo += "," + line.connectedTo

        })
        var datasetGroupedArray = [];
        for (var key in datasetGroupedMap) {
            datasetGroupedArray.push(datasetGroupedMap[key]);
        }


        datasetGroupedArray.sort(function (a, b) {
            if (a.label > b.label) {
                return 1;
            }
            if (a.label < b.label) {
                return -1;
            }
            return 0;

        })


        $("#dialog").load("htmlSnippets/exportDialog.html", function () {
            dialog.dialog("open");


            dialog.dialog({title: "Select table columns"});
            exportDialog.init(datasetGroupedArray, true)


        })

    }

    self.defineAsSet = function () {
        var setName = prompt("set name ?")
        if (!setName || setName == "")
            return;

    }

    self.drawGraph = function (dataset, callback) {


        var visjsData = {nodes: [], edges: [], labels: []};
        visjsData.labels = dataset.labels;
        var uniqueNodes = []
        dataset.data.nodes.forEach(function (line, indexLine) {
            for (var nodeKey in line) {
                var nodeNeo = line[nodeKey];
                if (uniqueNodes.indexOf(nodeNeo.id) < 0) {
                    uniqueNodes.push(nodeNeo.id);

                    var visjsNode = nodeNeo;
                    visjsData.nodes.push(visjsNode);
                }
            }
            var previousSymbol;
            dataset.labelSymbols.forEach(function (symbol, indexSymbol) {
                if (indexSymbol > 0) {
                    var fromNode = line[previousSymbol];
                    var toNode = line[symbol];
                    var relNeo = line[symbol].incomingRelation;


                    var relObj = connectors.getVisjsRelFromNeoRel (fromNode.id, toNode.id, relNeo.id, relNeo.type, relNeo.neoAttrs, false, false);


                    visjsData.edges.push(relObj);
                    /*  if (!relsCount[indexSymbol])
                          relsCount[indexSymbol] = 0
                      relsCount[indexSymbol] += 1*/
                }
                previousSymbol = symbol;

            })
        })
        if (true || dataset.relTypes.length > 1) {
            searchRelations.setEdgeColors(dataset.relTypes)
            visjsGraph.drawLegend(visjsData.labels, dataset.relTypes);
        }
        else
            visjsGraph.drawLegend(visjsData.labels, null);
        filters.currentLabels = visjsData.labels;

        visjsGraph.draw("graphDiv", visjsData, {}, function () {
            if (callback)
                callback();
        });

    }
    self.displayGraph = function (callback) {
        self.expandCollapse()
        var relsCount = {};
        toutlesensController.setGraphMessage("Working...")
        self.drawGraph(self.currentDataset, function () {
            self.updateResultCountDiv(relsCount);

            if (callback)
                callback();

        });


        paint.initHighlight();
        common.fillSelectOptionsWithStringArray(filterDialog_NodeLabelInput, filters.currentLabels);
        $("#toTextMenuButton").css("visibility", "visible");
        searchNodes.onExecuteGraphQuery()

    }


    self.displayStats = function () {
        var limit = $("#searchDialog_AlgorithmsResultSize").val();
        var sourceIndex = $("#buildPath_StatSourceLabelSelect").val();
        var targetIndex = $("#buildPath_StatTargetLabelSelect").val();
        var queryObj = self.buildQuery("count", true);

        $("#dialog").dialog("close");
        var sourceSymbol = alphabet.charAt(sourceIndex);
        var targetSymbol = alphabet.charAt(targetIndex);
        var sourceLabel = self.queryObjs[sourceIndex].label;
        var targetLabel = self.queryObjs[targetIndex].label;
        var cypher = "Match " + queryObj.match + " " + queryObj.where + " return " + sourceSymbol + "." + Schema.getNameProperty() + " as name, count (" + targetSymbol + ") as cnt order by cnt desc limit " + limit;

        Cypher.executeCypher(cypher, function (err, result) {
                if (err) {
                    $("#buildPaths_resultDiv").val(err);
                    return console.log(err);
                }
                self.currentCypher = cypher;
                $("#buildPaths_cypherTA").val(cypher);

                if (result.length == 0) {
                    $("#waitImg").css("visibility", "hidden");
                    $("#buildPaths_resultDiv").val("No result");
                    return;
                }
                var statsData = [];
                result.forEach(function (line) {
                    statsData.push({name: line.name, count: line.cnt})
                });
                if (!toutlesensController.graphDataTable) {
                    toutlesensController.graphDataTable = new myDataTable();
                    toutlesensController.graphDataTable.pageLength = 30;
                }

                dialogLarge.load("htmlSnippets/dataTable.html", function () {
                    dialogLarge.dialog("open");
                    toutlesensController.graphDataTable.loadJsonInTable(null, "dataTableDiv", statsData, function (err, result) {
                    }, 2000)


                })

            }
        )
    }

    self.showStatsDialog = function () {
        $("#dialog").load("htmlSnippets/stats.html", function () {
            var labels = [];
            self.queryObjs.forEach(function (line, index) {
                labels.push({name: line.label, index: index})
            })
            common.fillSelectOptions(buildPath_StatSourceLabelSelect, labels, "name", "index", true)
            common.fillSelectOptions(buildPath_StatTargetLabelSelect, labels, "name", "index", true)

            $("#dialog").dialog("option", "title", "statistics");
            $("#dialog").dialog({modal: false});
            $("#dialog").dialog("open");
        });
    }

    self.updateResultCountDiv = function (relsCount) {
        /*  for(var key in relsCount){

              var html=$("#buildPath_resultCountDiv_1"+key).html();
              html="<span class=buildPath-relCount>"+relsCount[key]+"</span>/"+html
              $("#buildPath_resultCountDiv_1"+key).html(html)

          }*/

    }

    return self;
})
()