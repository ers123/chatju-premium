// backend/tests/mansae-integration-test.js
// Test mansae-calculator integration

async function testMansaeCalculator() {
  console.log('🧪 Testing Mansae Calculator Integration\n');

  try {
    // Step 1: Import the calculator (ES6 dynamic import)
    console.log('📦 Importing mansae-calculator...');
    const module = await import('mansae-calculator/mansae.js');
    const calculateMansae = module.default;
    console.log('✅ Import successful\n');

    // Step 2: Test cases
    const testCases = [
      {
        name: 'Test 1: Complete birth info',
        birthDate: '1990-05-15',
        birthTime: '14:30',
        gender: '남',
      },
      {
        name: 'Test 2: Female without time',
        birthDate: '1985-03-20',
        birthTime: '12:00', // Default to noon
        gender: '여',
      },
      {
        name: 'Test 3: Edge case - New Year',
        birthDate: '2000-01-01',
        birthTime: '00:30',
        gender: '남',
      },
    ];

    // Step 3: Run tests
    for (const test of testCases) {
      console.log(`\n--- ${test.name} ---`);
      console.log(`Input: ${test.birthDate} ${test.birthTime} ${test.gender}`);

      try {
        const result = calculateMansae(test.birthDate, test.birthTime, test.gender);

        if (result.error) {
          console.error('❌ Calculation error:', result.error);
          continue;
        }

        console.log('✅ Calculation successful\n');
        console.log('Result:');
        console.log('  Year Pillar:', result.pillars.year.korean, `(${result.pillars.year.element})`);
        console.log('  Month Pillar:', result.pillars.month.korean, `(${result.pillars.month.element})`);
        console.log('  Day Pillar:', result.pillars.day.korean, `(${result.pillars.day.element})`);
        console.log('  Hour Pillar:', result.pillars.hour.korean, `(${result.pillars.hour.element})`);
        console.log('\n  Element Distribution:');
        Object.entries(result.elements).forEach(([elem, count]) => {
          console.log(`    ${elem}: ${count}`);
        });

      } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
      }
    }

    console.log('\n\n✅ All tests completed\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testMansaeCalculator().catch(console.error);
