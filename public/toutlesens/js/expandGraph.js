var expandGraph = (function () {
    var self = {};
    self.openedClusterId;

    self.execute = function () {
        var filter = self.getExpandWhereFilter();
        var sourceLabel = $('#expand_labelsSelectSource').val();
        var targetLabel = $('#expand_labelsSelectTarget').val()
        var clusterLimit = parseInt($("#expand_clusterMinLimit").val());

        if (sourceLabel == "" || targetLabel == "")
            return;


        var ids = visjsGraph.getNodesNeoIdsByLabelNeo(sourceLabel);
        var where = toutlesensData.getWhereClauseFromArray("_id", ids, "n");
        var cypher = "match(n:" + sourceLabel + ")-[r]-(m:" + targetLabel + ")" +
            " where " + where + " " +
            " return n, collect(m) as mArray" +
            " limit " + Gparams.maxResultSupported

        console.log(cypher);
        var newNodes = [];
        var newEdges = [];
        Cypher.executeCypher(cypher, function (err, result) {
            if (err)
                return console.log(err);
            var nodes = visjsGraph.nodes._data;
            var edges = visjsGraph.edges._data;

            var newNodeIds = [];


            function getSizeBounds() {
                var max = -1
                result.forEach(function (line) {
                    var size = line.mArray.length;
                    max = Math.max(max, size);
                });

                return {min: clusterLimit, max: max};
            }

            var sizeBounds = getSizeBounds()
            var scaleSizefn = d3.scaleLinear().domain([sizeBounds.min, sizeBounds.max]).range([20, 100]);


            result.forEach(function (line) {
                var size = line.mArray.length;
                if (size > clusterLimit) { // make one node containing all clusterd nodes and link it

                    var clusterIds = [];
                    var clusterNames = [];
                    line.mArray.forEach(function (neoNode) {
                        clusterIds.push(neoNode._id);
                    })
                    var clusterId = "cluster" + targetLabel + "_" + line.n._id;
                    var relId = "" + Math.random();
                    var relType = "expand";
                    var nodeNeo = {
                        _id: clusterId,
                        properties: {name: "" + size, clusterIds, clusterNames: clusterNames,sourceNodeId:line.n._id},
                        labels: [targetLabel],

                    }
                    var visjsNode = connectors.getVisjsNodeFromNeoNode(nodeNeo,true);

                    var nodeSize = scaleSizefn(size);
                    console.log(nodeSize)
                    visjsNode.value = nodeSize;
                    visjsNode.size = nodeSize;
                    //   visjsNode.shape= 'circle'
                    newNodes.push(visjsNode);

                    var visjsEdge = connectors.getVisjsRelFromNeoRel(line.n._id, clusterId, relId, relType, {});
                    newEdges.push(visjsEdge);


                } else {// make visjs node and rel for each neonode

                    line.mArray.forEach(function (neoNode) {

                        if (!visjsGraph.nodes._data[neoNode._id]) {
                            if (newNodeIds.indexOf(neoNode._id) < 0) {
                                newNodeIds.push(neoNode._id);
                                var visjsNode = connectors.getVisjsNodeFromNeoNode(neoNode,true);
                                newNodes.push(visjsNode);
                            }
                        }


                        var from = line.n._id;
                        var to = neoNode._id;
                        var relId = "" + Math.random();
                        var relType = "expand"

                        var visjsEdge = connectors.getVisjsRelFromNeoRel(from, to, relId, relType, {});
                        newEdges.push(visjsEdge);

                    })


                }


            })

            self.drawGraph(newNodes,newEdges,targetLabel)

        })


    }


    self.openCluster = function () {
        var clusterNodeIds = context.currentNode.neoAttrs.clusterIds;
        var clusterId=context.currentNode.id;
       var  sourceNodeId= context.currentNode.neoAttrs.sourceNodeId;

        self.openedClusterId=clusterId


        var cypher="Match (n) where "+toutlesensData.getWhereClauseFromArray("_id",clusterNodeIds)+ "return n";
        Cypher.executeCypher(cypher, function(err, result){
            var newNodes = [];
            var newEdges = [];
            var newNodeIds=[];


            result.forEach(function (line) {
               var  neoNode=line.n;

            if (!visjsGraph.nodes._data[neoNode._id]) {
                if (newNodeIds.indexOf(neoNode._id) < 0) {
                    newNodeIds.push(neoNode._id);
                    var visjsNode = connectors.getVisjsNodeFromNeoNode(neoNode, true);
                    visjsNode.clusterId=clusterId;
                    newNodes.push(visjsNode);
                }
            }

            var from = sourceNodeId;
            var to = neoNode._id;
            var relId = "" + Math.random();
            var relType = "expand"

            var visjsEdge = connectors.getVisjsRelFromNeoRel(from, to, relId, relType, {});
            newEdges.push(visjsEdge);
        })


            self.drawGraph(newNodes,newEdges,context.currentNode.labelNeo)
            visjsGraph.nodes.update({id:clusterId,hidden:true});

        })




    }

    self.closeCluster=function(clusterId){
        var nodes=[]
        for(var key in visjsGraph.nodes._data){
            var node=visjsGraph.nodes._data[key];
            if(node.clusterId && node.clusterId==clusterId) {
                nodes.push({id: node.id, hidden: true});
            }

        }
        nodes.push({id: clusterId, hidden: null});

        visjsGraph.nodes.update(nodes);


    }

    self.drawGraph=function(newNodes,newEdges,targetLabel){
        function mapToArray(map) {
            var array = [];
            for (var key in map)
                array.push(map[key]);
            return array

        }


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
        context.queryObject={label:context.currentNode.labelNeo,
            nodeIds:clusterIds
        }

        searchMenu.execute("tableNodes")



    }


    self.initExpandWhere = function () {
        $("#expandWhereDiv").show()
        var label = $("#expand_labelsSelectTarget").val();
        var props = Object.keys(Schema.schema.properties[label]);

        common.fillSelectOptionsWithStringArray(expandWhere_propertySelect, props, true);


    }


    self.initSourceLabel=function(){
        //   common.fillSelectOptionsWithStringArray(expand_labelsSelectSource, Schema.getAllLabelNames(),true);
        var emptyOption=true;
        if(visjsGraph.legendLabels.length==1) {
            emptyOption = false;
            self.setSourceLabel(visjsGraph.legendLabels[0])
        }

        common.fillSelectOptionsWithStringArray(expand_labelsSelectSource, visjsGraph.legendLabels,emptyOption);

    }
    self.setSourceLabel = function (label) {
        $("#expandWhereDiv").hide()
        $('#expand_labelsSelectSource').val(label);
        $("#expandWhere_propertySelect").val("");

        var targetLabels = Schema.getPermittedLabels(label, true, true);
        common.fillSelectOptionsWithStringArray(expand_labelsSelectTarget, targetLabels, true);

    }


    self.getExpandWhereFilter = function () {
        if ($("#expandWhere_propertySelect").val() == "")
            return;
        var targetWhereClause = $("#expandWhere_propertySelect").val() + ":" + $("#expandWhere_operatorSelect").val() + " " + $("#expandWhere_valueInput").val();

        var filter = advancedSearch.buildWhereClauseFromUI(targetWhereClause, "m");
        return filter;

    }


    return self;

})()