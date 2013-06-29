module.exports = (function(){
    var redcodeParser = require('./redcode-asm-parser.js');
    var _ = require('underscore')._;
    var fs = require('fs');

    var redcode = {
        parser: redcodeParser,
        loadFile: function(filename)
        {
            program = fs.readFileSync(filename, { encoding : "utf8" });

            return redcode.loadString(program);
        },

        loadString: function(program)
        {
            var lines = program.split("\n");
            do
            {
                var line = _.head(lines);
                lines = _.tail(lines);
            } while(line.substring(0,8) != ";redcode");

            program = lines.join("\n");
            console.log(program);
            return redcode.parser.parse(program);
        }
    };
    return redcode;
})();
