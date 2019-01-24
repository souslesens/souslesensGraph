var searchMenu = (function () {
        var self = {};
        self.currentPanelId = null;
        self.currentAction = null;
        self.selectedQuery = null;
        self.pathQuery = null;
        self.previousAction;
        self.dataTable = null;
        self.searchPanels = [];
        self.searchPanels.index = 0;


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
            // complexQueries.reset();
            self.activatePanel("searchCriteriaDiv");
            self.currentPanelId = "searchCriteriaDiv";
            self.initLabelDivs();


        }


        self.setUIPermittedLabels = function (label) {
            if (!label) {
                return $(".selectLabelDiv ").css("visibility", "visible");

            }
            var allowedLabels = Schema.getPermittedLabels(label, true, true);
            $(".selectLabelDiv ").each(function () {
                if (allowedLabels.indexOf($(this).html()) < 0)
                    $(this).css("visibility", "hidden");
                else
                    $(this).css("visibility", "visible");

            })
        }

        self.resetQueryClauses = function () {
            $("#searchDialog_criteriaDiv").css('visibility', 'hidden');
            $("#searchNavDiv").css('visibility', 'hidden');
            $("#searchNavActionDiv").css('visibility', 'hidden');
            $(".searchDialog_NavButton").css('visibility', 'hidden');
            $(".selectLabelDiv").removeClass("selectLabelDivSelected")


            $("#searchDialog_valueInput").val();
            $('#searchDialog_valueInput').focus();
            context.initGraphContext();
            self.previousAction = "";

            $(".selectLabelDiv ").css("visibility", "visible");
            context.queryObject = {};

            $("#searchDialog_propertySelect").val(Schema.schema.defaultNodeNameProperty)
        }

        self.onChangeSourceLabel = function (value, div) {
            $("#searchDialog_criteriaDiv").css('visibility', 'visible');
            $("#searchNavDiv").css('visibility', 'visible');
            $("#searchNavActionDiv").css('visibility', 'visible');
            $("#searchDialog_nextPanelButton").css('visibility', 'visible');
            $(".selectLabelDiv").removeClass("selectLabelDivSelected");
            $(div).addClass("selectLabelDivSelected");

            if (self.previousAction != 'path') {// reset recoding of saved queries except if choose target label
                savedQueries.resetCurrentSearchRun();
            }


            context.queryObject = {}
            context.queryObject.label = value;
            $("#searchDialog_valueInput").val();
            $('#searchDialog_valueInput').focus();
            //if(searchMenu.self.previousAction!="path" || pathSourceSearchCriteria)
            $("#searchDialog_nextPanelButton").css('visibility', 'visible');
            if (searchDialog_propertySelect) ;
            filters.initProperty(null, value, searchDialog_propertySelect);
            $("#searchDialog_propertySelect").val(Schema.schema.defaultNodeNameProperty)
        }


        self.setPermittedLabelsCbxs = function (label, selectId) {
            var labelsCxbs = "<br><table style='text-align: left;background-color: #eee; width: 300px;margin-bottom: 15px;'>";
            var labels = Schema.getPermittedLabels(label, true, true);
            for (var i = 0; i < labels.length; i++) {
                var label2 = labels[i];//.replace(/^-/,"");
                labelsCxbs += "<tr><td><input type='checkbox' class='advancedSearchDialog_LabelsCbx' name='advancedSearchDialog_LabelsCbx' onclick='searchMenu.initNeighboursTargetWhere($(this))' value='" + label2 + "'></td><td>" + label2 + "</td></tr>"
            }
            labelsCxbs += "</table>";
            $("#" + selectId).html(labelsCxbs).promise().done(function () {

                $(".advancedSearchDialog_LabelsCbx").bind("click", function (cbx) {// uncheck all cbx if a cbx is changed
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
            var parentWidth = $("#advancedSearchNodeLabelsDiv").width() - 10;
            var parentTop = $("#advancedSearchNodeLabelsDiv").css("top");
            labels.forEach(function (label) {
                var color = nodeColors[label];
                str += ' <div class="selectLabelDiv"   style=" background-color: ' + color + '" onclick="searchMenu.onChangeSourceLabel(\'' + label + '\',this)">' + label + '</div>'
            })
            $("#advancedSearchNodeLabelsDiv").html(str).promise().done(function () {

                $(".selectLabelDiv").click(function (event) {
                    event.stopPropagation();
                    // Do something
                });
            })

            //  $("#advancedSearchNodeLabelsDiv").css("height",(labels.count*50/2));


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
                self.resetQueryClauses()
            }
            var visibility = "visible";
            self.clearCurrentLabel();
            self.searchPanels.currentIndex = self.searchPanels.indexOf(id);
            $(".searchPanel").hide();
            $("#" + id).show();

            //  $("#searchNavDiv").toggle().toggle();
        }


        self.previousPanel = function () {
            $("#searchDialog_newQueryButton").css('visibility', 'visible');
            self.searchPanels.currentIndex -= 1;


            if (self.previousAction == 'link') {
                complexQueries.draw();
                return;

            }
            if (self.previousAction == 'algorithms') {
                self.activatePanel("advancedSearchActionDiv");
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
                advancedSearch.buildSearchNodeQueryFromUI(null, function (err, result) {
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
                complexQueries.executeQuery();


            }
            else {
                if (self.searchPanels.currentIndex == 0) {
                    searchMenu.setNodeQueryUI();
                    $("#searchDialog_criteriaDiv").css('visibility', 'hidden');
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
            advancedSearch.filterLabelWhere = "";
            self.currentAction = option;
            if (option == '')
                return;

            $("#searchDialog_nextPanelButton").css('visibility', 'hidden');
            $("#searchDialog_ExecuteButton").css('visibility', 'hidden');

            if (option == 'path') {

                advancedSearch.buildSearchNodeQueryFromUI(null, function (err, result) {

                    self.pathQuery = {sourceQuery: result};
                    self.previousAction = "pathSourceSearchCriteria"
                    //  self.currentAction.name = "pathTargetSearchCriteria";
                    self.activatePanel("searchCriteriaDiv");
                    $("#searchDialog_previousPanelButton").css('visibility', 'hidden');
                    $("#searchDialog_newQueryButton").css('visibility', 'visible');
                    //  $("#searchDialog_ExecuteButton").css('visibility', 'visible');


                })
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
                advancedSearch.buildSearchNodeQueryFromUI(null, treeController.loadSearchResultIntree);
                $("#findTabs").tabs("option", "active", 1);


            }
            else if (option == 'tableNodes') {
                self.previousAction = 'tableNodes';
                self.execute();


            }


            else if (option == 'algorithms') {
                advancedSearch.buildSearchNodeQueryFromUI(null, function (err, result) {
                    self.previousAction = "algorithms"
                    //  algorithms.initDialog(matchObj.label)
                    algorithms.initDialog(context.queryObject.label)

                    self.activatePanel("algorithmsDiv");
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    $("#searchDialog_newQueryButton").css('visibility', 'visible');

                })


            }

            else if (option == 'graphSimilars') {
                advancedSearch.buildSearchNodeQueryFromUI(null, self.graphNodesAndSimilarNodes);
                // advancedSearch.graphOnly()
            }
            else if (option == 'tagCloud') {
                advancedSearch.setNodeQueryUI()
                searchMenu.searchNodes('matchStr', null, function (err, query) {
                    var payload = {match: query};
                    $.ajax({
                        type: "POST",
                        url: advancedSearch.neo4jProxyUrl,
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


        self.execute = function () {

            {
                context.addToGraphContext({graphType: self.previousAction})
                toutlesensController.setGraphMessage("Working...")
                eventsController.stopEvent = true;
                toutlesensController.openFindAccordionPanel(false);
                paintAccordion.accordion("option", "active", 1)
                tabsAnalyzePanel.tabs("option", "active", 2);//highlight
            }


            if (self.previousAction == 'tableNodes') {
                if (!self.dataTable)
                    self.dataTable = new myDataTable();

                var cypher = "MATCH (n) where " + toutlesensData.getWhereClauseFromArray("_id", context.queryObject.nodeIds, "n") + ' RETURN n order by n.' + Schema.getNameProperty();
                dialogLarge.load("htmlSnippets/dataTable.html", function () {
                    dialogLarge.dialog("open");
                    self.dataTable.loadNodes(self.dataTable, "dataTableDiv", cypher, {onClick: toutlesensController.graphNodeNeighbours}, function (err, result) {

                    })


                })
            }

            if (self.previousAction == 'graphSomeNeighboursListLabels') {

                var options = {useStartNodeSet: context.queryObject.nodeIds};

                if ($("#graphNeighboursAllOptionsCbx").prop("checked")) {// all neighbours
                    ;
                } else {// someNeighbours
                    var targetLabels = [];
                    $('.advancedSearchDialog_LabelsCbx:checked').each(function () {
                        targetLabels.push($(this).val())
                    })
                    options.useEndLabels = targetLabels;

                    var targetNodeValue = $("#neighboursWhere_valueInput").val();
                    if (targetNodeValue != "") {

                        var targetWhereClause = $("#neighboursWhere_propertySelect").val() + ":" + $("#neighboursWhere_operatorSelect").val() + " " + $("#neighboursWhere_valueInput").val();
                        options.whereFilters = [advancedSearch.buildWhereClauseFromUI(targetWhereClause, "m")];
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


            else if (self.previousAction == 'path') {
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


            if (self.previousAction == 'treeMapSomeNeighboursListLabels') {
                self.currentAction = "treeMapSomeNeighbours";
                var neighboursLabels = [];
                $('.advancedSearchDialog_LabelsCbx:checked').each(function () {
                    neighboursLabels.push($(this).val());
                });

                advancedSearch.buildSearchNodeQueryFromUI({targetNodesLabels: neighboursLabels}, function (err, queryObject) {
                    advancedSearch.graphNodesAndDirectRelations(err, queryObject, treeMap.draw);
                    paint.initHighlight();
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    $("#searchDialog_PreviousPanelButton").css('visibility', 'visible');
                });
            }

            if (self.previousAction == 'algorithms') {
                advancedSearch.buildSearchNodeQueryFromUI(null, function (err, queryObject) {
                    algorithms.execute(queryObject.cypher);
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    return;
                })
            }


        }
// transform request in nodes ids stored in context.queryObject.where
        self.setNodeQueryUI = function (booleanOperator) {
            if (booleanOperator && booleanOperator == "")
                return;
            $("#searchDialog_nextPanelButton").css('visibility', 'visible');
            $("#clearAllCreteriaButton").css("visibility", "visible");
            $("#searchDialog_SaveQueryButton").css("visibility", "visible")
            $("#searchDialog_Criteriatext").css("visibility", "visible");


            var clauseText = "";
            var value = $("#searchDialog_valueInput").val();
            var property = "";
            var operator = "";
            if (value != "") {
                property = $("#searchDialog_propertySelect").val();
                operator = $("#searchDialog_operatorSelect").val()
            }
            var oldContextQueryObjectWhere = context.queryObject.where;
            context.queryObject = {
                label: context.queryObject.label,
                property: property,
                operator: operator,
                value: value

            }
            if (booleanOperator && booleanOperator != "+") {
                var oldClauseText = $("#searchDialog_Criteriatext").val();
                clauseText = oldClauseText + "<br>" + booleanOperator + "<br>" + clauseText;

                context.queryObject.where = "(" + oldContextQueryObjectWhere + ") " + booleanOperator + " ( " + context.queryObject.where + ")";
            }
            context.queryObject.text = (context.queryObject.label ? context.queryObject.label : "") + " " + $("#searchDialog_propertySelect").val() + " " + $("#searchDialog_operatorSelect").val() + " " + $("#searchDialog_valueInput").val();

            if (booleanOperator == "link") {
                self.previousAction = "link";
                complexQueries.addNodeQuery(context.queryObject);

                $("#searchDialog_newQueryButton").css('visibility', 'visible');
                $("#searchDialog_nextPanelButton").css('visibility', 'hidden');
                self.setUIPermittedLabels(context.queryObject.label);

                return;
            }


            advancedSearch.buildSearchNodeQueryFromUI(null, function (err, queryObject) {

                if (err)
                    return;
                $("#searchDialog_valueInput").val("");
                Cypher.executeCypher(queryObject.cypher, function (err, result) {

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

                    clauseText += ": <b> " + foundIds + "nodes </b>";

                    //  toutlesensData.getWhereClauseFromArray("_id", context.queryObject.nodeIds);


                });


                // clause.operator=operator;

            })
        }


        self.addLabelToPath = function () {

        }

        self.onGraphNeighboursAllOptionsCbx = function (cbx) {
            var state = $(cbx).prop("checked");
            $("#neighboursWhereDiv").hide()


            $('.advancedSearchDialog_LabelsCbx').each(function () {
                $(this).prop("checked", state);

            })
            if (state) {
                state = "checked";
                searchMenu.execute()
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


        return self;
    }
)
()