var mainController = (function () {
    var self = {}
    self.accordionWidth = 600;

    self.init0 = function () {
        self.initSocket();
        self.initDimensions();
        self.onPageLoaded();

    }
    self.onPageLoaded = function () {

        $("#importNodesDiv").load("htmlSnippets/importNodesDialog.html", function () {

        })
        $("#importRelationsDiv").load("htmlSnippets/importRelationsDialog.html", function () {

        })

        $("#savedQueriesDiv").load("htmlSnippets/savedQueriesDialog.html", function () {

        })

        $("#neoDbDiv").load("htmlSnippets/neoDbDialog.html", function () {
            ui.loadSubgraphs();
        })

        $("#importGraphDbDiv").load("htmlSnippets/importGraphDbDialog.html", function () {

        })
        $("#exportGraphDbDiv").load("htmlSnippets/exportGraphDbDialog.html", function () {
            ui.loadSubgraphs();
        })

        $("#adminDiv").load("htmlSnippets/adminDialog.html", function () {

        })


    }

    self.initDimensions = function () {
        var accordionWidth = self.accordionWidth;
        var totalWidth = $(window).width();
        var totalHeight = $(window).height();
        var split = 0;
        $("#left").width(split).height(totalHeight - 10);
        $("#graphPanel").css("left", split + accordionWidth).width((totalWidth - (split + accordionWidth))).height(totalHeight - 10);
        $("#graphDiv").width((totalWidth - (split + accordionWidth + 50))).height(totalHeight / 3 * 2);
        $("#accordionPanel").css("left", split).width((accordionWidth)).height(totalHeight / 3 * 2);
        $(".splitter_panel").width(totalWidth - split).height(totalHeight - 10);
        $('#main').width("100%").height("100%").split({
            orientation: 'vertical',
            limit: 100,
            position: (split) + 5
        });


    }

    self.initSocket = function () {
        var url = window.location.href;
        var p = url.indexOf('/admin');
        url = url.substring(0, p);
        var socket = io.connect(url);
        socket.on('connect', function (data) {
            socket.emit('join', 'Hello World from client');
        });
        socket.on('messages', function (message) {

            if (!message || message.length == 0)
                return;
            $("#waitImg").css("visibility", "hidden");
            if (typeof message == 'string') {
                if (message.indexOf("listCsvFields") > 0) {
                    var messageObj = JSON.parse(message);
                    ui.initImportDialogSelects(messageObj);

                    var subGraph = $("#subGraphSelect").val();
                    messageObj.subGraph = subGraph
                    requests.saveCSVsource(messageObj);
                    requests.init(subGraph);
                    return;
                }
                var color = "green";


                if (message.indexOf("ENOENT") > -1)
                    return;

                if (message.toLowerCase().indexOf("error") > -1)
                    color = "red";
                $("#messageDiv").css("color", color);
                $("#messageDiv").html(message);

            }
        })
    }


    return self;
})()