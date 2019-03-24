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



            $("#mainPanel_BuilPathButton").on('click', function (event) {
                event.stopPropagation();
                buildPaths.expandCollapse(true);
            })
            $("#mainPanel_textMenuButton").on('click', function (event) {
                event.stopPropagation();
                toutlesensController.dispatchAction('showGraphTable')
            })
            $("#mainPanel_schemaButton").click(function (e) {
                var storedSchema = localStorage.getItem("schemaGraph_" + subGraph)
                if (e.ctrlKey && storedSchema) {
                    localStorage.removeItem("schemaGraph_" + subGraph);
                }
                toutlesensController.dispatchAction("showSchema")

            });
            $("#mainPanel_zoomOnNodeMenuButton").on('click', function (event) {
                event.stopPropagation();
                toutlesensController.dispatchAction('zoomOnNode');
            })
            $("#mainPanel_fitMenuButton").on('click', function (event) {
                event.stopPropagation();
                visjsGraph.fitToPage()
            })
            $("#mainPanel_previousGraphMenuButton").on('click', function (event) {
                event.stopPropagation();
                visjsGraph.showPreviousGraph();
            })
            $("#mainPanel_nextGraphMenuButton").on('click', function (event) {
                event.stopPropagation();
                visjsGraph.showNextGraph()
            })
            $("#mainPanel_displaySettingButton").on('click', function (event) {
                event.stopPropagation();
                toutlesensController.dispatchAction('displaySettings');
            })
            $("#mainPanel_newNodeButton").on('click', function (event) {
                event.stopPropagation();
                toutlesensController.dispatchAction('addNode')
            })
            $("#mainPanel_parametersMenuButton").on('click', function (event) {
                event.stopPropagation();
                toutlesensController.dispatchAction('showGlobalMenu')
            })
            $("#mainPanel_showHideLabelsButton").on('click', function (event) {
                event.stopPropagation();
                visjsGraph.showHideLabels()
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
                            if(Array.isArray(ui.newPanel)){
                                var panelId = ui.newPanel[0].id;
                                if (panelId == "findDiv") {
                                    buildPaths.expandCollapse(true)
                                }
                            }

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
                        }
                        if (index == 2) {
                            toutlesensController.currentActionObj.mode = "expand";

                        }
                        if (index == 3) {
                            toutlesensController.currentActionObj.mode = "highlight";
                            $("#paintAccordion").accordion("option", "active",1)
                            $("#paintAccordion").accordion("option", "active", 0)

                        } if (index == 4) {
                            //searchNodes.searchSimilars(context.currentNode);
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
                        if (index == 0) {

                            ;//toutlesensController.currentActionObj = {type: "findNode"}
                        } if (index == 1)
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