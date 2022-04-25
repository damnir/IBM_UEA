var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017/";
const fs = require('fs')
const axios = require('axios')


const client = new MongoClient(url);

function createCollection() {
    var dbo = db.db("mydb");
    dbo.createCollection("watson_response", function (err, res) {
        if (err) throw err;
        console.log("Collection created!");
        db.close();
    });
}

async function pushNewWatson(data, collection) {
    var doc
    try {
        await MongoClient.connect(url, async function (err, db) {

            if (err) throw err;

            var dbo = db.db("mydb");
            await dbo.collection("watson_response").insertOne(data, async function (err, res) {
                if (err) throw err;
                // console.log("1 document inserted");
                db.close();

            });

        });
    } finally {
        return data._id

    }
}

async function delete_one(id, collection) {
    var deleted = true

    await MongoClient.connect(url, async function (err, db) {

        if (err) throw err;
        deleted = true

        var dbo = db.db("mydb");
        await dbo.collection("watson_response").deleteOne(
            { _id: id }, function (err, res) {

                // console.log("doc with id " + id + "deleted");
                if (err) {
                    deleted = false
                } 
                db.close();
            });
    });
    return deleted

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


    } finally {
        await client.close();
        return docs
    }
}

async function query_one(id) {

    console.log(id)
    var res

    try {
        await client.connect();
        const database = client.db("mydb");
        const movies = database.collection("watson_response");
        const query = { _id: id['id'] };

        res = await movies.findOne(query)

    } finally {
        await client.close();
        return res

    }
}


module.exports = {
    createCollection, pushNewWatson, query_id, query_all, query_one, delete_one
}
