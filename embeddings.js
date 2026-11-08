var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// node_modules/@huggingface/tokenizers/dist/tokenizers.mjs
var DictionarySplitter = class {
  /**
   * @param dictionary The dictionary of words to use for splitting.
   */
  constructor(dictionary) {
    this.trie = this._build_trie(dictionary);
  }
  /**
   * Builds a trie from the given dictionary.
   * @param dictionary The dictionary of words to build the trie from.
   * @returns The root node of the trie.
   * @private
   */
  _build_trie(dictionary) {
    const trie = /* @__PURE__ */ Object.create(null);
    for (const word of dictionary) {
      let node = trie;
      for (let i = 0; i < word.length; ++i) {
        const char = word[i];
        node = node[char] ??= /* @__PURE__ */ Object.create(null);
      }
      node.end = word;
    }
    return trie;
  }
  /**
   * Splits the input text into tokens based on the dictionary.
   * @param text The input text to split.
   * @returns An array of tokens.
   */
  split(text) {
    const result = [];
    const n = text.length;
    let start = 0;
    let i = 0;
    while (i < n) {
      let node = this.trie;
      let match = null;
      let j = i;
      while (j < n && (node = node[text[j]])) {
        if (node.end) {
          match = node.end;
        }
        ++j;
      }
      if (match) {
        if (i > start) {
          result.push(text.slice(start, i));
        }
        result.push(match);
        i += match.length;
        start = i;
      } else {
        ++i;
      }
    }
    if (start < n) {
      result.push(text.slice(start));
    }
    return result;
  }
};
var DictionarySplitter_default = DictionarySplitter;
var AddedToken = class {
  /**
   * Creates a new instance of AddedToken.
   * @param config Added token configuration object.
   */
  constructor(config) {
    this.content = config.content;
    this.id = config.id;
    this.single_word = config.single_word ?? false;
    this.lstrip = config.lstrip ?? false;
    this.rstrip = config.rstrip ?? false;
    this.special = config.special ?? false;
    this.normalized = config.normalized ?? !this.special;
  }
};
var AddedToken_default = AddedToken;
var compile_unicode_regexp = (source, flags) => {
  try {
    return new RegExp(source, flags);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    const property_names = /* @__PURE__ */ new Map();
    const rewritten = source.replace(
      /(\\[pP])\{([^}=]+)\}/g,
      (text, p, n, offset) => {
        let preceding_backslashes = 0;
        for (let i = offset - 1; i >= 0 && source[i] === "\\"; --i) {
          ++preceding_backslashes;
        }
        if (preceding_backslashes % 2 === 1) return text;
        let property_name = property_names.get(n);
        if (property_name === void 0) {
          try {
            new RegExp(`\\p{${n}}`, "u");
            property_name = n;
          } catch {
            property_name = `Script=${n}`;
          }
          property_names.set(n, property_name);
        }
        return `${p}{${property_name}}`;
      }
    );
    if (rewritten === source) throw error;
    try {
      return new RegExp(rewritten, flags);
    } catch {
      throw error;
    }
  }
};
var clean_up_tokenization = (text) => text.replace(/ \./g, ".").replace(/ \?/g, "?").replace(/ \!/g, "!").replace(/ ,/g, ",").replace(/ \' /g, "'").replace(/ n't/g, "n't").replace(/ 'm/g, "'m").replace(/ 's/g, "'s").replace(/ 've/g, "'ve").replace(/ 're/g, "'re");
var create_pattern = (pattern, invert = true) => {
  if (pattern.Regex !== void 0) {
    const regex = rewrite_oniguruma_to_js(
      normalize_bloom_split_char_class(pattern.Regex)
    );
    return compile_unicode_regexp(regex, "gu");
  } else if (pattern.String !== void 0) {
    const escaped = escape_reg_exp(pattern.String);
    return new RegExp(invert ? escaped : `(${escaped})`, "gu");
  } else {
    console.warn("Unknown pattern type:", pattern);
    return null;
  }
};
var UNICODE_WORD_CHARS_IN_CLASS = "\\p{Alphabetic}\\p{M}\\p{Nd}\\p{Pc}";
var UNICODE_WORD_CHARS = `${UNICODE_WORD_CHARS_IN_CLASS}\\u00B2\\u00B3\\u00B9\\u00BC-\\u00BE`;
var UNICODE_WORD_CLASS = `[${UNICODE_WORD_CHARS}]`;
var UNICODE_NON_WORD_CLASS = `[^${UNICODE_WORD_CHARS}]`;
var UNICODE_WORD_BOUNDARY = `(?:(?<!${UNICODE_WORD_CLASS})(?=${UNICODE_WORD_CLASS})|(?<=${UNICODE_WORD_CLASS})(?!${UNICODE_WORD_CLASS}))`;
var UNICODE_NON_WORD_BOUNDARY = `(?:(?<!${UNICODE_WORD_CLASS})(?!${UNICODE_WORD_CLASS})|(?<=${UNICODE_WORD_CLASS})(?=${UNICODE_WORD_CLASS}))`;
var LINE_START_ANCHOR = "(?:(?<![\\s\\S])|(?<=\\n))";
var LINE_END_ANCHOR = "(?:(?=\\n)|(?![\\s\\S]))";
var HEX_DIGIT_CHARS = "0-9A-Fa-f";
var ESCAPE_REWRITES = /* @__PURE__ */ new Map([
  ["A", "(?<![\\s\\S])"],
  ["z", "(?![\\s\\S])"],
  ["Z", "(?=\\n?(?![\\s\\S]))"],
  // \Z permits a single optional final \n (not \r\n)
  ["h", `[${HEX_DIGIT_CHARS}]`],
  ["H", `[^${HEX_DIGIT_CHARS}]`],
  ["w", UNICODE_WORD_CLASS],
  ["W", UNICODE_NON_WORD_CLASS],
  ["d", "\\p{Nd}"],
  ["D", "\\P{Nd}"],
  ["s", "\\p{White_Space}"],
  // JS \s wrongly adds U+FEFF and misses \x85
  ["S", "\\P{White_Space}"],
  ["b", UNICODE_WORD_BOUNDARY],
  ["B", UNICODE_NON_WORD_BOUNDARY],
  ["a", "\\x07"],
  ["e", "\\x1B"]
]);
var CLASS_ESCAPE_REWRITES = /* @__PURE__ */ new Map([
  ["h", HEX_DIGIT_CHARS],
  ["w", UNICODE_WORD_CHARS_IN_CLASS],
  ["d", "\\p{Nd}"],
  ["D", "\\P{Nd}"],
  ["s", "\\p{White_Space}"],
  ["S", "\\P{White_Space}"],
  ["a", "\\x07"],
  ["e", "\\x1B"]
]);
var CLASS_COMPLEMENT_ALTERNATIVES = /* @__PURE__ */ new Map([
  ["W", `[^${UNICODE_WORD_CHARS_IN_CLASS}]`],
  ["H", `[^${HEX_DIGIT_CHARS}]`]
]);
var RAW_WHITESPACE_ESCAPES = /* @__PURE__ */ new Map([
  ["\n", "\\n"],
  ["\r", "\\r"],
  ["	", "\\t"],
  ["\f", "\\f"],
  ["\v", "\\v"]
]);
var POSIX_CLASS_FRAGMENTS = /* @__PURE__ */ new Map([
  ["alpha", "\\p{Alphabetic}"],
  ["alnum", "\\p{Alphabetic}\\p{Nd}"],
  ["digit", "\\p{Nd}"],
  ["lower", "\\p{Lowercase}"],
  ["upper", "\\p{Uppercase}"],
  ["space", "\\p{White_Space}"],
  ["blank", "\\t\\p{Zs}"],
  ["punct", "\\p{P}\\p{S}"],
  ["cntrl", "\\p{Cc}"],
  ["word", UNICODE_WORD_CHARS_IN_CLASS],
  ["xdigit", HEX_DIGIT_CHARS]
]);
var JS_SYNTAX_CHARS = "^$\\.*+?()[]{}|/";
var GROUP_PREFIX_RE = /^\(\?(?:<[=!]|<[A-Za-z_][A-Za-z0-9_]*>|[:=!>])/;
var BRACED_ESCAPE_RE = /^\\([pPxu])\{([^}]*)\}/;
var QUANTIFIER_BRACE_RE = /^\{(\d+(?:,\d*)?|,\d+)\}/;
var POSIX_BRACKET_RE = /^\[:(\^?)(\p{Alphabetic}+):\]/u;
var EMPTY_NEGATED_POSIX_BRACKET_RE = /^\[:\^:\]/;
var UNSUPPORTED_POSIX_BRACKET_RE = /^\[(?:\.[^\]]*\.\]|=[^\]]*=\])/;
var FIXED_WIDTH_ESCAPE_RE = /^(?:\\x[0-9A-Fa-f]{2}|\\u[0-9A-Fa-f]{4}|\\c[A-Za-z])/;
var is_ascii_letter = (char) => char >= "A" && char <= "Z" || char >= "a" && char <= "z";
var character_at = (text, index) => String.fromCodePoint(text.codePointAt(index));
var get_ascii_folded_hex_atom = (hex) => {
  if (!/^[0-9A-Fa-f]{1,8}$/.test(hex)) return null;
  const code_point = Number.parseInt(hex, 16);
  if (code_point > 127) return null;
  const letter = String.fromCharCode(code_point);
  return is_ascii_letter(letter) ? `[${letter.toLowerCase()}${letter.toUpperCase()}]` : null;
};
var normalize_bloom_split_char_class = (regex) => regex.replace(/\[\^\(\\s\|\[([^\]]+)\]\)\]/g, "[^()|\\s$1]");
var ANY_CODE_POINT = "[\\s\\S]";
var MAX_CHARACTER_CLASS_NESTING_DEPTH = 256;
var create_character_class_operand = () => ({
  fragment: "",
  alternatives: [],
  tail: null,
  contains_complex_set: false
});
var throw_character_class_range_error = (index) => {
  throw new SyntaxError(
    `Unsupported range with a set-valued character-class operand at index ${index}`
  );
};
var add_character_class_atom = (operand, atom, index, contains_complex_set = true) => {
  if (operand.tail === "range") throw_character_class_range_error(index);
  operand.alternatives.push(atom);
  operand.tail = "set";
  operand.contains_complex_set = operand.contains_complex_set || contains_complex_set;
};
var append_character_class_fragment = (operand, fragment, set_valued = false, index = -1) => {
  if (set_valued && operand.tail === "range") {
    throw_character_class_range_error(index);
  }
  if (operand.tail === "range") {
    operand.fragment += fragment;
    operand.tail = "complete_range";
    return;
  }
  operand.fragment += fragment;
  operand.tail = set_valued ? "set" : "scalar";
  operand.contains_complex_set = operand.contains_complex_set || set_valued;
};
var rewrite_character_class_escape = (regex, index, operand) => {
  const braced = BRACED_ESCAPE_RE.exec(regex.slice(index));
  if (braced) {
    const [text, kind, body] = braced;
    if (kind === "P" && body === "Word") {
      add_character_class_atom(
        operand,
        `[^${UNICODE_WORD_CHARS_IN_CLASS}]`,
        index
      );
    } else {
      const replacement2 = kind === "x" ? `\\u{${body}}` : kind === "p" && body === "Word" ? UNICODE_WORD_CHARS_IN_CLASS : text;
      append_character_class_fragment(
        operand,
        replacement2,
        kind === "p" || kind === "P",
        index
      );
    }
    return index + text.length;
  }
  const fixed_width = FIXED_WIDTH_ESCAPE_RE.exec(regex.slice(index));
  if (fixed_width) {
    append_character_class_fragment(operand, fixed_width[0]);
    return index + fixed_width[0].length;
  }
  if (index + 1 >= regex.length) {
    throw new SyntaxError(
      `Unterminated escape in character class at index ${index}`
    );
  }
  const next = character_at(regex, index + 1);
  const next_end = index + 1 + next.length;
  const raw_whitespace = RAW_WHITESPACE_ESCAPES.get(next);
  if (raw_whitespace !== void 0) {
    append_character_class_fragment(operand, raw_whitespace);
    return next_end;
  }
  const complement = CLASS_COMPLEMENT_ALTERNATIVES.get(next);
  if (complement !== void 0) {
    add_character_class_atom(operand, complement, index);
    return next_end;
  }
  const rewrite = CLASS_ESCAPE_REWRITES.get(next);
  let replacement;
  let set_valued = false;
  if (rewrite !== void 0) {
    replacement = rewrite;
    set_valued = next !== "a" && next !== "e";
  } else if (/[A-Za-z0-9]/.test(next)) {
    replacement = `\\${next}`;
  } else if (JS_SYNTAX_CHARS.includes(next) || next === "-") {
    replacement = `\\${next}`;
  } else {
    replacement = next;
  }
  append_character_class_fragment(operand, replacement, set_valued, index);
  return next_end;
};
var compile_character_set_union = (pieces) => {
  if (pieces.length === 1) return pieces[0];
  return `(?:(?=(?:${pieces.join("|")}))${ANY_CODE_POINT})`;
};
var compile_character_class_operand = (operand) => {
  const pieces = operand.fragment.length === 0 ? operand.alternatives : [`[${operand.fragment}]`, ...operand.alternatives];
  return compile_character_set_union(pieces);
};
var get_ascii_fold_additions = (positive_atom) => {
  const membership = compile_unicode_regexp(`^(?:${positive_atom})$`, "u");
  let additions = "";
  for (let offset = 0; offset < 26; ++offset) {
    const upper = String.fromCharCode(65 + offset);
    const lower = String.fromCharCode(97 + offset);
    const has_upper = membership.test(upper);
    const has_lower = membership.test(lower);
    if (has_upper !== has_lower) additions += has_upper ? lower : upper;
  }
  return additions;
};
var parse_character_class = (regex, start, ascii_fold, apply_ascii_fold = true, nesting_depth = 1) => {
  if (nesting_depth > MAX_CHARACTER_CLASS_NESTING_DEPTH) {
    throw new SyntaxError(
      `Maximum character-class nesting depth of ${MAX_CHARACTER_CLASS_NESTING_DEPTH} exceeded at index ${start}`
    );
  }
  let i = start + 1;
  const negated = regex[i] === "^";
  if (negated) ++i;
  const first_content_index = i;
  const operands = [create_character_class_operand()];
  let operand = operands[0];
  let contains_nested_negated_complex_set = false;
  while (i < regex.length) {
    const char = character_at(regex, i);
    if (char === "\\") {
      i = rewrite_character_class_escape(regex, i, operand);
      continue;
    }
    if (char === "]") {
      if (i === first_content_index) {
        append_character_class_fragment(operand, "\\]");
        ++i;
        continue;
      }
      if (operand.tail === null) {
        if (operands.length > 1) {
          throw new SyntaxError(
            `Malformed character-class intersection with an empty operand at index ${i}`
          );
        }
        throw new SyntaxError(`Empty character class at index ${start}`);
      }
      const contains_complex_set = operands.some(
        (candidate) => candidate.contains_complex_set
      );
      if (negated && operands.length > 1 && contains_nested_negated_complex_set) {
        throw new SyntaxError(
          `Unsupported outer-negated character-class intersection with a nested negated class containing a Unicode property, POSIX class, or shorthand at index ${start}`
        );
      }
      const first_atom = compile_character_class_operand(operands[0]);
      let positive_atom = first_atom;
      if (operands.length > 1) {
        let lookaheads = "";
        for (let j = 1; j < operands.length; ++j) {
          lookaheads += `(?=${compile_character_class_operand(operands[j])})`;
        }
        positive_atom = `(?:${lookaheads}${first_atom})`;
      }
      const is_direct_class = operands.length === 1 && operand.alternatives.length === 0;
      let direct_fragment = operand.fragment;
      if (ascii_fold && apply_ascii_fold) {
        const additions = get_ascii_fold_additions(positive_atom);
        if (additions.length > 0) {
          if (is_direct_class) {
            direct_fragment += additions;
            positive_atom = `[${direct_fragment}]`;
          } else {
            positive_atom = compile_character_set_union([
              positive_atom,
              `[${additions}]`
            ]);
          }
        }
      }
      const atom = negated ? is_direct_class ? `[^${direct_fragment}]` : `(?:(?!${positive_atom})${ANY_CODE_POINT})` : positive_atom;
      return {
        atom,
        end: i + 1,
        negated,
        contains_complex_set,
        contains_nested_negated_complex_set
      };
    }
    if (regex.startsWith("&&", i)) {
      if (operand.tail === null) {
        throw new SyntaxError(
          `Malformed character-class intersection with an empty operand at index ${i}`
        );
      }
      operand = create_character_class_operand();
      operands.push(operand);
      i += 2;
      continue;
    }
    if (char === "[") {
      const suffix = regex.slice(i);
      if (EMPTY_NEGATED_POSIX_BRACKET_RE.test(suffix)) {
        throw new SyntaxError(
          `Malformed empty negated POSIX character class at index ${i}`
        );
      }
      const posix = POSIX_BRACKET_RE.exec(suffix);
      if (posix) {
        const [, posix_negated, name] = posix;
        const fragment = POSIX_CLASS_FRAGMENTS.get(name);
        if (fragment === void 0) {
          throw new SyntaxError(
            `Unsupported POSIX character class "${name}" at index ${i}`
          );
        }
        if (ascii_fold && posix_negated && (name === "lower" || name === "upper")) {
          throw new SyntaxError(
            `Unsupported negated POSIX ${name} class inside an inline case-insensitive group`
          );
        }
        if (posix_negated) {
          add_character_class_atom(operand, `[^${fragment}]`, i);
        } else {
          append_character_class_fragment(operand, fragment, true, i);
        }
        i += posix[0].length;
        continue;
      }
      if (UNSUPPORTED_POSIX_BRACKET_RE.test(suffix)) {
        throw new SyntaxError(
          `Unsupported POSIX collating or equivalence bracket expression at index ${i}`
        );
      }
      const nested = parse_character_class(
        regex,
        i,
        ascii_fold,
        false,
        nesting_depth + 1
      );
      add_character_class_atom(
        operand,
        nested.atom,
        i,
        nested.contains_complex_set
      );
      contains_nested_negated_complex_set ||= nested.contains_nested_negated_complex_set || nested.negated && nested.contains_complex_set;
      i = nested.end;
      continue;
    }
    if (char === "-") {
      const is_terminal_literal = regex[i + 1] === "]" || regex.startsWith("&&", i + 1);
      if (operand.tail === "set" && !is_terminal_literal) {
        throw_character_class_range_error(i);
      }
      if (operand.tail === null || operand.tail === "range" || operand.tail === "complete_range" || is_terminal_literal) {
        append_character_class_fragment(operand, "\\-");
      } else {
        operand.fragment += "-";
        operand.tail = "range";
      }
      ++i;
      continue;
    }
    append_character_class_fragment(
      operand,
      char === "^" && operand.fragment.length === 0 ? "\\^" : char
    );
    i += char.length;
  }
  throw new SyntaxError(
    `${operands.length > 1 ? "Unterminated character-class intersection" : "Unterminated character class"} at index ${start}`
  );
};
var rewrite_oniguruma_to_js = (regex) => {
  let out = "";
  let atom_start = -1;
  let last_was_quantifier = false;
  let ascii_fold = false;
  const group_states = [];
  const emit_atom = (text) => {
    atom_start = out.length;
    out += text;
    last_was_quantifier = false;
  };
  for (let i = 0; i < regex.length; ) {
    const char = character_at(regex, i);
    if (char === "\\") {
      const braced = BRACED_ESCAPE_RE.exec(regex.slice(i));
      if (braced) {
        const [text, kind, body] = braced;
        let replacement2 = text;
        if (kind === "x") {
          const code_point_escape = `\\u{${body}}`;
          replacement2 = ascii_fold ? get_ascii_folded_hex_atom(body) ?? code_point_escape : code_point_escape;
        } else if (body === "Word") {
          replacement2 = kind === "p" ? UNICODE_WORD_CLASS : UNICODE_NON_WORD_CLASS;
        }
        emit_atom(replacement2);
        i += text.length;
        continue;
      }
      const fixed_width = FIXED_WIDTH_ESCAPE_RE.exec(regex.slice(i));
      if (fixed_width) {
        const text = fixed_width[0];
        const replacement2 = ascii_fold && text[1] !== "c" ? get_ascii_folded_hex_atom(text.slice(2)) ?? text : text;
        emit_atom(replacement2);
        i += text.length;
        continue;
      }
      if (i + 1 >= regex.length) {
        out += char;
        break;
      }
      const next = character_at(regex, i + 1);
      i += 1 + next.length;
      if (next === "G") {
        continue;
      }
      const raw_whitespace = RAW_WHITESPACE_ESCAPES.get(next);
      if (raw_whitespace !== void 0) {
        emit_atom(raw_whitespace);
        continue;
      }
      const rewrite = ESCAPE_REWRITES.get(next);
      let replacement;
      if (rewrite !== void 0) {
        replacement = rewrite;
      } else if (/[A-Za-z0-9]/.test(next)) {
        replacement = `\\${next}`;
      } else if (JS_SYNTAX_CHARS.includes(next)) {
        replacement = `\\${next}`;
      } else {
        replacement = next;
      }
      emit_atom(replacement);
      continue;
    }
    switch (char) {
      case "[": {
        const parsed = parse_character_class(regex, i, ascii_fold);
        emit_atom(parsed.atom);
        i = parsed.end;
        continue;
      }
      case "]":
        emit_atom("\\]");
        ++i;
        continue;
      case ".":
        emit_atom("[^\\n]");
        ++i;
        continue;
      case "^":
        emit_atom(LINE_START_ANCHOR);
        ++i;
        continue;
      case "$":
        emit_atom(LINE_END_ANCHOR);
        ++i;
        continue;
      case "(": {
        const inline_case_insensitive = regex.startsWith("(?i:", i);
        const source_prefix = inline_case_insensitive ? "(?i:" : GROUP_PREFIX_RE.exec(regex.slice(i))?.[0] ?? "(";
        const output_prefix = inline_case_insensitive ? "(?:" : source_prefix === "(?>" ? "(?:" : source_prefix;
        group_states.push([out.length, ascii_fold]);
        if (inline_case_insensitive) ascii_fold = true;
        out += output_prefix;
        last_was_quantifier = false;
        i += source_prefix.length;
        continue;
      }
      case ")":
        out += char;
        [atom_start, ascii_fold] = group_states.pop() ?? [-1, false];
        last_was_quantifier = false;
        ++i;
        continue;
      case "|":
        out += char;
        atom_start = -1;
        last_was_quantifier = false;
        ++i;
        continue;
      case "{": {
        const quant = QUANTIFIER_BRACE_RE.exec(regex.slice(i));
        if (!quant || atom_start < 0) {
          emit_atom("\\{");
          ++i;
          continue;
        }
        const body = quant[1].startsWith(",") ? `0${quant[1]}` : quant[1];
        i += quant[0].length;
        const following = regex[i];
        if (following === "+" || following === "*") {
          out = `${out.slice(0, atom_start)}(?:${out.slice(atom_start)}{${body}})${following}`;
          ++i;
        } else {
          out += `{${body}}`;
        }
        last_was_quantifier = true;
        continue;
      }
      case "}":
        emit_atom("\\}");
        ++i;
        continue;
      case "+":
        if (last_was_quantifier) {
          ++i;
          continue;
        }
        out += char;
        last_was_quantifier = true;
        ++i;
        continue;
      case "*":
      case "?":
        out += char;
        last_was_quantifier = true;
        ++i;
        continue;
      default:
        emit_atom(
          ascii_fold && is_ascii_letter(char) ? `[${char.toLowerCase()}${char.toUpperCase()}]` : char
        );
        i += char.length;
        continue;
    }
  }
  return out;
};
var escape_reg_exp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var fuse_unk = (arr, tokens_to_ids, unk_token_id) => {
  const fused = [];
  let i = 0;
  while (i < arr.length) {
    fused.push(arr[i]);
    const token_id = tokens_to_ids.get(arr[i]) ?? unk_token_id;
    if (token_id !== unk_token_id) {
      ++i;
      continue;
    }
    while (++i < arr.length && (tokens_to_ids.get(arr[i]) ?? unk_token_id) === unk_token_id) {
      if (tokens_to_ids.get(fused.at(-1)) !== unk_token_id) {
        fused[fused.length - 1] += arr[i];
      }
    }
  }
  return fused;
};
var is_chinese_char = (cp) => cp >= 19968 && cp <= 40959 || cp >= 13312 && cp <= 19903 || cp >= 131072 && cp <= 173791 || cp >= 173824 && cp <= 177983 || cp >= 177984 && cp <= 178207 || cp >= 178208 && cp <= 183983 || cp >= 63744 && cp <= 64255 || cp >= 194560 && cp <= 195103;
var is_integral_number = (x) => Number.isInteger(x) || typeof x === "bigint";
var len = (s) => {
  let length = 0;
  for (const c of s) ++length;
  return length;
};
var lowercase_and_remove_accents = (text) => remove_accents(text.toLowerCase());
var merge_arrays = (...arrs) => Array.prototype.concat.apply([], arrs);
var object_to_map = (obj) => new Map(Object.entries(obj));
var regex_split = (text, regex) => {
  const result = [];
  let prev = 0;
  for (const match of text.matchAll(regex)) {
    const full_match = match[0];
    if (prev < match.index) {
      result.push(text.slice(prev, match.index));
    }
    if (full_match.length > 0) {
      result.push(full_match);
    }
    prev = match.index + full_match.length;
  }
  if (prev < text.length) {
    result.push(text.slice(prev));
  }
  return result;
};
var remove_accents = (text) => text.replace(/\p{M}/gu, "");
var validate_object = (obj, name, required_keys = []) => {
  if (!obj || Array.isArray(obj) || typeof obj !== "object") {
    return `${name} must be a valid object`;
  }
  for (const key of required_keys) {
    if (!(key in obj)) {
      return `${name} must contain a "${key}" property`;
    }
  }
  return null;
};
var whitespace_split = (text) => text.match(/\S+/g) || [];
var Callable = class {
  /**
   * Creates a new instance of the Callable class.
   */
  constructor() {
    const closure = function(...args) {
      return closure._call(...args);
    };
    return Object.setPrototypeOf(closure, new.target.prototype);
  }
};
var Callable_default = Callable;
var Normalizer = class extends Callable_default {
  /**
   * @param config The configuration object for the normalizer.
   */
  constructor(config) {
    super();
    this.config = config;
  }
  /**
   * Alias for {@link Normalizer#normalize}.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  _call(text) {
    return this.normalize(text);
  }
};
var Normalizer_default = Normalizer;
var BertNormalizer = class extends Normalizer_default {
  /**
   * Adds whitespace around any CJK (Chinese, Japanese, or Korean) character in the input text.
   *
   * @param text The input text to tokenize.
   * @returns The tokenized text with whitespace added around CJK characters.
   */
  tokenize_chinese_chars(text) {
    const output = [];
    for (let i = 0; i < text.length; ++i) {
      const char = text[i];
      const cp = char.charCodeAt(0);
      if (is_chinese_char(cp)) {
        output.push(" ");
        output.push(char);
        output.push(" ");
      } else {
        output.push(char);
      }
    }
    return output.join("");
  }
  /**
   * Strips accents from the given text.
   * @param text The text to strip accents from.
   * @returns The text with accents removed.
   */
  strip_accents(text) {
    return text.normalize("NFD").replace(/\p{Mn}/gu, "");
  }
  /**
   * Checks whether `char` is a control character.
   * @param char The character to check.
   * @returns Whether `char` is a control character.
   */
  is_control(char) {
    switch (char) {
      case "	":
      case "\n":
      case "\r":
        return false;
      default:
        return /^\p{Cc}|\p{Cf}|\p{Co}|\p{Cs}$/u.test(char);
    }
  }
  /**
   * Performs invalid character removal and whitespace cleanup on text.
   * @param text The text to clean.
   * @returns The cleaned text.
   */
  clean_text(text) {
    const output = [];
    for (const char of text) {
      const cp = char.charCodeAt(0);
      if (cp === 0 || cp === 65533 || this.is_control(char)) {
        continue;
      }
      if (/^\s$/.test(char)) {
        output.push(" ");
      } else {
        output.push(char);
      }
    }
    return output.join("");
  }
  /**
   * Normalizes the given text based on the configuration.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  normalize(text) {
    if (this.config.clean_text) {
      text = this.clean_text(text);
    }
    if (this.config.handle_chinese_chars) {
      text = this.tokenize_chinese_chars(text);
    }
    if (this.config.lowercase) {
      text = text.toLowerCase();
      if (this.config.strip_accents !== false) {
        text = this.strip_accents(text);
      }
    } else if (this.config.strip_accents) {
      text = this.strip_accents(text);
    }
    return text;
  }
};
var BertNormalizer_default = BertNormalizer;
var Precompiled = class extends Normalizer_default {
  /**
   * Create a new instance of Precompiled normalizer.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.charsmap = config.precompiled_charsmap ?? null;
  }
  /**
   * Normalizes the given text by applying the precompiled charsmap.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  normalize(text) {
    text = text.replace(
      /[\u0001-\u0008\u000B\u000E-\u001F\u007F\u008F\u009F]/gm,
      ""
    );
    text = text.replace(
      /[\u0009\u000A\u000C\u000D\u00A0\u1680\u2000-\u200F\u2028\u2029\u202F\u205F\u2581\u3000\uFEFF\uFFFD]/gm,
      " "
    );
    if (text.includes("\uFF5E")) {
      const parts = text.split("\uFF5E");
      text = parts.map((part) => part.normalize("NFKC")).join("\uFF5E");
    } else {
      text = text.normalize("NFKC");
    }
    return text;
  }
};
var Precompiled_default = Precompiled;
var Sequence = class extends Normalizer_default {
  /**
   * Create a new instance of NormalizerSequence.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.normalizers = (config.normalizers ?? []).map(
      (x) => create_normalizer_default(x)
    );
  }
  /**
   * Apply a sequence of Normalizers to the input text.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  normalize(text) {
    return this.normalizers.reduce((t, normalizer) => {
      return normalizer ? normalizer.normalize(t) : t;
    }, text);
  }
};
var Sequence_default = Sequence;
var Replace = class extends Normalizer_default {
  /**
   * @param config The configuration object for the normalizer.
   */
  constructor(config) {
    super(config);
    this.pattern = create_pattern(this.config.pattern ?? {});
  }
  /**
   * Normalize the input text by replacing the pattern with the content.
   * @param text The input text to be normalized.
   * @returns The normalized text after replacing the pattern with the content.
   */
  normalize(text) {
    return this.pattern === null ? text : text.replaceAll(this.pattern, this.config.content ?? "");
  }
};
var Replace_default = Replace;
var UnicodeNormalizer = class extends Normalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFC";
  }
  /**
   * Normalize the input text by applying Unicode normalization.
   * @param text The input text to be normalized.
   * @returns The normalized text.
   */
  normalize(text) {
    text = text.normalize(this.form);
    return text;
  }
};
var UnicodeNormalizer_default = UnicodeNormalizer;
var NFC = class extends UnicodeNormalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFC";
  }
};
var NFC_default = NFC;
var NFD = class extends UnicodeNormalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFD";
  }
};
var NFD_default = NFD;
var NFKC = class extends UnicodeNormalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFKC";
  }
};
var NFKC_default = NFKC;
var NFKD = class extends UnicodeNormalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFKD";
  }
};
var NFKD_default = NFKD;
var Strip = class extends Normalizer_default {
  /**
   * Strip leading and/or trailing whitespace from the input text.
   * @param text The input text.
   * @returns The normalized text.
   */
  normalize(text) {
    if (this.config.strip_left && this.config.strip_right) {
      text = text.trim();
    } else {
      if (this.config.strip_left) {
        text = text.trimStart();
      }
      if (this.config.strip_right) {
        text = text.trimEnd();
      }
    }
    return text;
  }
};
var Strip_default = Strip;
var StripAccents = class extends Normalizer_default {
  /**
   * Remove all accents from the text.
   * @param text The input text.
   * @returns The normalized text without accents.
   */
  normalize(text) {
    return remove_accents(text);
  }
};
var StripAccents_default = StripAccents;
var Lowercase = class extends Normalizer_default {
  /**
   * Lowercases the input string.
   * @param {string} text The text to normalize.
   * @returns {string} The normalized text.
   */
  normalize(text) {
    return text.toLowerCase();
  }
};
var Lowercase_default = Lowercase;
var Prepend = class extends Normalizer_default {
  /**
   * Prepends the input string.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  normalize(text) {
    text = this.config.prepend + text;
    return text;
  }
};
var Prepend_default = Prepend;
function create_normalizer(config) {
  if (config === null) return null;
  switch (config.type) {
    case "BertNormalizer":
      return new BertNormalizer_default(config);
    case "Precompiled":
      return new Precompiled_default(config);
    case "Sequence":
      return new Sequence_default(config);
    case "Replace":
      return new Replace_default(config);
    case "NFC":
      return new NFC_default(config);
    case "NFD":
      return new NFD_default(config);
    case "NFKC":
      return new NFKC_default(config);
    case "NFKD":
      return new NFKD_default(config);
    case "Strip":
      return new Strip_default(config);
    case "StripAccents":
      return new StripAccents_default(config);
    case "Lowercase":
      return new Lowercase_default(config);
    case "Prepend":
      return new Prepend_default(config);
    default:
      throw new Error(`Unknown Normalizer type: ${config.type}`);
  }
}
var create_normalizer_default = create_normalizer;
var PreTokenizer = class extends Callable_default {
  /**
   * Tokenizes the given text into pre-tokens.
   * @param text The text or array of texts to pre-tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of pre-tokens.
   */
  pre_tokenize(text, options) {
    return (Array.isArray(text) ? text.map((x) => this.pre_tokenize_text(x, options)) : this.pre_tokenize_text(text, options)).flat();
  }
  /**
   * Alias for {@link PreTokenizer#pre_tokenize}.
   * @param text The text or array of texts to pre-tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of pre-tokens.
   */
  _call(text, options) {
    return this.pre_tokenize(text, options);
  }
};
var PreTokenizer_default = PreTokenizer;
var BYTES_TO_UNICODE = (() => {
  const bs2 = [
    ...Array.from(
      { length: "~".charCodeAt(0) - "!".charCodeAt(0) + 1 },
      (_, i) => i + "!".charCodeAt(0)
    ),
    ...Array.from(
      { length: "\xAC".charCodeAt(0) - "\xA1".charCodeAt(0) + 1 },
      (_, i) => i + "\xA1".charCodeAt(0)
    ),
    ...Array.from(
      { length: "\xFF".charCodeAt(0) - "\xAE".charCodeAt(0) + 1 },
      (_, i) => i + "\xAE".charCodeAt(0)
    )
  ];
  const cs = bs2.slice();
  let n = 0;
  for (let b = 0; b < 256; ++b) {
    if (!bs2.includes(b)) {
      bs2.push(b);
      cs.push(256 + n);
      n += 1;
    }
  }
  const ccs = cs.map((n2) => String.fromCharCode(n2));
  return Object.fromEntries(bs2.map((b, i) => [b, ccs[i]]));
})();
var reverse_dictionary = (data) => Object.fromEntries(Object.entries(data).map(([key, value]) => [value, key]));
var UNICODE_TO_BYTES = reverse_dictionary(BYTES_TO_UNICODE);
var PUNCTUATION_REGEX = "\\p{P}\\u0021-\\u002F\\u003A-\\u0040\\u005B-\\u0060\\u007B-\\u007E";
var ByteLevel = class extends PreTokenizer_default {
  /**
   * Creates a new instance of the `ByteLevelPreTokenizer` class.
   * @param config The configuration object.
   */
  constructor(config) {
    super();
    this.config = config;
    this.add_prefix_space = this.config.add_prefix_space ?? false;
    this.trim_offsets = this.config.trim_offsets ?? false;
    this.use_regex = this.config.use_regex ?? true;
    this.pattern = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
    this.byte_encoder = BYTES_TO_UNICODE;
    this.text_encoder = new TextEncoder();
  }
  /**
   * Tokenizes a single piece of text using byte-level tokenization.
   * @param text The text to tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text, options) {
    if (this.add_prefix_space && !text.startsWith(" ")) {
      text = " " + text;
    }
    const tokens = this.use_regex ? text.match(this.pattern) || [] : [text];
    return tokens.map(
      (token) => Array.from(
        this.text_encoder.encode(token),
        (byte) => this.byte_encoder[byte]
      ).join("")
    );
  }
};
var ByteLevel_default = ByteLevel;
var Whitespace = class extends PreTokenizer_default {
  /**
   * Pre-tokenizes the input text by splitting it on word boundaries.
   * @param text The text to be pre-tokenized.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of tokens produced by splitting the input text on whitespace.
   */
  pre_tokenize_text(text, options) {
    return text.match(/\w+|[^\w\s]+/g) || [];
  }
};
var Whitespace_default = Whitespace;
var Metaspace = class extends PreTokenizer_default {
  /**
   * @param config The configuration object for the MetaspacePreTokenizer.
   */
  constructor(config) {
    super();
    this.replacement = config.replacement ?? "\u2581";
    this.str_rep = config.str_rep || this.replacement;
    this.prepend_scheme = config.prepend_scheme ?? "always";
  }
  /**
   * This method takes a string, replaces spaces with the replacement character,
   * adds a prefix space if requested, and returns a new list of tokens.
   * @param text The text to pre-tokenize.
   * @param options The options for the pre-tokenization.
   * @returns A new list of pre-tokenized tokens.
   */
  pre_tokenize_text(text, options) {
    const { section_index = void 0 } = options ?? {};
    let normalized = text.replaceAll(" ", this.str_rep);
    if (
      // We add a prefix space if:
      //  (1) The normalized token does not already start with the replacement character.
      !normalized.startsWith(this.replacement) && // and (2) either:
      //  (a) prepend_scheme is 'always'
      //  (b) prepend_scheme is 'first' and this is the first section
      (this.prepend_scheme === "always" || this.prepend_scheme === "first" && section_index === 0)
    ) {
      normalized = this.str_rep + normalized;
    }
    return [normalized];
  }
};
var Metaspace_default = Metaspace;
var Split = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    this.pattern = create_pattern(
      this.config.pattern ?? {},
      this.config.invert ?? true
    );
  }
  /**
   * Tokenizes text by splitting it using the given pattern.
   * @param text The text to tokenize.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text) {
    if (this.pattern === null) {
      return [];
    }
    if (this.config.invert) {
      return (text.match(this.pattern) || []).filter((x) => x);
    } else if (this.config.behavior?.toLowerCase() === "removed") {
      return text.split(this.pattern).filter((x) => x);
    } else {
      return regex_split(text, this.pattern);
    }
  }
};
var Split_default = Split;
var Punctuation = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    this.pattern = new RegExp(
      `[^${PUNCTUATION_REGEX}]+|[${PUNCTUATION_REGEX}]+`,
      "gu"
    );
  }
  /**
   * Tokenizes text by splitting it using the given pattern.
   * @param text The text to tokenize.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text) {
    return text.match(this.pattern) || [];
  }
};
var Punctuation_default = Punctuation;
var Digits = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    const digit_pattern = `[^\\d]+|\\d${this.config.individual_digits ? "" : "+"}`;
    this.pattern = new RegExp(digit_pattern, "gu");
  }
  /**
   * Tokenizes text by splitting it using the given pattern.
   * @param text The text to tokenize.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text) {
    return text.match(this.pattern) || [];
  }
};
var Digits_default = Digits;
var BertPreTokenizer = class extends PreTokenizer_default {
  /**
   * A PreTokenizer that splits text into wordpieces using a basic tokenization scheme
   * similar to that used in the original implementation of BERT.
   */
  constructor() {
    super();
    this.pattern = new RegExp(
      `[^\\s${PUNCTUATION_REGEX}]+|[${PUNCTUATION_REGEX}]`,
      "gu"
    );
  }
  /**
   * Tokenizes a single text using the BERT pre-tokenization scheme.
   *
   * @param text The text to tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text, options) {
    return text.trim().match(this.pattern) || [];
  }
};
var BertPreTokenizer_default = BertPreTokenizer;
var Replace2 = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    this.pattern = create_pattern(this.config.pattern ?? {});
    this.content = this.config.content ?? "";
  }
  /**
   * Pre-tokenizes the input text by replacing certain characters.
   * @param text The text to be pre-tokenized.
   * @returns An array of tokens produced by replacing certain characters.
   */
  pre_tokenize_text(text) {
    if (this.pattern === null) {
      return [text];
    }
    return [text.replaceAll(this.pattern, this.config.content ?? "")];
  }
};
var Replace_default2 = Replace2;
var Sequence2 = class extends PreTokenizer_default {
  /**
   * Creates an instance of PreTokenizerSequence.
   * @param config The configuration object for the pre-tokenizer sequence.
   */
  constructor(config) {
    super();
    this.tokenizers = (config.pretokenizers ?? []).map(
      (x) => create_pre_tokenizer_default(x)
    );
  }
  /**
   * Applies each pre-tokenizer in the sequence to the input text in turn.
   * @param text The text to pre-tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns The pre-tokenized text.
   */
  pre_tokenize_text(text, options) {
    return this.tokenizers.reduce(
      (pre_tokenized_text, tokenizer) => {
        return tokenizer ? tokenizer.pre_tokenize(pre_tokenized_text, options) : pre_tokenized_text;
      },
      [text]
    );
  }
};
var Sequence_default2 = Sequence2;
var WhitespaceSplit = class extends PreTokenizer_default {
  /**
   * Pre-tokenizes the input text by splitting it on whitespace characters.
   * @param text The text to be pre-tokenized.
   * @returns An array of tokens produced by splitting the input text on whitespace.
   */
  pre_tokenize_text(text) {
    return whitespace_split(text);
  }
};
var WhitespaceSplit_default = WhitespaceSplit;
var FixedLength = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    this._length = config.length;
  }
  /**
   * Pre-tokenizes the input text by splitting it into fixed-length tokens.
   * @param text The text to be pre-tokenized.
   * @returns An array of tokens produced by splitting the input text into fixed-length tokens.
   */
  pre_tokenize_text(text) {
    const tokens = [];
    for (let i = 0; i < text.length; i += this._length) {
      tokens.push(text.slice(i, i + this._length));
    }
    return tokens;
  }
};
var FixedLength_default = FixedLength;
function create_pre_tokenizer(config) {
  if (config === null) return null;
  switch (config.type) {
    case "BertPreTokenizer":
      return new BertPreTokenizer_default();
    case "Sequence":
      return new Sequence_default2(config);
    case "Whitespace":
      return new Whitespace_default();
    case "WhitespaceSplit":
      return new WhitespaceSplit_default();
    case "Metaspace":
      return new Metaspace_default(config);
    case "ByteLevel":
      return new ByteLevel_default(config);
    case "Split":
      return new Split_default(config);
    case "Punctuation":
      return new Punctuation_default(config);
    case "Digits":
      return new Digits_default(config);
    case "Replace":
      return new Replace_default2(config);
    case "FixedLength":
      return new FixedLength_default(config);
    default:
      throw new Error(`Unknown PreTokenizer type: ${config.type}`);
  }
}
var create_pre_tokenizer_default = create_pre_tokenizer;
var TokenizerModel = class extends Callable_default {
  /**
   * Creates a new instance of TokenizerModel.
   * @param config The configuration object for the TokenizerModel.
   */
  constructor(config) {
    super();
    this.config = config;
    this.vocab = [];
    this.tokens_to_ids = /* @__PURE__ */ new Map();
    this.unk_token_id = void 0;
    this.unk_token = void 0;
    this.end_of_word_suffix = void 0;
    this.fuse_unk = this.config.fuse_unk ?? false;
  }
  /**
   * Internal function to call the TokenizerModel instance.
   * @param tokens The tokens to encode.
   * @returns The encoded tokens.
   */
  _call(tokens) {
    let result = this.encode(tokens);
    if (this.fuse_unk) {
      result = fuse_unk(result, this.tokens_to_ids, this.unk_token_id);
    }
    return result;
  }
};
var TokenizerModel_default = TokenizerModel;
var WordPieceTokenizer = class extends TokenizerModel_default {
  /**
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.max_input_chars_per_word = 100;
    this.tokens_to_ids = object_to_map(config.vocab);
    this.unk_token_id = this.tokens_to_ids.get(config.unk_token);
    this.unk_token = config.unk_token;
    this.max_input_chars_per_word = config.max_input_chars_per_word ?? 100;
    this.vocab = new Array(this.tokens_to_ids.size);
    for (const [key, value] of this.tokens_to_ids) {
      this.vocab[value] = key;
    }
  }
  /**
   * Encodes an array of tokens using WordPiece encoding.
   * @param tokens The tokens to encode.
   * @returns An array of encoded tokens.
   */
  encode(tokens) {
    const output_tokens = [];
    for (const token of tokens) {
      const chars = [...token];
      if (chars.length > this.max_input_chars_per_word) {
        output_tokens.push(this.unk_token);
        continue;
      }
      let is_unknown = false;
      let start = 0;
      const sub_tokens = [];
      while (start < chars.length) {
        let end = chars.length;
        let current_substring = null;
        while (start < end) {
          let substr = chars.slice(start, end).join("");
          if (start > 0) {
            substr = this.config.continuing_subword_prefix + substr;
          }
          if (this.tokens_to_ids.has(substr)) {
            current_substring = substr;
            break;
          }
          --end;
        }
        if (current_substring === null) {
          is_unknown = true;
          break;
        }
        sub_tokens.push(current_substring);
        start = end;
      }
      if (is_unknown) {
        output_tokens.push(this.unk_token);
      } else {
        output_tokens.push(...sub_tokens);
      }
    }
    return output_tokens;
  }
};
var WordPiece_default = WordPieceTokenizer;
var CharTrieNode = class _CharTrieNode {
  /**
   * Create a new CharTrieNode.
   * @param is_leaf Whether the node is a leaf node or not.
   * @param children A map containing the node's children, where the key is a character and the value is a `CharTrieNode`.
   */
  constructor(is_leaf, children) {
    this.is_leaf = is_leaf;
    this.children = children;
  }
  /**
   * Returns a new `CharTrieNode` instance with default values.
   * @returns A new `CharTrieNode` instance with `is_leaf` set to `false` and an empty `children` map.
   */
  static default() {
    return new _CharTrieNode(false, /* @__PURE__ */ new Map());
  }
};
var CharTrie = class {
  constructor() {
    this.root = CharTrieNode.default();
  }
  /**
   * Adds one or more `texts` to the trie.
   * @param texts The strings to add to the trie.
   */
  extend(texts) {
    for (const text of texts) {
      this.push(text);
    }
  }
  /**
   * Adds text to the trie.
   * @param text The string to add to the trie.
   */
  push(text) {
    let node = this.root;
    for (const ch of text) {
      let child = node.children.get(ch);
      if (child === void 0) {
        child = CharTrieNode.default();
        node.children.set(ch, child);
      }
      node = child;
    }
    node.is_leaf = true;
  }
  /**
   * Searches the trie for stored strings that match `chars` starting at `start`.
   * @param chars The input characters to search.
   * @param start The index to start searching from.
   * @yields Each stored string that is a prefix of `chars` starting at `start`.
   */
  *common_prefix_search(chars, start = 0) {
    let node = this.root;
    if (node === void 0) return;
    let prefix = "";
    for (let i = start; i < chars.length; ++i) {
      const ch = chars[i];
      prefix += ch;
      node = node.children.get(ch);
      if (node === void 0) return;
      if (node.is_leaf) {
        yield prefix;
      }
    }
  }
};
var CharTrie_default = CharTrie;
var TokenLatticeNode = class _TokenLatticeNode {
  /**
   * Represents a node in a token lattice for a given sentence.
   * @param token_id The ID of the token associated with this node.
   * @param node_id The ID of this node.
   * @param pos The starting position of the token in the sentence.
   * @param length The length of the token.
   * @param score The score associated with the token.
   */
  constructor(token_id, node_id, pos, length, score) {
    this.token_id = token_id;
    this.node_id = node_id;
    this.pos = pos;
    this.length = length;
    this.score = score;
    this.prev = null;
    this.backtrace_score = 0;
  }
  /**
   * Returns a clone of this node.
   * @returns A clone of this node.
   */
  clone() {
    const n = new _TokenLatticeNode(
      this.token_id,
      this.node_id,
      this.pos,
      this.length,
      this.score
    );
    n.prev = this.prev;
    n.backtrace_score = this.backtrace_score;
    return n;
  }
};
var TokenLattice = class {
  /**
   * Creates a new TokenLattice instance.
   *
   * @param sentence The input sentence to be tokenized.
   * @param bos_token_id The beginning-of-sequence token ID.
   * @param eos_token_id The end-of-sequence token ID.
   */
  constructor(sentence, bos_token_id, eos_token_id) {
    this.chars = Array.from(sentence);
    this.len = this.chars.length;
    this.bos_token_id = bos_token_id;
    this.eos_token_id = eos_token_id;
    this.nodes = [];
    this.begin_nodes = Array.from(
      { length: this.len + 1 },
      () => []
    );
    this.end_nodes = Array.from({ length: this.len + 1 }, () => []);
    const bos = new TokenLatticeNode(this.bos_token_id ?? 0, 0, 0, 0, 0);
    const eos = new TokenLatticeNode(
      this.eos_token_id ?? 0,
      1,
      this.len,
      0,
      0
    );
    this.nodes.push(bos.clone());
    this.nodes.push(eos.clone());
    this.begin_nodes[this.len].push(eos);
    this.end_nodes[0].push(bos);
  }
  /**
   * Inserts a new token node into the token lattice.
   *
   * @param pos The starting position of the token.
   * @param length The length of the token.
   * @param score The score of the token.
   * @param token_id The token ID of the token.
   */
  insert(pos, length, score, token_id) {
    const node_id = this.nodes.length;
    const node = new TokenLatticeNode(token_id, node_id, pos, length, score);
    this.begin_nodes[pos].push(node);
    this.end_nodes[pos + length].push(node);
    this.nodes.push(node);
  }
  /**
   * Implements the Viterbi algorithm to compute the most likely sequence of tokens.
   *
   * @returns The most likely sequence of tokens.
   */
  viterbi() {
    const len2 = this.len;
    let pos = 0;
    while (pos <= len2) {
      if (this.begin_nodes[pos].length == 0) {
        return [];
      }
      for (let rnode of this.begin_nodes[pos]) {
        rnode.prev = null;
        let best_score = 0;
        let best_node = null;
        for (let lnode of this.end_nodes[pos]) {
          const score = lnode.backtrace_score + rnode.score;
          if (best_node === null || score > best_score) {
            best_node = lnode.clone();
            best_score = score;
          }
        }
        if (best_node !== null) {
          rnode.prev = best_node;
          rnode.backtrace_score = best_score;
        } else {
          return [];
        }
      }
      ++pos;
    }
    const results = [];
    const root = this.begin_nodes[len2][0];
    const prev = root.prev;
    if (prev === null) {
      return [];
    }
    let node = prev.clone();
    while (node.prev !== null) {
      results.push(node.clone());
      const n = node.clone();
      node = n.prev.clone();
    }
    results.reverse();
    return results;
  }
  /**
   * Get the text piece for a given node.
   * @param node The node to get the piece for.
   * @returns The array of nodes representing the most likely sequence of tokens.
   */
  piece(node) {
    return this.chars.slice(node.pos, node.pos + node.length).join("");
  }
  /**
   * @returns The most likely sequence of tokens.
   */
  tokens() {
    const nodes = this.viterbi();
    return nodes.map((x) => this.piece(x));
  }
  /**
   * @returns The most likely sequence of token ids.
   */
  token_ids() {
    const nodes = this.viterbi();
    return nodes.map((x) => x.token_id);
  }
};
var TokenLattice_default = TokenLattice;
function min(arr) {
  if (arr.length === 0) throw new Error("Array must not be empty");
  let min_value = arr[0];
  let index_of_min = 0;
  for (let i = 1; i < arr.length; ++i) {
    if (arr[i] < min_value) {
      min_value = arr[i];
      index_of_min = i;
    }
  }
  return [min_value, index_of_min];
}
var Unigram = class extends TokenizerModel_default {
  /**
   * Create a new Unigram tokenizer model.
   * @param config The configuration object for the Unigram model.
   * @param eos_token
   */
  constructor(config, eos_token) {
    super(config);
    const vocab_size = config.vocab.length;
    this.vocab = new Array(vocab_size);
    this.scores = new Array(vocab_size);
    for (let i = 0; i < vocab_size; ++i) {
      [this.vocab[i], this.scores[i]] = config.vocab[i];
    }
    this.unk_token_id = config.unk_id;
    this.unk_token = this.vocab[config.unk_id];
    this.tokens_to_ids = new Map(this.vocab.map((x, i) => [x, i]));
    this.bos_token = " ";
    this.bos_token_id = this.tokens_to_ids.get(this.bos_token);
    this.eos_token = eos_token;
    this.eos_token_id = this.tokens_to_ids.get(this.eos_token);
    this.unk_token = this.vocab[this.unk_token_id];
    this.min_score = min(this.scores)[0];
    this.unk_score = this.min_score - 10;
    this.scores[this.unk_token_id] = this.unk_score;
    this.trie = new CharTrie_default();
    this.trie.extend(this.vocab);
    this.fuse_unk = true;
  }
  /**
   * Populates lattice nodes.
   * @param lattice The token lattice to populate with nodes.
   */
  populate_nodes(lattice) {
    const chars = lattice.chars;
    const mblen = 1;
    let begin_pos = 0;
    while (begin_pos < chars.length) {
      let has_single_node = false;
      const prefixed_tokens = this.trie.common_prefix_search(chars, begin_pos);
      for (const token of prefixed_tokens) {
        const token_id = this.tokens_to_ids.get(token);
        const token_score = this.scores[token_id];
        const n = len(token);
        lattice.insert(begin_pos, n, token_score, token_id);
        if (!has_single_node && n === mblen) {
          has_single_node = true;
        }
      }
      if (!has_single_node) {
        lattice.insert(begin_pos, mblen, this.unk_score, this.unk_token_id);
      }
      begin_pos += mblen;
    }
  }
  /**
   * Encodes an array of tokens into an array of subtokens using the unigram model.
   *
   * @param normalized The normalized string.
   * @returns An array of subtokens obtained by encoding the input tokens using the unigram model.
   */
  tokenize(normalized) {
    const lattice = new TokenLattice_default(
      normalized,
      this.bos_token_id,
      this.eos_token_id
    );
    this.populate_nodes(lattice);
    return lattice.tokens();
  }
  /**
   * Encodes an array of tokens using Unigram encoding.
   * @param tokens The tokens to encode.
   * @returns An array of encoded tokens.
   */
  encode(tokens) {
    const to_return = [];
    for (const token of tokens) {
      const tokenized = this.tokenize(token);
      to_return.push(...tokenized);
    }
    return to_return;
  }
};
var Unigram_default = Unigram;
var PriorityQueue = class {
  /**
   * Create a new PriorityQueue.
   * @param comparator Comparator function to determine priority. Defaults to a MaxHeap.
   * @param max_size Maximum size of the queue. Defaults to Infinity.
   */
  constructor(comparator = (a, b) => a > b, max_size = Infinity) {
    this._heap = [];
    this._comparator = comparator;
    this._max_size = max_size;
  }
  /**
   * The size of the queue
   */
  get size() {
    return this._heap.length;
  }
  /**
   * Check if the queue is empty.
   * @returns `true` if the queue is empty, `false` otherwise.
   */
  is_empty() {
    return this.size === 0;
  }
  /**
   * Return the element with the highest priority in the queue.
   * @returns The highest priority element in the queue.
   */
  peek() {
    return this._heap[0];
  }
  /**
   * Add one or more elements to the queue.
   * @param values The values to push into the queue.
   * @returns The new size of the queue.
   */
  push(...values) {
    return this.extend(values);
  }
  /**
   * Add multiple elements to the queue.
   * @param values The values to push into the queue.
   * @returns The new size of the queue.
   */
  extend(values) {
    for (const value of values) {
      if (this.size < this._max_size) {
        this._heap.push(value);
        this._sift_up();
      } else {
        const smallest = this._smallest();
        if (this._comparator(value, this._heap[smallest])) {
          this._heap[smallest] = value;
          this._sift_up_from(smallest);
        }
      }
    }
    return this.size;
  }
  /**
   * Remove and return the element with the highest priority in the queue.
   * @returns The element with the highest priority in the queue.
   */
  pop() {
    const popped_value = this.peek();
    const bottom = this.size - 1;
    if (bottom > 0) {
      this._swap(0, bottom);
    }
    this._heap.pop();
    this._sift_down();
    return popped_value;
  }
  /**
   * Replace the element with the highest priority in the queue with a new value.
   * @param value The new value.
   * @returns The replaced value.
   */
  replace(value) {
    const replaced_value = this.peek();
    this._heap[0] = value;
    this._sift_down();
    return replaced_value;
  }
  /**
   * Compute the index for the parent of the node at index `i`.
   * @param i The index of the node to get the parent of.
   * @returns The index of the parent node.
   * @private
   */
  _parent(i) {
    return (i + 1 >>> 1) - 1;
  }
  /**
   * Compute the index for the left child of the node at index `i`.
   * @param i The index of the node to get the left child of.
   * @returns The index of the left child.
   * @private
   */
  _left(i) {
    return (i << 1) + 1;
  }
  /**
   * Compute the index for the right child of the node at index `i`.
   * @param i The index of the node to get the right child of.
   * @returns The index of the right child.
   * @private
   */
  _right(i) {
    return i + 1 << 1;
  }
  /**
   * Check if the element at index `i` is greater than the element at index `j`.
   * @param i The index of the first element to compare.
   * @param j The index of the second element to compare.
   * @returns `true` if the element at index `i` is greater than the element at index `j`, `false` otherwise.
   * @private
   */
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  /**
   * Swap the elements at indices `i` and `j`.
   * @param i The index of the first element to swap.
   * @param j The index of the second element to swap.
   * @private
   */
  _swap(i, j) {
    const temp = this._heap[i];
    this._heap[i] = this._heap[j];
    this._heap[j] = temp;
  }
  /**
   * Maintain the heap property by updating positions in the heap,
   * starting at the last element and moving up the heap.
   * @private
   */
  _sift_up() {
    this._sift_up_from(this.size - 1);
  }
  /**
   * Helper function to sift up from a given node.
   * @param node The index of the node to start sifting up from.
   */
  _sift_up_from(node) {
    while (node > 0 && this._greater(node, this._parent(node))) {
      this._swap(node, this._parent(node));
      node = this._parent(node);
    }
  }
  /**
   * Maintain the heap property by updating positions in the heap,
   * starting at the first element and moving down the heap.
   * @private
   */
  _sift_down() {
    let node = 0;
    while (this._left(node) < this.size && this._greater(this._left(node), node) || this._right(node) < this.size && this._greater(this._right(node), node)) {
      const max_child = this._right(node) < this.size && this._greater(this._right(node), this._left(node)) ? this._right(node) : this._left(node);
      this._swap(node, max_child);
      node = max_child;
    }
  }
  /**
   * Get the index of the smallest element in the heap. Since we use an array-based heap,
   * the index can be computed without needing to traverse the heap.
   * @private
   */
  _smallest() {
    return 2 ** Math.floor(Math.log2(this.size)) - 1;
  }
};
var PriorityQueue_default = PriorityQueue;
var LRUCache = class {
  /**
   * Creates an LRUCache instance.
   * @param capacity The maximum number of items the cache can hold.
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = /* @__PURE__ */ new Map();
  }
  /**
   * Retrieves the value associated with the given key and marks the key as recently used.
   * @param key The key to retrieve.
   * @returns The value associated with the key, or undefined if the key does not exist.
   */
  get(key) {
    if (!this.cache.has(key)) return void 0;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  /**
   * Inserts or updates the key-value pair in the cache.
   * If the key already exists, it is updated and marked as recently used.
   * If the cache exceeds its capacity, the least recently used item is evicted.
   * @param key The key to add or update.
   * @param value The value to associate with the key.
   */
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }
  /**
   * Clears the cache.
   */
  clear() {
    this.cache.clear();
  }
};
var LRUCache_default = LRUCache;
var BPE = class extends TokenizerModel_default {
  /**
   * Create a BPE instance.
   * @param config The configuration object for BPE.
   */
  constructor(config) {
    super(config);
    this.tokens_to_ids = object_to_map(config.vocab);
    this.unk_token_id = this.tokens_to_ids.get(config.unk_token);
    this.unk_token = config.unk_token;
    this.vocab = new Array(this.tokens_to_ids.size);
    for (const [key, value] of this.tokens_to_ids) {
      this.vocab[value] = key;
    }
    const use_new_merge_format = Array.isArray(config.merges[0]);
    this.merges = use_new_merge_format ? config.merges : config.merges.map(
      (x) => x.split(" ", 2)
    );
    this.bpe_ranks = new Map(this.merges.map((x, i) => [JSON.stringify(x), i]));
    this.end_of_word_suffix = config.end_of_word_suffix;
    this.continuing_subword_suffix = config.continuing_subword_suffix ?? null;
    this.byte_fallback = this.config.byte_fallback ?? false;
    if (this.byte_fallback) {
      this.text_encoder = new TextEncoder();
    }
    this.ignore_merges = this.config.ignore_merges ?? false;
    this.max_length_to_cache = 256;
    this.cache_capacity = 1e4;
    this.cache = new LRUCache_default(this.cache_capacity);
  }
  /**
   * Clears the cache.
   */
  clear_cache() {
    this.cache.clear();
  }
  /**
   * Apply Byte-Pair-Encoding (BPE) to a given token. Efficient heap-based priority
   * queue implementation adapted from https://github.com/belladoreai/llama-tokenizer-js.
   * @param token The token to encode.
   * @returns The BPE encoded tokens.
   */
  bpe(token) {
    if (token.length === 0) {
      return [];
    }
    const cached = this.cache.get(token);
    if (cached !== void 0) {
      return cached;
    }
    const word = Array.from(token);
    if (this.end_of_word_suffix) {
      word[word.length - 1] += this.end_of_word_suffix;
    }
    let result = [];
    if (word.length > 1) {
      const queue = new PriorityQueue_default((a, b) => a.score < b.score);
      let starting_node = {
        token: word[0],
        bias: 0,
        prev: null,
        next: null
      };
      let previous_node = starting_node;
      for (let i = 1; i < word.length; ++i) {
        const current_node = {
          bias: i / word.length,
          // Add fractional component to break ties
          token: word[i],
          prev: previous_node,
          next: null
        };
        previous_node.next = current_node;
        this.add_node(queue, previous_node);
        previous_node = current_node;
      }
      while (!queue.is_empty()) {
        const node = queue.pop();
        if (node.deleted || !node.next || node.next.deleted) continue;
        node.deleted = true;
        node.next.deleted = true;
        if (node.prev) {
          const new_previous_node = { ...node.prev };
          node.prev.deleted = true;
          node.prev = new_previous_node;
          if (new_previous_node.prev) {
            new_previous_node.prev.next = new_previous_node;
          } else {
            starting_node = new_previous_node;
          }
        }
        const merged = {
          token: node.token + node.next.token,
          bias: node.bias,
          prev: node.prev,
          next: node.next.next
        };
        if (merged.prev) {
          merged.prev.next = merged;
          this.add_node(queue, merged.prev);
        } else {
          starting_node = merged;
        }
        if (merged.next) {
          merged.next.prev = merged;
          this.add_node(queue, merged);
        }
      }
      for (let current_node = starting_node; current_node !== null; current_node = current_node.next) {
        result.push(current_node.token);
      }
    } else {
      result = word;
    }
    if (this.continuing_subword_suffix) {
      for (let i = 0; i < result.length - 1; ++i) {
        result[i] += this.continuing_subword_suffix;
      }
    }
    if (token.length < this.max_length_to_cache) {
      this.cache.put(token, result);
    }
    return result;
  }
  /**
   * Helper function to add a node to the priority queue.
   * @param queue
   * @param node
   */
  add_node(queue, node) {
    const rank = this.bpe_ranks.get(
      JSON.stringify([node.token, node.next.token])
    );
    if (rank !== void 0) {
      node.score = rank + node.bias;
      queue.push(node);
    }
  }
  /**
   * Encodes the input sequence of tokens using the BPE algorithm and returns the resulting subword tokens.
   * @param tokens The input sequence of tokens to encode.
   * @returns The resulting subword tokens after applying the BPE algorithm to the input sequence of tokens.
   */
  encode(tokens) {
    const output_tokens = [];
    for (const token of tokens) {
      if (this.ignore_merges && this.tokens_to_ids.has(token)) {
        output_tokens.push(token);
        continue;
      }
      const bpe_token_list = this.bpe(token);
      for (const t of bpe_token_list) {
        if (this.tokens_to_ids.has(t)) {
          output_tokens.push(t);
        } else if (this.byte_fallback) {
          const byte_tokens = Array.from(this.text_encoder.encode(t)).map(
            (x) => `<0x${x.toString(16).toUpperCase().padStart(2, "0")}>`
          );
          if (byte_tokens.every((x) => this.tokens_to_ids.has(x))) {
            output_tokens.push(...byte_tokens);
          } else if (this.unk_token != null) {
            output_tokens.push(this.unk_token);
          }
        } else if (this.unk_token != null) {
          output_tokens.push(this.unk_token);
        }
      }
    }
    return output_tokens;
  }
};
var BPE_default = BPE;
var Legacy = class extends TokenizerModel_default {
  /**
   * Create a Legacy tokenizer model instance.
   * @param config The configuration object for Legacy tokenizer model.
   * @param more_config Additional configuration object for the Legacy tokenizer model.
   */
  constructor(config, more_config) {
    super(config);
    const vocab = config.vocab;
    this.tokens_to_ids = object_to_map(
      more_config.target_lang ? vocab[more_config.target_lang] : vocab
    );
    this.bos_token = more_config.bos_token;
    this.bos_token_id = this.tokens_to_ids.get(this.bos_token);
    this.eos_token = more_config.eos_token;
    this.eos_token_id = this.tokens_to_ids.get(this.eos_token);
    this.pad_token = more_config.pad_token;
    this.pad_token_id = this.tokens_to_ids.get(this.pad_token);
    this.unk_token = more_config.unk_token;
    this.unk_token_id = this.tokens_to_ids.get(this.unk_token);
    this.vocab = new Array(this.tokens_to_ids.size);
    for (const [key, value] of this.tokens_to_ids) {
      this.vocab[value] = key;
    }
  }
  encode(tokens) {
    return tokens;
  }
};
var Legacy_default = Legacy;
function create_tokenizer_model(model_config, config) {
  switch (model_config.type) {
    case "WordPiece":
      return new WordPiece_default(model_config);
    case "Unigram":
      return new Unigram_default(model_config, config.eos_token);
    case "BPE":
      return new BPE_default(model_config);
    default:
      if (model_config.vocab) {
        if (Array.isArray(model_config.vocab)) {
          return new Unigram_default(model_config, config.eos_token);
        } else if (Object.hasOwn(model_config, "continuing_subword_prefix") && Object.hasOwn(model_config, "unk_token")) {
          if (Object.hasOwn(model_config, "merges")) {
            return new BPE_default(model_config);
          } else {
            return new WordPiece_default(model_config);
          }
        } else {
          return new Legacy_default(model_config, {
            target_lang: config.target_lang,
            bos_token: config.bos_token,
            eos_token: config.eos_token,
            pad_token: config.pad_token,
            unk_token: config.unk_token
          });
        }
      }
      throw new Error(
        `Unknown TokenizerModel type: ${model_config?.type}`
      );
  }
}
var create_tokenizer_model_default = create_tokenizer_model;
var PostProcessor = class extends Callable_default {
  /**
   * @param config The configuration for the post-processor.
   */
  constructor(config) {
    super();
    this.config = config;
  }
  /**
   * Alias for {@link PostProcessor#post_process}.
   * @param tokens The text or array of texts to post-process.
   * @param args Additional arguments required by the post-processing logic.
   * @returns The post-processed tokens.
   */
  _call(tokens, ...args) {
    return this.post_process(tokens, ...args);
  }
};
var PostProcessor_default = PostProcessor;
var TemplateProcessing = class extends PostProcessor_default {
  /**
   * Replaces special tokens in the template with actual tokens.
   * @param tokens The list of tokens for the first sequence.
   * @param tokens_pair The list of tokens for the second sequence (optional).
   * @param add_special_tokens Whether to add the special tokens to the beginning and end of the input.
   * @returns An object containing the list of tokens with the special tokens replaced with actual tokens.
   */
  post_process(tokens, tokens_pair = null, add_special_tokens = true) {
    const type = tokens_pair === null ? this.config.single : this.config.pair;
    let processed_tokens = [];
    let types = [];
    for (const item of type) {
      if ("SpecialToken" in item) {
        if (add_special_tokens) {
          processed_tokens.push(item.SpecialToken.id);
          types.push(item.SpecialToken.type_id);
        }
      } else if ("Sequence" in item) {
        if (item.Sequence.id === "A") {
          processed_tokens = merge_arrays(processed_tokens, tokens);
          types = merge_arrays(
            types,
            new Array(tokens.length).fill(item.Sequence.type_id)
          );
        } else if (item.Sequence.id === "B") {
          processed_tokens = merge_arrays(processed_tokens, tokens_pair);
          types = merge_arrays(
            types,
            new Array(tokens_pair.length).fill(item.Sequence.type_id)
          );
        }
      }
    }
    return { tokens: processed_tokens, token_type_ids: types };
  }
};
var TemplateProcessing_default = TemplateProcessing;
var ByteLevel2 = class extends PostProcessor_default {
  /**
   * Post process the given tokens.
   * @param tokens The list of tokens for the first sequence.
   * @param tokens_pair The list of tokens for the second sequence (optional).
   * @returns An object containing the post-processed tokens.
   */
  post_process(tokens, tokens_pair = null) {
    return { tokens, tokens_pair };
  }
};
var ByteLevel_default2 = ByteLevel2;
var BertProcessing = class extends PostProcessor_default {
  /**
   * @param config The configuration for the post-processor.
   * @param config.cls The special tokens to add to the beginning of the input.
   * @param config.sep The special tokens to add to the end of the input.
   */
  constructor(config) {
    super(config);
    this.sep = config.sep;
    this.cls = config.cls;
  }
  /**
   * Adds the special tokens to the beginning and end of the input.
   * @param tokens The input tokens.
   * @param tokens_pair An optional second set of input tokens.
   * @param add_special_tokens Whether to add the special tokens to the beginning and end of the input.
   * @returns The post-processed tokens with the special tokens added to the beginning and end.
   */
  post_process(tokens, tokens_pair = null, add_special_tokens = true) {
    if (add_special_tokens) {
      tokens = merge_arrays([this.cls[0]], tokens, [this.sep[0]]);
    }
    let token_type_ids = new Array(tokens.length).fill(0);
    if (tokens_pair) {
      const middle = [];
      const after = add_special_tokens ? [this.sep[0]] : [];
      tokens = merge_arrays(tokens, middle, tokens_pair, after);
      token_type_ids = merge_arrays(
        token_type_ids,
        new Array(tokens_pair.length + middle.length + after.length).fill(1)
      );
    }
    return { tokens, token_type_ids };
  }
};
var BertProcessing_default = BertProcessing;
var RobertaProcessing = class extends PostProcessor_default {
  /**
   * @param config The configuration for the post-processor.
   * @param config.cls The special tokens to add to the beginning of the input.
   * @param config.sep The special tokens to add to the end of the input.
   */
  constructor(config) {
    super(config);
    this.sep = config.sep;
    this.cls = config.cls;
  }
  /**
   * Adds the special tokens to the beginning and end of the input.
   * @param tokens The input tokens.
   * @param tokens_pair An optional second set of input tokens.
   * @param add_special_tokens Whether to add the special tokens to the beginning and end of the input.
   * @returns The post-processed tokens with the special tokens added to the beginning and end.
   */
  post_process(tokens, tokens_pair, add_special_tokens = true) {
    if (add_special_tokens) {
      tokens = merge_arrays([this.cls[0]], tokens, [this.sep[0]]);
    }
    let token_type_ids = new Array(tokens.length).fill(0);
    if (tokens_pair) {
      const middle = add_special_tokens ? [this.sep[0]] : [];
      const after = add_special_tokens ? [this.sep[0]] : [];
      tokens = merge_arrays(tokens, middle, tokens_pair, after);
      token_type_ids = merge_arrays(
        token_type_ids,
        new Array(tokens_pair.length + middle.length + after.length).fill(1)
      );
    }
    return { tokens, token_type_ids };
  }
};
var RobertaProcessing_default = RobertaProcessing;
var Sequence3 = class extends PostProcessor_default {
  /**
   * Creates a new instance of Sequence post-processor.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.processors = (config.processors ?? []).map((x) => create_post_processor_default(x));
  }
  /**
   * Post process the given tokens.
   * @param tokens The list of tokens for the first sequence.
   * @param tokens_pair The list of tokens for the second sequence (optional).
   * @param add_special_tokens Whether to add the special tokens to the beginning and end of the input.
   * @returns An object containing the post-processed tokens.
   */
  post_process(tokens, tokens_pair = null, add_special_tokens = true) {
    let processed_tokens = { tokens, tokens_pair };
    for (const processor of this.processors) {
      processed_tokens = processor.post_process(
        processed_tokens.tokens,
        processed_tokens.tokens_pair,
        add_special_tokens
      );
    }
    return processed_tokens;
  }
};
var Sequence_default3 = Sequence3;
function create_post_processor(config) {
  if (config === null) return null;
  switch (config.type) {
    case "TemplateProcessing":
      return new TemplateProcessing_default(config);
    case "ByteLevel":
      return new ByteLevel_default2(config);
    case "BertProcessing":
      return new BertProcessing_default(config);
    case "RobertaProcessing":
      return new RobertaProcessing_default(config);
    case "Sequence":
      return new Sequence_default3(config);
    default:
      throw new Error(`Unknown PostProcessor type: ${config.type}`);
  }
}
var create_post_processor_default = create_post_processor;
var Decoder = class extends Callable_default {
  /**
   * Creates an instance of `Decoder`.
   * @param config The configuration object.
   **/
  constructor(config) {
    super();
    this.config = config;
    this.added_tokens = [];
    this.end_of_word_suffix = null;
    this.trim_offsets = "trim_offsets" in config ? config.trim_offsets : false;
  }
  /**
   * Calls the `decode` method.
   *
   * @param tokens The list of tokens.
   * @returns The decoded string.
   */
  _call(tokens) {
    return this.decode(tokens);
  }
  /**
   * Decodes a list of tokens.
   * @param tokens The list of tokens.
   * @returns The decoded string.
   */
  decode(tokens) {
    return this.decode_chain(tokens).join("");
  }
};
var Decoder_default = Decoder;
var ByteLevel3 = class extends Decoder_default {
  /**
   * Create a `ByteLevelDecoder` object.
   */
  constructor(config) {
    super(config);
    this.byte_decoder = UNICODE_TO_BYTES;
    this.text_decoder = new TextDecoder("utf-8", {
      fatal: false,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ignoreBOM: true
    });
    this.end_of_word_suffix = null;
  }
  /**
   * Convert an array of tokens to string by decoding each byte.
   * @param tokens Array of tokens to be decoded.
   * @returns The decoded string.
   */
  convert_tokens_to_string(tokens) {
    const text = tokens.join("");
    const byte_array = new Uint8Array(
      [...text].map((c) => this.byte_decoder[c])
    );
    return this.text_decoder.decode(byte_array);
  }
  decode_chain(tokens) {
    const sub_texts = [];
    let current_sub_text = [];
    for (const token of tokens) {
      if (this.added_tokens.find((x) => x.content === token) !== void 0) {
        if (current_sub_text.length > 0) {
          sub_texts.push(this.convert_tokens_to_string(current_sub_text));
          current_sub_text = [];
        }
        sub_texts.push(token);
      } else {
        current_sub_text.push(token);
      }
    }
    if (current_sub_text.length > 0) {
      sub_texts.push(this.convert_tokens_to_string(current_sub_text));
    }
    return sub_texts;
  }
};
var ByteLevel_default3 = ByteLevel3;
var WordPiece = class extends Decoder_default {
  /**
   * Creates a new instance of WordPieceDecoder.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.cleanup = config.cleanup;
  }
  decode_chain(tokens) {
    return tokens.map((token, i) => {
      if (i !== 0) {
        const prefix = this.config.prefix;
        if (prefix && token.startsWith(prefix)) {
          token = token.replace(prefix, "");
        } else {
          token = " " + token;
        }
      }
      if (this.cleanup) {
        token = clean_up_tokenization(token);
      }
      return token;
    });
  }
};
var WordPiece_default2 = WordPiece;
var Metaspace2 = class extends Decoder_default {
  /**
   * Constructs a new MetaspaceDecoder object.
   * @param config The configuration object for the MetaspaceDecoder.
   */
  constructor(config) {
    super(config);
    this.replacement = config.replacement ?? "\u2581";
  }
  decode_chain(tokens) {
    const result = [];
    for (let i = 0; i < tokens.length; ++i) {
      let normalized = tokens[i].replaceAll(this.replacement, " ");
      if (i == 0 && normalized.startsWith(" ")) {
        normalized = normalized.substring(1);
      }
      result.push(normalized);
    }
    return result;
  }
};
var Metaspace_default2 = Metaspace2;
var BPE2 = class extends Decoder_default {
  constructor(config) {
    super(config);
    this.suffix = config.suffix ?? "";
  }
  decode_chain(tokens) {
    return tokens.map((token, i) => {
      return token.replaceAll(this.suffix, i === tokens.length - 1 ? "" : " ");
    });
  }
};
var BPE_default2 = BPE2;
var CTC = class extends Decoder_default {
  constructor(config) {
    super(config);
    this.pad_token = config.pad_token ?? "";
    this.word_delimiter_token = config.word_delimiter_token ?? "";
    this.cleanup = config.cleanup;
  }
  /**
   * Converts a connectionist-temporal-classification (CTC) output tokens into a single string.
   * @param tokens Array of tokens to be decoded.
   * @returns The decoded string.
   */
  convert_tokens_to_string(tokens) {
    if (tokens.length === 0) return "";
    const grouped_tokens = [tokens[0]];
    for (let i = 1; i < tokens.length; ++i) {
      if (tokens[i] !== grouped_tokens.at(-1)) {
        grouped_tokens.push(tokens[i]);
      }
    }
    const filtered_tokens = grouped_tokens.filter(
      (token) => token !== this.pad_token
    );
    let text = filtered_tokens.join("");
    if (this.cleanup) {
      text = clean_up_tokenization(text).replaceAll(this.word_delimiter_token, " ").trim();
    }
    return text;
  }
  decode_chain(tokens) {
    return [this.convert_tokens_to_string(tokens)];
  }
};
var CTC_default = CTC;
var Sequence4 = class extends Decoder_default {
  /**
   * Creates a new instance of DecoderSequence.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.decoders = (config.decoders ?? []).map((x) => create_decoder_default(x));
  }
  decode_chain(tokens) {
    return this.decoders.reduce((toks, decoder) => {
      return decoder.decode_chain(toks);
    }, tokens);
  }
};
var Sequence_default4 = Sequence4;
var Replace3 = class extends Decoder_default {
  /**
   * @param config The configuration object for the decoder.
   */
  constructor(config) {
    super(config);
    this.pattern = create_pattern(this.config.pattern);
  }
  decode_chain(tokens) {
    const content = this.config.content ?? "";
    const pattern = this.pattern;
    return pattern === null ? tokens : tokens.map((token) => token.replaceAll(pattern, content));
  }
};
var Replace_default3 = Replace3;
var Fuse = class extends Decoder_default {
  decode_chain(tokens) {
    return [tokens.join("")];
  }
};
var Fuse_default = Fuse;
var Strip2 = class extends Decoder_default {
  constructor(config) {
    super(config);
    this.content = config.content ?? "";
    this.start = config.start ?? 0;
    this.stop = config.stop ?? 0;
  }
  decode_chain(tokens) {
    return tokens.map((token) => {
      let start_cut = 0;
      for (let i = 0; i < this.start; ++i) {
        if (token[i] === this.content) {
          start_cut = i + 1;
          continue;
        } else {
          break;
        }
      }
      let stop_cut = token.length;
      for (let i = 0; i < this.stop; ++i) {
        const index = token.length - i - 1;
        if (token[index] === this.content) {
          stop_cut = index;
          continue;
        } else {
          break;
        }
      }
      return token.slice(start_cut, stop_cut);
    });
  }
};
var Strip_default2 = Strip2;
var ByteFallback = class extends Decoder_default {
  constructor(config) {
    super(config);
    this.text_decoder = new TextDecoder();
  }
  decode_chain(tokens) {
    const new_tokens = [];
    let previous_byte_tokens = [];
    for (const token of tokens) {
      let bytes = null;
      if (token.length === 6 && token.startsWith("<0x") && token.endsWith(">")) {
        const byte = parseInt(token.slice(3, 5), 16);
        if (!isNaN(byte)) {
          bytes = byte;
        }
      }
      if (bytes !== null) {
        previous_byte_tokens.push(bytes);
      } else {
        if (previous_byte_tokens.length > 0) {
          const string = this.text_decoder.decode(
            Uint8Array.from(previous_byte_tokens)
          );
          new_tokens.push(string);
          previous_byte_tokens = [];
        }
        new_tokens.push(token);
      }
    }
    if (previous_byte_tokens.length > 0) {
      const string = this.text_decoder.decode(
        Uint8Array.from(previous_byte_tokens)
      );
      new_tokens.push(string);
      previous_byte_tokens = [];
    }
    return new_tokens;
  }
};
var ByteFallback_default = ByteFallback;
function create_decoder(config) {
  if (config === null) return null;
  switch (config.type) {
    case "ByteLevel":
      return new ByteLevel_default3(config);
    case "WordPiece":
      return new WordPiece_default2(config);
    case "Metaspace":
      return new Metaspace_default2(config);
    case "BPEDecoder":
      return new BPE_default2(config);
    case "CTC":
      return new CTC_default(config);
    case "Sequence":
      return new Sequence_default4(config);
    case "Replace":
      return new Replace_default3(config);
    case "Fuse":
      return new Fuse_default(config);
    case "Strip":
      return new Strip_default2(config);
    case "ByteFallback":
      return new ByteFallback_default(config);
    default:
      throw new Error(`Unknown Decoder type: ${config.type}`);
  }
}
var create_decoder_default = create_decoder;
var Tokenizer = class {
  constructor(tokenizer, config) {
    const tokenizer_error = validate_object(tokenizer, "Tokenizer", [
      "model",
      "decoder",
      "post_processor",
      "pre_tokenizer",
      "normalizer"
    ]);
    if (tokenizer_error) {
      throw new Error(tokenizer_error);
    }
    const config_error = validate_object(config, "Config");
    if (config_error) {
      throw new Error(config_error);
    }
    this.tokenizer = tokenizer;
    this.config = config;
    this.normalizer = create_normalizer_default(this.tokenizer.normalizer);
    this.pre_tokenizer = create_pre_tokenizer_default(this.tokenizer.pre_tokenizer);
    this.model = create_tokenizer_model_default(this.tokenizer.model, this.config);
    this.post_processor = create_post_processor_default(this.tokenizer.post_processor);
    this.decoder = create_decoder_default(this.tokenizer.decoder);
    this.special_tokens = [];
    this.all_special_ids = [];
    this.added_tokens = [];
    const unnormalized_contents = [];
    const normalized_contents = [];
    this.added_tokens_map = /* @__PURE__ */ new Map();
    for (const added_token of this.tokenizer.added_tokens) {
      const token = new AddedToken_default(added_token);
      this.added_tokens.push(token);
      this.model.tokens_to_ids.set(token.content, token.id);
      this.model.vocab[token.id] = token.content;
      if (token.special) {
        this.special_tokens.push(token.content);
        this.all_special_ids.push(token.id);
      }
      this.added_tokens_map.set(token.content, token);
      if (token.normalized && this.normalizer !== null) {
        const normalized_content = this.normalizer(token.content);
        normalized_contents.push(normalized_content);
        this.added_tokens_map.set(normalized_content, token);
      } else {
        unnormalized_contents.push(token.content);
      }
    }
    (this.config.additional_special_tokens ?? []).forEach((token) => {
      if (!this.special_tokens.includes(token)) this.special_tokens.push(token);
    });
    if (this.decoder) {
      this.decoder.added_tokens = this.added_tokens;
      this.decoder.end_of_word_suffix = this.model.end_of_word_suffix;
    }
    this.splitter_unnormalized = new DictionarySplitter_default(unnormalized_contents);
    this.splitter_normalized = new DictionarySplitter_default(normalized_contents);
    this.remove_space = this.config.remove_space;
    this.clean_up_tokenization_spaces = this.config.clean_up_tokenization_spaces ?? true;
    this.do_lowercase_and_remove_accent = this.config.do_lowercase_and_remove_accent ?? false;
  }
  // Implementation
  encode(text, {
    text_pair = null,
    add_special_tokens = true,
    return_token_type_ids = null
  } = {}) {
    const { tokens, token_type_ids } = this.tokenize_helper(text, {
      text_pair,
      add_special_tokens
    });
    const input_ids = tokens.map(
      (t) => this.added_tokens_map.get(t)?.id ?? this.model.tokens_to_ids.get(t) ?? this.model.unk_token_id
    );
    const result = {
      ids: input_ids,
      tokens,
      attention_mask: new Array(input_ids.length).fill(1)
    };
    if (return_token_type_ids && token_type_ids) {
      result.token_type_ids = token_type_ids;
    }
    return result;
  }
  decode(token_ids, options = {}) {
    if (!Array.isArray(token_ids) || token_ids.length === 0 || !is_integral_number(token_ids[0])) {
      throw Error("token_ids must be a non-empty array of integers.");
    }
    let tokens = token_ids.map(
      (i) => this.model.vocab[Number(i)] ?? this.model.unk_token
    );
    if (options.skip_special_tokens) {
      tokens = tokens.filter((x) => !this.special_tokens.includes(x));
    }
    let decoded = this.decoder ? this.decoder(tokens) : tokens.join(" ");
    if (this.decoder && this.decoder.end_of_word_suffix) {
      decoded = decoded.replaceAll(this.decoder.end_of_word_suffix, " ");
      if (options.skip_special_tokens) {
        decoded = decoded.trim();
      }
    }
    if (options.clean_up_tokenization_spaces ?? this.clean_up_tokenization_spaces) {
      decoded = clean_up_tokenization(decoded);
    }
    return decoded;
  }
  /**
   * Converts a string into a sequence of tokens.
   * @param text The sequence to be encoded.
   * @param options An optional object containing the following properties:
   * @returns The list of tokens.
   */
  tokenize(text, { text_pair = null, add_special_tokens = false } = {}) {
    return this.tokenize_helper(text, { text_pair, add_special_tokens }).tokens;
  }
  encode_text(text) {
    if (text === null) {
      return null;
    }
    const sections = this.splitter_unnormalized.split(text);
    sections.forEach((section, i) => {
      const added_token = this.added_tokens_map.get(section);
      if (added_token) {
        if (added_token.lstrip && i > 0) {
          sections[i - 1] = sections[i - 1].trimEnd();
        }
        if (added_token.rstrip && i < sections.length - 1) {
          sections[i + 1] = sections[i + 1].trimStart();
        }
      }
    });
    return sections.flatMap((processed_text, section_index) => {
      if (processed_text.length === 0) {
        return [];
      }
      if (this.added_tokens_map.has(processed_text)) {
        return [processed_text];
      }
      if (this.remove_space === true) {
        processed_text = processed_text.trim().split(/\s+/).join(" ");
      }
      if (this.do_lowercase_and_remove_accent) {
        processed_text = lowercase_and_remove_accents(processed_text);
      }
      if (this.normalizer !== null) {
        processed_text = this.normalizer(processed_text);
      }
      if (processed_text.length === 0) {
        return [];
      }
      const subsections = this.splitter_normalized.split(processed_text);
      subsections.forEach((subsection, j) => {
        const added_token = this.added_tokens_map.get(subsection);
        if (added_token) {
          if (added_token.lstrip && j > 0) {
            subsections[j - 1] = subsections[j - 1].trimEnd();
          }
          if (added_token.rstrip && j < subsections.length - 1) {
            subsections[j + 1] = subsections[j + 1].trimStart();
          }
        }
      });
      return subsections.flatMap((subsection) => {
        if (subsection.length === 0) {
          return [];
        }
        if (this.added_tokens_map.has(subsection)) {
          return [subsection];
        }
        const section_tokens = this.pre_tokenizer !== null ? this.pre_tokenizer(subsection, {
          section_index
        }) : [subsection];
        return this.model(section_tokens);
      });
    });
  }
  tokenize_helper(text, { text_pair = null, add_special_tokens = true }) {
    const tokens1 = this.encode_text(text);
    const tokens2 = this.encode_text(text_pair || null);
    return this.post_processor ? this.post_processor(tokens1, tokens2, add_special_tokens) : { tokens: merge_arrays(tokens1 ?? [], tokens2 ?? []) };
  }
  /**
   * Converts a token string to its corresponding token ID.
   * @param token The token string to convert.
   * @returns The token ID, or undefined if the token is not in the vocabulary.
   */
  token_to_id(token) {
    return this.model.tokens_to_ids.get(token);
  }
  /**
   * Converts a token ID to its corresponding token string.
   * @param id The token ID to convert.
   * @returns The token string, or undefined if the ID is not in the vocabulary.
   */
  id_to_token(id) {
    return this.model.vocab[id];
  }
  /**
   * Returns a mapping of token IDs to AddedToken objects for all added tokens.
   * @returns A Map where keys are token IDs and values are AddedToken objects.
   */
  get_added_tokens_decoder() {
    const decoder = /* @__PURE__ */ new Map();
    for (const token of this.added_tokens) {
      decoder.set(token.id, token);
    }
    return decoder;
  }
  /**
   * Get the underlying vocabulary
   * @param with_added_tokens Whether to include the added tokens
   * @returns The vocabulary
   */
  get_vocab(with_added_tokens = true) {
    const vocab = /* @__PURE__ */ new Map();
    for (let i = 0; i < this.model.vocab.length; ++i) {
      const token = this.model.vocab[i];
      if (with_added_tokens || !this.added_tokens_map.has(token)) {
        vocab.set(token, i);
      }
    }
    return vocab;
  }
};
var Tokenizer_default = Tokenizer;

// node_modules/onnxruntime-web/dist/ort.wasm.bundle.min.mjs
var nr = Object.defineProperty;
var hs = Object.getOwnPropertyDescriptor;
var ws = Object.getOwnPropertyNames;
var bs = Object.prototype.hasOwnProperty;
var or = ((r) => typeof __require < "u" ? __require : typeof Proxy < "u" ? new Proxy(r, { get: (t, a) => (typeof __require < "u" ? __require : t)[a] }) : r)(function(r) {
  if (typeof __require < "u") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + r + '" is not supported');
});
var M = (r, t, a) => () => {
  if (a) throw a[0];
  try {
    return r && (t = r(r = 0)), t;
  } catch (u) {
    throw a = [u], u;
  }
};
var pt = (r, t) => {
  for (var a in t) nr(r, a, { get: t[a], enumerable: true });
};
var ys = (r, t, a, u) => {
  if (t && typeof t == "object" || typeof t == "function") for (let o of ws(t)) !bs.call(r, o) && o !== a && nr(r, o, { get: () => t[o], enumerable: !(u = hs(t, o)) || u.enumerable });
  return r;
};
var ar = (r) => ys(nr({}, "__esModule", { value: true }), r);
var Qe;
var Le;
var gn;
var et;
var En;
var Tn;
var Sn;
var mt = M(() => {
  "use strict";
  Qe = /* @__PURE__ */ new Map(), Le = [], gn = /* @__PURE__ */ new WeakMap(), et = (r, t, a) => {
    if (t && typeof t.init == "function" && typeof t.createInferenceSessionHandler == "function") {
      let u = Qe.get(r);
      if (u === void 0) Qe.set(r, { backend: t, priority: a });
      else {
        if (u.priority > a) return;
        if (u.priority === a && u.backend !== t) throw new Error(`cannot register backend "${r}" using priority ${a}`);
      }
      if (a >= 0) {
        let o = Le.indexOf(r);
        o !== -1 && Le.splice(o, 1);
        for (let d = 0; d < Le.length; d++) if (Qe.get(Le[d]).priority <= a) {
          Le.splice(d, 0, r);
          return;
        }
        Le.push(r);
      }
      return;
    }
    throw new TypeError("not a valid backend");
  }, En = async (r) => {
    let t = Qe.get(r);
    if (!t) return "backend not found.";
    if (t.initialized) return t.backend;
    if (t.aborted) return t.error;
    {
      let a = !!t.initPromise;
      try {
        if (!a) {
          let u = t.backend, o = gn.get(u);
          t.initPromise = o ? o.then(async () => u.init(r), async () => u.init(r)) : u.init(r), gn.set(u, t.initPromise);
        }
        return await t.initPromise, t.initialized = true, t.backend;
      } catch (u) {
        return a || (t.error = `${u}`, t.aborted = true), t.error;
      } finally {
        delete t.initPromise;
      }
    }
  }, Tn = async (r) => {
    let t = r.executionProviders || [], a = t.map((l) => typeof l == "string" ? l : l.name), u = a.length === 0 ? Le : a, o, d = [], w = /* @__PURE__ */ new Set();
    for (let l of u) {
      let m = await En(l);
      typeof m == "string" ? d.push({ name: l, err: m }) : (o || (o = m), o === m && w.add(l));
    }
    if (!o) throw new Error(`no available backend found. ERR: ${d.map((l) => `[${l.name}] ${l.err}`).join(", ")}`);
    for (let { name: l, err: m } of d) a.includes(l) && console.warn(`removing requested execution provider "${l}" from session options because it is not available: ${m}`);
    let c = t.filter((l) => w.has(typeof l == "string" ? l : l.name));
    return [o, new Proxy(r, { get: (l, m) => m === "executionProviders" ? c : Reflect.get(l, m) })];
  }, Sn = async () => {
    let r = [];
    for (let a of Le) {
      if (typeof Qe.get(a).backend.createLoraAdapterHandler != "function") continue;
      let u = await En(a);
      if (typeof u != "string") return u;
      r.push({ name: a, err: u });
    }
    let t = r.length === 0 ? "" : ` ERR: ${r.map((a) => `[${a.name}] ${a.err}`).join(", ")}`;
    throw new Error(`no available backend supports LoRA adapters.${t}`);
  };
});
var vn = M(() => {
  "use strict";
  mt();
});
var An;
var On = M(() => {
  "use strict";
  An = "1.31.1";
});
var In;
var K;
var sr = M(() => {
  "use strict";
  On();
  In = "warning", K = { wasm: {}, webgl: {}, webgpu: {}, versions: { common: An }, set logLevel(r) {
    if (r !== void 0) {
      if (typeof r != "string" || ["verbose", "info", "warning", "error", "fatal"].indexOf(r) === -1) throw new Error(`Unsupported logging level: ${r}`);
      In = r;
    }
  }, get logLevel() {
    return In;
  } };
  Object.defineProperty(K, "logLevel", { enumerable: true });
});
var Y;
var Ln = M(() => {
  "use strict";
  sr();
  Y = K;
});
var Bn;
var _n;
var de;
var le;
var De;
var Pe;
var ht = M(() => {
  "use strict";
  sr();
  Bn = (r, t) => {
    (typeof K.trace > "u" ? !K.wasm.trace : !K.trace) || console.timeStamp(`${r}::ORT::${t}`);
  }, _n = (r, t) => {
    let a = new Error().stack?.split(/\r\n|\r|\n/g) || [], u = false;
    for (let o = 0; o < a.length; o++) {
      if (u && !a[o].includes("TRACE_FUNC")) {
        let d = `FUNC_${r}::${a[o].trim().split(" ")[1]}`;
        t && (d += `::${t}`), Bn("CPU", d);
        return;
      }
      a[o].includes("TRACE_FUNC") && (u = true);
    }
  }, de = (r) => {
    (typeof K.trace > "u" ? !K.wasm.trace : !K.trace) || _n("BEGIN", r);
  }, le = (r) => {
    (typeof K.trace > "u" ? !K.wasm.trace : !K.trace) || _n("END", r);
  }, De = (r) => {
    (typeof K.trace > "u" ? !K.wasm.trace : !K.trace) || console.time(`ORT::${r}`);
  }, Pe = (r) => {
    (typeof K.trace > "u" ? !K.wasm.trace : !K.trace) || console.timeEnd(`ORT::${r}`);
  };
});
var We;
var ir = M(() => {
  "use strict";
  mt();
  ht();
  We = class r {
    constructor(t, a) {
      this.backend = t, this.handler = a;
    }
    static async create(t) {
      if (de(), typeof t != "string" && !(t instanceof Uint8Array)) throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");
      let a = await Sn(), u = await a.createLoraAdapterHandler(t);
      return le(), new r(a, u);
    }
    async release() {
      return this.handler.dispose();
    }
  };
});
var Dn;
var Pn;
var xn = M(() => {
  "use strict";
  Dn = (r, t) => {
    let a = typeof document < "u" ? document.createElement("canvas") : new OffscreenCanvas(1, 1);
    a.width = r.dims[3], a.height = r.dims[2];
    let u = a.getContext("2d");
    if (u != null) {
      let o, d;
      t?.tensorLayout !== void 0 && t.tensorLayout === "NHWC" ? (o = r.dims[2], d = r.dims[3]) : (o = r.dims[3], d = r.dims[2]);
      let w = t?.format !== void 0 ? t.format : "RGB", c = t?.norm, l, m;
      c === void 0 || c.mean === void 0 ? l = [255, 255, 255, 255] : typeof c.mean == "number" ? l = [c.mean, c.mean, c.mean, c.mean] : (l = [c.mean[0], c.mean[1], c.mean[2], 0], c.mean[3] !== void 0 && (l[3] = c.mean[3])), c === void 0 || c.bias === void 0 ? m = [0, 0, 0, 0] : typeof c.bias == "number" ? m = [c.bias, c.bias, c.bias, c.bias] : (m = [c.bias[0], c.bias[1], c.bias[2], 0], c.bias[3] !== void 0 && (m[3] = c.bias[3]));
      let h = d * o, g = 0, y = h, T = h * 2, S = -1;
      w === "RGBA" ? (g = 0, y = h, T = h * 2, S = h * 3) : w === "RGB" ? (g = 0, y = h, T = h * 2) : w === "RBG" && (g = 0, T = h, y = h * 2);
      for (let U = 0; U < d; U++) for (let $ = 0; $ < o; $++) {
        let v = (r.data[g++] - m[0]) * l[0], O = (r.data[y++] - m[1]) * l[1], R = (r.data[T++] - m[2]) * l[2], C = S === -1 ? 255 : (r.data[S++] - m[3]) * l[3];
        u.fillStyle = "rgba(" + v + "," + O + "," + R + "," + C + ")", u.fillRect($, U, 1, 1);
      }
      if ("toDataURL" in a) return a.toDataURL();
      throw new Error("toDataURL is not supported");
    } else throw new Error("Can not access image data");
  }, Pn = (r, t) => {
    let a = typeof document < "u" ? document.createElement("canvas").getContext("2d") : new OffscreenCanvas(1, 1).getContext("2d"), u;
    if (a != null) {
      let o, d, w;
      t?.tensorLayout !== void 0 && t.tensorLayout === "NHWC" ? (o = r.dims[2], d = r.dims[1], w = r.dims[3]) : (o = r.dims[3], d = r.dims[2], w = r.dims[1]);
      let c = t !== void 0 && t.format !== void 0 ? t.format : "RGB", l = t?.norm, m, h;
      l === void 0 || l.mean === void 0 ? m = [255, 255, 255, 255] : typeof l.mean == "number" ? m = [l.mean, l.mean, l.mean, l.mean] : (m = [l.mean[0], l.mean[1], l.mean[2], 255], l.mean[3] !== void 0 && (m[3] = l.mean[3])), l === void 0 || l.bias === void 0 ? h = [0, 0, 0, 0] : typeof l.bias == "number" ? h = [l.bias, l.bias, l.bias, l.bias] : (h = [l.bias[0], l.bias[1], l.bias[2], 0], l.bias[3] !== void 0 && (h[3] = l.bias[3]));
      let g = d * o;
      if (t !== void 0 && (t.format !== void 0 && w === 4 && t.format !== "RGBA" || w === 3 && t.format !== "RGB" && t.format !== "BGR")) throw new Error("Tensor format doesn't match input tensor dims");
      let y = 4, T = 0, S = 1, U = 2, $ = 3, v = 0, O = g, R = g * 2, C = -1;
      c === "RGBA" ? (v = 0, O = g, R = g * 2, C = g * 3) : c === "RGB" ? (v = 0, O = g, R = g * 2) : c === "RBG" && (v = 0, R = g, O = g * 2), u = a.createImageData(o, d);
      for (let G = 0; G < d * o; T += y, S += y, U += y, $ += y, G++) u.data[T] = (r.data[v++] - h[0]) * m[0], u.data[S] = (r.data[O++] - h[1]) * m[1], u.data[U] = (r.data[R++] - h[2]) * m[2], u.data[$] = C === -1 ? 255 : (r.data[C++] - h[3]) * m[3];
    } else throw new Error("Can not access image data");
    return u;
  };
});
var ur;
var Un;
var Cn;
var Mn;
var Rn;
var Nn;
var Fn = M(() => {
  "use strict";
  wt();
  ur = (r, t) => {
    if (r === void 0) throw new Error("Image buffer must be defined");
    if (t.height === void 0 || t.width === void 0) throw new Error("Image height and width must be defined");
    if (t.tensorLayout === "NHWC") throw new Error("NHWC Tensor layout is not supported yet");
    let { height: a, width: u } = t, o = t.norm ?? { mean: 255, bias: 0 }, d, w;
    typeof o.mean == "number" ? d = [o.mean, o.mean, o.mean, o.mean] : d = [o.mean[0], o.mean[1], o.mean[2], o.mean[3] ?? 255], typeof o.bias == "number" ? w = [o.bias, o.bias, o.bias, o.bias] : w = [o.bias[0], o.bias[1], o.bias[2], o.bias[3] ?? 0];
    let c = t.format !== void 0 ? t.format : "RGBA", l = t.tensorFormat !== void 0 && t.tensorFormat !== void 0 ? t.tensorFormat : "RGB", m = a * u, h = l === "RGBA" ? new Float32Array(m * 4) : new Float32Array(m * 3), g = 4, y = 0, T = 1, S = 2, U = 3, $ = 0, v = m, O = m * 2, R = -1;
    c === "RGB" && (g = 3, y = 0, T = 1, S = 2, U = -1), l === "RGBA" ? R = m * 3 : l === "RBG" ? ($ = 0, O = m, v = m * 2) : l === "BGR" && (O = 0, v = m, $ = m * 2);
    for (let G = 0; G < m; G++, y += g, S += g, T += g, U += g) h[$++] = (r[y] + w[0]) / d[0], h[v++] = (r[T] + w[1]) / d[1], h[O++] = (r[S] + w[2]) / d[2], R !== -1 && U !== -1 && (h[R++] = (r[U] + w[3]) / d[3]);
    return l === "RGBA" ? new re("float32", h, [1, 4, a, u]) : new re("float32", h, [1, 3, a, u]);
  }, Un = async (r, t) => {
    let a = typeof HTMLImageElement < "u" && r instanceof HTMLImageElement, u = typeof ImageData < "u" && r instanceof ImageData, o = typeof ImageBitmap < "u" && r instanceof ImageBitmap, d = typeof r == "string", w, c = t ?? {}, l = () => {
      if (typeof document < "u") return document.createElement("canvas");
      if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(1, 1);
      throw new Error("Canvas is not supported");
    }, m = (h) => typeof HTMLCanvasElement < "u" && h instanceof HTMLCanvasElement || h instanceof OffscreenCanvas ? h.getContext("2d") : null;
    if (a) {
      let h = l();
      h.width = r.width, h.height = r.height;
      let g = m(h);
      if (g != null) {
        let y = r.height, T = r.width;
        if (t !== void 0 && t.resizedHeight !== void 0 && t.resizedWidth !== void 0 && (y = t.resizedHeight, T = t.resizedWidth), t !== void 0) {
          if (c = t, t.tensorFormat !== void 0) throw new Error("Image input config format must be RGBA for HTMLImageElement");
          c.tensorFormat = "RGBA", c.height = y, c.width = T;
        } else c.tensorFormat = "RGBA", c.height = y, c.width = T;
        g.drawImage(r, 0, 0), w = g.getImageData(0, 0, T, y).data;
      } else throw new Error("Can not access image data");
    } else if (u) {
      let h, g;
      if (t !== void 0 && t.resizedWidth !== void 0 && t.resizedHeight !== void 0 ? (h = t.resizedHeight, g = t.resizedWidth) : (h = r.height, g = r.width), t !== void 0 && (c = t), c.format = "RGBA", c.height = h, c.width = g, t !== void 0) {
        let y = l();
        y.width = g, y.height = h;
        let T = m(y);
        if (T != null) T.putImageData(r, 0, 0), w = T.getImageData(0, 0, g, h).data;
        else throw new Error("Can not access image data");
      } else w = r.data;
    } else if (o) {
      if (t === void 0) throw new Error("Please provide image config with format for Imagebitmap");
      let h = l();
      h.width = r.width, h.height = r.height;
      let g = m(h);
      if (g != null) {
        let y = r.height, T = r.width;
        return g.drawImage(r, 0, 0, T, y), w = g.getImageData(0, 0, T, y).data, c.height = y, c.width = T, ur(w, c);
      } else throw new Error("Can not access image data");
    } else {
      if (d) return new Promise((h, g) => {
        let y = l(), T = m(y);
        if (!r || !T) return g();
        let S = new Image();
        S.crossOrigin = "Anonymous", S.src = r, S.onload = () => {
          y.width = S.width, y.height = S.height, T.drawImage(S, 0, 0, y.width, y.height);
          let U = T.getImageData(0, 0, y.width, y.height);
          c.height = y.height, c.width = y.width, h(ur(U.data, c));
        };
      });
      throw new Error("Input data provided is not supported - aborted tensor creation");
    }
    if (w !== void 0) return ur(w, c);
    throw new Error("Input data provided is not supported - aborted tensor creation");
  }, Cn = (r, t) => {
    let { width: a, height: u, download: o, dispose: d } = t, w = [1, u, a, 4];
    return new re({ location: "texture", type: "float32", texture: r, dims: w, download: o, dispose: d });
  }, Mn = (r, t) => {
    let { dataType: a, dims: u, download: o, dispose: d } = t;
    return new re({ location: "gpu-buffer", type: a ?? "float32", gpuBuffer: r, dims: u, download: o, dispose: d });
  }, Rn = (r, t) => {
    let { dataType: a, dims: u, download: o, dispose: d } = t;
    return new re({ location: "ml-tensor", type: a ?? "float32", mlTensor: r, dims: u, download: o, dispose: d });
  }, Nn = (r, t, a) => new re({ location: "cpu-pinned", type: r, data: t, dims: a ?? [t.length] });
});
var xe;
var tt;
var kn;
var Wn;
var Gn = M(() => {
  "use strict";
  xe = /* @__PURE__ */ new Map([["float32", Float32Array], ["uint8", Uint8Array], ["int8", Int8Array], ["uint16", Uint16Array], ["int16", Int16Array], ["int32", Int32Array], ["bool", Uint8Array], ["float64", Float64Array], ["uint32", Uint32Array], ["int4", Uint8Array], ["uint4", Uint8Array]]), tt = /* @__PURE__ */ new Map([[Float32Array, "float32"], [Uint8Array, "uint8"], [Int8Array, "int8"], [Uint16Array, "uint16"], [Int16Array, "int16"], [Int32Array, "int32"], [Float64Array, "float64"], [Uint32Array, "uint32"]]), kn = false, Wn = () => {
    if (!kn) {
      kn = true;
      let r = typeof BigInt64Array < "u" && BigInt64Array.from, t = typeof BigUint64Array < "u" && BigUint64Array.from, a = globalThis.Float16Array, u = typeof a < "u" && a.from;
      r && (xe.set("int64", BigInt64Array), tt.set(BigInt64Array, "int64")), t && (xe.set("uint64", BigUint64Array), tt.set(BigUint64Array, "uint64")), u ? (xe.set("float16", a), tt.set(a, "float16")) : xe.set("float16", Uint16Array);
    }
  };
});
var $n;
var Hn;
var zn = M(() => {
  "use strict";
  wt();
  $n = (r) => {
    let t = 1;
    for (let a = 0; a < r.length; a++) {
      let u = r[a];
      if (typeof u != "number" || !Number.isSafeInteger(u)) throw new TypeError(`dims[${a}] must be an integer, got: ${u}`);
      if (u < 0) throw new RangeError(`dims[${a}] must be a non-negative integer, got: ${u}`);
      t *= u;
    }
    return t;
  }, Hn = (r, t) => {
    switch (r.location) {
      case "cpu":
        return new re(r.type, r.data, t);
      case "cpu-pinned":
        return new re({ location: "cpu-pinned", data: r.data, type: r.type, dims: t });
      case "texture":
        return new re({ location: "texture", texture: r.texture, type: r.type, dims: t });
      case "gpu-buffer":
        return new re({ location: "gpu-buffer", gpuBuffer: r.gpuBuffer, type: r.type, dims: t });
      case "ml-tensor":
        return new re({ location: "ml-tensor", mlTensor: r.mlTensor, type: r.type, dims: t });
      default:
        throw new Error(`tensorReshape: tensor location ${r.location} is not supported`);
    }
  };
});
var re;
var wt = M(() => {
  "use strict";
  xn();
  Fn();
  Gn();
  zn();
  re = class {
    constructor(t, a, u) {
      Wn();
      let o, d;
      if (typeof t == "object" && "location" in t) switch (this.dataLocation = t.location, o = t.type, d = t.dims, t.location) {
        case "cpu-pinned": {
          let c = xe.get(o);
          if (!c) throw new TypeError(`unsupported type "${o}" to create tensor from pinned buffer`);
          if (!(t.data instanceof c)) throw new TypeError(`buffer should be of type ${c.name}`);
          this.cpuData = t.data;
          break;
        }
        case "texture": {
          if (o !== "float32") throw new TypeError(`unsupported type "${o}" to create tensor from texture`);
          this.gpuTextureData = t.texture, this.downloader = t.download, this.disposer = t.dispose;
          break;
        }
        case "gpu-buffer": {
          if (o !== "float32" && o !== "float16" && o !== "int32" && o !== "int64" && o !== "uint32" && o !== "uint8" && o !== "bool" && o !== "uint4" && o !== "int4") throw new TypeError(`unsupported type "${o}" to create tensor from gpu buffer`);
          this.gpuBufferData = t.gpuBuffer, this.downloader = t.download, this.disposer = t.dispose;
          break;
        }
        case "ml-tensor": {
          if (o !== "float32" && o !== "float16" && o !== "int32" && o !== "int64" && o !== "uint32" && o !== "uint64" && o !== "int8" && o !== "uint8" && o !== "bool" && o !== "uint4" && o !== "int4") throw new TypeError(`unsupported type "${o}" to create tensor from MLTensor`);
          this.mlTensorData = t.mlTensor, this.downloader = t.download, this.disposer = t.dispose;
          break;
        }
        default:
          throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`);
      }
      else {
        let c, l;
        if (typeof t == "string") if (o = t, l = u, t === "string") {
          if (!Array.isArray(a)) throw new TypeError("A string tensor's data must be a string array.");
          c = a;
        } else {
          let m = xe.get(t);
          if (m === void 0) throw new TypeError(`Unsupported tensor type: ${t}.`);
          if (Array.isArray(a)) {
            if (t === "float16" && m === Uint16Array || t === "uint4" || t === "int4") throw new TypeError(`Creating a ${t} tensor from number array is not supported. Please use ${m.name} as data.`);
            t === "uint64" || t === "int64" ? c = m.from(a, BigInt) : c = m.from(a);
          } else if (a instanceof m) c = a;
          else if (a instanceof Uint8ClampedArray) if (t === "uint8") c = Uint8Array.from(a);
          else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");
          else if (t === "float16" && a instanceof Uint16Array && m !== Uint16Array) c = new globalThis.Float16Array(a.buffer, a.byteOffset, a.length);
          else throw new TypeError(`A ${o} tensor's data must be type of ${m}`);
        }
        else if (l = a, Array.isArray(t)) {
          if (t.length === 0) throw new TypeError("Tensor type cannot be inferred from an empty array.");
          let m = typeof t[0];
          if (m === "string") o = "string", c = t;
          else if (m === "boolean") o = "bool", c = Uint8Array.from(t);
          else throw new TypeError(`Invalid element type of data array: ${m}.`);
        } else if (t instanceof Uint8ClampedArray) o = "uint8", c = Uint8Array.from(t);
        else {
          let m = tt.get(t.constructor);
          if (m === void 0) throw new TypeError(`Unsupported type for tensor data: ${t.constructor}.`);
          o = m, c = t;
        }
        if (l === void 0) l = [c.length];
        else if (!Array.isArray(l)) throw new TypeError("A tensor's dims must be a number array");
        d = l, this.cpuData = c, this.dataLocation = "cpu";
      }
      let w = $n(d);
      if (this.cpuData && w !== this.cpuData.length && !((o === "uint4" || o === "int4") && Math.ceil(w / 2) === this.cpuData.length)) throw new Error(`Tensor's size(${w}) does not match data length(${this.cpuData.length}).`);
      this.type = o, this.dims = d, this.size = w;
    }
    static async fromImage(t, a) {
      return Un(t, a);
    }
    static fromTexture(t, a) {
      return Cn(t, a);
    }
    static fromGpuBuffer(t, a) {
      return Mn(t, a);
    }
    static fromMLTensor(t, a) {
      return Rn(t, a);
    }
    static fromPinnedBuffer(t, a, u) {
      return Nn(t, a, u);
    }
    toDataURL(t) {
      return Dn(this, t);
    }
    toImageData(t) {
      return Pn(this, t);
    }
    get data() {
      if (this.ensureValid(), !this.cpuData) throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");
      return this.cpuData;
    }
    get location() {
      return this.dataLocation;
    }
    get texture() {
      if (this.ensureValid(), !this.gpuTextureData) throw new Error("The data is not stored as a WebGL texture.");
      return this.gpuTextureData;
    }
    get gpuBuffer() {
      if (this.ensureValid(), !this.gpuBufferData) throw new Error("The data is not stored as a WebGPU buffer.");
      return this.gpuBufferData;
    }
    get mlTensor() {
      if (this.ensureValid(), !this.mlTensorData) throw new Error("The data is not stored as a WebNN MLTensor.");
      return this.mlTensorData;
    }
    async getData(t) {
      switch (this.ensureValid(), this.dataLocation) {
        case "cpu":
        case "cpu-pinned":
          return this.data;
        case "texture":
        case "gpu-buffer":
        case "ml-tensor": {
          if (!this.downloader) throw new Error("The current tensor is not created with a specified data downloader.");
          if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
          try {
            this.isDownloading = true;
            let a = await this.downloader();
            return this.downloader = void 0, this.dataLocation = "cpu", this.cpuData = a, t && this.disposer && (this.disposer(), this.disposer = void 0), a;
          } finally {
            this.isDownloading = false;
          }
        }
        default:
          throw new Error(`cannot get data from location: ${this.dataLocation}`);
      }
    }
    dispose() {
      if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
      this.disposer && (this.disposer(), this.disposer = void 0), this.cpuData = void 0, this.gpuTextureData = void 0, this.gpuBufferData = void 0, this.mlTensorData = void 0, this.downloader = void 0, this.isDownloading = void 0, this.dataLocation = "none";
    }
    ensureValid() {
      if (this.dataLocation === "none") throw new Error("The tensor is disposed.");
    }
    reshape(t) {
      if (this.ensureValid(), this.downloader || this.disposer) throw new Error("Cannot reshape a tensor that owns GPU resource.");
      return Hn(this, t);
    }
  };
});
var pe;
var fr = M(() => {
  "use strict";
  wt();
  pe = re;
});
var bt;
var jn = M(() => {
  "use strict";
  mt();
  ir();
  fr();
  ht();
  bt = class r {
    constructor(t, a) {
      this.handler = t, this.backend = a;
    }
    async run(t, a, u) {
      de(), De("InferenceSession.run");
      let o = {}, d = {};
      if (typeof t != "object" || t === null || t instanceof pe || Array.isArray(t)) throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");
      let w = true;
      if (typeof a == "object") {
        if (a === null) throw new TypeError("Unexpected argument[1]: cannot be null.");
        if (a instanceof pe) throw new TypeError("'fetches' cannot be a Tensor");
        if (Array.isArray(a)) {
          if (a.length === 0) throw new TypeError("'fetches' cannot be an empty array.");
          w = false;
          for (let h of a) {
            if (typeof h != "string") throw new TypeError("'fetches' must be a string array or an object.");
            if (this.outputNames.indexOf(h) === -1) throw new RangeError(`'fetches' contains invalid output name: ${h}.`);
            o[h] = null;
          }
          if (typeof u == "object" && u !== null) d = u;
          else if (typeof u < "u") throw new TypeError("'options' must be an object.");
        } else {
          let h = false, g = Object.getOwnPropertyNames(a);
          for (let y of this.outputNames) if (g.indexOf(y) !== -1) {
            let T = a[y];
            (T === null || T instanceof pe) && (h = true, w = false, o[y] = T);
          }
          if (h) {
            if (typeof u == "object" && u !== null) d = u;
            else if (typeof u < "u") throw new TypeError("'options' must be an object.");
          } else d = a;
        }
      } else if (typeof a < "u") throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");
      for (let h of this.inputNames) if (typeof t[h] > "u") throw new Error(`input '${h}' is missing in 'feeds'.`);
      if (w) for (let h of this.outputNames) o[h] = null;
      let c;
      if (d.activeLoraAdapters !== void 0) {
        if (!Array.isArray(d.activeLoraAdapters)) throw new TypeError("'activeLoraAdapters' must be an array.");
        c = d.activeLoraAdapters.map((h) => {
          if (!(h instanceof We)) throw new TypeError("'activeLoraAdapters' must be an array of LoraAdapter objects.");
          if (h.backend !== this.backend) throw new Error("LoRA adapter was created by a different backend than the session.");
          return h.handler;
        });
      }
      let l = await this.handler.run(t, o, d, c), m = {};
      for (let h in l) if (Object.hasOwnProperty.call(l, h)) {
        let g = l[h];
        g instanceof pe ? m[h] = g : m[h] = new pe(g.type, g.data, g.dims);
      }
      return Pe("InferenceSession.run"), le(), m;
    }
    async release() {
      return this.handler.dispose();
    }
    static async create(t, a, u, o) {
      de(), De("InferenceSession.create");
      let d, w = {};
      if (typeof t == "string") {
        if (d = t, typeof a == "object" && a !== null) w = a;
        else if (typeof a < "u") throw new TypeError("'options' must be an object.");
      } else if (t instanceof Uint8Array) {
        if (d = t, typeof a == "object" && a !== null) w = a;
        else if (typeof a < "u") throw new TypeError("'options' must be an object.");
      } else if (t instanceof ArrayBuffer || typeof SharedArrayBuffer < "u" && t instanceof SharedArrayBuffer) {
        let h = t, g = 0, y = t.byteLength;
        if (typeof a == "object" && a !== null) w = a;
        else if (typeof a == "number") {
          if (g = a, !Number.isSafeInteger(g)) throw new RangeError("'byteOffset' must be an integer.");
          if (g < 0 || g >= h.byteLength) throw new RangeError(`'byteOffset' is out of range [0, ${h.byteLength}).`);
          if (y = t.byteLength - g, typeof u == "number") {
            if (y = u, !Number.isSafeInteger(y)) throw new RangeError("'byteLength' must be an integer.");
            if (y <= 0 || g + y > h.byteLength) throw new RangeError(`'byteLength' is out of range (0, ${h.byteLength - g}].`);
            if (typeof o == "object" && o !== null) w = o;
            else if (typeof o < "u") throw new TypeError("'options' must be an object.");
          } else if (typeof u < "u") throw new TypeError("'byteLength' must be a number.");
        } else if (typeof a < "u") throw new TypeError("'options' must be an object.");
        d = new Uint8Array(h, g, y);
      } else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");
      let [c, l] = await Tn(w), m = await c.createInferenceSessionHandler(d, l);
      return Pe("InferenceSession.create"), le(), new r(m, c);
    }
    startProfiling() {
      this.handler.startProfiling();
    }
    endProfiling() {
      this.handler.endProfiling();
    }
    get inputNames() {
      return this.handler.inputNames;
    }
    get outputNames() {
      return this.handler.outputNames;
    }
    get inputMetadata() {
      return this.handler.inputMetadata;
    }
    get outputMetadata() {
      return this.handler.outputMetadata;
    }
  };
});
var gs;
var Vn = M(() => {
  "use strict";
  jn();
  gs = bt;
});
var Es;
var Yn = M(() => {
  "use strict";
  ir();
  Es = We;
});
var qn = M(() => {
  "use strict";
});
var Jn = M(() => {
  "use strict";
});
var Zn = M(() => {
  "use strict";
});
var Xn = M(() => {
  "use strict";
});
var cr = {};
pt(cr, { InferenceSession: () => gs, LoraAdapter: () => Es, TRACE: () => Bn, TRACE_EVENT_BEGIN: () => De, TRACE_EVENT_END: () => Pe, TRACE_FUNC_BEGIN: () => de, TRACE_FUNC_END: () => le, Tensor: () => pe, env: () => Y, registerBackend: () => et });
var Te = M(() => {
  "use strict";
  vn();
  Ln();
  Vn();
  Yn();
  fr();
  qn();
  Jn();
  ht();
  Zn();
  Xn();
});
var yt = M(() => {
  "use strict";
});
var to = {};
pt(to, { default: () => Ts });
var Qn;
var eo;
var Ts;
var ro = M(() => {
  "use strict";
  dr();
  Ue();
  gt();
  Qn = "ort-wasm-proxy-worker", eo = globalThis.self?.name === Qn;
  eo && (self.onmessage = (r) => {
    let { type: t, in: a } = r.data;
    try {
      switch (t) {
        case "init-wasm":
          Et(a.wasm).then(() => {
            Tt(a).then(() => {
              postMessage({ type: t });
            }, (u) => {
              postMessage({ type: t, err: u });
            });
          }, (u) => {
            postMessage({ type: t, err: u });
          });
          break;
        case "init-ep": {
          let { epName: u, env: o } = a;
          St(o, u).then(() => {
            postMessage({ type: t });
          }, (d) => {
            postMessage({ type: t, err: d });
          });
          break;
        }
        case "copy-from": {
          let { buffer: u } = a, o = rt(u);
          postMessage({ type: t, out: o });
          break;
        }
        case "create": {
          let { model: u, options: o } = a;
          vt(u, o).then((d) => {
            postMessage({ type: t, out: d });
          }, (d) => {
            postMessage({ type: t, err: d });
          });
          break;
        }
        case "release":
          At(a), postMessage({ type: t });
          break;
        case "run": {
          let { sessionId: u, inputIndices: o, inputs: d, outputIndices: w, options: c } = a;
          Ot(u, o, d, w, new Array(w.length).fill(null), c).then((l) => {
            l.some((m) => m[3] !== "cpu") ? postMessage({ type: t, err: "Proxy does not support non-cpu tensor location." }) : postMessage({ type: t, out: l }, Lt([...d, ...l]));
          }, (l) => {
            postMessage({ type: t, err: l });
          });
          break;
        }
        case "end-profiling":
          It(a), postMessage({ type: t });
          break;
        default:
      }
    } catch (u) {
      postMessage({ type: t, err: u });
    }
  });
  Ts = eo ? null : (r) => new Worker(r ?? se, { type: "module", name: Qn });
});
var oo = {};
pt(oo, { default: () => Ss });
async function no(r = {}) {
  var t = r, a = !!globalThis.window, u = !!globalThis.WorkerGlobalScope, o = u && self.name?.startsWith("em-pthread");
  t.mountExternalData = (e, n) => {
    e.startsWith("./") && (e = e.substring(2)), (t.$b || (t.$b = /* @__PURE__ */ new Map())).set(e, n);
  }, t.unmountExternalData = () => {
    delete t.$b, delete t.uc, delete t.tc, delete t.vc;
  }, globalThis.SharedArrayBuffer ?? new WebAssembly.Memory({ initial: 0, maximum: 0, shared: true }).buffer.constructor;
  var d, w, c = (e, n) => {
    throw n;
  }, l = import.meta.url, m = "";
  if (a || u) {
    try {
      m = new URL(".", l).href;
    } catch {
    }
    u && (w = (e) => {
      var n = new XMLHttpRequest();
      return n.open("GET", e, false), n.responseType = "arraybuffer", n.send(null), new Uint8Array(n.response);
    }), d = async (e) => {
      if (G(e)) return new Promise((i, s) => {
        var f = new XMLHttpRequest();
        f.open("GET", e, true), f.responseType = "arraybuffer", f.onload = () => {
          f.status == 200 || f.status == 0 && f.response ? i(f.response) : s(f.status);
        }, f.onerror = s, f.send(null);
      });
      var n = await fetch(e, { credentials: "same-origin" });
      if (n.ok) return n.arrayBuffer();
      throw Error(n.status + " : " + n.url);
    };
  }
  var h, g, y, T, S, U, $ = console.log.bind(console), v = console.error.bind(console), O = $, R = v, C = false, G = (e) => e.startsWith("file://");
  function b() {
    Oe.buffer != H.buffer && ne();
  }
  if (o) {
    let e = function(n) {
      try {
        var i = n.data, s = i.Yb;
        if (s === "load") {
          let f = [];
          self.onmessage = (p) => f.push(p), U = () => {
            postMessage({ Yb: "loaded" });
            for (let p of f) e(p);
            self.onmessage = e;
          };
          for (let p of i.ic) t[p] && !t[p].proxy || (t[p] = (...E) => {
            postMessage({ Yb: "callHandler", hc: p, args: E });
          }, p == "print" && (O = t[p]), p == "printErr" && (R = t[p]));
          Oe = i.nc, ne(), g = i.oc, q(), lt();
        } else if (s === "run") {
          (function(f) {
            var p = (b(), J)[f + 52 >>> 2 >>> 0];
            f = (b(), J)[f + 56 >>> 2 >>> 0], pn(p, p - f), _(p);
          })(i.Xb), Kt(i.Xb, 0, 0, 1, 0, 0), Tr(), Vt(i.Xb), Q ||= true;
          try {
            $o(i.lc, i.bc);
          } catch (f) {
            if (f != "unwind") throw f;
          }
        } else i.target !== "setimmediate" && (s === "checkMailbox" ? Q && ut() : s && (R(`worker: received unknown command ${s}`), R(i)));
      } catch (f) {
        throw un(), f;
      }
    };
    var $s = e, Q = false;
    self.onunhandledrejection = (n) => {
      throw n.reason || n;
    }, self.onmessage = e;
  }
  var H, ue, he, I, J, Re, z, j, Ne, L = false;
  function ne() {
    var e = Oe.buffer;
    t.HEAP8 = H = new Int8Array(e), he = new Int16Array(e), t.HEAPU8 = ue = new Uint8Array(e), new Uint16Array(e), t.HEAP32 = I = new Int32Array(e), t.HEAPU32 = J = new Uint32Array(e), Re = new Float32Array(e), z = new Float64Array(e), j = new BigInt64Array(e), new BigUint64Array(e);
  }
  function Je() {
    L = true, o ? U() : Ie.Wa();
  }
  function oe(e) {
    throw R(e = "Aborted(" + e + ")"), C = true, e = new WebAssembly.RuntimeError(e + ". Build with -sASSERTIONS for more info."), S?.(e), e;
  }
  function we() {
    return { a: { V: Ia, f: Ho, v: zo, e: jo, k: Vo, g: Yo, L: qo, b: Jo, G: Zo, ua: Br, j: Xo, N: Pr, La: xr, qa: Ur, sa: Cr, Ma: Mr, Ja: Rr, Ca: Nr, Ia: Fr, $: kr, ra: Wr, oa: Gr, Ka: $r, pa: Hr, Ra: Ko, Fa: Qo, ma: ta, va: ra, ja: na, X: oa, Ea: Vt, Oa: aa, za: sa, Aa: ia, Ba: ua, xa: Yr, ya: qr, ka: Jr, Ta: ca, Qa: pa, M: ma, Y: ha, Pa: da, F: wa, Na: ba, na: ya, u: fa, H: ga, T: ct, la: Ta, da: Ea, Va: Sa, Ga: Kr, Ha: Qr, ta: V, I: en, wa: tn, _: rn, Da: nn, Z: on, aa: cs, O: as, ba: fs, P: os, w: Ya, d: Da, m: Ba, n: La, q: Ga, ca: ts, E: es, o: Ca, Q: rs, C: ss, J: Qa, ea: Ka, W: xa, z: $a, ga: Ja, R: Xa, ha: qa, y: ja, D: ns, c: _a, r: Ua, i: Pa, Ua: ds, l: Ra, p: Na, s: Ma, t: Fa, x: Ha, S: Va, A: is, K: za, B: us, ia: Wa, U: ka, fa: Za, h: Aa, a: Oe, Sa: ye } };
  }
  async function q() {
    function e(s, f) {
      return Ie = s.exports, Ie = (function() {
        var p = Ie, E = (B) => () => B() >>> 0, A = (B) => (N) => B(N) >>> 0;
        return (p = Object.assign({}, p)).Bb = E(p.Bb), p.Db = A(p.Db), p.Rb = A(p.Rb), p.Sb = E(p.Sb), p.Wb = A(p.Wb), p;
      })(), Ze.push(Ie.Eb), s = Ie, t._OrtInit = s.Xa, t._OrtGetLastError = s.Ya, t._OrtCreateSessionOptions = s.Za, t._OrtAppendExecutionProvider = s._a, t._OrtGetEpDevices = s.$a, t._OrtEpDevice_EpName = s.ab, t._OrtAppendExecutionProviderV2 = s.bb, t._OrtAddFreeDimensionOverride = s.cb, t._OrtAddSessionConfigEntry = s.db, t._OrtReleaseSessionOptions = s.eb, t._OrtCreateSession = s.fb, t._OrtReleaseSession = s.gb, t._OrtGetInputOutputCount = s.hb, t._OrtGetInputOutputMetadata = s.ib, t._OrtFree = s.jb, t._OrtCreateTensor = s.kb, t._OrtGetTensorData = s.lb, t._OrtReleaseTensor = s.mb, t._OrtCreateLoraAdapter = s.nb, t._OrtReleaseLoraAdapter = s.ob, t._OrtCreateRunOptions = s.pb, t._OrtAddRunConfigEntry = s.qb, t._OrtRunOptionsAddActiveLoraAdapter = s.rb, t._OrtReleaseRunOptions = s.sb, t._OrtCreateBinding = s.tb, t._OrtBindInput = s.ub, t._OrtBindOutput = s.vb, t._OrtClearBoundOutputs = s.wb, t._OrtReleaseBinding = s.xb, t._OrtRunWithBinding = s.yb, t._OrtRun = s.zb, t._OrtEndProfiling = s.Ab, dt = s.Bb, an = t._free = s.Cb, sn = t._malloc = s.Db, Kt = s.Gb, un = s.Hb, fn = s.Ib, cn = s.Jb, Qt = s.Kb, dn = s.Lb, ln = s.Mb, P = s.Nb, Ke = s.Ob, pn = s.Pb, _ = s.Qb, er = s.Rb, D = s.Sb, mn = s.Tb, tr = s.Ub, hn = s.Vb, wn = s.Wb, bn = s.Fb, g = f, Ie;
    }
    var n, i = we();
    return t.instantiateWasm ? new Promise((s) => {
      t.instantiateWasm(i, (f, p) => {
        s(e(f, p));
      });
    }) : o ? e(new WebAssembly.Instance(g, we()), g) : (Ne ??= t.locateFile ? t.locateFile ? t.locateFile("ort-wasm-simd-threaded.wasm", m) : m + "ort-wasm-simd-threaded.wasm" : new URL("ort-wasm-simd-threaded.wasm", import.meta.url).href, n = await (async function(s) {
      var f = Ne;
      if (!h && !G(f)) try {
        var p = fetch(f, { credentials: "same-origin" });
        return await WebAssembly.instantiateStreaming(p, s);
      } catch (E) {
        R(`wasm streaming compile failed: ${E}`), R("falling back to ArrayBuffer instantiation");
      }
      return (async function(E, A) {
        try {
          var B = await (async function(N) {
            if (!h) try {
              var te = await d(N);
              return new Uint8Array(te);
            } catch {
            }
            if (N == Ne && h) N = new Uint8Array(h);
            else {
              if (!w) throw "both async and sync fetching of the wasm failed";
              N = w(N);
            }
            return N;
          })(E);
          return await WebAssembly.instantiate(B, A);
        } catch (N) {
          R(`failed to asynchronously prepare wasm: ${N}`), oe(N);
        }
      })(f, s);
    })(i), e(n.instance, n.module));
  }
  class X {
    name = "ExitStatus";
    constructor(n) {
      this.message = `Program terminated with exit(${n})`, this.status = n;
    }
  }
  var Gt = (e) => {
    e.terminate(), e.onmessage = () => {
    };
  }, Fe = [], be = 0, ve = null, at = (e) => {
    ee.length == 0 && (vr(), Sr(ee[0]));
    var n = ee.pop();
    if (!n) return 6;
    me.push(n), Ae[e.Xb] = n, n.Xb = e.Xb;
    var i = { Yb: "run", lc: e.kc, bc: e.bc, Xb: e.Xb };
    return n.postMessage(i, e.fc), 0;
  }, ae = 0, F = (e, n, ...i) => {
    var s, f = 16 * i.length, p = D(), E = er(f), A = E >>> 3;
    for (s of i) typeof s == "bigint" ? ((b(), j)[A++ >>> 0] = 1n, (b(), j)[A++ >>> 0] = s) : ((b(), j)[A++ >>> 0] = 0n, (b(), z)[A++ >>> 0] = s);
    return e = fn(e, 0, f, E, n), _(p), e;
  };
  function ye(e) {
    if (o) return F(0, 1, e);
    if (y = e, !(0 < ae)) {
      for (var n of me) Gt(n);
      for (n of ee) Gt(n);
      ee = [], me = [], Ae = {}, C = true;
    }
    c(0, new X(e));
  }
  function Z(e) {
    if (o) return F(1, 0, e);
    V(e);
  }
  var V = (e) => {
    if (y = e, o) throw Z(e), "unwind";
    ye(e);
  }, ee = [], me = [], Ze = [], Ae = {}, Er = (e) => {
    var n = e.Xb;
    delete Ae[n], ee.push(e), me.splice(me.indexOf(e), 1), e.Xb = 0, cn(n);
  };
  function Tr() {
    Ze.forEach((e) => e());
  }
  var Sr = (e) => new Promise((n) => {
    e.onmessage = (f) => {
      var p = f.data;
      if (f = p.Yb, p.ac && p.ac != dt()) {
        var E = Ae[p.ac];
        E ? E.postMessage(p, p.fc) : R(`Internal error! Worker sent a message "${f}" to target pthread ${p.ac}, but that thread no longer exists!`);
      } else f === "checkMailbox" ? ut() : f === "spawnThread" ? at(p) : f === "cleanupThread" ? jt(() => {
        Er(Ae[p.mc]);
      }) : f === "loaded" ? (e.loaded = true, n(e)) : p.target === "setimmediate" ? e.postMessage(p) : f === "uncaughtException" ? e.onerror(p.error) : f === "callHandler" ? t[p.hc](...p.args) : f && R(`worker sent an unknown command ${f}`);
    }, e.onerror = (f) => {
      throw R(`worker sent an error! ${f.filename}:${f.lineno}: ${f.message}`), f;
    };
    var i, s = [];
    for (i of []) t.propertyIsEnumerable(i) && s.push(i);
    e.postMessage({ Yb: "load", ic: s, nc: Oe, oc: g });
  });
  function vr() {
    var e = new Worker((() => {
      let n = URL;
      return import.meta.url > "file:" && import.meta.url < "file;" ? new n("ort.wasm.bundle.min.mjs", import.meta.url) : new URL(import.meta.url);
    })(), { type: "module", workerData: "em-pthread", name: "em-pthread" });
    ee.push(e);
  }
  var Oe, Ar = [], x = (e) => {
    var n = Ar[e];
    return n || (Ar[e] = n = bn.get(e)), n;
  }, $o = (e, n) => {
    ae = 0, e = x(e)(n), 0 < ae ? y = e : Qt(e);
  }, st = [], it = 0;
  function Ho(e) {
    var n = new $t(e >>>= 0);
    return (b(), H)[n.Zb + 12 >>> 0] == 0 && (Or(n, true), it--), Ir(n, false), st.push(n), wn(e);
  }
  var ke = 0, zo = () => {
    P(0, 0);
    var e = st.pop();
    mn(e.cc), ke = 0;
  };
  function Or(e, n) {
    n = n ? 1 : 0, (b(), H)[e.Zb + 12 >>> 0] = n;
  }
  function Ir(e, n) {
    n = n ? 1 : 0, (b(), H)[e.Zb + 13 >>> 0] = n;
  }
  class $t {
    constructor(n) {
      this.cc = n, this.Zb = n - 24;
    }
  }
  var Ht = (e) => {
    var n = ke;
    if (!n) return Ke(0), 0;
    var i = new $t(n);
    (b(), J)[i.Zb + 16 >>> 2 >>> 0] = n;
    var s = (b(), J)[i.Zb + 4 >>> 2 >>> 0];
    if (!s) return Ke(0), n;
    for (var f of e) {
      if (f === 0 || f === s) break;
      if (hn(f, s, i.Zb + 16)) return Ke(f), n;
    }
    return Ke(s), n;
  };
  function jo() {
    return Ht([]);
  }
  function Vo(e) {
    return Ht([e >>> 0]);
  }
  function Yo(e, n, i, s) {
    return Ht([e >>> 0, n >>> 0, i >>> 0, s >>> 0]);
  }
  var qo = () => {
    var e = st.pop();
    e || oe("no exception to throw");
    var n = e.cc;
    throw (b(), H)[e.Zb + 13 >>> 0] == 0 && (st.push(e), Ir(e, true), Or(e, false), it++), tr(n), ke = n;
  };
  function Jo(e, n, i) {
    var s = new $t(e >>>= 0);
    throw n >>>= 0, i >>>= 0, (b(), J)[s.Zb + 16 >>> 2 >>> 0] = 0, (b(), J)[s.Zb + 4 >>> 2 >>> 0] = n, (b(), J)[s.Zb + 8 >>> 2 >>> 0] = i, tr(e), it++, ke = e;
  }
  var Zo = () => it;
  function Lr(e, n, i, s) {
    return o ? F(2, 1, e, n, i, s) : Br(e, n, i, s);
  }
  function Br(e, n, i, s) {
    if (e >>>= 0, n >>>= 0, i >>>= 0, s >>>= 0, !globalThis.SharedArrayBuffer) return 6;
    var f = [];
    return o && f.length === 0 ? Lr(e, n, i, s) : (e = { kc: i, Xb: e, bc: s, fc: f }, o ? (e.Yb = "spawnThread", postMessage(e, f), 0) : at(e));
  }
  function Xo(e) {
    throw ke ||= e >>> 0, ke;
  }
  var _r = globalThis.TextDecoder && new TextDecoder(), Dr = (e, n = 0, i, s) => {
    var f = n >>>= 0;
    if (i = f + i, s) s = i;
    else {
      for (; e[f] && !(f >= i); ) ++f;
      s = f;
    }
    if (16 < s - n && e.buffer && _r) return _r.decode(e.buffer instanceof ArrayBuffer ? e.subarray(n, s) : e.slice(n, s));
    for (f = ""; n < s; ) if (128 & (i = e[n++])) {
      var p = 63 & e[n++];
      if ((224 & i) == 192) f += String.fromCharCode((31 & i) << 6 | p);
      else {
        var E = 63 & e[n++];
        65536 > (i = (240 & i) == 224 ? (15 & i) << 12 | p << 6 | E : (7 & i) << 18 | p << 12 | E << 6 | 63 & e[n++]) ? f += String.fromCharCode(i) : (i -= 65536, f += String.fromCharCode(55296 | i >> 10, 56320 | 1023 & i));
      }
    } else f += String.fromCharCode(i);
    return f;
  }, zt = (e, n, i) => (e >>>= 0) ? Dr((b(), ue), e, n, i) : "";
  function Pr(e, n, i) {
    return o ? F(3, 1, e, n, i) : 0;
  }
  function xr(e, n) {
    if (o) return F(4, 1, e, n);
  }
  function Ur(e, n) {
    if (o) return F(5, 1, e, n);
  }
  function Cr(e, n, i) {
    if (o) return F(6, 1, e, n, i);
  }
  function Mr(e, n, i) {
    return o ? F(7, 1, e, n, i) : 0;
  }
  function Rr(e, n) {
    if (o) return F(8, 1, e, n);
  }
  function Nr(e, n, i) {
    if (o) return F(9, 1, e, n, i);
  }
  function Fr(e, n, i, s) {
    if (o) return F(10, 1, e, n, i, s);
  }
  function kr(e, n, i, s) {
    if (o) return F(11, 1, e, n, i, s);
  }
  function Wr(e, n, i, s) {
    if (o) return F(12, 1, e, n, i, s);
  }
  function Gr(e) {
    if (o) return F(13, 1, e);
  }
  function $r(e, n) {
    if (o) return F(14, 1, e, n);
  }
  function Hr(e, n, i) {
    if (o) return F(15, 1, e, n, i);
  }
  var Ko = () => oe("");
  function Qo(e) {
    Kt(e >>> 0, !u, 1, !a, 131072, false), Tr();
  }
  var jt = (e) => {
    if (!C) try {
      if (e(), !(0 < ae)) try {
        o ? dt() && Qt(y) : V(y);
      } catch (n) {
        n instanceof X || n == "unwind" || c(0, n);
      }
    } catch (n) {
      n instanceof X || n == "unwind" || c(0, n);
    }
  }, ea = !Atomics.waitAsync || globalThis.navigator?.userAgent && 91 > Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || [])[2]);
  function Vt(e) {
    e >>>= 0, ea || (Atomics.waitAsync((b(), I), e >>> 2, e).value.then(ut), e += 128, Atomics.store((b(), I), e >>> 2, 1));
  }
  var ut = () => jt(() => {
    var e = dt();
    e && (Vt(e), ln());
  });
  function ta(e, n) {
    (e >>>= 0) == n >>> 0 ? setTimeout(ut) : o ? postMessage({ ac: e, Yb: "checkMailbox" }) : (e = Ae[e]) && e.postMessage({ Yb: "checkMailbox" });
  }
  var Yt = [];
  function ra(e, n, i, s, f) {
    for (n >>>= 0, f >>>= 0, Yt.length = 0, i = f >>> 3, s = f + s >>> 3; i < s; ) {
      var p;
      p = (b(), j)[i++ >>> 0] ? (b(), j)[i++ >>> 0] : (b(), z)[i++ >>> 0], Yt.push(p);
    }
    return (n ? yn[n] : Oa[e])(...Yt);
  }
  var na = () => {
    ae = 0;
  };
  function oa(e) {
    e >>>= 0, o ? postMessage({ Yb: "cleanupThread", mc: e }) : Er(Ae[e]);
  }
  function aa(e) {
  }
  function sa(e, n) {
    e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e), n >>>= 0, e = new Date(1e3 * e), (b(), I)[n >>> 2 >>> 0] = e.getUTCSeconds(), (b(), I)[n + 4 >>> 2 >>> 0] = e.getUTCMinutes(), (b(), I)[n + 8 >>> 2 >>> 0] = e.getUTCHours(), (b(), I)[n + 12 >>> 2 >>> 0] = e.getUTCDate(), (b(), I)[n + 16 >>> 2 >>> 0] = e.getUTCMonth(), (b(), I)[n + 20 >>> 2 >>> 0] = e.getUTCFullYear() - 1900, (b(), I)[n + 24 >>> 2 >>> 0] = e.getUTCDay(), e = (e.getTime() - Date.UTC(e.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) / 864e5 | 0, (b(), I)[n + 28 >>> 2 >>> 0] = e;
  }
  var zr = (e) => e % 4 == 0 && (e % 100 != 0 || e % 400 == 0), jr = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], Vr = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  function ia(e, n) {
    e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e), n >>>= 0, e = new Date(1e3 * e), (b(), I)[n >>> 2 >>> 0] = e.getSeconds(), (b(), I)[n + 4 >>> 2 >>> 0] = e.getMinutes(), (b(), I)[n + 8 >>> 2 >>> 0] = e.getHours(), (b(), I)[n + 12 >>> 2 >>> 0] = e.getDate(), (b(), I)[n + 16 >>> 2 >>> 0] = e.getMonth(), (b(), I)[n + 20 >>> 2 >>> 0] = e.getFullYear() - 1900, (b(), I)[n + 24 >>> 2 >>> 0] = e.getDay();
    var i = (zr(e.getFullYear()) ? jr : Vr)[e.getMonth()] + e.getDate() - 1 | 0;
    (b(), I)[n + 28 >>> 2 >>> 0] = i, (b(), I)[n + 36 >>> 2 >>> 0] = -60 * e.getTimezoneOffset(), i = new Date(e.getFullYear(), 6, 1).getTimezoneOffset();
    var s = new Date(e.getFullYear(), 0, 1).getTimezoneOffset();
    e = 0 | (i != s && e.getTimezoneOffset() == Math.min(s, i)), (b(), I)[n + 32 >>> 2 >>> 0] = e;
  }
  function ua(e) {
    e >>>= 0;
    var n = new Date((b(), I)[e + 20 >>> 2 >>> 0] + 1900, (b(), I)[e + 16 >>> 2 >>> 0], (b(), I)[e + 12 >>> 2 >>> 0], (b(), I)[e + 8 >>> 2 >>> 0], (b(), I)[e + 4 >>> 2 >>> 0], (b(), I)[e >>> 2 >>> 0], 0), i = (b(), I)[e + 32 >>> 2 >>> 0], s = n.getTimezoneOffset(), f = new Date(n.getFullYear(), 6, 1).getTimezoneOffset(), p = new Date(n.getFullYear(), 0, 1).getTimezoneOffset(), E = Math.min(p, f);
    return 0 > i ? (b(), I)[e + 32 >>> 2 >>> 0] = +(f != p && E == s) : 0 < i != (E == s) && (f = Math.max(p, f), n.setTime(n.getTime() + 6e4 * ((0 < i ? E : f) - s))), (b(), I)[e + 24 >>> 2 >>> 0] = n.getDay(), i = (zr(n.getFullYear()) ? jr : Vr)[n.getMonth()] + n.getDate() - 1 | 0, (b(), I)[e + 28 >>> 2 >>> 0] = i, (b(), I)[e >>> 2 >>> 0] = n.getSeconds(), (b(), I)[e + 4 >>> 2 >>> 0] = n.getMinutes(), (b(), I)[e + 8 >>> 2 >>> 0] = n.getHours(), (b(), I)[e + 12 >>> 2 >>> 0] = n.getDate(), (b(), I)[e + 16 >>> 2 >>> 0] = n.getMonth(), (b(), I)[e + 20 >>> 2 >>> 0] = n.getYear(), e = n.getTime(), BigInt(isNaN(e) ? -1 : e / 1e3);
  }
  function Yr(e, n, i, s, f, p, E) {
    return o ? F(16, 1, e, n, i, s, f, p, E) : -52;
  }
  function qr(e, n, i, s, f, p) {
    if (o) return F(17, 1, e, n, i, s, f, p);
  }
  var Xe = {}, fa = () => performance.timeOrigin + performance.now();
  function Jr(e, n) {
    if (o) return F(18, 1, e, n);
    if (Xe[e] && (clearTimeout(Xe[e].id), delete Xe[e]), !n) return 0;
    var i = setTimeout(() => {
      delete Xe[e], jt(() => dn(e, performance.timeOrigin + performance.now()));
    }, n);
    return Xe[e] = { id: i, wc: n }, 0;
  }
  var Be = (e, n, i) => {
    var s = (b(), ue);
    if (n >>>= 0, 0 < i) {
      var f = n;
      i = n + i - 1;
      for (var p = 0; p < e.length; ++p) {
        var E = e.codePointAt(p);
        if (127 >= E) {
          if (n >= i) break;
          s[n++ >>> 0] = E;
        } else if (2047 >= E) {
          if (n + 1 >= i) break;
          s[n++ >>> 0] = 192 | E >> 6, s[n++ >>> 0] = 128 | 63 & E;
        } else if (65535 >= E) {
          if (n + 2 >= i) break;
          s[n++ >>> 0] = 224 | E >> 12, s[n++ >>> 0] = 128 | E >> 6 & 63, s[n++ >>> 0] = 128 | 63 & E;
        } else {
          if (n + 3 >= i) break;
          s[n++ >>> 0] = 240 | E >> 18, s[n++ >>> 0] = 128 | E >> 12 & 63, s[n++ >>> 0] = 128 | E >> 6 & 63, s[n++ >>> 0] = 128 | 63 & E, p++;
        }
      }
      s[n >>> 0] = 0, e = n - f;
    } else e = 0;
    return e;
  };
  function ca(e, n, i, s) {
    e >>>= 0, n >>>= 0, i >>>= 0, s >>>= 0;
    var f = (/* @__PURE__ */ new Date()).getFullYear(), p = new Date(f, 0, 1).getTimezoneOffset();
    f = new Date(f, 6, 1).getTimezoneOffset();
    var E = Math.max(p, f);
    (b(), J)[e >>> 2 >>> 0] = 60 * E, (b(), I)[n >>> 2 >>> 0] = +(p != f), e = (n = (A) => {
      var B = Math.abs(A);
      return `UTC${0 <= A ? "-" : "+"}${String(Math.floor(B / 60)).padStart(2, "0")}${String(B % 60).padStart(2, "0")}`;
    })(p), n = n(f), f < p ? (Be(e, i, 17), Be(n, s, 17)) : (Be(e, s, 17), Be(n, i, 17));
  }
  var da = () => Date.now(), la = 1;
  function pa(e, n, i) {
    if (i >>>= 0, !(0 <= e && 3 >= e)) return 28;
    if (e === 0) e = Date.now();
    else {
      if (!la) return 52;
      e = performance.timeOrigin + performance.now();
    }
    return e = Math.round(1e6 * e), (b(), j)[i >>> 3 >>> 0] = BigInt(e), 0;
  }
  var qt = [];
  function ma(e, n, i) {
    e >>>= 0, n >>>= 0, i >>>= 0, qt.length = 0;
    for (var s; s = (b(), ue)[n++ >>> 0]; ) {
      var f = s != 105;
      i += (f &= s != 112) && i % 8 ? 4 : 0, qt.push(s == 112 ? (b(), J)[i >>> 2 >>> 0] : s == 106 ? (b(), j)[i >>> 3 >>> 0] : s == 105 ? (b(), I)[i >>> 2 >>> 0] : (b(), z)[i >>> 3 >>> 0]), i += f ? 8 : 4;
    }
    return yn[e](...qt);
  }
  var ha = () => {
  };
  function wa(e, n) {
    return R(zt(e >>> 0, n >>> 0));
  }
  var ba = () => {
    throw ae += 1, "unwind";
  };
  function ya() {
    return 4294901760;
  }
  var ga = () => navigator.hardwareConcurrency, _e = {}, Jt = (e) => {
    for (var n = 0, i = 0; i < e.length; ++i) {
      var s = e.charCodeAt(i);
      127 >= s ? n++ : 2047 >= s ? n += 2 : 55296 <= s && 57343 >= s ? (n += 4, ++i) : n += 3;
    }
    return n;
  }, ft = (e) => {
    var n;
    return (n = /\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(e)) ? +n[1] : (n = /:(\d+):\d+(?:\)|$)/.exec(e)) ? 2147483648 | +n[1] : 0;
  }, Zr = (e) => {
    for (var n of e) (e = ft(n)) && (_e[e] = n);
  };
  function Ea() {
    var e = Error().stack.toString().split(`
`);
    return e[0] == "Error" && e.shift(), Zr(e), _e.dc = ft(e[3]), _e.jc = e, _e.dc;
  }
  function ct(e) {
    if (!(e = _e[e >>> 0])) return 0;
    var n;
    if (n = /^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(e)) e = n[1];
    else if (n = /^\s+at (.*) \(.*\)$/.exec(e)) e = n[1];
    else {
      if (!(n = /^(.+?)@/.exec(e))) return 0;
      e = n[1];
    }
    an(ct.ec ?? 0), n = Jt(e) + 1;
    var i = sn(n);
    return i && Be(e, i, n), ct.ec = i, ct.ec;
  }
  function Ta(e) {
    e >>>= 0;
    var n = (b(), ue).length;
    if (e <= n || 4294901760 < e) return false;
    for (var i = 1; 4 >= i; i *= 2) {
      var s = n * (1 + 0.2 / i);
      s = Math.min(s, e + 100663296);
      e: {
        s = (Math.min(4294901760, 65536 * Math.ceil(Math.max(e, s) / 65536)) - Oe.buffer.byteLength + 65535) / 65536 | 0;
        try {
          Oe.grow(s), ne();
          var f = 1;
          break e;
        } catch {
        }
        f = void 0;
      }
      if (f) return true;
    }
    return false;
  }
  function Sa(e, n, i) {
    if (e >>>= 0, n >>>= 0, _e.dc == e) var s = _e.jc;
    else (s = Error().stack.toString().split(`
`))[0] == "Error" && s.shift(), Zr(s);
    for (var f = 3; s[f] && ft(s[f]) != e; ) ++f;
    for (e = 0; e < i && s[e + f]; ++e) (b(), I)[n + 4 * e >>> 2 >>> 0] = ft(s[e + f]);
    return e;
  }
  var Zt, Xt = {}, Xr = () => {
    if (!Zt) {
      var e, n = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8", _: "./this.program" };
      for (e in Xt) Xt[e] === void 0 ? delete n[e] : n[e] = Xt[e];
      var i = [];
      for (e in n) i.push(`${e}=${n[e]}`);
      Zt = i;
    }
    return Zt;
  };
  function Kr(e, n) {
    if (o) return F(19, 1, e, n);
    e >>>= 0, n >>>= 0;
    var i, s = 0, f = 0;
    for (i of Xr()) {
      var p = n + s;
      (b(), J)[e + f >>> 2 >>> 0] = p, s += Be(i, p, 1 / 0) + 1, f += 4;
    }
    return 0;
  }
  function Qr(e, n) {
    if (o) return F(20, 1, e, n);
    e >>>= 0, n >>>= 0;
    var i = Xr();
    for (var s of ((b(), J)[e >>> 2 >>> 0] = i.length, e = 0, i)) e += Jt(s) + 1;
    return (b(), J)[n >>> 2 >>> 0] = e, 0;
  }
  function en(e) {
    return o ? F(21, 1, e) : 52;
  }
  function tn(e, n, i, s, f) {
    return o ? F(22, 1, e, n, i, s, f) : 52;
  }
  function rn(e, n, i, s) {
    return o ? F(23, 1, e, n, i, s) : 52;
  }
  function nn(e, n, i, s) {
    return o ? F(24, 1, e, n, i, s) : 70;
  }
  var va = [null, [], []];
  function on(e, n, i, s) {
    if (o) return F(25, 1, e, n, i, s);
    n >>>= 0, i >>>= 0, s >>>= 0;
    for (var f = 0, p = 0; p < i; p++) {
      var E = (b(), J)[n >>> 2 >>> 0], A = (b(), J)[n + 4 >>> 2 >>> 0];
      n += 8;
      for (var B = 0; B < A; B++) {
        var N = e, te = (b(), ue)[E + B >>> 0], ce = va[N];
        te === 0 || te === 10 ? ((N === 1 ? O : R)(Dr(ce)), ce.length = 0) : ce.push(te);
      }
      f += A;
    }
    return (b(), J)[s >>> 2 >>> 0] = f, 0;
  }
  function Aa(e) {
    return e >>> 0;
  }
  o || (function() {
    for (var e = t.numThreads - 1; e--; ) vr();
    Fe.push(async () => {
      var n = (async function() {
        if (!o) return Promise.all(ee.map(Sr));
      })();
      be++, await n, --be == 0 && ve && (n = ve, ve = null, n());
    });
  })(), o || (Oe = new WebAssembly.Memory({ initial: 256, maximum: 65536, shared: true }), ne()), t.wasmBinary && (h = t.wasmBinary), t.stackSave = () => D(), t.stackRestore = (e) => _(e), t.stackAlloc = (e) => er(e), t.setValue = function(e, n, i = "i8") {
    switch (i.endsWith("*") && (i = "*"), i) {
      case "i1":
      case "i8":
        (b(), H)[e >>> 0] = n;
        break;
      case "i16":
        (b(), he)[e >>> 1 >>> 0] = n;
        break;
      case "i32":
        (b(), I)[e >>> 2 >>> 0] = n;
        break;
      case "i64":
        (b(), j)[e >>> 3 >>> 0] = BigInt(n);
        break;
      case "float":
        (b(), Re)[e >>> 2 >>> 0] = n;
        break;
      case "double":
        (b(), z)[e >>> 3 >>> 0] = n;
        break;
      case "*":
        (b(), J)[e >>> 2 >>> 0] = n;
        break;
      default:
        oe(`invalid type for setValue: ${i}`);
    }
  }, t.getValue = function(e, n = "i8") {
    switch (n.endsWith("*") && (n = "*"), n) {
      case "i1":
      case "i8":
        return (b(), H)[e >>> 0];
      case "i16":
        return (b(), he)[e >>> 1 >>> 0];
      case "i32":
        return (b(), I)[e >>> 2 >>> 0];
      case "i64":
        return (b(), j)[e >>> 3 >>> 0];
      case "float":
        return (b(), Re)[e >>> 2 >>> 0];
      case "double":
        return (b(), z)[e >>> 3 >>> 0];
      case "*":
        return (b(), J)[e >>> 2 >>> 0];
      default:
        oe(`invalid type for getValue: ${n}`);
    }
  }, t.UTF8ToString = zt, t.stringToUTF8 = Be, t.lengthBytesUTF8 = Jt;
  var dt, an, sn, Kt, un, fn, cn, Qt, dn, ln, P, Ke, pn, _, er, D, mn, tr, hn, wn, bn, Ie, Oa = [ye, Z, Lr, Pr, xr, Ur, Cr, Mr, Rr, Nr, Fr, kr, Wr, Gr, $r, Hr, Yr, qr, Jr, Kr, Qr, en, tn, rn, nn, on], yn = { 1078380: (e, n, i, s, f) => {
    if (t === void 0 || !t.$b) return 1;
    if ((e = zt(Number(e >>> 0))).startsWith("./") && (e = e.substring(2)), !(e = t.$b.get(e))) return 2;
    if (n = Number(n >>> 0), i = Number(i >>> 0), s = Number(s >>> 0), n + i > e.byteLength) return 3;
    try {
      let p = e.subarray(n, n + i);
      switch (f) {
        case 0:
          (b(), ue).set(p, s >>> 0);
          break;
        case 1:
          t.pc ? t.pc(s, p) : t.sc(s, p);
          break;
        default:
          return 4;
      }
      return 0;
    } catch {
      return 4;
    }
  }, 1079204: () => typeof navigator < "u" && navigator.qc ? 1 : 0, 1079276: () => typeof wasmOffsetConverter < "u" };
  function Ia() {
    return typeof wasmOffsetConverter < "u";
  }
  function La(e, n, i, s) {
    var f = D();
    try {
      return x(e)(n, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      P(1, 0);
    }
  }
  function Ba(e, n, i) {
    var s = D();
    try {
      return x(e)(n, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      P(1, 0);
    }
  }
  function _a(e) {
    var n = D();
    try {
      x(e)();
    } catch (i) {
      if (_(n), i !== i + 0) throw i;
      P(1, 0);
    }
  }
  function Da(e, n) {
    var i = D();
    try {
      return x(e)(n);
    } catch (s) {
      if (_(i), s !== s + 0) throw s;
      P(1, 0);
    }
  }
  function Pa(e, n, i) {
    var s = D();
    try {
      x(e)(n, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      P(1, 0);
    }
  }
  function xa(e, n, i, s) {
    var f = D();
    try {
      return x(e)(n, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      P(1, 0);
    }
  }
  function Ua(e, n) {
    var i = D();
    try {
      x(e)(n);
    } catch (s) {
      if (_(i), s !== s + 0) throw s;
      P(1, 0);
    }
  }
  function Ca(e, n, i, s, f, p, E) {
    var A = D();
    try {
      return x(e)(n, i, s, f, p, E);
    } catch (B) {
      if (_(A), B !== B + 0) throw B;
      P(1, 0);
    }
  }
  function Ma(e, n, i, s, f, p) {
    var E = D();
    try {
      x(e)(n, i, s, f, p);
    } catch (A) {
      if (_(E), A !== A + 0) throw A;
      P(1, 0);
    }
  }
  function Ra(e, n, i, s) {
    var f = D();
    try {
      x(e)(n, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      P(1, 0);
    }
  }
  function Na(e, n, i, s, f) {
    var p = D();
    try {
      x(e)(n, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      P(1, 0);
    }
  }
  function Fa(e, n, i, s, f, p, E) {
    var A = D();
    try {
      x(e)(n, i, s, f, p, E);
    } catch (B) {
      if (_(A), B !== B + 0) throw B;
      P(1, 0);
    }
  }
  function ka(e, n, i, s, f, p, E) {
    var A = D();
    try {
      x(e)(n, i, s, f, p, E);
    } catch (B) {
      if (_(A), B !== B + 0) throw B;
      P(1, 0);
    }
  }
  function Wa(e, n, i, s, f, p, E, A) {
    var B = D();
    try {
      x(e)(n, i, s, f, p, E, A);
    } catch (N) {
      if (_(B), N !== N + 0) throw N;
      P(1, 0);
    }
  }
  function Ga(e, n, i, s, f) {
    var p = D();
    try {
      return x(e)(n, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      P(1, 0);
    }
  }
  function $a(e, n, i) {
    var s = D();
    try {
      return x(e)(n, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      P(1, 0);
    }
  }
  function Ha(e, n, i, s, f, p, E, A) {
    var B = D();
    try {
      x(e)(n, i, s, f, p, E, A);
    } catch (N) {
      if (_(B), N !== N + 0) throw N;
      P(1, 0);
    }
  }
  function za(e, n, i, s, f, p, E, A, B, N, te, ce) {
    var ge = D();
    try {
      x(e)(n, i, s, f, p, E, A, B, N, te, ce);
    } catch (Ee) {
      if (_(ge), Ee !== Ee + 0) throw Ee;
      P(1, 0);
    }
  }
  function ja(e, n, i) {
    var s = D();
    try {
      return x(e)(n, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      return P(1, 0), 0n;
    }
  }
  function Va(e, n, i, s, f, p, E, A, B) {
    var N = D();
    try {
      x(e)(n, i, s, f, p, E, A, B);
    } catch (te) {
      if (_(N), te !== te + 0) throw te;
      P(1, 0);
    }
  }
  function Ya(e) {
    var n = D();
    try {
      return x(e)();
    } catch (i) {
      if (_(n), i !== i + 0) throw i;
      P(1, 0);
    }
  }
  function qa(e, n) {
    var i = D();
    try {
      return x(e)(n);
    } catch (s) {
      if (_(i), s !== s + 0) throw s;
      return P(1, 0), 0n;
    }
  }
  function Ja(e, n, i, s) {
    var f = D();
    try {
      return x(e)(n, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      P(1, 0);
    }
  }
  function Za(e, n, i, s, f, p, E) {
    var A = D();
    try {
      x(e)(n, i, s, f, p, E);
    } catch (B) {
      if (_(A), B !== B + 0) throw B;
      P(1, 0);
    }
  }
  function Xa(e) {
    var n = D();
    try {
      return x(e)();
    } catch (i) {
      if (_(n), i !== i + 0) throw i;
      return P(1, 0), 0n;
    }
  }
  function Ka(e, n, i, s, f) {
    var p = D();
    try {
      return x(e)(n, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      P(1, 0);
    }
  }
  function Qa(e, n, i, s, f, p) {
    var E = D();
    try {
      return x(e)(n, i, s, f, p);
    } catch (A) {
      if (_(E), A !== A + 0) throw A;
      P(1, 0);
    }
  }
  function es(e, n, i, s, f, p) {
    var E = D();
    try {
      return x(e)(n, i, s, f, p);
    } catch (A) {
      if (_(E), A !== A + 0) throw A;
      P(1, 0);
    }
  }
  function ts(e, n, i, s, f, p) {
    var E = D();
    try {
      return x(e)(n, i, s, f, p);
    } catch (A) {
      if (_(E), A !== A + 0) throw A;
      P(1, 0);
    }
  }
  function rs(e, n, i, s, f, p, E, A) {
    var B = D();
    try {
      return x(e)(n, i, s, f, p, E, A);
    } catch (N) {
      if (_(B), N !== N + 0) throw N;
      P(1, 0);
    }
  }
  function ns(e, n, i, s, f) {
    var p = D();
    try {
      return x(e)(n, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      return P(1, 0), 0n;
    }
  }
  function os(e, n, i, s) {
    var f = D();
    try {
      return x(e)(n, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      P(1, 0);
    }
  }
  function as(e, n, i, s) {
    var f = D();
    try {
      return x(e)(n, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      P(1, 0);
    }
  }
  function ss(e, n, i, s, f, p, E, A, B, N, te, ce) {
    var ge = D();
    try {
      return x(e)(n, i, s, f, p, E, A, B, N, te, ce);
    } catch (Ee) {
      if (_(ge), Ee !== Ee + 0) throw Ee;
      P(1, 0);
    }
  }
  function is(e, n, i, s, f, p, E, A, B, N, te) {
    var ce = D();
    try {
      x(e)(n, i, s, f, p, E, A, B, N, te);
    } catch (ge) {
      if (_(ce), ge !== ge + 0) throw ge;
      P(1, 0);
    }
  }
  function us(e, n, i, s, f, p, E, A, B, N, te, ce, ge, Ee, ls, ps) {
    var ms = D();
    try {
      x(e)(n, i, s, f, p, E, A, B, N, te, ce, ge, Ee, ls, ps);
    } catch (rr) {
      if (_(ms), rr !== rr + 0) throw rr;
      P(1, 0);
    }
  }
  function fs(e, n, i) {
    var s = D();
    try {
      return x(e)(n, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      P(1, 0);
    }
  }
  function cs(e, n, i) {
    var s = D();
    try {
      return x(e)(n, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      P(1, 0);
    }
  }
  function ds(e, n, i, s) {
    var f = D();
    try {
      x(e)(n, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      P(1, 0);
    }
  }
  function lt() {
    if (0 < be) ve = lt;
    else if (o) T?.(t), Je();
    else {
      for (var e = Fe; 0 < e.length; ) e.shift()(t);
      0 < be ? ve = lt : (t.calledRun = true, C || (Je(), T?.(t)));
    }
  }
  return o || (Ie = await q(), lt()), t.PTR_SIZE = 4, L ? t : new Promise((e, n) => {
    T = e, S = n;
  });
}
var Ss;
var vs;
var ao = M(() => {
  "use strict";
  Ss = no, vs = globalThis.self?.name?.startsWith("em-pthread");
  vs && no();
});
var uo;
var pr;
var As;
var se;
var fo;
var lr;
var Os;
var Is;
var co;
var Ls;
var so;
var lo;
var io;
var po;
var gt = M(() => {
  "use strict";
  yt();
  uo = typeof location > "u" ? void 0 : location.origin, pr = import.meta.url > "file:" && import.meta.url < "file;", As = () => {
    if (true) {
      if (pr) {
        let r = URL;
        return new URL(new r("ort.wasm.bundle.min.mjs", import.meta.url).href, uo).href;
      }
      return import.meta.url;
    }
  }, se = As(), fo = () => {
    if (se && !se.startsWith("blob:")) return se.substring(0, se.lastIndexOf("/") + 1);
  }, lr = (r, t) => {
    try {
      let a = t ?? se;
      return (a ? new URL(r, a) : new URL(r)).origin === uo;
    } catch {
      return false;
    }
  }, Os = (r, t) => {
    let a = t ?? se;
    try {
      return (a ? new URL(r, a) : new URL(r)).href;
    } catch {
      return;
    }
  }, Is = (r, t) => `${t ?? "./"}${r}`, co = async (r) => {
    let a = await (await fetch(r, { credentials: "same-origin" })).blob();
    return URL.createObjectURL(a);
  }, Ls = async (r) => (await import(
    /*webpackIgnore:true*/
    /*@vite-ignore*/
    r
  )).default, so = (ro(), ar(to)).default, lo = async () => {
    if (!se) throw new Error("Failed to load proxy worker: cannot determine the script source URL.");
    if (lr(se)) return [void 0, so()];
    let r = await co(se);
    return [r, so(r)];
  }, io = (ao(), ar(oo)).default, po = async (r, t, a, u) => {
    let o = io && !(r || t);
    if (o) if (se) o = lr(se) || u && !a;
    else if (u && !a) o = true;
    else throw new Error("cannot determine the script source URL.");
    if (o) return [void 0, io];
    {
      let d = "ort-wasm-simd-threaded.mjs", w = r ?? Os(d, t), c = a && w && !lr(w, t), l = c ? await co(w) : w ?? Is(d, t);
      return [c ? l : void 0, await Ls(l)];
    }
  };
});
var mr;
var hr;
var Bt;
var mo;
var Bs;
var _s;
var Ds;
var Et;
var k;
var Ue = M(() => {
  "use strict";
  gt();
  hr = false, Bt = false, mo = false, Bs = () => {
    if (typeof SharedArrayBuffer > "u") return false;
    try {
      return typeof MessageChannel < "u" && new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)), WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11]));
    } catch {
      return false;
    }
  }, _s = () => {
    try {
      return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 30, 1, 28, 0, 65, 0, 253, 15, 253, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 253, 186, 1, 26, 11]));
    } catch {
      return false;
    }
  }, Ds = () => {
    try {
      return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 19, 1, 17, 0, 65, 1, 253, 15, 65, 2, 253, 15, 65, 3, 253, 15, 253, 147, 2, 11]));
    } catch {
      return false;
    }
  }, Et = async (r) => {
    if (hr) return Promise.resolve();
    if (Bt) throw new Error("multiple calls to 'initializeWebAssembly()' detected.");
    if (mo) throw new Error("previous call to 'initializeWebAssembly()' failed.");
    Bt = true;
    let t = r.initTimeout, a = r.numThreads;
    if (r.simd !== false) {
      if (r.simd === "relaxed") {
        if (!Ds()) throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.");
      } else if (!_s()) throw new Error("WebAssembly SIMD is not supported in the current environment.");
    }
    let u = Bs();
    a > 1 && !u && (typeof self < "u" && !self.crossOriginIsolated && console.warn("env.wasm.numThreads is set to " + a + ", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."), console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."), r.numThreads = a = 1);
    let o = r.wasmPaths, d = typeof o == "string" ? o : void 0, w = o?.mjs, c = w?.href ?? w, l = o?.wasm, m = l?.href ?? l, h = r.wasmBinary, [g, y] = await po(c, d, a > 1, !!h || !!m), T = false, S = [];
    if (t > 0 && S.push(new Promise((U) => {
      setTimeout(() => {
        T = true, U();
      }, t);
    })), S.push(new Promise((U, $) => {
      let v = { numThreads: a };
      if (h) v.wasmBinary = h, v.locateFile = (O) => O;
      else if (m || d) v.locateFile = (O) => m ?? d + O;
      else if (c && c.indexOf("blob:") !== 0) v.locateFile = (O) => new URL(O, c).href;
      else if (g) {
        let O = fo();
        O && (v.locateFile = (R) => O + R);
      }
      y(v).then((O) => {
        Bt = false, hr = true, mr = O, U(), g && URL.revokeObjectURL(g);
      }, (O) => {
        Bt = false, mo = true, $(O);
      });
    })), await Promise.race(S), T) throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`);
  }, k = () => {
    if (hr && mr) return mr;
    throw new Error("WebAssembly is not initialized yet.");
  };
});
var ie;
var nt;
var W;
var _t = M(() => {
  "use strict";
  Ue();
  ie = (r, t) => {
    let a = k(), u = a.lengthBytesUTF8(r) + 1, o = a._malloc(u);
    return a.stringToUTF8(r, o, u), t.push(o), o;
  }, nt = (r, t, a, u) => {
    if (typeof r == "object" && r !== null) {
      if (a.has(r)) throw new Error("Circular reference in options");
      a.add(r);
    }
    Object.entries(r).forEach(([o, d]) => {
      let w = t ? t + o : o;
      if (typeof d == "object") nt(d, w + ".", a, u);
      else if (typeof d == "string" || typeof d == "number") u(w, d.toString());
      else if (typeof d == "boolean") u(w, d ? "1" : "0");
      else throw new Error(`Can't handle extra config type: ${typeof d}`);
    });
  }, W = (r) => {
    let t = k(), a = t.stackSave();
    try {
      let u = t.PTR_SIZE, o = t.stackAlloc(2 * u);
      t._OrtGetLastError(o, o + u);
      let d = Number(t.getValue(o, u === 4 ? "i32" : "i64")), w = t.getValue(o + u, "*"), c = w ? t.UTF8ToString(w) : "";
      throw new Error(`${r} ERROR_CODE: ${d}, ERROR_MESSAGE: ${c}`);
    } finally {
      t.stackRestore(a);
    }
  };
});
var ho;
var wo = M(() => {
  "use strict";
  Ue();
  _t();
  ho = (r, t) => {
    let a = k(), u = 0, o = [], d = r || {};
    try {
      if (r?.logSeverityLevel === void 0) d.logSeverityLevel = 2;
      else if (typeof r.logSeverityLevel != "number" || !Number.isInteger(r.logSeverityLevel) || r.logSeverityLevel < 0 || r.logSeverityLevel > 4) throw new Error(`log severity level is not valid: ${r.logSeverityLevel}`);
      if (r?.logVerbosityLevel === void 0) d.logVerbosityLevel = 0;
      else if (typeof r.logVerbosityLevel != "number" || !Number.isInteger(r.logVerbosityLevel)) throw new Error(`log verbosity level is not valid: ${r.logVerbosityLevel}`);
      r?.terminate === void 0 && (d.terminate = false);
      let w = 0;
      r?.tag !== void 0 && (w = ie(r.tag, o)), u = a._OrtCreateRunOptions(d.logSeverityLevel, d.logVerbosityLevel, !!d.terminate, w), u === 0 && W("Can't create run options."), r?.extra !== void 0 && nt(r.extra, "", /* @__PURE__ */ new WeakSet(), (c, l) => {
        let m = ie(c, o), h = ie(l, o);
        a._OrtAddRunConfigEntry(u, m, h) !== 0 && W(`Can't set a run config entry: ${c} - ${l}.`);
      });
      for (let c of t) a._OrtRunOptionsAddActiveLoraAdapter(u, c) !== 0 && W("Can't add an active LoRA adapter.");
      return [u, o];
    } catch (w) {
      throw u !== 0 && a._OrtReleaseRunOptions(u), o.forEach((c) => a._free(c)), w;
    }
  };
});
var Ps;
var xs;
var Us;
var Ge;
var Cs;
var bo;
var yo = M(() => {
  "use strict";
  Ue();
  _t();
  Ps = (r) => {
    switch (r) {
      case "disabled":
        return 0;
      case "basic":
        return 1;
      case "extended":
        return 2;
      case "layout":
        return 3;
      case "all":
        return 99;
      default:
        throw new Error(`unsupported graph optimization level: ${r}`);
    }
  }, xs = (r) => {
    switch (r) {
      case "sequential":
        return 0;
      case "parallel":
        return 1;
      default:
        throw new Error(`unsupported execution mode: ${r}`);
    }
  }, Us = (r) => {
    r.extra || (r.extra = {}), r.extra.session || (r.extra.session = {});
    let t = r.extra.session;
    t.use_ort_model_bytes_directly || (t.use_ort_model_bytes_directly = "1"), r.executionProviders && r.executionProviders.some((a) => (typeof a == "string" ? a : a.name) === "webgpu") && (r.enableMemPattern = false);
  }, Ge = (r, t, a, u) => {
    let o = ie(t, u), d = ie(a, u);
    k()._OrtAddSessionConfigEntry(r, o, d) !== 0 && W(`Can't set a session config entry: ${t} - ${a}.`);
  }, Cs = async (r, t, a) => {
    let u = t.executionProviders;
    for (let o of u) {
      let d = typeof o == "string" ? o : o.name, w = [], c;
      switch (d) {
        case "webnn":
          if (d = "WEBNN", Ge(r, "session.disable_quant_qdq", "1", a), Ge(r, "session.disable_qdq_constant_folding", "1", a), typeof o != "string") {
            let T = o?.deviceType;
            T && Ge(r, "deviceType", T, a);
          }
          break;
        case "webgpu":
          if (d = "JS", typeof o != "string") {
            let y = o;
            if (y?.preferredLayout) {
              if (y.preferredLayout !== "NCHW" && y.preferredLayout !== "NHWC") throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${y.preferredLayout}`);
              Ge(r, "preferredLayout", y.preferredLayout, a);
            }
          }
          break;
        case "wasm":
        case "cpu":
          continue;
        default:
          throw new Error(`not supported execution provider: ${d}`);
      }
      let l = w.length, m = 0, h = 0;
      if (l > 0) {
        m = k()._malloc(l * k().PTR_SIZE), a.push(m), h = k()._malloc(l * k().PTR_SIZE), a.push(h);
        for (let y = 0; y < l; y++) k().setValue(m + y * k().PTR_SIZE, w[y][0], "*"), k().setValue(h + y * k().PTR_SIZE, w[y][1], "*");
      }
      let g;
      if (c !== void 0) {
        let y = k()._malloc(k().PTR_SIZE);
        a.push(y), k().setValue(y, c[0], "*"), g = await k()._OrtAppendExecutionProviderV2(r, y, 1, m, h, l);
      } else {
        let y = ie(d, a);
        g = await k()._OrtAppendExecutionProvider(r, y, m, h, l);
      }
      g !== 0 && W(`Can't append execution provider: ${d}.`);
    }
  }, bo = async (r) => {
    let t = k(), a = 0, u = [], o = r || {};
    Us(o);
    try {
      let d = Ps(o.graphOptimizationLevel ?? "all"), w = xs(o.executionMode ?? "sequential"), c = typeof o.logId == "string" ? ie(o.logId, u) : 0, l = o.logSeverityLevel ?? 2;
      if (!Number.isInteger(l) || l < 0 || l > 4) throw new Error(`log severity level is not valid: ${l}`);
      let m = o.logVerbosityLevel ?? 0;
      if (!Number.isInteger(m) || m < 0 || m > 4) throw new Error(`log verbosity level is not valid: ${m}`);
      let h = typeof o.optimizedModelFilePath == "string" ? ie(o.optimizedModelFilePath, u) : 0;
      if (a = t._OrtCreateSessionOptions(d, !!o.enableCpuMemArena, !!o.enableMemPattern, w, !!o.enableProfiling, 0, c, l, m, h), a === 0 && W("Can't create session options."), o.executionProviders && await Cs(a, o, u), o.enableGraphCapture !== void 0) {
        if (typeof o.enableGraphCapture != "boolean") throw new Error(`enableGraphCapture must be a boolean value: ${o.enableGraphCapture}`);
        Ge(a, "enableGraphCapture", o.enableGraphCapture.toString(), u);
      }
      if (o.freeDimensionOverrides) for (let [g, y] of Object.entries(o.freeDimensionOverrides)) {
        if (typeof g != "string") throw new Error(`free dimension override name must be a string: ${g}`);
        if (typeof y != "number" || !Number.isInteger(y) || y < 0) throw new Error(`free dimension override value must be a non-negative integer: ${y}`);
        let T = ie(g, u);
        t._OrtAddFreeDimensionOverride(a, T, y) !== 0 && W(`Can't set a free dimension override: ${g} - ${y}.`);
      }
      return o.extra !== void 0 && nt(o.extra, "", /* @__PURE__ */ new WeakSet(), (g, y) => {
        Ge(a, g, y, u);
      }), [a, u];
    } catch (d) {
      throw a !== 0 && t._OrtReleaseSessionOptions(a) !== 0 && W("Can't release session options."), u.forEach((w) => t._free(w)), d;
    }
  };
});
var $e;
var Dt;
var He;
var go;
var Eo;
var Pt;
var xt;
var To;
var wr = M(() => {
  "use strict";
  $e = (r) => {
    switch (r) {
      case "int8":
        return 3;
      case "uint8":
        return 2;
      case "bool":
        return 9;
      case "int16":
        return 5;
      case "uint16":
        return 4;
      case "int32":
        return 6;
      case "uint32":
        return 12;
      case "float16":
        return 10;
      case "float32":
        return 1;
      case "float64":
        return 11;
      case "string":
        return 8;
      case "int64":
        return 7;
      case "uint64":
        return 13;
      case "int4":
        return 22;
      case "uint4":
        return 21;
      default:
        throw new Error(`unsupported data type: ${r}`);
    }
  }, Dt = (r) => {
    switch (r) {
      case 3:
        return "int8";
      case 2:
        return "uint8";
      case 9:
        return "bool";
      case 5:
        return "int16";
      case 4:
        return "uint16";
      case 6:
        return "int32";
      case 12:
        return "uint32";
      case 10:
        return "float16";
      case 1:
        return "float32";
      case 11:
        return "float64";
      case 8:
        return "string";
      case 7:
        return "int64";
      case 13:
        return "uint64";
      case 22:
        return "int4";
      case 21:
        return "uint4";
      default:
        throw new Error(`unsupported data type: ${r}`);
    }
  }, He = (r, t) => {
    let a = [-1, 4, 1, 1, 2, 2, 4, 8, -1, 1, 2, 8, 4, 8, -1, -1, -1, -1, -1, -1, -1, 0.5, 0.5][r], u = typeof t == "number" ? t : t.reduce((o, d) => o * d, 1);
    return a > 0 ? Math.ceil(u * a) : void 0;
  }, go = (r) => {
    switch (r) {
      case "float16":
        return typeof Float16Array < "u" ? Float16Array : Uint16Array;
      case "float32":
        return Float32Array;
      case "uint8":
        return Uint8Array;
      case "int8":
        return Int8Array;
      case "uint16":
        return Uint16Array;
      case "int16":
        return Int16Array;
      case "int32":
        return Int32Array;
      case "bool":
        return Uint8Array;
      case "float64":
        return Float64Array;
      case "uint32":
        return Uint32Array;
      case "int64":
        return BigInt64Array;
      case "uint64":
        return BigUint64Array;
      default:
        throw new Error(`unsupported type: ${r}`);
    }
  }, Eo = (r) => {
    switch (r) {
      case "verbose":
        return 0;
      case "info":
        return 1;
      case "warning":
        return 2;
      case "error":
        return 3;
      case "fatal":
        return 4;
      default:
        throw new Error(`unsupported logging level: ${r}`);
    }
  }, Pt = (r) => r === "float32" || r === "float16" || r === "int32" || r === "int64" || r === "uint32" || r === "uint8" || r === "bool" || r === "uint4" || r === "int4", xt = (r) => r === "float32" || r === "float16" || r === "int32" || r === "int64" || r === "uint32" || r === "uint64" || r === "int8" || r === "uint8" || r === "bool" || r === "uint4" || r === "int4", To = (r) => {
    switch (r) {
      case "none":
        return 0;
      case "cpu":
        return 1;
      case "cpu-pinned":
        return 2;
      case "texture":
        return 3;
      case "gpu-buffer":
        return 4;
      case "ml-tensor":
        return 5;
      default:
        throw new Error(`unsupported data location: ${r}`);
    }
  };
});
var Me;
var Ut = M(() => {
  "use strict";
  yt();
  Me = async (r) => {
    if (typeof r == "string") if (false) try {
      let { readFile: t } = or("node:fs/promises");
      return new Uint8Array(await t(r));
    } catch (t) {
      if (t.code === "ERR_FS_FILE_TOO_LARGE") {
        let { createReadStream: a } = or("node:fs"), u = a(r), o = [];
        for await (let d of u) o.push(d);
        return new Uint8Array(Buffer.concat(o));
      }
      throw t;
    }
    else {
      let t = await fetch(r);
      if (!t.ok) throw new Error(`failed to load external data file: ${r}`);
      let a = t.headers.get("Content-Length"), u = a ? parseInt(a, 10) : 0;
      if (u < 1073741824) return new Uint8Array(await t.arrayBuffer());
      {
        if (!t.body) throw new Error(`failed to load external data file: ${r}, no response body.`);
        let o = t.body.getReader(), d;
        try {
          d = new ArrayBuffer(u);
        } catch (c) {
          if (c instanceof RangeError) {
            let l = Math.ceil(u / 65536);
            d = new WebAssembly.Memory({ initial: l, maximum: l }).buffer;
          } else throw c;
        }
        let w = 0;
        for (; ; ) {
          let { done: c, value: l } = await o.read();
          if (c) break;
          let m = l.byteLength;
          new Uint8Array(d, w, m).set(l), w += m;
        }
        return new Uint8Array(d, 0, u);
      }
    }
    else return r instanceof Blob ? new Uint8Array(await r.arrayBuffer()) : r instanceof Uint8Array ? r : new Uint8Array(r);
  };
});
var Ms;
var Tt;
var St;
var je;
var Rs;
var So;
var rt;
var vt;
var At;
var Ct;
var Ns;
var ze;
var Ao;
var Oo;
var vo;
var Ot;
var It;
var Lt;
var dr = M(() => {
  "use strict";
  Te();
  wo();
  yo();
  wr();
  Ue();
  _t();
  Ut();
  Ms = (r, t) => {
    k()._OrtInit(r, t) !== 0 && W("Can't initialize onnxruntime.");
  }, Tt = async (r) => {
    Ms(r.wasm.numThreads, Eo(r.logLevel));
  }, St = async (r, t) => {
    k().asyncInit?.();
    let a = r.webgpu.adapter;
    if (t === "webgpu") {
      if (typeof navigator > "u" || !navigator.gpu) throw new Error("WebGPU is not supported in current environment");
      if (a) {
        if (typeof a.limits != "object" || typeof a.features != "object" || typeof a.requestDevice != "function") throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.");
      } else {
        let u = r.webgpu.powerPreference;
        if (u !== void 0 && u !== "low-power" && u !== "high-performance") throw new Error(`Invalid powerPreference setting: "${u}"`);
        let o = r.webgpu.forceFallbackAdapter;
        if (o !== void 0 && typeof o != "boolean") throw new Error(`Invalid forceFallbackAdapter setting: "${o}"`);
        if (a = await navigator.gpu.requestAdapter({ powerPreference: u, forceFallbackAdapter: o }), !a) throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.');
      }
    }
    if (t === "webnn" && (typeof navigator > "u" || !navigator.ml)) throw new Error("WebNN is not supported in current environment");
  }, je = /* @__PURE__ */ new Map(), Rs = (r) => {
    let t = k(), a = t.stackSave();
    try {
      let u = t.PTR_SIZE, o = t.stackAlloc(2 * u);
      t._OrtGetInputOutputCount(r, o, o + u) !== 0 && W("Can't get session input/output count.");
      let w = u === 4 ? "i32" : "i64";
      return [Number(t.getValue(o, w)), Number(t.getValue(o + u, w))];
    } finally {
      t.stackRestore(a);
    }
  }, So = (r, t) => {
    let a = k(), u = a.stackSave(), o = 0;
    try {
      let d = a.PTR_SIZE, w = a.stackAlloc(2 * d);
      a._OrtGetInputOutputMetadata(r, t, w, w + d) !== 0 && W("Can't get session input/output metadata.");
      let l = Number(a.getValue(w, "*"));
      o = Number(a.getValue(w + d, "*"));
      let m = a.HEAP32[o / 4];
      if (m === 0) return [l, 0];
      let h = a.HEAPU32[o / 4 + 1], g = [];
      for (let y = 0; y < h; y++) {
        let T = Number(a.getValue(o + 8 + y * d, "*"));
        g.push(T !== 0 ? a.UTF8ToString(T) : Number(a.getValue(o + 8 + (y + h) * d, "*")));
      }
      return [l, m, g];
    } finally {
      a.stackRestore(u), o !== 0 && a._OrtFree(o);
    }
  }, rt = (r) => {
    let t = k(), a = t._malloc(r.byteLength);
    if (a === 0) throw new Error(`Can't create a session. failed to allocate a buffer of size ${r.byteLength}.`);
    return t.HEAPU8.set(r, a), [a, r.byteLength];
  }, vt = async (r, t) => {
    let a, u, o = k();
    Array.isArray(r) ? [a, u] = r : r.buffer === o.HEAPU8.buffer ? [a, u] = [r.byteOffset, r.byteLength] : [a, u] = rt(r);
    let d = 0, w = 0, c = 0, l = [], m = [], h = [];
    try {
      if ([w, l] = await bo(t), t?.externalData && o.mountExternalData) {
        let C = [];
        for (let G of t.externalData) {
          let b = typeof G == "string" ? G : G.path, Q = typeof G == "string" ? G : G.data;
          C.push(Me(Q).then((H) => {
            o.mountExternalData(b, H);
          }));
        }
        await Promise.all(C);
      }
      for (let C of t?.executionProviders ?? []) if ((typeof C == "string" ? C : C.name) === "webnn") {
        if (o.shouldTransferToMLTensor = false, typeof C != "string") {
          let b = C, Q = b?.context, H = b?.gpuDevice, ue = b?.deviceType, he = b?.powerPreference;
          Q ? o.currentContext = Q : H ? o.currentContext = await o.webnnCreateMLContext(H) : o.currentContext = await o.webnnCreateMLContext({ deviceType: ue, powerPreference: he });
        } else o.currentContext = await o.webnnCreateMLContext();
        break;
      }
      d = await o._OrtCreateSession(a, u, w), o.webgpuOnCreateSession?.(d), d === 0 && W("Can't create a session."), o.jsepOnCreateSession?.(), o.currentContext && (o.webnnRegisterMLContext(d, o.currentContext), o.currentContext = void 0, o.shouldTransferToMLTensor = true);
      let [g, y] = Rs(d), T = !!t?.enableGraphCapture, S = [], U = [], $ = [], v = [], O = [];
      for (let C = 0; C < g; C++) {
        let [G, b, Q] = So(d, C);
        G === 0 && W("Can't get an input name."), m.push(G);
        let H = o.UTF8ToString(G);
        S.push(H), $.push(b === 0 ? { name: H, isTensor: false } : { name: H, isTensor: true, type: Dt(b), shape: Q });
      }
      for (let C = 0; C < y; C++) {
        let [G, b, Q] = So(d, C + g);
        G === 0 && W("Can't get an output name."), h.push(G);
        let H = o.UTF8ToString(G);
        U.push(H), v.push(b === 0 ? { name: H, isTensor: false } : { name: H, isTensor: true, type: Dt(b), shape: Q });
      }
      return je.set(d, [d, m, h, null, T, false]), [d, S, U, $, v];
    } catch (g) {
      throw m.forEach((y) => o._OrtFree(y)), h.forEach((y) => o._OrtFree(y)), c !== 0 && o._OrtReleaseBinding(c) !== 0 && W("Can't release IO binding."), d !== 0 && o._OrtReleaseSession(d) !== 0 && W("Can't release session."), g;
    } finally {
      o._free(a), w !== 0 && o._OrtReleaseSessionOptions(w) !== 0 && W("Can't release session options."), l.forEach((g) => o._free(g)), o.unmountExternalData?.();
    }
  }, At = (r) => {
    let t = k(), a = je.get(r);
    if (!a) throw new Error(`cannot release session. invalid session id: ${r}`);
    let [u, o, d, w, c] = a;
    w && (c && t._OrtClearBoundOutputs(w.handle) !== 0 && W("Can't clear bound outputs."), t._OrtReleaseBinding(w.handle) !== 0 && W("Can't release IO binding.")), t.jsepOnReleaseSession?.(r), t.webnnOnReleaseSession?.(r), t.webgpuOnReleaseSession?.(r), o.forEach((l) => t._OrtFree(l)), d.forEach((l) => t._OrtFree(l)), t._OrtReleaseSession(u) !== 0 && W("Can't release session."), je.delete(r);
  }, Ct = /* @__PURE__ */ new Map(), Ns = 1, ze = /* @__PURE__ */ new Map(), Ao = (r) => {
    let t = k(), a = t._malloc(r.byteLength);
    if (a === 0) throw new Error(`Can't create a LoRA adapter. failed to allocate a buffer of size ${r.byteLength}.`);
    try {
      t.HEAPU8.set(r, a);
      let u = t._OrtCreateLoraAdapter(a, r.byteLength);
      u === 0 && W("Can't create a LoRA adapter.");
      let o = Ns++;
      return Ct.set(o, u), o;
    } finally {
      t._free(a);
    }
  }, Oo = (r) => {
    let t = k(), a = Ct.get(r);
    if (a === void 0) throw new Error(`cannot release LoRA adapter. invalid adapter id: ${r}`);
    if (ze.has(r)) throw new Error(`cannot release LoRA adapter. the adapter is used by a run in progress. adapter id: ${r}`);
    t._OrtReleaseLoraAdapter(a) !== 0 && W("Can't release LoRA adapter."), Ct.delete(r);
  }, vo = async (r, t, a, u, o, d, w = false) => {
    if (!r) {
      t.push(0);
      return;
    }
    let c = k(), l = c.PTR_SIZE, m = r[0], h = r[1], g = r[3], y = g, T, S;
    if (m === "string" && (g === "gpu-buffer" || g === "ml-tensor")) throw new Error("String tensor is not supported on GPU.");
    if (w && g !== "gpu-buffer") throw new Error(`External buffer must be provided for input/output index ${d} when enableGraphCapture is true.`);
    if (g === "gpu-buffer") {
      let v = r[2].gpuBuffer;
      S = He($e(m), h);
      {
        let O = c.jsepRegisterBuffer;
        if (!O) throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');
        T = O(u, d, v, S);
      }
    } else if (g === "ml-tensor") {
      let v = r[2].mlTensor;
      S = He($e(m), h);
      let O = c.webnnRegisterMLTensor;
      if (!O) throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');
      T = O(u, v, $e(m), h);
    } else {
      let v = r[2];
      if (Array.isArray(v)) {
        S = l * v.length, T = c._malloc(S), a.push(T);
        for (let O = 0; O < v.length; O++) {
          if (typeof v[O] != "string") throw new TypeError(`tensor data at index ${O} is not a string`);
          c.setValue(T + O * l, ie(v[O], a), "*");
        }
      } else {
        let O = c.webnnIsGraphInput, R = c.webnnIsGraphOutput;
        if (m !== "string" && O && R) {
          let C = c.UTF8ToString(o);
          if (O(u, C) || R(u, C)) {
            let G = $e(m);
            S = He(G, h), y = "ml-tensor";
            let b = c.webnnCreateTemporaryTensor, Q = c.webnnUploadTensor;
            if (!b || !Q) throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');
            let H = await b(u, G, h);
            Q(H, new Uint8Array(v.buffer, v.byteOffset, v.byteLength)), T = H;
          } else S = v.byteLength, T = c._malloc(S), a.push(T), c.HEAPU8.set(new Uint8Array(v.buffer, v.byteOffset, S), T);
        } else S = v.byteLength, T = c._malloc(S), a.push(T), c.HEAPU8.set(new Uint8Array(v.buffer, v.byteOffset, S), T);
      }
    }
    let U = c.stackSave(), $ = c.stackAlloc(4 * h.length);
    try {
      h.forEach((O, R) => c.setValue($ + R * l, O, l === 4 ? "i32" : "i64"));
      let v = c._OrtCreateTensor($e(m), T, S, $, h.length, To(y));
      v === 0 && W(`Can't create tensor for input/output. session=${u}, index=${d}.`), t.push(v);
    } finally {
      c.stackRestore(U);
    }
  }, Ot = async (r, t, a, u, o, d, w = []) => {
    let c = k(), l = c.PTR_SIZE, m = je.get(r);
    if (!m) throw new Error(`cannot run inference. invalid session id: ${r}`);
    let h = m[0], g = m[1], y = m[2], T = m[3], S = m[4], U = m[5], $ = [];
    if (w.length > 0) {
      if (T) throw new Error("LoRA adapters are not supported for a session that uses IO binding, e.g. when an output is preferred to be on GPU, or when the WebNN execution provider produces an output.");
      for (let z of w) {
        let j = Ct.get(z);
        if (j === void 0) throw new Error(`cannot run inference. invalid LoRA adapter id: ${z}`);
        $.push(j);
      }
    }
    let v = t.length, O = u.length, R = 0, C = [], G = [], b = [], Q = [], H = [], ue = c.stackSave(), he = c.stackAlloc(v * l), I = c.stackAlloc(v * l), J = c.stackAlloc(O * l), Re = c.stackAlloc(O * l);
    try {
      for (let L of w) ze.set(L, (ze.get(L) ?? 0) + 1);
      [R, C] = ho(d, $), De("wasm prepareInputOutputTensor");
      for (let L = 0; L < v; L++) await vo(a[L], G, Q, r, g[t[L]], t[L], S);
      for (let L = 0; L < O; L++) await vo(o[L], b, Q, r, y[u[L]], v + u[L], S);
      Pe("wasm prepareInputOutputTensor");
      for (let L = 0; L < v; L++) c.setValue(he + L * l, G[L], "*"), c.setValue(I + L * l, g[t[L]], "*");
      for (let L = 0; L < O; L++) c.setValue(J + L * l, b[L], "*"), c.setValue(Re + L * l, y[u[L]], "*");
      c.jsepOnRunStart?.(h), c.webnnOnRunStart?.(h);
      let z;
      z = await c._OrtRun(h, I, he, v, Re, O, J, R), z !== 0 && W("failed to call OrtRun().");
      let j = [], Ne = [];
      De("wasm ProcessOutputTensor");
      for (let L = 0; L < O; L++) {
        let ne = Number(c.getValue(J + L * l, "*"));
        if (ne === b[L] || H.includes(b[L])) {
          j.push(o[L]), ne !== b[L] && c._OrtReleaseTensor(ne) !== 0 && W("Can't release tensor.");
          continue;
        }
        let Je = c.stackSave(), oe = c.stackAlloc(4 * l), we = false, q, X = 0;
        try {
          c._OrtGetTensorData(ne, oe, oe + l, oe + 2 * l, oe + 3 * l) !== 0 && W(`Can't access output tensor data on index ${L}.`);
          let Fe = l === 4 ? "i32" : "i64", be = Number(c.getValue(oe, Fe));
          X = c.getValue(oe + l, "*");
          let ve = c.getValue(oe + l * 2, "*"), at = Number(c.getValue(oe + l * 3, Fe)), ae = [];
          for (let Z = 0; Z < at; Z++) ae.push(Number(c.getValue(ve + Z * l, Fe)));
          c._OrtFree(ve) !== 0 && W("Can't free memory for tensor dims.");
          let F = ae.reduce((Z, V) => Z * V, 1);
          q = Dt(be);
          let ye = T?.outputPreferredLocations[u[L]];
          if (q === "string") {
            if (ye === "gpu-buffer" || ye === "ml-tensor") throw new Error("String tensor is not supported on GPU.");
            let Z = [];
            for (let V = 0; V < F; V++) {
              let ee = c.getValue(X + V * l, "*"), me = c.getValue(X + (V + 1) * l, "*"), Ze = V === F - 1 ? void 0 : me - ee;
              Z.push(c.UTF8ToString(ee, Ze));
            }
            j.push([q, ae, Z, "cpu"]);
          } else if (ye === "gpu-buffer" && F > 0) {
            let Z = c.jsepGetBuffer;
            if (!Z) throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');
            let V = Z(X), ee = He(be, F);
            if (ee === void 0 || !Pt(q)) throw new Error(`Unsupported data type: ${q}`);
            we = true, j.push([q, ae, { gpuBuffer: V, download: c.jsepCreateDownloader(V, ee, q), dispose: () => {
              c._OrtReleaseTensor(ne) !== 0 && W("Can't release tensor.");
            } }, "gpu-buffer"]);
          } else if (ye === "ml-tensor" && F > 0) {
            let Z = c.webnnEnsureTensor, V = c.webnnIsGraphInputOutputTypeSupported;
            if (!Z || !V) throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');
            if (He(be, F) === void 0 || !xt(q)) throw new Error(`Unsupported data type: ${q}`);
            if (!V(r, q, false)) throw new Error(`preferredLocation "ml-tensor" for ${q} output is not supported by current WebNN Context.`);
            let me = await Z(r, X, be, ae, false);
            we = true, j.push([q, ae, { mlTensor: me, download: c.webnnCreateMLTensorDownloader(X, q), dispose: () => {
              c.webnnReleaseTensorId(X), c._OrtReleaseTensor(ne);
            } }, "ml-tensor"]);
          } else if (ye === "ml-tensor-cpu-output" && F > 0) {
            let Z = c.webnnCreateMLTensorDownloader(X, q)(), V = j.length;
            we = true, Ne.push((async () => {
              let ee = [V, await Z];
              return c.webnnReleaseTensorId(X), c._OrtReleaseTensor(ne), ee;
            })()), j.push([q, ae, [], "cpu"]);
          } else {
            let Z = go(q), V = new Z(F);
            new Uint8Array(V.buffer, V.byteOffset, V.byteLength).set(c.HEAPU8.subarray(X, X + V.byteLength)), j.push([q, ae, V, "cpu"]);
          }
        } finally {
          c.stackRestore(Je), q === "string" && X && c._free(X), we || c._OrtReleaseTensor(ne);
        }
      }
      T && !S && (c._OrtClearBoundOutputs(T.handle) !== 0 && W("Can't clear bound outputs."), je.set(r, [h, g, y, T, S, false]));
      for (let [L, ne] of await Promise.all(Ne)) j[L][2] = ne;
      return Pe("wasm ProcessOutputTensor"), j;
    } finally {
      c.webnnOnRunEnd?.(h), c.stackRestore(ue), G.forEach((z) => c._OrtReleaseTensor(z)), b.forEach((z) => c._OrtReleaseTensor(z)), Q.forEach((z) => c._free(z)), R !== 0 && c._OrtReleaseRunOptions(R), C.forEach((z) => c._free(z));
      for (let z of w) {
        let j = ze.get(z) - 1;
        j === 0 ? ze.delete(z) : ze.set(z, j);
      }
    }
  }, It = (r) => {
    let t = k(), a = je.get(r);
    if (!a) throw new Error("invalid session id");
    let u = a[0], o = t._OrtEndProfiling(u);
    o === 0 && W("Can't get an profile file name."), t._OrtFree(o);
  }, Lt = (r) => {
    let t = [];
    for (let a of r) {
      let u = a[2];
      !Array.isArray(u) && "buffer" in u && t.push(u.buffer);
    }
    return t;
  };
});
var Se;
var fe;
var ot;
var Rt;
var Nt;
var Mt;
var br;
var yr;
var Ve;
var Ye;
var ks;
var Io;
var Lo;
var Bo;
var _o;
var Do;
var Po;
var xo;
var Uo;
var Co;
var Ft = M(() => {
  "use strict";
  Te();
  dr();
  Ue();
  gt();
  Ut();
  Se = () => !!Y.wasm.proxy && typeof document < "u", ot = false, Rt = false, Nt = false, yr = /* @__PURE__ */ new Map(), Ve = (r, t) => {
    let a = yr.get(r);
    a ? a.push(t) : yr.set(r, [t]);
  }, Ye = () => {
    if (ot || !Rt || Nt || !fe) throw new Error("worker not ready");
  }, ks = (r) => {
    switch (r.data.type) {
      case "init-wasm":
        ot = false, r.data.err ? (Nt = true, br[1](r.data.err)) : (Rt = true, br[0]()), Mt && (URL.revokeObjectURL(Mt), Mt = void 0);
        break;
      case "init-ep":
      case "copy-from":
      case "create":
      case "release":
      case "run":
      case "end-profiling": {
        let t = yr.get(r.data.type);
        r.data.err ? t.shift()[1](r.data.err) : t.shift()[0](r.data.out);
        break;
      }
      default:
    }
  }, Io = async () => {
    if (!Rt) {
      if (ot) throw new Error("multiple calls to 'initWasm()' detected.");
      if (Nt) throw new Error("previous call to 'initWasm()' failed.");
      if (ot = true, Se()) return new Promise((r, t) => {
        fe?.terminate(), lo().then(([a, u]) => {
          try {
            fe = u, fe.onerror = (d) => t(d), fe.onmessage = ks, br = [r, t];
            let o = { type: "init-wasm", in: Y };
            !o.in.wasm.wasmPaths && (a || pr) && (o.in.wasm.wasmPaths = { wasm: new URL("ort-wasm-simd-threaded.wasm", import.meta.url).href }), fe.postMessage(o), Mt = a;
          } catch (o) {
            t(o);
          }
        }, t);
      });
      try {
        await Et(Y.wasm), await Tt(Y), Rt = true;
      } catch (r) {
        throw Nt = true, r;
      } finally {
        ot = false;
      }
    }
  }, Lo = async (r) => {
    if (Se()) return Ye(), new Promise((t, a) => {
      Ve("init-ep", [t, a]);
      let u = { type: "init-ep", in: { epName: r, env: Y } };
      fe.postMessage(u);
    });
    await St(Y, r);
  }, Bo = async (r) => Se() ? (Ye(), new Promise((t, a) => {
    Ve("copy-from", [t, a]);
    let u = { type: "copy-from", in: { buffer: r } };
    fe.postMessage(u, [r.buffer]);
  })) : rt(r), _o = async (r, t) => {
    if (Se()) {
      if (t?.preferredOutputLocation) throw new Error('session option "preferredOutputLocation" is not supported for proxy.');
      return Ye(), new Promise((a, u) => {
        Ve("create", [a, u]);
        let o = { type: "create", in: { model: r, options: { ...t } } }, d = [];
        r instanceof Uint8Array && d.push(r.buffer), fe.postMessage(o, d);
      });
    } else return vt(r, t);
  }, Do = async (r) => {
    if (Se()) return Ye(), new Promise((t, a) => {
      Ve("release", [t, a]);
      let u = { type: "release", in: r };
      fe.postMessage(u);
    });
    At(r);
  }, Po = async (r) => {
    if (Se()) throw new Error("LoRA adapter is not supported for proxy.");
    let t = typeof r == "string" ? await Me(r) : r;
    return Ao(t);
  }, xo = async (r) => {
    if (Se()) throw new Error("LoRA adapter is not supported for proxy.");
    Oo(r);
  }, Uo = async (r, t, a, u, o, d, w) => {
    if (Se()) {
      if (w.length > 0) throw new Error("LoRA adapter is not supported for proxy.");
      if (a.some((c) => c[3] !== "cpu")) throw new Error("input tensor on GPU is not supported for proxy.");
      if (o.some((c) => c)) throw new Error("pre-allocated output tensor is not supported for proxy.");
      return Ye(), new Promise((c, l) => {
        Ve("run", [c, l]);
        let m = a, h = { type: "run", in: { sessionId: r, inputIndices: t, inputs: m, outputIndices: u, options: d } };
        fe.postMessage(h, Lt(m));
      });
    } else return Ot(r, t, a, u, o, d, w);
  }, Co = async (r) => {
    if (Se()) return Ye(), new Promise((t, a) => {
      Ve("end-profiling", [t, a]);
      let u = { type: "end-profiling", in: r };
      fe.postMessage(u);
    });
    It(r);
  };
});
var qe;
var gr = M(() => {
  "use strict";
  Te();
  Ft();
  qe = class {
    async loadAdapter(t) {
      de(), this.adapterId = await Po(t), le();
    }
    async dispose() {
      return xo(this.adapterId);
    }
  };
});
var Mo;
var Ws;
var kt;
var Ro = M(() => {
  "use strict";
  Te();
  gr();
  Ft();
  wr();
  yt();
  Ut();
  Mo = (r, t) => {
    switch (r.location) {
      case "cpu":
        return [r.type, r.dims, r.data, "cpu"];
      case "gpu-buffer":
        return [r.type, r.dims, { gpuBuffer: r.gpuBuffer }, "gpu-buffer"];
      case "ml-tensor":
        return [r.type, r.dims, { mlTensor: r.mlTensor }, "ml-tensor"];
      default:
        throw new Error(`invalid data location: ${r.location} for ${t()}`);
    }
  }, Ws = (r) => {
    switch (r[3]) {
      case "cpu":
        return new pe(r[0], r[2], r[1]);
      case "gpu-buffer": {
        let t = r[0];
        if (!Pt(t)) throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);
        let { gpuBuffer: a, download: u, dispose: o } = r[2];
        return pe.fromGpuBuffer(a, { dataType: t, dims: r[1], download: u, dispose: o });
      }
      case "ml-tensor": {
        let t = r[0];
        if (!xt(t)) throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);
        let { mlTensor: a, download: u, dispose: o } = r[2];
        return pe.fromMLTensor(a, { dataType: t, dims: r[1], download: u, dispose: o });
      }
      default:
        throw new Error(`invalid data location: ${r[3]}`);
    }
  }, kt = class {
    async fetchModelAndCopyToWasmMemory(t) {
      return Bo(await Me(t));
    }
    async loadModel(t, a) {
      de();
      let u;
      typeof t == "string" ? u = await this.fetchModelAndCopyToWasmMemory(t) : u = t, [this.sessionId, this.inputNames, this.outputNames, this.inputMetadata, this.outputMetadata] = await _o(u, a), le();
    }
    async dispose() {
      return Do(this.sessionId);
    }
    async run(t, a, u, o = []) {
      de();
      let d = o.map((S) => {
        if (!(S instanceof qe)) throw new Error("LoRA adapter was not created by the WebAssembly backend.");
        return S.adapterId;
      }), w = [], c = [];
      Object.entries(t).forEach((S) => {
        let U = S[0], $ = S[1], v = this.inputNames.indexOf(U);
        if (v === -1) throw new Error(`invalid input '${U}'`);
        w.push($), c.push(v);
      });
      let l = [], m = [];
      Object.entries(a).forEach((S) => {
        let U = S[0], $ = S[1], v = this.outputNames.indexOf(U);
        if (v === -1) throw new Error(`invalid output '${U}'`);
        l.push($), m.push(v);
      });
      let h = w.map((S, U) => Mo(S, () => `input "${this.inputNames[c[U]]}"`)), g = l.map((S, U) => S ? Mo(S, () => `output "${this.outputNames[m[U]]}"`) : null), y = await Uo(this.sessionId, c, h, m, g, u, d), T = {};
      for (let S = 0; S < y.length; S++) T[this.outputNames[m[S]]] = l[S] ?? Ws(y[S]);
      return le(), T;
    }
    startProfiling() {
    }
    endProfiling() {
      Co(this.sessionId);
    }
  };
});
var No;
var Fo = M(() => {
  "use strict";
  No = (r) => {
    if (r?.epContextDataRead) throw new Error('session option "epContextDataRead" is not supported by ONNX Runtime Web');
  };
});
var Wo = {};
pt(Wo, { OnnxruntimeWebAssemblyBackend: () => Wt, initializeFlags: () => ko, wasmBackend: () => Gs });
var ko;
var Wt;
var Gs;
var Go = M(() => {
  "use strict";
  Te();
  gr();
  Ft();
  Ro();
  Fo();
  ko = () => {
    (typeof Y.wasm.initTimeout != "number" || Y.wasm.initTimeout < 0) && (Y.wasm.initTimeout = 0);
    let r = Y.wasm.simd;
    if (typeof r != "boolean" && r !== void 0 && r !== "fixed" && r !== "relaxed" && (console.warn(`Property "env.wasm.simd" is set to unknown value "${r}". Reset it to \`false\` and ignore SIMD feature checking.`), Y.wasm.simd = false), typeof Y.wasm.proxy != "boolean" && (Y.wasm.proxy = false), typeof Y.wasm.trace != "boolean" && (Y.wasm.trace = false), typeof Y.wasm.numThreads != "number" || !Number.isInteger(Y.wasm.numThreads) || Y.wasm.numThreads <= 0) if (typeof self < "u" && !self.crossOriginIsolated) Y.wasm.numThreads = 1;
    else {
      let t = typeof navigator > "u" ? or("node:os").cpus().length : navigator.hardwareConcurrency;
      Y.wasm.numThreads = Math.min(4, Math.ceil((t || 1) / 2));
    }
  }, Wt = class {
    async init(t) {
      ko(), await Io(), await Lo(t);
    }
    async createInferenceSessionHandler(t, a) {
      No(a);
      let u = new kt();
      return await u.loadModel(t, a), u;
    }
    async createLoraAdapterHandler(t) {
      let a = new qe();
      return await a.loadAdapter(t), a;
    }
  }, Gs = new Wt();
});
Te();
Te();
Te();
var Kn = "1.31.1";
{
  let r = (Go(), ar(Wo)).wasmBackend;
  et("cpu", r, 10), et("wasm", r, 10);
}
Object.defineProperty(Y.versions, "web", { value: Kn, enumerable: true });

// web/embeddings.js
Y.wasm.numThreads = 1;
Y.wasm.proxy = false;
Y.wasm.wasmPaths = {
  mjs: new URL("./vendor/ort-wasm-simd-threaded.mjs", import.meta.url).href,
  wasm: new URL("./vendor/ort-wasm-simd-threaded.wasm", import.meta.url).href
};
var MODEL_BASE = "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/";
var resourcesPromise;
var inferenceQueue = Promise.resolve();
async function modelFile(name) {
  const url = MODEL_BASE + name;
  let cache;
  try {
    cache = await caches.open("bram-minilm-q8-v1");
    const saved = await cache.match(url);
    if (saved) return saved;
  } catch {
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${name} (HTTP ${response.status}).`);
  try {
    await cache?.put(url, response.clone());
  } catch {
  }
  return response;
}
async function resources() {
  if (!resourcesPromise) resourcesPromise = (async () => {
    const [definition, config, weights] = await Promise.all([
      modelFile("tokenizer.json").then((r) => r.json()),
      modelFile("tokenizer_config.json").then((r) => r.json()),
      modelFile("onnx/model_quantized.onnx").then((r) => r.arrayBuffer())
    ]);
    const tokenizer = new Tokenizer_default(definition, config);
    const session = await gs.create(weights, { executionProviders: ["wasm"] });
    return { tokenizer, session };
  })().catch((error) => {
    resourcesPromise = null;
    throw error;
  });
  return resourcesPromise;
}
function meanPool(data, dims, mask) {
  const [batch, sequence, width] = dims, output = [];
  for (let b = 0; b < batch; b++) {
    const vector = new Array(width).fill(0);
    let count = 0;
    for (let s = 0; s < sequence; s++) {
      if (!mask[b * sequence + s]) continue;
      count++;
      for (let k2 = 0; k2 < width; k2++) vector[k2] += data[(b * sequence + s) * width + k2];
    }
    for (let k2 = 0; k2 < width; k2++) vector[k2] /= Math.max(count, 1);
    const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0)) || 1;
    output.push(vector.map((x) => x / norm));
  }
  return output;
}
async function infer(texts) {
  if (!texts.length) return [];
  const { tokenizer, session } = await resources();
  const encoded = texts.map((text) => {
    const ids2 = tokenizer.encode(text, { add_special_tokens: true }).ids;
    return ids2.length > 256 ? [...ids2.slice(0, 255), ids2.at(-1)] : ids2;
  });
  const sequence = Math.max(...encoded.map((ids2) => ids2.length)), size = sequence * texts.length;
  const ids = new BigInt64Array(size), mask = new BigInt64Array(size), types = new BigInt64Array(size);
  encoded.forEach((row, b) => row.forEach((id, s) => {
    ids[b * sequence + s] = BigInt(id);
    mask[b * sequence + s] = 1n;
  }));
  const feeds = { input_ids: new pe("int64", ids, [texts.length, sequence]), attention_mask: new pe("int64", mask, [texts.length, sequence]) };
  if (session.inputNames.includes("token_type_ids")) feeds.token_type_ids = new pe("int64", types, [texts.length, sequence]);
  const outputs = await session.run(feeds), hidden = outputs.last_hidden_state;
  if (!hidden || hidden.dims.length !== 3) throw new Error("The MiniLM model returned an unexpected output.");
  return meanPool(hidden.data, hidden.dims, mask);
}
function embed(texts) {
  const operation = inferenceQueue.then(() => infer(texts));
  inferenceQueue = operation.catch(() => {
  });
  return operation;
}
export {
  embed,
  meanPool
};
/*! For license information please see embeddings.js.LEGAL.txt */
