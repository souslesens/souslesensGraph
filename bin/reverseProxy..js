var proxy = require('express-http-proxy');
var app = require('express')();




var blogProxy = proxy('localhost:3002', {
    forwardPath: function (req, res) {
        return require('url').parse(req.url).path;
    }
});



app.use("/blog/*", blogProxy);