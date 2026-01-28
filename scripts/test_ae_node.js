const ae = require('after-effects');
const path = require('path');

// Configure AE Path
// The package usually expects the executable path or tries to find it.
// We'll set it explicitly to be safe.
ae.options.program = "C:\\Program Files\\Adobe\\Adobe After Effects 2026\\Support Files\\AfterFX.exe";
ae.options.errorHandling = true;

console.log("Attempting to talk to After Effects...");
console.log("Program Path:", ae.options.program);

// Simple Alert Test
ae(() => alert("Hello from Node.js via 'after-effects' package!"))
    .then((res) => {
        console.log("Command sent successfully.");
        console.log("Result:", res);
    })
    .catch((err) => {
        console.error("Error communicating with AE:");
        console.error(err);
    });
