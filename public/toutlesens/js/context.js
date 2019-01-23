var context = (function () {

    var self = {};
    self.graphContext = {};
    self.querySourceLabel = "";
    self.queryObject = {};
    self.cypherMatchOptions = {}
    self.currentNode = {}
    self.currentSearchClauses = [];


    self.initQueryObject = function () {
        self.queryObject = {
            label: "",
            property: "",
            operator: "",
            value: "",
        };
    }

    self.initCypherMatchOptions = function () {
        self.cypherMatchOptions = {
            sourceNodewhereFilter: "",
            targetNodeWhereFilter: "",

            querynodeLabelFilters: "",// a revoir supprimer?
            queryRelTypeFilters: "",// a revoir supprimer?
            queryRelWhereFilter: "",// a revoir supprimer?


        }

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
    self.initCypherMatchOptions();
    self.initGraphContext()
    return self;


})();