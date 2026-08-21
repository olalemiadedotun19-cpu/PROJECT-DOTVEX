const https = require('https');

const registrationData = {
  client_name: "DOTVEX Kaggle MCP Client",
  redirect_uris: ["http://localhost:21715/oauth/callback"],
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  scope: "resources.admin:*",
  token_endpoint_auth_method: "none"
};

const data = JSON.stringify(registrationData);

const req = https.request({
  hostname: 'www.kaggle.com',
  path: '/api/v1/oauth2/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (response) => {
  let body = '';
  response.on('data', c => body += c);
  response.on('end', () => {
    console.log('Status:', response.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', e => console.log('Error:', e.message));
req.write(data);
req.end();
