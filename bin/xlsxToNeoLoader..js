var multer = require('multer');
var xlsxToNeo=require('../bin/transform/xlsxToNeo..js')

var xlsxToNeoLoader={

    processForm:  function (req,callbackOuter) {
var xlsxBuffer;
var mappingsStr;
            var storage =  multer.memoryStorage();
            var    uploadMaxSize=100*1000*1000; //100M;
            var upload = multer({
                storage: storage,
                limits: {fileSize: uploadMaxSize}
            }).any();
            upload(req, null, function (err, data) {
                if (err) {
                    if (callback)
                        callback('Error Occured' + err);
                    return;
                }
                req.files.forEach(function(file){
                    if(file.fieldname=="xlsx"){
                        xlsxBuffer=file.buffer

                    }
                    if(file.fieldname=="mappings"){
                        mappingsStr=""+file.buffer

                    }


                })
                var subGraph=req.body.subGraph;

                xlsxToNeo.toNeo(subGraph,xlsxBuffer,mappingsStr, null, function(err,result){

                    callbackOuter(err,result);


                });


            })
    },





}

module.exports=xlsxToNeoLoader;