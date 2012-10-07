var paths = {
    'amd-utils': '../components/amd-utils/src',
    'dejavu': '../components/dejavu/dist/amd/strict',
    'events-emitter': '../components/events-emitter/src',
    'base-adapter': '../components/base-adapter/src/adapters/jquery',
    'base-adapter/src': '../components/base-adapter/src',              // This is needed in order to access the triggerEvent utility for the tests..
    'domReady': '../node_modules/domReady/domReady',
    'jquery': '../node_modules/base-adapter-libs/jquery/jquery',
    'src': '../src'
},
    map = {
        'base-adapter': {
            'base-adapter/src': '../components/base-adapter/src'
        }
    };

if (!(typeof window !== 'undefined' && window.navigator && window.document)) { // Test if we are at command line
    console.info('Address can\'t be tested using the command line (maybe later with PhantomJS)');
    console.info('Use the browser instead.');

    process.exit();
} else {
    global = window;
    global.expect = expect;
    global.browser = true;

    require({
        baseUrl: './',
        paths: paths,
        map: map,
        waitSeconds: (window.location.protocol === 'file:' || window.location.href.indexOf('://localhost') !== -1) ? 5 : 45, // Fail early locally
        urlArgs: 'bust=' + (+new Date())
    });
}

global.evaluated = true;