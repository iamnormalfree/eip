// Simple test script for domain validator
const { DomainValidator, createSingaporeDomainValidator } = require('./lib/compliance/domain-validator');

console.log('Testing Domain Validator...');

try {
  // Test 1: Create a domain validator
  const validator = new DomainValidator({
    allowListDomains: ['mas.gov.sg', '*.gov.sg', 'test.com'],
    enableLogging: false
  });

  console.log('✅ Domain validator created successfully');

  // Test 2: Test URL validation
  const testUrls = [
    'https://mas.gov.sg/regulations',
    'https://agency.gov.sg/info', 
    'https://untrusted.com/page',
    'not-a-valid-url'
  ];

  testUrls.forEach(url => {
    const result = validator.validateUrl(url);
    const status = result.isValid ? 'Valid' : 'Invalid';
    const details = result.reason || result.authorityLevel || 'No reason';
    console.log('🔍 ' + url + ': ' + status + ' (' + details + ')');
  });

  // Test 3: Test Singapore validator
  const sgValidator = createSingaporeDomainValidator();
  const sgResult = sgValidator.validateUrl('https://mas.gov.sg/regulations');
  const sgStatus = sgResult.isValid ? 'Valid' : 'Invalid';
  console.log('🇸🇬 Singapore validator test: ' + sgStatus);

  console.log('🎉 Domain validator tests completed successfully!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}