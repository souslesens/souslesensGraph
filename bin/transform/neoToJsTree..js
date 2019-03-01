var neoProxy=require("../neoProxy.js");

var neoToJstree={



    generateTreeFromChildToParentRelType: function(label, relType,rootNeoId, callback){

        var match="match(n:"+label+")-[r:"+relType+"]-(m) where id(n)="+rootNeoId+" return   n as parent ,m as child";
        neoProxy.match(match,function(err, result){

            if(err)
                return callback(err);


          var nodes=[]
            result.forEach(function(line,index){
                var parentProps=line.parent.properties;
                parentProps._id=line.parent._id
                if(index==0)
                    nodes.push({text: parentProps.name,id:parentProps._id, parent:"#", data:parentProps})

                var childProps=line.child.properties;
                childProps._id=line.child._id
                nodes.push({text: childProps.name,id:childProps._id,parent:parentProps._id, data:childProps,children:[]})


            })
            var x=nodes;

           return  callback(null,nodes)




        })





    }




}

module.exports=neoToJstree;

/*neoToJstree.generateTreeFromChildToParentRelType("physicalClass","childOf",24789, function(err, result){

})*/
