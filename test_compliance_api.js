// ABOUTME: Simple test script to validate compliance API endpoints
// ABOUTME: Tests basic functionality and response format consistency

const http = require('http');

function makeRequest(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      callback(null, {
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      });
    });
  });

  req.on('error', (err) => {
    callback(err);
  });

  req.setTimeout(5000, () => {
    req.destroy();
    callback(new Error('Request timeout'));
  });

  req.end();
}

function testEndpoint(name, path, expectedFields = []) {
  return new Promise((resolve) => {
    console.log('Testing ' + name + '...');
    
    makeRequest(path, (err, response) => {
      if (err) {
        console.log('❌ ' + name + ' failed: ' + err.message);
        return resolve({ name: name, success: false, error: err.message });
      }

      try {
        const body = JSON.parse(response.body);
        
        if (response.statusCode !== 200) {
          console.log('❌ ' + name + ' returned status ' + response.statusCode);
          return resolve({ 
            name: name, 
            success: false, 
            error: 'HTTP ' + response.statusCode,
            response: body 
          });
        }

        if (!body.success) {
          console.log('❌ ' + name + ' API error: ' + body.error);
          return resolve({ 
            name: name, 
            success: false, 
            error: body.error,
            response: body 
          });
        }

        const missingFields = expectedFields.filter(field => 
          !body.data || !(field in body.data)
        );

        if (missingFields.length > 0) {
          console.log('⚠️  ' + name + ' missing fields: ' + missingFields.join(', '));
        }

        const responseTime = response.headers['x-response-time'] || 'Unknown';
        console.log('✅ ' + name + ' passed (' + response.statusCode + ', ' + responseTime + 'ms)');
        
        resolve({ 
          name: name, 
          success: true, 
          statusCode: response.statusCode,
          responseTime: responseTime,
          missingFields: missingFields 
        });

      } catch (parseError) {
        console.log('❌ ' + name + ' JSON parse error: ' + parseError.message);
        resolve({ 
          name: name, 
          success: false, 
          error: 'JSON parse: ' + parseError.message 
        });
      }
    });
  });
}

async function runTests() {
  console.log('🚀 Starting Compliance API Integration Tests');
  console.log('==========================================');

  const tests = [
    {
      name: 'API Index Endpoint',
      path: '/api/compliance',
      expectedFields: ['api_name', 'version', 'endpoints']
    },
    {
      name: 'Compliance Statistics',
      path: '/api/compliance/stats?hours_back=1',
      expectedFields: ['total_validations', 'compliant_count', 'average_score']
    },
    {
      name: 'Recent Validations',
      path: '/api/compliance/validations/recent?limit=5',
      expectedFields: ['validations', 'pagination']
    },
    {
      name: 'Violations Detail',
      path: '/api/compliance/violations/detail?limit=5',
      expectedFields: ['violations', 'summary', 'pagination']
    }
  ];

  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const result = await testEndpoint(test.name, test.path, test.expectedFields);
    results.push(result);
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n📊 Test Results Summary');
  console.log('=========================');
  console.log('✅ Passed: ' + passed);
  console.log('❌ Failed: ' + failed);
  console.log('📈 Success Rate: ' + ((passed / (passed + failed)) * 100).toFixed(1) + '%');

  const successfulTests = results.filter(r => r.success && r.responseTime);
  if (successfulTests.length > 0) {
    const avgResponseTime = successfulTests
      .reduce((sum, r) => sum + parseFloat(r.responseTime), 0) / successfulTests.length;
    console.log('⚡ Average Response Time: ' + avgResponseTime.toFixed(2) + 'ms');
    
    const meetsTarget = avgResponseTime < 500;
    console.log('🎯 Performance Target (< 500ms): ' + (meetsTarget ? '✅ MET' : '❌ NOT MET'));
  }

  if (failed > 0) {
    console.log('\n🔍 Failed Tests Details:');
    const failedResults = results.filter(r => !r.success);
    for (let i = 0; i < failedResults.length; i++) {
      const result = failedResults[i];
      console.log('  • ' + result.name + ': ' + result.error);
    }
  }

  console.log('\n🏁 Test suite completed');
  
  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
