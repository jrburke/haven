# Haven

Haven is an experiment in running JS-based extensions in Node against Raindrop's CouchDB. It listens for Raindrop document changes via the changes feed in CouchDB, then runs an extension if there is matching extension that can handle the schema in the document.

Right now the only extension is mine/ext/bodyFrom.js that emits a schema that just has the rd.msg.body's from property.

This is very rough (no comments, not robust code), and woefully incompetent compared to Raindrop's existing extension mechanism. This is just a toy, to explore Node, JS extensions and Raindrop/CouchDB. And of course it uses RequireJS for the JS module loading. :)

Do not ask for help if you hit trouble running this code. This is pre-alpha, and I would be surprised if it worked anywhere else except on my computer.

## Prerequisites

* [Node](http://nodejs.org/)
* [Raindrop](https://wiki.mozilla.org/Raindrop/Install)

## How to run it

Make sure the raindrop db exists in couch. It assumes the standard install location.

In the haven directory, run:

    node r.js mine.js

In Raindrop, do a normal sync-messages command:

    run-raindrop.py sync-messages --max-age=2days

Or something like that. If there are any new rd.msg.body schemas generated, you will see some output on the command line. It saves rd.msg.body.from schemas back to the Raindrop DB. You can view them by going here:

http://127.0.0.1:5984/raindrop/extender/schema.html#rd.msg.body.from

mine.js data-mines the message haven (Raindrop DB).  I want a pull.js or fetch.js to fetch messages from message services into the haven.
