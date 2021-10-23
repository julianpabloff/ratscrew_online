const net = require('net');

const host = '127.0.0.1';
const port = 6969;

net.createServer(function(sock) {
	// We have a connection - a socket object is assigned to the connection automatically
	console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
	// Add a 'data' event handler to this instance of socket
	sock.on('data', function(data) {
		console.log('DATA ' + sock.remoteAddress + ': ' + data);
		// Write the data back to the socket, the client will receive it as data from the server
		sock.write('You said "' + data + '"');
	});
	// Add a 'close' event handler to this instance of socket
	sock.on('close', function(data) {
	console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
	});
}).listen(port, host);

console.log('Server listening on ' + host +':'+ port);
