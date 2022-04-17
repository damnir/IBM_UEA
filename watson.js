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
            queryResponse["_id"] = "a_"+Date.now()
            queryResponse["query_type"] = "all"

            // queryResponse['summary'] = summarise(queryResponse)
            summarise(queryResponse)

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
    var categories = []

    data['result']['results'].forEach(tweet => {
        
        sentiment.push(tweet['enriched_text']['sentiment']['document']['label'])
        
        tweet['enriched_text']['entities'].forEach(entity => {
            entities.push(entity['text'])
        })

        tweet['enriched_text']['concepts'].forEach(concept => {
            if(concept['relevance'] > 0.7) {
                concepts.push({'label':concept['text'], 'url':concept['dbpedia_resource']})
            }
        })

        categories.push(tweet['enriched_text']['categories'][0]['label'])

    })

    console.log(sentiment)
    console.log(sentiment.length)


    // console.log(entities)
    // console.log(entities.length)

    uniqEntities = [...new Set(entities)]
    // console.log(uniqEntities)

    const counts = [{}];
    entities.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    console.log(counts)
    // console.log(typeof(count))
    // console.log(counts['IBM'])

    var top_entities = []

    uniqEntities.forEach(entity => {
        if (counts[entity] > 1) {
            // console.log(entity + " " + counts[entity])
            top_entities.push({'label':entity, 'count':counts[entity]})
        }
    })

    // console.log(top_entities)

    // counts.forEach(count => {
    //     if (count > 1) {
    //         console.log(count)
    //     }
    // })

    // console.log(concepts)
    // console.log(concepts.length)
    uniqConcepts = [...new Set(concepts)]
    // console.log(uniqConcepts.length)

    // // console.log(categories)
    // // console.log(categories.length)
    uniqCategories = [...new Set(categories)]
    // console.log(uniqCategories)


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