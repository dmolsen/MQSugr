/*!
 * MQSugr v1.0
 *
 * Copyright (c) 2011-2012 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license
 *
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
	this.cssPath	= 'css/';
	this.jsPath		= 'js/';
	this.mm			= 'min';
	this.mt			= 'screen';
	this.lbd		= 'css';
	
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
}

/**
* Removes whitespace at the beginning and end of a string
* @param  {String}   str    the string to be trimmed
* @return {String}          the trimmed string
*/
MQSugr.prototype.trimStr = function(str) {
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

/**
* Combines two objects overwriting properties as necessary
* @param  {String}   obj1   main object, properties will be overwritten by obj2
* @param  {String}   obj2   sub-object, its properties will overwrite obj1
* @return {Object}          the combined object
*/
MQSugr.prototype.mergeOptions = function(obj1,obj2) {
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

/**
* Creates the yep:, nope:, or both: file path property for the Modernizr.load test
* @param  {String}   yepnope   the yep:, nope:, or both: properties if available
* @param  {String}   mq        media query to be used for the name of a default file
* @param  {String}   fileTest  name of the test to be used for the name of a default file
* @param  {String}   filePath  the location of js or css files
* @param  {String}   type      the type of file to be loaded, css or js
* @return {String}             the final path for the file
*/
MQSugr.prototype.createYepNopeObject = function(yepnope,mq,fileTest,filePath,type) {
	// if yep:, nope:, or both: are supplied use them to build the yepnopePath
	if (yepnope) {
		var re = new RegExp('\{'+type+'Path\}'); // substitute {filePath} for the default filePath
		if (typeof yepnope == 'string') {
			var yepnopePath = yepnope.replace(re,filePath);
		} else {
			var yepnopePath = [];
			for (path in yepnope) {
				yepnopePath.push(yepnope[path].replace(re,filePath));
			}
		}
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
	
	var MTestObject = {};
	
	// tests - combine the media query test w/ other feature tests if necessary
	MTestObject.test = Modernizr.mq('only '+mt+' and ('+mm+'-width: '+mq+')');
	if (options.test) {
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
	
	// yep - create the list of files to load, if the default files aren't being loaded still check for the yep: feature
	if (options._lbd == 'none') {
		options.yep 	= this.createYepNopeObject(options.yep,mq,fileTest,jsPath,'js');
		MTestObject.yep = this.createYepNopeObject(options.yep,mq,fileTest,cssPath,'css');
	} else if (ft == 'js') {
		MTestObject.yep = this.createYepNopeObject(options.yep,mq,fileTest,jsPath,'js');
	} else {
		MTestObject.yep = this.createYepNopeObject(options.yep,mq,fileTest,cssPath,'css');
	}
	
	// nope - create the list of files to load, if the default files aren't being loaded still check for the nope: feature
	if (options.nope) {
		if (options._lbd == 'none') {
			options.nope 	 = this.createYepNopeObject(options.nope,mq,fileTest,jsPath,'js');
			MTestObject.nope = this.createYepNopeObject(options.nope,mq,fileTest,cssPath,'css');
		} else if (ft == 'js') {
			MTestObject.nope = this.createYepNopeObject(options.nope,mq,fileTest,jsPath,'js');
		} else {
			MTestObject.nope = this.createYepNopeObject(options.nope,mq,fileTest,cssPath,'css');
		}
	}

	// both - create the list of files to load, if the default files aren't being loaded still check for the both: feature
	if (options.mboth) {
		if (options._lbd == 'none') {
			options.mboth 	 = this.createYepNopeObject(options.mboth,mq,fileTest,jsPath,'js');
			MTestObject.both = this.createYepNopeObject(options.mboth,mq,fileTest,cssPath,'css');
		} else if (ft == 'js') {
			MTestObject.both = this.createYepNopeObject(options.mboth,mq,fileTest,jsPath,'js');
		} else {
			MTestObject.both = this.createYepNopeObject(options.mboth,mq,fileTest,cssPath,'css');
		}
	}
	
	// complete - after loading a file make sure we support the modernizr.load 'complete' feature
	if (options.complete) {
		MTestObject.complete = options.complete;
	}
	
	return MTestObject;
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
		tests = subOptions.split(',');
		if (tests.length != 1) {
			for (test in tests) {
				options.test = this.trimStr(tests[test]);
				MLoadObject.push(this.createMTestObject(options));
			}
		} else {
			options.test = subOptions;
			MLoadObject.push(this.createMTestObject(options));
		}
	} else {
		for (test in subOptions) {
			var _options = this.mergeOptions(options,subOptions[test]); // override the main options w/ the ones from the sub-object
			MLoadObject.push(this.createMTestObject(_options));
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
		
		// lbd - see which files should be loaded for the provided mq
		if (lbd == 'both') {
			options.ft = 'css';
				MLoadObject.push(this.createMTestObject(options));
			options.ft = 'js';
				MLoadObject.push(this.createMTestObject(options));
		} else if (lbd == 'js') {
			options.ft = 'js';
				MLoadObject.push(this.createMTestObject(options));
		} else if (lbd == 'none') {
			// don't do anything
		} else {
			MLoadObject.push(this.createMTestObject(options));
		}
		
		// tests - see which files should be loaded for the provided mq & tests
		if (options.tests) {
			if (lbd == 'both') {
				options.ft = 'css';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
				options.ft = 'js';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
			} else if (lbd == 'js') {
				options.ft = 'js';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
			} else if (lbd == 'none') {
				// don't do anything, no idea why you'd provide tests and go none
			} else {
				options.ft = 'css';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
			}
		}
		
		// if defaults aren't loaded but yep, nope, or both are available create the default test for them
		if ((lbd == 'none') && (options.yep || options.nope || options.mboth)) {
			options._lbd = 'none';
			MLoadObject.push(this.createMTestObject(options));
			options._lbd = '';
		}
		
		// js - see which files should be loaded for the provided type
		if (options.js) {
			options.ft = 'js';
				MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.js));
		}
		
		// css - see which files should be loaded for the provided type
		if (options.css) {
			options.ft = 'css';
				MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.css));
		}
		
		// both - see which files should be loaded for the provided type
		if (options.both) {
			options.ft = 'css';
				MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.both));
			options.ft = 'js';
				MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.both));
		}
		
	}
	
	return MLoadObject;
}

/**
* Checks the list of breakpoints and options to see which files should be loaded via Modernizr.load
* @param  MQbreakpoints     the full list of breakpoints and options that should be tested
*/
MQSugr.prototype.check = function(MQbreakpoints) {	
	for (MQbreakpoint in MQbreakpoints) {
		var MQbreakpointObject = this.createMLoadObject(MQbreakpoints[MQbreakpoint]);
		console.log(MQbreakpointObject);
		Modernizr.load(MQbreakpointObject);
	}
}