const DiscoveryV1 = require('ibm-watson/discovery/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const fs = require('fs')

var response = ""
var collectionId = ""
var extra = ""

const fileName = './data/watson_api.json';
const file = require(fileName);

var express = require('express');
var router = express.Router();
var body_parser = require("body-parser")


// router.use(function timeLog(req, res, next) {
//     console.log('Time: ', Date.now());
//     next();
//   });

const discovery = new DiscoveryV1({
    version: '2020-08-27',
    authenticator: new IamAuthenticator({
        apikey: 'WRmR6bhNJ16Eh9HRPJ_Jbx1-Cr2H6I1SfiC-msYIUyJd',
    }),
    serviceUrl: 'https://api.eu-gb.discovery.watson.cloud.ibm.com/instances/57273055-1496-469a-8c45-5fdf421f711b',
});

const listCollectionsParams = {
    environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
};

//tweet test 2
var queryParams = {
    environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
    collectionId: file.collectionid,
    count: '25'
};

async function query(extra) {
    var data
    queryParams = {
        environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
        collectionId: file.collectionid,
        // naturalLanguageQuery: "covid",
        count: '50'
    };
    await discovery.query(queryParams)
        .then(async queryResponse => {
            queryResponse["_id"] = "a_" + Date.now()
            queryResponse["query_type"] = "all"
            queryResponse["info"] = extra

            // queryResponse['summary'] = summarise(queryResponse)
            queryResponse['summary'] = summarise(queryResponse)

            response = JSON.stringify(queryResponse, null, 2)
            // console.log(response);

            fs.writeFile('./data/watson_response.json', response, err => {
                if (err) {
                    console.error(err)
                    return
                }
                //file written successfully
            })


            // db.pushNewWatson(JSON.parse(response))
            // pushToDb(response)
            data = response
        })
        .catch(err => {
            console.log('error:', err);
        });
    return data

}

function pushToDb(data) {
    var db = require('./dbclient')
    db.pushNewWatson(JSON.parse(data))
    return JSON.parse(data)._id

}

async function nl_query(query) {
    queryParams = {
        environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
        collectionId: "d0782dc7-7d15-4471-b7e2-72bdbee4e5e9",
        naturalLanguageQuery: query,
        count: 25

    };
    try {
        await discovery.query(queryParams)
            .then(async queryResponse => {
                // response = JSON.stringify(queryResponse, null, 2)
                // console.log(response);
                response = queryResponse
                return queryResponse
            })
            .catch(err => {
                console.log('error:', err);
            });
    }
    finally {
        return response
    }
}

router.post("/new_query/:query", async (req, res) => {

    if (req.params.query === "q") {
        res.render("query_result", {
            query: response,
            id: req.body.poo
        })
    }
    else {

        console.log(req.params.query)
        response = await nl_query(req.params.query)

        res.send({
            message: response
        })
    }

})

router.get("/new_query/:query", async (req, res) => {
    console.log(req.body.poo)
    // response = await nl_query(req.params.query)

    res.render("query_result", {
        query: response,
        id: req.params.query
    })

    // req.body.forEach(obj => {
    //     console.log(obj)
    // })

    // console.log(response)
    console.log("ID" + req.body.poo)

})

function summarise(data) {

    var no_results = data['result']['matching_results']
    var sentiment = []
    var entities = []
    var concepts = []
    var categories = ""

    data['result']['results'].forEach(tweet => {

        sentiment.push(tweet['enriched_text']['sentiment']['document']['label'])

        tweet['enriched_text']['entities'].forEach(entity => {
            entities.push(entity['text'])
        })

        tweet['enriched_text']['concepts'].forEach(concept => {
            concepts.push(concept['text'])
        })

        tweet['enriched_text']['categories'].forEach(category => {
            categories += category['label']
        })
    })

    uniqEntities = [...new Set(entities)]

    var counts = [{}];
    entities.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    var top_entities = []

    uniqEntities.forEach(entity => {
        top_entities.push([entity, counts[entity] * 10])
    })

    uniqConcepts = [...new Set(concepts)]
    counts = [{}];
    concepts.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });

    var top_concepts = []

    uniqConcepts.forEach(concept => {
        top_concepts.push([concept, counts[concept] * 10])
    })

    categories = categories.split('/')
    uniqCategories = [...new Set(categories)]

    counts = [{}];
    categories.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    var top_categories = []

    uniqCategories.forEach(category => {
        top_categories.push([category, counts[category] * 10])
    })

    top_categories.sort(function (a, b) {
        return b[1] - a[1];
    });


    counts = [];
    sentiment.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    // f_sentiment = []
    // counts.forEach(element => f_sentiment.push([element]))
    // counts.forEach(element => console.log(element))
    // console.log(counts)
    sentiment = { 'positive': counts['positive'], 'neutral': counts['neutral'], 'negative': counts['negative'] }
    console.log(sentiment)


    return { 'concepts': top_concepts, 'entities': top_entities, 'categories': top_categories, 'sentiment': sentiment }
}

function get_docs_id() {
    var data = []
    try {

        data = fs.readFileSync('data/query_result.txt', 'utf8')

        data = data.replace(/^\s+|\s+$/g, '');

        // fs.unlink("data/query_result.txt", () => {})
        console.log(data)
        console.log(typeof (data))
    } catch (err) {
        console.error(err)
        return
    }

    return data.split('\n')
}

async function add_documents() {

    data = get_docs_id()

    data.forEach(val => {
        var addDocumentParams = {
            environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
            collectionId: file.collectionid,
            file: fs.createReadStream('./data/query_result/' + val + '.json')
        }

        addRequest(addDocumentParams)
    })

    async function addRequest(params) {
        await discovery.addDocument(params)
            .then(async documentAccepted => {
                const resnponse = documentAccepted.result;
                console.log(JSON.stringify(resnponse, null, 2));
            })
            .catch(err => {
                console.log('error:', err);
            })
    }

    async function test() {
        var stop = false
        while (!stop) {
            await sleep(1500)
            if (await check_status() === true) {
                stop = true
                return true
            }
        }
        // query()
    }

    await test()
    return true
}

async function check_status() {

    var finished = false

    var getCollectionParams = {
        environmentId: file.envid,
        collectionId: file.collectionid
    }

    try {
        await discovery.getCollection(getCollectionParams)
            .then(collection => {
                console.log(collection['result']['document_counts'])
                if (collection['result']['document_counts']['processing'] == 0 &&
                    collection['result']['document_counts']['pending'] == 0) {
                    // console.log(true)
                    finished = true
                }

            })
            .catch(err => {
                console.log('error:', err);
            })
    } finally {
        // console.log(res['accounts'])

        return finished

    }

}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function refresh_collection() {

    success = false

    var deleteCollectionParams = {
        environmentId: file.envid,
        collectionId: file.collectionid
    }

    var createCollectionParams = {
        environmentId: file.envid,
        name: 'tweet_analysis',
        language: 'en',
    };

    try {

        await discovery.deleteCollection(deleteCollectionParams)
            .then(async deleteCollectionResponse => {
                console.log(JSON.stringify(deleteCollectionResponse, null, 2));
                await createNewCollection(createCollectionParams)
            })
            .catch(err => {
                console.log('error:', err);
            });

        async function createNewCollection(params) {
            await discovery.createCollection(params)
                .then(collection => {
                    console.log(JSON.stringify(collection, null, 2));

                    file.collectionid = collection.result.collection_id

                    fs.writeFile(fileName, JSON.stringify(file, null, 2), function writeJSON(err) {
                        if (err) return console.log(err);
                        console.log(JSON.stringify(file));
                        console.log('writing to ' + fileName);
                    });

                    // add_documents()
                    success = true

                })
                .catch(err => {
                    console.log('error:', err);
                });
        }
    }
    finally{
        return success
    }
}

async function new_request(params) {
    extra = params

    await refresh_collection()
    await add_documents()
    data = await query(extra)
    id = await pushToDb(data)


    console.log(id)
    return id
    
    // console.log("poopoo::::" + extra + "poopoooo")
}

module.exports = {
    router, query, refresh_collection, add_documents, check_status, new_request
}

function read_result() {

    var data = ""

    try {
        data = fs.readFileSync('data/query_result.txt', 'utf8')
        // fs.unlink("data/query_result.txt", () => {})
        console.log(data)
    } catch (err) {
        console.error(err)
    }

    if (data === "") {
        console.log("poo")
    }

    return data
}

// console.log(read_result())

// add_documents()
// query()
// get_docs_id()
// refresh_collection()
// test()

// test()

// new_request()
// query()
// async function test() {
//     test = await refresh_collection()
//     console.log(test)
// }

// new_request()

// async function test() {
//     test = await add_documents()
//     console.log(test)
// }
// test()