var context=(function(){

    var self={};
    var graphContext;
    self.querySourceLabel="";


    self.initGraphContext=function(){
        graphContext={
            searchClauses :[],
            graphType:[],
            expandGraph:[],
            highlight: []

        }
    }
    self.addToGraphContext=function(obj){
        var keys=Object.keys(obj);
        keys.forEach(function(key) {
            if (!graphContext[key])
                return alert("key "+key+" not exist in context")
            else
                graphContext[key].push(obj[key])
        })

    }
    self.getGraphContext=function(){
        return graphContext;
    }





    return self;



})();