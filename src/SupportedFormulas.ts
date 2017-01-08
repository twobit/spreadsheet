/// <reference path="../node_modules/moment/moment.d.ts"/>
import * as moment from "moment";

const SUPPORTED_FORMULAS = [
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
];
const OverrideFormulas = {
  ATAN2: function (x, y) {
    return Math.atan2(y, x);
  },
  DATEVALUE: function (dateString: string) : Date {
    return new Date(dateString);
  },
  EDATE: function (start_date: Date, months) {
    return moment(start_date).add(months, 'months').toDate();
  }
};

export {
  SUPPORTED_FORMULAS,
  OverrideFormulas
}