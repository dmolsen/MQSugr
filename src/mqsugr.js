/*!
 * MQSugr v1.0
 *
 * Copyright (c) 2011-2012 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license
 */

/**
* Creates a new MQSugr instance
* @param options.cssPath    the default path to the css files
* @param options.jsPath     the default path to the js files
* @param options.mm         the default value for min-width vs max-width
* @param options.mt         the default value for media type for the media queries (e.g. screen)
* @param options.lbd        the default files that should be loaded (e.g. css, js, both, none)
*/
function MQSugr(options) {
	this.cssPath    = 'css/';
	this.jsPath     = 'js/';
	this.mm         = 'min';
	this.mt         = 'screen';
	this.lbd        = 'css';
	
	if (options) {
		if (options.cssPath)
			this.cssPath = options.cssPath;
		if (options.jsPath)
			this.jsPath = options.jsPath;
		if (options.mm)
			this.mm = options.mm;
		if (options.mt)
			this.mt = options.mt;
		if (options.lbd) 
			this.lbd = options.lbd;
	}
	
	this.trackComplete = []; // to keep track of functions someone may submit via complete:
	this.trackCallback = []; // to keep track of callbacks someone may submit via callback:
	this.trackLoaded   = []; // to keep track of tests that were loaded. for resize purposes.
	
	// make sure that if a user resizes the window the tests are run again. also run on orientation change. 
	// note: ONLY runs when someone makes the screen LARGER. could be changed to use this.mm as a switch.
	this.startX = window.innerWidth;
	window.onresize = function() { mqsugr.check(breakpoints) };
	window.onorientationchange = function() { mqsugr.check(breakpoints); }
}

/**
* Removes whitespace at the beginning and end of a string
* @param  {String}   str    the string to be trimmed
*
* @return {String}          the trimmed string
*/
MQSugr.prototype.trimStr = function(str) {
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

/**
* Combines two objects overwriting properties as necessary
* @param  {String}   obj1   main object, properties will be overwritten by obj2
* @param  {String}   obj2   sub-object, its properties will overwrite obj1
*
* @return {Object}          the combined object
*/
MQSugr.prototype.mergeOptions = function(obj1,obj2) {
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

/**
* Sorts the final list of breakpoint tests by name so more general CSS is, hopefully, loaded before the more specific CSS
* @param  {Object}   a      first object to compare
* @param  {Object}   b      second object to compare
*
* @return {Integer}         the combined object
*/
MQSugr.prototype.sortByName = function(a,b) { 
	return a.filePath.length - b.filePath.length;
}

/**
* Sorts the final list of breakpoint tests so that JS is loaded before CSS. addresses a (perceived) Modernizr.load issue.
* @param  {Object}   a      first object to compare
* @param  {Object}   b      second object to compare
*
* @return {Integer}         the combined object
*/
MQSugr.prototype.sortByType = function(a,b) { 
	var av = (a.ft == 'css') ? 2 : 1;
	var bv = (b.ft == 'css') ? 2 : 1;
	return av - bv;
}

/**
* Checks if an item is in an array. Implemented to make sure that functions supplied in complete: only load once.
* Lifted from jQuery
* @param  {Object}   needle   the item being looked for in haystack
* @param  {Object}   haystack array containing the elements
*
* @return {Boolean}           the answer
*/
MQSugr.prototype.inArray = function(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}

/**
* Clone an object. Taken from: http://stackoverflow.com/a/728694
* @param  {Object}   obj      the object to be cloned
* @param  {Object}            the clonded object
*/
MQSugr.prototype.clone = function(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
		var i = 0;
        for (var len = obj.length; i < len; ++i) {
            copy[i] = this.clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
        }
        return copy;
    }
}

/**
* Cleans the final array before loading files. This way onResize doesn't cause the same file to load over & over
* @param  {Array}    array    the final array of tests to be cleaned up
*
* @return {Array}             the cleaned array
*/
MQSugr.prototype.clean = function(array) {
	_array = this.clone(array); // not sure this is really necessary
	for (item in _array) {
		types = [{ option: 'yep', result: true }, { option: 'nope', result: false }, { option: 'both', result: true }, { option: 'both', result: false} ];
		for (type in types) {
			if (_array[item][types[type].option] && (_array[item].test == types[type].result)) {
				if (!this.inArray(_array[item].filePath,this.trackLoaded)) {
					this.trackLoaded.push(_array[item].filePath);
				} else {
					delete _array[item][types[type].option]; // remove the yep: nope: or both: so modernizr doesn't load the file
				}
			}
		}
	}
	return _array;
}

/**
* Creates the yep:, nope:, or both: file path property for the Modernizr.load test
* @param  {String}   yepnope   the yep:, nope:, or both: properties if available
* @param  {String}   mq        media query to be used for the name of a default file
* @param  {String}   fileTest  name of the test to be used for the name of a default file
* @param  {String}   filePath  the location of js or css files
* @param  {String}   type      the type of file to be loaded, css or js
*
* @return {String}             the final path for the file
*/
MQSugr.prototype.createYepNopePath = function(yepnope,mq,fileTest,filePath,type) {
	// if yep:, nope:, or both: are supplied use them to build the yepnopePath
	if (yepnope) {
		var re = new RegExp('\{'+type+'Path\}'); // substitute {filePath} for the default filePath
		var yepnopePath = yepnope.replace(re,filePath);
	} else {
		yepnopePath = filePath+mq.replace(/px$/,'')+fileTest+'.'+type;
	}
	return yepnopePath;
}

/**
* Creates a full object for Modernizr.load for one test of a particular breakpoint
* @param  options.mq        the media query size that will be tested
* @param  options.mm        whether the media query # is for max-width or min-width
* @param  options.mt        what media type the test will target (e.g. screen)
* @param  options.ft        what type of file we'll be create the yepnopepath for
* @param  options.cssPath   the location of css files
* @param  options.jsPath    the location of js files
* @param  options._lbd      what type of files to load by default (e.g. css, js, both, none)
* @param  options.test      the feature test to be included with the media query
* @param  options.hiRes     whether we should also add the hi-res media query check to the test
*
* Modernizr.load default options
* @param  options.yep       default Modernizr.load yep: argument
* @param  options.nope      default Modernizr.load nope: argument
* @param  options.mboth     default Modernizr.load both: argument
* @param  options.callback  default Modernizr.load callback: argument
* @param  options.complete  default Modernizr.load complete: argument
*
* @return {Object}          the full Modernizr.load object
*/
MQSugr.prototype.createMTestObject = function(options) {
	
	var mq 			= options.mq;
	var cssPath 	= (options.cssPath) ? options.cssPath : this.cssPath;
	var jsPath 		= (options.jsPath) ? options.jsPath : this.jsPath;
	var ft			= (options.ft) ? options.ft : 'css';
	var mm 			= (options.mm) ? options.mm : this.mm;
	var mt 			= (options.mt) ? options.mt : this.mt;
	var fileTest	= (options.test) ? '.'+options.test.replace(/\ \|\|\ /,'-').replace(/\ \&\&\ /,'-') : ''; // replace ' || ' & ' && ' w/ '-' in the test string
	var filePath    = (ft == 'js') ? jsPath : cssPath;
	
	var MTestObject = {};
	
	// tests - combine the media query test w/ other feature tests if necessary
	MTestObject.test = Modernizr.mq('only '+mt+' and ('+mm+'-width: '+mq+')');
	if (options.test && (options.test != '')) {
		multiAnd = options.test.split(' && ');
		multiOr  = options.test.split(' || ');
		if (multiAnd.length != 1) {
			for (and in multiAnd) {
				MTestObject.test = MTestObject.test && Modernizr[multiAnd[and]];
			}
		} else if (multiOr.length != 1) {
			for (or in multiOr) {
				MTestObject.test = MTestObject.test || Modernizr[multiOr[or]];
			}
		} else {
			MTestObject.test = MTestObject.test && Modernizr[options.test];
		}
	}
	
	// hiRes - add a hi-res media query to the test
	if (options.hiRes) {
		MTestObject.test = MTestObject.test && Modernizr.mq('only '+mt+' and (-webkit-min-device-pixel-ratio: 1.5), only '+mt+' and (-o-min-device-pixel-ratio: 3/2), only '+mt+' and (min-device-pixel-ratio: 1.5)');
	}
	
	// add yep: to the test and nope: or both: if necessary
	if (options.yep || options.nope || options.mboth) {
		var ynTypes = ['yep','nope','mboth'];
		for (ynType in ynTypes) {
			var _ynType = (ynTypes[ynType] == 'mboth') ? 'both' : ynTypes[ynType];
			if (options[ynTypes[ynType]]) {
				MTestObject[_ynType] = this.createYepNopePath(options[ynTypes[ynType]],mq,fileTest,filePath,ft);
				MTestObject.filePath = MTestObject[_ynType];
			}
		}
	} else {
		MTestObject['yep'] = this.createYepNopePath(false,mq,fileTest,filePath,ft);
		MTestObject.filePath = MTestObject['yep'];
	}

	// callback - after loading a file make sure we support callback:, also make sure that the function selected only loads once
	// two tricks, the file will only load once & it'll only get added if the media query test passes
	if (options.callback && Modernizr.mq('only '+mt+' and ('+mm+'-width: '+mq+')')) {
		if (!this.inArray(options.callback.toString(),this.trackCallback)) {
			MTestObject.callback = options.callback;
			this.trackCallback.push(options.callback.toString());
		}
	}
	
	// complete - after loading a file make sure we support the modernizr.load 'complete' feature
	// two tricks, the file will only load once & it'll only get added if the media query test passes
	if (options.complete && Modernizr.mq('only '+mt+' and ('+mm+'-width: '+mq+')')) {
		if (!this.inArray(options.complete.toString(),this.trackComplete)) {
			MTestObject.complete = options.complete;
			this.trackComplete.push(options.complete.toString());
		}
	}

	// ft - provide a file type so that we can sort by file type before loading
	MTestObject.ft = (options.ft == 'js') ? 'js' : 'css';
	
	return MTestObject;
}

/**
* Breaks apart standard yep:, nope:, & both: requests so we can properly organize JS vs CSS files
* @param  {Object}   ynbOptions   the overall options for this test
*
* @return {Array}                the updated array
*/
MQSugr.prototype.breakUpYepNope = function(ynbOptions) {
	var MLoadObject = [];
	var ynbTypes = ['yep','nope','mboth'];
	for (ynbType in ynbTypes) {
		if (ynbOptions[ynbTypes[ynbType]]) {
			var ynbFiles = ynbOptions[ynbTypes[ynbType]];
			var _ynbOptions = this.clone(ynbOptions);
			_ynbOptions._lbd = 'none';
			for (_ynbType in ynbTypes) {
				if (ynbTypes[ynbType].toString() != ynbTypes[_ynbType].toString()) {
					if (_ynbOptions[ynbTypes[_ynbType]])
						delete _ynbOptions[ynbTypes[_ynbType]];
				}
			}
			if (typeof ynbFiles == 'string') {
				_ynbOptions.ft = (ynbFiles.match(/js$/)) ? 'js' : 'css';
				MLoadObject = MLoadObject.concat(this.breakUpTests(_ynbOptions, _ynbOptions.tests));	
			} else {
				for (path in ynbFiles) {
					_ynbOptions[ynbTypes[ynbType]] = ynbFiles[path];
					_ynbOptions.ft = (ynbFiles[path].match(/js$/)) ? 'js' : 'css';
					MLoadObject = MLoadObject.concat(this.breakUpTests(_ynbOptions, _ynbOptions.tests));
				}
			}
			_ynbOptions._lbd = '';
		}
	}
	return MLoadObject;
}

/**
* Check to see if the test string holds more than one test. loop through as appropriate
* @param  {Object}   options      an object that includes all of the options provided for this breakpoint test
* @param  {String}   testsString  the string that contains the test
*
* @return {Object}                the full Modernizr.load object
*/
MQSugr.prototype.breakUpTests = function(options, testsString) {
	var MLoadObject = [];
	if (!testsString)
		testsString = ''; // coming from the yepnope stuff the string might be undefined, complete hack but i'm really tired of this
	var tests = testsString.split(',');
	if (tests.length != 1) {
		for (test in tests) {
			var testOptions = this.clone(options);
			testOptions.test = this.trimStr(tests[test]);
			MLoadObject.push(this.createMTestObject(testOptions));
		}
	} else {
		var testOptions = this.clone(options);
		testOptions.test = testsString;
		MLoadObject.push(this.createMTestObject(testOptions));
	}
	return MLoadObject;
}

/**
* Loops through any sub-options (e.g. js:) and uses their options (if available) to override the default options
* @param  options           an object that includes all of the options provided for this breakpoint test
* @param  subOptions        an object that includes select options provided for the suboption
*
* @return {Object}          the full Modernizr.load object
*/
MQSugr.prototype.createMTestObjects = function(options, subOptions) {
	var MLoadObject = [];
	if (typeof subOptions == "string") {
		MLoadObject = MLoadObject.concat(this.breakUpTests(options, subOptions));
	} else {
		for (subOption in subOptions) {
			var _options = this.mergeOptions(options,subOptions[subOption]); // override the main options w/ the ones from the sub-object
			if (_options.yep || _options.nope || _options.mboth) {
				MLoadObject = MLoadObject.concat(this.breakUpYepNope(_options));
			} else {
				MLoadObject = MLoadObject.concat(this.breakUpTests(_options, _options.tests));
			}
		}
	}
	return MLoadObject;
}

/**
* Creates a full object for Modernizr.load for all of the tests for a particular breakpoint
* @param  options.lbd       what type of files to load by default (e.g. css, js, both, none)
* @param  options.tests     the tests that should use options.lbd to decide which files should be loaded
* @param  options.js        the tests that should load only js files
* @param  options.css       the tests that should load only css files
* @param  options.both      the tests that should load both css & js files
*
* @return {Object}          the full Modernizr.load object for a particular breakpoint
*/
MQSugr.prototype.createMLoadObject = function(options) {
	
	if (typeof options == "string") {
		var MLoadObject = {};
		MLoadObject = this.createMTestObject({ mq: options });
	} else {
		
		var lbd = (options.lbd) ? options.lbd : this.lbd;
		
		var MLoadObject = [];
		
		if (options.yep || options.nope || options.mboth) {
			MLoadObject = MLoadObject.concat(this.breakUpYepNope(options));
		} else {
			
			// css - see which files should be loaded for the provided type
			if (options.css) {
				options.ft = 'css';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.css));
			}

			// js - see which files should be loaded for the provided type
			if (options.js) {
				options.ft = 'js';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.js));
			}

			// both - see which files should be loaded for the provided type
			if (options.both) {
				options.ft = 'css';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.both));
				options.ft = 'js';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.both));
			}
			
			// tests - see which files should be loaded for the provided mq & tests
			if (options.tests) {
				if (lbd == 'both') {
					options.ft = 'css';
						MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
					options.ft = 'js';
						MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
				} else if (lbd == 'css') {
					options.ft = 'css';
						MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
				} else if (lbd == 'none') {
					// don't do anything, no idea why you'd provide tests and go none
				} else {
					options.ft = 'js';
						MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
				}
			}
			
			// lbd - see which files should be loaded for the provided mq
			if (lbd == 'both') {
				options.ft = 'css';
					MLoadObject.push(this.createMTestObject(options));
				options.ft = 'js';
					MLoadObject.push(this.createMTestObject(options));
			} else if (lbd == 'css') {
				options.ft = 'css';
					MLoadObject.push(this.createMTestObject(options));
			} else if (lbd == 'none') {
				// don't do anything
			} else {
				options.ft = 'js';
					MLoadObject.push(this.createMTestObject(options));
			}
		}
		
	}
	
	return MLoadObject;
}

/**
* Checks the list of breakpoints and options to see which files should be loaded via Modernizr.load
* @param  MQbreakpoints     the full list of breakpoints and options that should be tested
*/
MQSugr.prototype.check = function(MQbreakpoints) {
	var x = window.innerWidth;
	if (x >= this.startX) {
		this.startX = x;
		var MQbreakpointArray = [];	
		for (MQbreakpoint in MQbreakpoints) {
			MQbreakpointArray = MQbreakpointArray.concat(this.createMLoadObject(MQbreakpoints[MQbreakpoint]));
		}
		MQbreakpointArray.sort(this.sortByName); // making sure the files are in order of specificity (hopefully)
		MQbreakpointArray.sort(this.sortByType); // making sure the JS is loaded before the CSS
		MQbreakpointArray = this.clean(MQbreakpointArray); // turn the test to false if the file has already been loaded
		Modernizr.load(MQbreakpointArray);
	}	
}