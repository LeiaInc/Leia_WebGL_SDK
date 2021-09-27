var express = require('express');
var app = express();
app.use(express.static(__dirname + '/dist'));
app.listen(3000);
console.log('open 127.0.0.1:3000 in your browser');
