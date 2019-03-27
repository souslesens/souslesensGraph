
var jsonFileStorage=require('./jsonFileStorage.js');
var path=require('path');
var logger=require("./logger..js");
var authentication={



    authentify:function(login,password,callback){
        jsonFileStorage.retrieve(path.resolve(__dirname,"../config/users/users.json"), function(err,users){
            if(err) {
                logger.error(login+" connected")
                return callback(err);
            }
            if(users[login] && users[login].password==password) {
              //  logger.log({level:'info',message:login+" connected"})
                logger.info(login+" connected")
                callback(null, users[login].groups);
            }else {
                logger.info(login+" rejected")
                callback(null, false);
            }


        })




    },
    enrole:function(){

    }




}
/*authentication.authentify("Claude","CF1",function (err,result){
    var x=result;
})*/

module.exports=authentication;