requirejs.config({
    // Shim is for non-AMD-compliant modules.
    shim: {
        'libs/backbone': {
            deps: ['libs/underscore', 'libs/jquery'],
            exports: 'Backbone'
        },
        '../socket.io/socket.io': {
            exports: 'io'
        },
        'libs/asevented': {
            exports: 'asEvented'
        }
    }
});



// Start the main app logic.
require([
    'libs/jquery',
    'game'
], function (
    $,
    Game
) {
    $(function() {
    	new Game();
    });
});
