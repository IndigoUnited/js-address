/*jshint node:true, strict:false, onevar:false*/

if (!(typeof window !== 'undefined' && window.navigator && window.document)) { // Test if we are at command line
    var fs           = require('fs');
    var cp           = require('child_process');
    var createServer = require('http-server').createServer;

    // Start an HTTP Server to serve the files
    // This is needed because some tests fail intentionally in the file protocol

    var server = createServer({ root: __dirname + '/../' });
    server.listen(8081, '0.0.0.0', function () {
        var phantomjsBin = __dirname + '/../node_modules/.bin/phantomjs';
        var command = phantomjsBin + ' ' + __dirname + '/../node_modules/mocha-phantomjs/lib/mocha-phantomjs.coffee ' + 'http://localhost:8081/test/tester.html';
        var tests;

        fs.stat(phantomjsBin, function (error) {
            if (error) {
                phantomjsBin = 'phantomjs';
            }

            if (process.platform === 'win32') {
                tests = cp.spawn('cmd', ['/s', '/c', command], { customFds: [0, 1, 2] });
            } else {
                tests = cp.spawn('sh', ['-c', command], { customFds: [0, 1, 2] });
            }
            tests.on('exit', function (code) {
                process.exit(code ? 1 : 0);
            });
        });
    });

} else {
    var paths = {
        'amd-utils': '../components/amd-utils/src',
        'dejavu': '../components/dejavu/dist/amd/strict',
        'events-emitter': '../components/events-emitter/src',
        'base-adapter': '../components/base-adapter/src/adapters/jquery',
        'base-adapter/src': '../components/base-adapter/src',              // This is needed in order to access the triggerEvent utility for the tests..
        'jquery': '../node_modules/base-adapter-libs/jquery/jquery',
        'has': '../components/has/has',
        'src': '../src'
    },
        map = {
            'base-adapter': {
                'base-adapter/src': '../components/base-adapter/src'
            }
        };

    require({
        baseUrl: './',
        paths: paths,
        map: map,
        waitSeconds: (window.location.protocol === 'file:' || window.location.href.indexOf('://localhost') !== -1) ? 5 : 45, // Fail early locally
        urlArgs: 'bust=' + (+new Date())
    });

    define(['base-adapter/dom/Utilities', 'has'], function (Utilities, has) {

        has.add('debug', !window.mochaPhantomJS);

        Utilities.ready(function () {
            require(['specs/basic'], function () {
                if (window.mochaPhantomJS) {
                    mochaPhantomJS.run();
                } else {
                    mocha.run();
                }
            });
        });
    });
}