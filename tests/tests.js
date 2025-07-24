// test.js - This file contains intentionally bad code to test security checking

// This is dangerous code that ESLint should catch
const expression = '1 + 1';
eval(`console.log(${expression})`); // ESLint should flag this as dangerous

// This is also dangerous
const userInput = "alert('hacked!')";
eval(userInput); // Another dangerous eval usage

console.log("If ESLint is working, it should complain about the eval() calls above");