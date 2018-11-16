
var dataTable = function () {


    dataSet = [];
    this.columns = [];
    this.table;
    this.selectedRow;
    self.dateColumns = []
    this.pageLength = 10;
    this.colHeight = 80;



   loadJsonInTable = function (table,containerDiv, json, options) {
        table=null;
        if (!options)
            options = {};

        //dataSet = [];
        this.columns = [];


        dataSet = json
        ;
        var keys = [];
        var sortColumns= [];
        var config={};
        if(config && config.tableDefs && config.tableDefs[table] && config.tableDefs[table].sortFields )
            sortColumns = config.tableDefs[table].sortFields;
        var dataTableSortArray = [];
        json.forEach(function (line, index) {
            for (var key in line) {

                if (keys.indexOf(key) < 0)
                    keys.push(key);
            }
        })
        var columns = [];
        self.dateColumns = [];
        keys.forEach(function (key, index) {
            var type ="string";// mainController.getFieldType(table, key);

            var obj = {data: key, title: key};
            if (type == "date") {
                self.dateColumns.push(index);
            }
            columns.push(obj);

            //sort datatable
            if (sortColumns.length > 0 && sortColumns[0].indexOf(key) > -1) {
                var order = sortColumns[0].indexOf("desc") > -1;
                if (order)
                    order = "desc"
                else
                    order = "asc"

                dataTableSortArray.push([index, order])
            }
        })

        this.columns = columns;

        var htmlStr = "<table style=' z-index:100 ' id='table_" + containerDiv + "'  class='myDatatable cell-border display nowrap'></table>"

        var xxx = $("#" + containerDiv).html();
        $("#" + containerDiv).html(htmlStr);
        $('#' + containerDiv).css("font-size", "10px");
        /*   var height;
           var width;
           if (options.height)
               height = options.height;
           else
               height = $(".dataTableDiv").height() - (mainController.leftPanelWidth + 50);
           if (options.width)
               height = options.width;
           else
               width = $(".dataTableDiv").width() - 280;
           $("#table_" + containerDiv).width("400px").height(height);*/


        /*    if (json.length < this.pageLength)
                height = this.colHeight * json.length;*/

        var dom = '<"top"firptl><"bottom"B><"clear">'
        var dom = '<"top"firptl><"bottom"B><"clear">'

        if (options.dom)
            dom = options.dom;


        var _table = $("#table_" + containerDiv).DataTable({

            "dom": dom,

            buttons: [
                'copy', 'csv', 'print'
                // 'copy', 'csv', 'excel', 'pdf', 'print'
            ],
            data: dataSet,
            columns: columns,
            "order": dataTableSortArray,

            "columnDefs": [
                {//dates
                    "render": function (data, type, row) {
                        var str = "";
                        if (data != null && data != "" && data.indexOf("0000") < 0) {
                            var date = new Date(data);
                            str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
                        }
                        return str;

                    },
                    "targets": self.dateColumns
                }

            ],
            select: {
                style: 'os',
                selector: 'td:first-child'
            },

            pageLength: this.pageLength,
            "pager": true,

            /*    "scrollY": "" + height + "px",
                "scrollX": "" + width + "px",*/
            scrollCollapse: true,

        })
        _table.columns.adjust().draw();
        $("#table_" + containerDiv).css('display', 'block');
        table = _table;

       $("#table_" + containerDiv+" tbody").on('click', 'tr', function (event) {
           if ($(this).hasClass('selected')) {
               $(this).removeClass('selected');
               $("#dataTable tbody tr").css("height", "20px");
           }
           else {
               $('tr.selected').removeClass('selected');
               $(this).addClass('selected');
               var px = event.clientX;
               var py = event.clientY;
               var idx = table.cell('.selected', 0).index();
               // var data = table.row( idx.row ).data();
               var line = dataSet[idx.row];
               currentObject = {id: line.id};

               toutlesensController.dispatchAction("nodeInfos", currentObject.id);
               toutlesensController.showPopupMenu(px, py, "nodeInfo");
           }
       });
      /*  $('#table_' + containerDiv + ' tbody').on('click', 'tr', function (event) {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                $("#table_" + containerDiv + " tbody tr").css("height", "20px");
            }
            else {
                if (!event.ctrlKey)
                    $('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                if (options.onClick) {

                    var px = event.clientX;
                    var py = event.clientY;
                    this.selectedRow = table.row(this);
                    var line = table.row(this).data();
                    options.onClick(line);
                    //
                }


            }

        });*/


    },

        this.updateSelectedRow = function (obj) {
            var rowIndex = this.table.rows('.selected').indexes()[0];
            var table = this.table;
            for (var key in recordController.currentRecordChanges) {
                this.columns.forEach(function (column, colIndex) {
                    if (column.data == key) {
                        table.cell(rowIndex, colIndex).data(recordController.currentRecordChanges[key]).draw();
                    }
                })

                var x = "";

            }


        }

    this.loadNodes = function ( table,containerDiv,query,options) {
        if (!options)
            options = {};
        toutlesensData.cachedResultArray = null;
        self.dataSet = [];
        self.columns = [];

        var payload = {
            match: query
            // match: "MATCH path=(n)-[r]->(m) "+ self.getCurrentWhereClause() + "return count(r) as countRel;"
        }


        $.ajax({
            type: "POST",
            url: advancedSearch.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (json, textStatus, jqXHR) {
                var tableJson=[]
                json.forEach(function (line, index) {
                    delete line.n.properties.subGraph;
                    line.n.properties.id=line.n._id
                    tableJson.push(line.n.properties)
                })
                loadJsonInTable (table,containerDiv, tableJson, options) ;
            },
            error: function (err) {
                console.log(err);
            }
        })
    }


}



