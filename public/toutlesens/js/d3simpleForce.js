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

var d3simpleForce = (function () {
    var self = {};
    self.force;
    var icon;




    self.drawSimpleForce = function (nodes, links) {

        var selector = "#graphDiv";
        var w = $(selector).width() - 50;
        var h = $(selector).height() - 50;

        var charge = Gparams.d3ForceParams.charge;
        var gravity = Gparams.d3ForceParams.gravity;
        var distance = Gparams.d3ForceParams.distance;
        var isDragging = false;


        d3.select(selector).selectAll("svg").remove();


        self.zoom = function () {
            return;
            if (d3.event.translate > 100)
                d3.event.translate = 100;
            /*svg.attr("transform", "translate(" + d3.event.translate
             + ")scale(" + d3.event.scale + ")");*/
            svg.attr("transform", "scale(" + d3.event.scale + ")");
        }

        var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on(
            "zoom", self.zoom);

        var svg0 = d3.select(selector).append("svg:svg")
            .attr('width', w)
            .attr('height', h);
        svg = svg0.append("svg:g").attr("id", "canvas").call(zoomListener);


        // zoomListener.x([]);
        // svg0.attr("transform", "translate(-"+ w/2+" -"+h/2+")");

        // svg0.attr("transform", "translate(" + -500 + "," + -500 + ")")
        svg.append("svg:rect")
            .style("stroke", "#999")
            .style("fill", "#fff")
            .attr('width', w)
            .attr('height', h)
            .on("click", function () {
                self.force.stop()
            });

        force = d3.layout.force()
            .on("tick", self.tick)
            .nodes(nodes)
            .links(links)
            .size([w - 20, h - 20])
            .linkDistance(distance)
            .charge(charge)
            .gravity(gravity)

            .start();
        self.force = force;

        update = function () {


            isDragging = false;

            //  var nodes = flatten(json);
            //  var links = d3.layout.tree().links(nodes);
            var total = nodes.length || 1;


            // remove existing text (will readd it afterwards to be sure it's on top)
            svg.selectAll("text").remove();

            // Restart the force layout
            /* force
             .gravity(Math.atan(total / 50) / Math.PI * 0.4)
             .nodes(nodes)
             .links(links)
             .start();*/

            //force = d3.layout.force()


            // sticky drag
            var drag = force.drag()
                .on("dragstart", self.dragstart)
                .on("dragend", function (d) {
                    isDragging = true;
                });

            self.dragstart = function (d) {
                toutlesensController.hidePopupMenu()
                isDragging = false;
                d3.select(this).classed("fixed", d.fixed = true);
            }

            // Update the links
            link = svg.selectAll("line.link")
                .data(links);
            // .data(links, function(d) { return d.target.name; });


            link.enter().insert("svg:g", ".node").attr("class", "link")
            // Exit any old links.
            link.exit().remove();


            link.each(function (d) {
                var aLine = d3.select(this)

                    .append("path").attr("id", "path_" + d.id).attr("d", function (d) {
                        var ctlPoint = {
                            x: ((d.source.x + d.target.x) / 2 + Gparams.curveOffset),
                            y: ((d.source.y + d.target.y) / 2) + Gparams.curveOffset
                        }
                        var str = "M" + d.source.x + "," + d.source.y + " " + "C" + d.source.x + "," + d.source.y + " " + ctlPoint.x + "," + ctlPoint.y + " " + d.target.x + "," + d.target.y
                        return str;
                    })
                    .attr("stroke", function (d) {
                        if (d.target.decoration) {
                            if (d.target.decoration.color)
                                return d.target.decoration.color;
                            return "purple";

                        }
                        if (d.target.color)
                            return d.target.color;
                        else
                            return linkColors[d.target.relType];

                    })

                    .style('opacity', function (d) {
                        if (d.target.decoration)
                            return .8;
                        if (d.isRoot == true)
                            return .8;
                        return .8;


                        //  return Gparams.minOpacity;

                    })

                    .attr("stroke-width", function (d) {
                        if (d.target.relProperties && d.target.relProperties[Gparams.visibleLinkProperty])
                            return d.target.relProperties[Gparams.visibleLinkProperty] * Gparams.relStrokeWidth;
                        return Gparams.relStrokeWidth;
                    })


                    .attr("fill", "none")
                //   .attr("stroke", "#65dbf1");
                //  .attr("stroke", nodeColors[d.target.label]);
            });


            link.each(function (d) {
                d3common.showRelationsOnGraph( d3.select(this),d)  ;
            /*    var nodeLinks= d3.select(this);
                for(var i=0;i<nodeLinks.length;i++){
                    d3common.showRelationsOnGraph(nodeLinks[i],d)  ;
                }*/

             /*   if (d.source.shape == "textBox" || d.target.level > 2)
                    return;
                var aLine = d3.select(this).append("text").attr("dy", -5)
                    .append("textPath")
                    .text(function (d) {
                        if (d.target.relDir == "normal")
                            return d.target.relType + " ->";
                        else
                            return "<- " + d.target.relType;
                    })
                    .attr("xlink:href", "#path_" + d.target.id)
                    .attr("marker-end", "url(#arrowhead)")
                    .style("text-anchor", "middle") // place the text halfway on the arc
                    .attr("startOffset", "50%")
                    .style("font-size", "12px")
                    .style("fill", d.target.color)
                    .style("font-weight", "bold")*/
                ;

            });


            // Update the nodes
            node = svg.selectAll("circle.node")
                .data(nodes, function (d) {
                    return d.name;
                })
                .classed("collapsed", function (d) {
                    return d._children ? 1 : 0;
                });

            node.transition()
                .attr("r", function (d) {
                    return Gparams.circleR;
                    //  return d.children ? 3.5 : Math.pow(d.size, 2 / 5) || 1;
                });

            node.enter().append(
                "svg:g")
            //.on("dblclick", dblclickPoint).on("click", clickPoint)
                .call(drag)
                .attr("class", "node")
                .classed('directory', function (d) {
                    return (d._children || d.children) ? 1 : 0;
                })
                .on("click", d3common.d3CommonClick)
                .on("dblclick", d3common.d3CommonDblclick)
                .on("mouseover", self.mouseOver)
                .on("mouseout", self.mouseOut)
                .attr("class", "pointsRadar").attr("id", function (d) {
                return "P_" + d.id;
            });

            node.each(function (d) {
                var hasIcon = false;

                if (Gparams.customIcons && Gparams.customIcons[subGraph] && Gparams.customIcons[subGraph][d.label]) {// icon
                    hasIcon = true;
                }
                icon = Schema.schema.labels[d.label].icon;
                if (icon)
                    hasIcon = true;
                var anode = d3.select(this);
                var ashape;
                if (d.shape && d.shape == "textBox") {
                    shape = anode.append('rect')
                        .attr("width", 10).attr("height", 10).attr("rx", 10).attr("ry", 10)
                }

                else {// if( d.shape=="circle" ){
                    if (hasIcon) {
                        shape = anode.append("svg:image")
                            .attr('x', -15)
                            .attr('y', -15)
                            .attr('width', 25)
                            .attr('opacity', 1)
                            //.attr('height', 24)
                            //  .attr("xlink:href", "icons/" + Gparams.customIcons[subGraph][d.label]);
                            .attr("href", "icons/" + icon);
                    }
                    shape = anode.append('svg:circle')
                        .attr("r", function (d) {
                            if (hasIcon === true)
                                return 15;
                            if (d.hiddenChildren && d.hiddenChildren.length > 0)
                                return Gparams.circleR * 1.2;
                            if (d.decoration && d.decoration.size)
                                return d.decoration.size;

                            var r0 = Gparams.circleR / 3;
                            if (d.isRoot == true || d.isTarget == true) {
                                return r0 * 2;
                            }
                            if (d.rels && d.rels.length > 0) {
                                return r0 * 2;
                                var r = r0 + (r0 * Math.log(d.rels.length) )
                                return r;
                                // return Math.min(r,Gparams.circleR *4);
                            }
                            return r0;

                        })


                }
                shape.style("stroke", function (d) {
                    if (d.isTarget)
                        return "purple";
                    if (d.isRoot || d.isTarget == true)
                        return "purple";

                    return "000";
                })
                shape.style("stroke-width", function (d) {
                    if (d.isRoot || d.isTarget == true)
                        return 4;
                    return 1;
                })
                    .style("fill", function (d) {
                        if (d.decoration && d.decoration.color)
                            return d.decoration.color;
                        return nodeColors[d.label];
                        return "grey";
                    })

                    .style('opacity', function (d) {
                        if (hasIcon === true)
                            return 0.7;
                        if (d.isRoot || d.isTarget)
                            return 1;
                        return Gparams.minOpacity;

                    })
                    .attr("class", "shape");




                anode.append("text").attr("x", function (d) {


                    if (d.isRoot == true || d.isTarget == true)
                        return (Gparams.circleR * 2) + 3;
                    return Gparams.circleR / 2;

                }).attr("dy", ".35em").attr('class', 'nodeText')
                    .style("fill", function (d) {
                        if (d.isRoot == true || d.target == true)
                            return "purple";
                        return "#444";
                    }).attr("text-anchor", function (d) {
                    if (d.shape == "textBox")
                        return "middle";
                    return "start";
                }).text(function (d) {
                    var match = /__[0-9]*/.exec(d.name);
                    if (match) {
                        var p = match.index;
                        if (p > -1)
                            return d.name.substring(0, p);
                    }
                    if (d.name && d.name.length > Gparams.nodeMaxTextLength)
                        return d.name.substring(0, Gparams.nodeMaxTextLength - 1) + "...";
                    return d.name;
                }).style("fill-opacity", 1)
                    .style("font-weight", function (d) {
                        if (d.shape == "textBox" || d.isRoot == true)
                            return "bold";
                        return "normal";
                    })

                    .style("font-size", function (d) {
                        if (d.shape == "textBox" || d.isRoot == true)
                            return "14px";
                        return "12px";

                    })
                if (d.hiddenChildren && d.hiddenChildren.length > 0) {
                    anode.append("text").attr("x", 0).attr("y", 5).text(function (d) {
                        return d.hiddenChildren.length;
                    }).attr("text-anchor", "middle").style("fill", "purple")
                }
            });


            node.each(function (d) {
                if (d.shape == "textBox") {
                    var bBox = d3.select(this).select("text").node().getBBox();
                    d3.select(this).select("rect").attr("x", bBox.x - 5).attr("width", bBox.width + 10).attr("height", bBox.height + 10).attr("y", (-bBox.height + 2));
                }

            })


            /*  text = svg.append('svg:text')
             .attr('class', 'nodetext')
             .attr('dy', 0)
             .attr('dx', 0)
             .attr('text-anchor', 'middle')
             .style("fill", "purple")*/
            link.each(function (d) {

                d3.select("#path_" + d.id).style("opacity", Gparams.minOpacity);
                d3.select("#path_" + d.id).select("text").style("stroke", null);
                //  d3.select("#path_" + d.id).select("path").style("stroke", "brown");

            });


            return this;
        };

        self.mouseOver = function (d) {
            d3common.d3CommonMouseover(d)
            for (var i = 0; i < d.rels.length; i++) {
                var id = d.rels[i];
                d3.select("#path_" + id).style("opacity", 1);
                d3.select("#path_" + id).select("text").style("stroke", "purple");
                //   d3.select("#path_" + id).select("path").style("stroke", "purple");


            }
        }
        self.mouseOut = function (d) {
            d3common.d3CommonMouseout(d)
            link.each(function (d) {

                d3.select("#path_" + d.id).style("opacity", Gparams.minOpacity);
                d3.select("#path_" + d.id).select("text").style("stroke", null);
                //    d3.select("#path_" + d.id).select("path").style("stroke", "brown");

            });
        }


        self.tick = function () {
            link.select("path").attr("d", function (d) {
                if (d.source.isSource) {
                    d.source.x = 100;
                    d.source.y = 100;
                }
                if (d.target.isTarget) {
                    d.target.x = w - 100;
                    d.target.y = h - 100;
                }
                var ctlPoint = {
                    x: ((d.source.x + d.target.x) / 2 + Gparams.curveOffset),
                    y: ((d.source.y + d.target.y) / 2) + Gparams.curveOffset
                }
                var str = "M" + d.source.x + "," + d.source.y + " " + "C" + d.source.x + "," + d.source.y + " " + ctlPoint.x + "," + ctlPoint.y + " " + d.target.x + "," + d.target.y

                // console.log(str);
                return str;
            });


            node.attr("transform", function (d) {
                if (d.isSource) {
                    d.x = 100;
                    d.y = 100;
                }
                if (d.isTarget) {
                    d.x = w - 100;
                    d.y = h - 100;
                }

                return "translate(" + Math.max(5, Math.min(w - 5, d.x)) + "," + Math.max(5, Math.min(h - 5, d.y)) + ")";
            });
        };

        self.cleanup = function () {
            update([]);

            force.stop();
        };


        update();
        var wwww = d3.select(svg);
        d3.select(".canvas").attr("transform", "translate(" + 500 + "," + 500 + ")")
        /*  var xxx=-zoomListener.x();
         zoomListener.center();*/


    }


    return self;
})()