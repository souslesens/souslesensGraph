var context = (function () {

    var self = {};
    self.graphContext = {};
    self.queryObject = {};
    self.currentNode = {};




   // self.currentSearchClauses = [];


    self.initQueryObject = function () {
        self.queryObject = {
            label: "",
            property: "",
            operator: "",
            value: "",
            nodeSetIds:"" // in case of sets
        };
    }



    self.initGraphContext = function () {
        self.graphContext = {
            searchClauses: [],
            graphType: [],
            expandGraph: [],
            highlight: []

        }
    }
    self.addToGraphContext = function (obj) {
        var keys = Object.keys(obj);
        keys.forEach(function (key) {
            if (!self.graphContext[key])
                return alert("key " + key + " not exist in context")
            else
                self.graphContext[key].push(obj[key])
        })

    }
    self.getGraphContext = function () {
        return graphContext;
    }

    self.initQueryObject();
    self.initGraphContext()
    return self;


})();