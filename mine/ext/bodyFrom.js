'use strict';
/*global require: false */

require.def('mine/ext/bodyFrom',
['require', 'sys'],
function (require, sys) {
    return {
        schemas: ['rd.msg.body'],
        main: function (emitSchema, doc) {
            emitSchema('rd.msg.body.from', {
                from: doc.from
            });
        }
    };
});
