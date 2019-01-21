var Cypher=(function(){
    var self={};
    self.neo4jProxyUrl = "../../../neo";
    self.executeCypher = function (cypher, callback) {

        var payload = {match: cypher};
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
             //   savedQueries.addToCurrentSearchRun(cypher,callback || null);
                callback(null, data)
            }, error: function (err) {
                callback(err)

            }
        })
    }

    return  self;



})()