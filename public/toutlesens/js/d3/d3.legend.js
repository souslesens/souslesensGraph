var vis;
var visLeg;
var drag;
var svgGroup;
var yLeg = 30;
var xLeg = 10;
var circleLegR = 6;
var yDecoLeg;
function drawLegend() {

    yLeg = 30;
    if (visLeg) {
        $("#graphLegendDiv").html("");
        d3.select(".legendSVG").selectAll("*").remove();

    }
    var w = $("#graphLegendDiv").width();
    var h = $("#graphLegendDiv").height();


    visLeg = d3.select("#graphLegendDiv").append("svg:svg").attr("width", w).attr(
        "height", h).attr("class", "legendSVG");

    var labels = new Array;
    // 230;


    var legHeight = $("#graphLegendDiv").height();
    var legWidth = $("#graphLegendDiv").width() - 10;





    var relations = []

    for (type in legendRelTypes) {

        var obj = {
            label: type.label,
            index: type.index,
            x: xLeg,
            y: yLeg
        }
        relations.push(type);

    }
    for (label in legendNodeLabels) {
        // legHeight += 20;

        var obj = {
            name: label,
            x: xLeg,
            y: yLeg
        }
        if (!excludeLabels[obj.name])
            excludeLabels[obj.name] = -1;
        if (obj.name != "") {
            labels.push(obj);
            yLeg += 20;
        }
    }
    yLeg += 30;


    var legend = visLeg.data([{
        x: 150,
        y: 100
    }]).append("g").attr("class", "legend").attr("transform", function (d) {
        return "translate(" + 10 + "," + 15 + ")"
    }).attr("x", function (d) {
        return d.x
    })
        .attr("y", function (d) {
            return d.y
        })

    /*  legend.append("rect").attr("class", "legendRect").attr("x", 0).attr("y", 0).attr("width", legWidth)
     .attr("height", legHeight).style("stroke", null).style("stroke-widh", "1px").style("fill",
     "#eee");*/


    var legendElts = legend.selectAll("g").data(labels).enter().append("g")
        .attr("class", "legendElt").attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        }).on("click", clickLegend);

    legendElts.append("circle").attr('class', 'nodeCircle').attr("r",
        circleLegR).style("fill", function (d) {
        var color = nodeColors[d.name];
        if (!color)
            return Gparams.defaultNodeColor;
        return color;
    }).style("stroke", function (d) {
        var color = nodeColors[d.label];
        if (color)
            return color;
        return Gparams.defaultNodeColor;

    }).attr("x", circleLegR).attr("y", 0);

    legendElts.append("text").attr("x", function (d) {
        return circleLegR + 8;
    }).attr("dy", ".35em").attr('class', 'legendText')

        .style("fill", function (d) {
            return "#000";
        }).attr("text-anchor", function (d) {
        return "start";
    }).text(function (d) {
        return d.name;
    }).style("fill-opacity", 1).style("font-size", "12px");



    //lien vers les decorations
    yLeg += 30;
    visLeg.append("text").attr("x", 0)
       // .attr("dy", ".50em")
        .attr('class', 'legendText')
        .attr("transform", function (d) {
            return "translate(" + xLeg + "," + (yLeg +10) + ")"
        })
        .style("fill", function (d) {
            return "purple";
        }).attr("text-anchor", function (d) {
        return "start";
    }).text(function (d) {
        if (Gparams.lang == "FR")
            return "Representer les proprietes...";
        else
            return "Paint properties...";
    }).style("fill-opacity", 1).style("font-size", "14px").style("font-weight", "bold")
        .on("click", showGraphDecorationObjsDialog);

    yLeg += 20;


}


function drawDecorationLegend(_decorationObjs) {
    var decorationObjs = _decorationObjs;
    if(decorationObjs.length==0)
        return;

    var title="["+decorationObjs[0].label+"]"+decorationObjs[0].property

    yDecoLeg = 0;
    var decorationLegend = visLeg.append("g").attr("x", 0)
        .attr("dy", ".35em").attr('class', 'decorationLegend')
        .attr("transform", function (d) {
            return "translate(" + 0 + "," + (yLeg) + ")"
        })
// bounding retangle
    var bBox = {x: 2, y: 10, height: totalHeight-50, width: Gparams.legendWidth-4};
    decorationLegend.append("rect")
        .attr("x", bBox.x).attr("width", bBox.width).attr("height", bBox.height).attr("y", (bBox.y ))
        .style("stroke",null)
        .attr('fill-opacity', 1)
        .style("fill",  "#efe6d5");
// title
    decorationLegend.append("text").attr("x", 30).attr("y",30)
        .attr("dy", 20).attr('class', 'legendText')
        .style("fill", function (d) {
            return "purple";
        }).attr("text-anchor", function (d) {
        return "start";
    }).text(function (d) {
            return title;
    }).style("fill-opacity", 1).style("font-size", "14px");

    yDecoLeg+=40

    // decorations elts

    var decorations = decorationLegend.selectAll("g").data(decorationObjs).enter().append("g")
            .attr("dy", ".35em")
            .attr('class', 'decorationLegend')
            .attr("transform", function (d) {
                var vOffset = 30;
                if (d.size)
                    vOffset += d.size + 10;
                yDecoLeg += vOffset;
                return "translate(" + (xLeg+10) + "," + yDecoLeg + ")"
            })
        ;


    decorations.append("circle").attr('class', 'nodeCircle')
        .attr("r", function (d) {
            if (d.size)
                return d.size / 2;
            return circleLegR;
        }).style("fill", function (d) {
        if (d.color)
            return d.color;
        return Gparams.defaultNodeColor;
        return color;
    }).style("stroke", function (d) {
        return Gparams.defaultNodeColor;
    })

    decorations.data(decorationObjs).append("text").attr("x", function (d) {
        if (d.size)
            return (d.size / 2) + 8;
        return circleLegR + 8;
    }).attr("dy", function () {
    }).attr('class', 'legendText')

        .style("fill", function (d) {
            return "#000";
        }).attr("text-anchor", function (d) {
        return "start";
    }).text(function (d) {
        if (d.value)
            return d.value;
        return "ssss";
    }).style("fill-opacity", 1).style("font-size", "12px");


    /* .append("rect")
     .attr("width", 30).attr("height", 30)
     .attr("transform", function (d) {
     return "translate(" + 10 + "," + (y2+=20 ) + ")"
     })
     .style("stroke", function (d) {
     if (d.level == 0 || d.isRoot == true)
     return "purple";
     return "purple";
     })

     .style("fill", function (d) {
     if (d.decoration && d.decoration.color)
     return d.decoration.color;
     if (d.color)
     return d.color;
     return nodeColors[d.label];
     return "purple";
     })*/


}