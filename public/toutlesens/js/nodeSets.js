var nodeSets = (function () {
    var self = {};

    self.create = function (name, label, comment,cypher, ids, callback) {
        var data={nodeIds:ids,cypher:cypher}
       data = btoa(JSON.stringify(data));

        var cypher = "MERGE (n:nodeSet{name:'" + name + "',label:'" + label + "',comment:'" + comment + "',subGraph:'" + subGraph + "',data:'" + data + "'}) return  n.name as name"
        //  console.log(cypher);
        Cypher.executeCypher(cypher, function (err, result) {
            if (err) {
                if (callback)
                    return callback(err)
                return console.log(err)
            }
            return callback(null, result[0].name)
        })

    }
    self.get = function (name) {
        var cypher = "MATCH(n:nodeSet{name:'" + name + "',subGraph:'" + subGraph + "'})return n";
        Cypher.executeCypher(cypher, function (err, result) {
            if (err || result.length == 0) {
                return null;
            }
            else {
                var set = result[0].n;
                set.data = JSON.parse(atob(set.data))
                return set;

            }
        })
    }
    self.getAllNames = function (name) {
        var cypher = "MATCH(n:nodeSet{subGraph:'" + subGraph + "'})return n.name as name order by name";
        Cypher.executeCypher(cypher, function (err, result) {
            if (err || result.length == 0) {
                return null;
            }
            else {
                var names = [];
                result.forEach(function (line) {
                    names.push(line.name);
                })

                return names;

            }
        })
    }
    self.delete = function (name, callback) {
        var cypher = "MATCH(n:nodeSet{name:'" + name + "',subGraph:'" + subGraph + "'}) delete n";
        Cypher.executeCypher(cypher, function (err, result) {
            if (err) {
                if (callback)
                    return callback(err)
                return console.log(err)
            }
            return callback(null, "done")
        })

    }


    return self;


})()