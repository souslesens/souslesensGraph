
/*

MATCH p=((a:concept)-[r1]-(b:paragraph)-[r2]-(c:concept))  WHERE a.subGraph='totalRef5' AND b.subGraph='totalRef5' AND c.subGraph='totalRef5' RETURN distinct(a.name) as concept,count(b) as countParagraphs, collect(distinct(c.name))  as conceptsLies limit 5000
 */



var fs = require('fs');


var data = "" + fs.readFileSync("D:\\Total\\conceptsLies.txt");

var map = {};
var lines = data.split("\r");
var allconcepts = []
lines.forEach(function (line) {
    line = line.trim();
    var cols = line.split(",\"[");
    if (cols.length != 2)
        return;
    var col0 = cols[0];
    allconcepts.push(col0)
    if (!map[col0])
        map[col0] = {};
    var col2Str = cols[1];
    col2Str = col2Str.replace("]\"", "")
    var cols2 = col2Str.split(",")
    cols2.forEach(function (col1) {
        if (!map[col0][col1])
            map[col0][col1] = 0;
        map[col0][col1] += 1;
    })
})
var matrix = [];


allconcepts.forEach(function (concept1) {
    var frequencies = []
    allconcepts.forEach(function (concept2) {
        frequencies.push(0);
    })
    matrix.push(frequencies);
})


allconcepts.forEach(function (concept1,index1) {
    allconcepts.forEach(function (concept2,index2) {
        if (map[concept1][concept2])
            matrix[index1][index2]+=1;
        if( matrix[index1][index2]>1)
            var ww=1;
            })
})

console.log(JSON.stringify(matrix,null,2))











