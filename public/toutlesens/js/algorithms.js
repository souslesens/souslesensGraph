var algorithms=(function(){
    var self={}

    self.similars="Match (p1:paragraph)-[r]-(c:concept)-[r2]-(p2:paragraph) where p1.text<>p2.text with p1,p2,count(r) as cnt\n" +
        "where cnt > 5 and cnt < 10\n" +
        "return * limit 100"

self.createRels="Match (p1:paragraph)-[r]-(c:concept)-[r2]-(p2:paragraph) where p1.text<>p2.text with p1,p2,count(r) as cnt where cnt >2\n" +
    "CREATE (p1)-[r:similar{nconcepts:cnt}]->(p2)"


    return self;



})();
