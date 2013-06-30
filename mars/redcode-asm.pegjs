// modified redcode 94 standard grammar
// based on icws94 standard (http://corewar.co.uk/icws94.htm)
// modifications:
// * labels are followed by a colon ":"
// with the following extensions taken
// from pMARS (http://vyznev.net/corewar/guide.html)
// * { } address modes
// seq snq nop ldp stp opcoces

{

    function Instruction(labels,operation,aexpr,bexpr)
    {
        this.labels = labels;
        this.opcode = operation.opcode;
        this.modifier = operation.modifier;
        this.afield = aexpr;
        this.bfield = bexpr;

        this.toString = function()
        {
            var res = this.opcode;
            if(this.modifier)
                res += "." + this.modifier;
            res += " ";
            if(this.afield)
                res += this.afield.join("");
            if(this.bfield)
                res += ", " + this.bfield.join("");
            return res;
        };
    }
}

assembly_file = list

list = (l:line "\n"+ lst:list) { return [l].concat(lst)} /
    (l:line "\n"*) { return [l];}

line = l:(c:comment { return [[], c]} /
          i:instruction { return [i.instruction,[i.comment]]})
    { return l; }

comment = ";" cmt:[^\n]* { return cmt.join(""); }

instruction = lbl:label? " "* op:operation
                aexpr:(" " " "* expr:mode_expr {return expr;})?
                bexpr:("," " "* expr:mode_expr {return expr;})?
                cmt:comment?
    { return { instruction: new Instruction(lbl,
                                            op,
                                            aexpr,
                                            bexpr),
                comment: cmt }; }

label = lbls:label_list ":" { return lbls; }

label_list = lhd:label_name
             lbls:((" "+ l:label_list) { return l;} /
                   " "* { return new Array(); } )
    { return lbls.concat([lhd]); }

label_name = lbl:([a-zA-Z] [a-zA-Z0-9]*)
    { return lbl[0] + lbl[1].join(""); }

operation = opc:opcode mod:("." m:modifier {return m;})?
    { return { opcode: opc.toLowerCase(), modifier: mod.toLowerCase()}; }

opcode = "dat"i / "mov"i / "add"i / "sub"i / "mul"i / "div"i / "mod"i /
         "jmp"i / "jmz"i / "jmn"i / "djn"i / "cmp"i / "slt"i / "spl"i /
         "seq"i / "snq"i / "nop"i / "ldp"i / "stp"i /
         "org"i / "equ"i / "end"i

modifier = "ab"i / "ba"i / "a"i / "b"i  / "f"i / "x"i / "i"i

mode_expr = mode? expr

mode = "#" / "$" / "@" / "<" / ">" / "*" / "{" / "}"

expr = term expr_op expr /
       term

expr_op = " "* eop:("*" / "/" / "+" / "-" / "%") " "* { return eop; }

term =  "(" e:expr ")" / label_name / number

number = signed_integer / natural_number

signed_integer = "+" num:natural_number { return num; }
  / "-" num:natural_number { return -num; }

natural_number = num:([0-9]+) { return parseInt(num.join(""), 10); }