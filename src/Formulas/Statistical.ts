import {
  ArgsChecker
} from "../Utilities/ArgsChecker";
import {
  CriteriaFunctionFactory
} from "../Utilities/CriteriaFunctionFactory";
import {
  Filter
} from "../Utilities/Filter";
import {
  TypeConverter
} from "../Utilities/TypeConverter";
import {
  RefError, NumError, DivZeroError, NAError
} from "../Errors";
import {
  SUM,
  ABS,
  FLOOR
} from "./Math";
import {
  cdf,
  covariance,
  inv,
  pdf,
  stdev,
  cleanFloat,
  mean,
  gammafn,
  sum
} from "../Utilities/MathHelpers";


/**
 * Calculates the sum of squares of deviations based on a sample.
 * @param values - The values or ranges of the sample.
 * @returns {number} sum of squares of deviations
 * @constructor
 */
var DEVSQ = function (...values) : number {
  ArgsChecker.checkAtLeastLength(values, 1, "DEVSQ");
  var range = Filter.flattenAndThrow(values);
  var result = 0;
  var count = 0;
  for (var i = 0; i < range.length; i++) {
    result = result + TypeConverter.valueToNumber(range[i]);
    count++;
  }
  var mean = result / count;
  var result = 0;
  for (var i = 0; i < range.length; i++) {
    result += Math.pow((TypeConverter.valueToNumber(range[i]) - mean), 2);
  }
  return result;
};

/**
 * Returns the median value in a numeric dataset.
 * @param values - The value(s) or range(s) to consider when calculating the median value.
 * @returns {number} the median value of the dataset
 * @constructor
 */
var MEDIAN = function (...values) : number {
  ArgsChecker.checkAtLeastLength(values, 1, "MEDIAN");
  var sortedArray = [];
  values.forEach(function (currentValue) {
    if (currentValue instanceof Array) {
      if (currentValue.length === 0) {
        throw new RefError("Reference does not exist.");
      }
      var filtered = Filter.filterOutStringValues(currentValue);
      sortedArray = sortedArray.concat(filtered);
    } else {
      sortedArray.push(TypeConverter.valueToNumber(currentValue));
    }
  });
  sortedArray = sortedArray.sort(function (a, b) {
    var aN = TypeConverter.valueToNumber(a);
    var bN = TypeConverter.valueToNumber(b);
    return aN - bN;
  });
  if (sortedArray.length === 1) {
    return TypeConverter.valueToNumber(sortedArray[0]);
  }
  if (sortedArray.length === 0) {
    throw new NumError("MEDIAN has no valid input data.");
  }
  // even number of values
  if (sortedArray.length % 2 === 0) {
    if (sortedArray.length === 2) {
      return AVERAGE(sortedArray[0], sortedArray[1]);
    }
    var top = sortedArray[sortedArray.length / 2];
    var bottom = sortedArray[(sortedArray.length / 2) - 1];
    return AVERAGE(top, bottom);
  } else {
    // odd number of values
    return sortedArray[Math.round(sortedArray.length / 2) - 1];
  }
};

/**
 * Returns the numerical average value in a dataset, ignoring text.
 * @param values - The values or ranges to consider when calculating the average value.
 * @returns {number} the average value of this dataset.
 * @constructor
 */
var AVERAGE = function (...values) : number {
  ArgsChecker.checkAtLeastLength(values, 1, "AVERAGE");
  var result = 0;
  var count = 0;
  for (var i = 0; i < values.length; i++) {
    if (values[i] instanceof Array) {
      if (values[i].length === 0) {
        throw new RefError("Reference does not exist.");
      }
      var filtered = Filter.filterOutStringValues(values[i]);
      result = result + SUM.apply(this, filtered);
      count += filtered.length;
    } else {
      result = result + TypeConverter.valueToNumber(values[i]);
      count++;
    }
  }
  return result / count;
};

/**
 * Calculates the average of the magnitudes of deviations of data from a dataset's mean.
 * @param values - The value(s) or range(s)
 * @returns {number} average of the magnitudes of deviations of data from a dataset's mean
 * @constructor
 */
var AVEDEV = function (...values) {
  ArgsChecker.checkAtLeastLength(values, 1, "AVEDEV");

  // Sort to array-values, and non-array-values
  var arrayValues = [];
  var nonArrayValues = [];
  for (var i = 0; i < values.length; i++) {
    var X = values[i];
    if (X instanceof Array) {
      if (X.length === 0) {
        throw new RefError("Reference does not exist.");
      }
      arrayValues.push(X);
    } else {
      nonArrayValues.push(TypeConverter.valueToNumber(X));
    }
  }

  // Remove string values from array-values, but not from non-array-values, and concat.
  var flatValues = Filter.filterOutStringValues(Filter.flatten(arrayValues)).map(function (value) {
    return TypeConverter.valueToNumber(value);
  }).concat(nonArrayValues);

  // Calculating mean
  var result = 0;
  var count = 0;
  for (var i = 0; i < flatValues.length; i++) {
    result = result + TypeConverter.valueToNumber(flatValues[i]);
    count++;
  }
  if (count === 0) {
    throw new DivZeroError("Evaluation of function AVEDEV caused a devide by zero error.");
  }
  var mean = result / count;

  for (var i = 0; i < flatValues.length; i++) {
    flatValues[i] = ABS(TypeConverter.valueToNumber(flatValues[i]) - mean);
  }
  return SUM(flatValues) / flatValues.length;
};

/**
 * Returns the numerical average value in a dataset, coercing text values in ranges to 0 values.
 * @param values - value(s) or range(s) to consider when calculating the average value.
 * @returns {number} the numerical average value in a dataset
 * @constructor
 */
var AVERAGEA = function (...values) {
  ArgsChecker.checkAtLeastLength(values, 1, "AVERAGEA");
  var result = 0;
  var count = 0;
  for (var i = 0; i < values.length; i++) {
    if (values[i] instanceof Array) {
      if (values[i].length === 0) {
        throw new RefError("Reference does not exist.");
      }
      var filtered = Filter.stringValuesToZeros(values[i]);
      result = result + SUM.apply(this, filtered);
      count += filtered.length;
    } else {
      result = result + TypeConverter.valueToNumber(values[i]);
      count++;
    }
  }
  if (count === 0) {
    throw new DivZeroError("Evaluation of function AVEDEV caused a devide by zero error.");
  }
  return result / count;
};


/**
 * Calculates r, the Pearson product-moment correlation coefficient of a dataset. Any text encountered in the arguments
 * will be ignored. CORREL is synonymous with PEARSON.
 * @param dataY - The range representing the array or matrix of dependent data.
 * @param dataX - The range representing the array or matrix of independent data.
 * @returns {number} the Pearson product-moment correlation coefficient.
 * @constructor
 */
var CORREL = function (dataY, dataX) : number {
  ArgsChecker.checkLength(arguments, 2, "CORREL");
  if (!Array.isArray(dataY)) {
    dataY = [dataY];
  }
  if (!Array.isArray(dataX)) {
    dataX = [dataX];
  }
  if (dataY.length !== dataX.length) {
    throw new NAError("CORREL has mismatched argument count " + dataY + " vs " + dataX + ".");
  }
  var arr1 = Filter.filterOutNonNumberValues(Filter.flattenAndThrow(dataY));
  var arr2 = Filter.filterOutNonNumberValues(Filter.flattenAndThrow(dataX));
  var stdevArr1 = stdev(arr1, 1);
  var stdevArr2 = stdev(arr2, 1);
  if (stdevArr1 === 0 || stdevArr2 === 0) {
    throw new DivZeroError("Evaluation of function CORREL caused a divide by zero error.");
  }
  return covariance(arr1, arr2) / stdevArr1 / stdevArr2;
};

/**
 * Calculates r, the Pearson product-moment correlation coefficient of a dataset. Any text encountered in the arguments
 * will be ignored. PEARSON is synonymous with CORREL.
 * @param dataY - The range representing the array or matrix of dependent data.
 * @param dataX - The range representing the array or matrix of independent data.
 * @returns {number} the Pearson product-moment correlation coefficient.
 * @constructor
 */
var PEARSON = function (dataY, dataX) {
  ArgsChecker.checkLength(arguments, 2, "PEARSON");
  return CORREL.apply(this, [dataY, dataX]);
};

/**
 * Returns the value of the exponential distribution function with a specified lambda at a specified value.
 * @param x - The input to the exponential distribution function. If cumulative is TRUE then EXPONDIST returns
 * the cumulative probability of all values up to x.
 * @param lambda - The lambda to specify the exponential distribution function.
 * @param cumulative - Whether to use the exponential cumulative distribution.
 * @returns {number} value of the exponential distribution function.
 * @constructor
 */
var EXPONDIST = function (x, lambda, cumulative) : number {
  ArgsChecker.checkLength(arguments, 3, "EXPONDIST");
  function cdf(x, rate) {
    return x < 0 ? 0 : 1 - Math.exp(-rate * x);
  }
  function pdf(x, rate) {
    return x < 0 ? 0 : rate * Math.exp(-rate * x);
  }
  x = TypeConverter.firstValueAsNumber(x);
  lambda = TypeConverter.firstValueAsNumber(lambda);
  cumulative = TypeConverter.firstValueAsBoolean(cumulative);
  return (cumulative) ? cdf(x, lambda) : pdf(x, lambda);
};



/**
 * Calculates the left-tailed F probability distribution (degree of diversity) for two data sets with given input x.
 * Alternately called Fisher-Snedecor distribution or Snecdor's F distribution.
 * @param x - The input to the F probability distribution function. The value at which to evaluate the function.
 * Must be a positive number.
 * @param degreesFreedom1 - The numerator degrees of freedom.
 * @param degreesFreedom2 - The denominator degrees of freedom.
 * @param cumulative - Logical value that determines the form of the function. If true returns the cumulative
 * distribution function. If false returns the probability density function.
 * @returns {number|boolean} left-tailed F probability distribution
 * @constructor
 * TODO: This function should be stricter in its return type.
 */
var FDIST$LEFTTAILED = function (x, degreesFreedom1, degreesFreedom2, cumulative) : number|undefined|boolean {
  ArgsChecker.checkLength(arguments, 4, "FDIST$LEFTTAILED");

  x = TypeConverter.firstValueAsNumber(x);
  if (x < 0) {
    throw new NumError("Function F.DIST parameter 1 value is " + x + ". It should be greater than or equal to 0.");
  }
  var d1 = TypeConverter.firstValueAsNumber(degreesFreedom1);
  var d2 = TypeConverter.firstValueAsNumber(degreesFreedom2);
  var cum = TypeConverter.firstValueAsBoolean(cumulative);
  return (cum) ? cdf(x, d1, d2) : pdf(x, d1, d2);
};


/**
 * Returns the inverse of the (right-tailed) F probability distribution. If p = FDIST(x,...), then FINV(p,...) = x. The
 * F distribution can be used in an F-test that compares the degree of variability in two data sets.
 * @param probability - A probability associated with the F cumulative distribution.
 * @param degFreedom1 - Required. The numerator degrees of freedom.
 * @param degFreedom2 - Required. The denominator degrees of freedom.
 * @returns {number} inverse of the (right-tailed) F probability distribution
 * @constructor
 */
var FINV = function (probability, degFreedom1, degFreedom2) : number {
  ArgsChecker.checkLength(arguments, 3, "FINV");

  probability = TypeConverter.firstValueAsNumber(probability);
  if (probability <= 0.0 || probability > 1.0) {
    throw new NumError("Function FINV parameter 1 value is " + probability
      + ". It should be greater than or equal to 0, and less than 1.")
  }
  var d1 = TypeConverter.firstValueAsNumber(degFreedom1);
  var d2 = TypeConverter.firstValueAsNumber(degFreedom2);
  return inv(1.0 - probability, d1, d2);
};

/**
 * Returns the Fisher transformation of a specified value.
 * @param value - The value for which to calculate the Fisher transformation.
 * @returns {number} Fisher transformation
 * @constructor
 */
var FISHER = function (value) : number {
  ArgsChecker.checkLength(arguments, 1, "FISHER");
  var x = TypeConverter.firstValueAsNumber(value);
  if (x <= -1 || x >= 1) {
    throw new NumError("Function FISHER parameter 1 value is " + x + ". Valid values are between -1 and 1 exclusive.");
  }
  return Math.log((1 + x) / (1 - x)) / 2;
};

/**
 * Returns the inverse Fisher transformation of a specified value.
 * @param value - The value for which to calculate the inverse Fisher transformation.
 * @returns {number} inverse Fisher transformation
 * @constructor
 */
var FISHERINV = function (value) : number {
  ArgsChecker.checkLength(arguments, 1, "FISHERINV");
  var y = TypeConverter.firstValueAsNumber(value);
  var e2y = Math.exp(2 * y);
  return (e2y - 1) / (e2y + 1);
};

/**
 * Returns the maximum value in a numeric dataset.
 * @param values - The values or range(s) to consider when calculating the maximum value.
 * @returns {number} the maximum value of the dataset
 * @constructor
 */
var MAX = function (...values) {
  ArgsChecker.checkAtLeastLength(values, 1, "MAX");
  var maxSoFar = -Infinity;
  for (var i = 0; i < values.length; i++) {
    if (values[i] instanceof Array) {
      if (values[i].length === 0) {
        throw new RefError("Reference does not exist.");
      }
      var filtered = Filter.filterOutStringValues(values[i]);
      if (filtered.length !== 0) {
        maxSoFar = Math.max(MAX.apply(this, filtered), maxSoFar);
      }
    } else {
      maxSoFar = Math.max(TypeConverter.valueToNumber(values[i]), maxSoFar);
    }
  }
  return maxSoFar;
};

/**
 * Returns the maximum numeric value in a dataset.
 * @param values - The value(s) or range(s) to consider when calculating the maximum value.
 * @returns {number} maximum value of the dataset
 * @constructor
 */
var MAXA = function (...values) : number {
  ArgsChecker.checkAtLeastLength(values, 1, "MAXA");
  var maxSoFar = -Infinity;
  var filteredValues = Filter.stringValuesToZeros(values);
  for (var i = 0; i < filteredValues.length; i++) {
    if (filteredValues[i] instanceof Array) {
      if (values[i].length === 0) {
        throw new RefError("Reference does not exist.");
      }
      var filtered = Filter.stringValuesToZeros(filteredValues[i]);
      if (filtered.length !== 0) {
        maxSoFar = Math.max(MAXA.apply(this, filtered), maxSoFar);
      }
    } else {
      maxSoFar = Math.max(TypeConverter.valueToNumber(filteredValues[i]), maxSoFar);
    }
  }
  return maxSoFar;
};


/**
 * Returns the minimum value in a numeric dataset.
 * @param values - The value(s) or range(s) to consider when calculating the minimum value.
 * @returns {number} the minimum value of the dataset
 * @constructor
 */
var MIN = function (...values) {
  ArgsChecker.checkAtLeastLength(values, 1, "MIN");
  var minSoFar = Infinity;
  for (var i = 0; i < values.length; i++) {
    if (values[i] instanceof Array) {
      if (values[i].length === 0) {
        throw new RefError("Reference does not exist.");
      }
      var filtered = Filter.filterOutStringValues(values[i]);
      if (filtered.length !== 0) {
        minSoFar = Math.min(MIN.apply(this, filtered), minSoFar);
      }
    } else {
      minSoFar = Math.min(TypeConverter.valueToNumber(values[i]), minSoFar);
    }
  }
  return minSoFar;
};


/**
 * Returns the minimum numeric value in a dataset.
 * @param values - The value(s) or range(s) to consider when calculating the minimum value.
 * @returns {number} the minimum value in the dataset
 * @constructor
 */
var MINA = function (...values) : number {
  ArgsChecker.checkAtLeastLength(values, 1, "MINA");
  return MIN.apply(this, values);
};


/**
 * Returns the average of a range depending on criteria.
 * @param criteriaRange - The range to check against criterion.
 * @param criterion - The pattern or test to apply to criteria_range.
 * @param averageRange - [optional] The range to average. If not included, criteria_range is used for the
 * average instead.
 * @returns {number}
 * @constructor
 * TODO: This needs to also accept a third parameter "average_range"
 */
var AVERAGEIF = function (criteriaRange, criterion, averageRange?) {
  ArgsChecker.checkLength(arguments, 2, "AVERAGEIF");
  var range = Filter.flatten(criteriaRange);
  var criteriaEvaluation = CriteriaFunctionFactory.createCriteriaFunction(criterion);

  var result = 0;
  var count = 0;
  for (var i = 0; i < range.length; i++) {
    var val = TypeConverter.valueToNumber(range[i]);
    if (criteriaEvaluation(val)) {
      result = result + val;
      count++;
    }
  }
  if (count === 0) {
    throw new DivZeroError("Evaluation of function AVERAGEIF caused a divide by zero error.");
  }
  return result / count;
};


/**
 * Returns the a count of the number of numeric values in a dataset.
 * @param values - The values or ranges to consider when counting.
 * @returns {number} number of numeric values in a dataset.
 * @constructor
 */
var COUNT = function (...values) : number {
  ArgsChecker.checkAtLeastLength(values, 1, "COUNT");
  var count = 0;
  for (var i = 0; i < values.length; i++) {
    if (values[i] instanceof Array) {
      if (values[i].length > 0) {
        count += COUNT.apply(this, values[i]);
      }
    } else if (TypeConverter.canCoerceToNumber(values[i])) {
      count++;
    }
  }
  return count;
};

/**
 * Returns the a count of the number of values in a dataset.
 * @param values - The values or ranges to consider when counting.
 * @returns {number} number of values in a dataset.
 * @constructor
 */
var COUNTA = function (...values) : number {
  ArgsChecker.checkAtLeastLength(values, 1, "COUNTA");
  var count = 0;
  for (var i = 0; i < values.length; i++) {
    if (values[i] instanceof Array) {
      if (values[i].length > 0) {
        count += COUNTA.apply(this, values[i]);
      } else {
        count++;
      }
    } else {
      count++;
    }
  }
  return count;
};


/**
 * Returns the value at a given percentile of a set of data.
 * @param data -  The array or range containing the dataset to consider.
 * @param percent - percentile to be calculated and returned.
 * @returns {number}
 * @constructor
 */
var PERCENTILE =  function (data, percent) {
  ArgsChecker.checkLength(arguments, 2, "PERCENTILE");
  var p = TypeConverter.firstValueAsNumber(percent);
  if (p < 0 || p > 1) {
    throw new NumError("Function PERCENTILE parameter 2 value " + p + " is out of range.");
  }
  var range = Filter.flattenAndThrow(data).sort(function (a, b) {
    return a - b;
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });

  var n = range.length;
  var l = p * (n - 1);
  var fl = Math.floor(l);
  return cleanFloat((l === fl) ? range[l] : range[fl] + (l - fl) * (range[fl + 1] - range[fl]));
};


/**
 * Returns a value nearest to a specified quartile of a set of data.
 * @param data -  The array or range containing the set of data to consider.
 * @param quartile - Which quartile value to return. 0 returns 0 percent mark, 1 returns 25 percent mark, 2 returns 50
 * percent mark, 3 returns 75 percent mark, 4 returns 100 percent mark.
 * @constructor
 */
var QUARTILE = function (data, quartile) {
  ArgsChecker.checkLength(arguments, 2, "QUARTILE");
  var q = TypeConverter.firstValueAsNumber(quartile);
  if (q < 0 || q > 4) {
    throw new NumError("Function QUARTILE parameter 2 value " + q + " is out of range.");
  }


  var range = Filter.flattenAndThrow(data).sort(function (a, b) {
    return a - b;
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });

  switch (q) {
    case 0:
      return PERCENTILE(range, 0);
    case 1:
      return PERCENTILE(range, 0.25);
    case 2:
      return PERCENTILE(range, 0.5);
    case 3:
      return PERCENTILE(range, 0.75);
    case 4:
      return PERCENTILE(range, 1);
  }
};


/**
 * Calculates the standard deviation of a range, ignoring string values, regardless of whether they can be converted to
 * numbers.
 * @param values - Range of sample.
 * @returns {number}
 * @constructor
 */
var STDEV = function (...values) {
  ArgsChecker.checkAtLeastLength(arguments, 1, "STDEV");
  var range = Filter.flattenAndThrow(values);
  var n = range.length;
  var sigma = 0;
  var count = 0;
  var mean = AVERAGE(range);
  for (var i = 0; i < n; i++) {
    var value = TypeConverter.firstValue(range[i]);
    if (typeof value !== "string") {
      sigma += Math.pow(TypeConverter.valueToNumber(value) - mean, 2);
      count++;
    }
  }
  return Math.sqrt(sigma / (count - 1));
};


/**
 * Calculates the standard deviation of a range, converting string values to numbers, if possible. If a value cannot
 * be converted to a number, formula will throw a value error.
 * @param values - Range of sample.
 * @returns {number}
 * @constructor
 */
var STDEVA = function (...values) {
  ArgsChecker.checkAtLeastLength(arguments, 1, "STDEVA");
  var range = Filter.flattenAndThrow(values).map(function (value) {
    return TypeConverter.firstValueAsNumber(value);
  });
  var n = range.length;
  var sigma = 0;
  var m = mean(range);
  for (var i = 0; i < n; i++) {
    sigma += Math.pow(range[i] - m, 2);
  }
  return Math.sqrt(sigma / (n - 1));
};


/**
 * Calculates the standard deviation of an entire population, ignoring string values, regardless of whether they can be
 * converted to numbers.
 * @param values - Entire sample.
 * @returns {number}
 * @constructor
 */
var STDEVP = function (...values) {
  ArgsChecker.checkAtLeastLength(arguments, 1, "STDEVP");
  var range = Filter.flattenAndThrow(values);
  var n = range.length;
  var sigma = 0;
  var count = 0;
  var m = AVERAGE(range);
  for (var i = 0; i < n; i++) {
    var value = TypeConverter.firstValue(range[i]);
    if (typeof value !== "string") {
      sigma += Math.pow(value - m, 2);
      count++;
    }
  }
  return Math.sqrt(sigma / count);
};


/**
 * Calculates the standard deviation of an entire population, including text and boolean values, if possible. If a value
 * cannot be converted to a number, formula will throw a value error.
 * @param values - Entire sample.
 * @returns {number}
 * @constructor
 */
var STDEVPA = function (...values) {
  ArgsChecker.checkAtLeastLength(arguments, 1, "STDEVPA");
  var range = Filter.flattenAndThrow(values).map(function (value) {
    return TypeConverter.firstValueAsNumber(value);
  });
  var n = range.length;
  var sigma = 0;
  var count = 0;
  var m = AVERAGE(range);
  for (var i = 0; i < n; i++) {
    var value = TypeConverter.firstValue(range[i]);
    if (typeof value !== "string") {
      sigma += Math.pow(value - m, 2);
      count++;
    }
  }
  return Math.sqrt(sigma / count);
};


/**
 * Returns the mean value of a range excluding some percentage of the range on the high and low ends of the range.
 * @param range - Array or range to consider.
 * @param percent - The portion of the data to exclude on both ends of the range.
 * @returns {number}
 * @constructor
 */
var TRIMMEAN = function (range, percent) {
  ArgsChecker.checkLength(arguments, 2, "TRIMMEAN");
  var p = TypeConverter.firstValueAsNumber(percent);
  if (p < 0) {
    throw new NumError("Function TRIMMEAN parameter 2 value is " + p + ". It should be greater than or equal to 0.");
  }
  if (p >= 1) {
    throw new NumError("Function TRIMMEAN parameter 2 value is " + p + ". It should be less than 1.");
  }
  var data = Filter.flattenAndThrow(range).sort(function (a, b) {
    return a - b;
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });

  if (data.length === 0) {
    throw new RefError("TRIMMEAN has no valid input data.");
  }

  var trim = FLOOR(data.length * p, 2) / 2;
  var tmp = data.slice(trim, data.length);
  return mean(tmp.slice(0, tmp.length - trim));
};


/**
 * Returns the slope of the line calculated from linear regression of a range. Any text values passed in will be ignored
 * @param rangeY - The range or array representing the dependent data.
 * @param rangeX - The range or array representing the independent data.
 * @constructor
 */
var SLOPE = function (rangeY, rangeX) {
  ArgsChecker.checkLength(arguments, 2, "SLOPE");
  var dataX = Filter.flattenAndThrow(rangeX).filter(function (value) {
    return typeof value !== "string";
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });
  var dataY = Filter.flattenAndThrow(rangeY).filter(function (value) {
    return typeof value !== "string";
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });
  if (dataX.length !== dataY.length) {
    throw new NAError("SLOPE has mismatched argument count " + dataX.length + " vs " + dataY.length + ".");
  }
  var xmean = mean(dataX);
  var ymean = mean(dataY);
  var n = dataX.length;
  var num = 0;
  var den = 0;
  for (var i = 0; i < n; i++) {
    num += (dataX[i] - xmean) * (dataY[i] - ymean);
    den += Math.pow(dataX[i] - xmean, 2);
  }
  if (den === 0) {
    throw new DivZeroError("Evaluation of function SLOPE caused a divide by zero error.");
  }
  return num / den;
};


/**
 * Returns the normalized equivalent of a random variable given mean and standard deviation of the distribution.
 * @param value - Value to be standardized.
 * @param meanValue - Arithmetic mean of the distribution
 * @param std - The standard deviation of the distribution or range.
 * @returns {number}
 * @constructor
 */
var STANDARDIZE = function (value, meanValue, std) {
  ArgsChecker.checkLength(arguments, 3, "STANDARDIZE");
  value = TypeConverter.firstValueAsNumber(value);
  meanValue = TypeConverter.firstValueAsNumber(meanValue);
  std = TypeConverter.firstValueAsNumber(std);
  if (std <= 0) {
    throw new NumError("Function STANDARDIZE parameter 3 value is " + std + ". It should be greater than 0.");
  }
  return (value - meanValue) / std;
};


/**
 * Returns the Nth smallest value in the range, ignoring text values.
 * @param range -  Range or data-set to consider.
 * @param n - N in 'Nth'.
 * @constructor
 */
var SMALL =  function (range, n) {
  ArgsChecker.checkLength(arguments, 2, "SMALL");
  var data = Filter.flattenAndThrow(range).filter(function (value) {
    return typeof value != "string";
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  }).sort(function (a, b) {
    return a - b;
  });
  if (n > data.length || n < 1) {
    throw new NumError("Function SMALL parameter 2 value " + n + " is out of range.");
  }
  return data[n - 1];
};


/**
 * Returns the Nth largest value in the range, ignoring text values.
 * @param range -  Range or data-set to consider.
 * @param n - N in 'Nth'.
 * @constructor
 */
var LARGE =  function (range, n) {
  ArgsChecker.checkLength(arguments, 2, "LARGE");
  var data = Filter.flattenAndThrow(range).filter(function (value) {
    return typeof value != "string";
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  }).sort(function (a, b) {
    return b - a;
  });
  if (n > data.length || n < 1) {
    throw new NumError("Function LARGE parameter 2 value " + n + " is out of range.");
  }
  return data[n - 1];
};


/**
 * Returns the kurtosis of a data set or range. Ignores text values.
 * @param values - data set or range to calculate. Must be at least 4 values.
 * @returns {number}
 * @constructor
 */
var KURT = function (...values) {
  ArgsChecker.checkAtLeastLength(values, 4, "KURT");
  var range = Filter.flattenAndThrow(values).filter(function (value) {
    return typeof value !== "string";
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });
  if (range.length < 4) {
    throw new DivZeroError("KURT requires more values in range. Expected: 4, found: " + range.length + ".");
  }
  var m = mean(range);
  var n = range.length;
  var sigma = 0;
  for (var i = 0; i < n; i++) {
    sigma += Math.pow(range[i] - m, 4);
  }
  sigma = sigma / Math.pow(stdev(range, true), 4);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sigma - 3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3));
};


/**
 * Calculates the y-value at which a line will intersect the y-axis by using known x-values and y-values. Any text
 * values will be ignored.
 * @param rangeY - Dependent range of values.
 * @param rangeX - Independent range of values.
 * @returns {number}
 * @constructor
 */
var INTERCEPT = function (rangeY, rangeX) {
  ArgsChecker.checkLength(arguments, 2, "INTERCEPT");
  var dataX = Filter.flattenAndThrow(rangeX).filter(function (value) {
    return typeof value !== "string";
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });
  var dataY = Filter.flattenAndThrow(rangeY).filter(function (value) {
    return typeof value !== "string";
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });

  if (dataX.length !== dataY.length) {
    throw new NAError("INTERCEPT has mismatched argument count " + dataX.length + " vs " + dataY.length + ".");
  }

  var xMean = mean(dataX);
  var yMean = mean(dataY);
  var n = dataX.length;
  var num = 0;
  var den = 0;
  for (var i = 0; i < n; i++) {
    num += (dataX[i] - xMean) * (dataY[i] - yMean);
    den += Math.pow(dataX[i] - xMean, 2);
  }
  if (den === 0) {
    throw new DivZeroError("Evaluation of function INTERCEPT caused a divide by zero error.");
  }
  var b = num / den;
  return yMean - b * xMean;
};


/**
 * Calculates the a future value using existing x-values and y-values. Any text values will be ignored.
 * @param x - The data point for which you would like to predict the value.
 * @param rangeY - Dependent range of values.
 * @param rangeX - Independent range of values.
 * @returns {number}
 * @constructor
 * TODO: This formula will fail to parse since the first argument is followed by an argument that is an array.
 * TODO (continued) This is a known issue.
 */
var FORECAST = function (x, rangeY, rangeX) {
  ArgsChecker.checkLength(arguments, 3, "FORECAST");
  x =  TypeConverter.firstValueAsNumber(x);
  var dataX = Filter.flattenAndThrow(rangeX).filter(function (value) {
    return typeof value !== "string";
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });
  var dataY = Filter.flattenAndThrow(rangeY).filter(function (value) {
    return typeof value !== "string";
  }).map(function (value) {
    return TypeConverter.valueToNumber(value);
  });

  if (dataX.length !== dataY.length) {
    throw new NAError("FORECAST has mismatched argument count " + dataX.length + " vs " + dataY.length + ".");
  }

  var xMean = mean(dataX);
  var yMean = mean(dataY);
  var n = dataX.length;
  var num = 0;
  var den = 0;
  for (var i = 0; i < n; i++) {
    num += (dataX[i] - xMean) * (dataY[i] - yMean);
    den += Math.pow(dataX[i] - xMean, 2);
  }
  if (den === 0) {
    throw new DivZeroError("Evaluation of function FORECAST caused a divide by zero error.");
  }
  var b = num / den;
  var a = yMean - b * xMean;
  return a + b * x;
};


/**
 * Returns the Poisson distribution for the given number. Functions the same as POISSON.DIST.
 * @param x - Number to use.
 * @param meanValue - The middle value for the Poisson distribution.
 * @param cumulative - [OPTIONAL] - 0 calculates the density function, 1 calculates the distribution. Defaults to 0.
 * @returns {number}
 * @constructor
 */
var POISSON = function (x, meanValue, cumulative?) {
  ArgsChecker.checkLengthWithin(arguments, 2, 3, "POISSON");
  x = TypeConverter.firstValueAsNumber(x);
  meanValue = TypeConverter.firstValueAsNumber(meanValue);
  cumulative = (cumulative === undefined) ? 0 : TypeConverter.firstValueAsNumber(cumulative);

  if (x < 0) {
    throw new NumError("Function POISSON parameter 1 value is " + x + ". It should be greater than or equal to 0.");
  }
  if (meanValue < 0) {
    throw new NumError("Function POISSON parameter 2 value is " + x + ". It should be greater than or equal to 0.");
  }

  function factorial(n) {
    return n < 0 ? NaN : gammafn(n + 1);
  }
  function poissonPDF(k, l) {
    return Math.pow(l, k) * Math.exp(-l) / factorial(k);
  }
  function poissonCDF(x, l) {
    var sumarr = [],
      k = 0;
    if (x < 0) return 0;
    for (; k <= x; k++) {
      sumarr.push(poissonPDF(k, l));
    }
    return sum(sumarr);
  };

  return (cumulative) ? poissonCDF(x, meanValue) : poissonPDF(x, meanValue);
};


/**
 * Returns the percentage rank (percentile) of the given value in a sample. Functions the same as PERCENTRANK.INC.
 * @param data - The array or range of data in the sample.
 * @param x - The value.
 * @param significance - [OPTIONAL] - The number of significant digits to use in the calculation. Defaults to 3.
 * @returns {number}
 * @constructor
 */
var PERCENTRANK = function (data, x, significance?) {
  ArgsChecker.checkLengthWithin(arguments, 2, 3, "PERCENTRANK");
  data = Filter.flattenAndThrow(data).map(TypeConverter.valueToNumber).sort(function (a, b) {
    return a - b;
  });
  x = TypeConverter.firstValueAsNumber(x);
  var uniques = Filter.unique(data);
  var n = data.length;
  var m = uniques.length;
  if (x < uniques[0] || x > uniques[m - 1]) {
    throw new NAError("PERCENTRANK does not have valid input data.");
  }
  if (m === 1 && uniques[0] === x) {
    return 1;
  }
  significance = (typeof significance === 'undefined') ? 3 : TypeConverter.firstValueAsNumber(significance);
  var power = Math.pow(10, significance);
  var result = 0;
  var match = false;
  var i = 0;
  while (!match && i < m) {
    if (x === uniques[i]) {
      result = data.indexOf(uniques[i]) / (n - 1);
      match = true;
    } else if (x >= uniques[i] && (x < uniques[i + 1] || i === m - 1)) {
      result = (data.indexOf(uniques[i]) + (x - uniques[i]) / (uniques[i + 1] - uniques[i])) / (n - 1);
      match = true;
    }
    i++;
  }
  var v = Math.floor(result * power) / power;
  if (isNaN(v)) {
    throw new NAError("PERCENTRANK does not have valid input data.");
  }
  return v;
};


/**
 * Returns the percentage rank (percentile) from 0 to 1 exclusive for a value in a sample.
 * @param data - The array or range of data in the sample.
 * @param x - The value
 * @param significance - [OPTIONAL] - The number of significant digits to use in the calculation. Defaults to 3.
 * @returns {number}
 * @constructor
 */
var PERCENTRANK$EXC = function (data, x, significance?) {
  ArgsChecker.checkLengthWithin(arguments, 2, 3, "PERCENTRANK.EXC");
  data = Filter.flattenAndThrow(data).map(TypeConverter.valueToNumber).sort(function (a, b) {
    return a - b;
  });
  x = TypeConverter.firstValueAsNumber(x);
  var uniques = Filter.unique(data);
  var n = data.length;
  var m = uniques.length;
  if (x < uniques[0] || x > uniques[m - 1]) {
    throw new NAError("PERCENTRANK.EXC does not have valid input data.");
  }
  if (m === 1 && uniques[0] === x) {
    return 1;
  }
  significance = (typeof significance === 'undefined') ? 3 : TypeConverter.firstValueAsNumber(significance);
  var power = Math.pow(10, significance);
  var result = 0;
  var match = false;
  var i = 0;
  while (!match && i < m) {
    if (x === uniques[i]) {
      result = (data.indexOf(uniques[i]) + 1) / (n + 1);
      match = true;
    } else if (x >= uniques[i] && (x < uniques[i + 1] || i === m - 1)) {
      result = (data.indexOf(uniques[i]) + 1 + (x - uniques[i]) / (uniques[i + 1] - uniques[i])) / (n + 1);
      match = true;
    }
    i++;
  }
  var v = Math.floor(result * power) / power;
  if (isNaN(v)) {
    throw new NAError("PERCENTRANK.EXC does not have valid input data.");
  }
  return v;
};


export {
  AVERAGE,
  AVERAGEA,
  AVERAGEIF,
  AVEDEV,
  CORREL,
  COUNT,
  COUNTA,
  PEARSON,
  MEDIAN,
  DEVSQ,
  EXPONDIST,
  FDIST$LEFTTAILED,
  FINV,
  FISHER,
  FISHERINV,
  MAX,
  MAXA,
  MIN,
  MINA,
  QUARTILE,
  PERCENTILE,
  STDEV,
  STDEVA,
  STDEVP,
  STDEVPA,
  TRIMMEAN,
  SLOPE,
  STANDARDIZE,
  SMALL,
  LARGE,
  KURT,
  INTERCEPT,
  FORECAST,
  POISSON,
  PERCENTRANK,
  PERCENTRANK$EXC
}