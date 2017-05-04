// heading (#, ##, ...)

'use strict';

var isSpace = require('../common/utils').isSpace;


module.exports = function heading(state, startLine, endLine, silent) {
  var ch, level, tmp, token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];
  var origPos = pos,
      spaceEnd = 0;


  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  ch  = state.src.charCodeAt(pos);

  if (ch !== 0x23/* # */ || pos >= max) { return false; }

  // count heading level
  level = 1;
  ch = state.src.charCodeAt(++pos);
  while (ch === 0x23/* # */ && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }

  if (level > 6 || (pos < max && !isSpace(ch) && state.src.slice(pos, pos + 6) !== '&nbsp;')) { return false; }
  spaceEnd = pos;
  while (spaceEnd < max){
    if (isSpace(state.src.charCodeAt(spaceEnd))) {
      spaceEnd++;
    }    else if (state.src.slice(spaceEnd, spaceEnd + 6).search('&nbsp;') === 0){
      spaceEnd += 6;
    } else {
      break;
    }
  }
  if (silent) { return true; }
  // Let's cut tails like '    ###  ' from the end of string

  max = state.skipSpacesBack(max, pos);
  tmp = state.skipCharsBack(max, 0x23, pos); // #
  if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) {
    max = tmp;
  }

  state.line = startLine + 1;

  token        = state.push('heading_open', 'h' + String(level), 1);
  token.markup = '########'.slice(0, level);
  token.map    = [ startLine, state.line ];

  token          = state.push('inline', '', 0);
  token.content  = state.src.slice(origPos, spaceEnd).replace(/( |$nbsp;)/g, '\xA0');
  token.map      = [ startLine, state.line ];
  token.children = [];
  token.meta = { markup:true };

  token          = state.push('inline', '', 0);
  token.content  = state.src.slice(spaceEnd, max).trim();
  token.map      = [ startLine, state.line ];
  token.children = [];

  token        = state.push('heading_close', 'h' + String(level), -1);
  token.markup = '########'.slice(0, level);

  return true;
};
