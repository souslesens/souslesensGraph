/**
 * Created by claud on 26/09/2017.
 */
/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/

var toutlesensController = (function () {
        var self = {};
        self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;
        self.rdfProxyUrl = "../../.." + Gparams.rdfProxyUrl;
        self.imagesRootPath = "../../.." + Gparams.imagesRootPath;


        self.currentActionObj = null;
        self.currentSource = "NEO4J";
        self.appInitEnded = false;
        self.currentRelationData = {};
        self.hasRightPanel = true;
        self.graphDataTable = null;


// http://graphaware.com/neo4j/2015/01/16/neo4j-graph-model-design-labels-versus-indexed-properties.html


        /**
         *
         *  generate a graph  (visjs by default)
         *
         *  builds cypher query
         *  draw the graph in the main panel
         *  set the interface for interaction
         *
         *
         *
         * @param id
         * @param options
         * @param callback
         * @returns {*}
         */




        self.generateGraph = function (id, options, callback) {
            if (!options)
                options = {};


            d3.select("#graphDiv").selectAll("svg").remove();
            $("#graphDiv").html("");
            //  $("#mainButtons").css("visibility", "hidden");
            $("#graphMessage").html("");
            $("#relInfoDiv").html("");
            $("#graphCommentDiv").html("");


            if ($("#keepFiltersCbx").prop("checked"))
                $("#graphMessage").html("");
            currentDataStructure = "flat";

            if (currentDisplayType == "FLOWER" || currentDisplayType == "TREE" || currentDisplayType == "TREEMAP")
                currentDataStructure = "tree";


            self.displayButtons = {
                "FLOWER": "treeFlowerButton",
                "TREEMAP": "treemapButton",
                "TREE": "treeButton",
                "CARDS": "cardsButton",
                "SIMPLE_FORCE_GRAPH": "graphButton",
                "SIMPLE_FORCE_GRAPH_BULK": "graphBulkButton",
                "FORM": "formButton",

            }

            $(".displayIcon").removeClass("displayIcon-selected");
            $("#" + self.displayButtons[currentDisplayType]).addClass("displayIcon-selected");

            if (currentDisplayType.indexOf("FORCE") > -1) {
                context.currentNode.id = null;
                if (Gparams.useVisjsNetworkgraph)
                    currentDisplayType = "VISJS-NETWORK"

            }
            else {
                if (!id) {
                    if (!context.currentNode.id && (currentDataStructure == "tree" || currentDisplayType == "CARDS" || currentDisplayType == "FORM")) {
                        self.setGraphMessage("A node must be selected for this graph type ", "stop");
                        if (callback)
                            return callback(null, {});
                        return;
                    }
                    id = context.currentNode.id;
                    if (!id && context.currentNode) {
                        id = context.currentNode.id;
                    }

                }
                else if (Array.isArray(id)) {
                    searchNodes.getWhereClauseFromArray("_id", id);
                }
                else
                    context.cypherMatchOptions.sourceNodeWhereFilter = "";
            }


            context.currentNode.id = id;


            if (options && options.applyFilters) {
                //   filters.setQueryFilters();
                /*  tabsAnalyzePanel.tabs("option", "disabled", []);
                  tabsAnalyzePanel.tabs("enable", 1);
                  tabsAnalyzePanel.tabs("enable", 2);*/


                // tabsAnalyzePanel.tabs("option", "disabled", []);
                tabsAnalyzePanel.tabs("enable", 1);
                tabsAnalyzePanel.tabs("enable", 2);
                // $("#tabs-analyzePanel").tabs("enable", 1);


                // $(".paintIcon").css("visibility","visible")
            }
            else {
                //  self.setGraphMessage("Too many relations to display the graph<br>filter by  relation or label types")
                //  output = "filtersDescription";
                $(".paintIcon").css("visibility", "hidden")
            }


//**************** options
            var addToPreviousQuery = false;
            if (options.addToPreviousQuery == true)
                addToPreviousQuery = true;

            options.applyFilters = true;

            if ($("#hideNodesWithoutRelationsCbx").prop("checked"))
                options.hideNodesWithoutRelations = true;


            if (!options.relationDepth) {
                var relationDepth = $("#depth").val();
                if (relationDepth === undefined)
                    options.relationDepth = Gparams.defaultQueryDepth;
                else
                    options.relationDepth = parseInt(relationDepth);
            }


            options.output = currentDisplayType;
            /*----------------------------------------------------------------------------------------------------*/
            $("#waitImg").css("visibility", "visible");
            $("#BIlegendDiv").html("");
            options.id = id;
            toutlesensData.getNodeAllRelations(options, function (err, data) {

                if (err) {
                    console.log(err);
                    self.setMessage("ERROR" + err);
                    if (callback)
                        return callback(err);
                    return;
                }


                if (data.length == 0) {

                    self.setGraphMessage("No  result");
                    $("#waitImg").css("visibility", "hidden");
                    tabsAnalyzePanel.tabs("enable", 0);
                    self.dispatchAction('nodeInfos');
                    self.openFindAccordionPanel(true);

                    if (callback) {
                        callback(err, data);
                    }
                    return;
                }

                $("#graphCommentDiv").append(data.length + " nodes and relations displayed ");
                if (data.length >= Gparams.maxResultSupported && currentDisplayType != "SIMPLE_FORCE_GRAPH_BULK") {

                    Gparams.maxResultSupported = Gparams.maxResultSupported;
                    //   return;

                }


                self.setResultGraphMessage(data.length);

                if (data.length > Gparams.maxNodesForRelNamesOnGraph) {
                    Gparams.showRelationNames = false;
                    $("#showRelationTypesCbx").removeAttr("checked");
                } else {
                    Gparams.showRelationNames = true;
                    $("#showRelationTypesCbx").prop("checked", "checked");
                }
                $("#visJsSearchGraphButton").css("visibility: visible");
                toutlesensData.prepareRawData(data, addToPreviousQuery, currentDisplayType, function (err, data, labels, relations) {

                    self.openFindAccordionPanel(false);

                    //   paint.init(data);

                    $("#mainButtons").css("visibility", "visible");
                    $("#waitImg").css("visibility", "hidden");
                    $(".graphDisplayed").css("visibility", "visible");
                    tabsAnalyzePanel.tabs("option", "active", 2);//highlight

                    if (toutlesensData && toutlesensData.queriesIds.length > 1)
                        options.dragConnectedNodes = true;
                    toutlesensController.displayGraph(data, options);
                    if (callback)
                        return callback(null, data);


                });


            });


        }

        /**
         *
         * display the graph using relsult from toutlesensdata.getNodeAllRelations
         *
         *
         * @param json result from toutlesensdata.getNodeAllRelations
         * @param output presently "VISJS-NETWORK"
         * @param callback
         */


        self.displayGraph = function (json, options, callback) {
            if (!options)
                options = {}
            d3NodesSelection = [];
            filters.init(json);
            $("#textDiv").html("");


            if (currentDisplayType == "VISJS-NETWORK") {

                if (json.length > Gparams.limitToOptimizeGraphOptions) {
                    // options.showNodesLabel = false,
                    options.showRelationsType = false,
                        options.smooth = false;
                } else {
                    if (options.showNodesLabel != false)
                        options.showNodesLabel = true;
                    //  options.showRelationsType = false,
                    options.smooth = true;
                }
                if (json.length == 0) {
                    $("#waitImg").css("visibility", "hidden")
                    $("#graphDiv").html("< span class ='graphMessage'>No Results</span>")
                }
                if (!json)
                    json = connectors.neoResultsToVisjs(toutlesensData.cachedResultArray, options);
                else
                    json = connectors.neoResultsToVisjs(json, options);


                visjsGraph.draw("graphDiv", json, options);
                visjsGraph.drawLegend(filters.currentLabels);
                paint.initHighlight();
                filters.init()
                common.fillSelectOptionsWithStringArray(filterDialog_NodeLabelInput, filters.currentLabels);

                if (paint.currentBIproperty && paint.currentBIproperty != "")
                    paint.paintClasses(paint.currentBIproperty)

            }


            if (callback)
                callback()


        }

        self.setRelationProperties = function (select) {
            var type = $(select).val();
            var properties = Schema.schema.relations[type].properties;
            if (properties)
                common.fillSelectOptionsWithStringArray(findRelationsPropertyKeySelect, properties, true)

        }
        /**
         *  generate a graph with a specific relation type
         *
         * @param select indicating the relation type
         */

        self.generateGraphFromRelType = function (select) {

            var type = $("#findRelationsTypeSelect").val();
            var property = $("#findRelationsPropertyKeySelect").val();
            var operator = $("#findRelationsPropertyOperatorSelect").val();
            var value = $("#findRelationsPropertyValueInput").val();

            if (type != "") {
                if (property != "" && value != "") {
                    context.cypherMatchOptions.queryRelWhereFilter = "r." + property + operator + value;
                }
                context.cypherMatchOptions.queryRelTypeFilters = ":" + type;
                context.currentNode.id = null;
                currentDisplayType = "VISJS-NETWORK";
                self.generateGraph(null, {hideNodesWithoutRelations: true});
            }
        }
        /**
         *
         *
         * from nodeDiv in index.html process autocompletion to dispaly a tree (treeController) with all nodes that match word input regex
         * autocompletion params are  Gparams.searchInputKeyDelay and Gparams.searchInputMinLength
         *
         *
         *
         *
         *
         * @param resultType
         * @param limit
         * @param from
         * @param callback
         */

        self.searchNodesUI = function (resultType, limit, from, callback) {
            $("#searchResultMessage").html("");


//********************************************************
            var word = "";
            $("#nodesLabelsSelect").val("")

            currentLabel = null;
            var label = $("#nodesLabelsSelect").val();
            word = $("#word").val();

            if (word && word.length < Gparams.searchInputMinLength) {
                return;
            }

            var word0 = word.toLowerCase()
            if (word.match(/.* /))
                word = word.substring(word.length - 2)


//********************************************************
            if (Gparams.queryInElasticSearch) {
                searchNodes.searchInElasticSearch(word, label, callback);
            }
            else {
                var options = {
                    subGraph: subGraph,
                    label: label,
                    word: word,
                    limit: limit,
                    from: from
                }
                var queryObj = toutlesensData.buildSearchNodeQuery(options);
                return callback(null, queryObj);
            }
            setTimeout(function () {
                $("#searchResultMessage").html("click on tree...")
                self.openFindAccordionPanel(true);
                treeController.expandAll("treeContainer");
            }, 500)

        }


        /**
         *
         *
         * print in div graphMessage a contextual message
         *
         *
         *
         * @param resultLength
         */

        self.setResultGraphMessage = function (resultLength) {
            var message = " <i><b>click on graph to stop animation</b></i><br>";
            if (currentLabel)
                message += "Label : " + currentLabel + "<br>"
            if (context.currentNode.id)
                message += "Node : [" + context.currentNode.label + "]" + context.currentNode[Schema.getNameProperty(context.currentNode.label)] + "<br>";
            message += filters.printRelationsFilters() + "<br>";
            message += filters.printPropertyFilters() + "<br>";


            message += "<b>" + resultLength + "</b> relations found <br>"
            $("#graphMessage").html(message);
        }


        /**
         *
         * print in div message a contextual message
         *
         * @param str
         * @param color
         */

        self.setMessage = function (message, color) {
            $("#message").html(message);
            if (color)
                $("#message").css("color", color);
        }

        self.setGraphMessage = function (message, type) {

            var str = "<br><br><p align='center' >"
            var name = "";
            if (context.currentNode && context.currentNode.id)
                name = "Node " + context.currentNode[Schema.getNameProperty(context.currentNode.label)];
            else {
                if (currentLabel)
                    name = "Label " + currentLabel;
            }
            if (name)
                str += "<span class='objectName'>" + name + "</span><br>"
            if (type == "stop")
                str += "<img src='./icons/warning.png' width='50px'><br>"
            str += "<span id='graphMessageDetail'>" + message + "</span> <br>";
            str += "</p>";

            $("#graphDiv").html(str);

        }
        self.clearGraphDiv = function () {
            $("#graphDiv").html("");
            $("#graphMessage").html("");
            $("#filtersDiv").html("");
            $("#innerLegendDiv").html("");
            $("#relInfoDiv").html("");


        }


        self.selectTab = function (index) {
            $('#ressourcesTab').tabs({
                active: index
            });
        }


        /**
         *
         *
         * execute an action
         *
         * action ==
         * "nodeInfos" : show node e info either in a popup or in a viv (bottom rigth)
         * "removeNode"
         * "relationInfos" to finsih !!!
         *  "expandNode"
         *  "closeNode" to do !!!
         *  "linkSource"
         *  "linkTarget"
         *  "modifyNode"
         *  "addNode"
         *  showGraphText
         *  showGlobalMenu
         *  showParamsConfigDialog
         *  showParamsConfigDialog
         *  showAll
         *
         *
         * @param action
         * @param objectId
         * @param targetObjectId
         * @param callback
         */
        self.dispatchAction = function (action, objectId, targetObjectId, callback) {

            $("#graphPopup").css("visibility", "hidden");
            self.hidePopupMenu();

            var mode = $("#representationSelect").val();
            var id;
            if (context.currentNode && context.currentNode.id)
                id = context.currentNode.id;


            if (!context.currentNode.label && context.currentNode.nodeType) {
                context.currentNode.label = context.currentNode.nodeType;
            }

            if (action == "onNodeClick") {
                toutlesensController.dispatchAction("nodeInfos", id);
                expandGraph.setTargetLabel(context.currentNode.labelNeo)

            }

            if (action == "nodeInfos") {
                if (id) {


                    if (context.currentNode.type && context.currentNode.type == "schema") {
                        var str = "Label " + context.currentNode.label + "<br><table>"
                        $("#graphPopup").html(str);
                        $("#nodeInfoMenuDiv").css("visibility", "visible");
                        $("#nodeInfoMenuDiv").html(str);


                        return;
                    }
                    if (context.currentNode.type == "cluster") {
                        var str = "Cluster <br><table>"


                        str += "<tr><td><a href='javascript:expandGraph.openCluster()'>open cluster</a>"
                        str += "<tr><td><a href='javascript:expandGraph.listClusterNodes()'>list nodes of cluster</a>"
                      //  str += "<tr><td><a href='javascript:expand.graphClusterNodes()'>Graph  neighbours nodes of cluster</a>"


                    /*    str += "<tr><td><a href='javascript:paint.dispatchAction(\"openCluster\")'>open cluster</a>"
                        str += "<tr><td><a href='javascript:paint.dispatchAction(\"listClusterNodes\")'>list nodes of cluster</a>"
                        str += "<tr><td><a href='javascript:paint.dispatchAction(\"graphClusterNodes\")'>Graph  neighbours nodes of cluster</a>"*/
                        // str += "<tr><td><a href='javascript:paint.dispatchAction(\"queryClusterNodes\")'>query cluster</a>"


                        $("#graphPopup").html(str);
                        $("#nodeInfoMenuDiv").css("visibility", "visible");
                        // $("#nodeInfoMenuDiv").html(str);


                        return;
                    }
                    toutlesensData.getNodeInfos(id, function (obj) {
                        context.currentNode = obj[0].n.properties;
                        context.currentNode.id = obj[0].n._id;
                        context.currentNode.label = obj[0].n.labels[0];
                        var $currentObj = context.currentNode;
                        if (self.hasRightPanel) {
                            var str = "<input type='image' src='images/back.png' height='15px' title='back' onclick='toutlesensController.restorePopupMenuNodeInfo()' ><br>"
                            str += textOutputs.formatNodeInfo(obj[0].n.properties);
                            str += "<br>" + customizeUI.customInfo(obj);
                            popupMenuNodeInfoCache = $("#nodeInfoMenuDiv").html();

                            //    $("#nodeInfoMenuDiv").css("top", "total");
                            $("#nodeInfoMenuDiv").css("visibility", "visible");
                            $("#nodeInfoMenuDiv").html(toutlesensDialogsController.setPopupMenuNodeInfoContent());
                            self.openFindAccordionPanel(false);
                            $("#graphPopup").html(toutlesensDialogsController.setPopupMenuNodeInfoContent());
                            //$("#nodeInfoMenuDiv").html(str)


                        }
                        else {
                            var str = toutlesensDialogsController.setPopupMenuNodeInfoContent();
                            $("#graphPopup").html(str);

                            toutlesensController.showPopupMenu($currentObj._graphPosition.x, $currentObj._graphPosition.y, "nodeInfo");
                        }
                    });
                }


            }


            else if (action == "removeNode") {
                if (id) {
                    visjsGraph.removeNode(id);
                }

            }


            else if (action == 'relationInfos') {
                $("#graphPopup").html(toutlesensDialogsController.setPopupMenuRelationInfoContent());

            }
            else if (action == 'expandNode') {
                expandGraph.expandFromNode(context.currentNode,null);
            }
            else if (action == 'expandNodeWithLabel') {
                var labels = Schema.getPermittedLabels(context.currentNode.labelNeo, true, true);
                labels.splice(0, 0, "");
                var str = "labels<br><select onchange=' toutlesensController.dispatchAction(\"expandNodeWithLabelExecute\",$(this).val())'>";
                for (var i = 0; i < labels.length; i++) {
                    str += "<option>" + labels[i] + "</option>>";
                }
                str+="</select>"
                $("#graphPopup").append(str);
                $("#graphPopup").css("visibility", "visible");

            }
            else if (action == 'expandNodeWithLabelExecute') {
                var currentLabel;
                if (objectId != "" && objectId != "ALL")
                    currentLabel = objectId;
                else
                    currentLabel = null;
                expandGraph.expandFromNode(context.currentNode,currentLabel);
            }
            else if (action == 'expandGraphWithLabelExecute') {

                if (objectId.source == "" || objectId.target == "")
                    return;
                var sourceLabel = objectId.source;
                var targetLabel = objectId.target;
                var filter = objectId.filter;

                var ids = visjsGraph.getNodesNeoIdsByLabelNeo(currentLabel)


                var options = {
                    applyFilters: false,
                    addToPreviousQuery: true
                }
                options.whereFilters = []
                options.whereFilters.push(searchNodes.getWhereClauseFromArray("_id", ids, "n"));
                if (filter && filter != "")
                    options.whereFilters.push(filter);
                options.useStartLabels = [sourceLabel]
                options.useEndLabels = [targetLabel]

                //  context.addToGraphContext({expandGraph: {sourceLabel: currentLabel, targetLabel: currentLabel}})
                var collapseGraph = $("#searchDialog_CollapseGraphCbx").prop("checked");
                if (collapseGraph)
                    options.clusterIntermediateNodes = true;
                options.hideNodesWithoutRelations = true;

                toutlesensData.getNodeAllRelations(options, function (err, result) {
                    toutlesensController.displayGraph(result, {});
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');


                })
            }


            else if (action == 'showRelClusterIntermediateNodes') {

                var relationDepth = parseInt($("#searchDialog_pathDistanceInput").val());
                var cypher = "match(n)-[r*1.." + relationDepth + "]-(m) where ID(n)=" + context.currentNode.fromNode.id + " AND ID(m)=" + context.currentNode.toNode.id + "return r";
                var cypher = " match(n)-[]-(p)-[]-(m) where ID(n)=" + context.currentNode.fromNode.id + " AND ID(m)=" + context.currentNode.toNode.id + " return p";


                Cypher.executeCypher(cypher, function (err, result) {
                    var newNodes = [];
                    var newRelations = [];
                    var fromId = context.currentNode.fromNode.id
                    var toId = context.currentNode.toNode.id
                    result.forEach(function (node) {
                        newNodes.push({
                            // x: 200,
                            // y: 200,
                            id: node.p._id,
                            label: node.p.properties.name,
                            color: context.nodeColors[node.p.labels[0]],
                            data: node.p.properties

                        });
                        newRelations.push({
                                from: fromId,
                                to: node.p._id,
                            },
                            {
                                from: toId,
                                to: node.p._id,
                            }
                        )


                    })
                    visjsGraph.updateNodes(newNodes);
                    visjsGraph.updateRelations(newRelations);
                    visjsGraph.network.setOptions({
                        physics: {enabled: true}
                    });
                })

            }


            else if (action == 'closeNode') {

            }

            else if (action == "setAsRootNode") {
                if (self.currentSource == "RDF") {
                    var name = context.currentNode.name;
                    var p = name.indexOf("#");
                    if (p > 0)
                        var name = name.substring(0, p);
                    rdfController.searchRDF(name);
                }
                else {// minus sign on context.currentNode.id see toutlesensData 148
                    self.generateGraph(context.currentNode.id, {applyFilters: false});
                }
            }

            else if (action == "linkSource") {

                $("#linkActionDiv").css("visibility", "visible");
                var sourceNode = JSON.parse(JSON.stringify(context.currentNode));
                $("#linkSourceNode").val(sourceNode.name);
                $("#linkSourceNode").css("color", context.nodeColors[sourceNode.label]);
                $("#linkSourceLabel").html(sourceNode.label);
                self.currentRelationData = {
                    sourceNode: sourceNode,
                    context: "visJsGraphAddRel"
                }
            } else if (action == "linkTarget") {
                //	selectLeftTab('#dataTab');
                $("#linkActionDiv").css("visibility", "visible");
                var targetNode = JSON.parse(JSON.stringify(context.currentNode));
                $("#linkTargetNode").val(targetNode.name);
                $("#linkTargetNode").css("color", context.nodeColors[targetNode.label]);
                $("#linkTargetLabel").html(targetNode.label);

                self.currentRelationData.targetNode = targetNode;
                var links = [];
                var allowedRelTypes = Schema.getPermittedRelTypes(toutlesensController.currentRelationData.sourceNode.labelNeo, toutlesensController.currentRelationData.targetNode.labelNeo, true);

                //  allowedRelTypes.splice(0, 0, "");
                $("#dialog").load("htmlSnippets/relationsForm.html", function () {
                    common.fillSelectOptionsWithStringArray(relations_relTypeSelect, allowedRelTypes);
                    self.initLabels(relationsFormNewRelationStartLabelSelect);
                    self.initLabels(relationsFormNewRelationEndLabelSelect);
                    $("#dialog").dialog("option", "title", "Relation");

                })
                $("#dialog").dialog("open");


            } else if (action == "modifyNode") {
                if (Gparams.readOnly == false) {

                    var label = context.currentNode.labelNeo;
                    $("#dialog").dialog({modal: false});
                    $("#dialog").dialog("option", "title", " node " + label);


                    $("#dialog").load("htmlSnippets/nodeForm.html", function () {

                        var attrObject = Schema.schema.properties[label];
                        treeController.selectedNodeData = context.currentNode;
                        treeController.selectedNodeData.neoId = context.currentNode.id
                        treeController.setAttributesValue(label, attrObject, context.currentNode.neoAttrs);
                        treeController.drawAttributes(attrObject, "nodeFormDiv");
                        // self.openFindAccordionPanel();

                    })
                    $("#dialog").dialog("open");

                }


            } else if (action == "deleteRelation") {
                treeController.deleteRelationById(context.currentNode.neoId, function (err, result) {
                    if (err) {
                        return console.log(err);
                    }
                    visjsGraph.deleteRelation(context.currentNode.id)
                })
            }
            else if (action == "addNode") {
                context.currentNode = {}

                if (Gparams.readOnly == false) {
                    $("#dialog").dialog({modal: false});
                    $("#dialog").dialog("option", "title", "New node");


                    $("#dialog").load("htmlSnippets/nodeForm.html", function () {
                        self.initLabels(nodeFormLabelSelect);
                        self.openFindAccordionPanel();
                        for (var i = 0; i < Gparams.palette.length; i++) {
                            $("#nodeFormNewLabelColor").append($('<option>', {
                                    value: Gparams.palette[i],
                                    text: Gparams.palette[i],

                                }).css("background-color", Gparams.palette[i])
                            );


                        }

                    })
                    $("#dialog").dialog("open");

                }

            }

            else if (action == "createNewLabel") {
                /*   var newLabel = prompt("new label name");*/
                var newLabel = $("#nodeFormNewLabelName").val()
                var newLabelColor = $("#nodeFormNewLabelColor").val()
                if (newLabel && newLabel.length > 0) {
                    if (!/^[\w]+$/.test(newLabel)) {
                        return alert("label names only allow ascii characters")
                        var color = "#FFD900"
                    }
                    if (newLabelColor && newLabelColor.length > 0)
                        color = newLabelColor;

                    Schema.schema.labels[newLabel] = {"color": color};
                    Schema.schema.properties[newLabel] = {
                        "name": {
                            "type": "text"
                        },

                    }
                    Schema.save(subGraph);
                    self.initLabels(nodeFormLabelSelect);
                    var attrObject = Schema.schema.properties[newLabel];
                    treeController.selectedNodeData = null;
                    treeController.setAttributesValue(newLabel, attrObject, {});
                    treeController.drawAttributes(attrObject, "nodeFormDiv");
                }
            }

            else if (action == "createNewRelationType") {
                $('#relationsFormNewRelationDiv').css('visibility', 'visible');
                var startLabel = $("#relationsFormNewRelationStartLabelSelect").val();
                var endLabel = $("#relationsFormNewRelationEndLabelSelect").val();
                var newRelation = $("#relationsFormNewRelationNameInput").val();
                if (newRelation && newRelation.length > 0) {
                    if (!/^[\w]+$/.test(newRelation)) {
                        return alert("relation names only allow ascii characters")
                    }

                    Schema.schema.relations[newRelation] = {
                        "startLabel": startLabel,
                        "endLabel": endLabel,
                        "type": newRelation
                    }
                    Schema.save(subGraph);
                    var allowedRelTypes = Schema.getPermittedRelTypes(toutlesensController.currentRelationData.sourceNode.labelNeo, toutlesensController.currentRelationData.targetNode.labelNeo, true);
                    common.fillSelectOptionsWithStringArray(relations_relTypeSelect, allowedRelTypes);
                }
            }

            else if (action == "showGraphTable") {
                var dataset = visjsGraph.toList();

                // $('#dialogLarge').html("<div id='dataTableDiv' style='width: 600px'></div>").promise().done(function () {
                $("#dialog").load("htmlSnippets/exportDialog.html", function () {
                    dialog.dialog("open");
                    dialog.dialog({title: "Select table columns"});
                    exportDialog.init(dataset)


                })


            }
            else if (action == "showGraphText") {
                dialogLarge.dialog({modal: true});
                dialogLarge.dialog("option", "title", "Graph text");
                dialogLarge.load("htmlSnippets/graphTextDialog.html", function () {
                    var text = visjsGraph.graph2Text();
                    $("#graphTextDiv").html(text);
                })
                dialogLarge.dialog("open");
            }
            else if (action == "showGlobalMenu") {
                $("#dialog").dialog({modal: true});
                $("#dialog").dialog("option", "title", "SouslesensGraph main menu");
                $("#dialog").load("htmlSnippets/globalMenu.html", function () {
                })
                $("#dialog").dialog("open");
            }

            else if (action == "showSchemaConfigDialog") {

                dialogLarge.load("htmlSnippets/schemaConfig.html", function () {
                    if (options && options.create)
                        $("#schemaConfig_createSchemaDiv").css("visibility", "visible");
                    else
                        $("#schemaConfig_configSchemaDiv").css("visibility", "visible");


                    $("#subGraph").val(subGraph);//  self.initLabelProperty(label);


                })
                dialogLarge.dialog("option", "title", "Souslesens schema configuration");
                dialogLarge.dialog("open");
            }

            else if (action == "showParamsConfigDialog") {

                dialogLarge.load("htmlSnippets/paramsConfig.html", function () {
                    if (options && options.create)
                        $("#schemaConfig_createSchemaDiv").css("visibility", "visible");
                    else
                        $("#schemaConfig_configSchemaDiv").css("visibility", "visible");


                    $("#subGraph").val(subGraph);//  self.initLabelProperty(label);


                })
                dialogLarge.dialog("option", "title", "Souslesens schema configuration");
                dialogLarge.dialog("open");
            }

            else if (action == "showAll") {
                context.currentNode.id = null;
                currentLabel = null;
                currentDisplayType = "VISJS-NETWORK";
                // $("#showRelationTypesCbx").remove("checked");
                //  visjsGraph.displayRelationNames({show:false})
                Gparams.showRelationNames = false;

                self.generateGraph(null, {applyFilters: true, hideNodesWithoutRelations: false});
                self.openFindAccordionPanel(false);
            }

            else if (action == "zoomOnNode") {
                var expression = prompt("find node with name ?");
                if (expression && expression.length > 0) {
                    visjsGraph.zoomOnNode(expression);

                }

            }

            else if (action == "onLinkClick") {
                self.generateGraph(objectId, {applyFilters: true}, function () {

                })

            }
            else if (action == "showSchema") {

                function generateSchemaGraph() {
                    dataModel.getDBstats(subGraph, function () {
                        var data = connectors.toutlesensSchemaToVisjs(Schema.schema);
                        visjsGraph.draw("graphDiv", data, graphOptions, function () {
                            Schema.currentGraph = visjsGraph.exportGraph();
                            var str = "{\"nodes\":" + JSON.stringify(Schema.currentGraph, null, 2) + ",\"edges\":" + JSON.stringify(Schema.currentGraph.edges, null, 2) + "}";
                            localStorage.setItem("schemaGraph_" + subGraph, str);
                        });
                    });
                }


                var storedSchema = localStorage.getItem("schemaGraph_" + subGraph)

                currentActionObj.graphType = "schema";
                dialogLarge.dialog("close");


                var graphOptions = {
                    fixed: true,
                    noHistory: true,
                    onEndDrag: function () {
                        Schema.currentGraph = visjsGraph.exportGraph();
                        var str = "{\"nodes\":" + JSON.stringify(Schema.currentGraph, null, 2) + ",\"edges\":" + JSON.stringify(Schema.currentGraph.edges, null, 2) + "}";
                        localStorage.setItem("schemaGraph_" + subGraph, str);
                    },
                    onClick: function (params) {
                        $("#graphPopup").css("visibility", "hidden");
                        if (params.nodes.length == 1) {
                            var point = params.pointer.DOM;
                            var nodeId = params.nodes[0];
                            context.currentNode = visjsGraph.nodes._data[nodeId];

                            $(".selectLabelDiv ").each(function () {
                                var label = context.currentNode.name
                                if ($(this).html() == label)
                                    searchNodes.onChangeSourceLabel(label,true);
                                searchNodes.activatePanel("searchCriteriaDiv")
                            })

                            toutlesensController.dispatchAction("nodeInfos", nodeId);
                            toutlesensController.showPopupMenu(point.x, point.y, "nodeInfo");
                        }
                    }
                };

                if (objectId == true) {// reset
                    localStorage.removeItem("schemaGraph_" + subGraph);
                    return generateSchemaGraph();
                }


                if (Schema.currentGraph) {

                    visjsGraph.importGraph(Schema.currentGraph, graphOptions);

                }
                else {

                    var graphStr = localStorage.getItem("schemaGraph_" + subGraph);
                    if (graphStr) {
                        Schema.currentGraph = JSON.parse(graphStr);
                        visjsGraph.importGraph(Schema.currentGraph, graphOptions);

                    }
                    else {
                        generateSchemaGraph();
                    }
                }
            }
            else if (action == "clearLocalStorageSchema") {
                localStorage.removeItem("schemaGraph_" + subGraph);
                toutlesensController.dispatchAction('showSchema')
            }


            else if (action == "displaySettings") {
                $("#dialog").load("htmlSnippets/visjsGraphDisplayMenu.html", function () {
                    var layout = Gparams.visjs.defaultLayout;
                    if (layout.indexOf("hierarchical") > -1) {
                        ($("#graphLayoutDirectionDir").css("visibility", "visible"));
                    } else {
                        ($("#graphLayoutDirectionDir").css("visibility", "hidden"));
                    }
                    $("#graphLayoutSelect").val(layout);
                    $("#dialog").dialog({modal: false});
                    $("#dialog").css("position", "absolute");

                    $("#dialog").dialog("option", "title", "display settings");
                    $("#dialog").dialog("open");
                });
            }
            else if (action == "searchCypher") {
                toutlesensData.matchStatement = $("#cypherDialog_matchInput").val();
                var where = $("#cypherDialog_whereInput").val();
                context.cypherMatchOptions.sourceNodeWhereFilter = where;
                context.currentNode.id = null;
                self.generateGraph(null, {});
            }

            else if (action == "graphorama") {
                $("#dialog").load("htmlSnippets/graphorama.html", function () {
                    $("#dialog").dialog("option", "title", "graphorama");
                    $("#dialog").dialog("open");
                })
            }


        }


        self.showImage = function (url) {
            // $("#nodeDetailsDiv").prop("src", url);
            var w = $("#nodeDetailsDiv").width();
            $("#nodeDetailsDiv").html('<img id="largeImage" src="' + url + '" border="0" height="real_height" width="real_width" onload="resizeImg(this, null, ' + w + ');">')

        }

        self.restorePopupMenuNodeInfo = function () {
            $("#nodeInfoMenuDiv").html(popupMenuNodeInfoCache);
        }


        /**
         *
         *
         * to be modified
         *
         *
         *
         *
         *
         *
         *
         *
         * @param value
         */










        self.showPopupMenu = function (x, y, type) {

            tabsAnalyzePanel.tabs("option", "active", 0);
            $("#graphPopup").css("visibility", "visible").css("top", y).css("left", x);


        }
        self.hidePopupMenu = function () {
            $("#nodeInfoDiv").css("visibility", "hidden");

        }


        self.afterGraphInit = function () {
            customizeUI.addPlugins(Gparams.plugins)


            currentActionObj = {graphType: "schema"};
            toutlesensController.dispatchAction("showSchema");


            //  paramsController.loadParams();
            var tabsanalyzePanelDisabledOptions = [];
            //  tabsanalyzePanelDisabledOptions.push(1);//filters
            //  tabsanalyzePanelDisabledOptions.push(2);//highlight
            var tabsFindPanelDisabledOptions = [];
            // tabsFindPanelDisabledOptions.push(3)


            $("#nextGraphMenuButton").css("visibility", "hidden")
            $("#previousGraphMenuButton").css("visibility", "hidden")


            if (Gparams.showRelationNames) {
                $("#showRelationTypesCbx").prop("checked", "checked");
            }


            if (queryParams.write) {
                Gparams.readOnly = false
            }


            if (Gparams.readOnly == false) {
                $("#infosHeaderDiv").css("visibility", "visible");
                treeController.userRole = "write";
                cards.userRole = "write";


                $("#createNodeButton").css("visibility", "visible");
                $("#editSchemaButton").css("visibility", "visible");
                $("#parametersMenuButton").css("visibility", "visible");

            }
            else {
                //tabsanalyzePanelDisabledOptions.push(3);
                $("#infosHeaderDiv").css("visibility", "hidden");
                treeController.userRole = "read"
                cards.userRole = "read";
            }


            $("#requestDiv").load("htmlSnippets/currentQueries.html", function () {
                self.initLabels(currentQueriesDialogSourceLabelSelect);
                self.initLabels(currentQueriesDialogTargetLabelSelect);
            });

            $("#graphoramasDiv").load("htmlSnippets/graphorama.html", function () {
                graphorama.init();

            })
            $("#similarsDiv").load("htmlSnippets/similarsDialog.html", function () {

            });
            $("#pivotsDiv").load("htmlSnippets/pivotsDialog.html", function () {
                self.initLabels(pivotsDialogSourceLabelsSelect, true);

            });
            $("#transitiveRelationsDiv").load("htmlSnippets/transitiveRelationsDialog.html", function () {
                toutlesensController.initLabels(transitiveRelations_labelsSelect, true);

            });
            $("#cypherQueryDiv").load("htmlSnippets/cypherDialog.html", function () {


            });

            $("#queryDiv").load("htmlSnippets/searchNodesDialog.html", function () {

                searchNodes.init(Schema);
                nodeSets.initNodeSetSelect()
            });
            $("#filterDiv").load("htmlSnippets/filterDialog.html", function () {

                //  searchNodes.init(Schema);
            });
            $("#expandDiv").load("htmlSnippets/expandGraphDialog.html", function () {

                //  searchNodes.init(Schema);
            });


            tabsAnalyzePanel.tabs("option", "disabled", tabsanalyzePanelDisabledOptions);
            $("#findTabs").tabs("option", "disabled", tabsFindPanelDisabledOptions);

            $(".graphDisplayed").css("visibility", "hidden");

            if (treeController.userRole != "write")
                $(".canModify").css("visibility", "hidden");

            filters.setLabelsOrTypes("node");

            $("#highlightDiv").load("htmlSnippets/paintDialog.html", function () {
                paint.initColorsPalette(10, "paintDialogPalette");
                paint.initHighlight();
                filters.setLabelsOrTypes("node");
            });





        }

        /**
         *
         *
         * execute a cypher Query to decide if there is too many relations to draw the graph(i.e relations>Gparams.jsTreeMaxChildNodes)
         *
         *
         *
         *
         * @param nodeId
         * @param maxRels
         * @param callback
         */
        self.checkMaxNumberOfNodeRelations = function (nodeId, maxRels, callback) {
            var whereSubGraph = "";
            if (subGraph != Gparams.defaultSubGraph)
                whereSubGraph = " and n.subGraph='" + subGraph + "'"
            var matchStr = "match (n)-[r]-(m) where ID(m)=" + nodeId + whereSubGraph + " return count(r) as count";
            var payload = {match: matchStr};
            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    savedQueries.addToCurrentSearchRun(matchStr, callback || null);

                    var count = data[0].count;
                    if (count > Gparams.jsTreeMaxChildNodes) {

                        $("#dialog").dialog("option", "title", "result");
                        var str = "All nodes cannot be displayed : " + count + " maximum :" + Gparams.jsTreeMaxChildNodes;
                        // str += "enter criteria"
                        str += "<br><button onclick=' $(\"#dialog\").dialog(\"close\")')>close</button>"
                        $("#dialog").html(str);
                        $("#dialog").dialog("open");
                        callback(false);
                    }
                    callback(true);
                }
                , error: function (xhr) {
                    toutlesensController.onErrorInfo(xhr)
                    callback(false);
                }
            })
        }


        self.onErrorInfo = function (err) {
            var errObj = JSON.parse(err.responseJSON.ERROR);
            if (errObj.code == "ECONNREFUSED")
                alert("No connexion to Neo4j database ");
            console.log(err.responseText)

        }

        self.initLabels = function (select, withEmptyOption) {
            var labels = Schema.getAllLabelNames();
            if (withEmptyOption)
                labels.splice(0, 0, "")
            common.fillSelectOptionsWithStringArray(select, labels);
        }


        self.intiRelationTypes = function () {
            var relations = Schema.schema.relations;
            var types = [];
            for (var key in relations) {
                var type = relations[key].type;
                if (types.indexOf(type) < 0)
                    types.push(type);
            }
            types.sort();
            types.splice(0, 0, "")
          //  common.fillSelectOptionsWithStringArray(findRelationsTypeSelect, types);
        }


        self.setResponsiveDimensions = function (rightPanelWidth) {


            if (rightPanelWidth == 0) {
                tabsAnalyzePanel.css("visibility", "hidden");
                self.hasRightPanel = false;
            }
            else {
                self.hasRightPanel = true;
                tabsAnalyzePanel.css("visibility", "visible");
            }
            $(".ui-tabs .ui-tabs-panel").css("padding", "2px");
            $(".rightPanel").css("with", rightPanelWidth);

            $("#mainPanel").width(totalWidth - (rightPanelWidth)).height(totalHeight)
            //    $("#analyzePanel").width(rightPanelWidth - 50).height(totalHeight).css("position", "absolute").css("left", totalWidth - rightPanelWidth + 20).css("top", 20);


            $("#graphDiv").width(totalWidth - rightPanelWidth).height(totalHeight - 0);
          //  $("#buildGraphWrappperDiv").width(totalWidth - rightPanelWidth);

            $("#graphLegendDiv").width(120).height(200).css("position", "absolute").css("top", totalHeight-200).css("left", 5).css("background", "none");
            $("#graphInfosDiv").width(400).height(40).css("position", "absolute").css("top", 0).css("left", (totalWidth - rightPanelWidth) - 450).css("top", 50).css("background-color", "#eee");
            $("#BIlegendDiv").css("position", "absolute").css("top", 0).css("left", (totalWidth - rightPanelWidth) - 80).css("top", 80).css("background-color", "#eee");
            $("#graphInfosDiv").css("visibility", "hidden")




            $("#treeContainer").width(rightPanelWidth - 15);
            $("#tagCloudIframe").height(totalHeight);


            // $("#graphLegendDiv").width(rightPanelWidth - 50).height(totalHeight)
            // $("#findDiv").width(rightPanelWidth - 10).height((totalHeight)).css("position", "absolute").css("top", "0px").css("left", (totalWidth - rightPanelWidth) + 20)
            $("#mainAccordion").width(rightPanelWidth - 10).height((totalHeight)).css("position", "absolute").css("top", "0px").css("left", (totalWidth - rightPanelWidth) + 20);
            $(".mainAccordionPanel").width(rightPanelWidth - 10).height((totalHeight - 120))
            /* $("#findDivInner").width(rightPanelWidth - 10).height((totalHeight))
             $("#findTabs").width(rightPanelWidth - 10);*/


            $("#nodeInfoMenuDiv").width(rightPanelWidth - 40).css("visibility", "hidden")

            $("#editDiv").width(rightPanelWidth - 40).height((totalHeight))
            $("#highlightDiv").width(rightPanelWidth - 40).height((totalHeight))
            $("#filterDiv").width(rightPanelWidth - 40).height((totalHeight))
            $("#infosDiv").width(rightPanelWidth - 40).height((totalHeight))

            //   $("#analyzePanel").width(rightPanelWidth - 10).height(totalHeight).css("position", "absolute").css("left", (totalWidth - rightPanelWidth) + 30).css("top", 10);
            //tabsAnalyzePanel.width(rightPanelWidth - 100).height(totalHeight/2).css("position", "absolute").css("left",(totalWidth-rightPanelWidth) + 30).css("top", 10);


            $("#analyzePanel").width(rightPanelWidth - 10);


            //   $("#mainButtons").width(rightPanelWidth).height(50).css("position", "absolute").css("left", $("#graphDiv").width() - 200).css("top", 50).css("visibility", "hidden");
          //  $("#mainButtons").css(".max-width", 300).height(50).css("position", "absolute").css("left", 20).css("top", 10);//.css("visibility", "hidden");
            $("#mainButtons").width(totalWidth - rightPanelWidth).height(50).css("position", "absolute").css("left", 20).css("top", 10);//.css("visibility", "hidden");
            $("#graphCommentDiv").css("max-width", "500").css("position", "absolute").css("left", 20).css("top", totalHeight - 70);


            $("#fullScreenButton").css("position", "absolute").css("top", 5).css("left", (totalWidth - rightPanelWidth) - 10);
            $(".objAttrInput").width(rightPanelWidth - 100);

            self.openFindAccordionPanel(true);

        }

        self.switchanalyzePanelDisplay = function () {
            self.hasRightPanel = !self.hasRightPanel

            if (!self.hasRightPanel)
                toutlesensController.setResponsiveDimensions(0);
            else {
                toutlesensController.setResponsiveDimensions(rightPanelWidth);
                toutlesensController.openFindAccordionPanel(false);
            }
            $("#mainButtons").css("visibility", "visible");

        }


        /**
         *
         * if expandTree true; the treePanel will occupy all the height of the right panel else only thr top until totalheight -Gparams.infosAnalyzePanelHeight
         *
         *
         *
         * @param expandTree
         */
        self.openFindAccordionPanel = function (bool) {
            if (bool)
                $("#mainAccordion").accordion("option", "active", 0);
            else {
                $("#mainAccordion").accordion("option", "active", 1);
            }
        }
        self.increaseGraphLimit = function () {
            var increase = prompt("Enter new graph display limit");
            if (increase && increase != "") {
                Gparams.maxResultSupported = parseInt(increase);
                toutlesensController.generateGraph(null, {useCurrentStatement: true});
            }
        }
        self.graphNodeNeighbours = function (obj) {
            context.currentNode = obj;
            self.dispatchAction("setAsRootNode");
            dialogLarge.dialog("close");

        }

        return self;
    }
)
()