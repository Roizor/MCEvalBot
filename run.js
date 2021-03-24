var process = require("child_process")

function start(){
    var proc = process.exec("node . " + require("process").argv[2])
    proc.on("close",function(){
        proc.kill()
        start()
    }) 
    proc.stdout.on("data",function(chunk){
        require("process").stdout.write(chunk)
    })
}

start()