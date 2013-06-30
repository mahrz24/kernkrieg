var redcode = require('./redcode-asm.js');
var MARS = require('./mars.js');

console.log("Kernkrieg MARS Simulator Started");

var prog = redcode.assembleFile("./sample.rdc");

var mars = new MARS(
    10,
    100,
    MARS.random,
    300,
    64,
    5,
    MARS.random,
    MARS.full,
    MARS.full,
    2
    );


console.log(mars.coreDump());