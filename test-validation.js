const http = require('http');

// Test validation with empty credentials
const testData = JSON.stringify({
   email: '',
   password: '',
});

const options = {
   hostname: 'localhost',
   port: 3000,
   path: '/auth/login',
   method: 'POST',
   headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData),
   },
};

console.log('Testing validation with empty credentials...');

const req = http.request(options, (res) => {
   console.log(`Status Code: ${res.statusCode}`);
   console.log(`Headers:`, res.headers);

   let data = '';
   res.on('data', (chunk) => {
      data += chunk;
   });

   res.on('end', () => {
      console.log('Response Body:');
      try {
         console.log(JSON.stringify(JSON.parse(data), null, 2));
      } catch (e) {
         console.log(data);
      }
      process.exit(0);
   });
});

req.on('error', (error) => {
   console.error('Error:', error.message);
   process.exit(1);
});

req.write(testData);
req.end();
