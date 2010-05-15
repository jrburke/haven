'use strict';
/*jslint plusplus: false */
/*global require: false */

require.def('mine/extender',
['require', 'fs', 'sys', 'node-couchdb/lib/couchdb', 'base64'],
function (require, fs, sys, couchdb, base64) {

    var jsRegExp = /\.js$/,
        extensions = {},
        client = couchdb.createClient(5984, '127.0.0.1'),
        db = client.db('raindrop'),
        sourceDoc, extensionId, extender,
        ostring = Object.prototype.toString;

    function isArray(it) {
        return ostring.call(it) === "[object Array]";
    }

    function createDocId(item) {
        //WARNING: any array value for rd_key[1] needs to have
        //a space between array items in the stringified version.
        //Otherwise things will break on the backend. Eventually,
        //only the server should assign these IDs.
        var part2 = item.rd_key[1], i, temp = "", piece;
        if (isArray(part2)) {
            for (i = 0; i < part2.length; i++) {
                piece = part2[i];
                temp += (i !== 0 ? ', ' : '') + JSON.stringify(piece);
            }
            part2 = '[' + temp + ']';
        } else {
            part2 = JSON.stringify(part2);
        }

        return "rc!" +
               item.rd_key[0] +
               "." +
               base64.encode(part2) +
               "!" +
               item.rd_schema_id;
    }

    function emitSchema(schemaId, props) {
        sys.puts('EMIT SCHEMA: ' + schemaId + ' with props: ' + JSON.stringify(props));

        var doc = props, id;
        if (!doc.rd_key) {
            doc.rd_key = sourceDoc.rd_key;   
        }
        doc.rd_schema_id = schemaId;

        //TODO: make sure to do this right for confidence extensions.
        doc.rd_schema_items = {};
        doc.rd_schema_items[extensionId] = {
            rd_source: null,
            schema: null
        };

        id = createDocId(doc);

        db.saveDoc(id, doc, function (err, ok) {
            if (err) {
                throw new Error('Saving doc ID: ' + id + ': ' + JSON.stringify(err));
            }
            sys.puts('Saved doc ID: ' + id);
        });
    }

    extender = {
        load: function (extPath, callback) {
            //read all the files in the extension directory
            sys.puts('Reading this directory for extensions: ' + extPath);
            fs.readdir(extPath, function (err, fileNames) {
                var exts = [];

                //Only allow extensions that end in .js
                fileNames.forEach(function (fileName) {
                    if (jsRegExp.test(fileName)) {
                        exts.push('mine/ext/' + fileName.substring(0, fileName.length - 3));
                    }
                });
                if (!exts.length) {
                    throw new Error('No extensions!');
                }

                //Load all the extensions and signal that extender is ready.
                require(exts, function () {
                    var i, j, ext, extTypeList, schema;
                    for (i = 0; i < arguments.length; i++) {
                        //Protect against extensions that actually do
                        //not define themselves correctly.
                        ext = arguments[i];
                        if (!ext || !ext.schemas || !ext.schemas.length) {
                            sys.puts('Skipping extension ' + exts[i] +
                                     (ext ? ' missing module definition' : ' missing "schemas" property'));
                            continue;
                        }

                        //Allow an extension to handle multiple schemas,
                        //but right now only gets one schema doc at at time,
                        //it does not get all related schemas for every changed
                        //schemas.
                        for (j = 0; (schema = ext.schemas[j]); j++) {
                            extTypeList = extensions[schema] || (extensions[schema] = []);
                            extTypeList.push({
                                id: exts[i],
                                main: ext.main
                            });
                        }
                    }

                    //All finished, do the callback, passing the extender.
                    callback(extender);
                });
            });
        },

        onNewDoc: function (item) {
            var doc = item.doc, schema, exts;

            if (!doc) {
                throw new Error(JSON.stringify(item));
            }

            schema = doc.rd_schema_id;
            exts = extensions[schema];
            if (!schema || !exts) {
                return;
            }

            //Call the extensions registered for the schema types.
            exts.forEach(function (ext) {
                try {
                    sourceDoc = doc;
                    extensionId = ext.id;
                    ext.main(emitSchema, doc);
                } catch (e) {
                    sys.puts('Extension ' + ext.id + ' had error: ' + e);
                }
            });
        }
    };

    return extender;
});
