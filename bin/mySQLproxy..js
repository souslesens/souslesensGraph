var mysql = require('mysql');
//var nodeMaria = require('node-mariadb');
var mySqlConnectionOptions=require('./serverParams.js').mysqlConnections;



var connections = {};
var mySQLproxy = {
    getConnection: function (connOptions, callback) {
        if(!connOptions)
            connOptions=mySqlConnectionOptions;
        if( connOptions.name)
            connOptions=mySqlConnectionOptions[connOptions.name];
        var connectionKey = connOptions.host + ';' + connOptions.database;
        if (!connections[connectionKey]) {
            var connection = mysql.createConnection(connOptions);

            connection.connect(function (err) {
                if (err)
                    return callback(err);
                console.log("Connected!");
                connections[connectionKey] = connection;
                callback(null, connection);
            });
        }
        else
            callback(null, connections[connectionKey]);
    },


    exec: function (connection, sql, callback) {




        mySQLproxy.getConnection(connection, function (err, conn) {
            if (err)
                return callback(err);

            conn.query(sql, function (err, result) {
                if (err)
                    return callback(err);
                return callback(null, result);
            });
        });

    },

    datamodel:function(connection,callback){
        var excludedTables=["users","r_versement_magasin"]
        mySQLproxy.getConnection(connection, function (err, conn) {
            if (err)
                return callback(err);
            var sql="SELECT * FROM information_schema.columns where table_schema=\"bailletarchives\""
            conn.query(sql, function (err, result) {
                if (err)
                    return callback(err);


                var model={};
                result.forEach(function(line){
                    if(line.TABLE_NAME.indexOf("r_")==0 || excludedTables.indexOf(line.TABLE_NAME)>-1)//relation
                        ;
                    else {
                        if (!model[line.TABLE_NAME])
                            model[line.TABLE_NAME] = [];

                        model[line.TABLE_NAME].push({
                            name: line.COLUMN_NAME,
                            columnType: line.COLUMN_TYPE,
                            dataType: line.DATA_TYPE,
                            nullable: line.IS_NULLABLE,
                            defaultValue: line.COLUMN_DEFAULT,
                            maxLength: line.CHARACTER_MAXIMUM_LENGTH
                        })
                    }
                })

                return callback(null, model);
            });
        });











    }





}

if(false) {
    mySQLproxy.exec({name: "phototheque"}, "select * from listes", function (err, result) {
        var x = err;
    })
}


module.exports = mySQLproxy;





