let chai = require("chai");
let request = require("request");
let chaitHttp = require("chai-http")

let server = require("../app")
let watson = require("../watson");
let dbclient = require("../dbclient")
const fs = require('fs')

const { expect, assert } = require("chai");

chai.should()
chai.use(chaitHttp)

describe("Records Test (GET and POST tests)", () => {

    describe("GET records test", () => {

        describe("Get all records", () => {
            it("Should return all previous analysis records", (done) => {
                chai.request(server)
                    .post("/records")
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property('recs')
                        done()
                    })
            })
        })
        describe("Get a specific record from the database", () => {
            it("Should return the speficied record ", (done) => {
                chai.request(server)
                    .post("/records/a_1650336193906")
                    .end((err, res) => {
                        res.body.should.have.property('message')
                        res.body.should.have.property('id').eql("a_1650336193906")
                        done()
                    })
            })
        })
        describe("Get a record that doesn't exist", () => {
            it("Should return a 400 status code", (done) => {
                chai.request(server)
                    .get("/records/a_gb43iugbregrgbeui4gbuirelgbhjdfg")
                    .end((err, res) => {
                        res.should.have.status(400)
                        done()
                    })
            })
        })
    })

    var id

    describe("Adding a new record to the database", () => {
        it("Should insert the sample document into the database and give it an ID", async () => {
            var data
            try {
                data = fs.readFileSync('./data/sample_response.json', 'utf8')
            } catch (err) {
                console.error(err)
            }
            id = await dbclient.pushNewWatson(JSON.parse(data))
            assert.equal(id, "a_test")
        })
    })

    describe("Delete a record from the database", () => {
        it("Should delete the sample document", async () => {
            const status = await dbclient.delete_one(id)
            assert.equal(status, true)
        })
    })

})

describe("Test Scraper Queries (POST form + run Go script)", () => {

    describe("Invalid Queries:", () => {

        describe("Dates out of range", () => {
            it("Should return 0 results:", (done) => {

                let parameters = {
                    retweets: "on",
                    replies: "on",
                    accountsOptions: "russel",
                    since: "2023-01-01",
                    until: "2024-01-01",
                    rest: "yes"
                }

                chai.request(server)
                    .post("/submit-form")
                    .type("form")
                    .send(parameters)
                    .end((err, res) => {
                        res.should.have.status(204)
                        done()
                    })
            })
        })

        describe("Account not contained in the list", () => {
            it("Should return 0 results:", (done) => {

                let parameters = {
                    retweets: "on",
                    replies: "on",
                    accountsOptions: "@tha39bgkj3qkjb4tj4kt",
                    since: "2021-01-01",
                    until: "2022-01-01",
                    rest: "yes"
                }

                chai.request(server)
                    .post("/submit-form")
                    .type("form")
                    .send(parameters)
                    .end((err, res) => {
                        res.should.have.status(204)
                        done()
                    })
            })
        })
    })

    describe("Valid Queries:", () => {

        describe("Get All Query ( from 2022-01-01 until 2022-06-06 )", () => {
            it("Should return valid results (200 status):", (done) => {

                let parameters = {
                    retweets: "on",
                    replies: "on",
                    accountsOptions: "all",
                    since: "2021-01-01",
                    until: "2022-06-06",
                    rest: "yes"
                }

                chai.request(server)
                    .post("/submit-form")
                    .type("form")
                    .send(parameters)
                    .end((err, res) => {
                        res.should.have.status(202)
                        done()
                    })
            })
        })

        describe("Get Russel Query ( from 2022-01-01 until 2022-06-06 )", () => {
            it("Should return valid results (200 status):", (done) => {

                let parameters = {
                    retweets: "on",
                    replies: "on",
                    accountsOptions: "russel",
                    since: "2021-01-01",
                    until: "2022-06-06",
                    rest: "yes"
                }

                chai.request(server)
                    .post("/submit-form")
                    .type("form")
                    .send(parameters)
                    .end((err, res) => {
                        res.should.have.status(202)
                        done()
                    })
            })
        })

        describe("Get @unisouthampton Query ( from 2022-01-01 until 2022-06-06 )", () => {
            it("Should return valid results (200 status):", (done) => {

                let parameters = {
                    retweets: "on",
                    replies: "on",
                    accountsOptions: "unisouthampton",
                    since: "2021-01-01",
                    until: "2022-06-06",
                    rest: "yes"
                }

                chai.request(server)
                    .post("/submit-form")
                    .type("form")
                    .send(parameters)
                    .end((err, res) => {
                        res.should.have.status(202)
                        done()
                    })
            })
        })
    })

})

describe("Watson Discovery Tests", () => {

    describe("Refresh the Dynamic Data Collection", () => {
        it("Should delete the dynamic collection and create a fresh instance", async () => {
            const result = await watson.refresh_collection()

            assert.equal(result, true)
        })
    })

    describe("Add Sample Documents and Analyse Them", () => {
        it("Should add the sample documents and analyse them", async () => {
            const result = await watson.add_documents()

            assert.equal(result, true)
        })
    })

    describe("Post New Discovery NL Query", () => {

        describe("Post a valid query", () => {
            it("Should receive some results", (done) => {

                query = "covid and ibm related content"

                chai.request(server)
                    .post("/new_query/" + query)
                    .end((err, res) => {

                        res.body.should.have.property('message')
                        data = res.body.message

                        assert.equal(data.status, 200)
                        assert.isAtLeast(data.result.matching_results, 50)

                        done()
                    })
            })
        })

        describe("Post an invalid query", () => {
            it("Should receive no results", (done) => {

                query = "santa claus"

                chai.request(server)
                    .post("/new_query/" + query)
                    .end((err, res) => {

                        res.body.should.have.property('message')
                        data = res.body.message

                        assert.equal(data.status, 200)
                        assert.equal(data.result.matching_results, 0)

                        done()
                    })
            })
        })
    })

})

