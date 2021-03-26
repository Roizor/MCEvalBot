const parseText = require("../util/text_parser");

module.exports = {
    /**
     * Injects the plugin into the client
     * @param {object} client - The client object
     */
    inject: function (client) {
        client.on("chat", function (packet) {
            message = parseText(packet.message);
            client.emit("parsed_chat", message, packet);
        });

        client.on("parsed_chat", function (message, data) {
            let msg = message.raw;
            if (msg.match(/<.*§r> .*/g)) {
                if(data.sender === '00000000-0000-0000-0000-000000000000') return;
                let username = msg.substr(3).split("§r>")[0];
                let message = msg.split("§r> §r")[1];
                client.emit("message", username, message, data.sender);
            } else if (msg.match(/<.*> .*/g)) {
                if(data.sender === '00000000-0000-0000-0000-000000000000') return;
                let username = msg.substr(3).split(">")[0];
                let message = msg.split("> §r")[1];
                client.emit("message", username, message, data.sender);
            } else if (msg.match(/.* .*§r: §.*/g)) {
                if(data.sender === '00000000-0000-0000-0000-000000000000') return;
                let username = msg.split(" ")[1].split("§r:")[0];
                let message = msg.split("§r: ")[1].substr(2);
                client.emit("message", username, message, data.sender);
            } else if (msg.match(/§.*§b: \/.*/g)) {
                let username = msg.split("§b: ")[0];
                let command = msg.split("§b: ")[1];
                client.emit("cspy", username, command);
            }
        });
    }
};