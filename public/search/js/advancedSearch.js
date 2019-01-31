var searchNodes = (function () {

    self = {};
    self.userMappings = {};
    self.currentField = {}
    self.criteria = [];
    self.queryObject={}

    self.showAdvancedQueryDialog = function () {
        self.queryObject={};
        $("#searchInput").val("");
        $("#dialog").css("visibility", "visible");
        $("#dialog").load("htmlSnippets/searchNodes.html", function () {
            $('#searchNodesDialog_fieldInput').attr('disabled', 'disabled');
            var data = [];

            for (var key in  self.userMappings) {
                var node = {
                    id: key,
                    text: key,
                    parent: "#",
                    type:"index"
                }
                data.push(node);
                for (var key2 in  self.userMappings[key].fields) {
                    var child = {
                        id: key + "_" + key2,
                        text: key2,
                        parent: key,
                        type:"field",
                        data: self.userMappings[key].fields[key2]
                    }
                    data.push(child);
                }
            }
            $('#jsTreeDiv').jstree({

                'core': {
                    'data': data
                },
                "types" : {
                    'index':{icon :'icons/index.png'},

                'field':{icon :'icons/field2.png'}
                },
                plugins:["sort"]

            }).on('select_node.jstree', function (node, selected, event) {

                self.searchNodesOnFieldSelect(selected.node);
            })


            /*.on('loaded.jstree', function() {
                $('#jsTreeDiv').jstree('open_all');
            })*/


        })
    }

    self.searchNodesOnFieldSelect = function (node) {

        if (node.parent != self.currentField.parent)
            self.clearAllCriteria()
        self.currentField = node;

        $("#searchNodesDialog_valueInput").val("")
        $("#searchNodesDialog_valueInput").focus()
        $("#searchNodesDialog_fieldInput").val(node.text)
        var operators = [];
        if (node.data && node.data.type) {
            var type = node.data.type;
            if (type == "keyword") {
                operators.push("=")
            }
            else if (type == "text") {
                operators.push("contains");
                operators.push("=");
                operators.push("#");
            }
            else if (type == "integer") {
                operators.push("=");
                operators.push(">");
                operators.push(">=");
                operators.push("<");
                operators.push("<=");


            }
            else if (type == "date") {
                operators.push(">");
                operators.push("<");
                operators.push(">=");
                operators.push("<=");
                operators.push("=");

                /*   $(function () {
                       $("#searchNodesDialog_valueInput").datepicker();
                   });*/
            }
            document.getElementById("searchNodesDialog_operatorSelect").options.length = 0;
            for (var i = 0; i < operators.length; i++) {
                $("#searchNodesDialog_operatorSelect").append("<option>" + operators[i] + "</option>");
            }

        }

    }
    self.addCriterion = function () {
        $("#searchNodesDialog_searchDiv").css("visibility", "visible")
        var criterion = {
            index: self.currentField.parent,
            field: self.currentField.text,
            type: self.currentField.data.type,
            operator: $("#searchNodesDialog_operatorSelect").val(),
            value: $("#searchNodesDialog_valueInput").val()
        }
        var criterionStr="";
        var str=$("#searchNodesDialog_criteriaDiv").html();
        if(str!="")
            criterionStr+=" AND "
        else
            criterionStr="Source "+ criterion.index + "<br>"
         criterionStr += $("#searchNodesDialog_fieldInput").val() + " " + criterion.operator + " " + criterion.value + "<br>"
        $("#searchNodesDialog_criteriaDiv").append(criterionStr);
        //   if (criterion.type == "date") {
        criterion.value=criterion.value.toLowerCase();
        self.criteria.push(criterion);


    }

    self.clearAllCriteria = function () {
        $("#searchNodesDialog_searchDiv").css("visibility", "hidden")
        $("#searchNodesDialog_criteriaDiv").html("");
        self.criteria = []
    }
    self.executeSearchQuery = function () {
        var rangeOperators = {
            "<": "lt",
            ">": "gt",
            "<=": "lte",
            ">=": "gte",

        }

        var queryElts = [];
        var rangeObj = null;
        var mustNotObj = {};
        var associatedWords = [];
        for (var i = 0; i < self.criteria.length; i++) {
            var criterion = self.criteria[i];
            var field = criterion.field;
            var value = criterion.value;
            var operator = criterion.operator;
            var value = criterion.value;
            var index = criterion.index;

            var queryElt = {};

            associatedWords.push(value);
            if (operator == ">" || operator == "<") {
                if (!rangeObj)
                    rangeObj = {range: {}};
                if (!rangeObj.range[field])
                    rangeObj.range[field] = {format: "dd/MM/yyyy||yyyy||MM/yyyy"};
                rangeObj.range[field][rangeOperators[operator]] = value;
            }
            else if (operator == "contains") {
                queryElt = {
                    "wildcard": {"content": "*" + value + "*"}
                }
                queryElts.push(queryElt);
            }
            else if (operator == "#") {
                mustNotObj = {
                    "match": {}
                };
                mustNotObj.match[field] = value;
            }


            else if (operator == "=") {
                var matchObj = {"match": {}}
                matchObj.match[field] = value;
                queryElts.push(matchObj);
            }

        }

        if (rangeObj) {

            queryElts = queryElts.concat(rangeObj);
        }

        var query =
            {
                "bool": {
                    "must": queryElts
                }
            }


        var classifierSourceStr = null;
        self.queryObject.query=query;
        self.queryObject.indexName=index;
        var payload = {
            findDocuments: 1,
            options: {
                from: 0,
                size: fetchSize,
                indexName: index,
                queryObject: query,

                getAssociatedWords: {
                    indexName: index,
                    word: associatedWords,
                    size: 100,
                    iterations: 5,
                    classifierSource: classifierSourceStr

                }
            }
        };

        $("#waitImg2").css("visibility", "visible");
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                $("#waitImg2").css("visibility", "hidden");
                $("#dialog").css("visibility", "hidden");
                 $("#searchNodesDialog_searchDiv").css("visibility", "hidden");
                $("#queryTextDiv").html($("#searchNodesDialog_criteriaDiv").html());
                searchUI.processSearchResults(data);

            }
            , error: function (xhr, err, msg) {
                $("#waitImg2").css("visibility", "hidden");
                //   $("#dialog").css("visibility", "hidden");
                //   $("#searchNodesDialog_searchDiv").css("visibility", "hidden");

                return (err);
            }

        });


    }


    return self;


})
();