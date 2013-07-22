CodeMirror.defineMode('redcode', function() {
  var keywords1 = /^(dat|mov|add|sub|mul|div|mod|jmp|jmz|jmn|djn|cmp|slt|spl|seq|sne|nop|ldp|stp|org|equ|end)\b/i;
  var variables1 = /^(ab|ba|a|b|x|f|i)\b/i;
  var variables2 = /^[$]\b/i;
  var numbers = /^([\da-f]+h|[0-7]+o|[01]+b|\d+)\b/i;

  return {
    startState: function() {
      return {context: 0};
    },
    token: function(stream, state) {
      if (!stream.column())
        state.context = 0;

      if (stream.eatSpace())
        return null;

      var w;

      if (stream.eatWhile(/\w/)) {
        w = stream.current();


        if (variables1.test(w))
          return 'variable';
        else if (variables2.test(w)) {
          return 'variable-2';
        }
        else if (keywords1.test(w)) {
          return 'keyword';
        }
        else if (numbers.test(w)) {
          return 'number';
        } else {
          return null;
        }
      } else if (stream.eat(';')) {
        stream.skipToEnd();
        return 'comment';
      } else {
        stream.next();
      }
      return null;
    }
  };
});

CodeMirror.defineMIME("text/x-z80", "z80");
