const https = require('https');
const http = require('http');
const crypto = require('crypto');
const url = require('url');

const PORT = 4097;
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

// Start callback server
const callbackServer = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  console.log('\n=== CALLBACK RECEIVED ===');
  console.log('Query:', JSON.stringify(parsed.query).substring(0, 300));
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('Auth complete');
  
  const code = parsed.query.code;
  if (code) {
    console.log('\nAuthorization code:', code.substring(0, 60) + '...');
    exchangeToken(code);
  } else {
    callbackServer.close();
    process.exit(1);
  }
});

callbackServer.listen(PORT, '127.0.0.1', () => {
  console.log('Callback server on http://127.0.0.1:' + PORT + '/callback');
  
  // Build auth URL
  const authUrl = new URL('https://www.kaggle.com/api/v1/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', 'kilo-test-client');
  authUrl.searchParams.set('redirect_uri', `http://127.0.0.1:${PORT}/callback`);
  authUrl.searchParams.set('scope', 'resources.admin:*');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', crypto.randomBytes(32).toString('hex'));
  
  console.log('Auth URL:', authUrl.toString());
  
  // Make a SIMPLE GET request (like we did in check_kaggle_oauth.cjs that returned 302)
  const parsedUrl = new URL(authUrl.toString());
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };
  
  https.get(options, (res) => {
    let cookies = '';
    if (res.headers['set-cookie']) {
      cookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
      console.log('Initial cookies:', cookies.substring(0, 150));
    }
    
    console.log('Status:', res.statusCode);
    console.log('Location:', res.headers.location || '(none)');
    
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      let nextUrl = res.headers.location;
      if (!nextUrl.startsWith('http')) {
        nextUrl = `https://${parsedUrl.hostname}${nextUrl}`;
      }
      
      // Follow the redirect chain, preserving cookies
      let currentUrl = nextUrl;
      let redirectCount = 1;
      
      function followNext(nextReqUrl) {
        const p = new URL(nextReqUrl);
        const opts = {
          hostname: p.hostname,
          path: p.pathname + p.search,
          method: 'GET',
          headers: cookies ? { 'Cookie': cookies, 'Accept': 'application/json' } : { 'Accept': 'application/json' }
        };
        
        console.log(`[${redirectCount}] Following: ${nextReqUrl.substring(0, 120)}`);
        
        https.get(opts, (res2) => {
          if (res2.headers['set-cookie']) {
            const newCookies = res2.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
            cookies = cookies ? `${cookies}; ${newCookies}` : newCookies;
            console.log('  New cookies:', newCookies.substring(0, 150));
          }
          
          console.log('  Status:', res2.statusCode);
          
          if (res2.statusCode >= 300 && res2.statusCode < 400 && res2.headers.location) {
            redirectCount++;
            let nextNextUrl = res2.headers.location;
            if (!nextNextUrl.startsWith('http')) {
              nextNextUrl = `https://${p.hostname}${nextNextUrl}`;
            }
            
            // Check if redirect goes to our callback
            if (nextNextUrl.includes(`127.0.0.1:${PORT}/callback`)) {
              console.log('  Redirect to callback!');
              const cbUrl = new URL(nextNextUrl);
              const code = cbUrl.searchParams.get('code');
              if (code) {
                console.log('  Code:', code.substring(0, 60) + '...');
                exchangeToken(code);
              } else {
                console.log('  No code in callback redirect');
                // Check if there's a code in the query params
                let body = '';
                res2.on('data', (chunk) => body += chunk);
                res2.on('end', () => {
                  console.log('  Body:', body.substring(0, 300));
                });
              }
            } else {
              followNext(nextNextUrl);
            }
          } else {
            let body = '';
            res2.on('data', (chunk) => body += chunk);
            res2.on('end', () => {
              console.log('  Final body length:', body.length);
              console.log('  Final body:', body.substring(0, 500));
            });
          }
        }).on('error', (e) => {
          console.log('  Error:', e.message);
        });
      }
      
      if (redirectCount > 0) {
        // Wait for the response body to be consumed
        res.resume();
        setTimeout(() => {
          followNext(nextUrl);
        }, 500);
      }
    } else {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('  Status:', res.statusCode);
        console.log('  Body:', body.substring(0, 500));
      });
    }
  }).on('error', (e) => {
    console.log('Error:', e.message);
  });
  
  setTimeout(() => {
    console.log('\nTimeout');
    callbackServer.close();
    process.exit(0);
  }, 25000);
});

function exchangeToken(authCode) {
  const tokenData = new URLSearchParams();
  tokenData.append('grant_type', 'authorization_code');
  tokenData.append('client_id', 'kilo-test-client');
  tokenData.append('code', authCode);
  tokenData.append('redirect_uri', `http://127.0.0.1:${PORT}/callback`);
  tokenData.append('code_verifier', codeVerifier);
  
  const req = https.request({
    hostname: 'www.kaggle.com',
    path: '/api/v1/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(tokenData.toString())
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\n=== Token Exchange ===');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      callbackServer.close();
      process.exit(0);
    });
  });
  req.on('error', (e) => {
    console.log('Token error:', e.message);
    callbackServer.close();
    process.exit(1);
  });
  req.write(tokenData.toString());
  req.end();
}
