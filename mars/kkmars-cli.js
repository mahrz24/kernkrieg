var redcode = require('./redcode-asm.js');

console.log("Kernkrieg MARS Simulator Started");

console.log(JSON.stringify(redcode.assembleFile("./sample.rdc", true)));
