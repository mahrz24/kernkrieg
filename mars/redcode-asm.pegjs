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
        this.aexpression = aexpr;
        this.bexpression = bexpr;
    }

}

assembly_file = list

list = line list / line

line = l:(c:comment { return [[], c]} /
          i:instruction { return [i.instruction,[i.comment]]})
       "\n"
    { return l; }

comment = ";" cmt:[^\n]* { return cmt.join(""); }

instruction = lbl:label? " "* op:operation " "
                aexpr:mode_expr
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
                   ("\n" l:label_list) { return l;} /
                   " "* { return new Array(); } )
    { return lbls.concat([lhd]); }

label_name = lbl:([a-zA-Z] [a-zA-Z0-9]*)
    { return lbl[0] + lbl[1].join(""); }

operation = opc:opcode mod:("." m:modifier {return m;})?
    { return { opcode: opc, modifier: mod}; }

opcode = "dat"i / "mov"i / "add"i / "sub"i / "mul"i / "div"i / "mod"i
         "jmp"i / "jmz"i / "jmn"i / "djn"i / "cmp"i / "slt"i / "spl"i
         "seq"i / "snq"i / "nop"i / "ldp"i / "stp"i /
         "org"i / "equ"i / "end"i /

modifier = "a"i / "b"i / "ab"i / "ba"i / "f"i / "x"i / "i"i

mode_expr = mode? expr

mode = "#" / "$" / "@" / "<" / ">" / "*" / "{" / "}"

expr = term "*" expr / term "/" expr /
       term "+" expr / term "-" expr /
       term "%" expr / term

term =  "(" expr ")" / label_name / number

number = signed_integer / whole_number

signed_integer = "+" whole_number / "-" whole_number

whole_number = [0-9]+