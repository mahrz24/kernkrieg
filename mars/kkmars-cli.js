#!/usr/bin/env node

try
{
    var redcode = require('./redcode-asm.js');
    var MARS = require('./mars.js');
    var fs = require('fs');
    var _ = require('lodash')._;


    var argv = require('optimist')
        .default('file', 1)
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
        .default('samples', 1500)
        .default('seed', MARS.random)
        .argv
    ;
    if(argv.debug > 0)
        console.log("Kernkrieg MARS Simulator Started");

    var warriors = [];


        _.each(argv._, function(filename)
        {
            program = filename;
            if(argv.file)
            {
                if(argv.debug > 0)
                    console.log("Loading warrior: " + filename)

                program = fs.readFileSync(filename, { encoding : "utf8" });
            }
            try
            {
                warriors.push(redcode.assembleString(program));
            }
            catch(e)
            {
                console.log(JSON.stringify({result: "syntaxerror", what: e.toString(), where: filename, line: e.line, column: e.column}));
                process.exit(code=0)
            }
        });


    var initial;

    if(argv.ii == MARS.random)
        initial = argv.ii;
    else
        initial = redcode.assembleString(";redcode\n" + argv.ii).instructions[0];

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
        }, {
            eventTypes: {
                detectWinner: true,
                detectTie: true,
                detectDeath: true
            },
            logTypes: {
                warriorTasks: true,
                warriorOwnerships: true
            }
        });

    _.each(warriors, function(w) { mars.loadWarrior(w,0); });

    var result = mars.run();

    var log = mars.sampleLog(argv.samples);

    var events = mars.events;

    if(argv.debug > 0)
        console.log("Returned with status: " + result);
    else
        console.log(JSON.stringify({result: result, log: log, events: events}));
}
catch(e)
{
    console.log(JSON.stringify({result: "error", what: e.toString()}));
}