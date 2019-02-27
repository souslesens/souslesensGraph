var expandGraph = (function () {
    var self = {};
    self.openedClusterId;
    self.initialDataset;
    self.expandedNodes = [];


    hasClusters = false;


    var mapToArray = function (map) {
        var array = [];
        for (var key in map)
            array.push(map[key]);
        return array

    }

    self.expandFromUI = function () {
        var filter = self.getExpandWhereFilter();
        var sourceLabel = $('#expand_labelsSelectSource').val();
        var targetLabel = $('#expand_labelsSelectTarget').val()
        var clusterLimit = parseInt($("#expand_clusterMinLimit").val());


        if (!sourceLabel || sourceLabel == "")
            return alert("select from label")
        if (!targetLabel || targetLabel == "")
            return alert("select to label")
        if (isNaN(clusterLimit))
            return alert("enter a number")

        var showAllNewNodesrelations = $("#expand_showAllrelationsCbx").prop("checked");
        self.expandedNodes = []
        self.initialDataset = {
            nodes: mapToArray(visjsGraph.nodes._data),
            edges: mapToArray(visjsGraph.edges._data),
        }
        if (sourceLabel == "" || targetLabel == "")
            return;
        var ids = visjsGraph.getNodesNeoIdsByLabelNeo(sourceLabel);
        var where = searchNodes.getWhereClauseFromArray("_id", ids, "n");

        var cypher = "match(n:" + sourceLabel + ")-[r]-(m:" + targetLabel + ")" +
            " where " + where + " " +//" and NOT p:"+sourceLabel+
            " return n, collect(m) as mArray  , type(r) as relType, r as rel" +
            " limit " + Gparams.maxResultSupported;
        if (hasClusters)// on redessinne d'abord le graphe
            buildPaths.drawGraph(buildPaths.currentDataset.data.nodes, function () {
                self.execute(cypher, clusterLimit, showAllNewNodesrelations, targetLabel);
            });
        else {
            self.execute(cypher, clusterLimit, showAllNewNodesrelations, targetLabel);
        }


    }


    self.expandFromNode = function (currentNode, label) {

        var targetLabelStr = "";
        if (label)
            targetLabelStr = ":" + label;
        var cypher = "match(n:" + currentNode.label + ")-[r]-(m" + targetLabelStr + ")" +
            " where id(n)=" + currentNode.id + " " +//" and NOT p:"+sourceLabel+
            " return n, collect(m) as mArray, type(r) as relType, r as rel" +
            " limit " + Gparams.maxResultSupported;
        self.execute(cypher, 1000, true, label);


    }






    self.execute = function (cypher, clusterLimit, showAllNewNodesrelations, targetLabel) {

        console.log(cypher);
        var newNodes = [];
        var newEdges = [];
        var newNodeIds = [];
        var mArrayIds = [];
        self.relType = [];
        Cypher.executeCypher(cypher, function (err, result) {
            if (err)
                return console.log(err);
            var nodes = visjsGraph.nodes._data;
            var edges = visjsGraph.edges._data;

            var allLabels = [];


            function getSizeBounds() {
                var max = -1
                result.forEach(function (line) {
                    var size = line.mArray.length;
                    max = Math.max(max, size);
                });

                return {min: clusterLimit, max: max};
            }

            function  setEdgeColors(lines){
                var newRelTypes = [];
                var allRelTypes=[];
                for(var key in context.edgeColors){
                    allRelTypes.push(key);
                }

                lines.forEach(function (line) {
                    var relType = line.relType;
                    if (newRelTypes.indexOf(relType) < 0)
                        newRelTypes.push(relType);
                })
                allRelTypes=allRelTypes.concat(newRelTypes);
                searchRelations.setEdgeColors(allRelTypes);
                return allRelTypes;
            }









            var sizeBounds = getSizeBounds()
            var scaleSizefn = d3.scaleLinear().domain([sizeBounds.min, sizeBounds.max]).range([20, 100]);
            hasClusters = false;
           var allRelTypes= setEdgeColors(result);



            result.forEach(function (line) {
                var size = line.mArray.length;

                // **********************CLUSTER  make one node containing all clustered nodes and link it*******************
                if (size > clusterLimit) {
                    hasClusters = true;
                    var clusterIds = [];
                    var clusterNames = [];
                    line.mArray.forEach(function (neoNode) {
                        mArrayIds.push(neoNode._id)
                        clusterIds.push(neoNode._id);
                        self.expandedNodes.push(neoNode._id)
                    })
                    var clusterId = "cluster" + targetLabel + "_" + line.n._id;
                    var relId = "" + Math.random();

                    var relProps = line.rel.properties;
                    if (context.currentRelations.types.indexOf(relType) < 0)
                        context.currentRelations.types.push(relType);
                    if (context.currentRelations.props.indexOf(relProps) < 0)
                        context.currentRelations.props.push(relProps);


                    var nodeNeo = {
                        _id: clusterId,
                        properties: {
                            name: "" + size,
                            clusterIds: clusterIds,
                            clusterNames: clusterNames,
                            sourceNodeId: line.n._id
                        },
                        labels: [targetLabel],

                    }
                    if (visjsGraph.legendLabels.indexOf(targetLabel) < 0)
                        visjsGraph.legendLabels.push(targetLabel);

                    var visjsNode = connectors.getVisjsNodeFromNeoNode(nodeNeo, true);

                    var nodeSize = scaleSizefn(size);

                    visjsNode.value = nodeSize;
                    visjsNode.size = nodeSize;
                    visjsNode.shape = 'triangle'
                    visjsNode.borderWidth = 3
                    newNodes.push(visjsNode);

                    var visjsEdge = connectors.getVisjsRelFromNeoRel(line.n._id, clusterId, relId, relType, relProps);
                    newEdges.push(visjsEdge);


                    // **********************NOT CLUSTER  make one node containing all clustered nodes and link it*******************
                } else {// make visjs node and rel for each neo4jnode

                    line.mArray.forEach(function (neoNode) {
                        mArrayIds.push(neoNode._id)
                        if (!visjsGraph.nodes._data[neoNode._id]) {
                            self.expandedNodes.push(neoNode._id)
                            if (newNodeIds.indexOf(neoNode._id) < 0) {
                                newNodeIds.push(neoNode._id);

                                var visjsNode = connectors.getVisjsNodeFromNeoNode(neoNode, true);
                                newNodes.push(visjsNode);
                            }
                        }
                        var label = neoNode.labels[0]
                        if (visjsGraph.legendLabels.indexOf(label) < 0)
                            visjsGraph.legendLabels.push(label);


                        var from = line.n._id;
                        var to = neoNode._id;
                        var relId = "" + Math.random();
                        var relType = line.relType;
                        var relProps = line.rel.properties;

                        var visjsEdge = connectors.getVisjsRelFromNeoRel(from, to, relId, relType, relProps);
                        newEdges.push(visjsEdge);

                    })


                }


            })

            // **********************make  links with other nodes than expanded node*******************

            self.newNodes = newNodes;
            self.drawGraph(newNodes, newEdges, targetLabel);


            visjsGraph.drawLegend(visjsGraph.legendLabels,allRelTypes);

            if (showAllNewNodesrelations) {
                // create edges with nodes other than source node


                var cypher = "Match (n)-[r]-(m) where " + searchNodes.getWhereClauseFromArray("_id", self.expandedNodes, "n") + "return id(n) as nId,labels(n)[0] as clusterLabel, collect(id(m)) as mIds, type(r) as relType";
                Cypher.executeCypher(cypher, function (err, result) {
                    var newEdges2 = [];

                    result.forEach(function (line) {


                        line.mIds.forEach(function (mId) {
                            if (visjsGraph.nodes._data[mId]) {
                                var relPId = "" + Math.random();
                                var visjsEdge2 = connectors.getVisjsRelFromNeoRel(line.nId, mId, relPId, "expand2", {});
                                newEdges2.push(visjsEdge2);
                            }
                        })

                        var clusterId = "cluster" + line.clusterLabel + "_" + line.nId;
                        for (var key in visjsGraph.nodes._data) {
                            if (key.indexOf("cluster") == 0) {

                                var clusterIds = visjsGraph.nodes._data[key].neoAttrs.clusterIds;
                                if (clusterIds && clusterIds.indexOf(line.nId) > -1) {
                                    var relPId = "" + Math.random();
                                    var visjsEdge2 = connectors.getVisjsRelFromNeoRel(line.nId, key, relPId, "expand2", {});
                                    newEdges2.push(visjsEdge2);

                                }
                            }
                        }

                    })
                    visjsGraph.edges.update(newEdges2);

                })
            }
        })


    }


    self.openCluster = function () {
        var clusterNodeIds = context.currentNode.neoAttrs.clusterIds;
        var clusterId = context.currentNode.id;
        var sourceNodeId = context.currentNode.neoAttrs.sourceNodeId;

        self.openedClusterId = clusterId


        var cypher = "Match (n)-[r]-(m) where " + searchNodes.getWhereClauseFromArray("_id", clusterNodeIds) + "return n,collect(id(m)) as mIds";
        Cypher.executeCypher(cypher, function (err, result) {
            var newNodes = [];
            var newEdges = [];
            var newNodeIds = [];


            result.forEach(function (line) {
                var neoNode = line.n;

                if (!visjsGraph.nodes._data[neoNode._id]) {
                    if (newNodeIds.indexOf(neoNode._id) < 0) {
                        newNodeIds.push(neoNode._id);
                        var visjsNode = connectors.getVisjsNodeFromNeoNode(neoNode, true);
                        visjsNode.clusterId = clusterId;
                        newNodes.push(visjsNode);
                    }
                }

                var from = sourceNodeId;
                var to = neoNode._id;
                var relId = "" + Math.random();
                var relType = line.relType;
                var relProps = line.rel.properties;

                var visjsEdge = connectors.getVisjsRelFromNeoRel(from, to, relId, relType, relProps);
                newEdges.push(visjsEdge);

                // link opened nodes to others nodes on graph

                line.mIds.forEach(function (neoTargetNodeId) {
                    if (visjsGraph.nodes._data[neoNode._id]) {
                        var from = neoTargetNodeId;
                        var to = neoNode._id;
                        var relId = "" + Math.random();
                        var relType = "expand"
                        var visjsEdge2 = connectors.getVisjsRelFromNeoRel(from, to, relId, relType, relProps);
                        newEdges.push(visjsEdge2);
                    }

                })
            })


            self.drawGraph(newNodes, newEdges, context.currentNode.labelNeo)
            visjsGraph.nodes.update({id: clusterId, hidden: true});

        })


    }


    self.closeClusters = function (clusterId) {
        visjsGraph.draw("graphDiv", self.initialDataset, {});
    }

    /**
     * not used
     *  to be finsihed
     *
     */

    self.closeCluster = function (clusterId) {
        var nodes = [];
        var edges = []
        for (var key in visjsGraph.nodes._data) {
            var node = visjsGraph.nodes._data[key];
            if (node.clusterId && node.clusterId == clusterId) {
                nodes.push({id: node.id, hidden: true});
                var edges2 = visjsGraph.network.getConnectedEdges(node.id);
                edges2.forEach(function (edge) {
                    edges.push({id: edge, hidden: true});
                })
            }

        }


        nodes.push({id: clusterId, hidden: null});

        visjsGraph.nodes.update(nodes);
        visjsGraph.edges.update(edges);


    }

    self.drawGraph = function (newNodes, newEdges, targetLabel) {


        var allNodes = mapToArray(visjsGraph.nodes._data).concat(newNodes);
        var allEdges = mapToArray(visjsGraph.edges._data).concat(newEdges);
        var newVisjsData = {
            nodes: allNodes,
            edges: allEdges

        }

        visjsGraph.draw("graphDiv", newVisjsData, {});
        var labels = visjsGraph.legendLabels;
        labels.push(targetLabel)
        visjsGraph.drawLegend(labels)

    }
    self.listClusterNodes = function () {
        var clusterIds = context.currentNode.neoAttrs.clusterIds;
        context.queryObject = {
            label: context.currentNode.labelNeo,
            nodeIds: clusterIds
        }

        searchNodes.execute("tableNodes")


    }


    self.initExpandWhere = function () {
        $("#expandWhereDiv").show()
        var label = $("#expand_labelsSelectTarget").val();
        var props = Object.keys(Schema.schema.properties[label]);

        common.fillSelectOptionsWithStringArray(expandWhere_propertySelect, props, true);


    }


    self.initSourceLabel = function (labels) {
        //   common.fillSelectOptionsWithStringArray(expand_labelsSelectSource, Schema.getAllLabelNames(),true);
        var emptyOption = false;
        if (labels.length == 1) {
            emptyOption = false;
            self.setTargetLabel(labels[0])
        }

        common.fillSelectOptionsWithStringArray(expand_labelsSelectSource, labels, emptyOption);
        if (labels.length == 1) {
            $("#expand_labelsSelectSource").val(visjsGraph.legendLabels[0])
        }

    }
    self.setTargetLabel = function (label) {
        $("#expandWhereDiv").hide()
        $('#expand_labelsSelectSource').val(label);
        $("#expandWhere_propertySelect").val("");

        var targetLabels = Schema.getPermittedLabels(label, true, true);
        common.fillSelectOptionsWithStringArray(expand_labelsSelectTarget, targetLabels);
        if(targetLabels.length==1)
            $("#expand_labelsSelectTarget").prop("selectedIndex",0)


    }


    self.getExpandWhereFilter = function () {
        if ($("#expandWhere_propertySelect").val() == "")
            return;

        var queryobject = {
            property: $("#expandWhere_propertySelect").val(),
            operator: $("#expandWhere_operatorSelect").val(),
            value: $("#expandWhere_valueInput").val()
        }
        var filter = searchNodes.getWhereClauseFromQueryObject(queryobject, "m");
        return filter;

    }


    return self;

})()