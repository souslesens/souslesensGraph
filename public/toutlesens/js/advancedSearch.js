var advancedSearch = (function () {

    var self = {};

    self.showDialog = function () {
        var filterMovableDiv = $("#filterMovableDiv").detach();
        $("#dialog").append(filterMovableDiv);
       // toutlesensController.initLabels(advancedSearchDialog_LabelSelect);
        $("#filterActionDiv").html( " <button id=\"advancedSearchDialog_searchButton\" onclick=\"advancedSearch.searchNodes()\">Search</button>");

      /*  $("#dialog").load("htmlSnippets/advancedSearchMenu.html", function () {*/
            $("#dialog").dialog("option", "title", "Advanced search");
            $("#dialog").dialog("open");
            filters.init();
        /*    toutlesensController.initLabels(advancedSearchDialog_LabelSelect);
            filters.initLabelProperty("",advancedSearchDialog__propsSelect)
            $("#advancedSearchDialog__propsSelect").val(Schema.getNameProperty())

        })*/
    }
    self.searchNodes = function () {
        currentObject.id=null;
        $("#waitImg").css("visibility", "visible")
        var searchObj = {};



        var objectType = $("#propertiesSelectionDialog_ObjectTypeInput").val();
        if(objectType=="node")
        searchObj.label = $("#propertiesSelectionDialog_ObjectNameInput").val();
        if(objectType=="relation")
        searchObj.relType = $("#propertiesSelectionDialog_ObjectNameInput").val();
        searchObj.property =  $("#propertiesSelectionDialog_propsSelect").val();
        searchObj.operator = $("#propertiesSelectionDialog_operatorSelect").val();
       searchObj.value =  $("#propertiesSelectionDialog_valueInput").val();




        if (searchObj.property == "") {
            if( searchObj.value==""){// only  search on label or type
                toutlesensData.searchNodes(subGraph, searchObj.label, null, "matchStr", Gparams.jsTreeMaxChildNodes, 0,function(err,result){
                    infoGenericDisplay.loadSearchResultIntree(err,result);
                    setTimeout(function(){
                        toutlesensController.setRightPanelAppearance(true);
                        infoGenericDisplay.expandAll("treeContainer");
                        $("#dialog").dialog("close");
                    },500)


                })
                return;

            }
            var data = [];// stack all results and then draw tree
            var index = 0;
            var countOptions = $('#propertiesSelectionDialog_propsSelect').children('option').length - 1;
            $("#propertiesSelectionDialog_propsSelect option").each(function () {
                var property = $(this).val();

                if (property != ""){
                    var value=property+":~ "+searchObj.value;
                    toutlesensData.searchNodes(subGraph, searchObj.label, value, "list", Gparams.jsTreeMaxChildNodes, 0, function (err, result) {
                        index += 1;
                        for (var i = 0; i < result.length; i++) {
                            data.push(result[i])
                        }
                        if (index >= countOptions) {
                            infoGenericDisplay.loadTreeFromNeoResult("#", data);
                        }
                        setTimeout(function(){
                            toutlesensController.setRightPanelAppearance(true);
                            infoGenericDisplay.expandAll("treeContainer");
                        },500)

                    })
                }
            });

        }else {
            var value= searchObj.property +":~ "+searchObj.value;
            toutlesensData.searchNodes(subGraph, searchObj.label, value, "matchStr", Gparams.jsTreeMaxChildNodes, 0,function(err,result){
                infoGenericDisplay.loadSearchResultIntree(err,result);
                setTimeout(function(){
                    toutlesensController.setRightPanelAppearance(true);
                    infoGenericDisplay.expandAll("treeContainer");
                },500)


            })
        }
        $("#dialog").dialog("close");



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

        if (operator == "~") {
            operator = "=~"
            // value = "'.*" + value.trim() + ".*'";
            value = "'(?i).*" + value.trim() + ".*'";
        }
        else {
            if ((/[\s\S]+/).test(str))
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
    /*



        self.buildCypherQuery = function (searchObj) {

            var maxDistance = searchObj.maxDistance;
            var str = ""

            var matchStr = "(n"
            if (searchObj.graphPathSourceNode.label)

                matchStr += ":" + searchObj.graphPathSourceNode.label;
            matchStr += ")-[r" + "*.."
                + maxDistance
                + "]-(m";
            if (searchObj.graphPathTargetNode && searchObj.graphPathTargetNode.label)
                matchStr += ":" + searchObj.graphPathTargetNode.label;
            matchStr += ")";

            var whereStr = ""
            if (searchObj.graphPathSourceNode.property)
                self.getWhereProperty(searchObj.graphPathSourceNode.property, "n");

            if (searchObj.graphPathTargetNode && searchObj.graphPathTargetNode.property) {
                if (whereStr.length > 0)
                    whereStr += "  and ";
                self.getWhereProperty(searchObj.graphPathTargetNode.property, "m");
            }
            if (searchObj.graphPathSourceNode.nodeId) {
                if (whereStr.length > 0)
                    whereStr += "  and ";
                whereStr += "ID(n)=" + searchObj.graphPathSourceNode.nodeId;
            }

            if (searchObj.graphPathTargetNode && searchObj.graphPathTargetNode.nodeId) {
                if (whereStr.length > 0)
                    whereStr += "  and ";
                whereStr += "ID(m)=" + searchObj.graphPathTargetNode.nodeId;
            }
            if (toutlesensData.queryExcludeNodeFilters)
                whereStr += toutlesensData.queryExcludeNodeFilters;


            var query = "Match path=" + matchStr;
            if (whereStr.length > 0)
                query += " WHERE " + whereStr;




            query += " RETURN  " + returnStr;

            query += " LIMIT " + limit;
            console.log(query);

            self.executeCypherAndDisplayGraph(query, searchObj);
        }
    */

    return self;

})()