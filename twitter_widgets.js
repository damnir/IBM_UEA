var TwitterWidgetsLoader = require('twitter-widgets');

var response = []

function load_tweets() {
    TwitterWidgetsLoader.load(function (err, twttr) {
        if (err) {
            //do some graceful degradation / fallback
            return;
        }
        console.log("load tweets called")
        console.log(response = response.split('\n'))
        response.forEach(tweet => twttr.widgets.createTweet(tweet, document.getElementById('tweet')));
    });
}

const axios = require('axios')

function load(path, id){
    axios
    .post('http://localhost:8080/' + path)
    .then(res => {
        console.log("yes")

        console.log(res)
        if(res.status == 200) {
            response = res.data.message;
            load_tweets();
        }

    })
    .catch(error => {
        console.error(error)
    })
}

module.exports = { load }


TwitterWidgetsLoader.load();
