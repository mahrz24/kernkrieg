var redcode = require('./redcode-asm.js');
var MARS = require('./mars.js');

console.log("Kernkrieg MARS Simulator Started");

var prog = redcode.assembleFile("./sample.rdc");

console.log(prog.loadFileString());

var mars = new MARS(
    20,
    0,
    100,
    MARS.Instruction.directInstruction("dat"),
    300,
    64,
    5,
    MARS.random,
    MARS.full,
    MARS.full,
    2
    );

mars.loadWarrior(prog);
//mars.loadWarrior(prog);
console.log(mars.coreDump());
mars.cycle();

console.log(mars.coreDump());