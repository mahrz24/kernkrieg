var redcode = require('./redcode-asm.js');

console.log("Kernkrieg MARS Simulator Started");

var prog = redcode.assembleFile("./sample.rdc");
var loadFile = prog.loadFileString()
var reassembled = redcode.assembleString(loadFile, true);
var reassembledLoadFile = reassembled.loadFileString();
console.log(loadFile);
console.log(reassembledLoadFile);
