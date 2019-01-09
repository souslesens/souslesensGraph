var searchMenu = (function () {
        var self = {};
        self.currentPanelIndex = 1;
        self.currentAction = null;
        self.selectedQuery = null;
        self.pathQuery = null;
        self.previousAction;
        self.dataTable = null;

        var previousAction = "";
        self.init = function (schema) {
            self.currentPanelIndex = 1;
            //   toutlesensController.initLabels(searchDialog_NodeLabelInput, true);
            $("#searchDialog_NodeLabelInput").val("");
            //  $("#searchDialog_NodeLabelInput").attr("size", 8);
            $("#searchDialog_propertySelect").append("<option selected='selected'>" + Schema.getNameProperty() + "</option>");
            $("#searchDialog_valueInput").keypress(function (event) {
                if (event.which == 13 || event.which == 9) {
                    //  advancedSearch.addClauseUI()
                }
            })

            self.initLabelDivs();
            $("#searchAccordion").accordion({});
            var tab = 1
            if (false && Object.keys(savedQueries).length > 0)
                tab = 0
            $("#searchAccordion").accordion("option", "active", tab);


        }

        self.resetQueryClauses = function () {
            $("#searchDialog_criteriaDiv").css('visibility', 'hidden');
            $("#searchNavDiv").css('visibility', 'hidden');
            $("#searchNavActionDiv").css('visibility', 'hidden');
            $(".searchDialog_NavButton").css('visibility', 'hidden');
            $(".selectLabelDiv").removeClass("selectLabelDivSelected")


            $("#searchDialog_valueInput").val();
            $('#searchDialog_valueInput').focus();
            //if(searchMenu.previousAction!="path" || pathSourceSearchCriteria)
            //
            advancedSearch.clearClauses();
            $("#searchDialog_propertySelect").val(Schema.schema.defaultNodeNameProperty)
        }

        self.onChangeSourceLabel = function (value, div) {
            $("#searchDialog_criteriaDiv").css('visibility', 'visible');
            $("#searchNavDiv").css('visibility', 'visible');
            $("#searchNavActionDiv").css('visibility', 'visible');
            $("#searchDialog_NextPanelButton").css('visibility', 'visible');
            $(".selectLabelDiv").removeClass("selectLabelDivSelected");
            $(div).addClass("selectLabelDivSelected");

       if(previousAction != 'path') {// reset recoding of saved queries except if choose target label
        savedQueries.resetCurrentSearchRun();
    }


            $("#searchDialog_NodeLabelInput").val(value);
            $("#searchDialog_valueInput").val();
            $('#searchDialog_valueInput').focus();
            //if(searchMenu.previousAction!="path" || pathSourceSearchCriteria)
            $("#searchDialog_NextPanelButton").css('visibility', 'visible');
            advancedSearch.clearClauses();
            //  self.resetQueryClauses()
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
            labels.forEach(function (label) {
                var color = nodeColors[label];
                str += ' <div class="selectLabelDiv" style="background-color: ' + color + '" onclick="searchMenu.onChangeSourceLabel(\'' + label + '\',this)">' + label + '</div>'
            })
            $("#advancedSearchNodeLabelsDiv").html(str).promise().done(function () {

                $(".selectLabelDiv").click(function (event) {
                    event.stopPropagation();
                    // Do something
                });
                var parentWidth = $("#advancedSearchNodeLabelsDiv").width() - 10;
                var x = 10;
                var y = 10;

                var yOffset;

                $(".selectLabelDiv").each(function (div) {

                    var xOffset = $(this).width();
                    if (!yOffset)
                        yOffset = $(this).height() + 10;

                    if ((x + xOffset + 10) > parentWidth) {
                        x = 10;
                        y += yOffset
                    }

                    $(this).css("top", y).css("left", x);
                    x += xOffset + 10;
                })
            })

        }

        self.clearCurrentLabel = function () {
            $(".selectLabelDiv").removeClass("selectLabelDivSelected");
            $("#searchDialog_propertySelect").val(Schema.schema.defaultNodeNameProperty)
            currentLabel = null;
            //   toutlesensController.dispatchAction("showSchema")

        }


        self.graphNeighboursWithLabels = function () {
            var tagetLabels = [];
            //  $('.advancedSearchDialog_LabelsCbx:checked').each(function () {
            $('.advancedSearchDialog_LabelsCbx:checked').each(function () {
                tagetLabels.push($(this).val())

            })
            var options = {targetNodesLabels: tagetLabels};
            self.setTargetWhereFilter();
            advancedSearch.searchNodes('matchStr', options, advancedSearch.graphNodesAndDirectRelations);
        }


        self.setTargetWhereFilter = function () {
            if ($("#neighboursWhere_propertySelect").val() == "")
                return;
            var targetWhereClause = $("#neighboursWhere_propertySelect").val() + ":" + $("#neighboursWhere_operatorSelect").val() + " " + $("#neighboursWhere_valueInput").val();

            targetWhereClause = advancedSearch.getWhereProperty(targetWhereClause, "m")
            toutlesensData.targetWhereFilter = targetWhereClause;
        }
        self.activatePanel = function (id) {
            if (id == "searchCriteriaDiv") {
                self.resetQueryClauses()
                searchMenu.currentPanelIndex == 1
            }
            var visibility = "visible";
            self.clearCurrentLabel();
            $(".searchPanel").each(function (index, value) {
                if (value.id == id) {
                    visibility = "visible";
                    self.currentPanelIndex = index
                }
                else
                    visibility = "hidden";
                $(this).css('visibility', visibility);
            });
        }
        self.previousPanel = function () {
            $("#searchDialog_newQueryButton").css('visibility', 'visible');
            self.currentPanelIndex += -1;
            if (self.currentPanelIndex == 0) {
                self.pathQuery = {};
                previousAction = null
                self.currentPanelIndex = 1;
                self.clearCurrentLabel();
            }


            if (previousAction == 'algorithms') {
                self.activatePanel("advancedSearchActionDiv");

                return;

            }
            if (previousAction == 'path') {
                self.currentPanelIndex = 1;

            }
            else if (self.currentPanelIndex == 1) {
                self.previousAction = null;
                self.resetQueryClauses()
                /*   $("#searchDialog_newQueryButton").css('visibility', 'hidden');
                   $("#searchDialog_previousPanelButton").css('visibility', 'hidden');
                   //  $("#searchDialog_ExecuteButton").css('visibility', 'hidden');
                   $("#searchDialog_NextPanelButton").css('visibility', 'hidden');
                   $("#searchCriteriaAddButton").css('visibility', 'hidden');*/

                self.resetQueryClauses()
            }
            else {
                $("#searchDialog_newQueryButton").css('visibility', 'visible');
                $("#searchDialog_NextPanelButton").css('visibility', 'visible');
            }
            self.showCurrentPanel();


        }

        self.nextPanel = function () {
            $("#searchDialog_newQueryButton").css('visibility', 'visible');
            if (self.previousAction == "path") {
                advancedSearch.searchNodes('matchObject', null, function (err, result) {
                    self.pathQuery.targetQuery = result;
                    var relationDistance = Schema.getLabelsDistance(self.pathQuery.sourceQuery.nodeLabel, self.pathQuery.targetQuery.nodeLabel);
                    if (!relationDistance)
                        relationDistance = 1;
                    previousAction == "executePath"
                    $("#searchDialog_pathDistanceInput").val(relationDistance);
                    self.activatePanel("searchDialog_pathParamsDiv");
                    $("#searchDialog_newQueryButton").css('visibility', 'visible');
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    $("#searchDialog_NextPanelButton").css('visibility', 'hidden');
                });

            }
            else {
                if (self.currentPanelIndex == 1) {
                    advancedSearch.addClauseUI();
                    $("#searchDialog_criteriaDiv").css('visibility', 'hidden');
                }

                self.currentPanelIndex += 1;
                $("#graphNeighboursAllOptionsCbx").prop("checked", false)


                self.showCurrentPanel();
            }
            $("#searchDialog_previousPanelButton").css('visibility', 'visible');
        }
        self.showCurrentPanel = function () {
            var visibility = "visible";

            $(".searchPanel").each(function (index, value) {
                if (index == self.currentPanelIndex)
                    visibility = "visible";
                else
                    visibility = "hidden";
                $(this).css('visibility', visibility);
            });


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
            $("#searchDialog_NextPanelButton").css('visibility', 'hidden');
            $("#searchDialog_ExecuteButton").css('visibility', 'hidden');

            if (option == 'path') {

                advancedSearch.searchNodes('matchStr', null, function (err, result) {
                    var matchObj = advancedSearch.matchStrToObject(result);
                    self.pathQuery = {sourceQuery: matchObj};
                    previousAction = "pathSourceSearchCriteria"
                    //  self.currentAction.name = "pathTargetSearchCriteria";
                    self.activatePanel("searchCriteriaDiv");
                    $("#searchDialog_previousPanelButton").css('visibility', 'hidden');
                    //  $("#searchDialog_ExecuteButton").css('visibility', 'visible');


                })
            }



           else if (option == "graphSomeNeighboursListLabels") {
                self.nextPanel();
                var currentLabel = $("#searchDialog_NodeLabelInput").val();
                self.setPermittedLabelsCbxs(currentLabel, "neighboursTypesDiv");
                $("#searchDialog_ExecuteButton").css('visibility', 'visible');


            }
            else if (option == "treeMapSomeNeighboursListLabels") {
                self.nextPanel();
                $("#graphNeighboursAllOptionsCbx").prop("checked", false)
                var currentLabel = $("#searchDialog_NodeLabelInput").val();
                self.setPermittedLabelsCbxs(currentLabel, "neighboursTypesDiv");
                $("#searchDialog_ExecuteButton").css('visibility', 'visible');


            }


            else if (option == 'treeNodes') {
                advancedSearch.searchNodes('matchStr', null, treeController.loadSearchResultIntree);
                $("#findTabs").tabs("option", "active", 1);


            }
            else if (option == 'tableNodes') {
                advancedSearch.searchNodes('matchStr', null, function (err, query) {
                    if (err)
                        return console.log(err);
                    if (!self.dataTable) {
                        self.dataTable = new myDataTable();
                    }
                    //    self.dataTable.loadNodes(self.dataTable, "graphDiv", query, {});
                    dialogLarge.load("htmlSnippets/dataTable.html", function () {
                        dialogLarge.dialog("open");
                        self.dataTable.loadNodes(self.dataTable, "dataTableDiv", query, {onClick: toutlesensController.graphNodeNeighbours}, function (err, result) {

                        })

                    })

                })

            }


            else if (option == 'graphNodes') {
                advancedSearch.searchNodes('matchStr', null, self.graphNodesOnly);

            }
            else if (option == 'graphNeighbours') {
                advancedSearch.searchNodes('matchStr', null, advancedSearch.graphNodesAndDirectRelations);


            }
            else if (option == 'algorithms') {
                advancedSearch.searchNodes('matchStr', null, function (err, result) {
                    var matchObj = advancedSearch.matchStrToObject(result);

                    previousAction = "algorithms"
                    algorithms.initDialog(matchObj.nodeLabel)
                    self.activatePanel("algorithmsDiv");
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    $("#searchDialog_newQueryButton").css('visibility', 'visible');

                })


            }

            else if (option == 'graphSimilars') {
                advancedSearch.searchNodes('matchStr', null, self.graphNodesAndSimilarNodes);
                // advancedSearch.graphOnly()
            }
            else if (option == 'tagCloud') {
                advancedSearch.addClauseUI()
                advancedSearch.searchNodes('matchStr', null, function (err, query) {
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
            else if (option == 'execute') {

                toutlesensController.setGraphMessage("Working...")
                eventsController.stopEvent = true;


                toutlesensController.setRightPanelAppearance(false);

                paintAccordion.accordion("option", "active", 1)

                // $("#tabs-analyzePanel").tabs("option", "active", 2);//highlight
                tabsAnalyzePanel.tabs("option", "active", 2);//highlight

                if (previousAction == 'path') {
                    var relationDistance = parseInt($("#searchDialog_pathDistanceInput").val());
                    var collapseGraph = $("#searchDialog_CollapseGraphCbx").prop("checked");
                    toutlesensData.matchStatement = "allShortestPaths( (n:" + self.pathQuery.sourceQuery.nodeLabel + ")-[*.." + relationDistance + "]-(m:" + self.pathQuery.targetQuery.nodeLabel + ") ) "
                    //      toutlesensData.matchStatement = "(n:" + self.pathQuery.sourceQuery.nodeLabel + ")-[r*" + relationDistance + "]-(m:" + self.pathQuery.targetQuery.nodeLabel + ")";
                    var where = self.pathQuery.sourceQuery.where;
                    if (self.pathQuery.targetQuery.where != "") {

                        if (where != "")
                            where += " and ";
                        where += self.pathQuery.targetQuery.where.replace(/n\./, "m.");
                    }
                    where += "  and ID(n)<>ID(m)"
                    toutlesensData.whereFilter = where;
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


                if (previousAction == 'graphSomeNeighboursListLabels') {
                    if ($("#graphNeighboursAllOptionsCbx").prop("checked")) {
                        advancedSearch.searchNodes('matchStr', null, self.graphNodesOnly);
                        $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                        return;
                    }


                    self.currentAction = "graphSomeNeighbours";
                    self.graphNeighboursWithLabels()
                    //  advancedSearch.searchNodes('matchStr', {targetNodesLabels:true}, self.graphNodesAndDirectRelations);
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                }


                if (previousAction == 'treeMapSomeNeighboursListLabels') {
                    self.currentAction = "treeMapSomeNeighbours";
                    var neighboursLabels = [];
                    $('.advancedSearchDialog_LabelsCbx:checked').each(function () {
                        neighboursLabels.push($(this).val());
                    });

                    advancedSearch.searchNodes('matchStr', {targetNodesLabels: neighboursLabels}, function (err, query) {
                        advancedSearch.graphNodesAndDirectRelations(err, query, treeMap.draw);
                        paint.initHighlight();
                        $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                        $("#searchDialog_PreviousPanelButton").css('visibility', 'visible');
                    });
                }

                if (previousAction == 'algorithms') {
                    advancedSearch.searchNodes('matchStr', null, function (err, query) {
                        algorithms.execute(query);
                        $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                        return;
                    })
                }


            }


            if (option != 'execute') {
                previousAction = option;
                self.previousAction = previousAction;
            }


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
                searchMenu.onSearchAction('execute')
            }
        }

        self.execCypherMatchStatement = function () {
            var cypher = $("#searchMenu_cypherInput").val();
            toutlesensData.executeCypher(cypher, function (err, result) {
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
)()