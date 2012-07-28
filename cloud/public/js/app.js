requirejs.config({
    
    
    //By default load any module IDs from js/libs
    baseUrl: 'js/libs',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        app: '../app'
    },
    
    
    
    // Shim is for non-AMD-compliant modules.
    shim: {
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
//        '/socket.io/socket.io': {
//            exports: 'io'
//        },
        'asevented': {
            exports: 'asEvented'
        }
    }
});



// Start the main app logic.
require([
    'jquery',
    'app/game'
], function (
    $,
    Game
) {
    $(function() {
    	new Game();
    });
});
