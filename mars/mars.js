module.exports = (function(){
    var redcodeAsm = require('./redcode-asm.js');
    var redcodeParser = require('./redcode-asm-parser.js');
    var _ = require('lodash')._;
    var sprintf = require("sprintf-js").sprintf;
    var Instruction = require("./instruction.js");

    var clone = function(obj) {
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            var copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            var copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    var MARS = function(config, runtimeSettings)
    {
        if(config.readDist == MARS.full || config.readDist == -1)
            config.readDist = config.coreSize;

        if(config.writeDist == MARS.full || config.writeDist == -1)
            config.writeDist = config.coreSize;

        if(config.initialSep == -1)
            config.initialSep = MARS.random;

        this.coreSize = config.coreSize;
        this.pSpaceSize = config.pSpaceSize;
        this.cyclesUntilTie = config.cyclesUntilTie;
        this.initialInstruction = config.initialInstruction;
        this.instructionLimit = config.instructionLimit;
        this.maxTasks = config.maxTasks;
        this.curMaxTasks = 0;
        this.minSep = config.minSep;
        this.initialSep = config.initialSep;
        this.readDist = config.readDist;
        this.writeDist = config.writeDist;
        this.loadedWarriors = 0;
        this.loadedWarriorsLength = 0;
        this.activeWarriors = 0;
        this.currentWarrior = 0;
        this.taskQueues = [];
        this.coreOwnership = [];
        this.pSpaces = [];
        this.curCycle = -1;
        this.minWarriors = runtimeSettings.minWarriors;
        this.eventTypes = runtimeSettings.eventTypes;
        this.logTypes = runtimeSettings.logTypes;
        this.running = false;
        this.events = [];
        this.logData = {};
        this.savepoints = [];
        this.minSavepointStep = 8;
        this.savepointStep = this.minSavepointStep;
        this.nextSavepoint = this.minSavepointStep;

        if(this.coreSize % this.pSpaceSize !== 0)
            throw new Error("PSpace size needs two be a factor of the size of the Core");

        if(this.coreSize % this.readDist !== 0)
            throw new Error("Read distance needs two be a factor of the size of the Core");

        if(this.coreSize % this.writeDist !== 0)
            throw new Error("Write distance needs two be a factor of the size of the Core");


        this.coreOwner = [];
        this.core = [];
        for(var i=0;i<this.coreSize;i++)
        {
            if(typeof config.initialInstruction == "string")
            {
                this.core.push(Instruction.randomInstruction(config.coreSize));
            }
            else
            {
                this.core.push(clone(config.initialInstruction));
            }
            this.coreOwner.push(-1);
        }
    };

    MARS.prototype.loadWarrior = function(program, pSpaceZero)
    {
        var loadAddress = 0;
        if(this.taskQueues.length)
            loadAddress += _.last(this.taskQueues)[0];


        var loadLength = Math.min(this.instructionLimit, program.instructions.length);


        if(this.initialSep == MARS.random)
        {
            loadAddress += this.minSep +
                Math.floor(Math.random() * (this.coreSize-
                    this.minSep-this.loadedWarriorsLength-loadLength));
        }
        else
        {
            loadAddress += this.initialSep;
        }

        this.currentWarrior = this.loadedWarriors;
        this.coreOwnership.push(0);

        for(var i=0;i<loadLength;i++)
        {
            var instruction = program.instructions[i];
            if(instruction.aoperand)
            {
                instruction.aoperand[1] = this.address(instruction.aoperand[1]);
                if(instruction.aoperand[0] == '$')
                    instruction.aoperand[0] = '';
            }
            if(instruction.boperand)
            {
                instruction.boperand[1] = this.address(instruction.boperand[1]);
                if(instruction.boperand[0] == '$')
                    instruction.boperand[0] = '';
            }
            this.setInstruction(loadAddress + i, instruction);
        }
        this.loadedWarriors++;
        this.activeWarriors++;

        this.loadedWarriorsLength += program.instructions.length;
        this.taskQueues.push([this.address(loadAddress+program.origin)]);


        if(this.curMaxTasks == 0)
            this.curMaxTasks = 1;

        var pSpace = [];
        for(var i=0;i<this.pSpaceSize;i++)
            pSpace.push(pSpaceZero);
        this.pSpaces.push(pSpace);

        return [this.address(loadAddress), this.address(loadAddress+loadLength-1)];
    };

    MARS.prototype.run = function()
    {
        if (this.curCycle == -1) {
            this.initialSnapshot = this.makeSnapshot();
        }
        this.running = true;
        while(this.running)
        {
            this.runCycle();
        }

        return this.events[this.events.length - 1];
    };

    MARS.prototype.runTo = function(targetCycle, breakOnEvent)
    {
        var startCycle = this.curCycle;
        var breakEvents = [];
        var backwards = targetCycle < startCycle;

        if (backwards && breakOnEvent) {
            for (var i = this.events.length - 1; i >= 0; i--) {
                var event = this.events[i];
                if (event.cycle < startCycle) {
                    if (event.cycle < targetCycle)
                        break;
                    targetCycle = event.cycle;
                    breakEvents.push(event);
                }
            }
        }

        if (this.curCycle == -1) {
            this.initialSnapshot = this.makeSnapshot();
        }

        var bestSavepoint = null;
        var bestSavepointCycle = backwards ? -1 : this.curCycle;

        var eventLength = this.events.length;

        for (var i = 0; i < this.savepoints.length; i++) {
            var savepoint = this.savepoints[i];
            if (!backwards && breakOnEvent && savepoint.events.length > eventLength) {
                continue;
            }
            if (savepoint.curCycle <= targetCycle) {
                if (bestSavepointCycle < savepoint.curCycle) {
                    bestSavepoint = savepoint;
                    bestSavepointCycle = savepoint.curCycle;
                }
            }
        }

        if (bestSavepoint === null && backwards) {
            bestSavepoint = this.initialSnapshot;
        }

        if (bestSavepoint !== null) {
            this.loadSnapshot(bestSavepoint);
            this.savepointStep = this.minSavepointStep;
            this.nextSavepoint = this.curCycle + this.savepointStep;
        }


        while(this.curCycle != targetCycle) {
            this.runCycle();
            if (this.curCycle == this.nextSavepoint) {
                this.savepoints.push(this.makeSnapshot());
                if (this.savepoints.length > 100)
                    this.savepoints.shift();
                this.savepointStep <<= 1;
                this.nextSavepoint += this.savepointStep;
            }
            if (this.events.length != eventLength && breakOnEvent && !backwards) {
                breakEvents = this.events.slice(eventLength);
                break;
            }
        }

        return breakEvents;
    }

    MARS.prototype.runCycle = function()
    {
        this.curCycle += 1;
        this.cycle();

        this.logPerWarrior('warriorTasks', function(w) { return this.taskQueues[w].length; });
        this.logPerWarrior('warriorOwnerships', function(w) { return this.coreOwnership[w]; });

        if (this.eventTypes.detectTie &&
            this.running && this.curCycle == this.cyclesUntilTie)
        {
            this.event({halt: true, event: 'tie'});
        }
    };

    MARS.prototype.event = function(event)
    {
        this.events.push({cycle: this.curCycle, event: event});
        if (event.halt) {
            this.running = false;
        }
    };

    MARS.prototype.log = function(type, value)
    {
        if (this.logTypes[type]) {
            var data = this.logData[type];
            if (data === undefined) {
                data = [];
                this.logData[type] = data;
            }
            data[this.curCycle] = value;
        }
    };

    MARS.prototype.logPerWarrior = function(type, fn)
    {
        if (this.logTypes[type]) {
            var value = [];
            for(var w=0;w<this.loadedWarriors;w++)
            {
                value.push(fn.call(this, w));
            }
            this.log(type, value);
        }
    };

    MARS.prototype.sampleLog = function(maxSamples)
    {
        var sampleCount = Math.min(maxSamples, this.curCycle);

        var resampled = {cycle: []};

        for (var t in this.logData) {
            resampled[t] = [];
        }

        for (var i = 0; i < sampleCount; i++) {
            var samplePoint = (i * this.curCycle / (sampleCount - 1)) | 0;
            for (var t in this.logData) {
                resampled.cycle[i] = samplePoint;
                resampled[t][i] = this.logData[t][samplePoint];
            }
        }

        return resampled;
    };

    MARS.prototype.makeSnapshot = function()
    {
        var snapshot = {
            curMaxTasks: this.curMaxTasks,
            activeWarriors: this.activeWarriors,
            currentWarrior: this.currentWarrior,
            taskQueues: this.taskQueues,
            pSpaces: this.pSpaces,
            curCycle: this.curCycle,
            coreOwner: this.coreOwner,
            coreOwnership: this.coreOwnership,
            core: this.core,
            events: this.events
        };
        return clone(snapshot);
    };

    MARS.prototype.loadSnapshot = function(snapshot)
    {
        var copy = clone(snapshot);
        for (var v in copy) {
            this[v] = copy[v];
        }
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
        this.claimOwnership(adr, this.currentWarrior);
        this.core[this.address(adr)] = clone(instruction);
    }

    MARS.prototype.setOperand = function(adr, isAValue, value)
    {
        this.claimOwnership(adr, this.currentWarrior);
        if(isAValue)
            this.core[this.address(adr)].aoperand[1] = this.address(value);
        else
            this.core[this.address(adr)].boperand[1] = this.address(value);
    }


    MARS.prototype.decrementOperand = function(adr, isAValue)
    {
        this.claimOwnership(adr, this.currentWarrior);
        if(isAValue)
            this.core[this.address(adr)].aoperand[1]--;
        else
            this.core[this.address(adr)].boperand[1]--;
    }

    MARS.prototype.getInstruction = function(adr)
    {
        return clone(this.core[this.address(adr)]);
    }

    MARS.prototype.incrementA = function(adr)
    {
        this.claimOwnership(adr, this.currentWarrior);
        return this.core[this.address(adr)].aoperand[1]++;
    }

    MARS.prototype.incrementB = function(adr)
    {
        this.claimOwnership(adr, this.currentWarrior);
        return this.core[this.address(adr)].boperand[1]++;
    }

    MARS.prototype.decrementA = function(adr)
    {
        this.claimOwnership(adr, this.currentWarrior);
        return this.core[this.address(adr)].aoperand[1]--;
    }

    MARS.prototype.decrementB = function(adr)
    {
        this.claimOwnership(adr, this.currentWarrior);
        return this.core[this.address(adr)].boperand[1]--;
    }

    MARS.prototype.claimOwnership = function(adr, warrior)
    {
        if(this.coreOwner[this.address(adr)] != -1)
            this.coreOwnership[this.coreOwner[this.address(adr)]]--;
        this.coreOwnership[warrior]++;
        this.coreOwner[this.address(adr)] = warrior;
    }


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
        if(!this.taskQueues.length)
            return;


        // Get the current task pointer
        var cw = this.currentWarrior;

        if(!this.taskQueues[cw].length)
            return;

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
            case "cmp":
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
            case "spl":
            case "jmz":
            case "jmn":
            case "djn":
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
                    this.core[this.address(writePointer[i])] = avalue;
                    this.claimOwnership(writePointer[i], cw);
                }
                else
                {
                    this.setOperand(writePointer[i],writeA[i], avalue[i]);
                }
                break;
            case "add":
                this.setOperand(writePointer[i],writeA[i], avalue[i]+bvalue[i]);
                break;
            case "sub":
                this.setOperand(writePointer[i],writeA[i], bvalue[i]-avalue[i]);
                break;
            case "mul":
                this.setOperand(writePointer[i],writeA[i], avalue[i]*bvalue[i]);
                break;
            case "div":
                if(avalue[i] === 0)
                {
                    pushToQueue = false;
                    break;
                }
                this.setOperand(writePointer[i],writeA[i], bvalue[i]/avalue[i]);
                break;
            case "mod":
                if(avalue[i] === 0)
                {
                    pushToQueue = false;
                    break;
                }
                this.setOperand(writePointer[i],writeA[i], bvalue[i]%avalue[i]);
                break;
            case "jmp":
                newPC = apointer;
                break;
            case "jmz":
                if(bvalue[i]===0 && (i==0 || newPC == apointer))
                    newPC = apointer;
                else
                    newPC = pc+1;
                break;
            case "jmn":
                if(bvalue[i]!==0)
                    newPC = apointer;
                break;
            case "djn":
                bvalue[i]--;
                this.decrementOperand(writePointer[i],writeA[i]);
                if(bvalue[i]!==0)
                    newPC = apointer;
                break;
            case "cmp":
            case "seq":
                if(writeA[i] == "instruction")
                {
                    if(avalue.equal(bvalue))
                        newPC = pc+2;
                    else
                        newPC = pc+1;
                }
                else
                {
                    if(avalue[i] == bvalue[i] && (i==0 || newPC == pc+2))
                        newPC = pc+2;
                    else
                        newPC = pc+1;
                }
                break;
            case "sne":
                if(avalue[i] !== bvalue[i])
                    newPC = pc+2;
                break;
            case "slt":
                if(avalue[i] < bvalue[i])
                    newPC = pc+2;
                break;
            case "spl":
                split = true;
                splitPC = apointer;

            case "nop":
                break;
            case "ldp":
                if(i==0)
                {
                    this.setOperand(writePointer[i],writeA[i],
                        this.pSpaces[cw][avalue[i]%this.pSpaceSize]);
                }
                break;
            case "stp":
                if(i==0 && bvalue[i] != 0)
                {
                    this.pSpaces[cw][bvalue[i]%this.pSpaceSize] = avalue;
                }
                break;
            default:
                throw new Error("Encountered unknown opcode.");
            }
        }

        if(pushToQueue)
            this.taskQueues[cw].push(this.address(newPC));
        else if(this.taskQueues[cw].length == this.curMaxTasks)
            this.curMaxTasks--;

        if(split && this.taskQueues[cw].length < this.maxTasks)
        {
            this.taskQueues[cw].push(this.address(splitPC));
            if(this.taskQueues[cw].length > this.curMaxTasks)
                this.curMaxTasks++;
        }

        if(this.taskQueues[cw].length == 0)
        {
            this.activeWarriors--;

            if (this.eventTypes.detectDeath) {
                this.event({event: 'death', warrior: cw});
            }
            if (this.eventTypes.detectWinner && this.activeWarriors == 1) {
                var winner;
                for(var w=0;w<this.loadedWarriors;w++)
                {
                    if(this.taskQueues[w].length > 0)
                    {
                        winner = w;
                        break;
                    }
                }

                this.event({halt: true, event: 'won', winner: winner});
            }
        }

        do
        {
            this.currentWarrior++;
            if(this.currentWarrior>=this.loadedWarriors)
                this.currentWarrior = 0;
        } while(this.taskQueues[this.currentWarrior].length == 0 && this.currentWarrior != cw);
    };

    MARS.prototype.coreDump = function()
    {
        var dump = ["======== MARS CORE DUMP ========"];
        dump.push("Loaded Warriors: " + this.loadedWarriors);
        dump.push("Active Warriors: " + this.activeWarriors);
        dump.push("Current Warrior: " + this.currentWarrior);
        dump.push("----------- PSPACES ------------");
        for(var i=0;i<this.pSpaces.length;i++)
        {
            dump.push(i + ": " + this.pSpaces[i].join(" "));
        }
        dump.push("------------ CORE --------------");
        for(var i=0;i<this.coreSize;i++)
        {
            var l = "";
            for(var w=0;w<this.loadedWarriors;w++)
            {
                var warriorIsHere = false;
                var tasks = [];
                for(var t=0;t<this.taskQueues[w].length;t++)
                {
                    if(this.taskQueues[w][t] == i)
                    {
                        warriorIsHere = true;
                        tasks.push(t);
                    }
                }
                if(warriorIsHere)
                {
                    l += w + ":";
                    for(var t=0;t<tasks.length;t++)
                        l += tasks[t] + ">";
                }
            }

            for(var j=l.length;j<(this.curMaxTasks*2+3)*this.activeWarriors;j++)
                l = l + " ";

            dump.push(sprintf("%s %03u (%2d) %s", l, i, this.coreOwner[i], this.core[i].toString()));
        }
        dump.push("======= END OF CORE DUMP =======");
        return dump.join("\n");
    };

    MARS.Instruction = Instruction;
    MARS.random = "random";
    MARS.full = "full";
    MARS.none = "none";


    return MARS;
})();
