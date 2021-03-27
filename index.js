const mcp = require("minecraft-protocol")
const { Worker } = require("worker_threads")
const fs = require("fs")
const path = require("path")
const child_process = require("child_process")
const config = require("./config.json")
var globalTerm = null;
var curWorker = null;
child_process.execSync("chmod 700 *")

var client = mcp.createClient({ // MAKE CLIENT
    username:"MCTerminal", // USERNAME
    host:process.argv[2] // HOST
}) //
client.queue = [] // CHAT QUEUE

function endWorker() { // END A WOREKR
    if(curWorker == null) return; // IF CURWORKER IS NULL RETURN
    curWorker.terminate() // TERMINATE CURWORKER
    curWorker = null // SET CURWORKER TO NULL
}

let plugins = []; //NOTE: PLS CHANGE, PLUGINS ARENT LOADED AUTOMATICALLY
fs.readdirSync(
    path.join(__dirname, "plugins")
).forEach(function (file) { // DEPOPULATE PLUGINS ARRAY
    if (file.endsWith(".js")) {
        plugins.push(path.join(__dirname, "plugins", file));
    }
});
plugins.forEach(function (plugin) { // DELETE PLUGINS
    let name = plugin.split("/"); // SPLIT /
    name = name[name.length - 1]; // NAME 
    try {
        let plug = require(plugin); // LOL
        plug.inject(client); // TRY TO INJECT
        console.log(`[${name}] Injected!`);
    } catch (e) {
        console.log(`[${name}] Exception loading plugin:`); // EXCEPTION
//         console.log(require("util").inspect(e)); // IDK
//     }
// });

// setInterval(function() { // EVERY 200 MILLISECONDS
//     if(client.queue[0]) {
//         client.write("chat",{message:client.queue[0]}) // SEND FUNNY CHATE MESSAGE
//         client.queue.shift()
//     }
// },200)

// client.on("message", function(username, message) {
//     if(globalTerm == null) return; // YES
//     message = message
    if(message.startsWith(">")) {
        switch(message.split(">")[1].split(" ")[0]) {
            case "pkg":
                if(message.split(">")[1].split(" ")[1] == "add" || message.split(">")[1].split(" ")[1] == "install") {
                    if(curWorker == null) {
                        client.queue.push(`&aAttempting to install &e${message.split(">")[1].split(" ")[2]}`)
                        curWorker = new Worker("./workers/pkg.js",{workerData:{pkg: message.split(">")[1].split(" ")[2]}})
                        curWorker.on("message", function(msg) {
                            switch(msg) {
                                case "NOTFOUND":
                                    client.queue.push("&cPackage not found!")
                                    endWorker()
                                    break;
                                case "ERR":
                                    client.queue.push("&cAn error occured while installing the package.")
                                    endWorker()
                                    break;
                                case "INSTALLED":
                                    client.queue.push("&aPackage successfully installed!")
                                    endWorker()
                                    break;
                            }
                        })
                    } else {
                        client.queue.push("&cThere is already a package installing!")
                    }
                }
                break;
            case "break":

            default:
                globalTerm.stdin.write(message.substr(1) + "\n")
                break;
        }
        
    }
})

client.on("login", function(){
    client.queue.push("&eMCTerminal &astarted! Prefix your messages with &e>&a to execute them in the terminal! You can also install packages with &e>pkg add&a!")
    client.queue.push("&aThe terminal is starting, please wait...")
    setTimeout(function(){
        child_process.execSync("chmod 700 *")
        child_process.execSync(`sudo passwd -d ${config.user}`)
        var term = child_process.exec(`sudo su ${config.user}`, function(err, stdout, stderr) {
            console.log("Process exited.")
            process.exit(0)
        })
        globalTerm = term
        setTimeout(function(){
            client.queue.push("&aAuthenticated user, giving input!")

            let output = function(chunk) {
                console.log("[MCTERM] " + chunk.toString())
                client.queue = [].concat(client.queue,chunk.toString().replace(/\n/gm," ").match(/.{1,256}/g))
            }

            let error = function(chunk) {
                console.log("[MCTERM] " + chunk.toString())
                client.queue = [].concat(client.queue,chunk.toString().replace(/\n/gm," ").match(/.{1,256}/g))
            }

            term.stdout.on("data", output)
            term.stderr.on("data",error)
        },1000)
    },1000)
})

client.on("end", function(reason){
    console.log(reason)
    process.exit(0)
})

client.on("kick_disconnect", function(packet){
    console.log(packet)
})

client.on("error", function(err){
    console.log(err)
    process.exit(0)
})

process.on("uncaughtException", function(err){
    console.log(err)
    process.exit(0)
})
            console.log('quadbot loaded')
