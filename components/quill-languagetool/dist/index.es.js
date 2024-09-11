"use client";
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function (d, b) {
  extendStatics =
    Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array &&
      function (d, b) {
        d.__proto__ = b;
      }) ||
    function (d, b) {
      for (var p in b)
        if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    };
  return extendStatics(d, b);
};

function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError(
      "Class extends value " + String(b) + " is not a constructor or null"
    );
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype =
    b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
}

var __assign = function () {
  __assign =
    Object.assign ||
    function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
    };
  return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P
      ? value
      : new P(function (resolve) {
          resolve(value);
        });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done
        ? resolve(result.value)
        : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

function __generator(thisArg, body) {
  var _ = {
      label: 0,
      sent: function () {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: [],
    },
    f,
    y,
    t,
    g;
  return (
    (g = { next: verb(0), throw: verb(1), return: verb(2) }),
    typeof Symbol === "function" &&
      (g[Symbol.iterator] = function () {
        return this;
      }),
    g
  );
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (
          ((f = 1),
          y &&
            (t =
              op[0] & 2
                ? y["return"]
                : op[0]
                ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                : y.next) &&
            !(t = t.call(y, op[1])).done)
        )
          return t;
        if (((y = 0), t)) op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (
              !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
              (op[0] === 6 || op[0] === 2)
            ) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2]) _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}

/** @deprecated */
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++)
    s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
}

function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) {
    Object.defineProperty(cooked, "raw", { value: raw });
  } else {
    cooked.raw = raw;
  }
  return cooked;
}

function debug() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  if (process.env.NODE_ENV !== "production") {
    console.debug.apply(console, __spreadArrays(["QuillLanguageTool"], args));
  }
}

var commonjsGlobal =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
    ? global
    : typeof self !== "undefined"
    ? self
    : {};

function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default")
    ? x["default"]
    : x;
}

function createCommonjsModule(fn, basedir, module) {
  return (
    (module = {
      path: basedir,
      exports: {},
      require: function (path, base) {
        return commonjsRequire(
          path,
          base === undefined || base === null ? module.path : base
        );
      },
    }),
    fn(module, module.exports),
    module.exports
  );
}

function commonjsRequire() {
  throw new Error(
    "Dynamic requires are not currently supported by @rollup/plugin-commonjs"
  );
}

/**
 * This library modifies the diff-patch-match library by Neil Fraser
 * by removing the patch and match functionality and certain advanced
 * options in the diff function. The original license is as follows:
 *
 * ===
 *
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;

/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {Int|Object} [cursor_pos] Edit position in text1 or object with more info
 * @return {Array} Array of diff tuples.
 */
function diff_main(text1, text2, cursor_pos, _fix_unicode) {
  // Check for equality
  if (text1 === text2) {
    if (text1) {
      return [[DIFF_EQUAL, text1]];
    }
    return [];
  }

  if (cursor_pos != null) {
    var editdiff = find_cursor_edit_diff(text1, text2, cursor_pos);
    if (editdiff) {
      return editdiff;
    }
  }

  // Trim off common prefix (speedup).
  var commonlength = diff_commonPrefix(text1, text2);
  var commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);

  // Trim off common suffix (speedup).
  commonlength = diff_commonSuffix(text1, text2);
  var commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);

  // Compute the diff on the middle block.
  var diffs = diff_compute_(text1, text2);

  // Restore the prefix and suffix.
  if (commonprefix) {
    diffs.unshift([DIFF_EQUAL, commonprefix]);
  }
  if (commonsuffix) {
    diffs.push([DIFF_EQUAL, commonsuffix]);
  }
  diff_cleanupMerge(diffs, _fix_unicode);
  return diffs;
}

/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @return {Array} Array of diff tuples.
 */
function diff_compute_(text1, text2) {
  var diffs;

  if (!text1) {
    // Just add some text (speedup).
    return [[DIFF_INSERT, text2]];
  }

  if (!text2) {
    // Just delete some text (speedup).
    return [[DIFF_DELETE, text1]];
  }

  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  var i = longtext.indexOf(shorttext);
  if (i !== -1) {
    // Shorter text is inside the longer text (speedup).
    diffs = [
      [DIFF_INSERT, longtext.substring(0, i)],
      [DIFF_EQUAL, shorttext],
      [DIFF_INSERT, longtext.substring(i + shorttext.length)],
    ];
    // Swap insertions for deletions if diff is reversed.
    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    }
    return diffs;
  }

  if (shorttext.length === 1) {
    // Single character string.
    // After the previous speedup, the character can't be an equality.
    return [
      [DIFF_DELETE, text1],
      [DIFF_INSERT, text2],
    ];
  }

  // Check to see if the problem can be split in two.
  var hm = diff_halfMatch_(text1, text2);
  if (hm) {
    // A half-match was found, sort out the return data.
    var text1_a = hm[0];
    var text1_b = hm[1];
    var text2_a = hm[2];
    var text2_b = hm[3];
    var mid_common = hm[4];
    // Send both pairs off for separate processing.
    var diffs_a = diff_main(text1_a, text2_a);
    var diffs_b = diff_main(text1_b, text2_b);
    // Merge the results.
    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
  }

  return diff_bisect_(text1, text2);
}

/**
 * Find the 'middle snake' of a diff, split the problem in two
 * and return the recursively constructed diff.
 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @return {Array} Array of diff tuples.
 * @private
 */
function diff_bisect_(text1, text2) {
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  var max_d = Math.ceil((text1_length + text2_length) / 2);
  var v_offset = max_d;
  var v_length = 2 * max_d;
  var v1 = new Array(v_length);
  var v2 = new Array(v_length);
  // Setting all elements to -1 is faster in Chrome & Firefox than mixing
  // integers and undefined.
  for (var x = 0; x < v_length; x++) {
    v1[x] = -1;
    v2[x] = -1;
  }
  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  var delta = text1_length - text2_length;
  // If the total number of characters is odd, then the front path will collide
  // with the reverse path.
  var front = delta % 2 !== 0;
  // Offsets for start and end of k loop.
  // Prevents mapping of space beyond the grid.
  var k1start = 0;
  var k1end = 0;
  var k2start = 0;
  var k2end = 0;
  for (var d = 0; d < max_d; d++) {
    // Walk the front path one step.
    for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      var k1_offset = v_offset + k1;
      var x1;
      if (k1 === -d || (k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
        x1 = v1[k1_offset + 1];
      } else {
        x1 = v1[k1_offset - 1] + 1;
      }
      var y1 = x1 - k1;
      while (
        x1 < text1_length &&
        y1 < text2_length &&
        text1.charAt(x1) === text2.charAt(y1)
      ) {
        x1++;
        y1++;
      }
      v1[k1_offset] = x1;
      if (x1 > text1_length) {
        // Ran off the right of the graph.
        k1end += 2;
      } else if (y1 > text2_length) {
        // Ran off the bottom of the graph.
        k1start += 2;
      } else if (front) {
        var k2_offset = v_offset + delta - k1;
        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
          // Mirror x2 onto top-left coordinate system.
          var x2 = text1_length - v2[k2_offset];
          if (x1 >= x2) {
            // Overlap detected.
            return diff_bisectSplit_(text1, text2, x1, y1);
          }
        }
      }
    }

    // Walk the reverse path one step.
    for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      var k2_offset = v_offset + k2;
      var x2;
      if (k2 === -d || (k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
        x2 = v2[k2_offset + 1];
      } else {
        x2 = v2[k2_offset - 1] + 1;
      }
      var y2 = x2 - k2;
      while (
        x2 < text1_length &&
        y2 < text2_length &&
        text1.charAt(text1_length - x2 - 1) ===
          text2.charAt(text2_length - y2 - 1)
      ) {
        x2++;
        y2++;
      }
      v2[k2_offset] = x2;
      if (x2 > text1_length) {
        // Ran off the left of the graph.
        k2end += 2;
      } else if (y2 > text2_length) {
        // Ran off the top of the graph.
        k2start += 2;
      } else if (!front) {
        var k1_offset = v_offset + delta - k2;
        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
          var x1 = v1[k1_offset];
          var y1 = v_offset + x1 - k1_offset;
          // Mirror x2 onto top-left coordinate system.
          x2 = text1_length - x2;
          if (x1 >= x2) {
            // Overlap detected.
            return diff_bisectSplit_(text1, text2, x1, y1);
          }
        }
      }
    }
  }
  // Diff took too long and hit the deadline or
  // number of diffs equals number of characters, no commonality at all.
  return [
    [DIFF_DELETE, text1],
    [DIFF_INSERT, text2],
  ];
}

/**
 * Given the location of the 'middle snake', split the diff in two parts
 * and recurse.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} x Index of split point in text1.
 * @param {number} y Index of split point in text2.
 * @return {Array} Array of diff tuples.
 */
function diff_bisectSplit_(text1, text2, x, y) {
  var text1a = text1.substring(0, x);
  var text2a = text2.substring(0, y);
  var text1b = text1.substring(x);
  var text2b = text2.substring(y);

  // Compute both diffs serially.
  var diffs = diff_main(text1a, text2a);
  var diffsb = diff_main(text1b, text2b);

  return diffs.concat(diffsb);
}

/**
 * Determine the common prefix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
function diff_commonPrefix(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerstart = 0;
  while (pointermin < pointermid) {
    if (
      text1.substring(pointerstart, pointermid) ==
      text2.substring(pointerstart, pointermid)
    ) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }

  if (is_surrogate_pair_start(text1.charCodeAt(pointermid - 1))) {
    pointermid--;
  }

  return pointermid;
}

/**
 * Determine the common suffix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
function diff_commonSuffix(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.slice(-1) !== text2.slice(-1)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerend = 0;
  while (pointermin < pointermid) {
    if (
      text1.substring(text1.length - pointermid, text1.length - pointerend) ==
      text2.substring(text2.length - pointermid, text2.length - pointerend)
    ) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }

  if (is_surrogate_pair_end(text1.charCodeAt(text1.length - pointermid))) {
    pointermid--;
  }

  return pointermid;
}

/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 */
function diff_halfMatch_(text1, text2) {
  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
    return null; // Pointless.
  }

  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext.
   * @return {Array.<string>} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */
  function diff_halfMatchI_(longtext, shorttext, i) {
    // Start with a 1/4 length substring at position i as a seed.
    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
    var j = -1;
    var best_common = "";
    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    while ((j = shorttext.indexOf(seed, j + 1)) !== -1) {
      var prefixLength = diff_commonPrefix(
        longtext.substring(i),
        shorttext.substring(j)
      );
      var suffixLength = diff_commonSuffix(
        longtext.substring(0, i),
        shorttext.substring(0, j)
      );
      if (best_common.length < suffixLength + prefixLength) {
        best_common =
          shorttext.substring(j - suffixLength, j) +
          shorttext.substring(j, j + prefixLength);
        best_longtext_a = longtext.substring(0, i - suffixLength);
        best_longtext_b = longtext.substring(i + prefixLength);
        best_shorttext_a = shorttext.substring(0, j - suffixLength);
        best_shorttext_b = shorttext.substring(j + prefixLength);
      }
    }
    if (best_common.length * 2 >= longtext.length) {
      return [
        best_longtext_a,
        best_longtext_b,
        best_shorttext_a,
        best_shorttext_b,
        best_common,
      ];
    } else {
      return null;
    }
  }

  // First check if the second quarter is the seed for a half-match.
  var hm1 = diff_halfMatchI_(
    longtext,
    shorttext,
    Math.ceil(longtext.length / 4)
  );
  // Check again based on the third quarter.
  var hm2 = diff_halfMatchI_(
    longtext,
    shorttext,
    Math.ceil(longtext.length / 2)
  );
  var hm;
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }

  // A half-match was found, sort out the return data.
  var text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  var mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
}

/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {Array} diffs Array of diff tuples.
 * @param {boolean} fix_unicode Whether to normalize to a unicode-correct diff
 */
function diff_cleanupMerge(diffs, fix_unicode) {
  diffs.push([DIFF_EQUAL, ""]); // Add a dummy entry at the end.
  var pointer = 0;
  var count_delete = 0;
  var count_insert = 0;
  var text_delete = "";
  var text_insert = "";
  var commonlength;
  while (pointer < diffs.length) {
    if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
      diffs.splice(pointer, 1);
      continue;
    }
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_EQUAL:
        var previous_equality = pointer - count_insert - count_delete - 1;
        if (fix_unicode) {
          // prevent splitting of unicode surrogate pairs.  when fix_unicode is true,
          // we assume that the old and new text in the diff are complete and correct
          // unicode-encoded JS strings, but the tuple boundaries may fall between
          // surrogate pairs.  we fix this by shaving off stray surrogates from the end
          // of the previous equality and the beginning of this equality.  this may create
          // empty equalities or a common prefix or suffix.  for example, if AB and AC are
          // emojis, `[[0, 'A'], [-1, 'BA'], [0, 'C']]` would turn into deleting 'ABAC' and
          // inserting 'AC', and then the common suffix 'AC' will be eliminated.  in this
          // particular case, both equalities go away, we absorb any previous inequalities,
          // and we keep scanning for the next equality before rewriting the tuples.
          if (
            previous_equality >= 0 &&
            ends_with_pair_start(diffs[previous_equality][1])
          ) {
            var stray = diffs[previous_equality][1].slice(-1);
            diffs[previous_equality][1] = diffs[previous_equality][1].slice(
              0,
              -1
            );
            text_delete = stray + text_delete;
            text_insert = stray + text_insert;
            if (!diffs[previous_equality][1]) {
              // emptied out previous equality, so delete it and include previous delete/insert
              diffs.splice(previous_equality, 1);
              pointer--;
              var k = previous_equality - 1;
              if (diffs[k] && diffs[k][0] === DIFF_INSERT) {
                count_insert++;
                text_insert = diffs[k][1] + text_insert;
                k--;
              }
              if (diffs[k] && diffs[k][0] === DIFF_DELETE) {
                count_delete++;
                text_delete = diffs[k][1] + text_delete;
                k--;
              }
              previous_equality = k;
            }
          }
          if (starts_with_pair_end(diffs[pointer][1])) {
            var stray = diffs[pointer][1].charAt(0);
            diffs[pointer][1] = diffs[pointer][1].slice(1);
            text_delete += stray;
            text_insert += stray;
          }
        }
        if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
          // for empty equality not at end, wait for next equality
          diffs.splice(pointer, 1);
          break;
        }
        if (text_delete.length > 0 || text_insert.length > 0) {
          // note that diff_commonPrefix and diff_commonSuffix are unicode-aware
          if (text_delete.length > 0 && text_insert.length > 0) {
            // Factor out any common prefixes.
            commonlength = diff_commonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if (previous_equality >= 0) {
                diffs[previous_equality][1] += text_insert.substring(
                  0,
                  commonlength
                );
              } else {
                diffs.splice(0, 0, [
                  DIFF_EQUAL,
                  text_insert.substring(0, commonlength),
                ]);
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            // Factor out any common suffixes.
            commonlength = diff_commonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] =
                text_insert.substring(text_insert.length - commonlength) +
                diffs[pointer][1];
              text_insert = text_insert.substring(
                0,
                text_insert.length - commonlength
              );
              text_delete = text_delete.substring(
                0,
                text_delete.length - commonlength
              );
            }
          }
          // Delete the offending records and add the merged ones.
          var n = count_insert + count_delete;
          if (text_delete.length === 0 && text_insert.length === 0) {
            diffs.splice(pointer - n, n);
            pointer = pointer - n;
          } else if (text_delete.length === 0) {
            diffs.splice(pointer - n, n, [DIFF_INSERT, text_insert]);
            pointer = pointer - n + 1;
          } else if (text_insert.length === 0) {
            diffs.splice(pointer - n, n, [DIFF_DELETE, text_delete]);
            pointer = pointer - n + 1;
          } else {
            diffs.splice(
              pointer - n,
              n,
              [DIFF_DELETE, text_delete],
              [DIFF_INSERT, text_insert]
            );
            pointer = pointer - n + 2;
          }
        }
        if (pointer !== 0 && diffs[pointer - 1][0] === DIFF_EQUAL) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = "";
        text_insert = "";
        break;
    }
  }
  if (diffs[diffs.length - 1][1] === "") {
    diffs.pop(); // Remove the dummy entry at the end.
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  var changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (
      diffs[pointer - 1][0] === DIFF_EQUAL &&
      diffs[pointer + 1][0] === DIFF_EQUAL
    ) {
      // This is a single edit surrounded by equalities.
      if (
        diffs[pointer][1].substring(
          diffs[pointer][1].length - diffs[pointer - 1][1].length
        ) === diffs[pointer - 1][1]
      ) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] =
          diffs[pointer - 1][1] +
          diffs[pointer][1].substring(
            0,
            diffs[pointer][1].length - diffs[pointer - 1][1].length
          );
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (
        diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
        diffs[pointer + 1][1]
      ) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] =
          diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
          diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    diff_cleanupMerge(diffs, fix_unicode);
  }
}
function is_surrogate_pair_start(charCode) {
  return charCode >= 0xd800 && charCode <= 0xdbff;
}

function is_surrogate_pair_end(charCode) {
  return charCode >= 0xdc00 && charCode <= 0xdfff;
}

function starts_with_pair_end(str) {
  return is_surrogate_pair_end(str.charCodeAt(0));
}

function ends_with_pair_start(str) {
  return is_surrogate_pair_start(str.charCodeAt(str.length - 1));
}

function remove_empty_tuples(tuples) {
  var ret = [];
  for (var i = 0; i < tuples.length; i++) {
    if (tuples[i][1].length > 0) {
      ret.push(tuples[i]);
    }
  }
  return ret;
}

function make_edit_splice(before, oldMiddle, newMiddle, after) {
  if (ends_with_pair_start(before) || starts_with_pair_end(after)) {
    return null;
  }
  return remove_empty_tuples([
    [DIFF_EQUAL, before],
    [DIFF_DELETE, oldMiddle],
    [DIFF_INSERT, newMiddle],
    [DIFF_EQUAL, after],
  ]);
}

function find_cursor_edit_diff(oldText, newText, cursor_pos) {
  // note: this runs after equality check has ruled out exact equality
  var oldRange =
    typeof cursor_pos === "number"
      ? { index: cursor_pos, length: 0 }
      : cursor_pos.oldRange;
  var newRange = typeof cursor_pos === "number" ? null : cursor_pos.newRange;
  // take into account the old and new selection to generate the best diff
  // possible for a text edit.  for example, a text change from "xxx" to "xx"
  // could be a delete or forwards-delete of any one of the x's, or the
  // result of selecting two of the x's and typing "x".
  var oldLength = oldText.length;
  var newLength = newText.length;
  if (oldRange.length === 0 && (newRange === null || newRange.length === 0)) {
    // see if we have an insert or delete before or after cursor
    var oldCursor = oldRange.index;
    var oldBefore = oldText.slice(0, oldCursor);
    var oldAfter = oldText.slice(oldCursor);
    var maybeNewCursor = newRange ? newRange.index : null;
    editBefore: {
      // is this an insert or delete right before oldCursor?
      var newCursor = oldCursor + newLength - oldLength;
      if (maybeNewCursor !== null && maybeNewCursor !== newCursor) {
        break editBefore;
      }
      if (newCursor < 0 || newCursor > newLength) {
        break editBefore;
      }
      var newBefore = newText.slice(0, newCursor);
      var newAfter = newText.slice(newCursor);
      if (newAfter !== oldAfter) {
        break editBefore;
      }
      var prefixLength = Math.min(oldCursor, newCursor);
      var oldPrefix = oldBefore.slice(0, prefixLength);
      var newPrefix = newBefore.slice(0, prefixLength);
      if (oldPrefix !== newPrefix) {
        break editBefore;
      }
      var oldMiddle = oldBefore.slice(prefixLength);
      var newMiddle = newBefore.slice(prefixLength);
      return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldAfter);
    }
    editAfter: {
      // is this an insert or delete right after oldCursor?
      if (maybeNewCursor !== null && maybeNewCursor !== oldCursor) {
        break editAfter;
      }
      var cursor = oldCursor;
      var newBefore = newText.slice(0, cursor);
      var newAfter = newText.slice(cursor);
      if (newBefore !== oldBefore) {
        break editAfter;
      }
      var suffixLength = Math.min(oldLength - cursor, newLength - cursor);
      var oldSuffix = oldAfter.slice(oldAfter.length - suffixLength);
      var newSuffix = newAfter.slice(newAfter.length - suffixLength);
      if (oldSuffix !== newSuffix) {
        break editAfter;
      }
      var oldMiddle = oldAfter.slice(0, oldAfter.length - suffixLength);
      var newMiddle = newAfter.slice(0, newAfter.length - suffixLength);
      return make_edit_splice(oldBefore, oldMiddle, newMiddle, oldSuffix);
    }
  }
  if (oldRange.length > 0 && newRange && newRange.length === 0) {
    replaceRange: {
      // see if diff could be a splice of the old selection range
      var oldPrefix = oldText.slice(0, oldRange.index);
      var oldSuffix = oldText.slice(oldRange.index + oldRange.length);
      var prefixLength = oldPrefix.length;
      var suffixLength = oldSuffix.length;
      if (newLength < prefixLength + suffixLength) {
        break replaceRange;
      }
      var newPrefix = newText.slice(0, prefixLength);
      var newSuffix = newText.slice(newLength - suffixLength);
      if (oldPrefix !== newPrefix || oldSuffix !== newSuffix) {
        break replaceRange;
      }
      var oldMiddle = oldText.slice(prefixLength, oldLength - suffixLength);
      var newMiddle = newText.slice(prefixLength, newLength - suffixLength);
      return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldSuffix);
    }
  }

  return null;
}

function diff(text1, text2, cursor_pos) {
  // only pass fix_unicode=true at the top level, not when diff_main is
  // recursively invoked
  return diff_main(text1, text2, cursor_pos, true);
}

diff.INSERT = DIFF_INSERT;
diff.DELETE = DIFF_DELETE;
diff.EQUAL = DIFF_EQUAL;

var diff_1 = diff;

createCommonjsModule(function (module, exports) {
  /**
   * lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright jQuery Foundation and other contributors <https://jquery.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   */

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = "__lodash_hash_undefined__";

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /** `Object#toString` result references. */
  var argsTag = "[object Arguments]",
    arrayTag = "[object Array]",
    boolTag = "[object Boolean]",
    dateTag = "[object Date]",
    errorTag = "[object Error]",
    funcTag = "[object Function]",
    genTag = "[object GeneratorFunction]",
    mapTag = "[object Map]",
    numberTag = "[object Number]",
    objectTag = "[object Object]",
    promiseTag = "[object Promise]",
    regexpTag = "[object RegExp]",
    setTag = "[object Set]",
    stringTag = "[object String]",
    symbolTag = "[object Symbol]",
    weakMapTag = "[object WeakMap]";

  var arrayBufferTag = "[object ArrayBuffer]",
    dataViewTag = "[object DataView]",
    float32Tag = "[object Float32Array]",
    float64Tag = "[object Float64Array]",
    int8Tag = "[object Int8Array]",
    int16Tag = "[object Int16Array]",
    int32Tag = "[object Int32Array]",
    uint8Tag = "[object Uint8Array]",
    uint8ClampedTag = "[object Uint8ClampedArray]",
    uint16Tag = "[object Uint16Array]",
    uint32Tag = "[object Uint32Array]";

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag] =
    cloneableTags[arrayTag] =
    cloneableTags[arrayBufferTag] =
    cloneableTags[dataViewTag] =
    cloneableTags[boolTag] =
    cloneableTags[dateTag] =
    cloneableTags[float32Tag] =
    cloneableTags[float64Tag] =
    cloneableTags[int8Tag] =
    cloneableTags[int16Tag] =
    cloneableTags[int32Tag] =
    cloneableTags[mapTag] =
    cloneableTags[numberTag] =
    cloneableTags[objectTag] =
    cloneableTags[regexpTag] =
    cloneableTags[setTag] =
    cloneableTags[stringTag] =
    cloneableTags[symbolTag] =
    cloneableTags[uint8Tag] =
    cloneableTags[uint8ClampedTag] =
    cloneableTags[uint16Tag] =
    cloneableTags[uint32Tag] =
      true;
  cloneableTags[errorTag] =
    cloneableTags[funcTag] =
    cloneableTags[weakMapTag] =
      false;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal =
    typeof commonjsGlobal == "object" &&
    commonjsGlobal &&
    commonjsGlobal.Object === Object &&
    commonjsGlobal;

  /** Detect free variable `self`. */
  var freeSelf =
    typeof self == "object" && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function("return this")();

  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule =
    freeExports && "object" == "object" && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /**
   * Adds the key-value `pair` to `map`.
   *
   * @private
   * @param {Object} map The map to modify.
   * @param {Array} pair The key-value pair to add.
   * @returns {Object} Returns `map`.
   */
  function addMapEntry(map, pair) {
    // Don't return `map.set` because it's not chainable in IE 11.
    map.set(pair[0], pair[1]);
    return map;
  }

  /**
   * Adds `value` to `set`.
   *
   * @private
   * @param {Object} set The set to modify.
   * @param {*} value The value to add.
   * @returns {Object} Returns `set`.
   */
  function addSetEntry(set, value) {
    // Don't return `set.add` because it's not chainable in IE 11.
    set.add(value);
    return set;
  }

  /**
   * A specialized version of `_.forEach` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEach(array, iteratee) {
    var index = -1,
      length = array ? array.length : 0;

    while (++index < length) {
      if (iteratee(array[index], index, array) === false) {
        break;
      }
    }
    return array;
  }

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
      length = values.length,
      offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  /**
   * A specialized version of `_.reduce` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} [accumulator] The initial value.
   * @param {boolean} [initAccum] Specify using the first element of `array` as
   *  the initial value.
   * @returns {*} Returns the accumulated value.
   */
  function arrayReduce(array, iteratee, accumulator, initAccum) {
    var index = -1,
      length = array ? array.length : 0;

    if (initAccum && length) {
      accumulator = array[++index];
    }
    while (++index < length) {
      accumulator = iteratee(accumulator, array[index], index, array);
    }
    return accumulator;
  }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
      result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  /**
   * Checks if `value` is a host object in IE < 9.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
   */
  function isHostObject(value) {
    // Many host objects are `Object` objects that can coerce to strings
    // despite having improperly defined `toString` methods.
    var result = false;
    if (value != null && typeof value.toString != "function") {
      try {
        result = !!(value + "");
      } catch (e) {}
    }
    return result;
  }

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
      result = Array(map.size);

    map.forEach(function (value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function (arg) {
      return func(transform(arg));
    };
  }

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
      result = Array(set.size);

    set.forEach(function (value) {
      result[++index] = value;
    });
    return result;
  }

  /** Used for built-in method references. */
  var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = root["__core-js_shared__"];

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function () {
    var uid = /[^.]+$/.exec(
      (coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO) || ""
    );
    return uid ? "Symbol(src)_1." + uid : "";
  })();

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp(
    "^" +
      funcToString
        .call(hasOwnProperty)
        .replace(reRegExpChar, "\\$&")
        .replace(
          /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
          "$1.*?"
        ) +
      "$"
  );

  /** Built-in value references. */
  var Buffer = moduleExports ? root.Buffer : undefined,
    Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    getPrototype = overArg(Object.getPrototypeOf, Object),
    objectCreate = Object.create,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols = Object.getOwnPropertySymbols,
    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
    nativeKeys = overArg(Object.keys, Object);

  /* Built-in method references that are verified to be native. */
  var DataView = getNative(root, "DataView"),
    Map = getNative(root, "Map"),
    Promise = getNative(root, "Promise"),
    Set = getNative(root, "Set"),
    WeakMap = getNative(root, "WeakMap"),
    nativeCreate = getNative(Object, "create");

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
      length = entries ? entries.length : 0;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
  }

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    return this.has(key) && delete this.__data__[key];
  }

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : undefined;
  }

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate
      ? data[key] !== undefined
      : hasOwnProperty.call(data, key);
  }

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
    return this;
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = hashClear;
  Hash.prototype["delete"] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
      length = entries ? entries.length : 0;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
  }

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
      index = assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    return true;
  }

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
      index = assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
      index = assocIndexOf(data, key);

    if (index < 0) {
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype["delete"] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
      length = entries ? entries.length : 0;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.__data__ = {
      hash: new Hash(),
      map: new (Map || ListCache)(),
      string: new Hash(),
    };
  }

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    return getMapData(this, key)["delete"](key);
  }

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    getMapData(this, key).set(key, value);
    return this;
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype["delete"] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    this.__data__ = new ListCache(entries);
  }

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new ListCache();
  }

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    return this.__data__["delete"](key);
  }

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var cache = this.__data__;
    if (cache instanceof ListCache) {
      var pairs = cache.__data__;
      if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([key, value]);
        return this;
      }
      cache = this.__data__ = new MapCache(pairs);
    }
    cache.set(key, value);
    return this;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = stackClear;
  Stack.prototype["delete"] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
    // Safari 9 makes `arguments.length` enumerable in strict mode.
    var result =
      isArray(value) || isArguments(value)
        ? baseTimes(value.length, String)
        : [];

    var length = result.length,
      skipIndexes = !!length;

    for (var key in value) {
      if (
        (inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (key == "length" || isIndex(key, length)))
      ) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Assigns `value` to `key` of `object` if the existing value is not equivalent
   * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function assignValue(object, key, value) {
    var objValue = object[key];
    if (
      !(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))
    ) {
      object[key] = value;
    }
  }

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.assign` without support for multiple sources
   * or `customizer` functions.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @returns {Object} Returns `object`.
   */
  function baseAssign(object, source) {
    return object && copyObject(source, keys(source), object);
  }

  /**
   * The base implementation of `_.clone` and `_.cloneDeep` which tracks
   * traversed objects.
   *
   * @private
   * @param {*} value The value to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @param {boolean} [isFull] Specify a clone including symbols.
   * @param {Function} [customizer] The function to customize cloning.
   * @param {string} [key] The key of `value`.
   * @param {Object} [object] The parent object of `value`.
   * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
   * @returns {*} Returns the cloned value.
   */
  function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
    var result;
    if (customizer) {
      result = object
        ? customizer(value, key, object, stack)
        : customizer(value);
    }
    if (result !== undefined) {
      return result;
    }
    if (!isObject(value)) {
      return value;
    }
    var isArr = isArray(value);
    if (isArr) {
      result = initCloneArray(value);
      if (!isDeep) {
        return copyArray(value, result);
      }
    } else {
      var tag = getTag(value),
        isFunc = tag == funcTag || tag == genTag;

      if (isBuffer(value)) {
        return cloneBuffer(value, isDeep);
      }
      if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
        if (isHostObject(value)) {
          return object ? value : {};
        }
        result = initCloneObject(isFunc ? {} : value);
        if (!isDeep) {
          return copySymbols(value, baseAssign(result, value));
        }
      } else {
        if (!cloneableTags[tag]) {
          return object ? value : {};
        }
        result = initCloneByTag(value, tag, baseClone, isDeep);
      }
    }
    // Check for circular references and return its corresponding clone.
    stack || (stack = new Stack());
    var stacked = stack.get(value);
    if (stacked) {
      return stacked;
    }
    stack.set(value, result);

    if (!isArr) {
      var props = isFull ? getAllKeys(value) : keys(value);
    }
    arrayEach(props || value, function (subValue, key) {
      if (props) {
        key = subValue;
        subValue = value[key];
      }
      // Recursively populate clone (susceptible to call stack limits).
      assignValue(
        result,
        key,
        baseClone(subValue, isDeep, isFull, customizer, key, value, stack)
      );
    });
    return result;
  }

  /**
   * The base implementation of `_.create` without support for assigning
   * properties to the created object.
   *
   * @private
   * @param {Object} prototype The object to inherit from.
   * @returns {Object} Returns the new object.
   */
  function baseCreate(proto) {
    return isObject(proto) ? objectCreate(proto) : {};
  }

  /**
   * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
   * `keysFunc` and `symbolsFunc` to get the enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @param {Function} symbolsFunc The function to get the symbols of `object`.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
  }

  /**
   * The base implementation of `getTag`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    return objectToString.call(value);
  }

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern =
      isFunction(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != "constructor") {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Creates a clone of  `buffer`.
   *
   * @private
   * @param {Buffer} buffer The buffer to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Buffer} Returns the cloned buffer.
   */
  function cloneBuffer(buffer, isDeep) {
    if (isDeep) {
      return buffer.slice();
    }
    var result = new buffer.constructor(buffer.length);
    buffer.copy(result);
    return result;
  }

  /**
   * Creates a clone of `arrayBuffer`.
   *
   * @private
   * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
   * @returns {ArrayBuffer} Returns the cloned array buffer.
   */
  function cloneArrayBuffer(arrayBuffer) {
    var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new Uint8Array(result).set(new Uint8Array(arrayBuffer));
    return result;
  }

  /**
   * Creates a clone of `dataView`.
   *
   * @private
   * @param {Object} dataView The data view to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned data view.
   */
  function cloneDataView(dataView, isDeep) {
    var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
    return new dataView.constructor(
      buffer,
      dataView.byteOffset,
      dataView.byteLength
    );
  }

  /**
   * Creates a clone of `map`.
   *
   * @private
   * @param {Object} map The map to clone.
   * @param {Function} cloneFunc The function to clone values.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned map.
   */
  function cloneMap(map, isDeep, cloneFunc) {
    var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
    return arrayReduce(array, addMapEntry, new map.constructor());
  }

  /**
   * Creates a clone of `regexp`.
   *
   * @private
   * @param {Object} regexp The regexp to clone.
   * @returns {Object} Returns the cloned regexp.
   */
  function cloneRegExp(regexp) {
    var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
    result.lastIndex = regexp.lastIndex;
    return result;
  }

  /**
   * Creates a clone of `set`.
   *
   * @private
   * @param {Object} set The set to clone.
   * @param {Function} cloneFunc The function to clone values.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned set.
   */
  function cloneSet(set, isDeep, cloneFunc) {
    var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
    return arrayReduce(array, addSetEntry, new set.constructor());
  }

  /**
   * Creates a clone of the `symbol` object.
   *
   * @private
   * @param {Object} symbol The symbol object to clone.
   * @returns {Object} Returns the cloned symbol object.
   */
  function cloneSymbol(symbol) {
    return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
  }

  /**
   * Creates a clone of `typedArray`.
   *
   * @private
   * @param {Object} typedArray The typed array to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned typed array.
   */
  function cloneTypedArray(typedArray, isDeep) {
    var buffer = isDeep
      ? cloneArrayBuffer(typedArray.buffer)
      : typedArray.buffer;
    return new typedArray.constructor(
      buffer,
      typedArray.byteOffset,
      typedArray.length
    );
  }

  /**
   * Copies the values of `source` to `array`.
   *
   * @private
   * @param {Array} source The array to copy values from.
   * @param {Array} [array=[]] The array to copy values to.
   * @returns {Array} Returns `array`.
   */
  function copyArray(source, array) {
    var index = -1,
      length = source.length;

    array || (array = Array(length));
    while (++index < length) {
      array[index] = source[index];
    }
    return array;
  }

  /**
   * Copies properties of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy properties from.
   * @param {Array} props The property identifiers to copy.
   * @param {Object} [object={}] The object to copy properties to.
   * @param {Function} [customizer] The function to customize copied values.
   * @returns {Object} Returns `object`.
   */
  function copyObject(source, props, object, customizer) {
    object || (object = {});

    var index = -1,
      length = props.length;

    while (++index < length) {
      var key = props[index];

      var newValue = customizer
        ? customizer(object[key], source[key], key, object, source)
        : undefined;

      assignValue(object, key, newValue === undefined ? source[key] : newValue);
    }
    return object;
  }

  /**
   * Copies own symbol properties of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy symbols from.
   * @param {Object} [object={}] The object to copy symbols to.
   * @returns {Object} Returns `object`.
   */
  function copySymbols(source, object) {
    return copyObject(source, getSymbols(source), object);
  }

  /**
   * Creates an array of own enumerable property names and symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeys(object) {
    return baseGetAllKeys(object, keys, getSymbols);
  }

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key)
      ? data[typeof key == "string" ? "string" : "hash"]
      : data.map;
  }

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : undefined;
  }

  /**
   * Creates an array of the own enumerable symbol properties of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbols = nativeGetSymbols
    ? overArg(nativeGetSymbols, Object)
    : stubArray;

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11,
  // for data views in Edge < 14, and promises in Node.js.
  if (
    (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map()) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set()) != setTag) ||
    (WeakMap && getTag(new WeakMap()) != weakMapTag)
  ) {
    getTag = function (value) {
      var result = objectToString.call(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : undefined;

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }

  /**
   * Initializes an array clone.
   *
   * @private
   * @param {Array} array The array to clone.
   * @returns {Array} Returns the initialized clone.
   */
  function initCloneArray(array) {
    var length = array.length,
      result = array.constructor(length);

    // Add properties assigned by `RegExp#exec`.
    if (
      length &&
      typeof array[0] == "string" &&
      hasOwnProperty.call(array, "index")
    ) {
      result.index = array.index;
      result.input = array.input;
    }
    return result;
  }

  /**
   * Initializes an object clone.
   *
   * @private
   * @param {Object} object The object to clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneObject(object) {
    return typeof object.constructor == "function" && !isPrototype(object)
      ? baseCreate(getPrototype(object))
      : {};
  }

  /**
   * Initializes an object clone based on its `toStringTag`.
   *
   * **Note:** This function only supports cloning values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to clone.
   * @param {string} tag The `toStringTag` of the object to clone.
   * @param {Function} cloneFunc The function to clone values.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneByTag(object, tag, cloneFunc, isDeep) {
    var Ctor = object.constructor;
    switch (tag) {
      case arrayBufferTag:
        return cloneArrayBuffer(object);

      case boolTag:
      case dateTag:
        return new Ctor(+object);

      case dataViewTag:
        return cloneDataView(object, isDeep);

      case float32Tag:
      case float64Tag:
      case int8Tag:
      case int16Tag:
      case int32Tag:
      case uint8Tag:
      case uint8ClampedTag:
      case uint16Tag:
      case uint32Tag:
        return cloneTypedArray(object, isDeep);

      case mapTag:
        return cloneMap(object, isDeep, cloneFunc);

      case numberTag:
      case stringTag:
        return new Ctor(object);

      case regexpTag:
        return cloneRegExp(object);

      case setTag:
        return cloneSet(object, isDeep, cloneFunc);

      case symbolTag:
        return cloneSymbol(object);
    }
  }

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER : length;
    return (
      !!length &&
      (typeof value == "number" || reIsUint.test(value)) &&
      value > -1 &&
      value % 1 == 0 &&
      value < length
    );
  }

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value;
    return type == "string" ||
      type == "number" ||
      type == "symbol" ||
      type == "boolean"
      ? value !== "__proto__"
      : value === null;
  }

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
      proto = (typeof Ctor == "function" && Ctor.prototype) || objectProto;

    return value === proto;
  }

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to process.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return func + "";
      } catch (e) {}
    }
    return "";
  }

  /**
   * This method is like `_.clone` except that it recursively clones `value`.
   *
   * @static
   * @memberOf _
   * @since 1.0.0
   * @category Lang
   * @param {*} value The value to recursively clone.
   * @returns {*} Returns the deep cloned value.
   * @see _.clone
   * @example
   *
   * var objects = [{ 'a': 1 }, { 'b': 2 }];
   *
   * var deep = _.cloneDeep(objects);
   * console.log(deep[0] === objects[0]);
   * // => false
   */
  function cloneDeep(value) {
    return baseClone(value, true, true);
  }

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  function isArguments(value) {
    // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
    return (
      isArrayLikeObject(value) &&
      hasOwnProperty.call(value, "callee") &&
      (!propertyIsEnumerable.call(value, "callee") ||
        objectToString.call(value) == argsTag)
    );
  }

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }

  /**
   * This method is like `_.isArrayLike` except that it also checks if `value`
   * is an object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array-like object,
   *  else `false`.
   * @example
   *
   * _.isArrayLikeObject([1, 2, 3]);
   * // => true
   *
   * _.isArrayLikeObject(document.body.children);
   * // => true
   *
   * _.isArrayLikeObject('abc');
   * // => false
   *
   * _.isArrayLikeObject(_.noop);
   * // => false
   */
  function isArrayLikeObject(value) {
    return isObjectLike(value) && isArrayLike(value);
  }

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse;

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 8-9 which returns 'object' for typed array and other constructors.
    var tag = isObject(value) ? objectToString.call(value) : "";
    return tag == funcTag || tag == genTag;
  }

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return (
      typeof value == "number" &&
      value > -1 &&
      value % 1 == 0 &&
      value <= MAX_SAFE_INTEGER
    );
  }

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return !!value && (type == "object" || type == "function");
  }

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return !!value && typeof value == "object";
  }

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }

  /**
   * This method returns a new empty array.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {Array} Returns the new empty array.
   * @example
   *
   * var arrays = _.times(2, _.stubArray);
   *
   * console.log(arrays);
   * // => [[], []]
   *
   * console.log(arrays[0] === arrays[1]);
   * // => false
   */
  function stubArray() {
    return [];
  }

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  module.exports = cloneDeep;
});

createCommonjsModule(function (module, exports) {
  /**
   * Lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright JS Foundation and other contributors <https://js.foundation/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   */

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = "__lodash_hash_undefined__";

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /** `Object#toString` result references. */
  var argsTag = "[object Arguments]",
    arrayTag = "[object Array]",
    asyncTag = "[object AsyncFunction]",
    boolTag = "[object Boolean]",
    dateTag = "[object Date]",
    errorTag = "[object Error]",
    funcTag = "[object Function]",
    genTag = "[object GeneratorFunction]",
    mapTag = "[object Map]",
    numberTag = "[object Number]",
    nullTag = "[object Null]",
    objectTag = "[object Object]",
    promiseTag = "[object Promise]",
    proxyTag = "[object Proxy]",
    regexpTag = "[object RegExp]",
    setTag = "[object Set]",
    stringTag = "[object String]",
    symbolTag = "[object Symbol]",
    undefinedTag = "[object Undefined]",
    weakMapTag = "[object WeakMap]";

  var arrayBufferTag = "[object ArrayBuffer]",
    dataViewTag = "[object DataView]",
    float32Tag = "[object Float32Array]",
    float64Tag = "[object Float64Array]",
    int8Tag = "[object Int8Array]",
    int16Tag = "[object Int16Array]",
    int32Tag = "[object Int32Array]",
    uint8Tag = "[object Uint8Array]",
    uint8ClampedTag = "[object Uint8ClampedArray]",
    uint16Tag = "[object Uint16Array]",
    uint32Tag = "[object Uint32Array]";

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] =
    typedArrayTags[float64Tag] =
    typedArrayTags[int8Tag] =
    typedArrayTags[int16Tag] =
    typedArrayTags[int32Tag] =
    typedArrayTags[uint8Tag] =
    typedArrayTags[uint8ClampedTag] =
    typedArrayTags[uint16Tag] =
    typedArrayTags[uint32Tag] =
      true;
  typedArrayTags[argsTag] =
    typedArrayTags[arrayTag] =
    typedArrayTags[arrayBufferTag] =
    typedArrayTags[boolTag] =
    typedArrayTags[dataViewTag] =
    typedArrayTags[dateTag] =
    typedArrayTags[errorTag] =
    typedArrayTags[funcTag] =
    typedArrayTags[mapTag] =
    typedArrayTags[numberTag] =
    typedArrayTags[objectTag] =
    typedArrayTags[regexpTag] =
    typedArrayTags[setTag] =
    typedArrayTags[stringTag] =
    typedArrayTags[weakMapTag] =
      false;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal =
    typeof commonjsGlobal == "object" &&
    commonjsGlobal &&
    commonjsGlobal.Object === Object &&
    commonjsGlobal;

  /** Detect free variable `self`. */
  var freeSelf =
    typeof self == "object" && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function("return this")();

  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule =
    freeExports && "object" == "object" && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function () {
    try {
      return freeProcess && freeProcess.binding && freeProcess.binding("util");
    } catch (e) {}
  })();

  /* Node.js helper references. */
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

  /**
   * A specialized version of `_.filter` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {Array} Returns the new filtered array.
   */
  function arrayFilter(array, predicate) {
    var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
      length = values.length,
      offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
      length = array == null ? 0 : array.length;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
      result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function (value) {
      return func(value);
    };
  }

  /**
   * Checks if a `cache` value for `key` exists.
   *
   * @private
   * @param {Object} cache The cache to query.
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function cacheHas(cache, key) {
    return cache.has(key);
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
      result = Array(map.size);

    map.forEach(function (value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function (arg) {
      return func(transform(arg));
    };
  }

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
      result = Array(set.size);

    set.forEach(function (value) {
      result[++index] = value;
    });
    return result;
  }

  /** Used for built-in method references. */
  var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = root["__core-js_shared__"];

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function () {
    var uid = /[^.]+$/.exec(
      (coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO) || ""
    );
    return uid ? "Symbol(src)_1." + uid : "";
  })();

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto.toString;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp(
    "^" +
      funcToString
        .call(hasOwnProperty)
        .replace(reRegExpChar, "\\$&")
        .replace(
          /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
          "$1.*?"
        ) +
      "$"
  );

  /** Built-in value references. */
  var Buffer = moduleExports ? root.Buffer : undefined,
    Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice,
    symToStringTag = Symbol ? Symbol.toStringTag : undefined;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols = Object.getOwnPropertySymbols,
    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
    nativeKeys = overArg(Object.keys, Object);

  /* Built-in method references that are verified to be native. */
  var DataView = getNative(root, "DataView"),
    Map = getNative(root, "Map"),
    Promise = getNative(root, "Promise"),
    Set = getNative(root, "Set"),
    WeakMap = getNative(root, "WeakMap"),
    nativeCreate = getNative(Object, "create");

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
      length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
    this.size = 0;
  }

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : undefined;
  }

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate
      ? data[key] !== undefined
      : hasOwnProperty.call(data, key);
  }

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
    return this;
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = hashClear;
  Hash.prototype["delete"] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
      length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
      index = assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
      index = assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
      index = assocIndexOf(data, key);

    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype["delete"] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
      length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      hash: new Hash(),
      map: new (Map || ListCache)(),
      string: new Hash(),
    };
  }

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = getMapData(this, key)["delete"](key);
    this.size -= result ? 1 : 0;
    return result;
  }

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = getMapData(this, key),
      size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype["delete"] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;

  /**
   *
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
  function SetCache(values) {
    var index = -1,
      length = values == null ? 0 : values.length;

    this.__data__ = new MapCache();
    while (++index < length) {
      this.add(values[index]);
    }
  }

  /**
   * Adds `value` to the array cache.
   *
   * @private
   * @name add
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }

  /**
   * Checks if `value` is in the array cache.
   *
   * @private
   * @name has
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {number} Returns `true` if `value` is found, else `false`.
   */
  function setCacheHas(value) {
    return this.__data__.has(value);
  }

  // Add methods to `SetCache`.
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
  SetCache.prototype.has = setCacheHas;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    var data = (this.__data__ = new ListCache(entries));
    this.size = data.size;
  }

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new ListCache();
    this.size = 0;
  }

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    var data = this.__data__,
      result = data["delete"](key);

    this.size = data.size;
    return result;
  }

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache) {
      var pairs = data.__data__;
      if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new MapCache(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = stackClear;
  Stack.prototype["delete"] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

    for (var key in value) {
      if (
        (inherited || hasOwnProperty.call(value, key)) &&
        !(
          skipIndexes &&
          // Safari 9 has enumerable `arguments.length` in strict mode.
          (key == "length" ||
            // Node.js 0.10 has enumerable non-index properties on buffers.
            (isBuff && (key == "offset" || key == "parent")) ||
            // PhantomJS 2 has enumerable non-index properties on typed arrays.
            (isType &&
              (key == "buffer" ||
                key == "byteLength" ||
                key == "byteOffset")) ||
            // Skip index properties.
            isIndex(key, length))
        )
      ) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
   * `keysFunc` and `symbolsFunc` to get the enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @param {Function} symbolsFunc The function to get the symbols of `object`.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
  }

  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value)
      ? getRawTag(value)
      : objectToString(value);
  }

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike(value) && baseGetTag(value) == argsTag;
  }

  /**
   * The base implementation of `_.isEqual` which supports partial comparisons
   * and tracks traversed objects.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @param {boolean} bitmask The bitmask flags.
   *  1 - Unordered comparison
   *  2 - Partial comparison
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {Object} [stack] Tracks traversed `value` and `other` objects.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   */
  function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true;
    }
    if (
      value == null ||
      other == null ||
      (!isObjectLike(value) && !isObjectLike(other))
    ) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(
      value,
      other,
      bitmask,
      customizer,
      baseIsEqual,
      stack
    );
  }

  /**
   * A specialized version of `baseIsEqual` for arrays and objects which performs
   * deep comparisons and tracks traversed objects enabling objects with circular
   * references to be compared.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} [stack] Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function baseIsEqualDeep(
    object,
    other,
    bitmask,
    customizer,
    equalFunc,
    stack
  ) {
    var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag : getTag(object),
      othTag = othIsArr ? arrayTag : getTag(other);

    objTag = objTag == argsTag ? objectTag : objTag;
    othTag = othTag == argsTag ? objectTag : othTag;

    var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

    if (isSameTag && isBuffer(object)) {
      if (!isBuffer(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack());
      return objIsArr || isTypedArray(object)
        ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
        : equalByTag(
            object,
            other,
            objTag,
            bitmask,
            customizer,
            equalFunc,
            stack
          );
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");

      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

        stack || (stack = new Stack());
        return equalFunc(
          objUnwrapped,
          othUnwrapped,
          bitmask,
          customizer,
          stack
        );
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new Stack());
    return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
  }

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return (
      isObjectLike(value) &&
      isLength(value.length) &&
      !!typedArrayTags[baseGetTag(value)]
    );
  }

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != "constructor") {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for arrays with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Array} array The array to compare.
   * @param {Array} other The other array to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `array` and `other` objects.
   * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
   */
  function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var index = -1,
      result = true,
      seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
      var arrValue = array[index],
        othValue = other[index];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, arrValue, index, other, array, stack)
          : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== undefined) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      // Recursively compare arrays (susceptible to call stack limits).
      if (seen) {
        if (
          !arraySome(other, function (othValue, othIndex) {
            if (
              !cacheHas(seen, othIndex) &&
              (arrValue === othValue ||
                equalFunc(arrValue, othValue, bitmask, customizer, stack))
            ) {
              return seen.push(othIndex);
            }
          })
        ) {
          result = false;
          break;
        }
      } else if (
        !(
          arrValue === othValue ||
          equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )
      ) {
        result = false;
        break;
      }
    }
    stack["delete"](array);
    stack["delete"](other);
    return result;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for comparing objects of
   * the same `toStringTag`.
   *
   * **Note:** This function only supports comparing values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {string} tag The `toStringTag` of the objects to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalByTag(
    object,
    other,
    tag,
    bitmask,
    customizer,
    equalFunc,
    stack
  ) {
    switch (tag) {
      case dataViewTag:
        if (
          object.byteLength != other.byteLength ||
          object.byteOffset != other.byteOffset
        ) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;

      case arrayBufferTag:
        if (
          object.byteLength != other.byteLength ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))
        ) {
          return false;
        }
        return true;

      case boolTag:
      case dateTag:
      case numberTag:
        // Coerce booleans to `1` or `0` and dates to milliseconds.
        // Invalid dates are coerced to `NaN`.
        return eq(+object, +other);

      case errorTag:
        return object.name == other.name && object.message == other.message;

      case regexpTag:
      case stringTag:
        // Coerce regexes to strings and treat strings, primitives and objects,
        // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
        // for more details.
        return object == other + "";

      case mapTag:
        var convert = mapToArray;

      case setTag:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
        convert || (convert = setToArray);

        if (object.size != other.size && !isPartial) {
          return false;
        }
        // Assume cyclic values are equal.
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= COMPARE_UNORDERED_FLAG;

        // Recursively compare objects (susceptible to call stack limits).
        stack.set(object, other);
        var result = equalArrays(
          convert(object),
          convert(other),
          bitmask,
          customizer,
          equalFunc,
          stack
        );
        stack["delete"](object);
        return result;

      case symbolTag:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for objects with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
        return false;
      }
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);

    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key],
        othValue = other[key];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, objValue, key, other, object, stack)
          : customizer(objValue, othValue, key, object, other, stack);
      }
      // Recursively compare objects (susceptible to call stack limits).
      if (
        !(compared === undefined
          ? objValue === othValue ||
            equalFunc(objValue, othValue, bitmask, customizer, stack)
          : compared)
      ) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == "constructor");
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor,
        othCtor = other.constructor;

      // Non `Object` object instances with different constructors are not equal.
      if (
        objCtor != othCtor &&
        "constructor" in object &&
        "constructor" in other &&
        !(
          typeof objCtor == "function" &&
          objCtor instanceof objCtor &&
          typeof othCtor == "function" &&
          othCtor instanceof othCtor
        )
      ) {
        result = false;
      }
    }
    stack["delete"](object);
    stack["delete"](other);
    return result;
  }

  /**
   * Creates an array of own enumerable property names and symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeys(object) {
    return baseGetAllKeys(object, keys, getSymbols);
  }

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key)
      ? data[typeof key == "string" ? "string" : "hash"]
      : data.map;
  }

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : undefined;
  }

  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

    try {
      value[symToStringTag] = undefined;
      var unmasked = true;
    } catch (e) {}

    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }

  /**
   * Creates an array of the own enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbols = !nativeGetSymbols
    ? stubArray
    : function (object) {
        if (object == null) {
          return [];
        }
        object = Object(object);
        return arrayFilter(nativeGetSymbols(object), function (symbol) {
          return propertyIsEnumerable.call(object, symbol);
        });
      };

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
  if (
    (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map()) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set()) != setTag) ||
    (WeakMap && getTag(new WeakMap()) != weakMapTag)
  ) {
    getTag = function (value) {
      var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : "";

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER : length;
    return (
      !!length &&
      (typeof value == "number" || reIsUint.test(value)) &&
      value > -1 &&
      value % 1 == 0 &&
      value < length
    );
  }

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value;
    return type == "string" ||
      type == "number" ||
      type == "symbol" ||
      type == "boolean"
      ? value !== "__proto__"
      : value === null;
  }

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
      proto = (typeof Ctor == "function" && Ctor.prototype) || objectProto;

    return value === proto;
  }

  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString(value) {
    return nativeObjectToString.call(value);
  }

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return func + "";
      } catch (e) {}
    }
    return "";
  }

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = baseIsArguments(
    (function () {
      return arguments;
    })()
  )
    ? baseIsArguments
    : function (value) {
        return (
          isObjectLike(value) &&
          hasOwnProperty.call(value, "callee") &&
          !propertyIsEnumerable.call(value, "callee")
        );
      };

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse;

  /**
   * Performs a deep comparison between two values to determine if they are
   * equivalent.
   *
   * **Note:** This method supports comparing arrays, array buffers, booleans,
   * date objects, error objects, maps, numbers, `Object` objects, regexes,
   * sets, strings, symbols, and typed arrays. `Object` objects are compared
   * by their own, not inherited, enumerable properties. Functions and DOM
   * nodes are compared by strict equality, i.e. `===`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.isEqual(object, other);
   * // => true
   *
   * object === other;
   * // => false
   */
  function isEqual(value, other) {
    return baseIsEqual(value, other);
  }

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject(value)) {
      return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = baseGetTag(value);
    return (
      tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag
    );
  }

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return (
      typeof value == "number" &&
      value > -1 &&
      value % 1 == 0 &&
      value <= MAX_SAFE_INTEGER
    );
  }

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == "object" || type == "function");
  }

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray
    ? baseUnary(nodeIsTypedArray)
    : baseIsTypedArray;

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }

  /**
   * This method returns a new empty array.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {Array} Returns the new empty array.
   * @example
   *
   * var arrays = _.times(2, _.stubArray);
   *
   * console.log(arrays);
   * // => [[], []]
   *
   * console.log(arrays[0] === arrays[1]);
   * // => false
   */
  function stubArray() {
    return [];
  }

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  module.exports = isEqual;
});

var C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_lodash_clonedeep =
  createCommonjsModule(function (module, exports) {
    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE = 200;

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = "__lodash_hash_undefined__";

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /** `Object#toString` result references. */
    var argsTag = "[object Arguments]",
      arrayTag = "[object Array]",
      boolTag = "[object Boolean]",
      dateTag = "[object Date]",
      errorTag = "[object Error]",
      funcTag = "[object Function]",
      genTag = "[object GeneratorFunction]",
      mapTag = "[object Map]",
      numberTag = "[object Number]",
      objectTag = "[object Object]",
      promiseTag = "[object Promise]",
      regexpTag = "[object RegExp]",
      setTag = "[object Set]",
      stringTag = "[object String]",
      symbolTag = "[object Symbol]",
      weakMapTag = "[object WeakMap]";

    var arrayBufferTag = "[object ArrayBuffer]",
      dataViewTag = "[object DataView]",
      float32Tag = "[object Float32Array]",
      float64Tag = "[object Float64Array]",
      int8Tag = "[object Int8Array]",
      int16Tag = "[object Int16Array]",
      int32Tag = "[object Int32Array]",
      uint8Tag = "[object Uint8Array]",
      uint8ClampedTag = "[object Uint8ClampedArray]",
      uint16Tag = "[object Uint16Array]",
      uint32Tag = "[object Uint32Array]";

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to match `RegExp` flags from their coerced string values. */
    var reFlags = /\w*$/;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /** Used to identify `toStringTag` values supported by `_.clone`. */
    var cloneableTags = {};
    cloneableTags[argsTag] =
      cloneableTags[arrayTag] =
      cloneableTags[arrayBufferTag] =
      cloneableTags[dataViewTag] =
      cloneableTags[boolTag] =
      cloneableTags[dateTag] =
      cloneableTags[float32Tag] =
      cloneableTags[float64Tag] =
      cloneableTags[int8Tag] =
      cloneableTags[int16Tag] =
      cloneableTags[int32Tag] =
      cloneableTags[mapTag] =
      cloneableTags[numberTag] =
      cloneableTags[objectTag] =
      cloneableTags[regexpTag] =
      cloneableTags[setTag] =
      cloneableTags[stringTag] =
      cloneableTags[symbolTag] =
      cloneableTags[uint8Tag] =
      cloneableTags[uint8ClampedTag] =
      cloneableTags[uint16Tag] =
      cloneableTags[uint32Tag] =
        true;
    cloneableTags[errorTag] =
      cloneableTags[funcTag] =
      cloneableTags[weakMapTag] =
        false;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal =
      typeof commonjsGlobal == "object" &&
      commonjsGlobal &&
      commonjsGlobal.Object === Object &&
      commonjsGlobal;

    /** Detect free variable `self`. */
    var freeSelf =
      typeof self == "object" && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function("return this")();

    /** Detect free variable `exports`. */
    var freeExports = exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule =
      freeExports &&
      "object" == "object" &&
      module &&
      !module.nodeType &&
      module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports = freeModule && freeModule.exports === freeExports;

    /**
     * Adds the key-value `pair` to `map`.
     *
     * @private
     * @param {Object} map The map to modify.
     * @param {Array} pair The key-value pair to add.
     * @returns {Object} Returns `map`.
     */
    function addMapEntry(map, pair) {
      // Don't return `map.set` because it's not chainable in IE 11.
      map.set(pair[0], pair[1]);
      return map;
    }

    /**
     * Adds `value` to `set`.
     *
     * @private
     * @param {Object} set The set to modify.
     * @param {*} value The value to add.
     * @returns {Object} Returns `set`.
     */
    function addSetEntry(set, value) {
      // Don't return `set.add` because it's not chainable in IE 11.
      set.add(value);
      return set;
    }

    /**
     * A specialized version of `_.forEach` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
        length = array ? array.length : 0;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * Appends the elements of `values` to `array`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to append.
     * @returns {Array} Returns `array`.
     */
    function arrayPush(array, values) {
      var index = -1,
        length = values.length,
        offset = array.length;

      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.reduce` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {boolean} [initAccum] Specify using the first element of `array` as
     *  the initial value.
     * @returns {*} Returns the accumulated value.
     */
    function arrayReduce(array, iteratee, accumulator, initAccum) {
      var index = -1,
        length = array ? array.length : 0;

      if (initAccum && length) {
        accumulator = array[++index];
      }
      while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
      }
      return accumulator;
    }

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes(n, iteratee) {
      var index = -1,
        result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    /**
     * Checks if `value` is a host object in IE < 9.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
     */
    function isHostObject(value) {
      // Many host objects are `Object` objects that can coerce to strings
      // despite having improperly defined `toString` methods.
      var result = false;
      if (value != null && typeof value.toString != "function") {
        try {
          result = !!(value + "");
        } catch (e) {}
      }
      return result;
    }

    /**
     * Converts `map` to its key-value pairs.
     *
     * @private
     * @param {Object} map The map to convert.
     * @returns {Array} Returns the key-value pairs.
     */
    function mapToArray(map) {
      var index = -1,
        result = Array(map.size);

      map.forEach(function (value, key) {
        result[++index] = [key, value];
      });
      return result;
    }

    /**
     * Creates a unary function that invokes `func` with its argument transformed.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {Function} transform The argument transform.
     * @returns {Function} Returns the new function.
     */
    function overArg(func, transform) {
      return function (arg) {
        return func(transform(arg));
      };
    }

    /**
     * Converts `set` to an array of its values.
     *
     * @private
     * @param {Object} set The set to convert.
     * @returns {Array} Returns the values.
     */
    function setToArray(set) {
      var index = -1,
        result = Array(set.size);

      set.forEach(function (value) {
        result[++index] = value;
      });
      return result;
    }

    /** Used for built-in method references. */
    var arrayProto = Array.prototype,
      funcProto = Function.prototype,
      objectProto = Object.prototype;

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root["__core-js_shared__"];

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function () {
      var uid = /[^.]+$/.exec(
        (coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO) || ""
      );
      return uid ? "Symbol(src)_1." + uid : "";
    })();

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp(
      "^" +
        funcToString
          .call(hasOwnProperty)
          .replace(reRegExpChar, "\\$&")
          .replace(
            /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
            "$1.*?"
          ) +
        "$"
    );

    /** Built-in value references. */
    var Buffer = moduleExports ? root.Buffer : undefined,
      Symbol = root.Symbol,
      Uint8Array = root.Uint8Array,
      getPrototype = overArg(Object.getPrototypeOf, Object),
      objectCreate = Object.create,
      propertyIsEnumerable = objectProto.propertyIsEnumerable,
      splice = arrayProto.splice;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetSymbols = Object.getOwnPropertySymbols,
      nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
      nativeKeys = overArg(Object.keys, Object);

    /* Built-in method references that are verified to be native. */
    var DataView = getNative(root, "DataView"),
      Map = getNative(root, "Map"),
      Promise = getNative(root, "Promise"),
      Set = getNative(root, "Set"),
      WeakMap = getNative(root, "WeakMap"),
      nativeCreate = getNative(Object, "create");

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = toSource(DataView),
      mapCtorString = toSource(Map),
      promiseCtorString = toSource(Promise),
      setCtorString = toSource(Set),
      weakMapCtorString = toSource(WeakMap);

    /** Used to convert symbols to primitives and strings. */
    var symbolProto = Symbol ? Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
        length = entries ? entries.length : 0;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      return this.has(key) && delete this.__data__[key];
    }

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : undefined;
    }

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate
        ? data[key] !== undefined
        : hasOwnProperty.call(data, key);
    }

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
      return this;
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
        length = entries ? entries.length : 0;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
    }

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
        index = assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      return true;
    }

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
        index = assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
        index = assocIndexOf(data, key);

      if (index < 0) {
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
        length = entries ? entries.length : 0;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.__data__ = {
        hash: new Hash(),
        map: new (Map || ListCache)(),
        string: new Hash(),
      };
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      return getMapData(this, key)["delete"](key);
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      getMapData(this, key).set(key, value);
      return this;
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Stack(entries) {
      this.__data__ = new ListCache(entries);
    }

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = new ListCache();
    }

    /**
     * Removes `key` and its value from the stack.
     *
     * @private
     * @name delete
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function stackDelete(key) {
      return this.__data__["delete"](key);
    }

    /**
     * Gets the stack value for `key`.
     *
     * @private
     * @name get
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function stackGet(key) {
      return this.__data__.get(key);
    }

    /**
     * Checks if a stack value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function stackHas(key) {
      return this.__data__.has(key);
    }

    /**
     * Sets the stack `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    function stackSet(key, value) {
      var cache = this.__data__;
      if (cache instanceof ListCache) {
        var pairs = cache.__data__;
        if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
          pairs.push([key, value]);
          return this;
        }
        cache = this.__data__ = new MapCache(pairs);
      }
      cache.set(key, value);
      return this;
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
      // Safari 9 makes `arguments.length` enumerable in strict mode.
      var result =
        isArray(value) || isArguments(value)
          ? baseTimes(value.length, String)
          : [];

      var length = result.length,
        skipIndexes = !!length;

      for (var key in value) {
        if (
          (inherited || hasOwnProperty.call(value, key)) &&
          !(skipIndexes && (key == "length" || isIndex(key, length)))
        ) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Assigns `value` to `key` of `object` if the existing value is not equivalent
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (
        !(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
        (value === undefined && !(key in object))
      ) {
        object[key] = value;
      }
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.assign` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssign(object, source) {
      return object && copyObject(source, keys(source), object);
    }

    /**
     * The base implementation of `_.clone` and `_.cloneDeep` which tracks
     * traversed objects.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @param {boolean} [isFull] Specify a clone including symbols.
     * @param {Function} [customizer] The function to customize cloning.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The parent object of `value`.
     * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
      var result;
      if (customizer) {
        result = object
          ? customizer(value, key, object, stack)
          : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return copyArray(value, result);
        }
      } else {
        var tag = getTag(value),
          isFunc = tag == funcTag || tag == genTag;

        if (isBuffer(value)) {
          return cloneBuffer(value, isDeep);
        }
        if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
          if (isHostObject(value)) {
            return object ? value : {};
          }
          result = initCloneObject(isFunc ? {} : value);
          if (!isDeep) {
            return copySymbols(value, baseAssign(result, value));
          }
        } else {
          if (!cloneableTags[tag]) {
            return object ? value : {};
          }
          result = initCloneByTag(value, tag, baseClone, isDeep);
        }
      }
      // Check for circular references and return its corresponding clone.
      stack || (stack = new Stack());
      var stacked = stack.get(value);
      if (stacked) {
        return stacked;
      }
      stack.set(value, result);

      if (!isArr) {
        var props = isFull ? getAllKeys(value) : keys(value);
      }
      arrayEach(props || value, function (subValue, key) {
        if (props) {
          key = subValue;
          subValue = value[key];
        }
        // Recursively populate clone (susceptible to call stack limits).
        assignValue(
          result,
          key,
          baseClone(subValue, isDeep, isFull, customizer, key, value, stack)
        );
      });
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(proto) {
      return isObject(proto) ? objectCreate(proto) : {};
    }

    /**
     * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
     * `keysFunc` and `symbolsFunc` to get the enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @param {Function} symbolsFunc The function to get the symbols of `object`.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }

    /**
     * The base implementation of `getTag`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      return objectToString.call(value);
    }

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern =
        isFunction(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Creates a clone of  `buffer`.
     *
     * @private
     * @param {Buffer} buffer The buffer to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Buffer} Returns the cloned buffer.
     */
    function cloneBuffer(buffer, isDeep) {
      if (isDeep) {
        return buffer.slice();
      }
      var result = new buffer.constructor(buffer.length);
      buffer.copy(result);
      return result;
    }

    /**
     * Creates a clone of `arrayBuffer`.
     *
     * @private
     * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new Uint8Array(result).set(new Uint8Array(arrayBuffer));
      return result;
    }

    /**
     * Creates a clone of `dataView`.
     *
     * @private
     * @param {Object} dataView The data view to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned data view.
     */
    function cloneDataView(dataView, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
      return new dataView.constructor(
        buffer,
        dataView.byteOffset,
        dataView.byteLength
      );
    }

    /**
     * Creates a clone of `map`.
     *
     * @private
     * @param {Object} map The map to clone.
     * @param {Function} cloneFunc The function to clone values.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned map.
     */
    function cloneMap(map, isDeep, cloneFunc) {
      var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
      return arrayReduce(array, addMapEntry, new map.constructor());
    }

    /**
     * Creates a clone of `regexp`.
     *
     * @private
     * @param {Object} regexp The regexp to clone.
     * @returns {Object} Returns the cloned regexp.
     */
    function cloneRegExp(regexp) {
      var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
      result.lastIndex = regexp.lastIndex;
      return result;
    }

    /**
     * Creates a clone of `set`.
     *
     * @private
     * @param {Object} set The set to clone.
     * @param {Function} cloneFunc The function to clone values.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned set.
     */
    function cloneSet(set, isDeep, cloneFunc) {
      var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
      return arrayReduce(array, addSetEntry, new set.constructor());
    }

    /**
     * Creates a clone of the `symbol` object.
     *
     * @private
     * @param {Object} symbol The symbol object to clone.
     * @returns {Object} Returns the cloned symbol object.
     */
    function cloneSymbol(symbol) {
      return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
    }

    /**
     * Creates a clone of `typedArray`.
     *
     * @private
     * @param {Object} typedArray The typed array to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned typed array.
     */
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = isDeep
        ? cloneArrayBuffer(typedArray.buffer)
        : typedArray.buffer;
      return new typedArray.constructor(
        buffer,
        typedArray.byteOffset,
        typedArray.length
      );
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
        length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property identifiers to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @param {Function} [customizer] The function to customize copied values.
     * @returns {Object} Returns `object`.
     */
    function copyObject(source, props, object, customizer) {
      object || (object = {});

      var index = -1,
        length = props.length;

      while (++index < length) {
        var key = props[index];

        var newValue = customizer
          ? customizer(object[key], source[key], key, object, source)
          : undefined;

        assignValue(
          object,
          key,
          newValue === undefined ? source[key] : newValue
        );
      }
      return object;
    }

    /**
     * Copies own symbol properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbols(source, object) {
      return copyObject(source, getSymbols(source), object);
    }

    /**
     * Creates an array of own enumerable property names and symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key)
        ? data[typeof key == "string" ? "string" : "hash"]
        : data.map;
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /**
     * Creates an array of the own enumerable symbol properties of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbols = nativeGetSymbols
      ? overArg(nativeGetSymbols, Object)
      : stubArray;

    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    var getTag = baseGetTag;

    // Fallback for data views, maps, sets, and weak maps in IE 11,
    // for data views in Edge < 14, and promises in Node.js.
    if (
      (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
      (Map && getTag(new Map()) != mapTag) ||
      (Promise && getTag(Promise.resolve()) != promiseTag) ||
      (Set && getTag(new Set()) != setTag) ||
      (WeakMap && getTag(new WeakMap()) != weakMapTag)
    ) {
      getTag = function (value) {
        var result = objectToString.call(value),
          Ctor = result == objectTag ? value.constructor : undefined,
          ctorString = Ctor ? toSource(Ctor) : undefined;

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString:
              return dataViewTag;
            case mapCtorString:
              return mapTag;
            case promiseCtorString:
              return promiseTag;
            case setCtorString:
              return setTag;
            case weakMapCtorString:
              return weakMapTag;
          }
        }
        return result;
      };
    }

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
        result = array.constructor(length);

      // Add properties assigned by `RegExp#exec`.
      if (
        length &&
        typeof array[0] == "string" &&
        hasOwnProperty.call(array, "index")
      ) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      return typeof object.constructor == "function" && !isPrototype(object)
        ? baseCreate(getPrototype(object))
        : {};
    }

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {Function} cloneFunc The function to clone values.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, cloneFunc, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag:
          return cloneArrayBuffer(object);

        case boolTag:
        case dateTag:
          return new Ctor(+object);

        case dataViewTag:
          return cloneDataView(object, isDeep);

        case float32Tag:
        case float64Tag:
        case int8Tag:
        case int16Tag:
        case int32Tag:
        case uint8Tag:
        case uint8ClampedTag:
        case uint16Tag:
        case uint32Tag:
          return cloneTypedArray(object, isDeep);

        case mapTag:
          return cloneMap(object, isDeep, cloneFunc);

        case numberTag:
        case stringTag:
          return new Ctor(object);

        case regexpTag:
          return cloneRegExp(object);

        case setTag:
          return cloneSet(object, isDeep, cloneFunc);

        case symbolTag:
          return cloneSymbol(object);
      }
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return (
        !!length &&
        (typeof value == "number" || reIsUint.test(value)) &&
        value > -1 &&
        value % 1 == 0 &&
        value < length
      );
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" ||
        type == "number" ||
        type == "symbol" ||
        type == "boolean"
        ? value !== "__proto__"
        : value === null;
    }

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
        proto = (typeof Ctor == "function" && Ctor.prototype) || objectProto;

      return value === proto;
    }

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to process.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {}
        try {
          return func + "";
        } catch (e) {}
      }
      return "";
    }

    /**
     * This method is like `_.clone` except that it recursively clones `value`.
     *
     * @static
     * @memberOf _
     * @since 1.0.0
     * @category Lang
     * @param {*} value The value to recursively clone.
     * @returns {*} Returns the deep cloned value.
     * @see _.clone
     * @example
     *
     * var objects = [{ 'a': 1 }, { 'b': 2 }];
     *
     * var deep = _.cloneDeep(objects);
     * console.log(deep[0] === objects[0]);
     * // => false
     */
    function cloneDeep(value) {
      return baseClone(value, true, true);
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
      return (
        isArrayLikeObject(value) &&
        hasOwnProperty.call(value, "callee") &&
        (!propertyIsEnumerable.call(value, "callee") ||
          objectToString.call(value) == argsTag)
      );
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }

    /**
     * Checks if `value` is a buffer.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
     * @example
     *
     * _.isBuffer(new Buffer(2));
     * // => true
     *
     * _.isBuffer(new Uint8Array(2));
     * // => false
     */
    var isBuffer = nativeIsBuffer || stubFalse;

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8-9 which returns 'object' for typed array and other constructors.
      var tag = isObject(value) ? objectToString.call(value) : "";
      return tag == funcTag || tag == genTag;
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return (
        typeof value == "number" &&
        value > -1 &&
        value % 1 == 0 &&
        value <= MAX_SAFE_INTEGER
      );
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }

    /**
     * This method returns a new empty array.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {Array} Returns the new empty array.
     * @example
     *
     * var arrays = _.times(2, _.stubArray);
     *
     * console.log(arrays);
     * // => [[], []]
     *
     * console.log(arrays[0] === arrays[1]);
     * // => false
     */
    function stubArray() {
      return [];
    }

    /**
     * This method returns `false`.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {boolean} Returns `false`.
     * @example
     *
     * _.times(2, _.stubFalse);
     * // => [false, false]
     */
    function stubFalse() {
      return false;
    }

    module.exports = cloneDeep;
  });

var C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_lodash_isequal =
  createCommonjsModule(function (module, exports) {
    /**
     * Lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright JS Foundation and other contributors <https://js.foundation/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE = 200;

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = "__lodash_hash_undefined__";

    /** Used to compose bitmasks for value comparisons. */
    var COMPARE_PARTIAL_FLAG = 1,
      COMPARE_UNORDERED_FLAG = 2;

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /** `Object#toString` result references. */
    var argsTag = "[object Arguments]",
      arrayTag = "[object Array]",
      asyncTag = "[object AsyncFunction]",
      boolTag = "[object Boolean]",
      dateTag = "[object Date]",
      errorTag = "[object Error]",
      funcTag = "[object Function]",
      genTag = "[object GeneratorFunction]",
      mapTag = "[object Map]",
      numberTag = "[object Number]",
      nullTag = "[object Null]",
      objectTag = "[object Object]",
      promiseTag = "[object Promise]",
      proxyTag = "[object Proxy]",
      regexpTag = "[object RegExp]",
      setTag = "[object Set]",
      stringTag = "[object String]",
      symbolTag = "[object Symbol]",
      undefinedTag = "[object Undefined]",
      weakMapTag = "[object WeakMap]";

    var arrayBufferTag = "[object ArrayBuffer]",
      dataViewTag = "[object DataView]",
      float32Tag = "[object Float32Array]",
      float64Tag = "[object Float64Array]",
      int8Tag = "[object Int8Array]",
      int16Tag = "[object Int16Array]",
      int32Tag = "[object Int32Array]",
      uint8Tag = "[object Uint8Array]",
      uint8ClampedTag = "[object Uint8ClampedArray]",
      uint16Tag = "[object Uint16Array]",
      uint32Tag = "[object Uint32Array]";

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /** Used to identify `toStringTag` values of typed arrays. */
    var typedArrayTags = {};
    typedArrayTags[float32Tag] =
      typedArrayTags[float64Tag] =
      typedArrayTags[int8Tag] =
      typedArrayTags[int16Tag] =
      typedArrayTags[int32Tag] =
      typedArrayTags[uint8Tag] =
      typedArrayTags[uint8ClampedTag] =
      typedArrayTags[uint16Tag] =
      typedArrayTags[uint32Tag] =
        true;
    typedArrayTags[argsTag] =
      typedArrayTags[arrayTag] =
      typedArrayTags[arrayBufferTag] =
      typedArrayTags[boolTag] =
      typedArrayTags[dataViewTag] =
      typedArrayTags[dateTag] =
      typedArrayTags[errorTag] =
      typedArrayTags[funcTag] =
      typedArrayTags[mapTag] =
      typedArrayTags[numberTag] =
      typedArrayTags[objectTag] =
      typedArrayTags[regexpTag] =
      typedArrayTags[setTag] =
      typedArrayTags[stringTag] =
      typedArrayTags[weakMapTag] =
        false;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal =
      typeof commonjsGlobal == "object" &&
      commonjsGlobal &&
      commonjsGlobal.Object === Object &&
      commonjsGlobal;

    /** Detect free variable `self`. */
    var freeSelf =
      typeof self == "object" && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function("return this")();

    /** Detect free variable `exports`. */
    var freeExports = exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule =
      freeExports &&
      "object" == "object" &&
      module &&
      !module.nodeType &&
      module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports = freeModule && freeModule.exports === freeExports;

    /** Detect free variable `process` from Node.js. */
    var freeProcess = moduleExports && freeGlobal.process;

    /** Used to access faster Node.js helpers. */
    var nodeUtil = (function () {
      try {
        return (
          freeProcess && freeProcess.binding && freeProcess.binding("util")
        );
      } catch (e) {}
    })();

    /* Node.js helper references. */
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

    /**
     * A specialized version of `_.filter` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function arrayFilter(array, predicate) {
      var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }

    /**
     * Appends the elements of `values` to `array`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to append.
     * @returns {Array} Returns `array`.
     */
    function arrayPush(array, values) {
      var index = -1,
        length = values.length,
        offset = array.length;

      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.some` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
        length = array == null ? 0 : array.length;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes(n, iteratee) {
      var index = -1,
        result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    /**
     * The base implementation of `_.unary` without support for storing metadata.
     *
     * @private
     * @param {Function} func The function to cap arguments for.
     * @returns {Function} Returns the new capped function.
     */
    function baseUnary(func) {
      return function (value) {
        return func(value);
      };
    }

    /**
     * Checks if a `cache` value for `key` exists.
     *
     * @private
     * @param {Object} cache The cache to query.
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function cacheHas(cache, key) {
      return cache.has(key);
    }

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    /**
     * Converts `map` to its key-value pairs.
     *
     * @private
     * @param {Object} map The map to convert.
     * @returns {Array} Returns the key-value pairs.
     */
    function mapToArray(map) {
      var index = -1,
        result = Array(map.size);

      map.forEach(function (value, key) {
        result[++index] = [key, value];
      });
      return result;
    }

    /**
     * Creates a unary function that invokes `func` with its argument transformed.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {Function} transform The argument transform.
     * @returns {Function} Returns the new function.
     */
    function overArg(func, transform) {
      return function (arg) {
        return func(transform(arg));
      };
    }

    /**
     * Converts `set` to an array of its values.
     *
     * @private
     * @param {Object} set The set to convert.
     * @returns {Array} Returns the values.
     */
    function setToArray(set) {
      var index = -1,
        result = Array(set.size);

      set.forEach(function (value) {
        result[++index] = value;
      });
      return result;
    }

    /** Used for built-in method references. */
    var arrayProto = Array.prototype,
      funcProto = Function.prototype,
      objectProto = Object.prototype;

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root["__core-js_shared__"];

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function () {
      var uid = /[^.]+$/.exec(
        (coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO) || ""
      );
      return uid ? "Symbol(src)_1." + uid : "";
    })();

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto.toString;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp(
      "^" +
        funcToString
          .call(hasOwnProperty)
          .replace(reRegExpChar, "\\$&")
          .replace(
            /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
            "$1.*?"
          ) +
        "$"
    );

    /** Built-in value references. */
    var Buffer = moduleExports ? root.Buffer : undefined,
      Symbol = root.Symbol,
      Uint8Array = root.Uint8Array,
      propertyIsEnumerable = objectProto.propertyIsEnumerable,
      splice = arrayProto.splice,
      symToStringTag = Symbol ? Symbol.toStringTag : undefined;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetSymbols = Object.getOwnPropertySymbols,
      nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
      nativeKeys = overArg(Object.keys, Object);

    /* Built-in method references that are verified to be native. */
    var DataView = getNative(root, "DataView"),
      Map = getNative(root, "Map"),
      Promise = getNative(root, "Promise"),
      Set = getNative(root, "Set"),
      WeakMap = getNative(root, "WeakMap"),
      nativeCreate = getNative(Object, "create");

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = toSource(DataView),
      mapCtorString = toSource(Map),
      promiseCtorString = toSource(Promise),
      setCtorString = toSource(Set),
      weakMapCtorString = toSource(WeakMap);

    /** Used to convert symbols to primitives and strings. */
    var symbolProto = Symbol ? Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
        length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : undefined;
    }

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate
        ? data[key] !== undefined
        : hasOwnProperty.call(data, key);
    }

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
      return this;
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
        length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
        index = assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
        index = assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
        index = assocIndexOf(data, key);

      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
        length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        hash: new Hash(),
        map: new (Map || ListCache)(),
        string: new Hash(),
      };
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      var result = getMapData(this, key)["delete"](key);
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      var data = getMapData(this, key),
        size = data.size;

      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;

    /**
     *
     * Creates an array cache object to store unique values.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var index = -1,
        length = values == null ? 0 : values.length;

      this.__data__ = new MapCache();
      while (++index < length) {
        this.add(values[index]);
      }
    }

    /**
     * Adds `value` to the array cache.
     *
     * @private
     * @name add
     * @memberOf SetCache
     * @alias push
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache instance.
     */
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }

    /**
     * Checks if `value` is in the array cache.
     *
     * @private
     * @name has
     * @memberOf SetCache
     * @param {*} value The value to search for.
     * @returns {number} Returns `true` if `value` is found, else `false`.
     */
    function setCacheHas(value) {
      return this.__data__.has(value);
    }

    // Add methods to `SetCache`.
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Stack(entries) {
      var data = (this.__data__ = new ListCache(entries));
      this.size = data.size;
    }

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = new ListCache();
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the stack.
     *
     * @private
     * @name delete
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function stackDelete(key) {
      var data = this.__data__,
        result = data["delete"](key);

      this.size = data.size;
      return result;
    }

    /**
     * Gets the stack value for `key`.
     *
     * @private
     * @name get
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function stackGet(key) {
      return this.__data__.get(key);
    }

    /**
     * Checks if a stack value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function stackHas(key) {
      return this.__data__.has(key);
    }

    /**
     * Sets the stack `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value),
        isArg = !isArr && isArguments(value),
        isBuff = !isArr && !isArg && isBuffer(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? baseTimes(value.length, String) : [],
        length = result.length;

      for (var key in value) {
        if (
          (inherited || hasOwnProperty.call(value, key)) &&
          !(
            skipIndexes &&
            // Safari 9 has enumerable `arguments.length` in strict mode.
            (key == "length" ||
              // Node.js 0.10 has enumerable non-index properties on buffers.
              (isBuff && (key == "offset" || key == "parent")) ||
              // PhantomJS 2 has enumerable non-index properties on typed arrays.
              (isType &&
                (key == "buffer" ||
                  key == "byteLength" ||
                  key == "byteOffset")) ||
              // Skip index properties.
              isIndex(key, length))
          )
        ) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
     * `keysFunc` and `symbolsFunc` to get the enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @param {Function} symbolsFunc The function to get the symbols of `object`.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value)
        ? getRawTag(value)
        : objectToString(value);
    }

    /**
     * The base implementation of `_.isArguments`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     */
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }

    /**
     * The base implementation of `_.isEqual` which supports partial comparisons
     * and tracks traversed objects.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Unordered comparison
     *  2 - Partial comparison
     * @param {Function} [customizer] The function to customize comparisons.
     * @param {Object} [stack] Tracks traversed `value` and `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (
        value == null ||
        other == null ||
        (!isObjectLike(value) && !isObjectLike(other))
      ) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(
        value,
        other,
        bitmask,
        customizer,
        baseIsEqual,
        stack
      );
    }

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} [stack] Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(
      object,
      other,
      bitmask,
      customizer,
      equalFunc,
      stack
    ) {
      var objIsArr = isArray(object),
        othIsArr = isArray(other),
        objTag = objIsArr ? arrayTag : getTag(object),
        othTag = othIsArr ? arrayTag : getTag(other);

      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;

      var objIsObj = objTag == objectTag,
        othIsObj = othTag == objectTag,
        isSameTag = objTag == othTag;

      if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack());
        return objIsArr || isTypedArray(object)
          ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
          : equalByTag(
              object,
              other,
              objTag,
              bitmask,
              customizer,
              equalFunc,
              stack
            );
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped =
            objIsObj && hasOwnProperty.call(object, "__wrapped__"),
          othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");

        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object,
            othUnwrapped = othIsWrapped ? other.value() : other;

          stack || (stack = new Stack());
          return equalFunc(
            objUnwrapped,
            othUnwrapped,
            bitmask,
            customizer,
            stack
          );
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack());
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * The base implementation of `_.isTypedArray` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     */
    function baseIsTypedArray(value) {
      return (
        isObjectLike(value) &&
        isLength(value.length) &&
        !!typedArrayTags[baseGetTag(value)]
      );
    }

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `array` and `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
        arrLength = array.length,
        othLength = other.length;

      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(array);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var index = -1,
        result = true,
        seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : undefined;

      stack.set(array, other);
      stack.set(other, array);

      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
          othValue = other[index];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, arrValue, index, other, array, stack)
            : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== undefined) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (seen) {
          if (
            !arraySome(other, function (othValue, othIndex) {
              if (
                !cacheHas(seen, othIndex) &&
                (arrValue === othValue ||
                  equalFunc(arrValue, othValue, bitmask, customizer, stack))
              ) {
                return seen.push(othIndex);
              }
            })
          ) {
            result = false;
            break;
          }
        } else if (
          !(
            arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
          )
        ) {
          result = false;
          break;
        }
      }
      stack["delete"](array);
      stack["delete"](other);
      return result;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(
      object,
      other,
      tag,
      bitmask,
      customizer,
      equalFunc,
      stack
    ) {
      switch (tag) {
        case dataViewTag:
          if (
            object.byteLength != other.byteLength ||
            object.byteOffset != other.byteOffset
          ) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;

        case arrayBufferTag:
          if (
            object.byteLength != other.byteLength ||
            !equalFunc(new Uint8Array(object), new Uint8Array(other))
          ) {
            return false;
          }
          return true;

        case boolTag:
        case dateTag:
        case numberTag:
          // Coerce booleans to `1` or `0` and dates to milliseconds.
          // Invalid dates are coerced to `NaN`.
          return eq(+object, +other);

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case regexpTag:
        case stringTag:
          // Coerce regexes to strings and treat strings, primitives and objects,
          // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
          // for more details.
          return object == other + "";

        case mapTag:
          var convert = mapToArray;

        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
          convert || (convert = setToArray);

          if (object.size != other.size && !isPartial) {
            return false;
          }
          // Assume cyclic values are equal.
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;

          // Recursively compare objects (susceptible to call stack limits).
          stack.set(object, other);
          var result = equalArrays(
            convert(object),
            convert(other),
            bitmask,
            customizer,
            equalFunc,
            stack
          );
          stack["delete"](object);
          return result;

        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(
      object,
      other,
      bitmask,
      customizer,
      equalFunc,
      stack
    ) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
        objProps = getAllKeys(object),
        objLength = objProps.length,
        othProps = getAllKeys(other),
        othLength = othProps.length;

      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);

      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
          othValue = other[key];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, objValue, key, other, object, stack)
            : customizer(objValue, othValue, key, object, other, stack);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (
          !(compared === undefined
            ? objValue === othValue ||
              equalFunc(objValue, othValue, bitmask, customizer, stack)
            : compared)
        ) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == "constructor");
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor,
          othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (
          objCtor != othCtor &&
          "constructor" in object &&
          "constructor" in other &&
          !(
            typeof objCtor == "function" &&
            objCtor instanceof objCtor &&
            typeof othCtor == "function" &&
            othCtor instanceof othCtor
          )
        ) {
          result = false;
        }
      }
      stack["delete"](object);
      stack["delete"](other);
      return result;
    }

    /**
     * Creates an array of own enumerable property names and symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key)
        ? data[typeof key == "string" ? "string" : "hash"]
        : data.map;
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag),
        tag = value[symToStringTag];

      try {
        value[symToStringTag] = undefined;
        var unmasked = true;
      } catch (e) {}

      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }

    /**
     * Creates an array of the own enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbols = !nativeGetSymbols
      ? stubArray
      : function (object) {
          if (object == null) {
            return [];
          }
          object = Object(object);
          return arrayFilter(nativeGetSymbols(object), function (symbol) {
            return propertyIsEnumerable.call(object, symbol);
          });
        };

    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    var getTag = baseGetTag;

    // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
    if (
      (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
      (Map && getTag(new Map()) != mapTag) ||
      (Promise && getTag(Promise.resolve()) != promiseTag) ||
      (Set && getTag(new Set()) != setTag) ||
      (WeakMap && getTag(new WeakMap()) != weakMapTag)
    ) {
      getTag = function (value) {
        var result = baseGetTag(value),
          Ctor = result == objectTag ? value.constructor : undefined,
          ctorString = Ctor ? toSource(Ctor) : "";

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString:
              return dataViewTag;
            case mapCtorString:
              return mapTag;
            case promiseCtorString:
              return promiseTag;
            case setCtorString:
              return setTag;
            case weakMapCtorString:
              return weakMapTag;
          }
        }
        return result;
      };
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return (
        !!length &&
        (typeof value == "number" || reIsUint.test(value)) &&
        value > -1 &&
        value % 1 == 0 &&
        value < length
      );
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" ||
        type == "number" ||
        type == "symbol" ||
        type == "boolean"
        ? value !== "__proto__"
        : value === null;
    }

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
        proto = (typeof Ctor == "function" && Ctor.prototype) || objectProto;

      return value === proto;
    }

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to convert.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {}
        try {
          return func + "";
        } catch (e) {}
      }
      return "";
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    var isArguments = baseIsArguments(
      (function () {
        return arguments;
      })()
    )
      ? baseIsArguments
      : function (value) {
          return (
            isObjectLike(value) &&
            hasOwnProperty.call(value, "callee") &&
            !propertyIsEnumerable.call(value, "callee")
          );
        };

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }

    /**
     * Checks if `value` is a buffer.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
     * @example
     *
     * _.isBuffer(new Buffer(2));
     * // => true
     *
     * _.isBuffer(new Uint8Array(2));
     * // => false
     */
    var isBuffer = nativeIsBuffer || stubFalse;

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent.
     *
     * **Note:** This method supports comparing arrays, array buffers, booleans,
     * date objects, error objects, maps, numbers, `Object` objects, regexes,
     * sets, strings, symbols, and typed arrays. `Object` objects are compared
     * by their own, not inherited, enumerable properties. Functions and DOM
     * nodes are compared by strict equality, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.isEqual(object, other);
     * // => true
     *
     * object === other;
     * // => false
     */
    function isEqual(value, other) {
      return baseIsEqual(value, other);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 9 which returns 'object' for typed arrays and other constructors.
      var tag = baseGetTag(value);
      return (
        tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag
      );
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return (
        typeof value == "number" &&
        value > -1 &&
        value % 1 == 0 &&
        value <= MAX_SAFE_INTEGER
      );
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    var isTypedArray = nodeIsTypedArray
      ? baseUnary(nodeIsTypedArray)
      : baseIsTypedArray;

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }

    /**
     * This method returns a new empty array.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {Array} Returns the new empty array.
     * @example
     *
     * var arrays = _.times(2, _.stubArray);
     *
     * console.log(arrays);
     * // => [[], []]
     *
     * console.log(arrays[0] === arrays[1]);
     * // => false
     */
    function stubArray() {
      return [];
    }

    /**
     * This method returns `false`.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {boolean} Returns `false`.
     * @example
     *
     * _.times(2, _.stubFalse);
     * // => [false, false]
     */
    function stubFalse() {
      return false;
    }

    module.exports = isEqual;
  });

var AttributeMap_1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  var AttributeMap;
  (function (AttributeMap) {
    function compose(a = {}, b = {}, keepNull = false) {
      if (typeof a !== "object") {
        a = {};
      }
      if (typeof b !== "object") {
        b = {};
      }
      let attributes =
        C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_lodash_clonedeep(
          b
        );
      if (!keepNull) {
        attributes = Object.keys(attributes).reduce((copy, key) => {
          if (attributes[key] != null) {
            copy[key] = attributes[key];
          }
          return copy;
        }, {});
      }
      for (const key in a) {
        if (a[key] !== undefined && b[key] === undefined) {
          attributes[key] = a[key];
        }
      }
      return Object.keys(attributes).length > 0 ? attributes : undefined;
    }
    AttributeMap.compose = compose;
    function diff(a = {}, b = {}) {
      if (typeof a !== "object") {
        a = {};
      }
      if (typeof b !== "object") {
        b = {};
      }
      const attributes = Object.keys(a)
        .concat(Object.keys(b))
        .reduce((attrs, key) => {
          if (
            !C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_lodash_isequal(
              a[key],
              b[key]
            )
          ) {
            attrs[key] = b[key] === undefined ? null : b[key];
          }
          return attrs;
        }, {});
      return Object.keys(attributes).length > 0 ? attributes : undefined;
    }
    AttributeMap.diff = diff;
    function invert(attr = {}, base = {}) {
      attr = attr || {};
      const baseInverted = Object.keys(base).reduce((memo, key) => {
        if (base[key] !== attr[key] && attr[key] !== undefined) {
          memo[key] = base[key];
        }
        return memo;
      }, {});
      return Object.keys(attr).reduce((memo, key) => {
        if (attr[key] !== base[key] && base[key] === undefined) {
          memo[key] = null;
        }
        return memo;
      }, baseInverted);
    }
    AttributeMap.invert = invert;
    function transform(a, b, priority = false) {
      if (typeof a !== "object") {
        return b;
      }
      if (typeof b !== "object") {
        return undefined;
      }
      if (!priority) {
        return b; // b simply overwrites us without priority
      }
      const attributes = Object.keys(b).reduce((attrs, key) => {
        if (a[key] === undefined) {
          attrs[key] = b[key]; // null is a valid value
        }
        return attrs;
      }, {});
      return Object.keys(attributes).length > 0 ? attributes : undefined;
    }
    AttributeMap.transform = transform;
  })(AttributeMap || (AttributeMap = {}));
  exports.default = AttributeMap;
});

var Op_1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  var Op;
  (function (Op) {
    function length(op) {
      if (typeof op.delete === "number") {
        return op.delete;
      } else if (typeof op.retain === "number") {
        return op.retain;
      } else if (typeof op.retain === "object" && op.retain !== null) {
        return 1;
      } else {
        return typeof op.insert === "string" ? op.insert.length : 1;
      }
    }
    Op.length = length;
  })(Op || (Op = {}));
  exports.default = Op;
});

var OpIterator = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  class Iterator {
    constructor(ops) {
      this.ops = ops;
      this.index = 0;
      this.offset = 0;
    }
    hasNext() {
      return this.peekLength() < Infinity;
    }
    next(length) {
      if (!length) {
        length = Infinity;
      }
      const nextOp = this.ops[this.index];
      if (nextOp) {
        const offset = this.offset;
        const opLength = Op_1.default.length(nextOp);
        if (length >= opLength - offset) {
          length = opLength - offset;
          this.index += 1;
          this.offset = 0;
        } else {
          this.offset += length;
        }
        if (typeof nextOp.delete === "number") {
          return { delete: length };
        } else {
          const retOp = {};
          if (nextOp.attributes) {
            retOp.attributes = nextOp.attributes;
          }
          if (typeof nextOp.retain === "number") {
            retOp.retain = length;
          } else if (
            typeof nextOp.retain === "object" &&
            nextOp.retain !== null
          ) {
            // offset should === 0, length should === 1
            retOp.retain = nextOp.retain;
          } else if (typeof nextOp.insert === "string") {
            retOp.insert = nextOp.insert.substr(offset, length);
          } else {
            // offset should === 0, length should === 1
            retOp.insert = nextOp.insert;
          }
          return retOp;
        }
      } else {
        return { retain: Infinity };
      }
    }
    peek() {
      return this.ops[this.index];
    }
    peekLength() {
      if (this.ops[this.index]) {
        // Should never return 0 if our index is being managed correctly
        return Op_1.default.length(this.ops[this.index]) - this.offset;
      } else {
        return Infinity;
      }
    }
    peekType() {
      const op = this.ops[this.index];
      if (op) {
        if (typeof op.delete === "number") {
          return "delete";
        } else if (
          typeof op.retain === "number" ||
          (typeof op.retain === "object" && op.retain !== null)
        ) {
          return "retain";
        } else {
          return "insert";
        }
      }
      return "retain";
    }
    rest() {
      if (!this.hasNext()) {
        return [];
      } else if (this.offset === 0) {
        return this.ops.slice(this.index);
      } else {
        const offset = this.offset;
        const index = this.index;
        const next = this.next();
        const rest = this.ops.slice(this.index);
        this.offset = offset;
        this.index = index;
        return [next].concat(rest);
      }
    }
  }
  exports.default = Iterator;
});

var Delta_1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AttributeMap = exports.OpIterator = exports.Op = void 0;

  exports.AttributeMap = AttributeMap_1.default;

  exports.Op = Op_1.default;

  exports.OpIterator = OpIterator.default;
  const NULL_CHARACTER = String.fromCharCode(0); // Placeholder char for embed in diff()
  const getEmbedTypeAndData = (a, b) => {
    if (typeof a !== "object" || a === null) {
      throw new Error(`cannot retain a ${typeof a}`);
    }
    if (typeof b !== "object" || b === null) {
      throw new Error(`cannot retain a ${typeof b}`);
    }
    const embedType = Object.keys(a)[0];
    if (!embedType || embedType !== Object.keys(b)[0]) {
      throw new Error(
        `embed types not matched: ${embedType} != ${Object.keys(b)[0]}`
      );
    }
    return [embedType, a[embedType], b[embedType]];
  };
  class Delta {
    constructor(ops) {
      // Assume we are given a well formed ops
      if (Array.isArray(ops)) {
        this.ops = ops;
      } else if (ops != null && Array.isArray(ops.ops)) {
        this.ops = ops.ops;
      } else {
        this.ops = [];
      }
    }
    static registerEmbed(embedType, handler) {
      this.handlers[embedType] = handler;
    }
    static unregisterEmbed(embedType) {
      delete this.handlers[embedType];
    }
    static getHandler(embedType) {
      const handler = this.handlers[embedType];
      if (!handler) {
        throw new Error(`no handlers for embed type "${embedType}"`);
      }
      return handler;
    }
    insert(arg, attributes) {
      const newOp = {};
      if (typeof arg === "string" && arg.length === 0) {
        return this;
      }
      newOp.insert = arg;
      if (
        attributes != null &&
        typeof attributes === "object" &&
        Object.keys(attributes).length > 0
      ) {
        newOp.attributes = attributes;
      }
      return this.push(newOp);
    }
    delete(length) {
      if (length <= 0) {
        return this;
      }
      return this.push({ delete: length });
    }
    retain(length, attributes) {
      if (typeof length === "number" && length <= 0) {
        return this;
      }
      const newOp = { retain: length };
      if (
        attributes != null &&
        typeof attributes === "object" &&
        Object.keys(attributes).length > 0
      ) {
        newOp.attributes = attributes;
      }
      return this.push(newOp);
    }
    push(newOp) {
      let index = this.ops.length;
      let lastOp = this.ops[index - 1];
      newOp =
        C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_lodash_clonedeep(
          newOp
        );
      if (typeof lastOp === "object") {
        if (
          typeof newOp.delete === "number" &&
          typeof lastOp.delete === "number"
        ) {
          this.ops[index - 1] = { delete: lastOp.delete + newOp.delete };
          return this;
        }
        // Since it does not matter if we insert before or after deleting at the same index,
        // always prefer to insert first
        if (typeof lastOp.delete === "number" && newOp.insert != null) {
          index -= 1;
          lastOp = this.ops[index - 1];
          if (typeof lastOp !== "object") {
            this.ops.unshift(newOp);
            return this;
          }
        }
        if (
          C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_lodash_isequal(
            newOp.attributes,
            lastOp.attributes
          )
        ) {
          if (
            typeof newOp.insert === "string" &&
            typeof lastOp.insert === "string"
          ) {
            this.ops[index - 1] = { insert: lastOp.insert + newOp.insert };
            if (typeof newOp.attributes === "object") {
              this.ops[index - 1].attributes = newOp.attributes;
            }
            return this;
          } else if (
            typeof newOp.retain === "number" &&
            typeof lastOp.retain === "number"
          ) {
            this.ops[index - 1] = { retain: lastOp.retain + newOp.retain };
            if (typeof newOp.attributes === "object") {
              this.ops[index - 1].attributes = newOp.attributes;
            }
            return this;
          }
        }
      }
      if (index === this.ops.length) {
        this.ops.push(newOp);
      } else {
        this.ops.splice(index, 0, newOp);
      }
      return this;
    }
    chop() {
      const lastOp = this.ops[this.ops.length - 1];
      if (lastOp && typeof lastOp.retain === "number" && !lastOp.attributes) {
        this.ops.pop();
      }
      return this;
    }
    filter(predicate) {
      return this.ops.filter(predicate);
    }
    forEach(predicate) {
      this.ops.forEach(predicate);
    }
    map(predicate) {
      return this.ops.map(predicate);
    }
    partition(predicate) {
      const passed = [];
      const failed = [];
      this.forEach((op) => {
        const target = predicate(op) ? passed : failed;
        target.push(op);
      });
      return [passed, failed];
    }
    reduce(predicate, initialValue) {
      return this.ops.reduce(predicate, initialValue);
    }
    changeLength() {
      return this.reduce((length, elem) => {
        if (elem.insert) {
          return length + Op_1.default.length(elem);
        } else if (elem.delete) {
          return length - elem.delete;
        }
        return length;
      }, 0);
    }
    length() {
      return this.reduce((length, elem) => {
        return length + Op_1.default.length(elem);
      }, 0);
    }
    slice(start = 0, end = Infinity) {
      const ops = [];
      const iter = new OpIterator.default(this.ops);
      let index = 0;
      while (index < end && iter.hasNext()) {
        let nextOp;
        if (index < start) {
          nextOp = iter.next(start - index);
        } else {
          nextOp = iter.next(end - index);
          ops.push(nextOp);
        }
        index += Op_1.default.length(nextOp);
      }
      return new Delta(ops);
    }
    compose(other) {
      const thisIter = new OpIterator.default(this.ops);
      const otherIter = new OpIterator.default(other.ops);
      const ops = [];
      const firstOther = otherIter.peek();
      if (
        firstOther != null &&
        typeof firstOther.retain === "number" &&
        firstOther.attributes == null
      ) {
        let firstLeft = firstOther.retain;
        while (
          thisIter.peekType() === "insert" &&
          thisIter.peekLength() <= firstLeft
        ) {
          firstLeft -= thisIter.peekLength();
          ops.push(thisIter.next());
        }
        if (firstOther.retain - firstLeft > 0) {
          otherIter.next(firstOther.retain - firstLeft);
        }
      }
      const delta = new Delta(ops);
      while (thisIter.hasNext() || otherIter.hasNext()) {
        if (otherIter.peekType() === "insert") {
          delta.push(otherIter.next());
        } else if (thisIter.peekType() === "delete") {
          delta.push(thisIter.next());
        } else {
          const length = Math.min(
            thisIter.peekLength(),
            otherIter.peekLength()
          );
          const thisOp = thisIter.next(length);
          const otherOp = otherIter.next(length);
          if (otherOp.retain) {
            const newOp = {};
            if (typeof thisOp.retain === "number") {
              newOp.retain =
                typeof otherOp.retain === "number" ? length : otherOp.retain;
            } else {
              if (typeof otherOp.retain === "number") {
                if (thisOp.retain == null) {
                  newOp.insert = thisOp.insert;
                } else {
                  newOp.retain = thisOp.retain;
                }
              } else {
                const action = thisOp.retain == null ? "insert" : "retain";
                const [embedType, thisData, otherData] = getEmbedTypeAndData(
                  thisOp[action],
                  otherOp.retain
                );
                const handler = Delta.getHandler(embedType);
                newOp[action] = {
                  [embedType]: handler.compose(
                    thisData,
                    otherData,
                    action === "retain"
                  ),
                };
              }
            }
            // Preserve null when composing with a retain, otherwise remove it for inserts
            const attributes = AttributeMap_1.default.compose(
              thisOp.attributes,
              otherOp.attributes,
              typeof thisOp.retain === "number"
            );
            if (attributes) {
              newOp.attributes = attributes;
            }
            delta.push(newOp);
            // Optimization if rest of other is just retain
            if (
              !otherIter.hasNext() &&
              C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_lodash_isequal(
                delta.ops[delta.ops.length - 1],
                newOp
              )
            ) {
              const rest = new Delta(thisIter.rest());
              return delta.concat(rest).chop();
            }
            // Other op should be delete, we could be an insert or retain
            // Insert + delete cancels out
          } else if (
            typeof otherOp.delete === "number" &&
            (typeof thisOp.retain === "number" ||
              (typeof thisOp.retain === "object" && thisOp.retain !== null))
          ) {
            delta.push(otherOp);
          }
        }
      }
      return delta.chop();
    }
    concat(other) {
      const delta = new Delta(this.ops.slice());
      if (other.ops.length > 0) {
        delta.push(other.ops[0]);
        delta.ops = delta.ops.concat(other.ops.slice(1));
      }
      return delta;
    }
    diff(other, cursor) {
      if (this.ops === other.ops) {
        return new Delta();
      }
      const strings = [this, other].map((delta) => {
        return delta
          .map((op) => {
            if (op.insert != null) {
              return typeof op.insert === "string" ? op.insert : NULL_CHARACTER;
            }
            const prep = delta === other ? "on" : "with";
            throw new Error("diff() called " + prep + " non-document");
          })
          .join("");
      });
      const retDelta = new Delta();
      const diffResult = diff_1(strings[0], strings[1], cursor);
      const thisIter = new OpIterator.default(this.ops);
      const otherIter = new OpIterator.default(other.ops);
      diffResult.forEach((component) => {
        let length = component[1].length;
        while (length > 0) {
          let opLength = 0;
          switch (component[0]) {
            case diff_1.INSERT:
              opLength = Math.min(otherIter.peekLength(), length);
              retDelta.push(otherIter.next(opLength));
              break;
            case diff_1.DELETE:
              opLength = Math.min(length, thisIter.peekLength());
              thisIter.next(opLength);
              retDelta.delete(opLength);
              break;
            case diff_1.EQUAL:
              opLength = Math.min(
                thisIter.peekLength(),
                otherIter.peekLength(),
                length
              );
              const thisOp = thisIter.next(opLength);
              const otherOp = otherIter.next(opLength);
              if (
                C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_lodash_isequal(
                  thisOp.insert,
                  otherOp.insert
                )
              ) {
                retDelta.retain(
                  opLength,
                  AttributeMap_1.default.diff(
                    thisOp.attributes,
                    otherOp.attributes
                  )
                );
              } else {
                retDelta.push(otherOp).delete(opLength);
              }
              break;
          }
          length -= opLength;
        }
      });
      return retDelta.chop();
    }
    eachLine(predicate, newline = "\n") {
      const iter = new OpIterator.default(this.ops);
      let line = new Delta();
      let i = 0;
      while (iter.hasNext()) {
        if (iter.peekType() !== "insert") {
          return;
        }
        const thisOp = iter.peek();
        const start = Op_1.default.length(thisOp) - iter.peekLength();
        const index =
          typeof thisOp.insert === "string"
            ? thisOp.insert.indexOf(newline, start) - start
            : -1;
        if (index < 0) {
          line.push(iter.next());
        } else if (index > 0) {
          line.push(iter.next(index));
        } else {
          if (predicate(line, iter.next(1).attributes || {}, i) === false) {
            return;
          }
          i += 1;
          line = new Delta();
        }
      }
      if (line.length() > 0) {
        predicate(line, {}, i);
      }
    }
    invert(base) {
      const inverted = new Delta();
      this.reduce((baseIndex, op) => {
        if (op.insert) {
          inverted.delete(Op_1.default.length(op));
        } else if (typeof op.retain === "number" && op.attributes == null) {
          inverted.retain(op.retain);
          return baseIndex + op.retain;
        } else if (op.delete || typeof op.retain === "number") {
          const length = op.delete || op.retain;
          const slice = base.slice(baseIndex, baseIndex + length);
          slice.forEach((baseOp) => {
            if (op.delete) {
              inverted.push(baseOp);
            } else if (op.retain && op.attributes) {
              inverted.retain(
                Op_1.default.length(baseOp),
                AttributeMap_1.default.invert(op.attributes, baseOp.attributes)
              );
            }
          });
          return baseIndex + length;
        } else if (typeof op.retain === "object" && op.retain !== null) {
          const slice = base.slice(baseIndex, baseIndex + 1);
          const baseOp = new OpIterator.default(slice.ops).next();
          const [embedType, opData, baseOpData] = getEmbedTypeAndData(
            op.retain,
            baseOp.insert
          );
          const handler = Delta.getHandler(embedType);
          inverted.retain(
            { [embedType]: handler.invert(opData, baseOpData) },
            AttributeMap_1.default.invert(op.attributes, baseOp.attributes)
          );
          return baseIndex + 1;
        }
        return baseIndex;
      }, 0);
      return inverted.chop();
    }
    transform(arg, priority = false) {
      priority = !!priority;
      if (typeof arg === "number") {
        return this.transformPosition(arg, priority);
      }
      const other = arg;
      const thisIter = new OpIterator.default(this.ops);
      const otherIter = new OpIterator.default(other.ops);
      const delta = new Delta();
      while (thisIter.hasNext() || otherIter.hasNext()) {
        if (
          thisIter.peekType() === "insert" &&
          (priority || otherIter.peekType() !== "insert")
        ) {
          delta.retain(Op_1.default.length(thisIter.next()));
        } else if (otherIter.peekType() === "insert") {
          delta.push(otherIter.next());
        } else {
          const length = Math.min(
            thisIter.peekLength(),
            otherIter.peekLength()
          );
          const thisOp = thisIter.next(length);
          const otherOp = otherIter.next(length);
          if (thisOp.delete) {
            // Our delete either makes their delete redundant or removes their retain
            continue;
          } else if (otherOp.delete) {
            delta.push(otherOp);
          } else {
            const thisData = thisOp.retain;
            const otherData = otherOp.retain;
            let transformedData =
              typeof otherData === "object" && otherData !== null
                ? otherData
                : length;
            if (
              typeof thisData === "object" &&
              thisData !== null &&
              typeof otherData === "object" &&
              otherData !== null
            ) {
              const embedType = Object.keys(thisData)[0];
              if (embedType === Object.keys(otherData)[0]) {
                const handler = Delta.getHandler(embedType);
                if (handler) {
                  transformedData = {
                    [embedType]: handler.transform(
                      thisData[embedType],
                      otherData[embedType],
                      priority
                    ),
                  };
                }
              }
            }
            // We retain either their retain or insert
            delta.retain(
              transformedData,
              AttributeMap_1.default.transform(
                thisOp.attributes,
                otherOp.attributes,
                priority
              )
            );
          }
        }
      }
      return delta.chop();
    }
    transformPosition(index, priority = false) {
      priority = !!priority;
      const thisIter = new OpIterator.default(this.ops);
      let offset = 0;
      while (thisIter.hasNext() && offset <= index) {
        const length = thisIter.peekLength();
        const nextType = thisIter.peekType();
        thisIter.next();
        if (nextType === "delete") {
          index -= Math.min(length, index - offset);
          continue;
        } else if (nextType === "insert" && (offset < index || !priority)) {
          index += length;
        }
        offset += length;
      }
      return index;
    }
  }
  Delta.Op = Op_1.default;
  Delta.OpIterator = OpIterator.default;
  Delta.AttributeMap = AttributeMap_1.default;
  Delta.handlers = {};
  exports.default = Delta;
  {
    module.exports = Delta;
    module.exports.default = Delta;
  }
});

var Delta = /*@__PURE__*/ getDefaultExportFromCjs(Delta_1);

/**
 * Clean all suggestion boxes from an HTML string
 *
 * @param html HTML to clean
 * @returns Cleaned text
 */
function getCleanedHtml(html) {
  return html.replace(/<quill-lt-match .*>(.*)?<\/quill-lt-match>/g, "$1");
}
/**
 * Remove all suggestion boxes from the editor.
 */
function removeSuggestionBoxes(quillEditor) {
  debug("Removing suggestion boxes for editor", quillEditor);
  var initialSelection = quillEditor.getSelection();
  var deltas = quillEditor.getContents();
  var deltasWithoutSuggestionBoxes = deltas.ops.map(function (delta) {
    if (delta.attributes && delta.attributes.ltmatch) {
      return __assign(__assign({}, delta), {
        attributes: __assign(__assign({}, delta.attributes), { ltmatch: null }),
      });
    }
    return delta;
  });
  // @ts-ignore
  quillEditor.setContents(new Delta(deltasWithoutSuggestionBoxes));
  if (initialSelection) {
    quillEditor.setSelection(initialSelection);
  }
}
/**
 * Manager for the suggestion boxes.
 * This handles inserting and removing suggestion box elements from the editor.
 */
var SuggestionBoxes = /** @class */ (function () {
  function SuggestionBoxes(parent) {
    this.parent = parent;
  }
  /**
   * Remove all suggestion boxes from the editor.
   */
  SuggestionBoxes.prototype.removeSuggestionBoxes = function () {
    this.parent.preventLoop();
    removeSuggestionBoxes(this.parent.quill);
  };
  /**
   * Insert a suggestion box into the editor.
   *
   * This uses the matches stored in the parent class
   */
  SuggestionBoxes.prototype.addSuggestionBoxes = function () {
    var _this = this;
    this.parent.matches.forEach(function (match) {
      _this.parent.preventLoop();
      var ops = new Delta()
        .retain(match.offset)
        .retain(match.length, { ltmatch: match });
      // @ts-ignore
      _this.parent.quill.updateContents(ops);
      debug("Adding formatter", "lt-match", match.offset, match.length);
    });
  };
  return SuggestionBoxes;
})();

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === "undefined") {
    return;
  }

  var head = document.head || document.getElementsByTagName("head")[0];
  var style = document.createElement("style");
  style.type = "text/css";

  if (insertAt === "top") {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z =
  '/* In-text suggestion element */\r\nquill-lt-match {\r\n  border-bottom: #ff6a6a solid 3px;\r\n}\r\nquill-lt-match:hover {\r\n  background-color: #fdcccc;\r\n  cursor: pointer;\r\n}\r\n\r\n/* Popup */\r\n.quill-lt-match-popup {\r\n  isolation: isolate;\r\n\r\n  background-color: #fff;\r\n  border-radius: 7px;\r\n  box-shadow: 0 8px 30px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);\r\n  padding: 5px;\r\n  z-index: 1;\r\n  max-width: 400px;\r\n  padding: 1rem;\r\n\r\n  font-family: -apple-system, BlinkMacSystemFont, "Avenir Next", Avenir,\r\n    "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji",\r\n    "Segoe UI Emoji", "Segoe UI Symbol";\r\n  font-size: 1rem;\r\n  color: #39475c;\r\n}\r\n\r\n.quill-lt-match-popup-close {\r\n  float: right;\r\n  padding: 0.5rem;\r\n  cursor: pointer;\r\n  background-color: transparent;\r\n  border: none;\r\n  font-size: 1.5rem;\r\n  color: #ccc;\r\n}\r\n.quill-lt-match-popup-close:hover {\r\n  color: #39475c;\r\n}\r\n\r\n.quill-lt-match-popup-title {\r\n  font-size: 1rem;\r\n  font-weight: bold;\r\n  margin-bottom: 0.5rem;\r\n}\r\n.quill-lt-match-popup-description {\r\n  font-size: 0.8rem;\r\n  margin-bottom: 0.5rem;\r\n}\r\n\r\n.quill-lt-match-popup-actions {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 0.5rem;\r\n}\r\n\r\n.quill-lt-match-popup-action {\r\n  text-align: start;\r\n  font-weight: bolder;\r\n  cursor: pointer;\r\n  border: none;\r\n  padding: 0.5rem;\r\n  background-color: #fff;\r\n  color: #39475c;\r\n}\r\n.quill-lt-match-popup-action:hover {\r\n  background-color: #f5f5f5;\r\n}\r\n\r\n.quill-lt-powered-by {\r\n  text-align: end;\r\n  font-size: 0.6rem;\r\n  color: #999;\r\n  margin-top: 0.5rem;\r\n}\r\n.quill-lt-powered-by a {\r\n  color: #999;\r\n}\r\n\r\n/* Arrow */\r\n.quill-lt-popup-arrow,\r\n.quill-lt-popup-arrow::before {\r\n  position: absolute;\r\n  width: 8px;\r\n  height: 8px;\r\n  background: inherit;\r\n}\r\n\r\n.quill-lt-popup-arrow {\r\n  visibility: hidden;\r\n}\r\n\r\n.quill-lt-popup-arrow::before {\r\n  visibility: visible;\r\n  content: "";\r\n  transform: rotate(45deg);\r\n  background: white;\r\n}\r\nquill-lt-popup[data-popper-placement^="top"] > .quill-lt-popup-arrow {\r\n  bottom: -4px;\r\n}\r\n\r\nquill-lt-popup[data-popper-placement^="bottom"] > .quill-lt-popup-arrow {\r\n  top: -4px;\r\n}\r\n\r\nquill-lt-popup[data-popper-placement^="left"] > .quill-lt-popup-arrow {\r\n  right: -4px;\r\n}\r\n\r\nquill-lt-popup[data-popper-placement^="right"] > .quill-lt-popup-arrow {\r\n  left: -4px;\r\n}\r\n\r\n/* Loading indicator in editor */\r\n.quill-lt-loading-indicator {\r\n  position: absolute;\r\n  bottom: 3px;\r\n  right: 3px;\r\n  z-index: 10;\r\n}\r\n.quill-lt-loading-indicator-spinner {\r\n  display: inline-block;\r\n  width: 1rem;\r\n  height: 1rem;\r\n  border-radius: 50%;\r\n  border: 2px solid #ccc;\r\n  border-top-color: #39475c;\r\n  animation: quill-lt-loading-indicator-spin 1s linear infinite;\r\n}\r\n@keyframes quill-lt-loading-indicator-spin {\r\n  0% {\r\n    transform: rotate(0deg);\r\n  }\r\n  100% {\r\n    transform: rotate(360deg);\r\n  }\r\n}\r\n';
styleInject(css_248z);

/**
 * Quill editor blot that represents a suggestion.
 *
 * This is added to the text to enable the suggestion to be selected and inserted.
 *
 * @param Quill Quill static instance
 * @returns Blot class that can be registered on the Quill instance
 */
function createSuggestionBlotForQuillInstance(Quill) {
  var _a;
  var ParentBlot = Quill.import("formats/bold");
  return (
    (_a = /** @class */ (function (_super) {
      __extends(SuggestionBlot, _super);
      function SuggestionBlot() {
        return (_super !== null && _super.apply(this, arguments)) || this;
      }
      SuggestionBlot.create = function (match) {
        var node = _super.create.call(this);
        if (match) {
          node.setAttribute("data-offset", match.offset.toString());
          node.setAttribute("data-length", match.length.toString());
          node.setAttribute("data-rule-id", match.rule.id);
        }
        console.log("Created blot", node);
        return node;
      };
      SuggestionBlot.prototype.optimize = function () {};
      return SuggestionBlot;
    })(ParentBlot)),
    (_a.blotName = "ltmatch"),
    (_a.tagName = "quill-lt-match"),
    _a
  );
}

var top = "top";
var bottom = "bottom";
var right = "right";
var left = "left";
var auto = "auto";
var basePlacements = [top, bottom, right, left];
var start = "start";
var end = "end";
var clippingParents = "clippingParents";
var viewport = "viewport";
var popper = "popper";
var reference = "reference";
var variationPlacements = /*#__PURE__*/ basePlacements.reduce(function (
  acc,
  placement
) {
  return acc.concat([placement + "-" + start, placement + "-" + end]);
},
[]);
var placements = /*#__PURE__*/ []
  .concat(basePlacements, [auto])
  .reduce(function (acc, placement) {
    return acc.concat([
      placement,
      placement + "-" + start,
      placement + "-" + end,
    ]);
  }, []); // modifiers that need to read the DOM

var beforeRead = "beforeRead";
var read = "read";
var afterRead = "afterRead"; // pure-logic modifiers

var beforeMain = "beforeMain";
var main = "main";
var afterMain = "afterMain"; // modifier with the purpose to write to the DOM (or write into a framework state)

var beforeWrite = "beforeWrite";
var write = "write";
var afterWrite = "afterWrite";
var modifierPhases = [
  beforeRead,
  read,
  afterRead,
  beforeMain,
  main,
  afterMain,
  beforeWrite,
  write,
  afterWrite,
];

function getNodeName(element) {
  return element ? (element.nodeName || "").toLowerCase() : null;
}

function getWindow(node) {
  if (node == null) {
    return window;
  }

  if (node.toString() !== "[object Window]") {
    var ownerDocument = node.ownerDocument;
    return ownerDocument ? ownerDocument.defaultView || window : window;
  }

  return node;
}

function isElement(node) {
  var OwnElement = getWindow(node).Element;
  return node instanceof OwnElement || node instanceof Element;
}

function isHTMLElement(node) {
  var OwnElement = getWindow(node).HTMLElement;
  return node instanceof OwnElement || node instanceof HTMLElement;
}

function isShadowRoot(node) {
  // IE 11 has no ShadowRoot
  if (typeof ShadowRoot === "undefined") {
    return false;
  }

  var OwnElement = getWindow(node).ShadowRoot;
  return node instanceof OwnElement || node instanceof ShadowRoot;
}

// and applies them to the HTMLElements such as popper and arrow

function applyStyles(_ref) {
  var state = _ref.state;
  Object.keys(state.elements).forEach(function (name) {
    var style = state.styles[name] || {};
    var attributes = state.attributes[name] || {};
    var element = state.elements[name]; // arrow is optional + virtual elements

    if (!isHTMLElement(element) || !getNodeName(element)) {
      return;
    } // Flow doesn't support to extend this property, but it's the most
    // effective way to apply styles to an HTMLElement
    // $FlowFixMe[cannot-write]

    Object.assign(element.style, style);
    Object.keys(attributes).forEach(function (name) {
      var value = attributes[name];

      if (value === false) {
        element.removeAttribute(name);
      } else {
        element.setAttribute(name, value === true ? "" : value);
      }
    });
  });
}

function effect$2(_ref2) {
  var state = _ref2.state;
  var initialStyles = {
    popper: {
      position: state.options.strategy,
      left: "0",
      top: "0",
      margin: "0",
    },
    arrow: {
      position: "absolute",
    },
    reference: {},
  };
  Object.assign(state.elements.popper.style, initialStyles.popper);
  state.styles = initialStyles;

  if (state.elements.arrow) {
    Object.assign(state.elements.arrow.style, initialStyles.arrow);
  }

  return function () {
    Object.keys(state.elements).forEach(function (name) {
      var element = state.elements[name];
      var attributes = state.attributes[name] || {};
      var styleProperties = Object.keys(
        state.styles.hasOwnProperty(name)
          ? state.styles[name]
          : initialStyles[name]
      ); // Set all values to an empty string to unset them

      var style = styleProperties.reduce(function (style, property) {
        style[property] = "";
        return style;
      }, {}); // arrow is optional + virtual elements

      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }

      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function (attribute) {
        element.removeAttribute(attribute);
      });
    });
  };
} // eslint-disable-next-line import/no-unused-modules

var applyStyles$1 = {
  name: "applyStyles",
  enabled: true,
  phase: "write",
  fn: applyStyles,
  effect: effect$2,
  requires: ["computeStyles"],
};

function getBasePlacement(placement) {
  return placement.split("-")[0];
}

var max = Math.max;
var min = Math.min;
var round = Math.round;

function getUAString() {
  var uaData = navigator.userAgentData;

  if (uaData != null && uaData.brands) {
    return uaData.brands
      .map(function (item) {
        return item.brand + "/" + item.version;
      })
      .join(" ");
  }

  return navigator.userAgent;
}

function isLayoutViewport() {
  return !/^((?!chrome|android).)*safari/i.test(getUAString());
}

function getBoundingClientRect(element, includeScale, isFixedStrategy) {
  if (includeScale === void 0) {
    includeScale = false;
  }

  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }

  var clientRect = element.getBoundingClientRect();
  var scaleX = 1;
  var scaleY = 1;

  if (includeScale && isHTMLElement(element)) {
    scaleX =
      element.offsetWidth > 0
        ? round(clientRect.width) / element.offsetWidth || 1
        : 1;
    scaleY =
      element.offsetHeight > 0
        ? round(clientRect.height) / element.offsetHeight || 1
        : 1;
  }

  var _ref = isElement(element) ? getWindow(element) : window,
    visualViewport = _ref.visualViewport;

  var addVisualOffsets = !isLayoutViewport() && isFixedStrategy;
  var x =
    (clientRect.left +
      (addVisualOffsets && visualViewport ? visualViewport.offsetLeft : 0)) /
    scaleX;
  var y =
    (clientRect.top +
      (addVisualOffsets && visualViewport ? visualViewport.offsetTop : 0)) /
    scaleY;
  var width = clientRect.width / scaleX;
  var height = clientRect.height / scaleY;
  return {
    width: width,
    height: height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    x: x,
    y: y,
  };
}

// means it doesn't take into account transforms.

function getLayoutRect(element) {
  var clientRect = getBoundingClientRect(element); // Use the clientRect sizes if it's not been transformed.
  // Fixes https://github.com/popperjs/popper-core/issues/1223

  var width = element.offsetWidth;
  var height = element.offsetHeight;

  if (Math.abs(clientRect.width - width) <= 1) {
    width = clientRect.width;
  }

  if (Math.abs(clientRect.height - height) <= 1) {
    height = clientRect.height;
  }

  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: width,
    height: height,
  };
}

function contains(parent, child) {
  var rootNode = child.getRootNode && child.getRootNode(); // First, attempt with faster native method

  if (parent.contains(child)) {
    return true;
  } // then fallback to custom implementation with Shadow DOM support
  else if (rootNode && isShadowRoot(rootNode)) {
    var next = child;

    do {
      if (next && parent.isSameNode(next)) {
        return true;
      } // $FlowFixMe[prop-missing]: need a better way to handle this...

      next = next.parentNode || next.host;
    } while (next);
  } // Give up, the result is false

  return false;
}

function getComputedStyle(element) {
  return getWindow(element).getComputedStyle(element);
}

function isTableElement(element) {
  return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
}

function getDocumentElement(element) {
  // $FlowFixMe[incompatible-return]: assume body is always available
  return (
    (isElement(element)
      ? element.ownerDocument // $FlowFixMe[prop-missing]
      : element.document) || window.document
  ).documentElement;
}

function getParentNode(element) {
  if (getNodeName(element) === "html") {
    return element;
  }

  return (
    // this is a quicker (but less type safe) way to save quite some bytes from the bundle
    // $FlowFixMe[incompatible-return]
    // $FlowFixMe[prop-missing]
    element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
    element.parentNode || // DOM Element detected
    (isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
    // $FlowFixMe[incompatible-call]: HTMLElement is a Node
    getDocumentElement(element) // fallback
  );
}

function getTrueOffsetParent(element) {
  if (
    !isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
    getComputedStyle(element).position === "fixed"
  ) {
    return null;
  }

  return element.offsetParent;
} // `.offsetParent` reports `null` for fixed elements, while absolute elements
// return the containing block

function getContainingBlock(element) {
  var isFirefox = /firefox/i.test(getUAString());
  var isIE = /Trident/i.test(getUAString());

  if (isIE && isHTMLElement(element)) {
    // In IE 9, 10 and 11 fixed elements containing block is always established by the viewport
    var elementCss = getComputedStyle(element);

    if (elementCss.position === "fixed") {
      return null;
    }
  }

  var currentNode = getParentNode(element);

  if (isShadowRoot(currentNode)) {
    currentNode = currentNode.host;
  }

  while (
    isHTMLElement(currentNode) &&
    ["html", "body"].indexOf(getNodeName(currentNode)) < 0
  ) {
    var css = getComputedStyle(currentNode); // This is non-exhaustive but covers the most common CSS properties that
    // create a containing block.
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block

    if (
      css.transform !== "none" ||
      css.perspective !== "none" ||
      css.contain === "paint" ||
      ["transform", "perspective"].indexOf(css.willChange) !== -1 ||
      (isFirefox && css.willChange === "filter") ||
      (isFirefox && css.filter && css.filter !== "none")
    ) {
      return currentNode;
    } else {
      currentNode = currentNode.parentNode;
    }
  }

  return null;
} // Gets the closest ancestor positioned element. Handles some edge cases,
// such as table ancestors and cross browser bugs.

function getOffsetParent(element) {
  var window = getWindow(element);
  var offsetParent = getTrueOffsetParent(element);

  while (
    offsetParent &&
    isTableElement(offsetParent) &&
    getComputedStyle(offsetParent).position === "static"
  ) {
    offsetParent = getTrueOffsetParent(offsetParent);
  }

  if (
    offsetParent &&
    (getNodeName(offsetParent) === "html" ||
      (getNodeName(offsetParent) === "body" &&
        getComputedStyle(offsetParent).position === "static"))
  ) {
    return window;
  }

  return offsetParent || getContainingBlock(element) || window;
}

function getMainAxisFromPlacement(placement) {
  return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
}

function within(min$1, value, max$1) {
  return max(min$1, min(value, max$1));
}
function withinMaxClamp(min, value, max) {
  var v = within(min, value, max);
  return v > max ? max : v;
}

function getFreshSideObject() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
}

function mergePaddingObject(paddingObject) {
  return Object.assign({}, getFreshSideObject(), paddingObject);
}

function expandToHashMap(value, keys) {
  return keys.reduce(function (hashMap, key) {
    hashMap[key] = value;
    return hashMap;
  }, {});
}

var toPaddingObject = function toPaddingObject(padding, state) {
  padding =
    typeof padding === "function"
      ? padding(
          Object.assign({}, state.rects, {
            placement: state.placement,
          })
        )
      : padding;
  return mergePaddingObject(
    typeof padding !== "number"
      ? padding
      : expandToHashMap(padding, basePlacements)
  );
};

function arrow(_ref) {
  var _state$modifiersData$;

  var state = _ref.state,
    name = _ref.name,
    options = _ref.options;
  var arrowElement = state.elements.arrow;
  var popperOffsets = state.modifiersData.popperOffsets;
  var basePlacement = getBasePlacement(state.placement);
  var axis = getMainAxisFromPlacement(basePlacement);
  var isVertical = [left, right].indexOf(basePlacement) >= 0;
  var len = isVertical ? "height" : "width";

  if (!arrowElement || !popperOffsets) {
    return;
  }

  var paddingObject = toPaddingObject(options.padding, state);
  var arrowRect = getLayoutRect(arrowElement);
  var minProp = axis === "y" ? top : left;
  var maxProp = axis === "y" ? bottom : right;
  var endDiff =
    state.rects.reference[len] +
    state.rects.reference[axis] -
    popperOffsets[axis] -
    state.rects.popper[len];
  var startDiff = popperOffsets[axis] - state.rects.reference[axis];
  var arrowOffsetParent = getOffsetParent(arrowElement);
  var clientSize = arrowOffsetParent
    ? axis === "y"
      ? arrowOffsetParent.clientHeight || 0
      : arrowOffsetParent.clientWidth || 0
    : 0;
  var centerToReference = endDiff / 2 - startDiff / 2; // Make sure the arrow doesn't overflow the popper if the center point is
  // outside of the popper bounds

  var min = paddingObject[minProp];
  var max = clientSize - arrowRect[len] - paddingObject[maxProp];
  var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
  var offset = within(min, center, max); // Prevents breaking syntax highlighting...

  var axisProp = axis;
  state.modifiersData[name] =
    ((_state$modifiersData$ = {}),
    (_state$modifiersData$[axisProp] = offset),
    (_state$modifiersData$.centerOffset = offset - center),
    _state$modifiersData$);
}

function effect$1(_ref2) {
  var state = _ref2.state,
    options = _ref2.options;
  var _options$element = options.element,
    arrowElement =
      _options$element === void 0 ? "[data-popper-arrow]" : _options$element;

  if (arrowElement == null) {
    return;
  } // CSS selector

  if (typeof arrowElement === "string") {
    arrowElement = state.elements.popper.querySelector(arrowElement);

    if (!arrowElement) {
      return;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    if (!isHTMLElement(arrowElement)) {
      console.error(
        [
          'Popper: "arrow" element must be an HTMLElement (not an SVGElement).',
          "To use an SVG arrow, wrap it in an HTMLElement that will be used as",
          "the arrow.",
        ].join(" ")
      );
    }
  }

  if (!contains(state.elements.popper, arrowElement)) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        [
          'Popper: "arrow" modifier\'s `element` must be a child of the popper',
          "element.",
        ].join(" ")
      );
    }

    return;
  }

  state.elements.arrow = arrowElement;
} // eslint-disable-next-line import/no-unused-modules

var arrow$1 = {
  name: "arrow",
  enabled: true,
  phase: "main",
  fn: arrow,
  effect: effect$1,
  requires: ["popperOffsets"],
  requiresIfExists: ["preventOverflow"],
};

function getVariation(placement) {
  return placement.split("-")[1];
}

var unsetSides = {
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto",
}; // Round the offsets to the nearest suitable subpixel based on the DPR.
// Zooming can change the DPR, but it seems to report a value that will
// cleanly divide the values into the appropriate subpixels.

function roundOffsetsByDPR(_ref) {
  var x = _ref.x,
    y = _ref.y;
  var win = window;
  var dpr = win.devicePixelRatio || 1;
  return {
    x: round(x * dpr) / dpr || 0,
    y: round(y * dpr) / dpr || 0,
  };
}

function mapToStyles(_ref2) {
  var _Object$assign2;

  var popper = _ref2.popper,
    popperRect = _ref2.popperRect,
    placement = _ref2.placement,
    variation = _ref2.variation,
    offsets = _ref2.offsets,
    position = _ref2.position,
    gpuAcceleration = _ref2.gpuAcceleration,
    adaptive = _ref2.adaptive,
    roundOffsets = _ref2.roundOffsets,
    isFixed = _ref2.isFixed;
  var _offsets$x = offsets.x,
    x = _offsets$x === void 0 ? 0 : _offsets$x,
    _offsets$y = offsets.y,
    y = _offsets$y === void 0 ? 0 : _offsets$y;

  var _ref3 =
    typeof roundOffsets === "function"
      ? roundOffsets({
          x: x,
          y: y,
        })
      : {
          x: x,
          y: y,
        };

  x = _ref3.x;
  y = _ref3.y;
  var hasX = offsets.hasOwnProperty("x");
  var hasY = offsets.hasOwnProperty("y");
  var sideX = left;
  var sideY = top;
  var win = window;

  if (adaptive) {
    var offsetParent = getOffsetParent(popper);
    var heightProp = "clientHeight";
    var widthProp = "clientWidth";

    if (offsetParent === getWindow(popper)) {
      offsetParent = getDocumentElement(popper);

      if (
        getComputedStyle(offsetParent).position !== "static" &&
        position === "absolute"
      ) {
        heightProp = "scrollHeight";
        widthProp = "scrollWidth";
      }
    } // $FlowFixMe[incompatible-cast]: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it

    offsetParent = offsetParent;

    if (
      placement === top ||
      ((placement === left || placement === right) && variation === end)
    ) {
      sideY = bottom;
      var offsetY =
        isFixed && offsetParent === win && win.visualViewport
          ? win.visualViewport.height // $FlowFixMe[prop-missing]
          : offsetParent[heightProp];
      y -= offsetY - popperRect.height;
      y *= gpuAcceleration ? 1 : -1;
    }

    if (
      placement === left ||
      ((placement === top || placement === bottom) && variation === end)
    ) {
      sideX = right;
      var offsetX =
        isFixed && offsetParent === win && win.visualViewport
          ? win.visualViewport.width // $FlowFixMe[prop-missing]
          : offsetParent[widthProp];
      x -= offsetX - popperRect.width;
      x *= gpuAcceleration ? 1 : -1;
    }
  }

  var commonStyles = Object.assign(
    {
      position: position,
    },
    adaptive && unsetSides
  );

  var _ref4 =
    roundOffsets === true
      ? roundOffsetsByDPR({
          x: x,
          y: y,
        })
      : {
          x: x,
          y: y,
        };

  x = _ref4.x;
  y = _ref4.y;

  if (gpuAcceleration) {
    var _Object$assign;

    return Object.assign(
      {},
      commonStyles,
      ((_Object$assign = {}),
      (_Object$assign[sideY] = hasY ? "0" : ""),
      (_Object$assign[sideX] = hasX ? "0" : ""),
      (_Object$assign.transform =
        (win.devicePixelRatio || 1) <= 1
          ? "translate(" + x + "px, " + y + "px)"
          : "translate3d(" + x + "px, " + y + "px, 0)"),
      _Object$assign)
    );
  }

  return Object.assign(
    {},
    commonStyles,
    ((_Object$assign2 = {}),
    (_Object$assign2[sideY] = hasY ? y + "px" : ""),
    (_Object$assign2[sideX] = hasX ? x + "px" : ""),
    (_Object$assign2.transform = ""),
    _Object$assign2)
  );
}

function computeStyles(_ref5) {
  var state = _ref5.state,
    options = _ref5.options;
  var _options$gpuAccelerat = options.gpuAcceleration,
    gpuAcceleration =
      _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat,
    _options$adaptive = options.adaptive,
    adaptive = _options$adaptive === void 0 ? true : _options$adaptive,
    _options$roundOffsets = options.roundOffsets,
    roundOffsets =
      _options$roundOffsets === void 0 ? true : _options$roundOffsets;

  if (process.env.NODE_ENV !== "production") {
    var transitionProperty =
      getComputedStyle(state.elements.popper).transitionProperty || "";

    if (
      adaptive &&
      ["transform", "top", "right", "bottom", "left"].some(function (property) {
        return transitionProperty.indexOf(property) >= 0;
      })
    ) {
      console.warn(
        [
          "Popper: Detected CSS transitions on at least one of the following",
          'CSS properties: "transform", "top", "right", "bottom", "left".',
          "\n\n",
          'Disable the "computeStyles" modifier\'s `adaptive` option to allow',
          "for smooth transitions, or remove these properties from the CSS",
          "transition declaration on the popper element if only transitioning",
          "opacity or background-color for example.",
          "\n\n",
          "We recommend using the popper element as a wrapper around an inner",
          "element that can have any CSS property transitioned for animations.",
        ].join(" ")
      );
    }
  }

  var commonStyles = {
    placement: getBasePlacement(state.placement),
    variation: getVariation(state.placement),
    popper: state.elements.popper,
    popperRect: state.rects.popper,
    gpuAcceleration: gpuAcceleration,
    isFixed: state.options.strategy === "fixed",
  };

  if (state.modifiersData.popperOffsets != null) {
    state.styles.popper = Object.assign(
      {},
      state.styles.popper,
      mapToStyles(
        Object.assign({}, commonStyles, {
          offsets: state.modifiersData.popperOffsets,
          position: state.options.strategy,
          adaptive: adaptive,
          roundOffsets: roundOffsets,
        })
      )
    );
  }

  if (state.modifiersData.arrow != null) {
    state.styles.arrow = Object.assign(
      {},
      state.styles.arrow,
      mapToStyles(
        Object.assign({}, commonStyles, {
          offsets: state.modifiersData.arrow,
          position: "absolute",
          adaptive: false,
          roundOffsets: roundOffsets,
        })
      )
    );
  }

  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    "data-popper-placement": state.placement,
  });
} // eslint-disable-next-line import/no-unused-modules

var computeStyles$1 = {
  name: "computeStyles",
  enabled: true,
  phase: "beforeWrite",
  fn: computeStyles,
  data: {},
};

var passive = {
  passive: true,
};

function effect(_ref) {
  var state = _ref.state,
    instance = _ref.instance,
    options = _ref.options;
  var _options$scroll = options.scroll,
    scroll = _options$scroll === void 0 ? true : _options$scroll,
    _options$resize = options.resize,
    resize = _options$resize === void 0 ? true : _options$resize;
  var window = getWindow(state.elements.popper);
  var scrollParents = [].concat(
    state.scrollParents.reference,
    state.scrollParents.popper
  );

  if (scroll) {
    scrollParents.forEach(function (scrollParent) {
      scrollParent.addEventListener("scroll", instance.update, passive);
    });
  }

  if (resize) {
    window.addEventListener("resize", instance.update, passive);
  }

  return function () {
    if (scroll) {
      scrollParents.forEach(function (scrollParent) {
        scrollParent.removeEventListener("scroll", instance.update, passive);
      });
    }

    if (resize) {
      window.removeEventListener("resize", instance.update, passive);
    }
  };
} // eslint-disable-next-line import/no-unused-modules

var eventListeners = {
  name: "eventListeners",
  enabled: true,
  phase: "write",
  fn: function fn() {},
  effect: effect,
  data: {},
};

var hash$1 = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom",
};
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, function (matched) {
    return hash$1[matched];
  });
}

var hash = {
  start: "end",
  end: "start",
};
function getOppositeVariationPlacement(placement) {
  return placement.replace(/start|end/g, function (matched) {
    return hash[matched];
  });
}

function getWindowScroll(node) {
  var win = getWindow(node);
  var scrollLeft = win.pageXOffset;
  var scrollTop = win.pageYOffset;
  return {
    scrollLeft: scrollLeft,
    scrollTop: scrollTop,
  };
}

function getWindowScrollBarX(element) {
  // If <html> has a CSS width greater than the viewport, then this will be
  // incorrect for RTL.
  // Popper 1 is broken in this case and never had a bug report so let's assume
  // it's not an issue. I don't think anyone ever specifies width on <html>
  // anyway.
  // Browsers where the left scrollbar doesn't cause an issue report `0` for
  // this (e.g. Edge 2019, IE11, Safari)
  return (
    getBoundingClientRect(getDocumentElement(element)).left +
    getWindowScroll(element).scrollLeft
  );
}

function getViewportRect(element, strategy) {
  var win = getWindow(element);
  var html = getDocumentElement(element);
  var visualViewport = win.visualViewport;
  var width = html.clientWidth;
  var height = html.clientHeight;
  var x = 0;
  var y = 0;

  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    var layoutViewport = isLayoutViewport();

    if (layoutViewport || (!layoutViewport && strategy === "fixed")) {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }

  return {
    width: width,
    height: height,
    x: x + getWindowScrollBarX(element),
    y: y,
  };
}

// of the `<html>` and `<body>` rect bounds if horizontally scrollable

function getDocumentRect(element) {
  var _element$ownerDocumen;

  var html = getDocumentElement(element);
  var winScroll = getWindowScroll(element);
  var body =
    (_element$ownerDocumen = element.ownerDocument) == null
      ? void 0
      : _element$ownerDocumen.body;
  var width = max(
    html.scrollWidth,
    html.clientWidth,
    body ? body.scrollWidth : 0,
    body ? body.clientWidth : 0
  );
  var height = max(
    html.scrollHeight,
    html.clientHeight,
    body ? body.scrollHeight : 0,
    body ? body.clientHeight : 0
  );
  var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
  var y = -winScroll.scrollTop;

  if (getComputedStyle(body || html).direction === "rtl") {
    x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
  }

  return {
    width: width,
    height: height,
    x: x,
    y: y,
  };
}

function isScrollParent(element) {
  // Firefox wants us to check `-x` and `-y` variations as well
  var _getComputedStyle = getComputedStyle(element),
    overflow = _getComputedStyle.overflow,
    overflowX = _getComputedStyle.overflowX,
    overflowY = _getComputedStyle.overflowY;

  return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
}

function getScrollParent(node) {
  if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
    // $FlowFixMe[incompatible-return]: assume body is always available
    return node.ownerDocument.body;
  }

  if (isHTMLElement(node) && isScrollParent(node)) {
    return node;
  }

  return getScrollParent(getParentNode(node));
}

/*
given a DOM element, return the list of all scroll parents, up the list of ancesors
until we get to the top window object. This list is what we attach scroll listeners
to, because if any of these parent elements scroll, we'll need to re-calculate the
reference element's position.
*/

function listScrollParents(element, list) {
  var _element$ownerDocumen;

  if (list === void 0) {
    list = [];
  }

  var scrollParent = getScrollParent(element);
  var isBody =
    scrollParent ===
    ((_element$ownerDocumen = element.ownerDocument) == null
      ? void 0
      : _element$ownerDocumen.body);
  var win = getWindow(scrollParent);
  var target = isBody
    ? [win].concat(
        win.visualViewport || [],
        isScrollParent(scrollParent) ? scrollParent : []
      )
    : scrollParent;
  var updatedList = list.concat(target);
  return isBody
    ? updatedList // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
    : updatedList.concat(listScrollParents(getParentNode(target)));
}

function rectToClientRect(rect) {
  return Object.assign({}, rect, {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
  });
}

function getInnerBoundingClientRect(element, strategy) {
  var rect = getBoundingClientRect(element, false, strategy === "fixed");
  rect.top = rect.top + element.clientTop;
  rect.left = rect.left + element.clientLeft;
  rect.bottom = rect.top + element.clientHeight;
  rect.right = rect.left + element.clientWidth;
  rect.width = element.clientWidth;
  rect.height = element.clientHeight;
  rect.x = rect.left;
  rect.y = rect.top;
  return rect;
}

function getClientRectFromMixedType(element, clippingParent, strategy) {
  return clippingParent === viewport
    ? rectToClientRect(getViewportRect(element, strategy))
    : isElement(clippingParent)
    ? getInnerBoundingClientRect(clippingParent, strategy)
    : rectToClientRect(getDocumentRect(getDocumentElement(element)));
} // A "clipping parent" is an overflowable container with the characteristic of
// clipping (or hiding) overflowing elements with a position different from
// `initial`

function getClippingParents(element) {
  var clippingParents = listScrollParents(getParentNode(element));
  var canEscapeClipping =
    ["absolute", "fixed"].indexOf(getComputedStyle(element).position) >= 0;
  var clipperElement =
    canEscapeClipping && isHTMLElement(element)
      ? getOffsetParent(element)
      : element;

  if (!isElement(clipperElement)) {
    return [];
  } // $FlowFixMe[incompatible-return]: https://github.com/facebook/flow/issues/1414

  return clippingParents.filter(function (clippingParent) {
    return (
      isElement(clippingParent) &&
      contains(clippingParent, clipperElement) &&
      getNodeName(clippingParent) !== "body"
    );
  });
} // Gets the maximum area that the element is visible in due to any number of
// clipping parents

function getClippingRect(element, boundary, rootBoundary, strategy) {
  var mainClippingParents =
    boundary === "clippingParents"
      ? getClippingParents(element)
      : [].concat(boundary);
  var clippingParents = [].concat(mainClippingParents, [rootBoundary]);
  var firstClippingParent = clippingParents[0];
  var clippingRect = clippingParents.reduce(function (accRect, clippingParent) {
    var rect = getClientRectFromMixedType(element, clippingParent, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromMixedType(element, firstClippingParent, strategy));
  clippingRect.width = clippingRect.right - clippingRect.left;
  clippingRect.height = clippingRect.bottom - clippingRect.top;
  clippingRect.x = clippingRect.left;
  clippingRect.y = clippingRect.top;
  return clippingRect;
}

function computeOffsets(_ref) {
  var reference = _ref.reference,
    element = _ref.element,
    placement = _ref.placement;
  var basePlacement = placement ? getBasePlacement(placement) : null;
  var variation = placement ? getVariation(placement) : null;
  var commonX = reference.x + reference.width / 2 - element.width / 2;
  var commonY = reference.y + reference.height / 2 - element.height / 2;
  var offsets;

  switch (basePlacement) {
    case top:
      offsets = {
        x: commonX,
        y: reference.y - element.height,
      };
      break;

    case bottom:
      offsets = {
        x: commonX,
        y: reference.y + reference.height,
      };
      break;

    case right:
      offsets = {
        x: reference.x + reference.width,
        y: commonY,
      };
      break;

    case left:
      offsets = {
        x: reference.x - element.width,
        y: commonY,
      };
      break;

    default:
      offsets = {
        x: reference.x,
        y: reference.y,
      };
  }

  var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;

  if (mainAxis != null) {
    var len = mainAxis === "y" ? "height" : "width";

    switch (variation) {
      case start:
        offsets[mainAxis] =
          offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
        break;

      case end:
        offsets[mainAxis] =
          offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
        break;
    }
  }

  return offsets;
}

function detectOverflow(state, options) {
  if (options === void 0) {
    options = {};
  }

  var _options = options,
    _options$placement = _options.placement,
    placement =
      _options$placement === void 0 ? state.placement : _options$placement,
    _options$strategy = _options.strategy,
    strategy =
      _options$strategy === void 0 ? state.strategy : _options$strategy,
    _options$boundary = _options.boundary,
    boundary =
      _options$boundary === void 0 ? clippingParents : _options$boundary,
    _options$rootBoundary = _options.rootBoundary,
    rootBoundary =
      _options$rootBoundary === void 0 ? viewport : _options$rootBoundary,
    _options$elementConte = _options.elementContext,
    elementContext =
      _options$elementConte === void 0 ? popper : _options$elementConte,
    _options$altBoundary = _options.altBoundary,
    altBoundary =
      _options$altBoundary === void 0 ? false : _options$altBoundary,
    _options$padding = _options.padding,
    padding = _options$padding === void 0 ? 0 : _options$padding;
  var paddingObject = mergePaddingObject(
    typeof padding !== "number"
      ? padding
      : expandToHashMap(padding, basePlacements)
  );
  var altContext = elementContext === popper ? reference : popper;
  var popperRect = state.rects.popper;
  var element = state.elements[altBoundary ? altContext : elementContext];
  var clippingClientRect = getClippingRect(
    isElement(element)
      ? element
      : element.contextElement || getDocumentElement(state.elements.popper),
    boundary,
    rootBoundary,
    strategy
  );
  var referenceClientRect = getBoundingClientRect(state.elements.reference);
  var popperOffsets = computeOffsets({
    reference: referenceClientRect,
    element: popperRect,
    strategy: "absolute",
    placement: placement,
  });
  var popperClientRect = rectToClientRect(
    Object.assign({}, popperRect, popperOffsets)
  );
  var elementClientRect =
    elementContext === popper ? popperClientRect : referenceClientRect; // positive = overflowing the clipping rect
  // 0 or negative = within the clipping rect

  var overflowOffsets = {
    top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
    bottom:
      elementClientRect.bottom -
      clippingClientRect.bottom +
      paddingObject.bottom,
    left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
    right:
      elementClientRect.right - clippingClientRect.right + paddingObject.right,
  };
  var offsetData = state.modifiersData.offset; // Offsets can be applied only to the popper element

  if (elementContext === popper && offsetData) {
    var offset = offsetData[placement];
    Object.keys(overflowOffsets).forEach(function (key) {
      var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
      var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
      overflowOffsets[key] += offset[axis] * multiply;
    });
  }

  return overflowOffsets;
}

function computeAutoPlacement(state, options) {
  if (options === void 0) {
    options = {};
  }

  var _options = options,
    placement = _options.placement,
    boundary = _options.boundary,
    rootBoundary = _options.rootBoundary,
    padding = _options.padding,
    flipVariations = _options.flipVariations,
    _options$allowedAutoP = _options.allowedAutoPlacements,
    allowedAutoPlacements =
      _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
  var variation = getVariation(placement);
  var placements$1 = variation
    ? flipVariations
      ? variationPlacements
      : variationPlacements.filter(function (placement) {
          return getVariation(placement) === variation;
        })
    : basePlacements;
  var allowedPlacements = placements$1.filter(function (placement) {
    return allowedAutoPlacements.indexOf(placement) >= 0;
  });

  if (allowedPlacements.length === 0) {
    allowedPlacements = placements$1;

    if (process.env.NODE_ENV !== "production") {
      console.error(
        [
          "Popper: The `allowedAutoPlacements` option did not allow any",
          "placements. Ensure the `placement` option matches the variation",
          "of the allowed placements.",
          'For example, "auto" cannot be used to allow "bottom-start".',
          'Use "auto-start" instead.',
        ].join(" ")
      );
    }
  } // $FlowFixMe[incompatible-type]: Flow seems to have problems with two array unions...

  var overflows = allowedPlacements.reduce(function (acc, placement) {
    acc[placement] = detectOverflow(state, {
      placement: placement,
      boundary: boundary,
      rootBoundary: rootBoundary,
      padding: padding,
    })[getBasePlacement(placement)];
    return acc;
  }, {});
  return Object.keys(overflows).sort(function (a, b) {
    return overflows[a] - overflows[b];
  });
}

function getExpandedFallbackPlacements(placement) {
  if (getBasePlacement(placement) === auto) {
    return [];
  }

  var oppositePlacement = getOppositePlacement(placement);
  return [
    getOppositeVariationPlacement(placement),
    oppositePlacement,
    getOppositeVariationPlacement(oppositePlacement),
  ];
}

function flip(_ref) {
  var state = _ref.state,
    options = _ref.options,
    name = _ref.name;

  if (state.modifiersData[name]._skip) {
    return;
  }

  var _options$mainAxis = options.mainAxis,
    checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
    _options$altAxis = options.altAxis,
    checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis,
    specifiedFallbackPlacements = options.fallbackPlacements,
    padding = options.padding,
    boundary = options.boundary,
    rootBoundary = options.rootBoundary,
    altBoundary = options.altBoundary,
    _options$flipVariatio = options.flipVariations,
    flipVariations =
      _options$flipVariatio === void 0 ? true : _options$flipVariatio,
    allowedAutoPlacements = options.allowedAutoPlacements;
  var preferredPlacement = state.options.placement;
  var basePlacement = getBasePlacement(preferredPlacement);
  var isBasePlacement = basePlacement === preferredPlacement;
  var fallbackPlacements =
    specifiedFallbackPlacements ||
    (isBasePlacement || !flipVariations
      ? [getOppositePlacement(preferredPlacement)]
      : getExpandedFallbackPlacements(preferredPlacement));
  var placements = [preferredPlacement]
    .concat(fallbackPlacements)
    .reduce(function (acc, placement) {
      return acc.concat(
        getBasePlacement(placement) === auto
          ? computeAutoPlacement(state, {
              placement: placement,
              boundary: boundary,
              rootBoundary: rootBoundary,
              padding: padding,
              flipVariations: flipVariations,
              allowedAutoPlacements: allowedAutoPlacements,
            })
          : placement
      );
    }, []);
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var checksMap = new Map();
  var makeFallbackChecks = true;
  var firstFittingPlacement = placements[0];

  for (var i = 0; i < placements.length; i++) {
    var placement = placements[i];

    var _basePlacement = getBasePlacement(placement);

    var isStartVariation = getVariation(placement) === start;
    var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
    var len = isVertical ? "width" : "height";
    var overflow = detectOverflow(state, {
      placement: placement,
      boundary: boundary,
      rootBoundary: rootBoundary,
      altBoundary: altBoundary,
      padding: padding,
    });
    var mainVariationSide = isVertical
      ? isStartVariation
        ? right
        : left
      : isStartVariation
      ? bottom
      : top;

    if (referenceRect[len] > popperRect[len]) {
      mainVariationSide = getOppositePlacement(mainVariationSide);
    }

    var altVariationSide = getOppositePlacement(mainVariationSide);
    var checks = [];

    if (checkMainAxis) {
      checks.push(overflow[_basePlacement] <= 0);
    }

    if (checkAltAxis) {
      checks.push(
        overflow[mainVariationSide] <= 0,
        overflow[altVariationSide] <= 0
      );
    }

    if (
      checks.every(function (check) {
        return check;
      })
    ) {
      firstFittingPlacement = placement;
      makeFallbackChecks = false;
      break;
    }

    checksMap.set(placement, checks);
  }

  if (makeFallbackChecks) {
    // `2` may be desired in some cases – research later
    var numberOfChecks = flipVariations ? 3 : 1;

    var _loop = function _loop(_i) {
      var fittingPlacement = placements.find(function (placement) {
        var checks = checksMap.get(placement);

        if (checks) {
          return checks.slice(0, _i).every(function (check) {
            return check;
          });
        }
      });

      if (fittingPlacement) {
        firstFittingPlacement = fittingPlacement;
        return "break";
      }
    };

    for (var _i = numberOfChecks; _i > 0; _i--) {
      var _ret = _loop(_i);

      if (_ret === "break") break;
    }
  }

  if (state.placement !== firstFittingPlacement) {
    state.modifiersData[name]._skip = true;
    state.placement = firstFittingPlacement;
    state.reset = true;
  }
} // eslint-disable-next-line import/no-unused-modules

var flip$1 = {
  name: "flip",
  enabled: true,
  phase: "main",
  fn: flip,
  requiresIfExists: ["offset"],
  data: {
    _skip: false,
  },
};

function getSideOffsets(overflow, rect, preventedOffsets) {
  if (preventedOffsets === void 0) {
    preventedOffsets = {
      x: 0,
      y: 0,
    };
  }

  return {
    top: overflow.top - rect.height - preventedOffsets.y,
    right: overflow.right - rect.width + preventedOffsets.x,
    bottom: overflow.bottom - rect.height + preventedOffsets.y,
    left: overflow.left - rect.width - preventedOffsets.x,
  };
}

function isAnySideFullyClipped(overflow) {
  return [top, right, bottom, left].some(function (side) {
    return overflow[side] >= 0;
  });
}

function hide(_ref) {
  var state = _ref.state,
    name = _ref.name;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var preventedOffsets = state.modifiersData.preventOverflow;
  var referenceOverflow = detectOverflow(state, {
    elementContext: "reference",
  });
  var popperAltOverflow = detectOverflow(state, {
    altBoundary: true,
  });
  var referenceClippingOffsets = getSideOffsets(
    referenceOverflow,
    referenceRect
  );
  var popperEscapeOffsets = getSideOffsets(
    popperAltOverflow,
    popperRect,
    preventedOffsets
  );
  var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
  var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
  state.modifiersData[name] = {
    referenceClippingOffsets: referenceClippingOffsets,
    popperEscapeOffsets: popperEscapeOffsets,
    isReferenceHidden: isReferenceHidden,
    hasPopperEscaped: hasPopperEscaped,
  };
  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    "data-popper-reference-hidden": isReferenceHidden,
    "data-popper-escaped": hasPopperEscaped,
  });
} // eslint-disable-next-line import/no-unused-modules

var hide$1 = {
  name: "hide",
  enabled: true,
  phase: "main",
  requiresIfExists: ["preventOverflow"],
  fn: hide,
};

function distanceAndSkiddingToXY(placement, rects, offset) {
  var basePlacement = getBasePlacement(placement);
  var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;

  var _ref =
      typeof offset === "function"
        ? offset(
            Object.assign({}, rects, {
              placement: placement,
            })
          )
        : offset,
    skidding = _ref[0],
    distance = _ref[1];

  skidding = skidding || 0;
  distance = (distance || 0) * invertDistance;
  return [left, right].indexOf(basePlacement) >= 0
    ? {
        x: distance,
        y: skidding,
      }
    : {
        x: skidding,
        y: distance,
      };
}

function offset(_ref2) {
  var state = _ref2.state,
    options = _ref2.options,
    name = _ref2.name;
  var _options$offset = options.offset,
    offset = _options$offset === void 0 ? [0, 0] : _options$offset;
  var data = placements.reduce(function (acc, placement) {
    acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
    return acc;
  }, {});
  var _data$state$placement = data[state.placement],
    x = _data$state$placement.x,
    y = _data$state$placement.y;

  if (state.modifiersData.popperOffsets != null) {
    state.modifiersData.popperOffsets.x += x;
    state.modifiersData.popperOffsets.y += y;
  }

  state.modifiersData[name] = data;
} // eslint-disable-next-line import/no-unused-modules

var offset$1 = {
  name: "offset",
  enabled: true,
  phase: "main",
  requires: ["popperOffsets"],
  fn: offset,
};

function popperOffsets(_ref) {
  var state = _ref.state,
    name = _ref.name;
  // Offsets are the actual position the popper needs to have to be
  // properly positioned near its reference element
  // This is the most basic placement, and will be adjusted by
  // the modifiers in the next step
  state.modifiersData[name] = computeOffsets({
    reference: state.rects.reference,
    element: state.rects.popper,
    strategy: "absolute",
    placement: state.placement,
  });
} // eslint-disable-next-line import/no-unused-modules

var popperOffsets$1 = {
  name: "popperOffsets",
  enabled: true,
  phase: "read",
  fn: popperOffsets,
  data: {},
};

function getAltAxis(axis) {
  return axis === "x" ? "y" : "x";
}

function preventOverflow(_ref) {
  var state = _ref.state,
    options = _ref.options,
    name = _ref.name;
  var _options$mainAxis = options.mainAxis,
    checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
    _options$altAxis = options.altAxis,
    checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis,
    boundary = options.boundary,
    rootBoundary = options.rootBoundary,
    altBoundary = options.altBoundary,
    padding = options.padding,
    _options$tether = options.tether,
    tether = _options$tether === void 0 ? true : _options$tether,
    _options$tetherOffset = options.tetherOffset,
    tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
  var overflow = detectOverflow(state, {
    boundary: boundary,
    rootBoundary: rootBoundary,
    padding: padding,
    altBoundary: altBoundary,
  });
  var basePlacement = getBasePlacement(state.placement);
  var variation = getVariation(state.placement);
  var isBasePlacement = !variation;
  var mainAxis = getMainAxisFromPlacement(basePlacement);
  var altAxis = getAltAxis(mainAxis);
  var popperOffsets = state.modifiersData.popperOffsets;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var tetherOffsetValue =
    typeof tetherOffset === "function"
      ? tetherOffset(
          Object.assign({}, state.rects, {
            placement: state.placement,
          })
        )
      : tetherOffset;
  var normalizedTetherOffsetValue =
    typeof tetherOffsetValue === "number"
      ? {
          mainAxis: tetherOffsetValue,
          altAxis: tetherOffsetValue,
        }
      : Object.assign(
          {
            mainAxis: 0,
            altAxis: 0,
          },
          tetherOffsetValue
        );
  var offsetModifierState = state.modifiersData.offset
    ? state.modifiersData.offset[state.placement]
    : null;
  var data = {
    x: 0,
    y: 0,
  };

  if (!popperOffsets) {
    return;
  }

  if (checkMainAxis) {
    var _offsetModifierState$;

    var mainSide = mainAxis === "y" ? top : left;
    var altSide = mainAxis === "y" ? bottom : right;
    var len = mainAxis === "y" ? "height" : "width";
    var offset = popperOffsets[mainAxis];
    var min$1 = offset + overflow[mainSide];
    var max$1 = offset - overflow[altSide];
    var additive = tether ? -popperRect[len] / 2 : 0;
    var minLen = variation === start ? referenceRect[len] : popperRect[len];
    var maxLen = variation === start ? -popperRect[len] : -referenceRect[len]; // We need to include the arrow in the calculation so the arrow doesn't go
    // outside the reference bounds

    var arrowElement = state.elements.arrow;
    var arrowRect =
      tether && arrowElement
        ? getLayoutRect(arrowElement)
        : {
            width: 0,
            height: 0,
          };
    var arrowPaddingObject = state.modifiersData["arrow#persistent"]
      ? state.modifiersData["arrow#persistent"].padding
      : getFreshSideObject();
    var arrowPaddingMin = arrowPaddingObject[mainSide];
    var arrowPaddingMax = arrowPaddingObject[altSide]; // If the reference length is smaller than the arrow length, we don't want
    // to include its full size in the calculation. If the reference is small
    // and near the edge of a boundary, the popper can overflow even if the
    // reference is not overflowing as well (e.g. virtual elements with no
    // width or height)

    var arrowLen = within(0, referenceRect[len], arrowRect[len]);
    var minOffset = isBasePlacement
      ? referenceRect[len] / 2 -
        additive -
        arrowLen -
        arrowPaddingMin -
        normalizedTetherOffsetValue.mainAxis
      : minLen -
        arrowLen -
        arrowPaddingMin -
        normalizedTetherOffsetValue.mainAxis;
    var maxOffset = isBasePlacement
      ? -referenceRect[len] / 2 +
        additive +
        arrowLen +
        arrowPaddingMax +
        normalizedTetherOffsetValue.mainAxis
      : maxLen +
        arrowLen +
        arrowPaddingMax +
        normalizedTetherOffsetValue.mainAxis;
    var arrowOffsetParent =
      state.elements.arrow && getOffsetParent(state.elements.arrow);
    var clientOffset = arrowOffsetParent
      ? mainAxis === "y"
        ? arrowOffsetParent.clientTop || 0
        : arrowOffsetParent.clientLeft || 0
      : 0;
    var offsetModifierValue =
      (_offsetModifierState$ =
        offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) !=
      null
        ? _offsetModifierState$
        : 0;
    var tetherMin = offset + minOffset - offsetModifierValue - clientOffset;
    var tetherMax = offset + maxOffset - offsetModifierValue;
    var preventedOffset = within(
      tether ? min(min$1, tetherMin) : min$1,
      offset,
      tether ? max(max$1, tetherMax) : max$1
    );
    popperOffsets[mainAxis] = preventedOffset;
    data[mainAxis] = preventedOffset - offset;
  }

  if (checkAltAxis) {
    var _offsetModifierState$2;

    var _mainSide = mainAxis === "x" ? top : left;

    var _altSide = mainAxis === "x" ? bottom : right;

    var _offset = popperOffsets[altAxis];

    var _len = altAxis === "y" ? "height" : "width";

    var _min = _offset + overflow[_mainSide];

    var _max = _offset - overflow[_altSide];

    var isOriginSide = [top, left].indexOf(basePlacement) !== -1;

    var _offsetModifierValue =
      (_offsetModifierState$2 =
        offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) !=
      null
        ? _offsetModifierState$2
        : 0;

    var _tetherMin = isOriginSide
      ? _min
      : _offset -
        referenceRect[_len] -
        popperRect[_len] -
        _offsetModifierValue +
        normalizedTetherOffsetValue.altAxis;

    var _tetherMax = isOriginSide
      ? _offset +
        referenceRect[_len] +
        popperRect[_len] -
        _offsetModifierValue -
        normalizedTetherOffsetValue.altAxis
      : _max;

    var _preventedOffset =
      tether && isOriginSide
        ? withinMaxClamp(_tetherMin, _offset, _tetherMax)
        : within(
            tether ? _tetherMin : _min,
            _offset,
            tether ? _tetherMax : _max
          );

    popperOffsets[altAxis] = _preventedOffset;
    data[altAxis] = _preventedOffset - _offset;
  }

  state.modifiersData[name] = data;
} // eslint-disable-next-line import/no-unused-modules

var preventOverflow$1 = {
  name: "preventOverflow",
  enabled: true,
  phase: "main",
  fn: preventOverflow,
  requiresIfExists: ["offset"],
};

function getHTMLElementScroll(element) {
  return {
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop,
  };
}

function getNodeScroll(node) {
  if (node === getWindow(node) || !isHTMLElement(node)) {
    return getWindowScroll(node);
  } else {
    return getHTMLElementScroll(node);
  }
}

function isElementScaled(element) {
  var rect = element.getBoundingClientRect();
  var scaleX = round(rect.width) / element.offsetWidth || 1;
  var scaleY = round(rect.height) / element.offsetHeight || 1;
  return scaleX !== 1 || scaleY !== 1;
} // Returns the composite rect of an element relative to its offsetParent.
// Composite means it takes into account transforms as well as layout.

function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
  if (isFixed === void 0) {
    isFixed = false;
  }

  var isOffsetParentAnElement = isHTMLElement(offsetParent);
  var offsetParentIsScaled =
    isHTMLElement(offsetParent) && isElementScaled(offsetParent);
  var documentElement = getDocumentElement(offsetParent);
  var rect = getBoundingClientRect(
    elementOrVirtualElement,
    offsetParentIsScaled,
    isFixed
  );
  var scroll = {
    scrollLeft: 0,
    scrollTop: 0,
  };
  var offsets = {
    x: 0,
    y: 0,
  };

  if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
    if (
      getNodeName(offsetParent) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
      isScrollParent(documentElement)
    ) {
      scroll = getNodeScroll(offsetParent);
    }

    if (isHTMLElement(offsetParent)) {
      offsets = getBoundingClientRect(offsetParent, true);
      offsets.x += offsetParent.clientLeft;
      offsets.y += offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }

  return {
    x: rect.left + scroll.scrollLeft - offsets.x,
    y: rect.top + scroll.scrollTop - offsets.y,
    width: rect.width,
    height: rect.height,
  };
}

function order(modifiers) {
  var map = new Map();
  var visited = new Set();
  var result = [];
  modifiers.forEach(function (modifier) {
    map.set(modifier.name, modifier);
  }); // On visiting object, check for its dependencies and visit them recursively

  function sort(modifier) {
    visited.add(modifier.name);
    var requires = [].concat(
      modifier.requires || [],
      modifier.requiresIfExists || []
    );
    requires.forEach(function (dep) {
      if (!visited.has(dep)) {
        var depModifier = map.get(dep);

        if (depModifier) {
          sort(depModifier);
        }
      }
    });
    result.push(modifier);
  }

  modifiers.forEach(function (modifier) {
    if (!visited.has(modifier.name)) {
      // check for visited object
      sort(modifier);
    }
  });
  return result;
}

function orderModifiers(modifiers) {
  // order based on dependencies
  var orderedModifiers = order(modifiers); // order based on phase

  return modifierPhases.reduce(function (acc, phase) {
    return acc.concat(
      orderedModifiers.filter(function (modifier) {
        return modifier.phase === phase;
      })
    );
  }, []);
}

function debounce(fn) {
  var pending;
  return function () {
    if (!pending) {
      pending = new Promise(function (resolve) {
        Promise.resolve().then(function () {
          pending = undefined;
          resolve(fn());
        });
      });
    }

    return pending;
  };
}

function format(str) {
  for (
    var _len = arguments.length,
      args = new Array(_len > 1 ? _len - 1 : 0),
      _key = 1;
    _key < _len;
    _key++
  ) {
    args[_key - 1] = arguments[_key];
  }

  return [].concat(args).reduce(function (p, c) {
    return p.replace(/%s/, c);
  }, str);
}

var INVALID_MODIFIER_ERROR =
  'Popper: modifier "%s" provided an invalid %s property, expected %s but got %s';
var MISSING_DEPENDENCY_ERROR =
  'Popper: modifier "%s" requires "%s", but "%s" modifier is not available';
var VALID_PROPERTIES = [
  "name",
  "enabled",
  "phase",
  "fn",
  "effect",
  "requires",
  "options",
];
function validateModifiers(modifiers) {
  modifiers.forEach(function (modifier) {
    []
      .concat(Object.keys(modifier), VALID_PROPERTIES) // IE11-compatible replacement for `new Set(iterable)`
      .filter(function (value, index, self) {
        return self.indexOf(value) === index;
      })
      .forEach(function (key) {
        switch (key) {
          case "name":
            if (typeof modifier.name !== "string") {
              console.error(
                format(
                  INVALID_MODIFIER_ERROR,
                  String(modifier.name),
                  '"name"',
                  '"string"',
                  '"' + String(modifier.name) + '"'
                )
              );
            }

            break;

          case "enabled":
            if (typeof modifier.enabled !== "boolean") {
              console.error(
                format(
                  INVALID_MODIFIER_ERROR,
                  modifier.name,
                  '"enabled"',
                  '"boolean"',
                  '"' + String(modifier.enabled) + '"'
                )
              );
            }

            break;

          case "phase":
            if (modifierPhases.indexOf(modifier.phase) < 0) {
              console.error(
                format(
                  INVALID_MODIFIER_ERROR,
                  modifier.name,
                  '"phase"',
                  "either " + modifierPhases.join(", "),
                  '"' + String(modifier.phase) + '"'
                )
              );
            }

            break;

          case "fn":
            if (typeof modifier.fn !== "function") {
              console.error(
                format(
                  INVALID_MODIFIER_ERROR,
                  modifier.name,
                  '"fn"',
                  '"function"',
                  '"' + String(modifier.fn) + '"'
                )
              );
            }

            break;

          case "effect":
            if (
              modifier.effect != null &&
              typeof modifier.effect !== "function"
            ) {
              console.error(
                format(
                  INVALID_MODIFIER_ERROR,
                  modifier.name,
                  '"effect"',
                  '"function"',
                  '"' + String(modifier.fn) + '"'
                )
              );
            }

            break;

          case "requires":
            if (
              modifier.requires != null &&
              !Array.isArray(modifier.requires)
            ) {
              console.error(
                format(
                  INVALID_MODIFIER_ERROR,
                  modifier.name,
                  '"requires"',
                  '"array"',
                  '"' + String(modifier.requires) + '"'
                )
              );
            }

            break;

          case "requiresIfExists":
            if (!Array.isArray(modifier.requiresIfExists)) {
              console.error(
                format(
                  INVALID_MODIFIER_ERROR,
                  modifier.name,
                  '"requiresIfExists"',
                  '"array"',
                  '"' + String(modifier.requiresIfExists) + '"'
                )
              );
            }

            break;

          case "options":
          case "data":
            break;

          default:
            console.error(
              'PopperJS: an invalid property has been provided to the "' +
                modifier.name +
                '" modifier, valid properties are ' +
                VALID_PROPERTIES.map(function (s) {
                  return '"' + s + '"';
                }).join(", ") +
                '; but "' +
                key +
                '" was provided.'
            );
        }

        modifier.requires &&
          modifier.requires.forEach(function (requirement) {
            if (
              modifiers.find(function (mod) {
                return mod.name === requirement;
              }) == null
            ) {
              console.error(
                format(
                  MISSING_DEPENDENCY_ERROR,
                  String(modifier.name),
                  requirement,
                  requirement
                )
              );
            }
          });
      });
  });
}

function uniqueBy(arr, fn) {
  var identifiers = new Set();
  return arr.filter(function (item) {
    var identifier = fn(item);

    if (!identifiers.has(identifier)) {
      identifiers.add(identifier);
      return true;
    }
  });
}

function mergeByName(modifiers) {
  var merged = modifiers.reduce(function (merged, current) {
    var existing = merged[current.name];
    merged[current.name] = existing
      ? Object.assign({}, existing, current, {
          options: Object.assign({}, existing.options, current.options),
          data: Object.assign({}, existing.data, current.data),
        })
      : current;
    return merged;
  }, {}); // IE11 does not support Object.values

  return Object.keys(merged).map(function (key) {
    return merged[key];
  });
}

var INVALID_ELEMENT_ERROR =
  "Popper: Invalid reference or popper argument provided. They must be either a DOM element or virtual element.";
var INFINITE_LOOP_ERROR =
  "Popper: An infinite loop in the modifiers cycle has been detected! The cycle has been interrupted to prevent a browser crash.";
var DEFAULT_OPTIONS = {
  placement: "bottom",
  modifiers: [],
  strategy: "absolute",
};

function areValidElements() {
  for (
    var _len = arguments.length, args = new Array(_len), _key = 0;
    _key < _len;
    _key++
  ) {
    args[_key] = arguments[_key];
  }

  return !args.some(function (element) {
    return !(element && typeof element.getBoundingClientRect === "function");
  });
}

function popperGenerator(generatorOptions) {
  if (generatorOptions === void 0) {
    generatorOptions = {};
  }

  var _generatorOptions = generatorOptions,
    _generatorOptions$def = _generatorOptions.defaultModifiers,
    defaultModifiers =
      _generatorOptions$def === void 0 ? [] : _generatorOptions$def,
    _generatorOptions$def2 = _generatorOptions.defaultOptions,
    defaultOptions =
      _generatorOptions$def2 === void 0
        ? DEFAULT_OPTIONS
        : _generatorOptions$def2;
  return function createPopper(reference, popper, options) {
    if (options === void 0) {
      options = defaultOptions;
    }

    var state = {
      placement: "bottom",
      orderedModifiers: [],
      options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
      modifiersData: {},
      elements: {
        reference: reference,
        popper: popper,
      },
      attributes: {},
      styles: {},
    };
    var effectCleanupFns = [];
    var isDestroyed = false;
    var instance = {
      state: state,
      setOptions: function setOptions(setOptionsAction) {
        var options =
          typeof setOptionsAction === "function"
            ? setOptionsAction(state.options)
            : setOptionsAction;
        cleanupModifierEffects();
        state.options = Object.assign(
          {},
          defaultOptions,
          state.options,
          options
        );
        state.scrollParents = {
          reference: isElement(reference)
            ? listScrollParents(reference)
            : reference.contextElement
            ? listScrollParents(reference.contextElement)
            : [],
          popper: listScrollParents(popper),
        }; // Orders the modifiers based on their dependencies and `phase`
        // properties

        var orderedModifiers = orderModifiers(
          mergeByName([].concat(defaultModifiers, state.options.modifiers))
        ); // Strip out disabled modifiers

        state.orderedModifiers = orderedModifiers.filter(function (m) {
          return m.enabled;
        }); // Validate the provided modifiers so that the consumer will get warned
        // if one of the modifiers is invalid for any reason

        if (process.env.NODE_ENV !== "production") {
          var modifiers = uniqueBy(
            [].concat(orderedModifiers, state.options.modifiers),
            function (_ref) {
              var name = _ref.name;
              return name;
            }
          );
          validateModifiers(modifiers);

          if (getBasePlacement(state.options.placement) === auto) {
            var flipModifier = state.orderedModifiers.find(function (_ref2) {
              var name = _ref2.name;
              return name === "flip";
            });

            if (!flipModifier) {
              console.error(
                [
                  'Popper: "auto" placements require the "flip" modifier be',
                  "present and enabled to work.",
                ].join(" ")
              );
            }
          }

          var _getComputedStyle = getComputedStyle(popper),
            marginTop = _getComputedStyle.marginTop,
            marginRight = _getComputedStyle.marginRight,
            marginBottom = _getComputedStyle.marginBottom,
            marginLeft = _getComputedStyle.marginLeft; // We no longer take into account `margins` on the popper, and it can
          // cause bugs with positioning, so we'll warn the consumer

          if (
            [marginTop, marginRight, marginBottom, marginLeft].some(function (
              margin
            ) {
              return parseFloat(margin);
            })
          ) {
            console.warn(
              [
                'Popper: CSS "margin" styles cannot be used to apply padding',
                "between the popper and its reference element or boundary.",
                "To replicate margin, use the `offset` modifier, as well as",
                "the `padding` option in the `preventOverflow` and `flip`",
                "modifiers.",
              ].join(" ")
            );
          }
        }

        runModifierEffects();
        return instance.update();
      },
      // Sync update – it will always be executed, even if not necessary. This
      // is useful for low frequency updates where sync behavior simplifies the
      // logic.
      // For high frequency updates (e.g. `resize` and `scroll` events), always
      // prefer the async Popper#update method
      forceUpdate: function forceUpdate() {
        if (isDestroyed) {
          return;
        }

        var _state$elements = state.elements,
          reference = _state$elements.reference,
          popper = _state$elements.popper; // Don't proceed if `reference` or `popper` are not valid elements
        // anymore

        if (!areValidElements(reference, popper)) {
          if (process.env.NODE_ENV !== "production") {
            console.error(INVALID_ELEMENT_ERROR);
          }

          return;
        } // Store the reference and popper rects to be read by modifiers

        state.rects = {
          reference: getCompositeRect(
            reference,
            getOffsetParent(popper),
            state.options.strategy === "fixed"
          ),
          popper: getLayoutRect(popper),
        }; // Modifiers have the ability to reset the current update cycle. The
        // most common use case for this is the `flip` modifier changing the
        // placement, which then needs to re-run all the modifiers, because the
        // logic was previously ran for the previous placement and is therefore
        // stale/incorrect

        state.reset = false;
        state.placement = state.options.placement; // On each update cycle, the `modifiersData` property for each modifier
        // is filled with the initial data specified by the modifier. This means
        // it doesn't persist and is fresh on each update.
        // To ensure persistent data, use `${name}#persistent`

        state.orderedModifiers.forEach(function (modifier) {
          return (state.modifiersData[modifier.name] = Object.assign(
            {},
            modifier.data
          ));
        });
        var __debug_loops__ = 0;

        for (var index = 0; index < state.orderedModifiers.length; index++) {
          if (process.env.NODE_ENV !== "production") {
            __debug_loops__ += 1;

            if (__debug_loops__ > 100) {
              console.error(INFINITE_LOOP_ERROR);
              break;
            }
          }

          if (state.reset === true) {
            state.reset = false;
            index = -1;
            continue;
          }

          var _state$orderedModifie = state.orderedModifiers[index],
            fn = _state$orderedModifie.fn,
            _state$orderedModifie2 = _state$orderedModifie.options,
            _options =
              _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2,
            name = _state$orderedModifie.name;

          if (typeof fn === "function") {
            state =
              fn({
                state: state,
                options: _options,
                name: name,
                instance: instance,
              }) || state;
          }
        }
      },
      // Async and optimistically optimized update – it will not be executed if
      // not necessary (debounced to run at most once-per-tick)
      update: debounce(function () {
        return new Promise(function (resolve) {
          instance.forceUpdate();
          resolve(state);
        });
      }),
      destroy: function destroy() {
        cleanupModifierEffects();
        isDestroyed = true;
      },
    };

    if (!areValidElements(reference, popper)) {
      if (process.env.NODE_ENV !== "production") {
        console.error(INVALID_ELEMENT_ERROR);
      }

      return instance;
    }

    instance.setOptions(options).then(function (state) {
      if (!isDestroyed && options.onFirstUpdate) {
        options.onFirstUpdate(state);
      }
    }); // Modifiers have the ability to execute arbitrary code before the first
    // update cycle runs. They will be executed in the same order as the update
    // cycle. This is useful when a modifier adds some persistent data that
    // other modifiers need to use, but the modifier is run after the dependent
    // one.

    function runModifierEffects() {
      state.orderedModifiers.forEach(function (_ref3) {
        var name = _ref3.name,
          _ref3$options = _ref3.options,
          options = _ref3$options === void 0 ? {} : _ref3$options,
          effect = _ref3.effect;

        if (typeof effect === "function") {
          var cleanupFn = effect({
            state: state,
            name: name,
            instance: instance,
            options: options,
          });

          var noopFn = function noopFn() {};

          effectCleanupFns.push(cleanupFn || noopFn);
        }
      });
    }

    function cleanupModifierEffects() {
      effectCleanupFns.forEach(function (fn) {
        return fn();
      });
      effectCleanupFns = [];
    }

    return instance;
  };
}

var defaultModifiers = [
  eventListeners,
  popperOffsets$1,
  computeStyles$1,
  applyStyles$1,
  offset$1,
  flip$1,
  preventOverflow$1,
  arrow$1,
  hide$1,
];
var createPopper = /*#__PURE__*/ popperGenerator({
  defaultModifiers: defaultModifiers,
}); // eslint-disable-next-line import/no-unused-modules

var C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_hyperscriptAttributeToProperty =
  attributeToProperty;

var transform = {
  class: "className",
  for: "htmlFor",
  "http-equiv": "httpEquiv",
};

function attributeToProperty(h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr];
        delete attrs[attr];
      }
    }
    return h(tagName, attrs, children);
  };
}

var VAR = 0,
  TEXT = 1,
  OPEN = 2,
  CLOSE = 3,
  ATTR = 4;
var ATTR_KEY = 5,
  ATTR_KEY_W = 6;
var ATTR_VALUE_W = 7,
  ATTR_VALUE = 8;
var ATTR_VALUE_SQ = 9,
  ATTR_VALUE_DQ = 10;
var ATTR_EQ = 11,
  ATTR_BREAK = 12;
var COMMENT = 13;

var C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_hyperx =
  function (h, opts) {
    if (!opts) opts = {};
    var concat =
      opts.concat ||
      function (a, b) {
        return String(a) + String(b);
      };
    if (opts.attrToProp !== false) {
      h =
        C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_hyperscriptAttributeToProperty(
          h
        );
    }

    return function (strings) {
      var state = TEXT,
        reg = "";
      var arglen = arguments.length;
      var parts = [];

      for (var i = 0; i < strings.length; i++) {
        if (i < arglen - 1) {
          var arg = arguments[i + 1];
          var p = parse(strings[i]);
          var xstate = state;
          if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE;
          if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE;
          if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE;
          if (xstate === ATTR) xstate = ATTR_KEY;
          if (xstate === OPEN) {
            if (reg === "/") {
              p.push([OPEN, "/", arg]);
              reg = "";
            } else {
              p.push([OPEN, arg]);
            }
          } else if (xstate === COMMENT && opts.comments) {
            reg += String(arg);
          } else if (xstate !== COMMENT) {
            p.push([VAR, xstate, arg]);
          }
          parts.push.apply(parts, p);
        } else parts.push.apply(parts, parse(strings[i]));
      }

      var tree = [null, {}, []];
      var stack = [[tree, -1]];
      for (var i = 0; i < parts.length; i++) {
        var cur = stack[stack.length - 1][0];
        var p = parts[i],
          s = p[0];
        if (s === OPEN && /^\//.test(p[1])) {
          var ix = stack[stack.length - 1][1];
          if (stack.length > 1) {
            stack.pop();
            stack[stack.length - 1][0][2][ix] = h(
              cur[0],
              cur[1],
              cur[2].length ? cur[2] : undefined
            );
          }
        } else if (s === OPEN) {
          var c = [p[1], {}, []];
          cur[2].push(c);
          stack.push([c, cur[2].length - 1]);
        } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
          var key = "";
          var copyKey;
          for (; i < parts.length; i++) {
            if (parts[i][0] === ATTR_KEY) {
              key = concat(key, parts[i][1]);
            } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
              if (typeof parts[i][2] === "object" && !key) {
                for (copyKey in parts[i][2]) {
                  if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                    cur[1][copyKey] = parts[i][2][copyKey];
                  }
                }
              } else {
                key = concat(key, parts[i][2]);
              }
            } else break;
          }
          if (parts[i][0] === ATTR_EQ) i++;
          var j = i;
          for (; i < parts.length; i++) {
            if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
              if (!cur[1][key]) cur[1][key] = strfn(parts[i][1]);
              else
                parts[i][1] === "" ||
                  (cur[1][key] = concat(cur[1][key], parts[i][1]));
            } else if (
              parts[i][0] === VAR &&
              (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)
            ) {
              if (!cur[1][key]) cur[1][key] = strfn(parts[i][2]);
              else
                parts[i][2] === "" ||
                  (cur[1][key] = concat(cur[1][key], parts[i][2]));
            } else {
              if (
                key.length &&
                !cur[1][key] &&
                i === j &&
                (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)
              ) {
                // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
                // empty string is falsy, not well behaved value in browser
                cur[1][key] = key.toLowerCase();
              }
              if (parts[i][0] === CLOSE) {
                i--;
              }
              break;
            }
          }
        } else if (s === ATTR_KEY) {
          cur[1][p[1]] = true;
        } else if (s === VAR && p[1] === ATTR_KEY) {
          cur[1][p[2]] = true;
        } else if (s === CLOSE) {
          if (selfClosing(cur[0]) && stack.length) {
            var ix = stack[stack.length - 1][1];
            stack.pop();
            stack[stack.length - 1][0][2][ix] = h(
              cur[0],
              cur[1],
              cur[2].length ? cur[2] : undefined
            );
          }
        } else if (s === VAR && p[1] === TEXT) {
          if (p[2] === undefined || p[2] === null) p[2] = "";
          else if (!p[2]) p[2] = concat("", p[2]);
          if (Array.isArray(p[2][0])) {
            cur[2].push.apply(cur[2], p[2]);
          } else {
            cur[2].push(p[2]);
          }
        } else if (s === TEXT) {
          cur[2].push(p[1]);
        } else if (s === ATTR_EQ || s === ATTR_BREAK);
        else {
          throw new Error("unhandled: " + s);
        }
      }

      if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
        tree[2].shift();
      }

      if (
        tree[2].length > 2 ||
        (tree[2].length === 2 && /\S/.test(tree[2][1]))
      ) {
        if (opts.createFragment) return opts.createFragment(tree[2]);
        throw new Error(
          "multiple root elements must be wrapped in an enclosing tag"
        );
      }
      if (
        Array.isArray(tree[2][0]) &&
        typeof tree[2][0][0] === "string" &&
        Array.isArray(tree[2][0][2])
      ) {
        tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2]);
      }
      return tree[2][0];

      function parse(str) {
        var res = [];
        if (state === ATTR_VALUE_W) state = ATTR;
        for (var i = 0; i < str.length; i++) {
          var c = str.charAt(i);
          if (state === TEXT && c === "<") {
            if (reg.length) res.push([TEXT, reg]);
            reg = "";
            state = OPEN;
          } else if (c === ">" && !quot(state) && state !== COMMENT) {
            if (state === OPEN && reg.length) {
              res.push([OPEN, reg]);
            } else if (state === ATTR_KEY) {
              res.push([ATTR_KEY, reg]);
            } else if (state === ATTR_VALUE && reg.length) {
              res.push([ATTR_VALUE, reg]);
            }
            res.push([CLOSE]);
            reg = "";
            state = TEXT;
          } else if (state === COMMENT && /-$/.test(reg) && c === "-") {
            if (opts.comments) {
              res.push([ATTR_VALUE, reg.substr(0, reg.length - 1)]);
            }
            reg = "";
            state = TEXT;
          } else if (state === OPEN && /^!--$/.test(reg)) {
            if (opts.comments) {
              res.push([OPEN, reg], [ATTR_KEY, "comment"], [ATTR_EQ]);
            }
            reg = c;
            state = COMMENT;
          } else if (state === TEXT || state === COMMENT) {
            reg += c;
          } else if (state === OPEN && c === "/" && reg.length);
          else if (state === OPEN && /\s/.test(c)) {
            if (reg.length) {
              res.push([OPEN, reg]);
            }
            reg = "";
            state = ATTR;
          } else if (state === OPEN) {
            reg += c;
          } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
            state = ATTR_KEY;
            reg = c;
          } else if (state === ATTR && /\s/.test(c)) {
            if (reg.length) res.push([ATTR_KEY, reg]);
            res.push([ATTR_BREAK]);
          } else if (state === ATTR_KEY && /\s/.test(c)) {
            res.push([ATTR_KEY, reg]);
            reg = "";
            state = ATTR_KEY_W;
          } else if (state === ATTR_KEY && c === "=") {
            res.push([ATTR_KEY, reg], [ATTR_EQ]);
            reg = "";
            state = ATTR_VALUE_W;
          } else if (state === ATTR_KEY) {
            reg += c;
          } else if ((state === ATTR_KEY_W || state === ATTR) && c === "=") {
            res.push([ATTR_EQ]);
            state = ATTR_VALUE_W;
          } else if (
            (state === ATTR_KEY_W || state === ATTR) &&
            !/\s/.test(c)
          ) {
            res.push([ATTR_BREAK]);
            if (/[\w-]/.test(c)) {
              reg += c;
              state = ATTR_KEY;
            } else state = ATTR;
          } else if (state === ATTR_VALUE_W && c === '"') {
            state = ATTR_VALUE_DQ;
          } else if (state === ATTR_VALUE_W && c === "'") {
            state = ATTR_VALUE_SQ;
          } else if (state === ATTR_VALUE_DQ && c === '"') {
            res.push([ATTR_VALUE, reg], [ATTR_BREAK]);
            reg = "";
            state = ATTR;
          } else if (state === ATTR_VALUE_SQ && c === "'") {
            res.push([ATTR_VALUE, reg], [ATTR_BREAK]);
            reg = "";
            state = ATTR;
          } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
            state = ATTR_VALUE;
            i--;
          } else if (state === ATTR_VALUE && /\s/.test(c)) {
            res.push([ATTR_VALUE, reg], [ATTR_BREAK]);
            reg = "";
            state = ATTR;
          } else if (
            state === ATTR_VALUE ||
            state === ATTR_VALUE_SQ ||
            state === ATTR_VALUE_DQ
          ) {
            reg += c;
          }
        }
        if (state === TEXT && reg.length) {
          res.push([TEXT, reg]);
          reg = "";
        } else if (state === ATTR_VALUE && reg.length) {
          res.push([ATTR_VALUE, reg]);
          reg = "";
        } else if (state === ATTR_VALUE_DQ && reg.length) {
          res.push([ATTR_VALUE, reg]);
          reg = "";
        } else if (state === ATTR_VALUE_SQ && reg.length) {
          res.push([ATTR_VALUE, reg]);
          reg = "";
        } else if (state === ATTR_KEY) {
          res.push([ATTR_KEY, reg]);
          reg = "";
        }
        return res;
      }
    };

    function strfn(x) {
      if (typeof x === "function") return x;
      else if (typeof x === "string") return x;
      else if (x && typeof x === "object") return x;
      else if (x === null || x === undefined) return x;
      else return concat("", x);
    }
  };

function quot(state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ;
}

var closeRE = RegExp(
  "^(" +
    [
      "area",
      "base",
      "basefont",
      "bgsound",
      "br",
      "col",
      "command",
      "embed",
      "frame",
      "hr",
      "img",
      "input",
      "isindex",
      "keygen",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
      "!--",
      // SVG TAGS
      "animate",
      "animateTransform",
      "circle",
      "cursor",
      "desc",
      "ellipse",
      "feBlend",
      "feColorMatrix",
      "feComposite",
      "feConvolveMatrix",
      "feDiffuseLighting",
      "feDisplacementMap",
      "feDistantLight",
      "feFlood",
      "feFuncA",
      "feFuncB",
      "feFuncG",
      "feFuncR",
      "feGaussianBlur",
      "feImage",
      "feMergeNode",
      "feMorphology",
      "feOffset",
      "fePointLight",
      "feSpecularLighting",
      "feSpotLight",
      "feTile",
      "feTurbulence",
      "font-face-format",
      "font-face-name",
      "font-face-uri",
      "glyph",
      "glyphRef",
      "hkern",
      "image",
      "line",
      "missing-glyph",
      "mpath",
      "path",
      "polygon",
      "polyline",
      "rect",
      "set",
      "stop",
      "tref",
      "use",
      "view",
      "vkern",
    ].join("|") +
    ")(?:[.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$"
);
function selfClosing(tag) {
  return closeRE.test(tag);
}

var trailingNewlineRegex = /\n[\s]+$/;
var leadingNewlineRegex = /^\n[\s]+/;
var trailingSpaceRegex = /[\s]+$/;
var leadingSpaceRegex = /^[\s]+/;
var multiSpaceRegex = /[\n\s]+/g;

var TEXT_TAGS = [
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "br",
  "cite",
  "data",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "rp",
  "rt",
  "rtc",
  "ruby",
  "s",
  "amp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
];

var VERBATIM_TAGS = ["code", "pre", "textarea"];

var appendChild = function appendChild(el, childs) {
  if (!Array.isArray(childs)) return;

  var nodeName = el.nodeName.toLowerCase();

  var hadText = false;
  var value, leader;

  for (var i = 0, len = childs.length; i < len; i++) {
    var node = childs[i];
    if (Array.isArray(node)) {
      appendChild(el, node);
      continue;
    }

    if (
      typeof node === "number" ||
      typeof node === "boolean" ||
      typeof node === "function" ||
      node instanceof Date ||
      node instanceof RegExp
    ) {
      node = node.toString();
    }

    var lastChild = el.childNodes[el.childNodes.length - 1];

    // Iterate over text nodes
    if (typeof node === "string") {
      hadText = true;

      // If we already had text, append to the existing text
      if (lastChild && lastChild.nodeName === "#text") {
        lastChild.nodeValue += node;

        // We didn't have a text node yet, create one
      } else {
        node = el.ownerDocument.createTextNode(node);
        el.appendChild(node);
        lastChild = node;
      }

      // If this is the last of the child nodes, make sure we close it out
      // right
      if (i === len - 1) {
        hadText = false;
        // Trim the child text nodes if the current node isn't a
        // node where whitespace matters.
        if (
          TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1
        ) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, "")
            .replace(trailingSpaceRegex, "")
            .replace(trailingNewlineRegex, "")
            .replace(multiSpaceRegex, " ");
          if (value === "") {
            el.removeChild(lastChild);
          } else {
            lastChild.nodeValue = value;
          }
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          // The very first node in the list should not have leading
          // whitespace. Sibling text nodes should have whitespace if there
          // was any.
          leader = i === 0 ? "" : " ";
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, leader)
            .replace(leadingSpaceRegex, " ")
            .replace(trailingSpaceRegex, "")
            .replace(trailingNewlineRegex, "")
            .replace(multiSpaceRegex, " ");
          lastChild.nodeValue = value;
        }
      }

      // Iterate over DOM nodes
    } else if (node && node.nodeType) {
      // If the last node was a text node, make sure it is properly closed out
      if (hadText) {
        hadText = false;

        // Trim the child text nodes if the current node isn't a
        // text node or a code node
        if (
          TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1
        ) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, "")
            .replace(trailingNewlineRegex, " ")
            .replace(multiSpaceRegex, " ");

          // Remove empty text nodes, append otherwise
          if (value === "") {
            el.removeChild(lastChild);
          } else {
            lastChild.nodeValue = value;
          }
          // Trim the child nodes but preserve the appropriate whitespace
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingSpaceRegex, " ")
            .replace(leadingNewlineRegex, "")
            .replace(trailingNewlineRegex, " ")
            .replace(multiSpaceRegex, " ");
          lastChild.nodeValue = value;
        }
      }

      // Store the last nodename
      var _nodeName = node.nodeName;
      if (_nodeName) nodeName = _nodeName.toLowerCase();

      // Append the node to the DOM
      el.appendChild(node);
    }
  }
};

var svgTags = [
  "svg",
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "hkern",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "switch",
  "symbol",
  "text",
  "textPath",
  "title",
  "tref",
  "tspan",
  "use",
  "view",
  "vkern",
];

var boolProps = [
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defaultchecked",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
];

var directProps = ["indeterminate"];

// Props that need to be set directly rather than with el.setAttribute()

var SVGNS = "http://www.w3.org/2000/svg";
var XLINKNS = "http://www.w3.org/1999/xlink";

var COMMENT_TAG = "!--";

var dom = function (document) {
  function nanoHtmlCreateElement(tag, props, children) {
    var el;

    // If an svg tag, it needs a namespace
    if (svgTags.indexOf(tag) !== -1) {
      props.namespace = SVGNS;
    }

    // If we are using a namespace
    var ns = false;
    if (props.namespace) {
      ns = props.namespace;
      delete props.namespace;
    }

    // If we are extending a builtin element
    var isCustomElement = false;
    if (props.is) {
      isCustomElement = props.is;
      delete props.is;
    }

    // Create the element
    if (ns) {
      if (isCustomElement) {
        el = document.createElementNS(ns, tag, { is: isCustomElement });
      } else {
        el = document.createElementNS(ns, tag);
      }
    } else if (tag === COMMENT_TAG) {
      return document.createComment(props.comment);
    } else if (isCustomElement) {
      el = document.createElement(tag, { is: isCustomElement });
    } else {
      el = document.createElement(tag);
    }

    // Create the properties
    for (var p in props) {
      if (props.hasOwnProperty(p)) {
        var key = p.toLowerCase();
        var val = props[p];
        // Normalize className
        if (key === "classname") {
          key = "class";
          p = "class";
        }
        // The for attribute gets transformed to htmlFor, but we just set as for
        if (p === "htmlFor") {
          p = "for";
        }
        // If a property is boolean, set itself to the key
        if (boolProps.indexOf(key) !== -1) {
          if (String(val) === "true") val = key;
          else if (String(val) === "false") continue;
        }
        // If a property prefers being set directly vs setAttribute
        if (key.slice(0, 2) === "on" || directProps.indexOf(key) !== -1) {
          el[p] = val;
        } else {
          if (ns) {
            if (p === "xlink:href") {
              el.setAttributeNS(XLINKNS, p, val);
            } else if (/^xmlns($|:)/i.test(p));
            else {
              el.setAttributeNS(null, p, val);
            }
          } else {
            el.setAttribute(p, val);
          }
        }
      }
    }

    appendChild(el, children);
    return el;
  }

  function createFragment(nodes) {
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] == null) continue;
      if (Array.isArray(nodes[i])) {
        fragment.appendChild(createFragment(nodes[i]));
      } else {
        if (typeof nodes[i] === "string")
          nodes[i] = document.createTextNode(nodes[i]);
        fragment.appendChild(nodes[i]);
      }
    }
    return fragment;
  }

  var exports =
    C__Users_b_hollstein_Projekte_quillLanguagetool_node_modules_hyperx(
      nanoHtmlCreateElement,
      {
        comments: true,
        createFragment: createFragment,
      }
    );
  exports.default = exports;
  exports.createComment = nanoHtmlCreateElement;
  return exports;
};

var browser = dom(document);

function nanohtmlRawBrowser(tag) {
  var el = document.createElement("div");
  el.innerHTML = tag;
  return toArray(el.childNodes);
}

function toArray(arr) {
  return Array.isArray(arr) ? arr : [].slice.call(arr);
}

var rawBrowser = nanohtmlRawBrowser;

function nanohtmlRawServer(tag) {
  var wrapper = new String(tag); // eslint-disable-line no-new-wrappers
  wrapper.__encoded = true;
  return wrapper;
}

var rawServer = nanohtmlRawServer;

var raw = typeof window !== "undefined" ? rawBrowser : rawServer;

/**
 * Manager for popups.
 *
 * This handles opening and closing suggestion popups in the editor
 * when a suggestion is selected.
 */
var PopupManager = /** @class */ (function () {
  function PopupManager(parent) {
    this.parent = parent;
    this.closePopup = this.closePopup.bind(this);
    this.addEventHandler();
  }
  PopupManager.prototype.addEventHandler = function () {
    var _this = this;
    this.parent.quill.root.addEventListener("click", function (e) {
      var target = e.target;
      if (target.tagName === "QUILL-LT-MATCH") {
        _this.handleSuggestionClick(target);
      }
    });
    window.addEventListener("resize", function () {
      if (_this.currentSuggestionElement) {
        _this.handleSuggestionClick(_this.currentSuggestionElement);
      }
    });
  };
  PopupManager.prototype.closePopup = function () {
    console.log("Closing popup", this.openPopup, this.currentSuggestionElement);
    if (this.openPopup) {
      this.openPopup.remove();
      this.openPopup = undefined;
    }
    this.currentSuggestionElement = undefined;
  };
  PopupManager.prototype.handleSuggestionClick = function (suggestion) {
    var offset = parseInt(suggestion.getAttribute("data-offset") || "0");
    var length = parseInt(suggestion.getAttribute("data-length") || "0");
    var ruleId = suggestion.getAttribute("data-rule-id");
    var rule = this.parent.matches.find(function (r) {
      return r.offset === offset && r.length === length && r.rule.id === ruleId;
    });
    if (!rule) {
      throw new Error("Could not find rule with id " + ruleId);
    }
    this.createSuggestionPopup(rule, suggestion);
  };
  PopupManager.prototype.createSuggestionPopup = function (match, suggestion) {
    var _this = this;
    var _a;
    if (this.openPopup) {
      this.closePopup();
    }
    this.currentSuggestionElement = suggestion;
    var applySuggestion = function (replacement) {
      _this.parent.preventLoop();
      _this.parent.quill.setSelection(match.offset, match.length);
      _this.parent.quill.deleteText(match.offset, match.length);
      _this.parent.quill.insertText(match.offset, replacement);
      // @ts-ignore
      _this.parent.quill.setSelection(match.offset + replacement.length);
      _this.closePopup();
    };
    var popup = browser(
      templateObject_2 ||
        (templateObject_2 = __makeTemplateObject(
          [
            '\n      <quill-lt-popup role="tooltip">\n        <div class="quill-lt-match-popup">\n          <div class="quill-lt-match-popup-header">\n            <button\n              class="quill-lt-match-popup-close"\n              onclick="',
            '"\n            >\n              ',
            '\n            </button>\n          </div>\n          <div class="quill-lt-match-popup-title">',
            '</div>\n          <div class="quill-lt-match-popup-description">',
            '</div>\n\n          <div class="quill-lt-match-popup-actions">\n            ',
            '\n          </div>\n\n          <div class="quill-lt-powered-by">\n            Powered by <a href="https://languagetool.org">LanguageTool</a>\n          </div>\n        </div>\n        <div class="quill-lt-popup-arrow" data-popper-arrow></div>\n      </quill-lt-popup>\n    ',
          ],
          [
            '\n      <quill-lt-popup role="tooltip">\n        <div class="quill-lt-match-popup">\n          <div class="quill-lt-match-popup-header">\n            <button\n              class="quill-lt-match-popup-close"\n              onclick="',
            '"\n            >\n              ',
            '\n            </button>\n          </div>\n          <div class="quill-lt-match-popup-title">',
            '</div>\n          <div class="quill-lt-match-popup-description">',
            '</div>\n\n          <div class="quill-lt-match-popup-actions">\n            ',
            '\n          </div>\n\n          <div class="quill-lt-powered-by">\n            Powered by <a href="https://languagetool.org">LanguageTool</a>\n          </div>\n        </div>\n        <div class="quill-lt-popup-arrow" data-popper-arrow></div>\n      </quill-lt-popup>\n    ',
          ]
        )),
      this.closePopup,
      raw("&times;"),
      match.shortMessage,
      match.message,
      (_a = match.replacements) === null || _a === void 0
        ? void 0
        : _a.slice(0, 3).map(function (replacement) {
            return browser(
              templateObject_1$1 ||
                (templateObject_1$1 = __makeTemplateObject(
                  [
                    '\n                <button\n                  class="quill-lt-match-popup-action"\n                  data-replacement="',
                    '"\n                  onclick=',
                    "\n                >\n                  ",
                    "\n                </button>\n              ",
                  ],
                  [
                    '\n                <button\n                  class="quill-lt-match-popup-action"\n                  data-replacement="',
                    '"\n                  onclick=',
                    "\n                >\n                  ",
                    "\n                </button>\n              ",
                  ]
                )),
              replacement.value,
              function () {
                return applySuggestion(replacement.value);
              },
              replacement.value
            );
          })
    );
    document.body.appendChild(popup);
    createPopper(suggestion, popup, {
      placement: "top-end",
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 8],
          },
        },
      ],
    });
    this.openPopup = popup;
  };
  return PopupManager;
})();
var templateObject_1$1, templateObject_2;

/**
 * Manager for the loading indicator.
 *
 * This handles showing and hiding the loading indicator in the editor.
 */
var LoadingIndicator = /** @class */ (function () {
  function LoadingIndicator(parent) {
    this.parent = parent;
  }
  LoadingIndicator.prototype.startLoading = function () {
    var _a, _b;
    (_a = this.currentLoader) === null || _a === void 0 ? void 0 : _a.remove();
    if (this.parent.params.showLoadingIndicator) {
      var loadingIndicator = browser(
        templateObject_1 ||
          (templateObject_1 = __makeTemplateObject(
            [
              '\n        <div class="quill-lt-loading-indicator">\n          <div class="quill-lt-loading-indicator-spinner"></div>\n        </div>\n      ',
            ],
            [
              '\n        <div class="quill-lt-loading-indicator">\n          <div class="quill-lt-loading-indicator-spinner"></div>\n        </div>\n      ',
            ]
          ))
      );
      this.currentLoader = loadingIndicator;
      (_b = this.parent.quill.root.parentElement) === null || _b === void 0
        ? void 0
        : _b.appendChild(loadingIndicator);
    }
  };
  LoadingIndicator.prototype.stopLoading = function () {
    var _a;
    (_a = this.currentLoader) === null || _a === void 0 ? void 0 : _a.remove();
  };
  return LoadingIndicator;
})();
var templateObject_1;

/**
 * QuillLanguageTool is a Quill plugin that provides spellchecking and grammar checking
 * using the LanguageTool API.
 */
var QuillLanguageTool = /** @class */ (function () {
  /**
   * Create a new QuillLanguageTool instance.
   *
   * @param quill Instance of the Qill editor.
   * @param params Options for the QuillLanguageTool instance.
   */
  function QuillLanguageTool(quill, params) {
    var _this = this;
    this.quill = quill;
    this.params = params;
    // Dependencies
    this.boxes = new SuggestionBoxes(this);
    this.popups = new PopupManager(this);
    this.loader = new LoadingIndicator(this);
    this.matches = [];
    debug("Attaching QuillLanguageTool to Quill instance", quill);
    this.quill.on("text-change", function (_delta, _oldDelta, source) {
      if (source === "user") {
        _this.onTextChange();
      }
    });
    this.checkSpelling();
    this.disableNativeSpellcheckIfSet();
  }
  QuillLanguageTool.prototype.disableNativeSpellcheckIfSet = function () {
    if (this.params.disableNativeSpellcheck) {
      this.quill.root.setAttribute("spellcheck", "false");
    }
  };
  QuillLanguageTool.prototype.onTextChange = function () {
    var _this = this;
    if (this.loopPreventionCooldown) return;
    if (this.typingCooldown) {
      clearTimeout(this.typingCooldown);
    }
    this.typingCooldown = setTimeout(function () {
      debug("User stopped typing, checking spelling");
      _this.checkSpelling();
    }, this.params.cooldownTime);
  };
  QuillLanguageTool.prototype.checkSpelling = function () {
    return __awaiter(this, void 0, void 0, function () {
      var json;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            debug("Removing existing suggestion boxes");
            // this.boxes.removeSuggestionBoxes();
            console.log("************************************");
            if (document.querySelector("lt-toolbar")) {
              debug("Languagetool is installed as extension, not checking");
              return [2 /*return*/];
            }
            debug("Checking spelling");
            this.loader.startLoading();
            return [4 /*yield*/, this.getLanguageToolResults()];
          case 1:
            json = _a.sent();
            if (json && json.matches) {
              this.matches = json.matches;
              debug("Adding suggestion boxes");
              this.boxes.addSuggestionBoxes();
            } else {
              debug("No matches found");
              this.matches = [];
            }
            this.loader.stopLoading();
            return [2 /*return*/];
        }
      });
    });
  };
  QuillLanguageTool.prototype.getLanguageToolResults = function () {
    return __awaiter(this, void 0, void 0, function () {
      var params, response, json;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            params = this.getApiParams();
            _a.label = 1;
          case 1:
            _a.trys.push([1, 4, , 5]);
            return [
              4 /*yield*/,
              fetch(this.params.server + "/v2/check", {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                mode: "cors",
                body: params,
              }),
            ];
          case 2:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 3:
            json = _a.sent();
            return [2 /*return*/, json];
          case 4:
            _a.sent();
            return [2 /*return*/, null];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  QuillLanguageTool.prototype.getApiParams = function () {
    var paramsObject = __assign(
      { text: this.quill.getText(), language: this.params.language },
      this.params.apiOptions
    );
    return Object.keys(paramsObject)
      .map(function (key) {
        return key + "=" + encodeURIComponent(paramsObject[key]);
      })
      .join("&");
  };
  QuillLanguageTool.prototype.preventLoop = function () {
    var _this = this;
    if (this.loopPreventionCooldown) {
      clearTimeout(this.loopPreventionCooldown);
    }
    this.loopPreventionCooldown = setTimeout(function () {
      _this.loopPreventionCooldown = undefined;
    }, 100);
  };
  QuillLanguageTool.DEFAULTS = {
    server: "https://languagetool.org/api",
    language: "en-US",
    disableNativeSpellcheck: true,
    cooldownTime: 3000,
    showLoadingIndicator: true,
    apiOptions: {},
  };
  return QuillLanguageTool;
})();
/**
 * Register all QuillLanguageTool modules with Quill.
 *
 * This needs access to the exact Quill static instance
 * you will be using in your application.
 *
 * Example:
 * ```
 * import Quill from "quill";
 * import registerQuillLanguageTool from "quill-languagetool";
 * registerQuillLanguageTool(Quill);
 * ```
 *
 * @param Quill Quill static instance.
 */
function registerQuillLanguageTool(Quill) {
  debug("Registering QuillLanguageTool module for Quill instance");
  Quill.register({
    "modules/languageTool": QuillLanguageTool,
    "formats/ltmatch": createSuggestionBlotForQuillInstance(Quill),
  });
}

export {
  QuillLanguageTool,
  registerQuillLanguageTool as default,
  getCleanedHtml,
  removeSuggestionBoxes,
};
//# sourceMappingURL=index.es.js.map
