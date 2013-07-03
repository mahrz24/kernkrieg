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

    MARS.prototype.setInstruction = function(adr, instruction)
    {
        this.core[this.address(adr)] = instruction;
    }

    MARS.prototype.setOperand = function(adr, isAValue, value)
    {
        if(isAValue)
            this.core[this.address(adr)].aoperand[1] = this.address(value);
        else
            this.core[this.address(adr)].boperand[1] = this.address(value);
    }


    MARS.prototype.decrementOperand = function(adr, isAValue)
    {
        if(isAValue)
            this.core[this.address(adr)].aoperand[1]--;
        else
            this.core[this.address(adr)].boperand[1]--;
    }

    MARS.prototype.getInstruction = function(adr)
    {
        return this.core[this.address(adr)];
    }

    MARS.prototype.incrementA = function(adr)
    {
        return this.core[this.address(adr)].aoperand[1]++;
    }

    MARS.prototype.incrementB = function(adr)
    {
        return this.core[this.address(adr)].boperand[1]++;
    }

    MARS.prototype.decrementA = function(adr)
    {
        return this.core[this.address(adr)].aoperand[1]--;
    }

    MARS.prototype.decrementB = function(adr)
    {
        return this.core[this.address(integer)].boperand[1]--;
    }

    MARS.prototype.loadWarrior = function(program, pSpaceZero)
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
            this.setInstruction(loadAddress + i, instruction);
        }
        this.loadedWarriors++;
        this.activeWarriors++;

        this.loadedWarriorsLength += program.instructions.length;
        this.taskQueues.push([loadAddress]);
        this.pSpaces.push(this.pSpaceSize*[pSpaceZero]);
    };

    MARS.prototype.evaluateOperand = function(pc, operand)
    {
        var addressMode = operand[0];

        switch(addressMode)
        {
        case "#":
            return pc;
        case "":
        case "$":
            return pc+operand[1];
        case "*":
            return pc+operand[1]+this.getInstruction(pc+operand[1]).aoperand[1];
        case "@":
            return pc+operand[1]+this.getInstruction(pc+operand[1]).boperand[1];
        case "{":
            this.decrementA(pc+operand[1]);
            return pc+operand[1]+this.getInstruction(pc+operand[1]).aoperand[1];
        case "}":
            var res =  pc+operand[1]+this.getInstruction(pc+operand[1]).aoperand[1];
            this.incrementA(pc+operand[1]);
            return res;
        case "<":
            this.decrementB(pc+operand[1]);
            return pc+operand[1]+this.getInstruction(pc+operand[1]).boperand[1];
        case ">":
            var res =  pc+operand[1]+this.getInstruction(pc+operand[1]).boperand[1];
            this.incrementB(pc+operand[1]);
            return res;
        }
    }

    MARS.prototype.cycle = function()
    {
        // Get the current task pointer
        var cw = this.currentWarrior;
        var pc = this.taskQueues[cw].shift();
        var instruction = this.getInstruction(pc);

        // Evaluate A-Operand
        var apointer = this.evaluateOperand(pc, instruction.aoperand);
        var ainstruction = this.getInstruction(apointer);

        // Evaluate B-Operand
        var bpointer = this.evaluateOperand(pc, instruction.boperand);
        var binstruction = this.getInstruction(bpointer);

        if(instruction.modifier == "")
        {
            switch(instruction.opcode)
            {
            case "dat":
            case "nop":
                instruction.modifier = "f";
                break;
            case "mov":
            case "seq":
            case "sne":

                if(instruction.aoperand[0] == "#")
                {
                    instruction.modifier = "ab";
                    break;
                }
                if(instruction.boperand[0] == "#")
                {
                    instruction.modifier = "b";
                    break;
                }
                instruction.modifier = "i";
                break;
            case "add":
            case "sub":
            case "mul":
            case "div":
            case "mod":
                if(instruction.aoperand[0] == "#")
                {
                    instruction.modifier = "ab";
                    break;
                }
                if(instruction.boperand[0] == "#")
                {
                    instruction.modifier = "b";
                    break;
                }
                instruction.modifier = "f";
                break;
            case "slt":
            case "ldp":
            case "stp":
                if(instruction.aoperand[0] == "#")
                {
                    instruction.modifier = "ab";
                    break;
                }
                instruction.modifier = "b";
                break;
            case "jmp":
            case "jmz":
            case "jmn":
            case "djn":
            case "spl":
                instruction.modifier = "b";
                break;
            default:
                break;
            }
        }

        if(instruction.modifier == "i" &&
           instruction.opcode != "mov" &&
           instruction.opcode != "seq" &&
           instruction.opcode != "sne" &&
           instruction.opcode != "cmp")
            instruction.modifier = "f";

        var avalue = 0;
        var bvalue = 0;
        var writePointer;
        var writeA;

        switch(instruction.modifier)
        {
            case "a":
                avalue = [ainstruction.aoperand[1]];
                bvalue = [binstruction.aoperand[1]];
                writePointer = [bpointer];
                writeA = [true];
                break;
            case "b":
                avalue = [ainstruction.boperand[1]];
                bvalue = [binstruction.boperand[1]];
                writePointer = [bpointer];
                writeA = [false];
                break;
            case "ab":
                avalue = [ainstruction.aoperand[1]];
                bvalue = [binstruction.boperand[1]];
                writePointer = [bpointer];
                writeA = [false];
                break;
            case "ba":
                avalue = [ainstruction.boperand[1]];
                bvalue = [binstruction.aoperand[1]];
                writePointer = [bpointer];
                writeA = [true];
                break;
            case "f":
                avalue = [ainstruction.aoperand[1],ainstruction.boperand[1]];
                bvalue = [binstruction.aoperand[1],binstruction.boperand[1]];
                writePointer = [bpointer, bpointer];
                writeA = [true, false];
                break;
            case "x":
                avalue = [ainstruction.aoperand[1],ainstruction.boperand[1]];
                bvalue = [binstruction.boperand[1],binstruction.aoperand[1]];
                writePointer = [bpointer, bpointer];
                writeA = [false, true];
                break;
            case "i":
                avalue = ainstruction;
                bvalue = binstruction;
                writePointer = [bpointer];
                writeA = ["instruction"];
                break;
        }

        var pushToQueue = true;
        var split = false;
        var splitPC = pc + 1;
        var newPC = pc + 1;


        for(var i=0;i<writePointer.length;i++)
        {
            switch(instruction.opcode)
            {
            case "dat":
                // Remove warrior from queue
                pushToQueue = false;
                break;
            case "mov":
                if(writeA[i] == "instruction")
                {
                    this.core[writePointer[i]] = avalue;
                }
                else
                {
                    this.setOperand(writePointer[i],writeA[i], avalue);
                }
                break;
            case "add":
                this.setOperand(writePointer[i],writeA[i], avalue+bvalue);
                break;
            case "sub":
                this.setOperand(writePointer[i],writeA[i], avalue-bvalue);
                break;
            case "mul":
                this.setOperand(writePointer[i],writeA[i], avalue*bvalue);
                break;
            case "div":
                if(avalue === 0)
                {
                    pushToQueue = false;
                    break;
                }
                this.setOperand(writePointer[i],writeA[i], bvalue/avalue);
                break;
            case "mod":
                if(avalue === 0)
                {
                    pushToQueue = false;
                    break;
                }
                this.setOperand(writePointer[i],writeA[i], bvalue%avalue);
                break;
            case "jmp":
                newPC = pc+avalue;
                break;
            case "jmz":
                if(bvalue===0 && (i==0 || newPC == pc+avalue))
                    newPC = pc+avalue;
                else
                    newPC = pc+1;
                break;
            case "jmn":
                if(bvalue!==0)
                    newPC = pc+avalue;
                break;
            case "djn":
                bvalue--;
                this.decrementOperand(writePointer[i],writeA[i]);
                if(bvalue!==0)
                    newPC = pc+avalue;
                break;
            case "cmp":
            case "seq":
                if(avalue == bvalue && (i==0 || newPC == pc+2))
                    newPC = pc+2;
                else
                    newPC = 0;
                break;
            case "sne":
                if(avalue !== bvalue)
                    newPC = pc+2;
                break;
            case "slt":
                if(avalue < bvalue)
                    newPC = pc+2;
                break;
            case "spl":
                split = true;
                splitPC = pc+avalue;

            case "nop":
                break;
            case "ldp":
                if(i==0)
                {
                    this.setOperand(writePointer[i],writeA[i],
                        this.pSpaces[cw][avalue%this.pSpaceSize]);
                }
                break;
            case "stp":
                if(i==0 && value != 0)
                {
                    this.pSpaces[cw][bvalue%this.pSpaceSize] = avalue;
                }
                break;
            default:
                throw new Error("Encountered unknown opcode.");
            }
        }

        if(pushToQueue)
            this.taskQueues[cw].push(this.address(newPC));

        if(split)
            this.taskQueues[cw].push(this.address(splitPC));

        if(this.taskQueues[cw].length == 0)
            this.activeWarriors--;

        this.currentWarrior++;
        if(this.currentWarrior>this.loadedWarriors)
            this.currentWarrior = 0;
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