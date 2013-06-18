// modified redcode 94 standard grammar
// based on icws94 standard (http://corewar.co.uk/icws94.htm)
// modifications:
// * labels are followed by a colon ":"
// with the following extensions taken
// from pMARS (http://vyznev.net/corewar/guide.html)


assembly_file = list

list = line list / line

line = (comment / instruction) "\n"

comment = ";" [^\n]*

instruction = lbl:label? " "* op:operation " "
                aexp:mode_expr
                bexp:("," " "* bexp:mode_expr {return bexp;})?
                cmt:comment? { return lbl + op + aexp + bexp + cmt; }

label = lbls:label_list ":" { return lbls; }

label_list = lhd:label_name
             lbls:((" "+ l:label_list) { return l;} /
                   ("\n" l:label_list) { return l;} /
                   " "* { return new Array(); } ) { return lhd + lbls; }

label_name = lbl:([a-zA-Z] [a-zA-Z0-9]*) { return lbl[0] + lbl[1].join(""); }

operation = opcode "." modifier / opcode

opcode = "dat"i / "mov"i / "add"i / "sub"i / "mul"i / "div"i / "mod"i
         "jmp"i / "jmz"i / "jmn"i / "djn"i / "cmp"i / "slt"i / "spl"i
         "org"i / "equ"i / "end"i

modifier = "a"i / "b"i / "ab"i / "ba"i / "f"i / "x"i / "i"i

mode_expr = mode? expr

mode = "#" / "$" / "@" / "<" / ">"

expr = term "*" expr / term "/" expr /
       term "+" expr / term "-" expr /
       term "%" expr / term

term =  "(" expr ")" / label_name / number

number = signed_integer / whole_number

signed_integer = "+" whole_number / "-" whole_number

whole_number = [0-9]+