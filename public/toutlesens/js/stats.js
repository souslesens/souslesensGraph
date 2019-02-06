var stats = (function () {
    var self = {};

    self.execute = function () {
        if (!toutlesensController.graphDataTable) {
            toutlesensController.graphDataTable = new myDataTable();
            toutlesensController.graphDataTable.pageLength = 30;
        }



        var statType = $("#stats_typeSelect").val();
        if (statType == "relationsRanking") {
            var statsData = self.getRelationsRankingStat(exportDialog.dataset, $("#stats_sourceLabelSelect").val(), $("#stats_targetLabelSelect").val());
            dialogLarge.load("htmlSnippets/dataTable.html", function () {
                dialogLarge.dialog("open");
                toutlesensController.graphDataTable.loadJsonInTable(null, "dataTableDiv", statsData, function (err, result) {
                }, 2000)


            })
        }
    }
    self.getRelationsRankingStat = function (dataset, sourceLabel, targetLabel) {
        var scores = [];
        dataset.forEach(function (line) {

            if (sourceLabel =="" || sourceLabel == line.label) {

            }




        })
        scores.sort(function(a,b){
            return b.countRels-a.countRels;
        })
        return scores;

    }


    return self;

})()