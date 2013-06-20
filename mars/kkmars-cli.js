var redcode = require('./redcode-asm-parser.js');

console.log("Kernkrieg MARS Simulator Started");

console.log(JSON.stringify(redcode.parse(";test \nstep start: equ (4+4);test comment\ntarget: dat.f #0, #0\n")));