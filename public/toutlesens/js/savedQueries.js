var savedQueries=(function(){

    var self={};

    self.loadQueries = function () {

        function loadToJsTree(savedQueries) {
            var treeData = [];
            var allPaths = [];
            var types = ["graph", "table", "treemap", "graphNeighbours"]
            var i = 0;
            for (var key in savedQueries) {
                i++;
                var levels = key.split(/[:?]/);
                var path = "";

                for (var j = 0; j < levels.length; j++) {
                    var parent = "#"
                    var type = "";
                    if (j > 0)
                        var parent = (levels[j - 1].trim());

                    levels[j] = levels[j].trim();


                    if (j == 0)
                        type = "label";
                    else if (levels[j].indexOf("n.") == 0)
                        type = "whereN";
                    else if (nodeColors[levels[j].split("/")[0]])
                        type = "targetLabels";
                    else if (types.indexOf(levels[j]) > -1) {
                        type = levels[j];
                    }

                    path += ":" + parent;
                    if (j == levels.length - 1) {
                        path += ":" + levels[j]
                    }

                    if (allPaths.indexOf(path) < 0) {
                        allPaths.push(path);
                        var text = levels[j];


                        treeData.push({text: text, id: levels[j], type: type, data: key, parent: parent})
                    }
                }
            }
            $("#savedQueries_jsTree").html("");
            $("#savedQueries_jsTree").jstree({
                'core': {
                    'data': treeData
                },
                "types": {
                    "graph": {
                        "icon": "images/graphSmall.png"
                    },
                    "graphNeighbours": {
                        "icon": "images/graphSmall.png"
                    },
                    "table": {
                        "icon": "images/tableSmall.png"
                    },
                    "treemap": {
                        "icon": "images/treemapSmall.png"
                    },
                    "label": {
                        "icon": "images/labelIconSmall.png"
                    },
                    "whereN": {
                        "icon": "images/labelIconSmall.png"
                    },
                    "targetLabels": {
                        "icon": "images/labelIcon2Small.png"
                    },
                }
                , plugins: ["types"]
            });
            $("#savedQueries_jsTree").on('loaded.jstree', function () {
                $("#savedQueries_jsTree").jstree('open_all');
            })
                .bind("dblclick.jstree", function (e) {
                    var data = $("#savedQueries_jsTree").jstree().get_selected(true);
                    if (data[0]) {
                        searchMenu.selectedQuery = data[0].data;
                        searchMenu.savedQueryExecute();
                    }

                })
            $("#savedQueries_jsTree").bind("click.jstree", function (e) {
                var data = $("#savedQueries_jsTree").jstree().get_selected(true);
                if (data[0]) {

                    searchMenu.selectedQuery = data[0].data;
                }

            })
        }

        savedQueries = localStorage.getItem("savedQueries_" + subGraph);
        if (!savedQueries)
            savedQueries = {};
        else
            savedQueries = JSON.parse(savedQueries);
        loadToJsTree(savedQueries);
        /*    var names = []
           for (var key in savedQueries) {
               names.push(key);

           }
           names.sort();

         common.fillSelectOptionsWithStringArray(searchDialog_savedQueries, names);*/
    }
    self.savedQuerySave = function () {
        //  advancedSearch.addClauseUI();
        var val = "";
        var neighboursLabels = [];
        if (advancedSearch.searchClauses.length > 0)
            val = advancedSearch.searchClauses[0].title;
        if (advancedSearch.searchClauses.length > 1)
            val = advancedSearch.searchClauses[0].title.substring(0, 10) + "..."
        val += ":";

        var name = prompt("enter query name", val.trim());


        if (name && name != "") {

          var  query = {clauses: advancedSearch.searchClauses};


          savedQueries[name] = query;

            localStorage.setItem("savedQueries_" + subGraph, JSON.stringify(savedQueries));
            //  $("#searchDialog_savedQueries").prepend("<option>" + name + "</option>")

            self.loadQueries();
        }


    }
    self.savedQueryDelete = function () {

        var name = $("#searchDialog_savedQueries").val();
        if (name && name != "") {
            delete savedQueries[name];
            localStorage.setItem("savedQueries_" + subGraph, JSON.stringify(savedQueries));
            self.loadQueries();
            /*$("#searchDialog_savedQueries option").each(function () {
                if ($(this).val() == name) {
                    $(this).remove();
                    return;
                }
            });*/
        }
    }

    self.savedQueryDeleteAll = function () {
        localStorage.removeItem("savedQueries_" + subGraph);
        self.loadQueries();
    }

    self.savedQueryExecute = function () {
//$("#searchAccordion").accordion("option","active",1)
        // var name = $("#searchDialog_savedQueries").val();
        var name = searchMenu.selectedQuery;
        var query = savedQueries[name];
        var clauses = query.clauses;


        advancedSearch.clearClauses();
        for (var i = 0; i < clauses.length; i++) {
            advancedSearch.addClause(clauses[i]);
            $("#searchDialog_NodeLabelInput").val(clauses[i].nodeLabel);
        }
        if (!query.outputType) {// first screen only
            self.activatePanel("searchActionDiv");
            $("#searchDialog_previousPanelButton").css("visibility", "visible");
            $("#searchAccordion").accordion("option", "active", 1);
        }
        else {//query panel+output type panel
            $("#advancedSearchAction").val(query.outputType);
        }
        if (!query.neighboursLabels) {
            self.onSearchAction(query.outputType)
        }
        else {

            self.onSearchAction(query.outputType);
            $('.advancedSearchDialog_LabelsCbx').each(function () {
                if (query.neighboursLabels.indexOf(this.value) > -1)
                    $(this).prop("checked", true);

            });
            self.onSearchAction("execute");
        }
        $("#searchDialog_NextPanelButton").css('visibility', 'visible');

    }






    return self;



})()