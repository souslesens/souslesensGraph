var connectors = (function () {
        var self = {};


        self.neoResultsToVisjs = function (resultArray, options) {

            if (!options)
                options = {};
            visjsData = {nodes: [], edges: [], labels: []};
            var nodesMap = {};
            var dataLabels = [];
            var colors = [];
            var clusters = [];
            if (!resultArray)
                return;
            var uniqueRels = [];
            for (var i = 0; i < resultArray.length; i++) {
                var rels = resultArray[i].rels;
                if (!rels)
                    rels = [];
                var nodes = resultArray[i].nodes;


                if (!nodes)
                    nodes = [];
                var relProperties = resultArray[i].relProperties;
                if (!relProperties)
                    relProperties = [];
                var startLabels = resultArray[i].startLabels;


                var ids = resultArray[i].ids;
                var legendRelIndex = 1;


                //********************************************set visjs nodes***********************
                for (var j = 0; j < nodes.length; j++) {

                    if (options.clusterIntermediateNodes) {
                        if (j > 0 && j < (nodes.length - 1))
                            continue;

                    }
                    var hideLabel = true ;//|| resultArray.length < Gparams.showLabelsMaxNumOfNodes || !options || !options.clusterIntermediateNodes || options.showNodesLabel;
                    var neoId = nodes[j]._id;
                    var rel = rels[0];
                    if (!nodesMap[neoId]) {
                        var nodeObj = self.getVisjsNodeFromNeoNode(nodes[j], hideLabel, rel);
                        visjsData.nodes.push(nodeObj);

                        nodesMap[neoId] = nodeObj;
                        if (visjsData.labels.indexOf(nodeObj.labelNeo) < 0)
                            visjsData.labels.push(nodeObj.labelNeo);
                    }


                }


                if (options.clusterIntermediateNodes) {
                    //link first node to last
                    for (var j = 1; j < ids.length; j++) {
                        ids[j] = ids[ids.length - 1];

                    }
                }

                //********************************************set visjs rels***********************
                var relType;
                for (var j = 0; j < rels.length; j++) {
                    if (options.clusterIntermediateNodes)
                        relType = "composite";
                    else
                        relType = rels[j];

                    var startLabel = startLabels[j][0];
                    var from, to, queryId;

                    if (options.clusterIntermediateNodes) {
                        if (j > 0 && j < (rels.length - 1))
                            continue;
                        if (ids[j] == ids[j + 1])
                            continue;
                    }

                    if (startLabel != labels[j]) {
                        from = ids[j];
                        to = ids[j + 1];
                        queryId = ids[j + 1];
                    } else {
                        from = ids[j + 1];
                        to = ids[j];
                        queryId = ids[j + 1];
                    }


                    var relUniqueId = from + "-" + to + "-" + relType;
                    var relUniqueIdInv = to + "-" + from + "-" + relType;
                    if (uniqueRels.indexOf(relUniqueId) > -1 || uniqueRels.indexOf(relUniqueIdInv) > -1)
                        continue;
                    else {
                        uniqueRels.push(relUniqueId);

                        var relId = relProperties[j]._id;
                        var relProps = relProperties[j].properties;
                        var outline = resultArray[i].outlineRel;
                        var showType = (options && options.showRelationsType == true) && Gparams.showRelationNames == true;
                        var relObj = self.getVisjsRelFromNeoRel(from, to, relId, relType, relProps, showType, outline);
                        visjsData.edges.push(relObj);

                    }


                }


            }
            for (var i = 0; i < dataLabels.length; i++) {
                colors.push(context.nodeColors[dataLabels[i]])
            }
            /*  if (options.clusterIntermediateNodes) {
                  visjsGraph.clusters = clusters;
              }*/
            return visjsData;//testData;
        }


        self.getVisjsNodeFromNeoNode = function (nodeNeo, hideLabel, rel) {
            var neoId = nodeNeo._id;
            var nodeNeoProps = nodeNeo.properties;

            var labels = nodeNeo.labels;

            var labelVisjs = nodeNeoProps[Gparams.defaultNodeNameProperty];
            if (labelVisjs && labelVisjs.length > Gparams.nodeMaxTextLength)
                labelVisjs = labelVisjs.substring(0, Gparams.nodeMaxTextLength) + "...";

            var color = context.nodeColors[nodeNeo.labels[0]];
            var nodeObj = {

                labelNeo: labels[0],// because visjs where label is the node name
                color: color,
                myId: nodeNeoProps.id,
                id: neoId,
                children: [],
                neoAttrs: nodeNeoProps,
              // value: 2,
                size: Gparams.defaultNodeSize,
                font:{size: Gparams.defaultTextSize},


            }
            if (rel)
                nodeObj.endRel = rel;


            if (!hideLabel) {
                nodeObj.label = labelVisjs;
               // nodeObj.title = labelVisjs;
            }

                nodeObj.hiddenLabel = labelVisjs;



            nodeObj.initialColor = nodeObj.color;

            if (nodeNeoProps.image && nodeNeoProps.image.length > 0) {
                nodeObj.shape = 'circularImage';
                nodeObj.image = nodeNeoProps.image.replace(/File:/, "File&#58;");
                nodeObj.brokenImage = "images/questionmark.png";
                //   nodeObj.image=encodeURIComponent(nodeNeoProps.icon)
                nodeObj.borderWidth = 4
                nodeObj.size = 30;
                delete nodeObj.color;
                delete nodeObj.initialColor;

            }
            else if (nodeNeoProps.icon && nodeNeoProps.icon.length > 0) {
                nodeObj.shape = 'circularImage';
                nodeObj.image = nodeNeoProps.icon;
                nodeObj.brokenImage = 'http://www.bnf.fr/bnf_dev/icono/bnf.png'
                //   nodeObj.image=encodeURIComponent(nodeNeoProps.icon)
                nodeObj.borderWidth = 4
                nodeObj.size = 30;
                delete nodeObj.color;
                delete nodeObj.initialColor;


            }


            /*     if (nodeNeo.isSource) {
                     nodeObj.isSource = true;
                 }
                 if (nodeNeo.isTarget) {
                     nodeObj.isTarget = true;
                 }

                 if (nodeNeo.isPathSource) {
                     nodeObj.shape = "star";
                     nodeObj.color = "red";
                     nodeObj.x = -500;
                     nodeObj.y = -500;
                 }
                 if (nodeNeo.isPathTarget) {
                     nodeObj.shape = "star";
                     nodeObj.color = "red";
                     nodeObj.x = 500;
                     nodeObj.y = 500;
                 }*/

            /*    if (nodeNeo.outline) {
                    nodeObj.font = {
                        value: 8,
                        //  size: 18,
                        color: Gparams.outlineTextColor,
                        strokeWidth: 3,
                        strokeColor: '#ffffff'
                    }

                }*/

            return nodeObj

        }


        self.getVisjsRelFromNeoRel = function (from, to, id, type, props, showType, outline) {


            var color = "#99d";//linkColors[rel];
            if(context.edgeColors[type])
                color=context.edgeColors[type];
            var relObj = {
                from: from,
                to: to,
                type: type,
                neoId: id,
                neoAttrs: props,
                color: color,
                width: 1
                // font:{background:color},
            }

            /*  if (toutlesensData.queriesIds.indexOf(queryId) > -1) {
                  relObj.width = Gparams.outlineEdgeWidth;
                  relObj.color = Gparams.outlineColor;
              }*/

            if (outline) {
                relObj.width = 3;
                relObj.font = {size: 18, color: 'red', strokeWidth: 3, strokeColor: '#ffffff'}
            }


            if (showType) {
                relObj.label = relObj.type;
                relObj.arrows = {from: {scaleFactor: 0.5}}
            }
            return relObj;
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


        self.toutlesensSchemaToVisjs = function (schema, id) {


            function makeNode(label) {

                var visNode = {
                    label: label,
                    type: "schema",
                    neoAttrs: schema.labels[label],
                    labelNeo: "label",// because visjs where label is the node name
                    // color: "lightBlue",
                    color: context.nodeColors[label],
                    myId: id,
                    shape: "box",
                    id: id++,
                    children: [],
                    neoAttrs: {},
                    font: {stroke: "black", "font-size": "14px"},
                    endRel: 0
                }
                nodesMap[label] = visNode;
                visjsData.nodes.push(visNode);

            }

            visjsData = {nodes: [], edges: [], labels: []};
            var nodesMap = {}
            var id = 0;
            for (var key in schema.relations) {
                var relation = schema.relations[key];
                if (!nodesMap[relation.startLabel])
                    makeNode(relation.startLabel)
                if (!nodesMap[relation.endLabel])
                    makeNode(relation.endLabel)

                var relObj = {
                    from: nodesMap[relation.startLabel].id,
                    to: nodesMap[relation.endLabel].id,
                    type: "relation",
                    neoId: id++,
                    neoAttrs: {},
                    color: "green",
                    label: relation.type,
                    font: {stroke: "black", "font-size": "14px"},
                    arrows: {to: {scaleFactor: 0.5}}
                    // font:{background:color},
                }
                visjsData.edges.push(relObj);
            }
//nodes without relations
            for (var key in schema.labels) {
                if (!nodesMap[key]) {
                    makeNode(key);
                }
            }

            if (dataModel.DBstats) {
                for (var i = 0; i < visjsData.nodes.length; i++) {
                    var countNodes = dataModel.DBstats.nodes[visjsData.nodes[i].label];
                    visjsData.nodes[i].count = countNodes;
                    visjsData.nodes[i].name = visjsData.nodes[i].label;
                    visjsData.nodes[i].label += " (" + countNodes + ")";

                }
                for (var i = 0; i < visjsData.edges.length; i++) {
                    var countRels = dataModel.DBstats.relations[visjsData.edges[i].label].countRel;
                    //  visjsData.edges[i].value=countRels;
                    visjsData.edges[i].count = countRels;
                    visjsData.edges[i].name = visjsData.edges[i].label;
                    visjsData.edges[i].label += " (" + countRels + ")";

                }


            }
            return visjsData;

        }


        return self;

    }
)()