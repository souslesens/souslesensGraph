var findTabs;
var dialogLarge;
var dialog;
var tabsAnalyzePanel;
var eventsController = (function () {
        var self = {};
        self.stopEvent = false;
        self.startSearchNodesTime = null;

        self.initInputEvents = function () {


            $("#word").focus();
            $("body").click(function (e) {
                currentMousePosition = {
                    x: e.pageX,
                    y: e.pageY
                }
            });





            $("#graphDiv").click(function (e) {
                var xx = e;
            })


            $("#schemaButton").click(function (e) {
                var storedSchema = localStorage.getItem("schemaGraph_" + subGraph)
                if (e.ctrlKey && storedSchema) {
                    localStorage.removeItem("schemaGraph_" + subGraph);
                }
                toutlesensController.dispatchAction("showSchema")

            });

            $("#word").keyup(function (e) {
                //********************************************************
//trigger search depending on mode and keys
                if (Gparams.searchNodeAutocompletion) {
                    if (!eventsController.startSearchNodesTime) {// temporisateur
                        eventsController.startSearchNodesTime = new Date();
                        return;
                    } else {
                        var now = new Date();
                        if (now - eventsController.startSearchNodesTime < Gparams.searchInputKeyDelay)
                            return;
                    }


                } else {
                    if (e.keyCode != 13)
                        return;
                }
                toutlesensController.searchNodesUI('matchStr', null, null, treeController.loadSearchResultIntree);

            });

            $("#eraseWordButton").click(function (e) {
                self.startSearchNodesTime = null;
                $('#word').val('').focus();
            });


            $('#visJsSearchGraphButton').on('keypress', function (e) {
                if (e.which === 13) {
                    var expression = $("#visJsSearchGraphButton").val();
                    visjsGraph.findNode(expression, "blue", 15);
                }
            });

            $("#queryDiv").on('mousedown', function (e) {
                if (self.stopEvent)
                    return self.stopEvent = false;
                toutlesensController.openFindAccordionPanel(true);
            })
            ;
            $("#analyzePanel").on('mousedown', function (e) {
                if (self.stopEvent)
                    return self.stopEvent = false;
                toutlesensController.openFindAccordionPanel(false);
            })


//*******************************************components**************************************
//*****************************************************************************************
            self.initcomponentEvents = function () {

                dialog = $("#dialog").dialog({
                    autoOpen: false,
                    height: Gparams.smallDialogSize.h,
                    width: Gparams.smallDialogSize.w,

                    modal: true,
                    position: {my: "left top", at: "left bottom", of: $("#mainButtons")}


                });

                dialogLarge = $("#dialogLarge").dialog({
                    autoOpen: false,
                    height: Gparams.bigDialogSize.h,
                    width: Gparams.bigDialogSize.w,
                    modal: true

                });

                $("#advancedQueriesAccordion").accordion(
                    {
                        active: false,
                        collapsible: false,
                        activate: function (event, ui) {
                            dialog.dialog("close");
                            $("#graphPopup").css("visibility", "hidden");
                        }
                    });
                ;

                $("#mainAccordion").accordion(
                    {
                        active: 0,
                        collapsible: true,
                        activate: function (event, ui) {

                        }
                    });
                ;




                tabsAnalyzePanel = $("#tabs-analyzePanel").tabs({


                    activate: function (event, ui) {
                        dialog.dialog("close");
                        $("#graphPopup").css("visibility", "hidden");

                        var index = ui.newTab.index();

                        if (index == 0) {
                            toutlesensController.currentActionObj.mode = "infos";

                        }
                        if (index == 1) {
                            toutlesensController.currentActionObj.mode = "filter";
                            /*    var filterMovableDiv = $("#filterMovableDiv").detach();
                                $("#searchCriteriaTextDiv").css("visibility", "hidden");
                                $("#searchCriteriaAddButton").css("visibility", "hidden");

                                $("#filterDiv").append(filterMovableDiv);
                                $("#filterActionDiv").html(
                                    "<button onclick=\"filters.filterOnProperty(null,'only')\">Only</button>" +
                                    "<button onclick=\"filters.filterOnProperty(null,'not')\">Not</button>" +
                                    "<button onclick=\"filters.filterOnProperty(null,'removeAll')\">Clear Filter</button>"
                                );
                                filters.setLabelsOrTypes("node");*/
                        }
                        if (index == 2) {
                            toutlesensController.currentActionObj.mode = "highlight";

                            /*   $("#searchCriteriaTextDiv").css("visibility","hidden").css("height","10px");
                               $("#searchCriteriaAddButton").css("visibility", "hidden");
                               $("#propertiesSelectionDialog_propertySelect").val("");
                               var filterMovableDiv = $("#filterMovableDiv").detach();
                               $("#highlightDiv").append(filterMovableDiv);*/
                            /*   $("#highlightDiv").load("htmlSnippets/paintDialog.html", function () {
                                   paint.initColorsPalette(10, "paintDialogPalette");
                                   filters.setLabelsOrTypes("node");
                               });*/

                        }

                        if (index == 3) {
                            searchNodes.searchSimilars(context.currentNode);
                        }


                    }
                });


                findTabs = $("#findTabs").tabs({


                    load: function (event, ui) {

                    },
                    activate: function (event, ui) {
                       // $("#dialog").dialog("close");
                        $("#graphPopup").css("visibility", "hidden");
                        toutlesensController.openFindAccordionPanel(true);
                        var index = ui.newTab.index();
                        if (index == 0) {
                            toutlesensController.currentActionObj = {type: "findNode"}
                            searchNodes.context = {pathType: "neighbour"};
                            var nodeDivDetach = $("#nodeDivDetachable").detach();

                            $("#nodeDiv").append(nodeDivDetach);

                        }
                        if (index == 0)
                            ;//toutlesensController.currentActionObj = {type: "findNode"}
                        if (index == 1)
                            toutlesensController.currentActionObj = {type: "findNode"}

                        if (index == 2)
                            toutlesensController.currentActionObj = {type: "relation"}
                        if (index == 3)
                            toutlesensController.currentActionObj = {type: "pathes"}
                      /*  if (index == 5) {// plugin
                          $("#treeDivKeolis").css("visibility","visible")
                            $("#plugin:first-child").css("visibility","visible")


                            ;//   toutlesensController.searchNodesUI('exec', null, null, tagCloud.drawCloud);
                        }
                        else{
                          $("#treeDivKeolis").css("visibility","hidden")
                            $("#plugin:first-child").css("visibility","hidden")

                        }*/
                    },
                    create: function (event, ui) {
                        toutlesensController.currentActionObj = {type: "findNode"}

                    }
                });


                $("#graphDiv").click(function (e) {
                    if (currentDisplayType = "VISJS-NETWORK")
                        return;
                    var dat = e.target.__data__;
                    if (!dat) {
                        toutlesensController.hidePopupMenu();
                        return;
                    }
                    if (dat.id == null || dat.id == "")
                        toutlesensController.hidePopupMenu();

                });


                $("#BIlegendDiv").draggable();


            }


        }


        return self;

    }
)()