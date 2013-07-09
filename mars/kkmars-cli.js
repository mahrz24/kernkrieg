#!/usr/bin/env node

var redcode = require('./redcode-asm.js');
var MARS = require('./mars.js');
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

console.log("Kernkrieg MARS Simulator Started");
var warriors = [];

_.each(argv._, function(file)
    {
        console.log("Loading warrior: " + file)
        warriors.push(redcode.assembleFile(file));
    });

var initial;
console.log(argv.ii);
if(argv.ii !== MARS.random)
    initial = redcode.assembleString(";redcode\n" + argv.ii).instructions[0];
else
    initial = argv.ii;

var mars = new MARS(
    argv.core,
    argv.pspc,
    argv.tiec,
    initial,
    argv.lim,
    argv.maxt,
    argv.minsep,
    argv.sep,
    argv.readd,
    argv.writed
    );

_.each(warriors, function(w) { mars.loadWarrior(w,0); });

var result = mars.run(argv.minw,argv.debug, argv.dres);

if(argv.debug > 0)
    console.log("Returned with status: " + result);
else
    console.log(result);