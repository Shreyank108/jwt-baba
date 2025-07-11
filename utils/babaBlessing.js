const fs = require('fs');
const path = require('path');
const readline = require('readline');

function babaBlessing(callback) {
  const filePath = path.join(process.cwd(), 'babaji.txt');
  const content = `
Package: jwt-baba
Created by: Shreyank Agrawal
Date: ${new Date().toDateString()}
Description: JWT authentication ka baba.

Yeh sab Shreyank ne akela kiya hai.

To activate baba's blessing, type below:
>>
  `;

  fs.writeFileSync(filePath, content.trim());

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Type "jai baba ki" to activate JWT Baba: ', (answer) => {
    if (answer.toLowerCase().trim() === 'jai baba ki') {
      console.log('🔓 Baba ki kripa se JWT system activate ho gaya!');
      rl.close();
      callback();
    } else {
      console.log('❌ Baba naraz ho gaye. Type correctly.');
      rl.close();
    }
  });
}

module.exports = babaBlessing;