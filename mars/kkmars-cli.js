var redcode = require('./redcode-asm-parser.js');

console.log("Kernkrieg MARS Simulator Started");

console.log(redcode.parse("step start: equ (4+4)\ntarget: dat.f #0, #0\n"));