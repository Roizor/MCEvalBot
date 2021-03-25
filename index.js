const mcp = require("minecraft-protocol")
const { Worker } = require("worker_threads")
const fs = require("fs")
const path = require("path")
const child_process = require("child_process")
const config = require("./config.json")
var globalTerm = null;
var curWorker = null;
child_process.execSync("chmod 700 *")

var client = mcp.createClient({
    username:"MCTerminal",
    host:process.argv[2]
})
client.queue = []

function endWorker() {
    if(curWorker == null) return;
    curWorker.terminate()
    curWorker = null
}

let plugins = []; //NOTE: DO NOT CHANGE, PLUGINS ARE LOADED AUTOMATICALLY
fs.readdirSync(
    path.join(__dirname, "plugins")
).forEach(function (file) { // populate plugins array
    if (file.endsWith(".js")) {
        plugins.push(path.join(__dirname, "plugins", file));
    }
});
plugins.forEach(function (plugin) { //load plugins
    let name = plugin.split("/");
    name = name[name.length - 1];
    try {
        let plug = require(plugin);
        plug.inject(client);
        console.log(`[${name}] Injected!`);
    } catch (e) {
        console.log(`[${name}] Exception loading plugin:`);
        console.log(require("util").inspect(e));
    }
});

setInterval(function() {
    if(client.queue[0]) {
        client.write("chat",{message:client.queue[0]})
        client.queue.shift()
    }
},200)

client.on("message", function(username, message) {
    if(globalTerm == null) return;
    
    if(message.startsWith(">")) {
        switch(message.split(">")[1].split(" ")[0]) {
            case "pkg":
                if(message.split(">")[1].split(" ")[1] == "add") {
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
        var term = child_process.exec(`sudo su ${config.user}`, function(err, stdout, stderr) {
            console.log("Process exited.")
            process.exit(0)
        })
        globalTerm = term
        setTimeout(function(){
            client.queue.push("&aAuthenticated user, giving input!")
            term.stdout.on("data", function(chunk){
                client.queue = [].concat(client.queue,chunk.toString().replace(/\n/gm," ").match(/.{1,99}/g))
            })
        
            term.stderr.on("data",function(chunk){
                client.queue = [].concat(client.queue,chunk.toString().replace(/\n/gm," ").match(/.{1,99}/g))
            })
        },1000)
    },1000)
})

client.on("end", function(reason){
    console.log(reason)
    process.exit(0)
})

client.on("error", function(err){
    console.log(err)
    process.exit(0)
})

process.on("uncaughtException", function(err){
    console.log(err)
    process.exit(0)
})