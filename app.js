const express = require("express")
const app = express()
const { spawn } = require("child_process")

const fs = require('fs')

var body_parser = require("body-parser")
var dbclient = require('./dbclient')
var watsonclient = require('./watson')
const { resolve } = require("path")

app.use(express.static('public'))

var accounts
var doc

// console.log(dbclient.query_id("all_accounts", "data"))
// var twttr = require("./twitter_widgets")


app.set('view engine', 'ejs')
app.use(body_parser.urlencoded({ extended: true }))

app.get("/", async (req, res) => {

    accounts = await dbclient.query_id("all_accounts", "data")

    res.render("main", {
        accounts: accounts
    })
})

app.get("/records", async (req, res) => {

    docs = await dbclient.query_all()

    res.render("records", {
        recs: docs,
        query: null,
        id: null
    })
})

app.get("/records/:id", async (req, res) => {

    doc = await dbclient.query_one(req.params)
    docs = await dbclient.query_all()

    res.render("records", {
        recs: docs,
        query: doc,
        id: req.params['id']
    })
    // console.log(doc)
})

app.post('/records/:id', async (req, res) => {
    data = []
    doc = await dbclient.query_one(req.params)

    doc['results']['result'].array.forEach(element => {
        data.push(data, element['t_id'])
    });

    // console.log(req.params)
    // console.log(data)

    res.status(200).send({
        message: data,
        id: req.params['id']
    })

    console.log(message)
})

app.post('/', (req, res) => {
    res.status(200).send({
        message: read_result()
    })
});

app.post('/records', (req, res) => {
    res.status(200).send({
        message: read_result()
    })
});

app.post("/new_query", (req, res) => {
    var tweets = read_result()

    if (tweets) {
        res.status(200).send({ message: tweets })
    }
    else {
        res.status(418)
    }

    res.redirect("/")
})

app.post('/submit-form', (req, res) => {
    // const query = req.body.query
    // console.log(query)

    // //query - ibm university until:2022-04-10 since:2021-04-01
    // var process = spawn("go", ["run", "scraper.go", query]);
    // // var process = spawn("go", ["run", "scraper.go", "a"]);

    // process.on('exit', function () {
    //     console.log("query finished")
    //     watsonclient.refresh_collection()
    //     wait()

    // })

    // async function wait() {
    //     if (!watsonclient.check_status) {
    //         console.log("false")
    //         await sleep(2000)
    //         wait()
    //     }
    //     else {
    //         res.redirect("/")
    //     }

    // }

})

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
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

    return data
}

function read_accounts() {

    var accounts = ""

    try {
        accounts = fs.readFileSync('data/accounts.txt', 'utf8')
    } catch (err) {
        console.error(err)
    }

    return accounts.split('\n')
}



// dbclient.pushNewWatson(watsonclient.query())
// watsonclient.query()

app.listen(8080, () => console.log("listening on 8080"))