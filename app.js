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

    accounts = await dbclient.query_id("all_accounts", "data")
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
        query: null,
        id: null
    })
})

app.post("/records", async (req, res) => {
    docs = await dbclient.query_all()

    res.status(200).send({
        recs: docs,
    })
})

app.get("/records/:id", async (req, res) => {

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

    if (req.params.id === "export-slides") {
        var process = spawn("py", ['gapis/gslides.py'])

        process.on('exit', async function () {
            console.log("slides exported")
        })

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
            // res.status(400)
            return
        }
        doc['result']['results'].forEach(element => {
            data.push(element['t_id'])
        });
    })

    // if(!doc) return

    res.send({
        message: data,
        id: req.params['id']
    })

})

app.get('/records/:id/:export'), (req, res) => {

    res.redirect('https://docs.google.com/presentation/d/1PYJKAZwK8OhWF6uyFRI-VuiMMkFmgYZ4PhZXVXJNIHA')
}

app.post('/records/:id/:export'), (req, res) => {

    if (req.params.export === "slides") {

        var process = spawn("py", ['gapis/gslides.py'])
    }

    process.on('exit', async function () {
        console.log("slides exported")
    })
}

// app.post('/export-sheets'), (req, res) => {
//     var process = spawn("py", ['gapis/gsheets.py'])

//     process.on('exit', async function () {
//         console.log("sheets exported")
//     })
// }

app.post('/submit-form', async (req, res) => {
    // watsonclient.new_request(req.body)

    // console.log(req.body)
    var args = ["run", "scraper.go", req.body.accountsOptions]

    var rtArg = ""

    if (req.body.retweets === 'on') {
        rtArg += 'r'
    }
    if (req.body.replies === 'on') {
        rtArg += 'p'
    }

    args.push(rtArg); args.push(req.body.until); args.push(req.body.since)

    var process = spawn("go", args);

    process.on('exit', async function () {
        // console.log("query finished")
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
                id = await watsonclient.new_request(req.body)
                res.status(202).redirect("/records/" + id)
            }
        }
    })

    console.log(args)

})

app.get('/new_query', (req, res) => {
    res.render("new_query", {
        watson_response: null
    })
})

function read_result() {

    var data = ""

    try {
        data = fs.readFileSync('data/query_result.txt', 'utf8')
        // console.log(data)
    } catch (err) {
        console.error(err)
    }

    return data
}

module.exports = app

app.listen(8080, () => console.log("listening on 8080"))