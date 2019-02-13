var searchNodes = (function () {
        var self = {};
        self.currentPanelId = null;
        self.currentAction = null;
        self.selectedQuery = null;
        self.pathQuery = null;
        self.previousAction;
        self.dataTable = null;
        self.searchPanels = [];
        self.searchPanels.index = 0;
        self.similarOptions = {};


        self.init = function (schema) {
            $("#searchNavActionDiv").width(rightPanelWidth - 50)
            $(".searchPanel").each(function () {
                self.searchPanels.push($(this).attr("id"))
            })

            context.queryObject.label = ""
            //  $("#searchDialog_NodeLabelInput").attr("size", 8);
            $("#searchDialog_propertySelect").append("<option selected='selected'>" + Schema.getNameProperty() + "</option>");
            $("#searchDialog_valueInput").keypress(function (event) {
                if (event.which == 13 || event.which == 9) {

                }
            })
            // buildPaths.reset();
            self.activatePanel("searchCriteriaDiv");
            self.currentPanelId = "searchCriteriaDiv";
            self.initLabelDivs();


        }


        self.setUIPermittedLabels = function (label) {
            if (!label) {
                $(".selectLabelDiv ").css("opacity", 1);
                return $(".selectLabelDiv ").css("visibility", "visible");


            }
            var opacityAllowed = 0.7;
            var opacityAll = 0.1;
            $(".selectLabelDiv ").css("visibility", "visible");
            var allowedLabels = Schema.getPermittedLabels(label, true, true);
            $(".selectLabelDiv ").each(function () {
                var thisLabel=$(this).html()
                console.log(thisLabel)
                if (false) {
                    if (allowedLabels.indexOf(thisLabel) < 0)
                        $(this).css("visibility", "hidden");
                    else
                        $(this).css("visibility", "visible");
                }
                if (true) {
                    if(label==thisLabel)
                        $(this).css("opacity", 1);
                    else if (allowedLabels.indexOf(thisLabel) < 0)
                        $(this).css("opacity", opacityAll);

                     else
                        $(this).css("opacity", opacityAllowed);
                }

            })
            self.configBooleanOperatorsUI();

        }

        self.resetQueryClauses = function () {
            $("#searchDialog_criteriaDiv").css('visibility', 'hidden');
            $("#searchNavDiv").css('visibility', 'hidden');
            $("#searchNavActionDiv").css('visibility', 'hidden');
            $(".searchDialog_NavButton").css('visibility', 'hidden');
            $(".selectLabelDiv").removeClass("selectLabelDivSelected")
            $(".selectLabelDiv ").css("opacity", 1);
            $("#searchDialog_booleanOperatorsDiv").css('visibility', 'hidden');

            $("#searchDialog_valueInput").val();
            $('#searchDialog_valueInput').focus();

            $(".selectLabelDiv ").css("visibility", "visible");
            $(".searchDialog_CriteriaDiv").remove();

            $("#searchDialog_propertySelect").val(Schema.schema.defaultNodeNameProperty)
            context.queryObject = {};
            context.initGraphContext();
            self.previousAction = "";
            self.configBooleanOperatorsUI();
        }


        self.setUpdateContextQueryObject = function () {
            var label = context.queryObject.label;
            if (!label)
                return;
            $("#searchDialog_criteriaDiv").css('visibility', 'visible');
            $("#searchNavDiv").css('visibility', 'visible');
            $("#searchNavActionDiv").css('visibility', 'hidden');
            $("#searchDialog_nextPanelButton").css('visibility', 'hidden');

            $(".selectLabelDiv").removeClass("selectLabelDivSelected");
            $("#selectLabelDiv_" + label).addClass("selectLabelDivSelected");

            $(".selectLabelDiv").css('visibility', 'hidden');
            $("#selectLabelDiv_" + label).css('visibility', 'visible');

            self.configBooleanOperatorsUI();
            if (searchDialog_propertySelect) ;
            filters.initProperty(null, label, searchDialog_propertySelect)

        }

        self.onChangeSourceLabel = function (value, clearContext) {


            if (self.previousAction != 'path') {// reset recoding of saved queries except if choose target label
                savedQueries.resetCurrentSearchRun();
            }

            if (clearContext) {
                context.queryObject = {}
                context.queryObject.label = value;
            }


            self.configBooleanOperatorsUI();


            $("#searchDialog_criteriaDiv").css('visibility', 'visible');
            $("#searchNavDiv").css('visibility', 'visible');
            $("#searchNavActionDiv").css('visibility', 'visible');
            // $("#searchDialog_nextPanelButton").css('visibility', 'visible');
            $(".selectLabelDiv").removeClass("selectLabelDivSelected");
            $("#searchDialog_buildPathUIButton").css('visibility', 'visible');
            $("#searchDialog_booleanOperatorsDiv").css('visibility', 'visible');


            $("#selectLabelDiv_" + value).addClass("selectLabelDivSelected");
            $("#searchDialog_valueInput").val();
            $('#searchDialog_valueInput').focus();
            //if(searchNodes.self.previousAction!="path" || pathSourceSearchCriteria)
            if (searchDialog_propertySelect)
                filters.initProperty(null, value, searchDialog_propertySelect);

        }

        self.configBooleanOperatorsUI = function (forceShowAndOr) {
            //   if (context.queryObject.nodeIds  || forceShowAndOr) {
            if ((context.queryObject.value && context.queryObject.value != "") || forceShowAndOr) {
                $("#searchDialog_booleanOperatorsAnd").css("visibility", "visible")
                $("#searchDialog_booleanOperatorsOr").css("visibility", "visible")
                $("#searchDialog_booleanOperatorsOnly").text("ONLY")
            }
            else {
                $("#searchDialog_booleanOperatorsAnd").css("visibility", "hidden")
                $("#searchDialog_booleanOperatorsOr").css("visibility", "hidden")
                $("#searchDialog_booleanOperatorsOnly").text("ADD")
            }
        }


        self.setPermittedLabelsCbxs = function (label, selectId) {
            var labelsCxbs = "<br><table style='text-align: left;background-color: #eee; width: 300px;margin-bottom: 15px;'>";
            var labels = Schema.getPermittedLabels(label, true, true);
            for (var i = 0; i < labels.length; i++) {
                var label2 = labels[i];//.replace(/^-/,"");
                labelsCxbs += "<tr><td><input type='checkbox' class='searchNodesDialog_LabelsCbx' name='searchNodesDialog_LabelsCbx' onclick='searchNodes.initNeighboursTargetWhere($(this))' value='" + label2 + "'></td><td>" + label2 + "</td></tr>"
            }
            labelsCxbs += "</table>";
            $("#" + selectId).html(labelsCxbs).promise().done(function () {

                $(".searchNodesDialog_LabelsCbx").bind("click", function (cbx) {// uncheck all cbx if a cbx is changed
                    var state = $(this).attr("checked");
                    $("#graphNeighboursAllOptionsCbx").prop("checked", false);


                })
                //your callback logic / code here
            });
            ;
        }

        self.initLabelDivs = function () {

            var labels = Schema.getAllLabelNames();
            labels.sort();
            var str = "";
            var parentWidth = $("#searchNodesNodeLabelsDiv").width() - 10;
            var parentTop = $("#searchNodesNodeLabelsDiv").css("top");
            labels.forEach(function (label) {
                var color = nodeColors[label];
                str += ' <div class="selectLabelDiv"   id="selectLabelDiv_' + label + '" style=" background-color: ' + color + '" onclick="searchNodes.onChangeSourceLabel(\'' + label + '\',true)">' + label + '</div>'
            })
            $("#searchNodesNodeLabelsDiv").html(str).promise().done(function () {

                $(".selectLabelDiv").click(function (event) {
                    event.stopPropagation();
                    // Do something
                });
            })

            //  $("#searchNodesNodeLabelsDiv").css("height",(labels.count*50/2));


        }

        self.clearCurrentLabel = function () {
            self.previousAction = "";
            $(".selectLabelDiv").removeClass("selectLabelDivSelected");
            $("#searchDialog_propertySelect").val(Schema.schema.defaultNodeNameProperty)
            currentLabel = null;
            //   toutlesensController.dispatchAction("showSchema")

        }


        self.activatePanel = function (id) {
            if (id == "searchCriteriaDiv") {
                self.resetQueryClauses();
                self.clearCurrentLabel();
                buildPaths.clear();
            }


            self.searchPanels.currentIndex = self.searchPanels.indexOf(id);
            $(".searchPanel").hide();
            $("#" + id).show();

            //  $("#searchNavDiv").toggle().toggle();
        }


        self.previousPanel = function () {
            $("#searchDialog_newQueryButton").css('visibility', 'visible');
            self.searchPanels.currentIndex -= 1;


            if (self.previousAction == 'buildPathUI') {
                buildPaths.draw();
                return;

            }
            if (self.previousAction == 'algorithms') {
                self.activatePanel("searchNodesActionDiv");
                return;

            }
            if (self.previousAction == 'path') {
                self.searchPanels.currentIndex = 1;

            }
            else if (self.currentPanelId == 1) {
                self.previousAction = null;
                self.resetQueryClauses()

            }
            else {
                $("#searchDialog_newQueryButton").css('visibility', 'visible');
                $("#searchDialog_nextPanelButton").css('visibility', 'visible');
            }
            self.activatePanel(self.searchPanels[self.searchPanels.currentIndex])


        }

        self.nextPanel = function () {

            $("#searchDialog_newQueryButton").css('visibility', 'visible');


            if (self.previousAction == "path") {
                searchNodes.setQueryObjectCypher(context.queryObject, function (err, result) {
                    self.pathQuery.targetQuery = result;
                    var relationDistance = Schema.getLabelsDistance(self.pathQuery.sourceQuery.label, self.pathQuery.targetQuery.label);
                    if (!relationDistance)
                        relationDistance = 1;
                    self.previousAction == "executePath"
                    $("#searchDialog_pathDistanceInput").val(relationDistance);
                    self.activatePanel("searchDialog_pathParamsDiv");
                    $("#searchDialog_newQueryButton").css('visibility', 'visible');
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    $("#searchDialog_nextPanelButton").css('visibility', 'hidden');
                });

            }
            else if (self.previousAction == "link") {
                buildPaths.executeQuery();


            }
            else {
                if (self.searchPanels.currentIndex == 0) {

                    searchNodes.setContextNodeQueryObjectFromUI("only", function () {


                    });

                }

                self.searchPanels.currentIndex += 1;
                $("#graphNeighboursAllOptionsCbx").prop("checked", false)


                self.activatePanel(self.searchPanels[self.searchPanels.currentIndex])

            }
            $("#searchDialog_previousPanelButton").css('visibility', 'visible');
        }


        self.onPropertyKeyPressed = function (input) {
            var ddd = "aaa"
            var xx = this;
        }

        self.onSearchAction = function (option) {
            searchNodes.filterLabelWhere = "";
            self.currentAction = option;
            if (option == '')
                return;

            $("#searchDialog_nextPanelButton").css('visibility', 'hidden');
            $("#searchDialog_ExecuteButton").css('visibility', 'hidden');

            if (option == 'path') {

                searchNodes.setQueryObjectCypher(context.queryObject, function (err, result) {

                    self.pathQuery = {sourceQuery: result};
                    self.previousAction = "pathSourceSearchCriteria"
                    //  self.currentAction.name = "pathTargetSearchCriteria";
                    self.activatePanel("searchCriteriaDiv");
                    $("#searchDialog_previousPanelButton").css('visibility', 'hidden');
                    $("#searchDialog_newQueryButton").css('visibility', 'visible');
                    //  $("#searchDialog_ExecuteButton").css('visibility', 'visible');


                })
            }
            else if (option == "graphNodes") {
                self.previousAction = 'graphNodes';
                self.execute();


            }


            else if (option == "graphSomeNeighboursListLabels") {
                self.nextPanel();
                var currentLabel = context.queryObject.label;
                self.setPermittedLabelsCbxs(currentLabel, "neighboursTypesDiv");
                $("#searchDialog_ExecuteButton").css('visibility', 'visible');


            }
            else if (option == "treeMapSomeNeighboursListLabels") {
                self.nextPanel();
                $("#graphNeighboursAllOptionsCbx").prop("checked", false)
                var currentLabel = context.queryObject.label;
                self.setPermittedLabelsCbxs(currentLabel, "neighboursTypesDiv");
                $("#searchDialog_ExecuteButton").css('visibility', 'visible');


            }


            else if (option == 'treeNodes') {
                searchNodes.setQueryObjectCypher(context.queryObject, treeController.loadSearchResultIntree);
                $("#findTabs").tabs("option", "active", 1);


            }
            else if (option == 'tableNodes') {
                self.previousAction = 'tableNodes';
                self.execute();


            }


            else if (option == 'algorithms') {
                searchNodes.setQueryObjectCypher(context.queryObject, function (err, result) {
                    self.previousAction = "algorithms"
                    //  algorithms.initDialog(matchObj.label)
                    algorithms.initDialog(context.queryObject.label)

                    self.activatePanel("algorithmsDiv");
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    $("#searchDialog_newQueryButton").css('visibility', 'visible');

                })


            }

            else if (option == 'graphSimilars') {
                searchNodes.setQueryObjectCypher(context.queryObject, self.graphNodesAndSimilarNodes);
                // searchNodes.graphOnly()
            }
            else if (option == 'tagCloud') {
                searchNodes.setContextNodeQueryObjectFromUI("only")
                searchNodes.searchNodes('matchStr', null, function (err, query) {
                    var payload = {match: query};
                    $.ajax({
                        type: "POST",
                        url: searchNodes.neo4jProxyUrl,
                        data: payload,
                        dataType: "json",
                        success: function (data, textStatus, jqXHR) {
                            savedQueries.addToCurrentSearchRun(query);

                            tagCloud.drawCloud(null, data);
                        }
                        , error: function (err) {
                            console.log(err);
                            $("#graphDiv").html("")
                        }
                    })
                });
            }
            self.previousAction = option;
        }


        self.onExecuteGraphQuery = function () {

            context.addToGraphContext({graphType: self.previousAction})

            eventsController.stopEvent = true;
            toutlesensController.openFindAccordionPanel(false);
            paintAccordion.accordion("option", "active", 0)
            tabsAnalyzePanel.tabs("option", "active", 2);//highlight
        }

        self.execute = function (action) {
            if (!action)
                action = self.previousAction;

            $("#toTextMenuButton").css("visibility", "visible");
            if (action != 'graphNodes')
                toutlesensController.setGraphMessage("Working...");

            self.onExecuteGraphQuery();


            if (action == 'tableNodes') {
                if (!self.dataTable)
                    self.dataTable = new myDataTable();

                var cypher = "MATCH (n) where " + searchNodes.getWhereClauseFromArray("_id", context.queryObject.nodeSetIds, "n") + ' RETURN n order by n.' + Schema.getNameProperty();
                dialogLarge.load("htmlSnippets/dataTable.html", function () {
                    dialogLarge.dialog("open");
                    self.dataTable.loadNodes(self.dataTable, "dataTableDiv", cypher, {onClick: toutlesensController.graphNodeNeighbours}, function (err, result) {

                    })


                })
            }

            if (action == 'graphNodes') {
                var cypher = "MATCH (n) where " + searchNodes.getWhereClauseFromArray("_id", context.queryObject.nodeSetIds, "n") + ' RETURN n ' + Schema.getNameProperty();
                //   Cypher.


            }

            if (action == 'graphSomeNeighboursListLabels') {

                var options = {useStartNodeSet: context.queryObject.nodeSetIds};

                if ($("#graphNeighboursAllOptionsCbx").prop("checked")) {// all neighbours
                    ;
                } else {// someNeighbours
                    var targetLabels = [];
                    $('.searchNodesDialog_LabelsCbx:checked').each(function () {
                        targetLabels.push($(this).val())
                    })
                    options.useEndLabels = targetLabels;

                    var targetNodeValue = $("#neighboursWhere_valueInput").val();
                    if (targetNodeValue != "") {

                        var queryobject = {
                            property: $("#neighboursWhere_propertySelect").val(),
                            operator: $("#neighboursWhere_operatorSelect").val(),
                            value: $("#neighboursWhere_valueInput").val()
                        }

                        options.whereFilters = [searchNodes.getWhereClauseFromQueryObject(queryobject, "m")];
                    }


                }
                $("#waitImg").css("visibility", "visible");
                toutlesensData.getNodeAllRelations(options, function (err, result) {
                    $("#waitImg").css("visibility", "hidden");
                    if (err) {
                        return console.log(err);
                    }

                    toutlesensController.displayGraph(result, {});
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    self.currentAction = "graphSomeNeighbours";


                })


            }


            else if (action == 'path') {
                var relationDistance = parseInt($("#searchDialog_pathDistanceInput").val());
                var collapseGraph = $("#searchDialog_CollapseGraphCbx").prop("checked");
                toutlesensData.matchStatement = "allShortestPaths( (n:" + self.pathQuery.sourceQuery.label + ")-[*.." + relationDistance + "]-(m:" + self.pathQuery.targetQuery.label + ") ) "
                //      toutlesensData.matchStatement = "(n:" + self.pathQuery.sourceQuery.label + ")-[r*" + relationDistance + "]-(m:" + self.pathQuery.targetQuery.label + ")";
                var where = self.pathQuery.sourceQuery.where;
                if (self.pathQuery.targetQuery.where != "") {

                    if (where != "")
                        where += " and ";
                    where += self.pathQuery.targetQuery.where.replace(/n\./, "m.");
                }
                where += "  and ID(n)<>ID(m)"
                context.cypherMatchOptions.sourceNodeWhereFilter = where;
                var options = {};
                options.hideNodesWithoutRelations = 1;
                if (collapseGraph)
                    options.clusterIntermediateNodes = true;
                toutlesensController.generateGraph(null, options, function (err, data) {
                    if (err)
                        return err;


                    self.previousAction = "graphPath";
                    $("#searchDialog_PreviousPanelButton").css('visibility', 'visible');
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    self.currentAction = "graphPath";
                })


            }


            if (action == 'treeMapSomeNeighboursListLabels') {
                self.currentAction = "treeMapSomeNeighbours";
                var neighboursLabels = [];
                $('.searchNodesDialog_LabelsCbx:checked').each(function () {
                    neighboursLabels.push($(this).val());
                });


                var options = {
                    useStartNodeSet: context.queryObject.nodeSetIds,
                    useStartLabels: [context.queryObject.label],
                    useEndLabels: neighboursLabels,
                }

                toutlesensData.getNodeAllRelations(options, treeMap.draw);
                paint.initHighlight();
                $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                $("#searchDialog_PreviousPanelButton").css('visibility', 'visible');


            }

            if (action == 'algorithms') {


                algorithms.execute(context.queryObject);
                $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                return;

            }


        }


        self.addLabelToPath = function () {

        }

        self.onGraphNeighboursAllOptionsCbx = function (cbx) {
            var state = $(cbx).prop("checked");
            $("#neighboursWhereDiv").hide()


            $('.searchNodesDialog_LabelsCbx').each(function () {
                $(this).prop("checked", state);

            })
            if (state) {
                state = "checked";
                searchNodes.execute()
            }
        }

        self.execCypherMatchStatement = function () {
            var cypher = $("#searchMenu_cypherInput").val();
            Cypher.executeCypher(cypher, function (err, result) {
                var xx = result
            })

        }

        self.initNeighboursTargetWhere = function (cbx) {
            $("#neighboursWhereDiv").show()
            var label = $(cbx).val();
            var props = Object.keys(Schema.schema.properties[label]);
            common.fillSelectOptionsWithStringArray(neighboursWhere_propertySelect, props, true)

        }

        /**
         *
         *
         * @param callback
         */


        // transform request in nodes ids stored in context.queryObject.where
        self.setContextNodeQueryObjectFromUI = function (booleanOperator, callback) {

            var value = $("#searchDialog_valueInput").val();


            $("#searchDialog_nextPanelButton").css('visibility', 'visible');
            $("#clearAllCreteriaButton").css("visibility", "visible");
            $("#searchDialog_SaveQueryButton").css("visibility", "visible")
            $("#searchDialog_Criteriatext").css("visibility", "visible");
            $("#searchDialog_newQueryButton").css('visibility', 'visible');
            $("#searchDialog_booleanOperatorsDiv").css('visibility', 'visible');


            var property = "";
            var operator = "";
            if (value != "") {
                property = $("#searchDialog_propertySelect").val();
                operator = $("#searchDialog_operatorSelect").val()
            }

            var booleanOperatorStr = booleanOperator || "";
            var text = (context.queryObject.label ? context.queryObject.label : "") + " " + property + " " + operator + " " + value;


            if ((booleanOperator != "and" && booleanOperator != "or")) {
                context.queryObject = {label: context.queryObject.label}
            }
            if (!context.queryObject.nodeIds) {
                context.queryObject = {
                    label: context.queryObject.label,
                    property: property,
                    operator: operator,
                    value: value,
                    text: text,
                    globalText: text
                }

            } else {
                if (!context.queryObject.subQueries)
                    context.queryObject.subQueries = [];
                context.queryObject.subQueries.push({
                    label: context.queryObject.label,
                    property: property,
                    operator: operator,
                    value: value,
                    text: text,
                    booleanOperator: booleanOperator,

                });
                var booleanOperatorStr = booleanOperator || "";
                if (booleanOperatorStr != "")
                    booleanOperatorStr += "<br>"
                context.queryObject.globalText += " <b>" + booleanOperatorStr + "</b> " + text

            }
            /*  if (booleanOperator && booleanOperator == "+") {
                  return;
              }*/


            searchNodes.setQueryObjectCypher(context.queryObject, function (err, queryObject) {

                $("#searchDialog_valueInput").val("");
                Cypher.executeCypher(queryObject.cypher, function (err, result) {
                    if (err)
                        return console.log(err);


                    if (booleanOperator && booleanOperator == "and") {
                        var newIds = [];
                        result.forEach(function (line) {
                            newIds.push(line.n._id);
                        })

                        function intersectArray(a, b) {
                            return a.filter(Set.prototype.has, new Set(b));
                        }

                        context.queryObject.nodeIds = intersectArray(context.queryObject.nodeIds, newIds)
                    } else {
                        if (!context.queryObject.nodeIds)
                            context.queryObject.nodeIds = [];
                        result.forEach(function (line) {
                            context.queryObject.nodeIds.push(line.n._id);
                        });
                    }
                    var foundIds = result.length;


                    /*   text += ": <b> " + foundIds + "nodes </b>"
                       $("#searchDialog_Criteriatext").append(" <div   class='searchDialog_CriteriaDiv' >" + text + "</div>")*/

                    if (callback)
                        return callback();

                });


            })
        }

        self.setQueryObjectCypher = function (queryObject, callback) {
            if (!queryObject)
                queryObject = {}

            if (!self.similarOptions)
                self.similarOptions = {}
            self.similarOptions.id = null;


            //if  no value consider that there is no property set
            if (queryObject.value == "")
                queryObject.property = "";

            queryObject.subGraph = subGraph;
            queryObject.limit = Gparams.jsTreeMaxChildNodes;
            queryObject.from = 0;


            var subGraphWhere = "";
            var returnStr = " RETURN n";
            var cursorStr = "";

            cursorStr += " ORDER BY n." + Gparams.defaultNodeNameProperty;
            if (queryObject.from)
                cursorStr += " SKIP " + queryObject.from;
            if (queryObject.limit)
                cursorStr += " LIMIT " + queryObject.limit;
            var labelStr = "";
            if (queryObject.label && queryObject.label.length > 0)
                labelStr = ":" + queryObject.label;


            var whereStr = self.getWhereClauseFromQueryObject(queryObject, "n");
            if (whereStr && whereStr != "")
                whereStr = " WHERE " + whereStr
            else
                whereStr = "";


            if (context.queryObject.subQueries) {
                context.queryObject.subQueries.forEach(function (suqQuery) {
                    var boolOp = ""

                    if (whereStr.length > 0)
                        boolOp = suqQuery.booleanOperator
                    whereStr += " " + boolOp + " " + self.getWhereClauseFromQueryObject(suqQuery, "n");
                })


            }
            var cypher = "MATCH (n" + labelStr + ")  " + whereStr + " RETURN n" + cursorStr;
            queryObject.cypher = cypher;
            return callback(null, queryObject);

        }


        self.getWhereClauseFromQueryObject = function (queryObject, nodeAlias) {


            var property = queryObject.property;
            var operator = queryObject.operator;
            var value = queryObject.value;

            if (!value || value == "")
                return null;





            var not = (operator == "notContains") ? "NOT " : "";
            if (operator == "!=") {
                operator = "<>"
            }


            else if (operator == "~" || operator == "contains" || operator == "notContains") {
                operator = "=~"
                // value = "'.*" + value.trim() + ".*'";
                value = "'(?i).*" + value.trim() + ".*'";
            }
            else {
                //if ((/[\s\S]+/).test(value))
                if (!(/^-?\d+\.?\d*$/).test(value))//not number
                    value = "\"" + value + "\"";
            }
            var propStr = "";


            if (property == "any")
                propStr = "(any(prop in keys(n) where n[prop]" + operator + value + "))";

            else {
                propStr = not + nodeAlias + "." + property + operator + value.trim();
            }
            return propStr;

        }

        self.getWhereClauseFromArray = function (property, _array, nodeSymbol) {
            var array;
            if (!nodeSymbol)
                nodeSymbol = "n";
            if (typeof _array == "string")
                array = _array.split(",");
            else
                array = _array;

            var query = nodeSymbol + "." + property + " in ["
            if (property == "_id")
                query = "ID(n) in ["
            var quote = "";
            for (var i = 0; i < array.length; i++) {
                if (i > 0 && i < array.length)
                    query += ","
                else if ((typeof array[i] === 'string'))
                    var quote = "\"";
                query += quote + array[i] + quote;
            }
            query += "] ";
            return query;
        }


        self.searchInElasticSearch = function (word, label, callback) {

            word += "*";
            var payload = {
                elasticQuery2NeoNodes: 1,
                queryString: word,
                index: subGraph.toLowerCase(),
                resultSize: Gparams.ElasticResultMaxSize
            }

            $.ajax({
                type: "POST",
                url: "../../../neo2Elastic",
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    if (data.length >= Gparams.ElasticResultMaxSize) {
                        $("#searchResultMessage").html("cannot show all data : max :" + Gparams.ElasticResultMaxSize);
                    }
                    else {
                        $("#searchResultMessage").html(data.length + " nodes found");
                    }
                    return treeController.loadTreeFromNeoResult("treeContainer", data, function (jsTree) {
                        var xx = jsTree;
                        setTimeout(function () {


                            $('.jstree-leaf').each(function () {
                                var id = $(this).attr('id');
                                var text = $(this).children('a').text();
                                for (var i = 0; i < data.length; i++) {
                                    var properties = data[i].n.properties;
                                    //   console.log(id+"-"+text);
                                    if (properties[Gparams.defaultNodeNameProperty] == text) {
                                        for (var key in properties) {
                                            if (properties[Gparams.defaultNodeNameProperty].toLowerCase().indexOf(word0) > -1)
                                                continue;
                                            if (properties[key] && typeof properties[key] != "object" && properties[key].indexOf && properties[key].toLowerCase().indexOf(word0) > -1) {
                                                var xx = key;
                                                var yy = properties[key]
                                                //  console.log(xx+"-"+yy);
                                                //$("#"+treeController.jsTreeDivId).jstree().create_node(id ,  { "id" : (id+"_"+key), "text" : ("<span class='jstreeWordProp'">+xx+":"+yy+"</span>")}, "last", function(){
                                                $("#" + treeController.jsTreeDivId).jstree().create_node(id, {
                                                    "id": (id + "_" + key),
                                                    "text": (xx + ":" + yy),
                                                    "type": "prop"
                                                }, "last", function () {


                                                });
                                            }
                                        }
                                    }
                                }

                            });
                            $("#" + treeController.jsTreeDivId).jstree("open_all");
                        }, 1000)
                    });
                }, error: function (err) {
                    return callback(err)
                }
            });
        }

        return self;
    }
)
()