const mcp = require("minecraft-protocol")
const fs = require("fs")
const path = require("path")
const child_process = require("child_process")
var globalTerm = null;
child_process.execSync("chmod 760 *")

var client = mcp.createClient({
    username:"MCTerminal",
    host:"raccoon.pw"
})
client.queue = []

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
},100)

client.on("message", function(username, message) {
    if(globalTerm == null) return;
    if(message.startsWith(">")) {
        globalTerm.stdin.write(message.substr(1))
    }
})

client.on("login", function(){
    client.queue.push("&eMCTerminal &astarted! Prefix your messages with &e>&a to execute them in the terminal!")
    var term = child_process.exec(`bash`, function(err, stdout, stderr) {
        client.queue.push("Process exited.")
    })
    globalTerm = term
    
    term.stdout.on("data", function(chunk){
        client.queue.push(chunk.toString().replace(/\n/gm,""))
    })

    term.stderr.on("data",function(chunk){
        client.queue.push(chunk.toString().replace(/\n/gm,""))
    })
})