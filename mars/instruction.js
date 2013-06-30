module.exports = (function(){
    var MAX_INT = 2^32;
    Array.prototype.randomElement = function()
    {
        return this[Math.floor(Math.random() * this.length)];
    }

    var Instruction = function Instruction(labels,operation,aoperand,boperand)
    {
        this.labels = labels;
        this.opcode = operation.opcode;
        this.modifier = operation.modifier;
        this.aoperand = aoperand;
        this.boperand = boperand;

        this.toString = function()
        {
            var res = this.opcode;
            if(this.modifier)
                res += "." + this.modifier;
            res += " ";
            if(this.aoperand)
                res += this.aoperand.join("");
            if(this.boperand)
                res += ", " + this.boperand.join("");
            return res;
        };
    }

    Instruction.directInstruction = function(opcode)
    {
        return new Instruction([],
        {opcode: opcode, modifier: ""}, ["",0], ["",0]);
    }

    Instruction.randomInstruction = function(coreSize)
    {
        return new Instruction([],
            {opcode: Instruction.opcodes.randomElement(),
             modifier: Instruction.modifiers.randomElement()},
            [Instruction.addressModes.randomElement(),
             Math.floor(Math.random()*coreSize)],
            [Instruction.addressModes.randomElement(),
             Math.floor(Math.random()*coreSize)]);
    }

    Instruction.opcodes = [
        "dat",
        "mov",
        "add",
        "sub",
        "mul",
        "div",
        "mod",
        "jmp",
        "jmz",
        "jmn",
        "djn",
        "cmp",
        "slt",
        "spl",
        "seq",
        "snq",
        "nop",
        "ldp",
        "stp"];

    Instruction.opcodesStrict94 = [
        "dat",
        "mov",
        "add",
        "sub",
        "mul",
        "div",
        "mod",
        "jmp",
        "jmz",
        "jmn",
        "djn",
        "cmp",
        "slt",
        "spl"];

    Instruction.modifiers = ["ab","ba","a","b","f","x","i"];
    Instruction.addressModes = ["#","$","@","<",">","*","{","}"];
    Instruction.addressModesStrict94 = ["#","$","@","<",">"];


    return Instruction;
})();