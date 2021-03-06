/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/

var dbName;
var neoApiUrl = "../importDataIntoNeo4j";
var currentRequests;
var importType = "LINK";
var currentCsvObject;
var subGraph;
var nodeColors = {};
var toutlesensData = null;
var currentObject = null;
var toutlesensController = null;
var messageDivId = null;

var drag = false;
var help = {

    sourceField: "field that will give its name attribute to the created node in Neo",
    exportedFields: "fields that will be exported as attributes of this nodes type in Neo (separated by ;)",
    distinctValues: "create nodes only for distinct values of the source Field",
    sourceQuery: "query to filter nodes in the input sources (only for sourceDB by now)",
    label: " Neo Label for the new nodes or a field name if begins with #",

    sourceSourceField: "Field used as source  join key ",
    sourceTargetField: "Field used as target  join key ",
    neoSourceLabel: "Neo label where  source  join key was imported in Neo4j",
    neoTargetLabel: "Neo label where  target  join key was imported in Neo4j",
    relationType: "name given to the relation",
    neoRelAttributeField: "fields that will be exported as attributes of this  relation type in Neo (separated by ;)",
    sourceQueryR: "query to filter nodes in the input sources (only for sourceDB by now)"


}


// messageDivId=document.getElementById("message");

$(function () {

    // loadSubgraphs("hist-antiq");
    $("#importSourceType").val("");

    $('form[name=new_post]').submit(function () {
        $.ajax({
            url: $(this).attr('action'),
            type: "post",
            data: $(this).serialize(),
            dataType: "Document",
            success: function (data, textStatus, jqXHR) {
                callback(data);
            },
            error: function (xhr, err, msg) {
                console.log(xhr);
                console.log(err);
                console.log(msg);
            }
        });
    });


});


function callsource(urlSuffix, payload, callback) {
    $("#message").val("");
    if (!urlSuffix)
        urlSuffix = "";
    $.ajax({
        type: "POST",
        url: "../../.." + Gparams.mongoProxyUrl + urlSuffix,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            callback(data);
        },
        error: function (xhr, err, msg) {
            $("#message").css("color", "red");
            $("#message").html(err);
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }
    });
}


function callExportToNeo(type, data, callback) {
    $("#message").val("Processing Import ...");
    $("#waitImg").css("visibility", "visible");
    var subGraph = $("#subGraphSelect").val();
    var db = $("#dbSelect").val();
    var importSourceType = $("#importSourceType").val();
    if (!subGraph || subGraph.length == 0)
        subGraph = prompt("pas de subGraph selectionné , en céer un ? (necesaaire à l'export)");
    else if (!confirm("Export data to subGraph " + subGraph))
        return;
    if (!subGraph || subGraph.length == 0)
        return;
    var payload = {
        type: type,
        sourceType: importSourceType,
        subGraph: subGraph,
        data: JSON.stringify(data),
        dbName: db
    };
    $.ajax({
        type: "POST",
        url: "../../.." + Gparams.importDataIntoNeo4j,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var xx = data;
            $("#message").html(data.result);
            $("#message").css("color", "green");
            $("#waitImg").css("visibility", "hidden");
            if (callback)
                callback(null, data);
        },
        error: function (xhr, err, msg) {

            $("#waitImg").css("visibility", "hidden");
            console.log(xhr);
            console.log(err);
            console.log(msg);
            if (err.result) {
                $("#message").html(err.result);
                $("#message").css("color", "red");

            }
            else {
                $("#message").html(err);

            }
            if (callback)
                callback(err, data);
        }
    });

}

function callNeoMatch(match, url, callback) {
    $("#message").val("Processing  ...");
    $("#waitImg").css("visibility", "visible");
    payload = {
        match: match
    };
    if (!url)
        url = "../../.." + Gparams.neo4jProxyUrl;

    $.ajax({
        type: "POST",
        url: url,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            callback(data);
            $("#waitImg").css("visibility", "hidden");
        },
        error: function (xhr, err, msg) {
            $("#waitImg").css("visibility", "hidden");
            console.log(xhr);
            console.log(err);
            console.log(msg);
            if (err.result) {
                $("#message").html(err.result);
                $("#message").css("color", "red");
            }
            else
                $("#message").html(err);
        }

    });

}

function initDBs() {

    callsource("", {listDatabases: 1,}, function (data) {
        data.databases.sort(function (a, b) {
            if (a.name > b.name)
                return 1;
            if (a.name < b.name)
                return -1;
            return 0;

        });
        for (var i = 0; i < data.databases.length; i++) {
            var str = data.databases[i].name;
            $("#dbSelect").append($('<option/>', {
                value: str,
                text: str
            }));
        }
    });
}

function onDBselect() {
    var dbName = $("#dbSelect").val();
    clearInputs('nodeInput');
    clearInputs('linkInput');
    var type = $("#importSourceType").val();
    if (type.indexOf("CSV") > -1) {
        loadRequests();

        return;
    }
    callsource("", {listCollections: 1, dbName: dbName}, function (data) {
        data.sort();
        for (var i = 0; i < data.length; i++) {
            var str = data[i];
            var str = data[i];
            $("#collSelect").append($('<option/>', {
                value: str,
                text: str
            }));
        }
        $("#dbSelect").val(dbName);
        loadRequests();
    });
}

function onCollSelect() {
    var type = $("#importSourceType").val();
    if (type.indexOf("CSV") > -1) {
        return;
    }
    var collectionName = $("#collSelect").val();
    $("#sourceNode").val(collectionName);
    $("#sourceRel").val(collectionName);
    clearImportFields();
    var dbName = $("#dbSelect").val();

    callsource("", {listFields: 1, dbName: dbName, collectionName: collectionName}, function (data) {

        data.sort();
        data.splice(0, 0, "")
        common.fillSelectOptionsWithStringArray(fieldSelect, data);

        /*  for (var i = 0; i < data.length; i++) {
         var str = data[i];

         $("#collSelect").append($('<option/>', {
         value: str,
         text: str
         }));
         }*/
    });


}

function onFieldSelect() {
    var fieldName = $("#fieldSelect").val();
    $("#currentField").val(fieldName);
    /*
     * var inputId=$("input:focus").attr("id"); if(inputId)
     * $("#"+inputId).val(fieldName);
     */

}

function addToExportedFields() {
    var fieldSelect = $("#fieldSelect").val();
    var exportedFields = $("#exportedFields").val();
    if (exportedFields == "none" || exportedFields == "all")
        exportedFields = "";

    if (exportedFields && exportedFields.length > 0)
        $("#exportedFields").val(exportedFields + ";" + fieldSelect);
    else
        $("#exportedFields").val(fieldSelect);

}

function setsourceField() {
    var fieldSelect = $("#fieldSelect").val();
    $("#sourceField").val(fieldSelect);
    $("#sourceKey").val(fieldSelect);


}

function setsourceKey() {
    var fieldSelect = $("#fieldSelect").val();
    $("#sourceKey").val(fieldSelect);

}

function getRelLabelForField(fieldName) {// arevoir
    return "";
    if (currentRequests) {
        for (var i = 0; i < currentRequests.length; i++) {

            if (currentRequests[i].request.sourceField == fieldName) {
                return currentRequests[i].request.label;
            }

        }

    }
    return "";
}

function setsourceSourceField() {

    $("#neoSourceKey").val($("#neoSourceField").val());

}

function setsourceTargetField() {
    $("#neoTargetKey").val($("#neoTargetField").val());
}

function setNeoRelAttributeField() {
    var fieldSelect = $("#fieldSelectRels").val();
    var exportedRelFields = $("#neoRelAttributeField").val();
    if (exportedRelFields == "none" || exportedRelFields == "all")
        exportedRelFields = "";

    if (exportedRelFields && exportedRelFields.length > 0)
        $("#neoRelAttributeField").val(exportedRelFields + ";" + fieldSelect);
    else
        $("#neoRelAttributeField").val(fieldSelect);
}

function setNeoSourceLabel() {
    var labelSelect = $("#labelsSelect").val();
    $("#neoSourceLabel").val(labelSelect);
}

function setNeoTargetLabel() {
    var labelSelect = $("#labelsSelect").val();
    $("#neoTargetLabel").val(labelSelect);
}


function validatesourceQuery(sourceQuery) {
    if (!sourceQuery || sourceQuery.length == 0) {
        sourceQuery = "{}";
        return sourceQuery;
    }
    else {
        try {

            sourceQuery = eval('(' + sourceQuery + ')');
            //  sourceQuery = JSON.stringify(sourceQuery);
            return JSON.stringify(sourceQuery);
        }
        catch (e) {
            $("#message").html("indalid json for field sourceQuery");
            return null;
        }
    }
}

function exportNeoNodes(execute, save) {
    importType = "NODE";
    var sourceDB = $("#dbSelect").val();
    var sourceNode = $("#sourceNode").val();
    var exportedFields = $("#exportedFields").val();
    if (exportedFields == "")
        exportedFields = "none";
    var sourceField = $("#sourceField").val();
    var sourceKey = $("#sourceKey").val();
    var label = $("#label").val();
    var sourceQuery = $("#sourceQuery").val();
    var subGraph = $("#subGraphSelect").val();
    var distinctValues = $("#distinctValues").prop('checked');
    // var sourceIdField = $("#sourceIdField").val();
    var sourceIdField = sourceField;// change : more simple !!


    sourceQuery = validatesourceQuery(sourceQuery);
    if (!sourceQuery)
        return;


    var query = "action=exportsource2NeoNodes";

    var data = {
        source: sourceNode,
        exportedFields: exportedFields,
        sourceField: sourceField,
        sourceKey: sourceKey,
        distinctValues: distinctValues,
        sourceIdField: sourceIdField,
        label: label,
        sourceQuery: sourceQuery,
        subGraph: subGraph
    };

    var message = "";
    for (var key in data) {
        if (!data[key] || data[key] == "") {
            if (key != "exportedFields" && key != "distinctValues")
                message += "<br>" + key + " cannot be empty";
        }

    }
    $("#exportMessageNodes").html(message);
    if (message.length > 0)
        return;

    $("#exportParams").val(JSON.stringify(data).replace(/,/, ",\n"));
    if (save)
        requests.saveRequest(data);
    // saveRequest(JSON.stringify(data).replace(/,/, ",\n"));
    if (execute) {
        $("#exportResultDiv").html("");
        callExportToNeo("node", data, function (err, result) {
            loadLabels();
            admin.drawVisjsGraph();
        });

    }


}

function clearImportFields() {
    $("#message").html("");

    $("#exportedFields").val("none");
    $("#sourceField").val("");
    $("#sourceKey").val("");
    $("#label").val("");
    $("#sourceQuery").val("");
    $("#distinctValues").prop("checked", "checked");


    $("#sourceSourceField").val("");
    $("#neoSourceLabel").val("");
    $("#neoSourceKey").val("");
    $("#sourceTargetField").val("");
    $("#neoTargetLabel").val("");
    $("#neoTargetKey").val("");
    $("#relationType").val("");
    $("#neoRelAttributeField").val("");
    $("#sourceQueryR").val("");

}

function exportNeoLinks(execute, save) {
    importType = "LINK";
    var sourceDB = $("#dbSelect").val();
    var sourceRel = $("#sourceRel").val();
    var sourceSourceField = $("#sourceSourceField").val();
    var neoSourceLabel = $("#neoSourceLabel").val();
    var neoSourceKey = $("#neoSourceKey").val();
    var sourceTargetField = $("#sourceTargetField").val();
    var neoTargetLabel = $("#neoTargetLabel").val();
    var neoTargetKey = $("#neoTargetKey").val();
    var relationType = $("#relationType").val();
    var neoRelAttributeField = $("#neoRelAttributeField").val();
    var sourceQueryR = $("#sourceQueryR").val();
    var subGraph = $("#subGraphSelect").val();

    sourceQueryR = validatesourceQuery(sourceQueryR);

    var data = {
        sourceDB: sourceDB,
        source: sourceRel,
        sourceSourceField: sourceSourceField,
        neoSourceKey: neoSourceKey,
        neoSourceLabel: neoSourceLabel,
        sourceTargetField: sourceTargetField,
        neoTargetLabel: neoTargetLabel,
        neoTargetKey: neoTargetKey,
        relationType: relationType,
        neoRelAttributeField: neoRelAttributeField,
        sourceQueryR: sourceQueryR,
        subGraph: subGraph
    };
    var message = "";
    for (var key in data) {
        if (key.indexOf("sourceQuery") == 0 & data[key] == "")
            data[key] = "{}";

        if (!data[key] || data[key] == "") {
            if (key != "neoRelAttributeField")
                message += "<br>" + key + " cannot be empty";
        }

    }
    $("#exportMessageLinks").html(message);
    if (message.length > 0)
        return;

    $("#exportParams").val(JSON.stringify(data).replace(/,/, ",\n"));

    if (save)
        requests.saveRequest(data);
    if (execute) {
        $("#exportResultDiv").html("");
        callExportToNeo("relation", data, function (err, result) {
            if (err)
                $("#importJournalTA").val(err)
            $("#importJournalTA").val(result)
            loadLabels();
            admin.drawVisjsGraph();
        });

    }


}


function afterImport(data) {
    $("#message").html(data.message);
    $("#exportResultDiv").append(data.message + "<br>");

    /*	$("#tabs-center").tabs({
     active : 1
     });*/
}


function loadLabels(subGraphName) {


    if (!subGraphName)
        subGraphName = $('#subGraphSelect').val();
    var whereSubGraph = "";
    if (subGraphName != "")
        whereSubGraph = " where n.subGraph='" + subGraphName + "'"
    var match = "Match (n) " + whereSubGraph
        + " return distinct labels(n)[0] as label";
    callNeoMatch(match, null, function (data) {

        if (data && data.length > 0) {
            var labels = []
            for (var i = 0; i < data.length; i++) {
                var value = data[i].label;
                labels.push(value);

            }
            labels.splice(0, 0, "");
            common.fillSelectOptionsWithStringArray(labelsSelect, labels)
            admin.labels = labels;
            admin.drawVisjsGraph()

        }
    });

};

function loadSubgraphs(defaultSubGraph) {
    var match = "Match (n)  return distinct n.subGraph as subGraph";
    callNeoMatch(match, null, function (data) {
        if (data && data.length > 0) {// } && results[0].data.length >
            var subgraphs = []
            for (var i = 0; i < data.length; i++) {
                var value = data[i].subGraph;
                subgraphs.push(value);
            }
            subgraphs.splice(0, 0, "");

            common.fillSelectOptionsWithStringArray(subGraphSelect, subgraphs);
            if (subGraphSelect)
                common.fillSelectOptionsWithStringArray(subGraphExportSelect, subgraphs)
        }
    });


};


function setRequestSubGraphFilterOptions() {
    loadLabels();
    var requestSubGraphs = [];
    for (var i = 0; i < currentRequests.length; i++) {
        if (currentRequests[i].request) {
            var obj = currentRequests[i].request;
            if (obj && requestSubGraphs.indexOf(obj.subGraph) < 0) {
                requestSubGraphs.push(obj.subGraph);
            }

        }

    }
    requestSubGraphs.splice(0, 0, "")
    //   common.fillSelectOptionsWithStringArray(requestsFilter, requestSubGraphs);
}

function filterRequests(select) {
    var subGraph = $(select).val();
    var filteredRequests = [];
    for (var i = 0; i < currentRequests.length; i++) {
        if (subGraph == "" | currentRequests[i].request.subGraph == subGraph) {
            filteredRequests.push(currentRequests[i]);
        }
    }
    common.fillSelectOptions(requests, filteredRequests, "name", "name");
}


function deleteNeoSubgraph(subGraph) {
    if (!subGraph)
        subGraph = $("#subGraphSelect").val();
    var ok = confirm("Voulez vous vraiment effacer le subGraph " + subGraph);
    if (!ok)
        return;

    var whereSubGraph = "";
    if (subGraph != Gparams.defaultSubGraph)
        whereSubGraph = " where n.subGraph='" + subGraph + "'"
    var match = 'MATCH (n)-[r]-(m) ' + whereSubGraph + ' delete  r';
    callNeoMatch(match, null, function (data) {
        var match = 'MATCH (n)' + whereSubGraph + ' delete n';
        callNeoMatch(match, null, function (data) {
            $("#message").html("subGraph=" + subGraph + "deleted");
            $("#message").css("color", "red");
            $(graphDiv).html("");
            $('#labelsSelect')
                .find('option')
                .remove()
                .end()

        });
        Schema.delete(subGraph);
    });
}


function refreshNeo() {
    $("#exportResultDiv").html("");
    var subGraph = $("#subGraphSelect").val();
    if (!subGraph || subGraph.length == 0) {
        subGraph = alert("pas de subgraph !!");

        // if (!subGraph || subGraph.length == 0)
        return;
    }

    var requestFilters = [];
    var requestCbxes = $("[name=exportNameCbx]");
    for (var i = 0; i < requestCbxes.length; i++) {
        if (requestCbxes[i].checked) {
            requestFilters.push(requestCbxes[i].value);
        }
    }


    var requestsToExcecute = [];
    for (var i = 0; i < requestFilters.length; i++) {
        for (var j = 0; j < currentRequests.length; j++) {
            if (currentRequests[j].name == requestFilters[i]) {
                requestsToExcecute.push(currentRequests[j].name);
            }
        }

    }
    callExportToNeo("batch", requestsToExcecute, function (error, result) {
        var str = "<B>IMPORT SUMMARY</B>:<br><ul>"
        for (var i = 0; i < result.result.length; i++) {
            str += "<li>" + result.result[i] + "</li>";

        }
        str += "</ul>"
        $("#exportResultDiv").html(str);
    });

    /* var xx = currentRequests;
     for (var i = 0; i < requestFilters.length; i++) {
     for (var j = 0; j < currentRequests.length; j++) {
     if (currentRequests[j].name == requestFilters[i]) {
     loadRequest(requestFilters[i], false)
     if (requestFilters[i].startsWith("Nodes_")) {
     exportNeoNodes(true, false);
     }
     if (requestFilters[i].startsWith("Rels_")) {
     exportNeoLinks(true, false);
     }

     }

     }

     }*/


}


function submitMatchNeo(query, callback) {
    var payload = {
        "statements": [{
            "statement": query
        }]
    };
    paramsObj = {
        mode: "POST",
        urlSuffix: "db/data/transaction/commit",
        payload: JSON.stringify(payload)
    }

    console.log("QUERY----" + JSON.stringify(payload));
    $.ajax({
        type: "POST",
        url: "../../.." + Gparams.neo4jProxyUrl,
        data: paramsObj,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {

            if (!data || data.length == 0) {
                // common.setMessage("No results", blue);
                return;
            }
            var errors = data.errors;

            if (errors && errors.length > 0) {
                return;
            }
            callback(data);

        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        },

    });
}

function initBatchNeoRefresh(type) {
    var requestNames = [];
    var i = 0;
    $("#requests option").each(function (d) {
        if (this.text.indexOf(type) == 0)
            requestNames.push(this.text);
    });

    var str = "";
    var checked = "";//"' checked='checked' ";
    var onclick = " onclick='startQueryfilterObjectType() '"
    onclick = "";
    var noChecked = "";
    str += "<table>"

    str += "<tr align='center' class='italicSpecial'><td ><span class='bigger'>Noeuds</span></td><td>Inclure<br><input type='checkbox' id='#comuteAllFiltersNodesInclude' onchange='comuteAllFilters(this)'></td>" +
        "</tr>";
    for (var i = 0; i < requestNames.length; i++) {
        str += "<tr align='center'>";
        str += "</td><td>" + requestNames[i];
        str += "<td><input type='checkbox' name='exportNameCbx' value='"
            + requestNames[i] + "'" + onclick + checked + "/> "

        str += "<td></tr>";
    }
    str += "<tr><td colspan='3' >&nbsp;</B></td></td></tr>";

    str += "</table>"
    $("#exportNamesDiv").html(str);
    $("#refreshNeoButton").css("visibility", "visible");
    $("#exportNamesDiv").css("visibility", "visible");

}

function comuteAllFilters(caller) {
    var str = $(caller).attr("id");
    var status = $(caller).prop("checked");

    function comuteAll(cbxs, mode) {
        var relCbxes = $("[name=" + cbxs + "]");
        for (var i = 0; i < relCbxes.length; i++) {
            $(relCbxes[i]).prop("checked", mode);
        }

    }

    if (str == "#comuteAllFiltersNodesInclude")
        comuteAll("exportNameCbx", status);

}

function onSubGraphSelect(select, showgraph) {

    var value = $("#subGraphSelect").val();
    $('#subGraph').val(value);
    if (value == "")
        return;
    var subGraph = $("#subGraphSelect").val();
    Schema.load(subGraph, function (err, result) {
        requests.init(value);

        var labels=[];
        for (var key in Schema.schema.labels){
            labels.push(key);
        }
        labels.splice(0, 0, "");
        common.fillSelectOptionsWithStringArray(labelsSelect, labels)
        admin.labels = labels;


        if (showgraph) {
            admin.drawVisjsGraph()
            //   drawNeoModel(subGraph);
            $("#tabs-center").tabs({
                active: 3
            });
        }
    })
}

function onLabelSelect(select) {
    var value = $(select).val();
    $('#label').val(value);
    currentLabel = val();

}

function deleteLabel() {
    var label = $('#labelsSelect').val();
    var subGraph = $("#subGraphSelect").val();
    if (!label || label.length == 0) {
        $("#message").html("select a label first", "red");
        $("#message").css("color", "red");
        return;
    }

    if (confirm("delete all nodes and relations  with selected label?")) {
        var whereSubGraph = "";
        var subGraphName = $("#subGraphSelect").val()
        if (subGraphName != "")
            whereSubGraph = " where n.subGraph='" + subGraphName + "'"
        var match = "Match (n) " + whereSubGraph
            + " return distinct labels(n)[0] as label";
        var match = "Match (n:" + label + ") " + whereSubGraph + " DETACH delete n";
        callNeoMatch(match, null, function (data) {
            $("#message").html("nodes with label=" + label + "deleted");
            $("#message").css("color", "green");
            admin.drawVisjsGraph();

        });
    }


}

function addSubGraph() {
    requests.init();
    var newSubGraph = prompt("New Subgraph name ");
    if (!newSubGraph || newSubGraph.length == 0)
        return;

    $("#subGraphSelect").append($('<option>', {
        text: newSubGraph,
        value: newSubGraph
    }));

    $("#subGraphSelect").val(newSubGraph);
    requests.init(newSubGraph);
    admin.drawVisjsGraph();
}

function clearInputs(name) {
    $("[name=" + name + "]").val("");

}

function submitCsvForm() {

    $.ajax({
        url: $('#uploadCcvForm').attr('action'),
        type: "post",
        data: $('#uploadCcvForm').serialize(),
        dataType: "Document",
        success: function (data, textStatus, jqXHR) {
            callback(data);
        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }
    });

}


function setImportSourceType() {


    var type = $("#importSourceType").val();
    $(".dataSourceDiv").css("display", "none");
    if (type == "uploadCSV") {
        $("#uploadCSVdiv").css("display", "inline");
        $("#importCSVdiv").css("visibility", "visible");
        $("#importsourceDiv").css("visibility", "hidden");
        $(".dbInfos").css("visibility", "visible");

    } else if (type == "localCSV") {

        $("#localCSVdiv").css("display", "inline");
        $("#importCSVdiv").css("visibility", "hidden");
        $("#importsourceDiv").css("visibility", "visible");
        $(".dbInfos").css("visibility", "visible");


    }  else if (type == "localXLSX") {

    $("#localXLSXdiv").css("display", "inline");
    $("#importCSVdiv").css("visibility", "hidden");
    $("#importsourceDiv").css("visibility", "visible");
    $(".dbInfos").css("visibility", "visible");


} else if (type == "sourceDB") {
        initDBs();
        $('#dbSelect').empty();
        $('#collSelect').empty();
        $('#fieldSelect').empty();
        $("#sourceSourceDiv").css("display", "inline");
        $("#importCSVdiv").css("visibility", "hidden");
        $("#importsourceDiv").css("visibility", "visible");
        $(".dbInfos").css("visibility", "visible");

    }

}

function showHelp(fieldName) {
    $("#message").html(help[fieldName]);
    //common.setMessage(help[fieldName],"blue");


}


function setCsvImportFields(json) {
    currentCsvObject = json;
    if (!json.header)
        return;
    json.header.splice(0, 0, "")
    common.fillSelectOptionsWithStringArray(fieldSelect, json.header);
    //common.fillSelectOptionsWithStringArray(fieldSelectRels, json.header);

    admin.initImportDialogSelects(json.header)


    common.fillSelectOptionsWithStringArray(collSelect, [json.name]);
    $("#collSelect").val(json.name);
    $("#sourceRel").val(json.name);
    $("#sourceNode").val(json.name);

    common.fillSelectOptionsWithStringArray(dbSelect, [json.name]);
//  $("#dbSelect").val('CSV');
    onCollSelect();
    try {
        loadRequests();
    }
    catch (e) {

    }


}
