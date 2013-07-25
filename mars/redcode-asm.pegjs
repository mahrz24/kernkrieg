// modified redcode 94 standard grammar
// based on icws94 standard (http://corewar.co.uk/icws94.htm)
// modifications:
// * labels are followed by a colon ":"
// with the following extensions taken
// from pMARS (http://vyznev.net/corewar/guide.html)
// * { } address modes
// seq snq nop ldp stp opcoces

{
    var Instruction = require("./instruction.js");
}

assembly_file = next_line? l:list { return l; }

list = (l:line next_line lst:list) { return [l].concat(lst)} /
    (l:line next_line?) { return [l];}

next_line = " "* ("\n" " "*)+

line = l:(c:comment { return [[], c]} /
          i:instruction { return [i.instruction,[i.comment]]})
    { return l; }

comment = ";" cmt:[^\n]* { return cmt.join(""); }

instruction = lbl:label? " "* op:operation
                aoperand:(" " " "* expr:mode_expr {return expr;})?
                boperand:("," " "* expr:mode_expr {return expr;})?
                cmt:comment?
    { return { instruction: new Instruction(lbl,
                                            op,
                                            aoperand,
                                            boperand),
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
         "seq"i / "sne"i / "nop"i / "ldp"i / "stp"i /
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