var connectors = (function () {
    var self = {};


    self.neoResultsToVisjs = function (resultArray) {


        visjsData = {nodes: [], edges: [], labels: []};
        var nodesMap = {};
        var dataLabels = [];
        var colors = [];
        if (!resultArray)
            return;
        var uniqueRels = [];
        for (var i = 0; i < resultArray.length; i++) {
            var rels = resultArray[i].rels;
            var nodes = resultArray[i].nodes;
            var relProperties = resultArray[i].relProperties;


            if (!nodes)
                continue;

            var ids = resultArray[i].ids;
            var legendRelIndex = 1;

            for (var j = 0; j < nodes.length; j++) {
                var neoId = nodes[j]._id;
                if (!nodesMap[neoId]) {
                    var nodeNeo = nodes[j].properties;

                    var labels = nodes[j].labels;
                    var labelVisjs=nodeNeo[Gparams.defaultNodeNameProperty];
                    if(labelVisjs.length>Gparams.nodeMaxTextLength)
                        labelVisjs=labelVisjs.substring(0,Gparams.nodeMaxTextLength)+"...";
                    var color =nodeColors[nodes[j].labels[0]]
                    var nodeObj = {
                        label:labelVisjs ,
                        labelNeo: labels[0],// because visjs where label is the node name
                        color: color,
                        myId: nodeNeo.id,
                        id: neoId,
                        children: [],
                        neoAttrs: nodeNeo,
                        //  font:{background:color},


                        endRel: rels[0]


                    }
                    if (nodes[j].outline) {

                            nodeObj.font = {
                                size: 18,
                                color: Gparams.outlineTextColor,
                                strokeWidth: 3,
                                strokeColor: '#ffffff'
                            }
                            nodeObj.size = 25;

                    }


                    nodeObj.initialColor = nodeObj.color;
                    if (nodeObj.labelNeo == currentLabel) {
                        nodeObj.size = 15;

                    }

                    if (nodeNeo.image && nodeNeo.image.length > 0) {
                        nodeObj.shape = 'circularImage';
                        nodeObj.image = nodeNeo.image.replace(/File:/, "File&#58;");
                        nodeObj.brokenImage = "images/questionmark.png";
                        //   nodeObj.image=encodeURIComponent(nodeNeo.icon)
                        nodeObj.borderWidth = 4
                        nodeObj.size = 30;
                        delete nodeObj.color;
                        delete nodeObj.initialColor;

                    }
                    else if (nodeNeo.icon && nodeNeo.icon.length > 0) {
                        nodeObj.shape = 'circularImage';
                        nodeObj.image = nodeNeo.icon;
                        nodeObj.brokenImage = 'http://www.bnf.fr/bnf_dev/icono/bnf.png'
                        //   nodeObj.image=encodeURIComponent(nodeNeo.icon)
                        nodeObj.borderWidth = 4
                        nodeObj.size = 30;
                        delete nodeObj.color;
                        delete nodeObj.initialColor;

                    }


                    visjsData.nodes.push(nodeObj);

                    nodesMap[neoId] = nodeObj;
                    if (visjsData.labels.indexOf(nodeObj.labelNeo) < 0)
                        visjsData.labels.push(nodeObj.labelNeo);
                }


            }


            for (var j = 0; j < rels.length; j++) {
                var rel = rels[j];
                var color = linkColors[nodesMap[ids[j + 1]].endRel];
                var relObj = {
                    from: ids[j],
                    to: ids[j + 1],
                    type: rel,
                    neoId: relProperties[j]._id,
                    neoAttrs: relProperties[j].properties,
                    color: color,
                    width:2
                    // font:{background:color},
                }

                if(toutlesensData.queriesIds.indexOf(relObj.to)>-1) {
                    relObj.width = Gparams.outlineEdgeWidth;
                    relObj.color=Gparams.outlineColor;
                }

                if (resultArray[i].outlineRel) {
                    relObj.width= 3;
                    relObj.font = {size: 18, color: 'red', strokeWidth: 3, strokeColor: '#ffffff'}
                }

                var relUniqueId = relObj.from + "-" + relObj.to + "-" + relObj.type;
                var relUniqueIdInv = relObj.to + "-" + relObj.from + "-" + relObj.type;
                if (uniqueRels.indexOf(relUniqueId) > -1 || uniqueRels.indexOf(relUniqueIdInv) > -1)
                    continue;
                else
                    uniqueRels.push(relUniqueId);

                if (Gparams.showRelationNames === true)
                    relObj.label = relObj.type;


                visjsData.edges.push(relObj);
            }
        }
        for (var i = 0; i < dataLabels.length; i++) {
            colors.push(nodeColors[dataLabels[i]])
        }
        return visjsData;//testData;
    }


    self.elasticSkosToVisjs = function (resultArray) {


        visjsData = {nodes: [], edges: [], labels: []};
        var nodesMap = {};
        /*  var dataLabels = [];
          var colors = [];*/
        if (!resultArray)
            return;
        var id = 10000;
        for (var i = 0; i < resultArray.length; i++) {
            var elasticObj = resultArray[i].content;

            for (var key in elasticObj) {
                var visObj = {
                    label: elasticObj[key].label,
                    labelNeo: key,// because visjs where label is the node name
                    color: "blue",
                    myId: id,
                    id: id++,
                    children: [],
                    neoAttrs: {},
                    endRel: 0


                }
                nodesMap[elasticObj[key].label] = visObj;
                visjsData.nodes.push(visObj);
            }

        }

//relations
        for (var i = 0; i < resultArray.length; i++) {
            var elasticObj = resultArray[i].content;
            var conceptObj = elasticObj.concept;
            var idConcept = nodesMap[conceptObj.label].id;
            for (var key in elasticObj) {
                if (key != "concept") {
                    var idTarget = nodesMap[elasticObj[key].label].id;

                    var relObj = {
                        from: idConcept,
                        to: idTarget,
                        type: key,
                        neoId: idTarget,
                        neoAttrs: {},
                        color: "green",
                        // font:{background:color},
                    }
                    visjsData.edges.push(relObj);

                } else {

                }

            }
        }
        return visjsData;//testData;
    }


    return self;

})()