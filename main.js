const { spawn } = require("child_process");

function run_query() {
    var process = spawn("go", ["run", "scraper.go", '"ibm university until:2022-04-10 since:2021-04-01"'] );

    process.on('exit', function() {
        console.log("we're done here")
    })
}

