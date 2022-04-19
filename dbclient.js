var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
const fs = require('fs')


const client = new MongoClient(url);

function createCollection() {
    var dbo = db.db("mydb");
    dbo.createCollection("watson_response", function (err, res) {
        if (err) throw err;
        console.log("Collection created!");
        db.close();
    });
}

function pushNewWatson(data, collection) {
    MongoClient.connect(url, function (err, db) {

        if (err) throw err;

        var dbo = db.db("mydb");
        dbo.collection("watson_response").insertOne(data, function (err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });

    });
}

async function query_id(id, collection) {

    var res

    try {
        await client.connect();
        const database = client.db("mydb");
        const movies = database.collection(collection);
        // Query for a movie that has the title 'The Room'
        const query = { _id: id };

        res = await movies.findOne(query)
        // since this method returns the matched document, not a cursor, print it directly
        //   console.log(movie.accounts);


    } finally {
        await client.close();
        console.log(res['accounts'])
        return res['accounts']

    }
}

async function query_all() {

    var res
    var docs = []

    try {
        await client.connect();
        const database = client.db("mydb");
        const data = database.collection("watson_response");
        // Query for a movie that has the title 'The Room'
        const query = { query_type: "all" };

        res = await data.find(query)

        await res.forEach(doc => {
            docs.push(doc)
        })
        // since this method returns the matched document, not a cursor, print it directly
        //   console.log(movie.accounts);


    } finally {
        // console.log(docs[0]['result']['results'])
        await client.close();
        return docs
        // return res['accounts']

    }
}

async function query_one(id) {

    console.log(id)
    var res

    try {
        await client.connect();
        const database = client.db("mydb");
        const movies = database.collection("watson_response");
        // Query for a movie that has the title 'The Room'
        const query = { _id: id['id'] };

        res = await movies.findOne(query)
        // since this method returns the matched document, not a cursor, print it directly
        //   console.log(movie.accounts);


    } finally {
        await client.close();
        // console.log(res['accounts'])
        return res

    }
}







module.exports = {
    createCollection, pushNewWatson, query_id, query_all, query_one
}

// query_all()

// pushNewWatso/n("moo: goo")
// test()
// console.log(query_id("all_accounts", "data"))
