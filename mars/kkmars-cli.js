#!/usr/bin/env node

var redcode = require('./redcode-asm.js');
var MARS = require('./mars.js');
var fs = require('fs');
var _ = require('lodash')._;

var argv = require('optimist')
    .default('core', 8000)
    .default('pspc', 8)
    .default('tiec', 80000)
    .default('lim', 100)
    .default('ii', MARS.random)
    .default('maxt', 8000)
    .default('minsep', 100)
    .default('sep', MARS.random)
    .default('readd', MARS.full)
    .default('writed', MARS.full)
    .default('minw', 1)
    .default('debug', 0)
    .default('dres', 500)
    .argv
;
if(argv.debug > 0)
    console.log("Kernkrieg MARS Simulator Started");

var warriors = [];

_.each(argv._, function(file)
    {
        if(argv.debug > 0)
            console.log("Loading warrior: " + file)


        program = fs.readFileSync(filename, { encoding : "utf8" });

        warriors.push(redcode.assembleString(program));
    });

var initial;
console.log(argv.ii);
if(argv.ii !== MARS.random)
    initial = redcode.assembleString(";redcode\n" + argv.ii).instructions[0];
else
    initial = argv.ii;

var mars = new MARS({
    coreSize: argv.core,
    pSpaceSize: argv.pspc,
    cyclesUntilTie: argv.tiec,
    initialInstruction: initial,
    instructionLimit: argv.lim,
    maxTasks: argv.maxt,
    minSep: argv.minsep,
    initialSep: argv.sep,
    readDist: argv.readd,
    writeDist: argv.writed
    });

_.each(warriors, function(w) { mars.loadWarrior(w,0); });

var result = mars.run(argv.minw,argv.debug, argv.dres);

if(argv.debug > 0)
    console.log("Returned with status: " + result);
else
    console.log(result);