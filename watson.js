const DiscoveryV1 = require('ibm-watson/discovery/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const fs = require('fs')

var response = ""

const discovery = new DiscoveryV1({
    version: '2020-08-27',
    authenticator: new IamAuthenticator({
        apikey: 'WRmR6bhNJ16Eh9HRPJ_Jbx1-Cr2H6I1SfiC-msYIUyJd',
    }),
    serviceUrl: 'https://api.eu-gb.discovery.watson.cloud.ibm.com/instances/57273055-1496-469a-8c45-5fdf421f711b',
});

// discovery.listEnvironments()
//     .then(listEnvironmentsResponse => {
//         console.log(JSON.stringify(listEnvironmentsResponse, null, 2));
//     })
//     .catch(err => {
//         console.log('error:', err);
//     });

const listCollectionsParams = {
    environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
};

// discovery.listCollections(listCollectionsParams)
//     .then(listCollectionsResponse => {
//         console.log(JSON.stringify(listCollectionsResponse, null, 2));
//     })
//     .catch(err => {
//         console.log('error:', err);
//     });

// discovery.queryLog()
//     .then(logQueryResponse => {
//         console.log(JSON.stringify(logQueryResponse, null, 2));
//     })
//     .catch(err => {
//         console.log('error:', err);
//     });

//tweet test 1
// const queryParams = {
//     environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
//     collectionId: '644da777-16be-47f9-bbfa-378bcda1a0e7',
// };

//tweet test 2
const queryParams = {
    environmentId: '44c46920-a956-4d4a-b37e-3120a33f7216',
    collectionId: 'e86e2de7-65f6-41fb-a627-d98d47f629dc',
    count: '25'
};


function query() {
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
    })
    .catch(err => {
        console.log('error:', err);
    });
}

module.exports = {
    query
}

query()

