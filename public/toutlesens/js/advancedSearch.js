var advancedSearch = (function () {

    var self = {};

    self.similarOptions = {};
    self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;








    /**
     *
     *
     * @param resultType "string" or "object"
     * @param callback
     */

    self.buildSearchNodeQueryFromUI = function ( options, callback) {
        if (!options)
            options = {}

        if (!self.similarOptions)
            self.similarOptions = {}
        self.similarOptions.id = null;

        var searchObj = {};
        searchObj.label = context.queryObject.label;
        searchObj.property = $("#searchDialog_propertySelect").val();
        searchObj.operator = $("#searchDialog_operatorSelect").val();
        searchObj.value = $("#searchDialog_valueInput").val();

        //if  no value consider that there is no property set
        if (searchObj.value == "")
            searchObj.property = "";

        if (searchObj.value == "") {// only  search on label or type
            var options = {
                subGraph: subGraph,
                label: searchObj.label,
                word: null,
                limit: Gparams.jsTreeMaxChildNodes,
                from: 0,

            }
            /*   if (!options.where && self.context.queryObject.nodeIds.length > 0)
                   options.where = toutlesensData.getWhereClauseFromArray("_id", self.context.queryObject.nodeIds);*/
        } else {
            if (searchObj.operator == "contains")
                searchObj.operator = "~";
            var value = searchObj.property + ":" + searchObj.operator + " " + searchObj.value;
            var options = {
                subGraph: subGraph,
                label: searchObj.label,
                word: value,
                limit: Gparams.jsTreeMaxChildNodes,
                from: 0
            }

        }
        var queryObj=toutlesensData.buildSearchNodeQuery(options);
        return callback(null,queryObj);

    }


        /**
         if @str simple word return regex of the word  for the property defaultNodeNameProperty
         else
         @str form property:operator value


         */
        self.buildWhereClauseFromUI = function (str, nodeAlias) {
            if (!str)
                return "";
            var property = Gparams.defaultNodeNameProperty;
            var p = str.indexOf(":");
            var operator;
            var value;

            if (p > -1) {
                property = str.substring(0, p);
                str = str.substring(p + 1);
                var q = str.indexOf(" ");
                operator = str.substring(0, q);
                value = str.substring(q + 1);
            }
            else {
                property = Gparams.defaultNodeNameProperty
                operator = "~";
                value = str;
                // console.log("!!!!invalid query");
                // return "";
            }
            var not=(operator == "notContains")?"NOT ":"";
            if (operator == "!=" ) {
                operator="<>"
            }

            else if (operator == "~" || operator == "contains"  || operator == "notContains") {

                operator = "=~"
                // value = "'.*" + value.trim() + ".*'";
                value = "'(?i).*" + value.trim() + ".*'";

            }
            else {
                //if ((/[\s\S]+/).test(value))
                if (!(/^-?\d+\.?\d*$/).test(value))//not number
                    value = "\"" + value + "\"";


            }
            var propStr = "";
            if (property == "any")
                propStr = "(any(prop in keys(n) where n[prop]" + operator + value + "))";

            else {



                propStr = not+ nodeAlias + "." + property + operator + value.trim();
            }
            return propStr;

        }




        /**
         * execute node query to get ids ans then build a graph query and display it
         *
         *

         * @param query
         */
        self.graphNodesAndDirectRelations = function (err, queryObject, callback) {

            if (err)
                return console.log(err);

            var payload = {
                match: queryObject.cypher
            }
            console.log(queryObject.cypher);
            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: payload,
                dataType: "json",
                error: function (err) {
                    console.log(err.responseText);

                },
                success: function (data, textStatus, jqXHR) {
                    savedQueries.addToCurrentSearchRun(queryObject.cypher, callback || null);
                    var ids = [];
                    for (var i = 0; i < data.length; i++) {
                        ids.push(data[i].n._id)
                    }


                    toutlesensData.getWhereClauseFromArray("_id", ids, function (err, result) {
                        if (self.filterLabelWhere.length > 0) {
                            if (context.cypherMatchOptions.sourceNodeWhereFilter != "")
                                context.cypherMatchOptions.sourceNodeWhereFilter += " and " + self.filterLabelWhere;
                            else
                                context.cypherMatchOptions.sourceNodeWhereFilter = self.filterLabelWhere;
                        }
                        if (callback) {
                            return callback();
                        }
                        toutlesensController.generateGraph(null, {
                            applyFilters: true,
                            dragConnectedNodes: true
                        }, function () {

                            $("#filtersDiv").html("");
                            $("#graphMessage").html("");


                        });

                    })
                }
            })


        }
        self.searchInElasticSearch = function (word, label, callback) {

            word += "*";
            var payload = {
                elasticQuery2NeoNodes: 1,
                queryString: word,
                index: subGraph.toLowerCase(),
                resultSize: Gparams.ElasticResultMaxSize
            }

            $.ajax({
                type: "POST",
                url: "../../../neo2Elastic",
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    if (data.length >= Gparams.ElasticResultMaxSize) {
                        $("#searchResultMessage").html("cannot show all data : max :" + Gparams.ElasticResultMaxSize);
                    }
                    else {
                        $("#searchResultMessage").html(data.length + " nodes found");
                    }
                    return treeController.loadTreeFromNeoResult("treeContainer", data, function (jsTree) {
                        var xx = jsTree;
                        setTimeout(function () {


                            $('.jstree-leaf').each(function () {
                                var id = $(this).attr('id');
                                var text = $(this).children('a').text();
                                for (var i = 0; i < data.length; i++) {
                                    var properties = data[i].n.properties;
                                    //   console.log(id+"-"+text);
                                    if (properties[Gparams.defaultNodeNameProperty] == text) {
                                        for (var key in properties) {
                                            if (properties[Gparams.defaultNodeNameProperty].toLowerCase().indexOf(word0) > -1)
                                                continue;
                                            if (properties[key] && typeof properties[key] != "object" && properties[key].indexOf && properties[key].toLowerCase().indexOf(word0) > -1) {
                                                var xx = key;
                                                var yy = properties[key]
                                                //  console.log(xx+"-"+yy);
                                                //$("#"+treeController.jsTreeDivId).jstree().create_node(id ,  { "id" : (id+"_"+key), "text" : ("<span class='jstreeWordProp'">+xx+":"+yy+"</span>")}, "last", function(){
                                                $("#" + treeController.jsTreeDivId).jstree().create_node(id, {
                                                    "id": (id + "_" + key),
                                                    "text": (xx + ":" + yy),
                                                    "type": "prop"
                                                }, "last", function () {


                                                });
                                            }
                                        }
                                    }
                                }

                            });
                            $("#" + treeController.jsTreeDivId).jstree("open_all");
                        }, 1000)
                    });
                }, error: function (err) {
                    return callback(err)
                }
            });
        }


        return self;

    }
)()