var advancedSearch = (function () {

        var self = {};

        self.similarOptions = {};
        self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;


        /**
         *
         *
         * @param callback
         */


        // transform request in nodes ids stored in context.queryObject.where
        self.setNodeQueryUI = function (booleanOperator) {
            if (booleanOperator && booleanOperator == "")
                return;
            var value = $("#searchDialog_valueInput").val();
            if (!booleanOperator && value == "")
                return;

            $("#searchDialog_nextPanelButton").css('visibility', 'visible');
            $("#clearAllCreteriaButton").css("visibility", "visible");
            $("#searchDialog_SaveQueryButton").css("visibility", "visible")
            $("#searchDialog_Criteriatext").css("visibility", "visible");
            $("#searchDialog_newQueryButton").css('visibility', 'visible');


            var property = "";
            var operator = "";
            if (value != "") {
                property = $("#searchDialog_propertySelect").val();
                operator = $("#searchDialog_operatorSelect").val()
            }

            var text = booleanOperator + "  " + (context.queryObject.label ? context.queryObject.label : "") + " " + property + " " + operator + " " + value;

            if (booleanOperator != "and" && booleanOperator != "or") {
                context.queryObject = {
                    label: context.queryObject.label,
                    property: property,
                    operator: operator,
                    value: value,
                    text: text
                }

            } else {
                if (!context.queryObject.subQueries)
                    context.queryObject.subQueries = [];
                context.queryObject.subQueries.push({
                    label: context.queryObject.label,
                    property: property,
                    operator: operator,
                    value: value,
                    text: text,
                    booleanOperator: booleanOperator
                });

            }
            /*  if (booleanOperator && booleanOperator == "+") {
                  return;
              }*/


            advancedSearch.setQueryObjectCypher(context.queryObject, function (err, queryObject) {

                if (err)
                    return;

                $("#searchDialog_valueInput").val("");
                Cypher.executeCypher(queryObject.cypher, function (err, result) {

                    if (booleanOperator && booleanOperator == "and") {
                        var newIds = [];
                        result.forEach(function (line) {
                            newIds.push(line.n._id);
                        })

                        function intersectArray(a, b) {
                            return a.filter(Set.prototype.has, new Set(b));
                        }

                        context.queryObject.nodeIds = intersectArray(context.queryObject.nodeIds, newIds)
                    } else {
                        if (!context.queryObject.nodeIds)
                            context.queryObject.nodeIds = [];
                        result.forEach(function (line) {
                            context.queryObject.nodeIds.push(line.n._id);
                        });
                    }
                    var foundIds = result.length;


                    text += ": <b> " + foundIds + "nodes </b>"
                    $("#searchDialog_Criteriatext").append(" <div   class='searchDialog_CriteriaDiv' >" + text + "</div>")



                });


            })
        }

        self.setQueryObjectCypher = function (queryObject, callback) {
            if (!queryObject)
                queryObject = {}

            if (!self.similarOptions)
                self.similarOptions = {}
            self.similarOptions.id = null;


            //if  no value consider that there is no property set
            if (queryObject.value == "")
                queryObject.property = "";

            queryObject.subGraph = subGraph;
            queryObject.limit = Gparams.jsTreeMaxChildNodes;
            queryObject.from = 0;


            var subGraphWhere = "";
            var returnStr = " RETURN n";
            var cursorStr = "";

            cursorStr += " ORDER BY n." + Gparams.defaultNodeNameProperty;
            if (queryObject.from)
                cursorStr += " SKIP " + queryObject.from;
            if (queryObject.limit)
                cursorStr += " LIMIT " + queryObject.limit;
            var labelStr = "";
            if (queryObject.label && queryObject.label.length > 0)
                labelStr = ":" + queryObject.label;

            var whereStr = "";
            whereStr = self.buildWhereClauseFromUI(queryObject, "n");


            if (context.queryObject.subQueries) {
                context.queryObject.subQueries.forEach(function (suqQuery) {
                    whereStr += " " + suqQuery.booleanOperator + " " + self.buildWhereClauseFromUI(suqQuery, "n");
                })


            }
            var cypher = "MATCH (n" + labelStr + ")  WHERE " + whereStr + " RETURN n" + cursorStr;
            queryObject.cypher = cypher;
            return callback(null, queryObject);

        }


        self.buildWhereClauseFromUI = function (queryObject, nodeAlias) {
            var property = queryObject.property;
            var operator = queryObject.operator;
            var value = queryObject.value;

            var not = (operator == "notContains") ? "NOT " : "";
            if (operator == "!=") {
                operator = "<>"
            }

            else if (operator == "~" || operator == "contains" || operator == "notContains") {
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
                propStr = not + nodeAlias + "." + property + operator + value.trim();
            }
            return propStr;

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
)
()