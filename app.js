const express = require("express")
const app = express()
const { spawn } = require("child_process")

const fs = require('fs')

var body_parser = require("body-parser")
var dbclient = require('./dbclient')
var watsonclient = require('./watson')
const { resolve } = require("path")
const e = require("express")

app.use(express.static('public'))

var accounts
var doc

app.set('view engine', 'ejs')
app.use(body_parser.urlencoded({ extended: true }))
app.use(watsonclient.router)

app.get("/", async (req, res) => {

    //get all accounts from the database
    accounts = await dbclient.query_id("all_accounts", "data")
    //get all document records from the database
    docs = await dbclient.query_all()

    res.status(200).render("main", {
        accounts: accounts,
        recs: docs
    })
})

app.get("/records", async (req, res) => {

    docs = await dbclient.query_all()

    res.render("records", {
        recs: docs,
        query: null, //placeholders
        id: null
    })
})

app.post("/records", async (req, res) => {
    docs = await dbclient.query_all()
    //query all records
    res.status(200).send({
        recs: docs,
    })
})

app.get("/records/:id", async (req, res) => {
    //query all records + query with id
    doc = await dbclient.query_one(req.params)
    docs = await dbclient.query_all()

    if (!doc) {
        res.sendStatus(400)
        return
    }

    res.render("records", {
        recs: docs,
        query: doc,
        id: req.params['id'],
        entities: doc['summary']['entities']
    })
})

app.post('/records/:id', async (req, res) => {
    //export slides, sheets and redirect the user to the document
    if (req.params.id === "export-slides") {
        var process = spawn("py", ['gapis/gslides.py'])

        process.on('exit', async function () {
            console.log("slides exported")
        })
        //HARD CODED URL because if credentials are missing, this is the only doc available
        res.redirect("https://docs.google.com/presentation/d/1PYJKAZwK8OhWF6uyFRI-VuiMMkFmgYZ4PhZXVXJNIHA")
        return
    }
    if (req.params.id === "export-sheets") {
        var process = spawn("py", ['gapis/gsheets.py'])

        process.on('exit', async function () {
            console.log("sheets exported")
        })

        res.redirect("https://docs.google.com/spreadsheets/d/1HLmj5BNqdCj-k7s9e3Q4gYhiLQjtcxpXnkpAj1p7SBk")
        return
    }

    console.log(req.params)
    data = []
    doc = await dbclient.query_one(String(req.params.id)).then(() => {
        console.log("JASF" + doc)
        if (!doc) {
            return
        }
        doc['result']['results'].forEach(element => {
            data.push(element['t_id'])
        });
    })

    res.send({
        message: data,
        id: req.params['id']
    })

})

app.get('/records/:id/:export'), (req, res) => {
    //redirect the user to the slide, Hard coded bc it's linked to my google account
    res.redirect('https://docs.google.com/presentation/d/1PYJKAZwK8OhWF6uyFRI-VuiMMkFmgYZ4PhZXVXJNIHA')
}

app.post('/records/:id/:export'), (req, res) => {

    if (req.params.export === "slides") {
        //start the slides script
        var process = spawn("py", ['gapis/gslides.py'])
    }

    process.on('exit', async function () {
        console.log("slides exported")
    })
}

app.post('/submit-form', async (req, res) => {
    //basic args for the scraper
    var args = ["run", "scraper.go", req.body.accountsOptions]

    var rtArg = ""

    //retweet & replies params
    if (req.body.retweets === 'on') {
        rtArg += 'r'
    }
    if (req.body.replies === 'on') {
        rtArg += 'p'
    }

    //add rt args and since - until dates
    args.push(rtArg); args.push(req.body.until); args.push(req.body.since)
    //start the scraper
    var process = spawn("go", args);

    //if REST request, only send back status - for testing purposes only
    //otherwise start analysis process if query returns some results
    process.on('exit', async function () {
        if (read_result() === "") {
            console.log("no results.")
            if (req.body.rest === "yes") {
                res.sendStatus(204)
            } else {
                res.status(204).redirect("/")
            }
        }
        else {
            if(req.body.rest === "yes"){
                res.sendStatus(202)
            } else {
                //start the analysis process and redirect client to the record once finished
                id = await watsonclient.new_request(req.body)
                res.status(202).redirect("/records/" + id)
            }
        }
    })
})

//placeholder
app.get('/new_query', (req, res) => {
    res.render("new_query", {
        watson_response: null
    })
})

//read results from the latest query
function read_result() {

    var data = ""

    try {
        data = fs.readFileSync('data/query_result.txt', 'utf8')
    } catch (err) {
        console.error(err)
    }

    return data
}

module.exports = app

app.listen(8080, () => console.log("listening on 8080"))