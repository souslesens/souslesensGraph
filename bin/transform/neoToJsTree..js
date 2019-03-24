var neoProxy = require("../neoProxy.js");

var neoToJstree = {


    generateTreeFromChildToParentRelType: function (label, relType, rootNeoId, callback) {

        var match = "match(n:" + label + ")-[r:" + relType + "]-(m) where id(n)=" + rootNeoId + " return   n as parent ,m as child";
        neoProxy.match(match, function (err, result) {

            if (err)
                return callback(err);


            var nodes = []
            result.forEach(function (line, index) {
                var parentProps = line.parent.properties;
                parentProps._id = line.parent._id
                if (index == 0)
                    nodes.push({text: parentProps.name, id: parentProps._id, parent: "#", data: parentProps})

                var childProps = line.child.properties;
                childProps._id = line.child._id
                nodes.push({
                    text: childProps.name,
                    id: childProps._id,
                    parent: parentProps._id,
                    data: childProps,
                    children: []
                })


            })
            var x = nodes;

            return callback(null, nodes)


        })
    },
    generateAllDescendantsTreeFromChildToParentRelType: function (label, relType, rootNeoId, depth, callback) {

if(!depth || depth==0)
    depth=5;
        var depthStr = "*1.." + depth;
        var match = "match(n:" + label + ")-[r:" + relType + depthStr + "]-(m) where id(n)=" + rootNeoId + " return   n as parent ,r,m as child";
        neoProxy.match(match, function (err, result) {

            if (err)
                return callback(err);


            var nodes = [];

            var nodesMap = {}
            //nodes
            result.forEach(function (line, index) {
                var parentProps = line.parent.properties;
                parentProps._id = line.parent._id
                if (!nodesMap[line.parent._id]) {
                    nodesMap[line.parent._id] = {
                        text: parentProps.name,
                        id: parentProps._id,
                        parent: "",
                        data: parentProps
                    }
                }

                    var childProps = line.child.properties;
                    childProps._id = line.child._id
                    if (!nodesMap[line.child._id])
                        nodesMap[line.child._id] = {
                            text: childProps.name,
                            id: childProps._id,
                            parent: "",
                            data: childProps
                        }



            })
            //rels
            result.forEach(function (line, index) {
                line.r.forEach(function (rel) {
                    if( !nodesMap[rel._fromId])
                        return;
                    nodesMap[rel._fromId].parent = rel._toId;
                })
            })

            for(var key in nodesMap){
                nodes.push(nodesMap[key])
            }




            return callback(null, nodes)


        })


    }


}

module.exports = neoToJstree;

/*neoToJstree.generateAllDescendantsTreeFromChildToParentRelType("physicalClass", "childOf", 25443, 3, function (err, result) {

})*/
/*neoToJstree.generateTreeFromChildToParentRelType("physicalClass","childOf",24789, function(err, result){

})*/
