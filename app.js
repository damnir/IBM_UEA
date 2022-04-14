const express = require("express")
const app = express()
const { spawn } = require("child_process")

const fs = require('fs')

var body_parser = require("body-parser")

app.use(express.static('public'))

var accounts = read_accounts()


app.set('view engine', 'ejs')
app.use(body_parser.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    res.render("main", { accounts: accounts })
})

app.post('/', (req, res) => {
    res.status(200).send({
        message: read_result()
    })
});

app.post("/new_query", (req, res) => {
    var tweets = read_result()

    if(tweets) {
        res.status(200).send({ message:tweets })
    }
    else {
        res.status(418)
    }

    res.redirect("/")
})

app.post('/submit-form', (req, res) => {
    const query = req.body.query
    console.log(query)

    //query - ibm university until:2022-04-10 since:2021-04-01
    var process = spawn("go", ["run", "scraper.go", query]);

    process.on('exit', function () {
        console.log("query finished")

        res.redirect("/")
    })

})

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

var dbclient = require('./dbclient')
var watsonclient = require('./watson')

// dbclient.pushNewWatson(watsonclient.query())
watsonclient.query()

app.listen(8080, () => console.log("listening on 8080"))