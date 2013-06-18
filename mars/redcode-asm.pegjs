// modified redcode 94 standard grammar
// based on icws94 standard (http://corewar.co.uk/icws94.htm)
// modifications:
// * labels are followed by a colon ":"
// with the following extensions taken
// from pMARS (http://vyznev.net/corewar/guide.html)
// * { } address modes
// seq snq nop ldp stp opcoces

assembly_file = list

list = line list / line

line = (comment / instruction) "\n"

comment = ";" [^\n]*

instruction = lbl:label? " "* op:operation " "
                aexp:mode_expr
                bexp:("," " "* bexp:mode_expr {return bexp;})?
                cmt:comment? { return { "labels" : JSON.stringify(lbl),
                                        "opcode" : op,
                                        "aexp" : aexp,
                                        "bexp" : bexp,
                                        "cmt" : cmt }; }

label = lbls:label_list ":" { return lbls; }

label_list = lhd:label_name
             lbls:((" "+ l:label_list) { return l;} /
                   ("\n" l:label_list) { return l;} /
                   " "* { return new Array(); } ) { return lbls.concat([lhd]); }

label_name = lbl:([a-zA-Z] [a-zA-Z0-9]*) { return { "label" : lbl[0] + lbl[1].join("")}; }

operation = opcode "." modifier / opcode

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