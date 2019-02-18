var nodeSets = (function () {
    var self = {};

    self.create = function (name, label, comment, cypher, ids, callback) {
        var data = {nodeIds: ids, cypher: cypher}
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
    self.get = function (name,callback) {
        var cypher = "MATCH(n:nodeSet{name:'" + name + "',subGraph:'" + subGraph + "'})return n";
        Cypher.executeCypher(cypher, function (err, result) {
            if (err || result.length == 0) {
                return callback(null);
            }
            else {
                var set = result[0].n.properties;
                set.data = JSON.parse(atob(set.data))
                return callback(null,set);

            }
        })
    }
    self.getAllNames = function (callback) {
        var cypher = "MATCH(n:nodeSet{subGraph:'" + subGraph + "'})return n.name as name order by name";
        Cypher.executeCypher(cypher, function (err, result) {
            if (err || result.length == 0) {
                return callback(null);
            }
            else {
                var names = [];
                result.forEach(function (line) {
                    names.push(line.name);
                })

                return callback(null, names);

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

    self.initNodeSetSelect = function () {

        nodeSets.getAllNames(function (err, nodeSetNames) {
            if(nodeSetNames)
              common.fillSelectOptionsWithStringArray(searchDialog_nodeSetsSelect,nodeSetNames,true)
        });
    }

    self.searchWithNodeSet=function(name){
        self.get(name,function(err, set){
            if(err)
                return;

            context.queryObject={};
            context.queryObject.label = set.label;
            context.queryObject.text = "Set "+set.name;
            context.queryObject.cypher = set.data.cypher;
            context.queryObject.type = "nodeSet-"+set.label;
            context.queryObject.nodeSetIds=set.data.nodeIds;
            buildPaths.show('only')



        }
    );


    }


    return self;


})
()