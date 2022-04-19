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
        id: req.params['id'],
        entities: doc['summary']['entities']
    })
})

app.post('/records/:id', async (req, res) => {
    console.log(req.params)
    data = []
    doc = await dbclient.query_one(String(req.params.id)).then( () => {
        doc['result']['results'].forEach(element => {
            data.push(element['t_id'])
        });
    })

    res.status(200).send({
        message: data,
        id: req.params['id']
    })

})

app.post('/submit-form', (req, res) => {

    console.log(req.body)
    var args = ["run", "scraper.go", req.body.accountsOptions]

    var rtArg = ""

    if(req.body.retweets === 'on') {
        rtArg += 'r'
    }
    if(req.body.replies === 'on') {
        rtArg += 'p'
    }

    args.push(rtArg)
    args.push(req.body.until)
    args.push(req.body.since)

    var process = spawn("go", args);

    process.on('exit', function () {
        console.log("query finished")
        if(read_result() === ""){
            console.log("no results.")
        }
        else{
            watsonclient.refresh_collection()
        }
    })

    console.log(args)

})

app.get('/new_query', (req, res) => {
    res.render("new_query")

})
function read_result() {

    var data = ""

    try {
        data = fs.readFileSync('data/query_result.txt', 'utf8')
        console.log(data)
    } catch (err) {
        console.error(err)
    }

    return data
}

app.listen(8080, () => console.log("listening on 8080"))