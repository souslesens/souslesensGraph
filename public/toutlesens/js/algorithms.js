var algorithms = (function () {
    var self = {};
    self.currentAlgorithm;
    self.algorithms = {
        "relationsRanking": {},

        "similarities jaccard": {

            cypher: "Match (n:<%sourceLabel%>)-[r]-(c:<%targetLabel%>) <%where%> \n" +
            "WITH {item:id(n), categories: collect(id(c))} as userData, count(c)  as cnt where cnt><%minCountTargetNode%>\n" +
            "WITH collect(userData) as data\n" +
            "CALL algo.similarity.jaccard.stream(data, {topK: 3, similarityCutoff: <%similarityCutoff%>})\n" +
            "YIELD item1, item2, count1, count2, intersection, similarity\n" +
            " return   algo.getNodeById(item1) AS sourceNode, algo.getNodeById(item2) AS  targetNode, similarity" +

            /*      "with  algo.getNodeById(item1) AS from, algo.getNodeById(item2) AS  to, similarity\n" +
                  " match path=((from)-[]-(c2:<%targetLabel%>)-[]-(to)) " +
                      toutlesensData.standardReturnStatement.replace("return","return  distinct")+
                //  "  return from , to ,c2,similarity\n" +*/
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
                var similarityScale = d3.scale.linear().domain([similarityCutoff, 1]).range([1, 6]);
                result.forEach(function (line, index0) {

                    if (uniqueNodes.indexOf(line.sourceNode._id) < 0) {
                        uniqueNodes.push(line.sourceNode._id);
                        var label = line.sourceNode.labels[0];
                        if (labels.indexOf(label) < 0)
                            labels.push(label);
                        var nodeObj = {
                            labelNeo: label,// because visjs where label is the node name
                            background: nodeColors[label],
                            id: line.sourceNode._id,
                            label: line.sourceNode.properties[nodeNameVal],
                            neoAttrs: line.sourceNode.properties,
                        }
                        nodes.push(nodeObj);
                    }

                    if (uniqueNodes.indexOf(line.targetNode._id) < 0) {
                        uniqueNodes.push(line.targetNode._id);
                        var label = line.targetNode.labels[0];
                        if (labels.indexOf(label) < 0)
                            labels.push(label);
                        var nodeObj = {
                            labelNeo: label,// because visjs where label is the node name
                            background: nodeColors[label],
                            id: line.targetNode._id,
                            label: line.targetNode.properties[nodeNameVal],
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


                /*  var visjsData = {nodes: nodes, edges: rels, labels: labels};
                  visjsGraph.draw("graphDiv", visjsData, {}, function (err, result) {
                      var x = result;
                  })*/
            }
        }



        , other: {

            cypher: "Match (p1:paragraph)-[r]-(c:concept)-[r2]-(p2:paragraph) where p1.text<>p2.text with p1,p2,count(r) as cnt where cnt >2 " +
            "CREATE (p1)-[r:similar{nconcepts:cnt}]->(p2)",

            cypher2: "Match (p1:paragraph)-[r]-(c:concept)-[r2]-(p2:paragraph) where p1.text<>p2.text with p1,p2,count(r) as count where count >0 CALL apoc.create.vRelationship(p1,'virtualRel',{count:count},p2) yield rel return * limit 100"

            ,
            cypher3: "CALL algo.louvain(\n" +
            "  'MATCH (p:paragraph) RETURN id(p) as id',\n" +
            "  'MATCH (p1:paragraph)-[]->(c:concept)<-[]-(p2:paragraph)   RETURN id(p1) as source, id(p2) as target, c.weight as weight',\n" +
            "  {graph:'cypher',write:true});"

            ,
            cypher4: "match(n:tag)<-[r]-(m) with n,m,count(r) as cnt where cnt>0 and n.subGraph=\"keosphere19\" return n,m limit 100"  // pas plus de 1  tag par document !!!
        }
    }


    self.initDialog = function (label) {
        $(".algorithmParam").css("display", "none");
        if (label)
            common.fillSelectOptionsWithStringArray(searchDialog_AlgorithmsTargetLabelSelect, Schema.getPermittedLabels(label,true,true), true, true)
        else
            toutlesensController.initLabels(searchDialog_AlgorithmsTargetLabelSelect, true);

        common.fillSelectOptionsWithStringArray(searchDialog_algorithmSelect, Object.keys(self.algorithms),true)


    }
    self.initAlgorithm = function (algoName) {
        $(".algorithmParam").css("display", "none");
        if (algoName == "similarities jaccard") {
            $("#searchDialog_AlgorithmsMinCountTargetNodes").css("display", "display")
            $("#searchDialog_AlgorithmsResultSize").css("display", "display")
            $("#searchDialog_AlgorithmsSimilarityCutoff").css("display", "display")


        }
        else if (algoName == "relationsRanking") {
            $(".searchDialog_AlgorithmsResultSize").css("display", "display")
        }

    }

    self.execute = function (queryStr) {
        var algorithm = $("#searchDialog_algorithmSelect").val();
        self.currentAlgorithm = algorithm;


        if (algorithm == "relationsRanking") {
            var query = advancedSearch.matchStrToObject(queryStr)
            var sourceLabel = query.nodeLabel;
            var targetLabel = $("#searchDialog_AlgorithmsTargetLabelSelect").val();
           var limit= $("#searchDialog_AlgorithmsResultSize").val();
            var cypher = "Match (n:" + sourceLabel + ")-[r]-(m:" + targetLabel + ") return n, count (r) as cnt order by cnt desc limit "+limit;
            toutlesensData.executeCypher(cypher, function (err, result) {
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


var query = advancedSearch.matchStrToObject(queryStr)
var sourceLabel = query.nodeLabel;
var targetLabel = $("#searchDialog_AlgorithmsTargetLabelSelect").val();
var minCountTargetNode = $("#searchDialog_AlgorithmsMinCountTargetNodes").val();
var resultSize = $("#searchDialog_AlgorithmsResultSize").val();
var similarityCutoff = $("#searchDialog_AlgorithmsSimilarityCutoff").val();
var where = query.where;
if (where && where.length > 0)
    where = " where " + where


var algoStr = self.algorithms[algorithm].cypher;
var array;
while ((array = /<%([^%>]*)%>/g.exec(algoStr)) != null) {
    var str = array[1];
    var value = eval(str);
    algoStr = algoStr.replace(array[0], value);
}
console.log(algoStr)
toutlesensData.executeCypher(algoStr, function (err, result) {
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
