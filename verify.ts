import { calculateSmartSplit, calculateEqualSplit } from './src/utils/calculations';

// Fake tenants
const t1 = { id: '1', name: 'Ayo', flatLabel: 'Flat 1', colorIndex: 0 };
const t2 = { id: '2', name: 'Bisi', flatLabel: 'Flat 2', colorIndex: 1 };
const t3 = { id: '3', name: 'Chinedu', flatLabel: 'Flat 3', colorIndex: 2 };

// TEST 1: Smart Split Math & TEST 2: Zero kWh
console.log("=== TEST 1 & 2: SMART SPLIT ===");
const smartTenants = [
    { tenant: t1, kwh: 120 },
    { tenant: t2, kwh: 80 },
    { tenant: t3, kwh: 0 }, // Test 2
];
const totalAmount = 20000;
const smartSplit = calculateSmartSplit(totalAmount, smartTenants);
console.log(JSON.stringify(smartSplit, null, 2));

// sum of shares should equal exactly 20000
const sumSmart = smartSplit.reduce((acc, s) => acc + s.share, 0);
console.log(`Total Share Sum == Total Amount? ${sumSmart === totalAmount} (${sumSmart})`);

// TEST 3: Equal Split Rounding
console.log("\n=== TEST 3: EQUAL SPLIT ===");
const equalAmount = 10000; // 10000 / 3 = 3333.333...
const equalSplit = calculateEqualSplit(equalAmount, 3, [t1.name, t2.name, t3.name]);
console.log(JSON.stringify(equalSplit, null, 2));

const sumEqual = equalSplit.reduce((acc, s) => acc + s.share, 0);
console.log(`Total Share Sum == Total Amount? ${sumEqual === equalAmount} (${sumEqual})`);
