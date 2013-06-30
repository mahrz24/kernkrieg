module.exports = (function(){
    var redcodeAsm = require('./redcode-asm.js');
    var redcodeParser = require('./redcode-asm-parser.js');
    var _ = require('lodash')._;
    var Instruction = require("./instruction.js");

    var MARS = function(coreSize,
        pSpaceSize,
        cyclesUntilTie,
        initialInstruction,
        instructionLimit,
        maxTasks,
        minSep,
        initialSep,
        readDist,
        writeDist,
        warriors)
    {
        if(readDist == MARS.full)
            readDist = coreSize;

        if(writeDist == MARS.full)
            writeDist = coreSize;

        this.coreSize = coreSize;
        this.pSpaceSize = pSpaceSize;
        this.cyclesUntilTie = cyclesUntilTie;
        this.initialInstruction = initialInstruction;
        this.instructionLimit = instructionLimit;
        this.maxTasks = maxTasks;
        this.minSep = minSep;
        this.initialSep = initialSep;
        this.readDist = readDist;
        this.writeDist = writeDist;
        this.warriors = warriors;
        this.loadedWarriors = 0;
        this.loadedWarriorsLength = 0;
        this.activeWarriors = 0;
        this.currentWarrior = 0;
        this.taskQueues = [];
        this.pSpaces = [];

        if(coreSize % pSpaceSize !== 0 && pSpaceSize !== 0)
            throw new Error("PSpace size needs two be a factor of the size of the Core");

        if(coreSize % readDist !== 0)
            throw new Error("Read distance needs two be a factor of the size of the Core");

        if(coreSize % writeDist !== 0)
            throw new Error("Write distance needs two be a factor of the size of the Core");

        this.core = [];
        for(var i=0;i<coreSize;i++)
        {
            if(typeof initialInstruction == "string")
            {
                this.core.push(Instruction.randomInstruction(coreSize));
            }
            else
            {
                this.core.push(initialInstruction);
            }
        }
    };

    MARS.prototype.reset = function()
    {

    };

    MARS.prototype.address = function(integer)
    {
        while(integer < 0)
        {
            integer += this.coreSize;
        }
        return integer % this.coreSize;
    }

    MARS.prototype.setCore = function(integer, instruction)
    {
        this.core[this.address(integer)] = instruction;
    }

    MARS.prototype.loadWarrior = function(program)
    {
        var loadAddress = 0;
        if(this.taskQueues.length)
            loadAddress += _.last(this.taskQueues)[0];

        if(this.initialSep == MARS.random)
        {
            loadAddress += this.minSep +
                Math.floor(Math.random() * (this.coreSize-
                    this.minSep-this.loadedWarriorsLength));
        }
        else
        {
            loadAddress += initialSep;
        }

        for(var i=0;i<program.instructions.length;i++)
        {
            var instruction = program.instructions[i];
            if(instruction.aoperand)
                instruction.aoperand[1] = this.address(instruction.aoperand[1]);
            if(instruction.boperand)
                instruction.boperand[1] = this.address(instruction.boperand[1]);
            this.setCore(loadAddress + i, instruction);
        }
        this.loadedWarriors++;
        this.activeWarriors++;

        this.loadedWarriorsLength += program.instructions.length;
        this.taskQueues.push([loadAddress]);
    };

    MARS.prototype.cycle = function()
    {

    };

    MARS.prototype.coreDump = function()
    {
        var dump = ["==== MARS CORE DUMP ===="];
        for(var i=0;i<this.coreSize;i++)
        {
            dump.push(i + " " + this.core[i].toString());
        }
        dump.push(["=== END OF CORE DUMP ==="]);
        return dump.join("\n");
    };

    MARS.Instruction = Instruction;
    MARS.random = "random";
    MARS.full = "full";
    MARS.none = "none";


    return MARS;
})();