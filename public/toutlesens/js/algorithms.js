var algorithms=(function(){
    var self={}

    self.similars="Match (p1:paragraph)-[r]-(c:concept)-[r2]-(p2:paragraph) where p1.text<>p2.text with p1,p2,count(r) as cnt\n" +
        "where cnt > 5 and cnt < 10\n" +
        "return * limit 100"

self.createRels="Match (p1:paragraph)-[r]-(c:concept)-[r2]-(p2:paragraph) where p1.text<>p2.text with p1,p2,count(r) as cnt where cnt >2\n" +
    "CREATE (p1)-[r:similar{nconcepts:cnt}]->(p2)"

  /*

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



   */
    return self;



})();
