var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

var dbclient




function createCollection() {
    var dbo = db.db("mydb");
    dbo.createCollection("watson_response", function (err, res) {
        if (err) throw err;
        console.log("Collection created!");
        db.close();
    });
}

function pushNewWatson(data) {
    MongoClient.connect(url, function (err, db) {

        if (err) throw err;

        var dbo = db.db("mydb");
        dbo.collection("watson_response").insertOne(data, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
          });

        // db.close();
    });
}

module.exports = {
    createCollection,  pushNewWatson
}

// pushNewWatso/n("moo: goo")