module.exports = (function(){

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

        this.equal = function(other)
        {
            if(this.modifier !== other.modifier)
                return false;
            if(this.opcode !== other.opcode)
                return false;

            if(this.aoperand[0] !== other.aoperand[0])
                return false;
            if(this.boperand[0] !== other.boperand[0])
                return false;

            if(this.aoperand[1] !== other.aoperand[1])
                return false;
            if(this.boperand[1] !== other.boperand[1])
                return false;
            return true;
        }

        this.toString = function()
        {
            var res = this.opcode;
            if(this.modifier == "ab" ||
               this.modifier == "ba")
                res += "." + this.modifier;
            else if(this.modifier)
                res += "." + this.modifier + " ";
            else
                res += "   ";
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
        "spl",
        "seq",
        "sne",
        "slt",
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