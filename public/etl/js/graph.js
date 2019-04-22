var graph=(function(){
    var self={};
    self.drawVisjsGraph=function(){


    }

  self.deleteNeoSubgraph=function (subGraph) {
        if (!subGraph)
            subGraph = $("#subGraphSelect").val();
        var ok = confirm("Voulez vous vraiment effacer le subGraph " + subGraph);
        if (!ok)
            return;

        var whereSubGraph = "";
        if (subGraph != Gparams.defaultSubGraph)
            whereSubGraph = " where n.subGraph='" + subGraph + "'"
        var match = 'MATCH (n)-[r]-(m) ' + whereSubGraph + ' delete  r';
        Cypher.executeCypher(match, function (err, data) {
            if(err)
                return $("#messageDiv").html(err);
            var match = 'MATCH (n)' + whereSubGraph + ' delete n';
            Cypher.executeCypher(match, function (err, data) {
                if(err)
                    return $("#messageDiv").html(err);
                $("#messageDiv").html("subGraph=" + subGraph + "deleted");
                $("#messageDiv").css("color", "red");
                $(graphDiv).html("");
                $('#labelsSelect')
                    .find('option')
                    .remove()
                    .end()

            });
            Schema.delete(subGraph);
        });
    }
    self.deleteLabel=function () {
        var label = $('#labelsSelect').val();
        var subGraph = $("#subGraphSelect").val();
        if (!label || label.length == 0) {
            $("#messageDiv").html("select a label first", "red");
            $("#messageDiv").css("color", "red");
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
            Cypher.executeCypher(match, function (err, data) {
                if(err)
                    return $("#messageDiv").html(err);
                $("#messageDiv").html("nodes with label=" + label + "deleted");
                $("#messageDiv").css("color", "green");
                admin.drawVisjsGraph();

            });
        }


    }

    return self;


})()