var savedQueries = (function () {

        var self = {};
        self.currentQueryRun = [];
        self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;


        self.addToCurrentSearchRun = function (match, callback) {
            if (!match || match.indexOf("-[")<0) // on n'enregistre pas si pas de relations
                return;
            var obj = {match: match}
            if (callback)
                obj.callback = callback;

            self.currentQueryRun.push(obj);
        }


        self.resetCurrentSearchRun = function (data) {
            self.currentQueryRun = [];
        }


        self.loadQueryRuns = function () {


        }

        self.saveQueryRun = function () {

            var name = prompt("enter query name", "");


            if (name && name != "") {

                var queryRunStr=JSONfn.stringify(obj,null,2)


                localStorage.setItem("savedQueries_" + subGraph, queryRunStr);
                //  $("#searchDialog_savedQueries").prepend("<option>" + name + "</option>")

                self.loadQueryRuns();
            }


        }
        self.DeleteQueryRun = function () {

            var name = $("#searchDialog_savedQueries").val();
            if (name && name != "") {
                delete savedQueries[name];
                localStorage.setItem("savedQueries_" + subGraph, JSON.stringify(savedQueries));
                self.loadQueryRuns();
                /*$("#searchDialog_savedQueries option").each(function () {
                    if ($(this).val() == name) {
                        $(this).remove();
                        return;
                    }
                });*/
            }
        }

        self.DeleteQueryRunAll = function () {
            localStorage.removeItem("savedQueries_" + subGraph);
            self.loadQueryRuns();
        }

        self.playQueryRun = function () {
            var queryRunStr=JSONfn.stringify(self.currentQueryRun,null,2)
            console.log(queryRunStr);
            var currentQueryRun=JSONfn.parse(queryRunStr)



            async.eachSeries(currentQueryRun, function (query, eachCallback) {
                var match = query.match;
                var queryCallback = query.callback;
console.log(match)
                var payload = {match: match};


                $.ajax({
                    type: "POST",
                    url: self.neo4jProxyUrl,
                    data: payload,
                    dataType: "json",
                    success: function (data, textStatus, jqXHR) {
                        if (queryCallback)
                            queryCallback(null, data)
                        eachCallback()
                    },
                    error: function (error) {
                        eachCallback(error)
                    }


                })
            }, function (err) {
                if (err) {
                    console.log(err)
                }
                console.log("done")


            })


        }


        return self;


    }
)()