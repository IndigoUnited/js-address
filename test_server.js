/*jshint node:true*/

'use strict';

var createServer = require('http-server').createServer;

// Start an HTTP Server to serve the files
// This is needed because some tests fail intentionally in the file protocol
var server = createServer({ root: __dirname });

server.listen(8081, '0.0.0.0', function () {
    console.log('Please open http://localhost:8081/test/tester.html to run the tests in your browser');
});