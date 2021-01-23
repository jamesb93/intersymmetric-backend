// https://stackoverflow.com/questions/13364243/websocketserver-node-js-how-to-differentiate-clients
let fs = require('fs');
var https = require('https');

let privateKey = fs.readFileSync('ssl-cert/privkey.pem', 'utf8');
let certificate = fs.readFileSync('ssl-cert/fullchain.pem', 'utf8');
let credentials = {key : privateKey, cert: certificate}
let httpsServer = https.createServer(credentials);
httpsServer.listen(8080);

const WebSocket = require('ws');
const wss = new WebSocket.Server({server: httpsServer});

let data = {
    "type" : "data",
	"grid" : [
		{state: false, emph: false},
		{state: false, emph: false},
		{state: false, emph: false},
		{state: false, emph: false},
		{state: false, emph: false},
		{state: false, emph: false},
		{state: false, emph: false},
		{state: false, emph: false},
		{state: false, emph: false},
	],
	"numSteps" : 9,
	"bpm" : 120,
	"play" : false
}

// Setup Grid

let users = {
    "type" : "users",
    "connections" : 0
}

// Unique IDs for each connection
const s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

wss.getID = () => {
    return s4() + s4() + '-' + s4();
}

wss.on('connection', (ws) => {
    users.connections = wss.clients.size;
    // Update every user about the new connection
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(users))
        }
    })
    ws.send(JSON.stringify(data)); // on connection immediately update
    ws.id = wss.getID();

    //make this shit update the number of users when they close

    // When we get a message from a client
    ws.on('message', (message) => {
        // Update internal data structure here
        let d = message.split(/,/)
        let key = d.shift()
        let val = d.join(',')
        data[key] = JSON.parse(val)
        // Broadcast data to everyone else on slider changes
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    })
})
