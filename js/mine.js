var storage = {};


var mine = (function () {
  'use strict';
  var instance = this;

  var parser = {};

  var FormulaParser = function(handler) {
    var formulaLexer = function () {};
    formulaLexer.prototype = Parser.lexer;

    var formulaParser = function () {
      this.lexer = new formulaLexer();
      this.yy = {};
    };

    formulaParser.prototype = Parser;
    var newParser = new formulaParser;
    newParser.setObj = function(obj) {
      newParser.yy.obj = obj;
    };

    newParser.yy.parseError = function (str, hash) {
      throw {
        name: 'Parser error',
        message: str,
        prop: hash
      }
    };

    newParser.yy.handler = handler;

    return newParser;
  };

  var Exception = {
    errors: [
      {type: 'NULL', output: '#NULL'},
      {type: 'DIV_ZERO', output: '#DIV/0!'},
      {type: 'VALUE', output: '#VALUE!'},
      {type: 'REF', output: '#REF!'},
      {type: 'NAME', output: '#NAME?'},
      {type: 'NUM', output: '#NUM!'},
      {type: 'NOT_AVAILABLE', output: '#N/A!'},
      {type: 'ERROR', output: '#ERROR'}
    ],
    get: function (type) {
      var error = Exception.errors.filter(function (item) {
        return item.type === type || item.output === type;
      })[0];

      return error ? error.output : null;
    }
  };

  var Matrix = function () {

    // var item = {
    //   id: '',
    //   formula: '',
    //   value: '',
    //   error: '',
    //   deps: [],
    //   formulaEdit: false
    // };

    this.data = [];

    this.getItem = function (id) {
      return instance.matrix.data.filter(function (item) {
        return item.id === id;
      })[0];
    };

    this.removeItem = function (id) {
      instance.matrix.data = instance.matrix.data.filter(function (item) {
        return item.id !== id;
      });
    };

    this.updateItem = function (item, props) {
      if (instance.utils.isString(item)) {
        item = instance.matrix.getItem(item);
      }

      if (item && props) {
        for (var p in props) {
          if (item[p] && instance.utils.isArray(item[p])) {
            if (instance.utils.isArray(props[p])) {
              props[p].forEach(function (i) {
                if (item[p].indexOf(i) === -1) {
                  item[p].push(i);
                }
              });
            } else {

              if (item[p].indexOf(props[p]) === -1) {
                item[p].push(props[p]);
              }
            }
          } else {
            item[p] = props[p];
          }
        }
      }
    };

    this.addItem = function (item) {
      var cellId = item.id,
        coords = instance.utils.cellCoords(cellId);

      item.row = coords.row;
      item.col = coords.col;

      var cellExist = instance.matrix.data.filter(function (cell) {
        return cell.id === cellId;
      })[0];

      if (!cellExist) {
        instance.matrix.data.push(item);
      } else {
        instance.matrix.updateItem(cellExist, item);
      }

      return instance.matrix.getItem(cellId);
    };


    this.updateElementItem = function (id, props) {
      var item = instance.matrix.getItem(id);

      instance.matrix.updateItem(item, props);
    };

    this.getDependencies = function (id) {
      var getDependencies = function (id) {
        var filtered = instance.matrix.data.filter(function (cell) {
          if (cell.deps) {
            return cell.deps.indexOf(id) > -1;
          }
        });

        var deps = [];
        filtered.forEach(function (cell) {
          if (deps.indexOf(cell.id) === -1) {
            deps.push(cell.id);
          }
        });

        return deps;
      };

      var allDependencies = [];

      var getTotalDependencies = function (id) {
        var deps = getDependencies(id);

        if (deps.length) {
          deps.forEach(function (refId) {
            if (allDependencies.indexOf(refId) === -1) {
              allDependencies.push(refId);

              var item = instance.matrix.getItem(refId);
              if (item.deps.length) {
                getTotalDependencies(refId);
              }
            }
          });
        }
      };

      getTotalDependencies(id);

      return allDependencies;
    };

    this.getElementDependencies = function (cell) {
      return instance.matrix.getDependencies(cell.id);
    };

    var recalculateElementDependencies = function (cell) {
      var allDependencies = instance.matrix.getElementDependencies(cell);

      allDependencies.forEach(function (refId) {
        var currentCell = instance.matrix.getItem(refId);
        if (currentCell && currentCell.formula) {
          calculateElementFormula(currentCell.formula, currentCell.id);
        }
      });
    };

    var calculateElementFormula = function (formula, id) {
      // to avoid double translate formulas, update item data in parser
      var parsed = parse(formula, id),
        value = parsed.result,
        error = parsed.error;

      instance.matrix.updateElementItem(id, {value: value, error: error});

      return parsed;
    };

    var registerElementInMatrix = function (cell) {
      instance.matrix.addItem(cell);
      calculateElementFormula(cell.formula, cell.id);
    };

    this.scan = function () {
      var input = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "SUM(A1:D1, H1)"],
        [-1, -10, 2, 4, 100, 1, 50, 20, 200, -100, "MAX(A2:J2)"],
        [-1, -40, -53, 1, 10, 30, 10, 301, -1, -20, "MIN(A3:J3)"],
        [20, 50, 100, 20, 1, 5, 15, 25, 45, 23, "AVERAGE(A4:J4)"],
        [0, 10, 1, 10, 2, 10, 3, 10, 4, 10, "SUMIF(A5:J5,'>5')"]
      ];
      for (var y = 0; y < input.length; y++) {
        for (var x = 0; x < input[0].length; x++) {
          // set the cell here
          var id = utils.XYtoA1(x, y);
          var cell = {
            id: id,
            formula: input[y][x].toString()
          };
          registerElementInMatrix(cell);
          recalculateElementDependencies(cell);
        }
      }
    };
  };

  var utils = {
    isArray: function (value) {
      return Object.prototype.toString.call(value) === '[object Array]';
    },

    isNumber: function (value) {
      return Object.prototype.toString.call(value) === '[object Number]';
    },

    isString: function (value) {
      return Object.prototype.toString.call(value) === '[object String]';
    },

    isFunction: function (value) {
      return Object.prototype.toString.call(value) === '[object Function]';
    },

    isUndefined: function (value) {
      return Object.prototype.toString.call(value) === '[object Undefined]';
    },

    isNull: function (value) {
      return Object.prototype.toString.call(value) === '[object Null]';
    },

    isSet: function (value) {
      return !instance.utils.isUndefined(value) && !instance.utils.isNull(value);
    },

    getCellAlphaNum: function (cell) {
      var num = cell.match(/\d+$/),
        alpha = cell.replace(num, '');

      return {
        alpha: alpha,
        num: parseInt(num[0], 10)
      }
    },

    toNum: function (chr) {
      chr = instance.utils.clearFormula(chr);
      var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, result = 0;

      for (i = 0, j = chr.length - 1; i < chr.length; i += 1, j -= 1) {
        result += Math.pow(base.length, j) * (base.indexOf(chr[i]) + 1);
      }

      if (result) {
        --result;
      }

      return result;
    },

    toChar: function (num) {
      var s = '';

      while (num >= 0) {
        s = String.fromCharCode(num % 26 + 97) + s;
        num = Math.floor(num / 26) - 1;
      }

      return s.toUpperCase();
    },
    XYtoA1: function (x, y) {
      function numberToLetters(num) {
        var mod = num % 26,
          pow = num / 26 | 0,
          out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
        return pow ? numberToLetters(pow) + out : out;
      }
      return numberToLetters(x+1) + (y+1).toString();
    },
    cellCoords: function (cell) {
      var num = cell.match(/\d+$/),
        alpha = cell.replace(num, '');

      return {
        row: parseInt(num[0], 10) - 1,
        col: instance.utils.toNum(alpha)
      };
    },

    clearFormula: function (formula) {
      return formula.replace(/\$/g, '');
    },

    translateCellCoords: function (coords) {
      return instance.utils.toChar(coords.col) + '' + parseInt(coords.row + 1, 10);
    },

    iterateCells: function (startCell, endCell, callback) {
      var result = {
        index: [], // list of cell index: A1, A2, A3
        value: []  // list of cell value
      };

      var cols = {
        start: 0,
        end: 0
      };

      if (endCell.col >= startCell.col) {
        cols = {
          start: startCell.col,
          end: endCell.col
        };
      } else {
        cols = {
          start: endCell.col,
          end: startCell.col
        };
      }

      var rows = {
        start: 0,
        end: 0
      };

      if (endCell.row >= startCell.row) {
        rows = {
          start: startCell.row,
          end: endCell.row
        };
      } else {
        rows = {
          start: endCell.row,
          end: startCell.row
        };
      }

      for (var column = cols.start; column <= cols.end; column++) {
        for (var row = rows.start; row <= rows.end; row++) {
          var cellIndex = instance.utils.toChar(column) + (row + 1),
            cellValue = instance.helper.cellValue.call(this, cellIndex);

          result.index.push(cellIndex);
          result.value.push(cellValue);
        }
      }

      if (instance.utils.isFunction(callback)) {
        return callback.apply(callback, [result]);
      } else {
        return result;
      }
    },

    sort: function (rev) {
      return function (a, b) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0)) * (rev ? -1 : 1);
      }
    }
  };

  var helper = {
    SUPPORTED_FORMULAS: [
      'ABS', 'ACCRINT', 'ACOS', 'ACOSH', 'ACOTH', 'AND', 'ARABIC', 'ASIN', 'ASINH', 'ATAN', 'ATAN2', 'ATANH', 'AVEDEV', 'AVERAGE', 'AVERAGEA', 'AVERAGEIF',
      'BASE', 'BESSELI', 'BESSELJ', 'BESSELK', 'BESSELY', 'BETADIST', 'BETAINV', 'BIN2DEC', 'BIN2HEX', 'BIN2OCT', 'BINOMDIST', 'BINOMDISTRANGE', 'BINOMINV', 'BITAND', 'BITLSHIFT', 'BITOR', 'BITRSHIFT', 'BITXOR',
      'CEILING', 'CEILINGMATH', 'CEILINGPRECISE', 'CHAR', 'CHISQDIST', 'CHISQINV', 'CODE', 'COMBIN', 'COMBINA', 'COMPLEX', 'CONCATENATE', 'CONFIDENCENORM', 'CONFIDENCET', 'CONVERT', 'CORREL', 'COS', 'COSH', 'COT', 'COTH', 'COUNT', 'COUNTA', 'COUNTBLANK', 'COUNTIF', 'COUNTIFS', 'COUNTIN', 'COUNTUNIQUE', 'COVARIANCEP', 'COVARIANCES', 'CSC', 'CSCH', 'CUMIPMT', 'CUMPRINC',
      'DATE', 'DATEVALUE', 'DAY', 'DAYS', 'DAYS360', 'DB', 'DDB', 'DEC2BIN', 'DEC2HEX', 'DEC2OCT', 'DECIMAL', 'DEGREES', 'DELTA', 'DEVSQ', 'DOLLAR', 'DOLLARDE', 'DOLLARFR',
      'E', 'EDATE', 'EFFECT', 'EOMONTH', 'ERF', 'ERFC', 'EVEN', 'EXACT', 'EXPONDIST',
      'FALSE', 'FDIST', 'FINV', 'FISHER', 'FISHERINV',
      'IF', 'INT', 'ISEVEN', 'ISODD',
      'LN', 'LOG', 'LOG10',
      'MAX', 'MAXA', 'MEDIAN', 'MIN', 'MINA', 'MOD',
      'NOT',
      'ODD', 'OR',
      'PI', 'POWER',
      'ROUND', 'ROUNDDOWN', 'ROUNDUP',
      'SIN', 'SINH', 'SPLIT', 'SQRT', 'SQRTPI', 'SUM', 'SUMIF', 'SUMIFS', 'SUMPRODUCT', 'SUMSQ', 'SUMX2MY2', 'SUMX2PY2', 'SUMXMY2',
      'TAN', 'TANH', 'TRUE', 'TRUNC',
      'XOR'
    ],

    number: function (num) {
      switch (typeof num) {
        case 'number':
          return num;
        case 'string':
          if (!isNaN(num)) {
            return num.indexOf('.') > -1 ? parseFloat(num) : parseInt(num, 10);
          }
      }

      return num;
    },

    string: function (str) {
      return str.substring(1, str.length - 1);
    },

    numberInverted: function (num) {
      return this.number(num) * (-1);
    },

    specialMatch: function (type, exp1, exp2) {
      var result;

      switch (type) {
        case '&':
          result = exp1.toString() + exp2.toString();
          break;
      }
      return result;
    },

    logicMatch: function (type, exp1, exp2) {
      var result;

      switch (type) {
        case '=':
          result = (exp1 === exp2);
          break;

        case '>':
          result = (exp1 > exp2);
          break;

        case '<':
          result = (exp1 < exp2);
          break;

        case '>=':
          result = (exp1 >= exp2);
          break;

        case '<=':
          result = (exp1 === exp2);
          break;

        case '<>':
          result = (exp1 != exp2);
          break;

        case 'NOT':
          result = (exp1 != exp2);
          break;
      }

      return result;
    },

    mathMatch: function (type, number1, number2) {
      var result;

      number1 = helper.number(number1);
      number2 = helper.number(number2);

      if (isNaN(number1) || isNaN(number2)) {
        throw Error('VALUE');
      }

      switch (type) {
        case '+':
          result = number1 + number2;
          break;
        case '-':
          result = number1 - number2;
          break;
        case '/':
          result = number1 / number2;
          if (result == Infinity) {
            throw Error('DIV_ZERO');
          } else if (isNaN(result)) {
            throw Error('VALUE');
          }
          break;
        case '*':
          result = number1 * number2;
          break;
        case '^':
          result = Math.pow(number1, number2);
          break;
      }

      return result;
    },

    callFunction: function (fn, args) {
      fn = fn.toUpperCase();
      args = args || [];

      if (instance.helper.SUPPORTED_FORMULAS.indexOf(fn) > -1) {
        if (instance.formulas[fn]) {
          return instance.formulas[fn].apply(this, args);
        }
      }

      throw Error('NAME');
    },

    callVariable: function (args) {
      args = args || [];
      var str = args[0];

      if (str) {
        str = str.toUpperCase();
        if (instance.formulas[str]) {
          return ((typeof instance.formulas[str] === 'function') ? instance.formulas[str].apply(this, args) : instance.formulas[str]);
        }
      }

      throw Error('NAME');
    },

    cellValue: function (cell) {
      var value,
        fnCellValue = instance.custom.cellValue,
        element = this,
        item = instance.matrix.getItem(cell);

      // check if custom cellValue fn exists
      if (instance.utils.isFunction(fnCellValue)) {

        var cellCoords = instance.utils.cellCoords(cell),
          cellId = instance.utils.translateCellCoords({row: element.row, col: element.col});

        // get value
        value = item ? item.value : fnCellValue(cellCoords.row, cellCoords.col);

        if (instance.utils.isNull(value)) {
          value = 0;
        }

        if (cellId) {
          //update dependencies
          instance.matrix.updateItem(cellId, {deps: [cell]});
        }

      } else {

        // get value
        value = item ? item.value : document.getElementById(cell).value;

        //update dependencies
        instance.matrix.updateElementItem(element, {deps: [cell]});
      }

      // check references error
      if (item && item.deps) {
        if (item.deps.indexOf(cellId) !== -1) {
          throw Error('REF');
        }
      }

      // check if any error occurs
      if (item && item.error) {
        throw Error(item.error);
      }

      // return value if is set
      if (instance.utils.isSet(value)) {
        var result = instance.helper.number(value);

        return !isNaN(result) ? result : value;
      }

      // cell is not available
      throw Error('NOT_AVAILABLE');
    },

    cellRangeValue: function (start, end) {
      var fnCellValue = instance.custom.cellValue,
        coordsStart = instance.utils.cellCoords(start),
        coordsEnd = instance.utils.cellCoords(end),
        element = this;

      // iterate cells to get values and indexes
      var cells = instance.utils.iterateCells.call(this, coordsStart, coordsEnd),
        result = [];

      // check if custom cellValue fn exists
      if (instance.utils.isFunction(fnCellValue)) {

        var cellId = instance.utils.translateCellCoords({row: element.row, col: element.col});

        //update dependencies
        instance.matrix.updateItem(cellId, {deps: cells.index});

      } else {

        //update dependencies
        instance.matrix.updateElementItem(element, {deps: cells.index});
      }

      result.push(cells.value);
      return result;
    },

    fixedCellValue: function (id) {
      id = id.replace(/\$/g, '');
      return instance.helper.cellValue.call(this, id);
    },

    fixedCellRangeValue: function (start, end) {
      start = start.replace(/\$/g, '');
      end = end.replace(/\$/g, '');

      return instance.helper.cellRangeValue.call(this, start, end);
    }
  };

  var parse = function (formula, element) {
    var result = null,
      error = null;

    try {

      parser.setObj(element);
      result = parser.parse(formula);

      var id;

      if (element instanceof HTMLElement) {
        id = element.getAttribute('id');
      } else if (element && element.id) {
        id = element.id;
      }

      var deps = instance.matrix.getDependencies(id);

      if (deps.indexOf(id) !== -1) {
        result = null;

        deps.forEach(function (id) {
          instance.matrix.updateItem(id, {value: null, error: Exception.get('REF')});
        });

        throw Error('REF');
      }

    } catch (ex) {

      var message = Exception.get(ex.message);

      if (message) {
        error = message;
      } else {
        error = Exception.get('ERROR');
      }
    }

    return {
      error: error,
      result: result
    }
  };

  var init = function () {
    instance = this;

    parser = new FormulaParser(instance);

    instance.formulas = Formula;
    instance.matrix = new Matrix();

    instance.custom = {};

    instance.matrix.scan();
  };

  return {
    init: init,
    utils: utils,
    helper: helper,
    parse: parse
  };

});
