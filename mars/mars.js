module.exports = (function(){
    var redcodeAsm = require('./redcode-asm.js');
    var redcodeParser = require('./redcode-asm-parser.js');
    var Instruction = require("./instruction.js");

    var MARS = function(coreSize,
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
        this.coreSize = coreSize;
        this.cyclesUntilTie = cyclesUntilTie;
        this.initialInstruction = initialInstruction;
        this.instructionLimit = instructionLimit;
        this.maxTasks = maxTasks;
        this.minSep = minSep;
        this.initialSep = initialSep;
        this.readDist = readDist;
        this.writeDist = writeDist;
        this.warriors = warriors;

        this.core = [];
        for(var i=0;i<coreSize;i++)
        {
            if(typeof initialInstruction == "string")
            {
                this.core.push(Instruction.randomInstruction());
            }
            else
            {
                this.core.push(initialInstruction);
            }
        }
    };

    MARS.prototype.coreDump = function coreDump()
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