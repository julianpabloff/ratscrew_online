const net = require('net');

const host = '127.0.0.1';
const port = 6969;

net.createServer(function(socket) {
	console.log(socket);
	// We have a connection - a socket object is assigned to the connection automatically
	console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);
	// Add a 'data' event handler to this instance of socket
	socket.on('data', function(data) {
		console.log('DATA ' + socket.remoteAddress + ': ' + data);
		// Write the data back to the socket, the client will receive it as data from the server
		// socket.write('You said "' + data + '"');
		let json = JSON.parse(data);
		let delta = Date.now() - json.time;
		socket.write('PING: ' + delta.toString());
	});
	socket.on('error', function(error) {
		console.log(error);
	});
	// Add a 'close' event handler to this instance of socket
	socket.on('close', function(data) {
	console.log('CLOSED: ' + socket.remoteAddress +':'+ socket.remotePort);
	});
}).listen(port, host)

console.log('Server listening on ' + host +':'+ port);
