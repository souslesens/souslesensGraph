var advancedSearch = (function () {

    var self = {};
    self.filterLabelWhere = "";
    self.similarOptions = {};
    self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;
    self.context = {}
    self.currentQueryNodeIds = [];

    self.addClause = function (clause, clauseText) {
        clause.title = clauseText.substring(clauseText, clauseText.indexOf(":"))
        self.context.currentSearchClauses.push(clause);
        context.addToGraphContext({searchClauses: clause});
        $("#searchDialog_Criteriatext").append(" <div   class='searchDialog_CriteriaDiv' onclick=advancedSearch.clearClause(" + (self.context.currentSearchClauses.length - 1) + ")>" + clauseText + "</div>")
    }

    self.clearClauses = function () {
        self.currentQueryNodeIds = [];
        self.context.currentSearchClauses = [];
        $(".searchDialog_CriteriaDiv").remove();
    }

    self.clearClause = function (_index) {
        if (searchMenu.currentPanelId > 1)
            return;
        $(".searchDialog_CriteriaDiv").each(function (index, div) {
            if (_index == index) {
                $(this).remove();
                self.context.currentSearchClauses.splice(index, 1);
            }
        })
    }



    //   a supprimer**********************************************************
  /*  self.matchStrToObject = function (str) {

        var array = (/.*n:(.*)\) *WHERE *(.*) RETURN.* /).exec(str);
        return {
            nodeLabel: array[1], where: array[2]
        };


    }*/








    /**
     *
     *
     * @param resultType "string" or "object"
     * @param callback
     */

    self.searchNodes = function (resultType, _options, callback) {
        if (!_options)
            _options = {}

        _options.resultType = resultType;


        $("#waitImg").css("visibility", "visible")

        if (_options.targetNodesLabels) {
            var str = "[";
            for (var i = 0; i < _options.targetNodesLabels.length; i++) {
                if (str.length > 1)
                    str += ",";
                str += '"' + _options.targetNodesLabels[i] + '"';
            }
            str += "]";
            if (context.cypherMatchOptions.sourceNodeWhereFilter.length > 0)
                context.cypherMatchOptions.sourceNodeWhereFilter += " and ";
            context.cypherMatchOptions.sourceNodeWhereFilter += str;

            self.filterLabelWhere = " labels(m)[0] in " + str + " ";

        }

        if (!self.similarOptions)
            self.similarOptions = {}
        self.similarOptions.id = null;

        var searchObj = {};
        //    self.filterLabelWhere = "";
        var options = {};

        searchObj.label = context.queryObject.Label;
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
                resultType: resultType,
                limit: Gparams.jsTreeMaxChildNodes,
                from: 0,
                resultType: resultType,

            }
            if (_options.matchType)
                options.matchType = _options.matchType;
            if (_options.where)
                options.where = _options.where;
            if (!_options.where && self.currentQueryNodeIds.length > 0)
                options.where = toutlesensData.setWhereFilterWithArray("_id", self.currentQueryNodeIds);

            toutlesensData.searchNodesWithOption(options, function (err, result) {
                if (callback) {
                    return callback(err, result);
                }
                treeController.loadSearchResultIntree(err, result);
                setTimeout(function () {
                    toutlesensController.openFindAccordionPanel(true);
                    treeController.expandAll("treeContainer");
                    dialog.dialog("close");
                }, 500)


            })
            return;


        } else {
            if (searchObj.operator == "contains")
                searchObj.operator = "~";
            var value = searchObj.property + ":" + searchObj.operator + " " + searchObj.value;
            var options = {
                subGraph: subGraph,
                label: searchObj.label,
                word: value,
                resultType: resultType,
                limit: Gparams.jsTreeMaxChildNodes,
                from: 0
            }
            toutlesensData.searchNodesWithOption(options, function (err, result) {
                if (callback) {
                    return callback(err, result);
                }
                treeController.loadSearchResultIntree(err, result);
                setTimeout(function () {
                    toutlesensController.openFindAccordionPanel(true);
                    treeController.expandAll("treeContainer");
                }, 500)
                dialog.dialog("close");


            })
        }


    }


    /**
     if @str simple word return regex of the word  for the property defaultNodeNameProperty
     else
     @str form property:operator value


     */
    self.getWhereProperty = function (str, nodeAlias) {
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

        if (operator == "~" || operator == "contains") {
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
            propStr = nodeAlias + "." + property + operator + value.trim();
        }
        return propStr;

    }



    /**
     * execute node query to get ids ans then build a graph query and display it
     *
     *

     * @param query
     */
    self.graphNodesAndDirectRelations = function (err, queryStr, callback) {

        if (err)
            return console.log(err);
        var payload = {
            match: queryStr
        }
        console.log(queryStr);
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            error: function (err) {
                console.log(err.responseText);

            },
            success: function (data, textStatus, jqXHR) {
                savedQueries.addToCurrentSearchRun(queryStr, callback || null);
                var ids = [];
                for (var i = 0; i < data.length; i++) {
                    ids.push(data[i].n._id)
                }


                toutlesensData.setWhereFilterWithArray("_id", ids, function (err, result) {
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
    self.searchInElasticSearch=function(word, label, callback){

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

})()