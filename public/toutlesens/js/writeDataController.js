var writeDataController = (function () {
    self = {};

    self.saveRelation = function (callback) {
        var relType = $("#relations_relTypeSelect").val();
        if (!relType || relType == "") {
            return alert("select a relation type before saving relation")
        }

        var direction;
        var payload;
        if (relType.indexOf("-") == 0) {//inverse
            relType = relType.substring(1);
            direction = "inverse"
            var payload = {
                sourceNodeQuery: {_id: toutlesensController.currentRelationData.targetNode.id},
                targetNodeQuery: {_id: toutlesensController.currentRelationData.sourceNode.id},
                relType: relType
            }

        }
        else {//normal

            direction = "normal"
            var payload = {
                sourceNodeQuery: {_id: toutlesensController.currentRelationData.sourceNode.id},
                targetNodeQuery: {_id: toutlesensController.currentRelationData.targetNode.id},
                relType: relType
            }

        }


        treeController.callAPIproxy(payload, "createRelation", function (err, result) {
            if (err) {
                $("#message").html(err);
                return;
            }
            $("#message").html("relation saved");
            dialog.dialog("close");
            if (callback) {
                var edge = result[0].r.properties;
                edge.from = result[0].r._fromId;
                edge.to = result[0].r._toId;
                edge.id = result[0].r._id;
                edge.type = result[0].r.type;
                callback(edge);
            }


        })


    }
    return self;

})()