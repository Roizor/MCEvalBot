const { workerData, parentPort } = require("worker_threads")
const child_process = require("child_process")

child_process.exec(`apt-cache search --names-only '${workerData.pkg}'`, function(err,stdout,stderr) {
    if(stdout.trim() == "") {
        parentPort.postMessage("NOTFOUND")
    } else {
        child_process.exec(`sudo apt-get install ${workerData.pkg} -y`, function(err,stdout,stderr) {
            if(stderr.trim() == "" || err) {
                parentPort.postMessage("ERR")
                return;
            }
            parentPort.postMessage("INSTALLED")
        })
    }
})