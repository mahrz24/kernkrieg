module.exports = (function(){
    var redcodeParser = require('./redcode-asm-parser.js');
    var _ = require('lodash')._;
    var fs = require('fs');

    function Program(name, author, version, date, strict94, origin, instructions)
    {
        this.name = name;
        this.author = author;
        this.date = date;
        this.version = version;
        this.strict94 = strict94;
        this.instructions = instructions;
        this.origin = origin;
    }

    function reduceExpression(lineNum, labels, definitions, expression)
    {
        if(typeof expression != 'undefined' && typeof expression != 'number')
        {
            if(typeof expression == 'string')
            {
                if(_.has(definitions, expression))
                {
                    return reduceExpression(lineNum, labels, definitions,
                        definitions[expression]);
                }
                else if(_.has(labels, expression))
                {
                    return labels[expression]-lineNum;
                }
                else
                {
                    throw new Error("Label \"" + expression + "\" not found.");
                }
            }
            else if(typeof expression == 'object')
            {
                // Flatten the expression
                expression = _.flatten(expression);
                // Reduce everything except operators and parantheses
                expression = _.map(expression, function(tok)
                {
                    if(_.contains(["*","/","-","+","%","(",")"],tok))
                    {
                        return tok;
                    }
                    else
                    {
                        return reduceExpression(lineNum, labels, definitions,tok);
                    }
                });
                // Flatten again to remove replacements
                expression = _.flatten(expression);
            }
        }
        return expression;
    }

    function evaluateExpression(expression)
    {
        if(typeof expression != 'undefined' && typeof expression != 'number')
            return eval(expression.join(""));
        return expression;
    }

    function reduceInstructions(instructions)
    {
        // Filter pseudo opcodes
        var origin = 0;
        var end = instructions.length;
        var filteredInstructions = [];
        var definitions = {};
        var i, inst;
        for (i=0; i<instructions.length; i++)
        {
            inst = instructions[i];
            if(inst.opcode == "org")
            {
                origin = inst.afield[1];
            }
            else if(inst.opcode == "equ")
            {
                if(inst.labels.length && inst.afield[1])
                {
                    _.forEach(inst.labels, function(lbl)
                        { definitions[lbl] = inst.afield[1]; });
                }
                else
                {
                    // Todo throw exception here
                    throw new Error("Could not find label or definition of equ.");
                }
            }
            else if(inst.opcode == "end")
            {
                if(inst.afield)
                    origin = inst.afield[1];
                break;
            }
            else
            {
                filteredInstructions.push(inst);
            }
        }
        instructions = filteredInstructions;

        // Generate dictionary of labels
        labels = {};
        for (i=instructions.length-1; i>=0; i--)
        {
            inst = instructions[i];
            if(inst.labels.length)
                _.forEach(inst.labels, function(lbl) { labels[lbl] = i; });
        }

        // Now we're ready to reduce the instructions
        for (i=instructions.length-1; i>=0; i--)
        {
            // Remove the labels
            instructions[i].labels = [];

            // Reduce the expressions
            instructions[i].afield[1] =
                evaluateExpression(reduceExpression(i, labels, definitions,
                    instructions[i].afield[1]));
            instructions[i].bfield[1] =
                evaluateExpression(reduceExpression(i, labels, definitions,
                    instructions[i].bfield[1]));
        }

        origin = reduceExpression(0, labels, definitions, origin);

        return {origin: origin, instructions: instructions};
    }

    function validate(program)
    {
        // Checks if the program is a valid assembled redcode program
        // a.k.a redcode load file

        // Check for each instruction whether:
        // * labels are empty
        // * fields are numeric
        // * correct number of fields are used
        // * only valid load file opcodes are used
        _.forEach(program.instructions, function(inst)
        {
            if(inst.labels.length)
                throw new Error("Labels not allowed in load file.");

            if(typeof inst.afield[1] != 'number' && typeof inst.afield[1] != 'undefined')
                throw new Error("Labels & expressions not allowed in load file.");

            if(typeof inst.bfield[1] != 'number' && typeof inst.bfield[1] != 'undefined')
                throw new Error("Labels & expressions not allowed in load file.");

            switch(inst.opcode)
            {
             case "dat":
             case "mov":
             case "add":
             case "sub":
             case "mul":
             case "div":
             case "mod":
             case "jmp":
             case "jmz":
             case "jmn":
             case "djn":
             case "cmp":
             case "slt":
             case "spl":
             case "seq":
             case "snq":
             case "nop":
             case "ldp":
             case "stp":
                 break;
             case "org":
                 throw new Error("Org pseudoopcode should not reach validation. Contact the developer and file a bug report.");
                 break;
             case "equ":
                 throw new Error("Equ pseudoopcode not allowed in load file.");
                 break;
             case "end":
                 throw new Error("End pseudoopcode not allowed in load file.");
                 break;
            }


            if(program.strict94)
            {
                if(_.contains(["seq","snq","nop","ldp","stp"], inst.opcode))
                    throw new Error("Strict mode does not allow the opcode \"" + inst.opcode + "\"");
            }
        });

        return program;
    }

    String.prototype.beginsWith = function(str)
    {
        return this.substring(0,str.length) == str;
    };

    var redcode =
    {
        parser: redcodeParser,
        assembleFile: function(filename, loadFile)
        {
            loadFile = typeof loadFile !== 'undefined' ? loadFile : false;
            program = fs.readFileSync(filename, { encoding : "utf8" });

            return redcode.assembleString(program, loadFile);
        },

        assembleString: function(programString, loadFile, name, author, version, date)
        {
            loadFile = typeof loadFile !== 'undefined' ? loadFile : false;
            // Find the beginning of the program
            var lines = programString.split("\n");
            var line;
            do
            {
                line = _.head(lines);
                lines = _.tail(lines);
            } while(!line.beginsWith(";redcode"));

            programString = lines.join("\n");

            console.log(programString);

            var parsed = _.unzip(redcode.parser.parse(programString));
            var comments = _.filter(parsed[1], function(x) { return x != "";});
            var instructions = _.filter(parsed[0], function(x) { return x != "";});

            console.log(JSON.stringify(instructions));

            // Reduce the instructions (remove labels & eval expressions)
            var reduced = {};
            if(!loadFile)
            {
                reduced = reduceInstructions(instructions);
            }
            else
            {
                var origin = 0;
                var filteredInstructions = [];
                var i, inst;
                for (i=0; i<instructions.length; i++)
                {
                    inst = instructions[i];
                    if(inst.opcode == "org")
                    {
                        if(typeof inst.afield[1] != 'number')
                            throw new Error("Origin needs to be numeric.");
                        origin = inst.afield[1];
                    }
                    else
                    {
                        filteredInstructions.push(inst);
                    }
                }
                instructions = filteredInstructions;

                reduced = {origin: origin, instructions: instructions};
            }

            var strict94 = false;
            name = typeof name !== 'undefined' ? name : "Untitled";
            author = typeof author !== 'undefined' ? author : "Anonymous";
            version = typeof version !== 'undefined' ? version : "1";
            date = (new Date()).toDateString();
            console.log(comments);
            // Parse metadata comments
            _.forEach(comments, function(cmt) {
                if(cmt.toString().beginsWith("name "))
                {
                    name = _.drop(cmt, "name ".length);
                }
                if(cmt.toString().beginsWith("author "))
                {
                    author = _.drop(cmt, "author ".length);
                }
                if(cmt.toString().beginsWith("date "))
                {
                    date = _.drop(cmt, "date ".length);
                }
                if(cmt.toString().beginsWith("version "))
                {
                    version = _.drop(cmt, "version ".length);
                }
                console.log(cmt);
                if(cmt.toString() == "strict94")
                {
                    strict94 = true;
                }
            });

            var result = new Program(name, author, version, date, strict94, reduced.origin, reduced.instructions);
            return validate(result);
        }
    };
    return redcode;
})();
