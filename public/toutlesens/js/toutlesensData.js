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

var toutlesensData = (function () {
        var self = {};
        self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;

        var navigationPath = [];
        self.cachedResultArray = null;
        self.cachedResultTree = null;


        self.currentStatement = null;

        self.queriesIds = [];


        self.standardReturnStatement = " RETURN EXTRACT(rel IN relationships(path) | type(rel)) as rels," +
            "EXTRACT(rel IN relationships(path) | rel)  as relProperties," +
            "nodes(path) as nodes," +
            " EXTRACT(node IN nodes(path) | ID(node)) as ids," +
            " EXTRACT(node IN nodes(path) | labels(node)) as labels "
            + ", EXTRACT(rel IN relationships(path) | labels(startNode(rel))) as startLabels";





        self.getNodeAllRelations = function (options, callback) {
            if (!options.addToPreviousQuery) {
                self.queriesIds = [];
                self.cachedResultArray = [];
            }
            var hasMclause = false;
            legendnodeLabels = {}
            legendRelTypes = {};

            //*******************************************************where***********************************************

            var whereStatements = [];
            if (subGraph)
                whereStatements.push("n.subGraph='" + subGraph + "' and m.subGraph='" + subGraph + "' ");


            if (options.useStartNodeSet)
                whereStatements.push(self.getWhereClauseFromArray("_id", options.useStartNodeSet, "n"));

            if (options.useEndNodeSet)
                whereStatements.push(self.getWhereClauseFromArray("_id", options.useEndNodeSet, "m"));


            if (options.id && !options.useStartNodeSet) {

                if (options.id > 0) {
                    whereStatements.push("  (ID(n)=" + options.id + ")");
                    hasMclause = false;
                }
                else {
                    hasMclause = true;
                    whereStatements.push("  (ID(m)=" + (-options.id) + ")");

                }
            }

            if (options.useStartLabels)
                whereStatements.push("labels(n)[0] in " + JSON.stringify(options.useStartLabels));
            if (options.useEndLabels)
                whereStatements.push("labels(m)[0] in " + JSON.stringify(options.useEndLabels));
            if (options.whereFilters) {
                options.whereFilters.forEach(function (line) {
                    whereStatements.push(line);
                })
            }


            var whereStatement = "WHERE ";
         //   console.log(JSON.stringify(whereStatements,null,2))
            whereStatements.forEach(function (line, index) {
                if (index > 0)
                    whereStatement += " AND "
                whereStatement += line;
            })


            //*******************************************************return***********************************************
            var returnStatement;
            if (options.output == "filtersDescription") {
                returnStatement = " RETURN count(r) as nRels, COLLECT( distinct EXTRACT( rel IN relationships(path) |  type(rel))) as rels,EXTRACT( node IN nodes(path) | labels(node)) as labels"
            }
            else {
                returnStatement = self.standardReturnStatement;
            }
            if (options.additionnalReturnStatement)
                returnStatement += ", " + options.additionnalReturnStatement;

            var node1Label = "";
            if (false && currentLabel)
                node1Label = ":" + currentLabel;

            var node2Label = "";
            if (currentLabel)
                node2Label = ":" + currentLabel;


            //*******************************************************match***********************************************


            // http://graphaware.com/graphaware/2015/05/19/neo4j-cypher-variable-length-relationships-by-example.html
            var relCardinalityStr = "";

            if (options.relationDepth && options.relationDepth > 1)
                relCardinalityStr = "*.." + options.relationDepth;
            else {
                if (options.hideNodesWithoutRelations)
                    relCardinalityStr = "*..1";
                if (options.hideNodesWithoutRelations )
                    relCardinalityStr = ""
                else
                    relCardinalityStr = "*0..1";

            }

            var matchStatement = "(n" + node1Label
                + ")-[r"
              //  + context.cypherMatchOptions.queryRelTypeFilters
                + relCardinalityStr
                + "]-(m" + node2Label + ") "


            //*******************************************************Global query***********************************************
            var statementBase = "MATCH path="
                + matchStatement
                + whereStatement



            graphQueryUnionStatement = "";


            var statement = statementBase + returnStatement;

            if (toutlesensController.currentActionObj.mode == "filter" || statement.indexOf("-(m)") > -1)
                hasMclause = true;


            /*   if (graphQueryUnionStatement)
                   statement += " UNION " + graphQueryUnionStatement + returnStatement.replace("count(r)", 0);*/

            var limit = Gparams.maxResultSupported;

            if (options.limit)
                limit = options.limit;
            statement += " limit " + limit;

            if (Gparams.logLevel > 0) {
                if (statement.length > 500)
                    console.log(statement.substring(0, 500) + "...");
                else
                    console.log(statement);
            }


            if (options.useCurrentStatement && self.currentStatement) {
                var p = self.currentStatement.indexOf("WHERE")
               // if (p > -1 && context.cypherMatchOptions.sourceNodeWhereFilter.length > 0) {
                if (p > -1){
                    statement = self.currentStatement.substring(0, p) + " " + context.cypherMatchOptions.sourceNodeWhereFilter + " " + self.currentStatement.substring(p + 1);

                }


            } else {
                self.currentStatement = statement;
            }





            $("#searchMenu_cypherDiv").text(statement)
            var payload = {match: statement};

            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    savedQueries.addToCurrentSearchRun(statement, callback || null);

                    if (data.length == 0 && options.addToPreviousQuery) {
                        data = [];
                    }
                    else if (data.length == 0) {

                        if (options.id == null) {
                            return callback(null, []);
                        }
                        if (options.id > -1) {// we retry with inverse relation
                            options.id = -options.id
                            self.getNodeAllRelations(-id, options, callback);
                        }
                        else {
                            options.id = -options.id
                            return callback(null, []);
                        }

                    }
                    if (data.length >= Gparams.maxResultSupported) {// query too get the real number of relations
                        var matchStr = "MATCH path=(n)-[r]->(m) " + statementBase.substring(statementBase.indexOf("WHERE")) + "return count(r) as countrels;";
                        console.log(matchStr)
                        var payload = {
                            match: matchStr
                            // match: "MATCH path=(n)-[r]->(m) "+ self.getCurrentWhereClause() + "return count(r) as countRel;"
                        }


                        $.ajax({
                            type: "POST",
                            url: self.neo4jProxyUrl,
                            data: payload,
                            dataType: "json",
                            success: function (data, textStatus, jqXHR) {
                                var message = "<br><span class='importantMessage'>" + data[0].countrels + "  relations found . Only " + Gparams.maxResultSupported + " are currently displayed</span> "
                                message += "<a href='javascript:toutlesensController.increaseGraphLimit()'>increase Graph display limit</a> (display can be slower)";
                                message += "<br> <a href='$(\"#propertiesSelectionDialog_NodeLabelInput\").val(\"\");javascript:searchNodes.showDialog()'>or set a filter on nodes or relations</a>";

                                $("#graphCommentDiv").html(message);
                            }
                        })
                    }


                    if (options.output == "filtersDescription") {

                        return callback(null, data);

                    }


                    currentDataStructure = "flat";
                    var resultArray = data;
                    // data.log(JSON.stringify(resultArray))
                    if (true || addToPreviousQuery && self.cachedResultArray) {
                        for (var i = 0; i < resultArray.length; i++) {
                            for (var j = 0; j < resultArray[i].nodes.length; j++) {
                                var id = resultArray[i].nodes[j]._id;
                                if (self.queriesIds.indexOf(id) > -1)
                                    resultArray[i].nodes[j].outline = true;
                            }

                        }
                        if (resultArray && toutlesensData.cachedResultArray)
                            resultArray = $.merge(resultArray, toutlesensData.cachedResultArray);
                        else if (toutlesensData.cachedResultArray)
                            resultArray = toutlesensData.cachedResultArray

                    }

                    toutlesensData.cachedResultArray = resultArray;
                    return callback(null, resultArray)

                },
                error: function (xhr, err, msg) {
                    toutlesensController.onErrorInfo(xhr)
                    return (err);
                }

            });


        }
        self.getCurrentWhereClause = function () {
            if (!self.currentStatement)
                return "";
            var p = self.currentStatement.indexOf("WHERE")
            var q = self.currentStatement.indexOf(" RETURN")
            if (p > -1 && q > -1)
                return self.currentStatement.substring(p, q);
            return "";

        }


        self.getPathes = function (startId, endId, depth, algo, callback) {


            var body = '{ "to":"' + endId + '","max_depth":' + depth + ',"algorithm":"'
                + algo + '"}';
            var urlSuffix = "/db/data/node/" + startId + "/paths";
            var paramsObj = {
                cypher: 1,
                mode: "POST",
                urlSuffix: urlSuffix,
                payload: body,
            }
            console.log(JSON.stringify(paramsObj), "null", 2);

            console.log(urlSuffix);
            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: paramsObj,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    // savedQueries.addToCurrentSearchRun(statement,callback|| null);
                    if (!data || data.length == 0) {
                        $("#waitImg").css("visibility", "hidden");
                        return callback("No result")
                    }
                    if (data.length > Gparams.maxResultSupported) {

                        return callback("trop de resultats "
                            + data.length
                            + " pour dessiner le graphe.Modifiez les parametres")

                    }

                    var RelIds = [];

                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; j < data[i].relationships.length; j++) {

                            var str = data[i].relationships[j];
                            var id = parseInt(str.substring(str.lastIndexOf("/") + 1));

                            RelIds.push(id);

                        }
                    }
                    callback(null, RelIds);

                    // self.processPathResults(data,callback);
                },
                error: function (xhr, err, msg) {
                    toutlesensController.onErrorInfo(xhr)
                    callback(err)
                },

            });

        }


        self.collapseResult = function (resultArray) {
            //   toutlesensController.collapseTargetLabels=[]//["cote"];
            var resultArrayTransitive = [];
            for (var k = 0; k < toutlesensController.collapseTargetLabels.length; k++) {
                var targetLabel = toutlesensController.collapseTargetLabels[k];
                for (var i = 0; i < resultArray.length; i++) {
                    var rels = resultArray[i].rels;
                    var nodes = resultArray[i].nodes;
                    var ids = resultArray[i].ids;
                    var labels = resultArray[i].labels;
                    var startNodes = resultArray[i].startLabels;
                    var relProperties = resultArray[i].relProperties;
                    var toRemoveNodesIndexes = [];
                    for (var j = 1; j < nodes.length; j++) {
                        nodeLabels = nodes[j].labels;
                        if (nodeLabels[0] != targetLabel) {
                            toRemoveNodesIndexes.push(j);
                        }
                    }
                    if (toRemoveNodesIndexes.length == 0)// none node  with target label in path
                        continue;

                    for (var j = 1; j < nodes.length; j++) {
                        if (toRemoveNodesIndexes.indexOf(j) < 0) {
                            var obj = {
                                rels: ["transitiveRelation"],
                                nodes: [nodes[0], nodes[j]],
                                ids: [ids[0], ids[j]],
                                labels: [labels[0], labels[j]],
                                startNodes: [startNodes[j]],
                                relProperties: [{
                                    properties: {type: "transitiveRelation", _fromId: ids[0], _id: -9999, _toId: ids[j]}
                                }]
                            }
                            resultArrayTransitive.push(obj);
                        }

                    }


                }


            }
            toutlesensController.collapseTargetLabels = [];
            if (resultArrayTransitive.length > 0)
                return resultArrayTransitive;
            else
                return resultArray;
        }
        self.prepareRawData = function (resultArray, addToPreviousQuery, output, callback) {
            totalNodesToDraw = resultArray.length;
            /*   if (currentDisplayType != "SIMPLE_FORCE_GRAPH_BULK" && totalNodesToDraw >= Gparams.maxResultSupported) {
                   toutlesensController.setGraphMessage("trop de resultats pour dessiner le graphe.Modifiez les parametres : > maximum "
                       + Gparams.maxResultSupported, "stop");
                   return;

               }*/


            var labels = [];
            var relations = [];

            for (var i = 0; i < resultArray.length; i++) {
                if (!resultArray[i].nodes) // !!!!bug à trouver
                    continue;
                for (var j = 0; j < resultArray[i].nodes.length; j++) {
                    /*   if(!resultArray[i].nodes[j].properties)
                           resultArray[i].nodes[j]["properties"]={a:1};*/
                    if (resultArray[i].nodes[j].properties.nom && !resultArray[i].nodes[j].properties.name)
                        resultArray[i].nodes[j].properties.name = resultArray[i].nodes[j].properties.nom;
                }

                if (!resultArray[i].labels) // !!!!bug à trouver
                    continue;
                for (var j = 0; j < resultArray[i].labels.length; j++) {
                    var label = resultArray[i].labels[j][0];
                    if (labels.indexOf(label) < 0)
                        labels.push(label)
                }
                if (!resultArray[i].rels) // !!!!bug à trouver
                    continue;
                for (var j = 0; j < resultArray[i].rels.length; j++) {
                    var relation = resultArray[i].rels[j];
                    if (relations.indexOf(relation) < 0)
                        relations.push(relation)
                }
            }


            callback(null, resultArray, labels, relations);


        }


        self.getNodeInfos = function (id, callback) {
            query = "MATCH (n) WHERE ID(n) =" + id + " RETURN n ";
            Cypher.executeCypher(query, function(err, result){
                if(err)
                    return callback(err);
                return callback(result);
            });


        }


        self.removeExcludedLabels = function (map) {
            var keysToExclude = [];
            for (key in map) {
                var nodeObj = map[key];
                if (nodeObj.parent != "root" && excludeLabels[nodeObj.label] > -1
                    && navigationPath.indexOf(nodeObj.id) < 0) {
                    keysToExclude.push(key);

                }
            }
            for (var i = 0; i < keysToExclude.length; i++) {
                delete map[keysToExclude[i]];
            }

        }

// eliminer les references circulaires
        self.deleteRecursiveReferences = function (nodesMap) {
            var idsToDelete = [];
            for (var key in nodesMap) {
                var parent = nodesMap[key].parent;
                // parmi les noeud qui ont pour parent un de leurs fils ont detruit
                // celui qui qui a pour parent lactuel noeud racine
                if (nodesMap[parent] && nodesMap[parent].parent == nodesMap[key].id) {
                    if (nodesMap[key].id != currentRootId) {
                        idsToDelete.push(nodesMap[key].id);
                        linksToSkip.push("" + nodesMap[key].id + "_"
                            + nodesMap[key].parent);

                    }
                }

            }
            for (var i = 0; i < idsToDelete.length; i++) {
                console.log(JSON.stringify(nodesMap[idsToDelete[i]]));

                delete nodesMap[idsToDelete[i]];

            }

        }

        self.addChildRecursive = function (node, nodesMap, level, maxLevels) {
            totalNodesToDraw = 0;

            maxEffectiveLevels = Math.max(maxEffectiveLevels, level);
            // maxEffectiveLevels=level;
            try {// max stack size limit
                for (var key in nodesMap) {

                    var aNode = nodesMap[key];
                    if (aNode.parent == aNode.id) // self relation
                        continue;
                    if (aNode.parent == node.id) {
                        if (excludeLabels && excludeLabels[aNode.label]
                            && excludeLabels[aNode.label] > -1)
                            continue;
                        if (aNode.show) {
                            var www = "a"
                        }
                        if (!nodesMap[key].visited) {
                            aNode.level = level;


                            if (level > maxLevels && !aNode.show) {
                                if (false && node.decoration) {// on dessine les noeuds avec des decorations meme s'ils sont au dernier niveau
                                    node.children.push(aNode);
                                    totalNodesToDraw += 1;
                                } else {
                                    node.hiddenChildren.push(aNode);
                                }
                            } else {
                                node.children.push(aNode);
                                totalNodesToDraw += 1;
                            }
                            self.addChildRecursive(aNode, nodesMap, level + 1, maxLevels);
                            nodesMap[key].visited = true;
                        } else {
                            ;// console.log(node.name);
                        }
                    }

                }
            } catch (e) {
                console.log(e);
            }

        }
        self.setNodesIndexPath = function (nodesMap) {
            for (var key in nodesMap) {
                var index = navigationPath.indexOf(nodesMap[key].id);
                if (index > -1)
                    nodesMap[key].navigationPathIndex = index;

            }
        }

        self.removeChildrenFromTree = function (json, myId) {
            foldedTreeChildren = [];
            self.recurse = function (node) {
                if (!node.children)
                    return;

                for (var i = 0; i < node.children.length; i++) {
                    if (node.children[i].myId == myId) {

                        if (node.children[i].children) {
                            for (var j = 0; j < node.children[i].children.length; j++) {
                                foldedTreeChildren
                                    .push(node.children[i].children[j].myId);
                            }
                            delete node.children[i].children;
                            return;

                        }
                    } else {
                        self.recurse(node.children[i]);
                    }

                }
            }

            self.recurse(json);
        }


        self.formatTreeToCsv = function (json) {
            self.recursiveSetParent = function (node) {
                if (!node.children || node.children.length == 0) {
                    leaves.push(node)
                } else {
                    for (var i = 0; i < node.children.length; i++) {
                        var child = node.children[i];
                        if (!child.ancestors)
                            child.ancestors = [];
                        child.parent = node;
                        self.recursiveSetParent(child);
                    }
                }

            }

            self.recursiveSetAncestors = function (leaf, ancestor) {
                if (!leaf.ancestors)
                    leaf.ancestors = [leaf];
                if (ancestor.parent) {
                    if (leaf.ancestors.indexOf(ancestor.parent) < 0) {
                        leaf.ancestors.push(ancestor.parent)
                        self.recursiveSetAncestors(leaf, ancestor.parent);
                    }
                }
            }

            var leaves = []
            self.recursiveSetParent(json);
            for (var i = 0; i < leaves.length; i++) {
                self.recursiveSetAncestors(leaves[i], leaves[i]);
            }

            var spreadSheetData = [];

            for (var i = 0; i < leaves.length; i++) {
                var line = [];
                var ancestors = leaves[i].ancestors;
                ancestors.splice(0, 0, leaves[i])

                for (var j = 0; j < ancestors.length - 1; j++) {// length-1 car le
                    // dernier ancetre est
                    // root

                    var name = ancestors[j].name;
                    if (name) {
                        label = "";
                        if (CSVWithLabel)
                            label = " [" + ancestors[j].label + "]";
                        line.push(name + label);

                        var relType = ancestors[j].relType;
                        if (relType) {
                            var direction = ancestors[j].relDir;
                            if (direction && direction == "normal")
                                relType += " ->";
                            else
                                var relType = " <-" + relType;
                            line.push(relType);
                        }

                    }
                }

                line.reverse();
                spreadSheetData.push(line);

            }
            return spreadSheetData;
        }

        self.clickDatatable = function () {

        }

        self.searchInProperties = function (value, callback) {
            var query = "$match (n) with n, [x in keys(n) WHERE n[x] =~ '(?i).*"
                + value
                + ".*' ] as doesMatch where size(doesMatch) > 0 return n limit "
                + limit;

            Cypher.executeCypher(query, callback);

        }

// }








        return self;
    }
)()