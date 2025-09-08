/**
 * Network connectivity test to MySQL server
 */
require('dotenv').config();

const net = require('net');
const appConfig = require('./config/app-config.json');

const host = appConfig.database.connection.host;
const port = appConfig.database.connection.port;

console.log(`🔍 Testing network connectivity to ${host}:${port}...`);

const socket = new net.Socket();

socket.setTimeout(10000); // 10 second timeout

socket.on('connect', () => {
   console.log('✅ Network connection successful - MySQL server is reachable');
   socket.destroy();
   process.exit(0);
});

socket.on('timeout', () => {
   console.error('❌ Connection timeout - MySQL server may be unreachable');
   socket.destroy();
   process.exit(1);
});

socket.on('error', (error) => {
   console.error('❌ Network connection failed:');
   console.error('Error code:', error.code);
   console.error('Error message:', error.message);

   if (error.code === 'ENOTFOUND') {
      console.error('💡 DNS resolution failed - check if the host is correct');
   } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - MySQL server might be down or firewall blocking');
   } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timeout - network issues or server overloaded');
   }

   process.exit(1);
});

console.log(`Attempting to connect to ${host}:${port}...`);
socket.connect(port, host);
