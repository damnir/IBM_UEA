const DiscoveryV1 = require('ibm-watson/discovery/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const fs = require('fs')

var response = ""
var collectionId = ""

const fileName = './data/watson_api.json';
const file = require(fileName);

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
const queryParams = {
    environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
    collectionId: file.collectionid,
    count: '25'
};

function query() {
    var db = require('./dbclient')
    discovery.query(queryParams)
        .then(queryResponse => {
            queryResponse["_id"] = "a_" + Date.now()
            queryResponse["query_type"] = "all"

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


            db.pushNewWatson(JSON.parse(response))
        })
        .catch(err => {
            console.log('error:', err);
        });

}

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
    sentiment = {'positive':counts['positive'], 'neutral':counts['neutral'], 'negative':counts['negative']}
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

function add_documents() {

    data = get_docs_id()

    data.forEach(val => {
        var addDocumentParams = {
            environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
            collectionId: file.collectionid,
            file: fs.createReadStream('./data/query_result/' + val + '.json')
        }

        addRequest(addDocumentParams)
    })

    function addRequest(params) {
        discovery.addDocument(params)
            .then(documentAccepted => {
                const resnponse = documentAccepted.result;
                console.log(JSON.stringify(resnponse, null, 2));
            })
            .catch(err => {
                console.log('error:', err);
            })
    }
}

function check_status() {

    var finished = false

    var getCollectionParams = {
        environmentId: file.envid,
        collectionId: file.collectionid
    }

    discovery.getCollection(getCollectionParams)
        .then(collection => {
            console.log(collection['result']['document_counts'])
            if (collection['result']['document_counts']['processing'] == 0 &&
                collection['result']['document_counts']['pending'] == 0) {
                finished = true
            }
            // console.log(JSON.stringify(collection, null, 2));
        })
        .catch(err => {
            console.log('error:', err);
        })

    return finished
}

function refresh_collection() {

    var deleteCollectionParams = {
        environmentId: file.envid,
        collectionId: file.collectionid
    }

    var createCollectionParams = {
        environmentId: file.envid,
        name: 'tweet_analysis',
        language: 'en',
    };

    discovery.deleteCollection(deleteCollectionParams)
        .then(deleteCollectionResponse => {
            console.log(JSON.stringify(deleteCollectionResponse, null, 2));
            createNewCollection(createCollectionParams)
        })
        .catch(err => {
            console.log('error:', err);
        });

    function createNewCollection(params) {
        discovery.createCollection(params)
            .then(collection => {
                console.log(JSON.stringify(collection, null, 2));

                file.collectionid = collection.result.collection_id

                fs.writeFile(fileName, JSON.stringify(file, null, 2), function writeJSON(err) {
                    if (err) return console.log(err);
                    console.log(JSON.stringify(file));
                    console.log('writing to ' + fileName);
                });

                add_documents()

            })
            .catch(err => {
                console.log('error:', err);
            });
    }
}

module.exports = {
    query, refresh_collection, add_documents, check_status
}

// add_documents()
// query()
// get_docs_id()
// check_status()
// refresh_collection()