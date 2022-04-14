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
    collectionId: 'e86e2de7-65f6-41fb-a627-d98d47f629dc',
    count: '25'
};

function query() {
    var db = require('./dbclient')
    discovery.query(queryParams)
        .then(queryResponse => {
            response = JSON.stringify(queryResponse, null, 2)
            console.log(response);

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

function get_docs_id() {
    var data = []
    try {

        data = fs.readFileSync('data/query_result.txt', 'utf8')
        // fs.unlink("data/query_result.txt", () => {})
        // console.log(data)
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
            collectionId: 'db22f816-2a5e-4d82-a186-d005cdc2eee9',
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
            });
    }
}

module.exports = {
    query
}

// add_documents()
// delete_documents()
// query()

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

    function createNewCollection(params)
    {
        discovery.createCollection(params)
        .then(collection => {
            console.log(JSON.stringify(collection, null, 2));

            file.collectionid = collection.result.collection_id

            fs.writeFile(fileName, JSON.stringify(file, null, 2), function writeJSON(err) {
                if (err) return console.log(err);
                console.log(JSON.stringify(file));
                console.log('writing to ' + fileName);
            });

        })
        .catch(err => {
            console.log('error:', err);
        });
    }



}

refresh_collection()