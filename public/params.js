/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
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
var Gparams = {
    logLevel:5,
    readOnly: true,
    showRelationAttrs:true,
    maxNodesForRelNamesOnGraph:20,
    startWithBulkGraphView: true,
    defaultNodeNameProperty:"name",
    defaultQueryDepth:2,
    bulkGraphViewMaxNodesToDrawLinks:1000,
    defaultGraphtype:"FLOWER",
    graphNavigationMode: "expandNode",
    wholeGraphViewMaxNodes: 5000,
    modifyMode: 'onList',//''onList'
    MaxResults: 5000,
    lang: "EN",

    profiles: {
        minimum: {
            hide: ["lang_52", "lang_62", "listDownloadButton", "div_externalRessources", "photoControls"],
            disable: ["listDownloadButton"]
        },
        all: {
            hide: [],
            disable: []
        }
    },
    currentProfile: "all",//minimum ,all
    navigationStyle: "",// , "jpt" // Jean Paul
    httpProxyUrl: "../http",
    neo4jProxyUrl: "/neo",
    rdfProxyUrl: "/rdf",
    mongoProxyUrl: "/mongo",
    storedParamsUrl: "/storedParams",
    imagesRootPath: "/files/albumPhotos/",
    forceAnimationDuration: 2000,
    maxDepthExplorationAroundNode: 3,
    // forceGraph
    circleR: 15,
    defaultNodeColor: "grey",
    nodeMaxTextLength: 40,
    user: "anonymous",
    curveOffset: 40,
    relStrokeWidth: 4,
    legendWidth: 200,
    minOpacity: .5,
    d3ForceParams: {distance: 200, charge: -500, gravity: .25},
    htmlOutputWithAttrs: true,
    showRelationNames: false,
    isInframe: false,
    treeGraphVertSpacing: 35,
    bigDialogSize: {w: 300, h: 400},
    gantt: {
        name: "nom",
        startField: "datedebut",
        endField: "datefin",
    },

 /*   palette: ['#B39BAB', '#FF78FF', '#A84F02', '#A8A302', '#0056B3',
        '#B354B3', '#FFD900', '#B37A00', '#B3B005', '#007DFF', '#F5ED02',
        '#F67502', '#B35905', '#FFFB08', '#FF7D07', '#FFDEF4',]
,*/

    palette: [
        '#B37A00',
        '#B354B3',
        '#0056B3',
        '#A84F02',
        '#A8A302',
        '#B3B005',
        '#007DFF',
        '#B35905',
        '#FFD900',
        '#FF78FF',

        '#007DFF',
        '#F5ED02',
        '#F67502',

        '#FFFB08',
        '#FF7D07',
        '#B39BAB',
        '#FFDEF4',]


    ,  palette: [
        '#B37A00',
        '#B354B3',
        '#0056B3',
        '#A84F02',
        '#A8A302',
        '#0b6e92',
        '#007DFF',
        '#B35905',
        '#a51544',
        '#d668d6',

        '#007DFF',
        '#045f18',
        '#F67502',

        '#76d415',
        '#1503b7',
        '#6e5c68',
        '#390008',]

}

/*
 * palette : [ '#0056B3', '#007DFF', '#A84F02', '#A8A302', '#B354B3', '#B35905',
 * '#B37A00', '#B39BAB', '#B3B005', '#F5ED02', '#F67502', '#FF78FF', '#FF7D07',
 * '#FFD900', '#FFDEF4', '#FFFB08', ]
 */