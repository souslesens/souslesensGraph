var fs = require('fs');
var path = require('path');


var transformThesaurusIngenieur = {


    toJstree: function () {
        var filePath = path.resolve(__dirname + "/../../config/others/thesaurusIngenieur.json")
        var data = "" + fs.readFileSync(filePath);

        var json = JSON.parse(data);
        var array = json.thesaurus;


        var jstreeData = []

        function recurseParents(line) {


            obj = {
                id: "" + line.id,
                parent: line.parent_id ==1? "#":""+line.parent_id,
                text: line.term,
                data: {
                    related: line.related,
                    label: line.term_label,
                }
            }

                jstreeData.push(obj);
            if (line.children){
                line.children.forEach(function (line2) {
                    recurseParents(line2)
                })
            }
        }
        function recurseChildren(line,obj) {

            obj = {
                id: line.id ==1? "#":""+line.id,
                text: line.term,
                data: {
                    related: line.related,
                    label: line.term_label
                },
                children: []
            }




            if (line.children){
                line.children.forEach(function (line2) {
                   obj.children.push(recurseChildren(line2, obj))
                })

            }
            return obj;



        }

        array.forEach(function (line) {
          //  recurseParents(line);
            var obj={}
          obj=  recurseChildren(line,obj);
            jstreeData.push(obj);
        })


    var filePath2 = filePath.replace(".json", ".jstree.json")
    fs.writeFileSync(filePath2, JSON.stringify(jstreeData,null,2))


//   data= data.replace("/parent_id/g","parent")
//    data= data.replace("/term/g","text")


var jsTreeStr = data;

//


}


}

transformThesaurusIngenieur.toJstree();

module.exports = transformThesaurusIngenieur