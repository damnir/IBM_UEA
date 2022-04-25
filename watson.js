const DiscoveryV1 = require('ibm-watson/discovery/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const fs = require('fs')

var response = ""
var extra = ""

const fileName = './data/watson_api.json';
const file = require(fileName);

var express = require('express');
var router = express.Router();
var body_parser = require("body-parser")

//api setup
const discovery = new DiscoveryV1({
    version: '2020-08-27',
    authenticator: new IamAuthenticator({
        apikey: 'WRmR6bhNJ16Eh9HRPJ_Jbx1-Cr2H6I1SfiC-msYIUyJd',
    }),
    serviceUrl: 'https://api.eu-gb.discovery.watson.cloud.ibm.com/instances/57273055-1496-469a-8c45-5fdf421f711b',
});

//env id for the archive collection
const listCollectionsParams = {
    environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
};

//post new NL query
router.post("/new_query/:query", async (req, res) => {

    //for client visual request render view
    if (req.params.query === "q") {
        res.render("query_result", {
            query: response,
            id: req.body.query
        })
    } // else just send the response
    else {
        response = await nl_query(req.params.query)

        res.send({
            message: response
        })
    }

})

//get NL query
router.get("/new_query/:query", async (req, res) => {
    console.log(req.body.query)

    res.render("query_result", {
        query: response,
        id: req.params.query
    })

})

//returns the whole dynamic collection
async function query(extra) {
    var data
    queryParams = {
        environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
        collectionId: file.collectionid,
        count: '50'
    };

    await discovery.query(queryParams)
        .then(async queryResponse => {
            queryResponse["_id"] = "a_" + Date.now()
            queryResponse["query_type"] = "all"
            queryResponse["info"] = extra
            //add summary to the report
            queryResponse['summary'] = summarise(queryResponse)

            response = JSON.stringify(queryResponse, null, 2)

            //change the local latest query response, also add to db later
            fs.writeFile('./data/watson_response.json', response, err => {
                if (err) {
                    console.error(err)
                    return
                }
            })
            data = response
        })
        .catch(err => {
            console.log('error:', err);
        });
    return data

}

//add record to the db
function pushToDb(data) {
    var db = require('./dbclient')
    db.pushNewWatson(JSON.parse(data))
    return JSON.parse(data)._id

}

//NL discovery query api call
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

//really ugly function for summarising the query, self explanatory
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
    sentiment = { 'positive': counts['positive'], 'neutral': counts['neutral'], 'negative': counts['negative'] }
    console.log(sentiment)

    return { 'concepts': top_concepts, 'entities': top_entities, 'categories': top_categories, 'sentiment': sentiment }
}

//get doc ids for the latest query
function get_docs_id() {
    var data = []
    try {
        data = fs.readFileSync('data/query_result.txt', 'utf8')
        data = data.replace(/^\s+|\s+$/g, '');
    } catch (err) {
        console.error(err)
        return
    }

    return data.split('\n')
}

//add documents and process them
async function add_documents() {

    data = get_docs_id()

    //load in the latest query results
    data.forEach(val => {
        var addDocumentParams = {
            environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
            collectionId: file.collectionid,
            file: fs.createReadStream('./data/query_result/' + val + '.json')
        }

        addRequest(addDocumentParams)
    })

    //add the documents
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

    //wait until the processing is finished
    async function waitf() {
        var stop = false
        while (!stop) {
            await sleep(1500)
            if (await check_status() === true) {
                stop = true
                return true
            }
        }
    }

    await waitf()
    return true
}

//check status of the collection (ie number of documents being processed etc)
async function check_status() {

    var finished = false

    var getCollectionParams = {
        environmentId: file.envid,
        collectionId: file.collectionid
    }

    //only return true if it checks out that the processing is finished
    try {
        await discovery.getCollection(getCollectionParams)
            .then(collection => {
                console.log(collection['result']['document_counts'])
                if (collection['result']['document_counts']['processing'] == 0 &&
                    collection['result']['document_counts']['pending'] == 0) {

                    finished = true
                }
            })
            .catch(err => {
                console.log('error:', err);
            })
    } finally {
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
        //delete collection
        await discovery.deleteCollection(deleteCollectionParams)
            .then(async deleteCollectionResponse => {
                console.log(JSON.stringify(deleteCollectionResponse, null, 2));
                await createNewCollection(createCollectionParams)
            })
            .catch(err => {
                console.log('error:', err);
            });
        //make a fresh collection
        async function createNewCollection(params) {
            await discovery.createCollection(params)
                .then(collection => {
                    console.log(JSON.stringify(collection, null, 2));

                    file.collectionid = collection.result.collection_id

                    //write the new collection ID to the API doc
                    fs.writeFile(fileName, JSON.stringify(file, null, 2), function writeJSON(err) {
                        if (err) return console.log(err);
                        console.log(JSON.stringify(file));
                        console.log('writing to ' + fileName);
                    });
                    success = true
                })
                .catch(err => {
                    console.log('error:', err);
                });
        }
    }
    finally {
        return success
    }
}

//The whole process
async function new_request(params) {
    extra = params

    await refresh_collection()
    await add_documents()
    data = await query(extra)
    id = await pushToDb(data)


    console.log(id)
    return id
}

module.exports = {
    router, query, refresh_collection, add_documents, check_status, new_request
}