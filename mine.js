
'use strict';
/*global require: false, setTimeout: false */

require({
        baseUrl: 'jslib/',
        paths: {
            'mine': '../mine'
        }
    },
    ['require', 'sys', 'http', 'listener', 'mine/extender'],
    function (require, sys, http, listener, extender) {

        //Load extensions
        extender.load(require.nameToUrl('mine/ext', '/'), function (extender) {

            //Set up listening for changes to couchdb
            var changes = new listener.Changes('http://127.0.0.1:5984/raindrop/_changes');
            changes.addListener('change', function (obj) {
                extender.onNewDoc(obj);
            });

            //Start up command server
            http.createServer(function (req, res) {
                setTimeout(function () {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('Hello World\n');
                }, 2000);
            }).listen(8000);
            sys.puts('Server running at http://127.0.0.1:8000/');            
        });
    }
);
