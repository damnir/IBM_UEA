//FOR BROSERIFY, NOT EXECUTED ON THE SERVER
var TwitterWidgetsLoader = require('twitter-widgets');

var response = []

function load_tweets() {
    TwitterWidgetsLoader.load(function (err, twttr) {
        if (err) {
            return;
        }
        console.log("load tweets called")
        response.forEach(tweet => twttr.widgets.createTweet(tweet, document.getElementById('tweet')));
    });
}

const axios = require('axios')

function load(path, id){
    axios
    .post('http://localhost:8080/' + path)
    .then(res => {

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

function query(qr) {
    axios
    .post('http://localhost:8080/new_query/' + qr)
    .then(res => {

        console.log(res)
        if(res.status == 200) {
            data = res.data.message
            arr = []
            data['result']['results'].forEach(element => {
                arr.push(element['t_id'])
            })
            response = arr
            load_tweets();
        }

    })
    .catch(error => {
        console.error(error)
    })}

module.exports = { load, query }


TwitterWidgetsLoader.load();
