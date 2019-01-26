var expandGraph = (function () {
    var self = {};
    self.setSourceLabel = function (label) {
        $("#expandWhereDiv").hide()
        $('#expand_labelsSelectSource').val(label);
        $("#expandWhere_propertySelect").val("");

        var targetLabels = Schema.getPermittedLabels(label, true, true);
        common.fillSelectOptionsWithStringArray(expand_labelsSelectTarget, targetLabels, true);

    }

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
        Cypher.executeCypher(cypher, function (err, result) {
            if (err)
                return console.log(err);
            var nodes = visjsGraph.nodes._data;
            var edges = visjsGraph.edges._data;
            var newNodes = [];
            var newEdges = [];
            var newNodeIds = [];


            function getclusterSizeScale() {

                var max = -1
                result.forEach(function (line) {
                    var size = line.mArray.length;
                    max = Math.max(max, size);
                });
                var scalefn = d3.scaleLinear().domain([clusterLimit, max]).nice().range(20, 40);
                return scalefn;
            }




            var scalefn=getclusterSizeScale()


            result.forEach(function (line) {
                var size = line.mArray.length;
                if (size > clusterLimit) { // make one node containing all clusterd nodes and link it

                    var clusterIds = [];
                    var clusterNames = [];
                    line.mArray.forEach(function (neoNode) {
                        clusterIds.push(neoNode.id);
                        clusterNames.push(neoNode[Schema.getNameProperty(targetLabel)])
                    })
                    var clusterId="cluster" + targetLabel + "_" + line.n._id;
                    var relId = "" + Math.random();
                    var relType = "expand";
                    var nodeNeo = {
                        _id: clusterId,
                        properties: {name: "" + size, clusterIds, clusterNames:clusterNames},
                        labels: [targetLabel],

                    }
                    var visjsNode = connectors.getVisjsNodeFromNeoNode(nodeNeo);
                    visjsNode.size=scalefn(size);
                    newNodes.push(visjsNode);

                    var visjsEdge = connectors.getVisjsRelFromNeoRel( line.n._id, clusterId, relId, relType, {});
                    newEdges.push(visjsEdge);


                } else {// make visjs node and rel for each neonode

                    line.mArray.forEach(function (neoNode) {

                        if (!visjsGraph.nodes._data[neoNode._id]) {
                            if (newNodeIds.indexOf(neoNode._id) < 0) {
                                newNodeIds.push(neoNode._id);
                                var visjsNode = connectors.getVisjsNodeFromNeoNode(neoNode);
                                newNodes.push(visjsNode);
                            }
                        }


                        var from = line.n._id;
                        var to = visjsNode.id;
                        var relId = "" + Math.random();
                        var relType = "expand"

                        var visjsEdge = connectors.getVisjsRelFromNeoRel(from, to, relId, relType, {});
                        newEdges.push(visjsEdge);

                    })


                }


            })


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
            visjsGraph.draw("graphDiv", newVisjsData, {}, function (err, result) {

                var labels=visjsGraph.legendLabels;
                labels.push(targetLabel)
                visjsGraph.drawLegend(labels)

            })


        })


    }

    self.initExpandWhere = function () {
        $("#expandWhereDiv").show()
        var label = $("#expand_labelsSelectTarget").val();
        var props = Object.keys(Schema.schema.properties[label]);
        common.fillSelectOptionsWithStringArray(expandWhere_propertySelect, props, true)

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