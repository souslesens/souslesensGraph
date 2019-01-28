var algorithms = (function () {
    var self = {};
    self.currentAlgorithm;
    var sharedTargets = {};
    var sourceLabel;
    self.algorithms = {
        "relationsRanking": {},


        "similarities jaccard": {

            cypher: "Match (n:<%sourceLabel%>)-[r]-(c:<%targetLabel%>) <%where%> \n" +
            "WITH {item:id(n), categories: collect(id(c))} as userData, count(c)  as cnt where cnt><%minCountTargetNode%>\n" +
            "WITH collect(userData) as data\n" +
            "CALL algo.similarity.jaccard.stream(data, {topK: 3, similarityCutoff: <%similarityCutoff%>})\n" +
            "YIELD item1, item2, count1, count2, intersection, similarity\n" +
            "with  algo.getNodeById(item1) AS from, algo.getNodeById(item2) AS  to, similarity \n" +
            "  match path=((from)-[]-(c2:<%targetLabel%>)-[]-(to)) \n" +
            "return ID(from) as fromId,from,collect(c2.name) as sharedTargets,count(c2) as cnt, to, ID(to) as toId,similarity order by  cnt desc" +
            " limit <%resultSize%>"

            ,

            displayFunction: function (result) {

                var targetLabel = $("#searchDialog_AlgorithmsTargetLabelSelect").val();
                var similarityCutoff = parseFloat($("#searchDialog_AlgorithmsSimilarityCutoff").val());
                var nodeNameVal = Schema.getNameProperty();
                var uniqueNodes = [];
                var nodes = [];
                var rels = [];
                var labels = [];
                var similarityScale = d3.scale.linear().domain([similarityCutoff, 1]).range([1, 10]);
                var cntLimits = {min: 100000, max: 0}

                result.forEach(function (line, index0) {
                    line.sharedTargets = line.sharedTargets.sort();
                    var sharedTargetsStr = line.sharedTargets.toString();
                    if (!sharedTargets[sharedTargetsStr]) {
                        sharedTargets[sharedTargetsStr] = [];
                        sharedTargets[sharedTargetsStr].similarity = line.similarity;
                        sharedTargets[sharedTargetsStr].cnt = line.cnt;
                        cntLimits.min = Math.min(cntLimits.min, line.cnt)
                        cntLimits.max = Math.max(cntLimits.max, line.cnt)

                    }
                    if (sharedTargets[sharedTargetsStr].indexOf(line.fromId) < 0) {
                        sharedTargets[sharedTargetsStr].push(line.from)
                    }
                    if (sharedTargets[sharedTargetsStr].indexOf(line.toId) < 0) {
                        sharedTargets[sharedTargetsStr].push(line.to)
                    }
                })
                var i = 1000000
                var cntScale = d3.scale.linear().domain([cntLimits.min, cntLimits.max]).range([10, 40]);
                for (var key in sharedTargets) {
                    var sharedId = "similar_" + (i++);
                    var label = sharedTargets[key].cnt + "" + targetLabel;
                    var targetNodeObj = {
                        labelNeo: "sharedSimilarity",// because visjs where label is the node name
                        background: "#d11",
                        shape: "square",
                        size: cntScale(sharedTargets[key].cnt),
                        id: sharedId,
                        label: label,
                        hiddenLabel: label,
                        neoAttrs: {name: key},
                    }
                    nodes.push(targetNodeObj);
                    sharedTargets[key].forEach(function (node, index0) {
                        if (uniqueNodes.indexOf(node._id) < 0) {
                            uniqueNodes.push(node._id);

                            var props = node.properties;
                            var nodeObj = {
                                labelNeo: props.label,// because visjs where label is the node name
                                background: nodeColors[props.label],
                                id: node._id,
                                label: props.name,
                                hiddenLabel: props.name,
                                neoAttrs: props,
                            }
                            nodes.push(nodeObj);
                        }

                        rels.push({
                            from: sharedId,
                            to: node._id,
                            neoAttrs: {similarity: sharedTargets[key].similarity, sharedTargets: key},
                            width: Math.round(similarityScale(sharedTargets[key].similarity)),
                            color: "#AAA"
                        })
                    })
                }

                var visjsData = {
                    nodes: nodes,
                    edges: rels
                }
                var options = {
                    onClick: function (params) {
                        if (params.nodes.length == 1) {
                            var nodeId = params.nodes[0];
                            var obj = visjsGraph.nodes._data[nodeId];
                            var point = params.pointer.DOM;
                            var html = obj.neoAttrs.name;
                            visjsGraph.setNodesColor([nodeId], "green");
                            if (nodeId.indexOf("similar_") == 0) {// targetSimilar
                                html += "<br> <a href='javascript:algorithms.useSelection(\"similars\",\"" + targetLabel + "\",\"" + obj.neoAttrs.name + "\");'> use similars selection...</a>";
                                html += "<br> <a href='javascript:algorithms.useSelection(\"cluster\",\"" + targetLabel + "\",\"" + nodeId + "\");'> use clustered nodes selection...</a>";
                                $("#graphPopup").html(html)
                                $("#graphPopup").css("visibility", "visible").css("top", point.y).css("left", point.x);
                            }
                            else {
                                context.currentNode.id = nodeId
                                toutlesensController.dispatchAction("onNodeClick", nodeId);
                                toutlesensController.showPopupMenu(point.x, point.y, "nodeInfo");
                            }


                        }
                        else {
                            $("#graphPopup").css("visibility", "hidden")
                        }
                    }
                }
                visjsGraph.draw("graphDiv", visjsData, options, function (err, result) {

                })
            }
        }


        ,
        "similarities jaccardOld": {

            cypher: "Match (n:<%sourceLabel%>)-[r]-(c:<%targetLabel%>) <%where%> \n" +
            "WITH {item:id(n), categories: collect(id(c))} as userData, count(c)  as cnt where cnt><%minCountTargetNode%>\n" +
            "WITH collect(userData) as data\n" +
            "CALL algo.similarity.jaccard.stream(data, {topK: 3, similarityCutoff: <%similarityCutoff%>})\n" +
            "YIELD item1, item2, count1, count2, intersection, similarity\n" +
            " return   algo.getNodeById(item1) AS sourceNode, algo.getNodeById(item2) AS  targetNode, similarity" +
            " limit <%resultSize%>"
            ,


            displayFunction:

                function (result) {

                    var targetLabel = $("#searchDialog_AlgorithmsTargetLabelSelect").val();
                    var similarityCutoff = parseFloat($("#searchDialog_AlgorithmsSimilarityCutoff").val());
                    var nodeNameVal = Schema.getNameProperty();
                    var uniqueNodes = [];
                    var nodes = [];
                    var rels = [];
                    var labels = [];
                    var similarityScale = d3.scale.linear().domain([similarityCutoff, 1]).range([1, 6]);
                    result.forEach(function (line, index0) {

                        if (uniqueNodes.indexOf(line.sourceNode._id) < 0) {
                            uniqueNodes.push(line.sourceNode._id);
                            var label = line.sourceNode.labels[0];
                            if (labels.indexOf(label) < 0)
                                labels.push(label);
                            var label = line.sourceNode.properties[nodeNameVal];
                            var nodeObj = {
                                labelNeo: label,// because visjs where label is the node name
                                background: nodeColors[label],
                                id: line.sourceNode._id,
                                label: label,
                                hiddenLabel: label,
                                neoAttrs: line.sourceNode.properties,
                            }
                            nodes.push(nodeObj);
                        }

                        if (uniqueNodes.indexOf(line.targetNode._id) < 0) {
                            uniqueNodes.push(line.targetNode._id);
                            var label = line.targetNode.labels[0];
                            if (labels.indexOf(label) < 0)
                                labels.push(label);
                            var label = line.targetNode.properties[nodeNameVal];
                            var nodeObj = {
                                labelNeo: label,// because visjs where label is the node name
                                background: nodeColors[label],
                                id: line.targetNode._id,
                                label: label,
                                hiddenLabel: label,

                                neoAttrs: line.targetNode.properties,
                            }
                            nodes.push(nodeObj);
                        }

                        rels.push({
                            from: line.sourceNode._id,
                            to: line.targetNode._id,
                            neoAttrs: {similarity: line.similarity},
                            width: Math.round(similarityScale(line.similarity)),
                            color: "#AAA"
                        })


                    })
                    //searchTargetNodes
                    currentLabel = targetLabel;
                    toutlesensController.generateGraph(uniqueNodes, {}, function (err, result) {
                        visjsGraph.edges.update(rels);
                        currentLabel = null;
                    })


                }
        }


        ,
        other: {

            cypher: "Match (p1:paragraph)-[r]-(c:concept)-[r2]-(p2:paragraph) where p1.text<>p2.text with p1,p2,count(r) as cnt where cnt >2 " +
            "CREATE (p1)-[r:similar{nconcepts:cnt}]->(p2)",

            cypher2:
                "Match (p1:paragraph)-[r]-(c:concept)-[r2]-(p2:paragraph) where p1.text<>p2.text with p1,p2,count(r) as count where count >0 CALL apoc.create.vRelationship(p1,'virtualRel',{count:count},p2) yield rel return * limit 100"

            ,
            cypher3:
            "CALL algo.louvain(\n" +
            "  'MATCH (p:paragraph) RETURN id(p) as id',\n" +
            "  'MATCH (p1:paragraph)-[]->(c:concept)<-[]-(p2:paragraph)   RETURN id(p1) as source, id(p2) as target, c.weight as weight',\n" +
            "  {graph:'cypher',write:true});"

            ,
            cypher4:
                "match(n:tag)<-[r]-(m) with n,m,count(r) as cnt where cnt>0 and n.subGraph=\"keosphere19\" return n,m limit 100"  // pas plus de 1  tag par document !!!
        }
    }

    self.useSelection = function (type, label, key) {


        var coeff = 0.5;
        var limit = 100;
        var cypher = "";


        function useSelection(ids) {
            context.queryObject = {
                label: sourceLabel,
                where: toutlesensData.getWhereClauseFromArray("_id", ids, "n"),
                nodeIds: ids,
                clauseText: "[" + label + "] " + key
            }

            searchMenu.activatePanel("searchActionDiv");
            $("#graphPopup").css("visibility", "hidden");
            toutlesensController.openFindAccordionPanel(true)
            findTabs.tabs("option", "active", 0);

        }


        if (type == "similars") {// tous les noeuds source ayant le plus de noeud target en commun
            var xx = key;
            var targetKeysStr = "[\"" + key.replace(/,/g, "\",\"") + "\"]";


            cypher = "WITH " + targetKeysStr + " as names\n" +
                "MATCH (p:" + label + ")-[]-(m:" + sourceLabel + ")\n" +
                "WHERE p.name in names\n" +
                "WITH m, size(names) as inputCnt, count(DISTINCT p) as cnt\n" +
                "WHERE cnt > inputCnt*" + coeff + "\n" +
                " RETURN collect(id(m)) as ids, cnt order by cnt desc  limit " + limit

            // console.log(cypher);
            Cypher.executeCypher(cypher, function (err, result) {
                if (err)
                    return console.log(err);
                var ids = result[0].ids
                useSelection(ids)

            })
        }
        else if (type == "cluster") {// uniquement les noeuds du cluster

            var clusteredNodes = visjsGraph.getConnectedNodes(key)
            useSelection(clusteredNodes)
        }


    }


    self.initDialog = function (label) {
        $('.algorithmParam0').hide();
        if (label)
            common.fillSelectOptionsWithStringArray(searchDialog_AlgorithmsTargetLabelSelect, Schema.getPermittedLabels(label, true, true), true, true)
        else
            toutlesensController.initLabels(searchDialog_AlgorithmsTargetLabelSelect, true);

        common.fillSelectOptionsWithStringArray(searchDialog_algorithmSelect, Object.keys(self.algorithms), true)


    }
    self.initAlgorithm = function (algoName) {
        // $(".algorithmParam0").hide();
        $('.algorithmParam0').hide();
        if (algoName == "similarities jaccard") {
            $("#searchDialog_AlgorithmsResultSize").val("1000");
            $('.algorithmParam0').show();


        }
        else if (algoName == "relationsRanking") {
            $("#searchDialog_AlgorithmsResultSize").val("100");
            $('.algorithmParam0.algorithmParam1').show();
        }

    }

    self.execute = function (queryObject) {
        var algorithm = $("#searchDialog_algorithmSelect").val();
        self.currentAlgorithm = algorithm;

        sourceLabel = queryObject.label;
        var targetLabel = $("#searchDialog_AlgorithmsTargetLabelSelect").val();

        if (algorithm == "relationsRanking") {
            var limit = $("#searchDialog_AlgorithmsResultSize").val();

            Cypher.executeCypher(cypher, function (err, result) {
                    if (err)
                        console.log(err);
                    if (result.length == 0) {
                        $("#waitImg").css("visibility", "hidden");
                        toutlesensController.setGraphMessage("No result")
                        return;
                    }
                    var statsData = [];
                    result.forEach(function (line) {
                        statsData.push({name: line.n.properties[Schema.getNameProperty()], count: line.cnt})
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


            return;
        }


        var minCountTargetNode = $("#searchDialog_AlgorithmsMinCountTargetNodes").val();
        var resultSize = $("#searchDialog_AlgorithmsResultSize").val();
        var similarityCutoff = $("#searchDialog_AlgorithmsSimilarityCutoff").val();
        var where = toutlesensData.getWhereClauseFromArray("_id", queryObject.nodeIds, "n")
        if (where && where.length > 0)
            where = " WHERE " + where


        var algoStr = self.algorithms[algorithm].cypher;
        var array;
        while ((array = /<%([^%>]*)%>/g.exec(algoStr)) != null) {
            var str = array[1];
            var value = eval(str);
            algoStr = algoStr.replace(array[0], value);
        }
        console.log(algoStr)
        Cypher.executeCypher(algoStr, function (err, result) {
            if (err)
                console.log(err);
            if (result.length == 0) {
                $("#waitImg").css("visibility", "hidden");
                toutlesensController.setGraphMessage("No result")
                return;
            }

            /*  toutlesensController.displayGraph(result,{},function(err, callback){
                  var x=result;
              })*/
            self.algorithms[algorithm].displayFunction(result)


        })


    }

    /*
      Match (p:document)-[r]-(c:tag)
    WITH {item:id(p), categories: collect(id(c))} as userData, count(c)  as cnt where cnt>5
    WITH collect(userData) as data
    CALL algo.similarity.jaccard.stream(data, {topK: 3, similarityCutoff: 0.8})
    YIELD item1, item2, count1, count2, intersection, similarity
    with  algo.getNodeById(item1) AS from, algo.getNodeById(item2) AS  to, similarity
     match (from)-[]-(c2:tag)-[]-(to)   return from.Titre , to.Titre ,c2.name
     limit 100







      CALL algo.pageRank.stream('paragraph', 'similar', {iterations:20, dampingFactor:0.85})
    YIELD nodeId, score

    RETURN algo.getNodeById(nodeId).name AS page,score
    ORDER BY score DESC


    CALL algo.louvain.stream('paragraph', 'similar', {})
    YIELD nodeId, community

    RETURN algo.getNodeById(nodeId).id AS user, community
    ORDER BY community;




    WITH {item:id(p), categories: collect(id(c))} as userData, count(c)  as cnt where cnt>3
    WITH collect(userData) as data
    CALL algo.similarity.jaccard.stream(data, {topK: 3, similarityCutoff: 0.8})
    YIELD item1, item2, count1, count2, intersection, similarity
    RETURN algo.getNodeById(item1).text AS from, algo.getNodeById(item2).text AS to, similarity,
    ORDER BY from limit 100





    generateGaph







    // Centralité Louvain - Ecrire
    CALL algo.labelPropagation(
    'MATCH (c) RETURN id(c) as id',
    'MATCH (c)-[rel]->(c2) RETURN id(c) as source, id(c2) as target, SUM(rel.weight) as weight',
    'OUTGOING',
    {graph:'cypher', partitionProperty: 'community'})

    // Centralité Louvain - Interroger
    CALL algo.betweenness.stream("", "", {direction: "BOTH"})
    YIELD nodeId, centrality
    MATCH (c) WHERE ID(c) = nodeId
    RETURN c.nom, ToInteger(centrality)
    ORDER BY centrality DESC
    LIMIT 10



       */
    return self;


})
();
