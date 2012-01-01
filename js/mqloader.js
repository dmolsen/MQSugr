/* set-up the base properties for MQLoader */
function MQLoader(options) {
	this.cssPath	= 'css/';
	this.jsPath		= 'js/';
	this.mm			= 'min';
	this.mediaType	= 'screen';
	this.load		= 'css';
	
	if (options) {
		if (options.cssPath)
			this.cssPath = options.cssPath;
		if (options.jsPath)
			this.jsPath = options.jsPath;
		if (options.mm)
			this.mm = options.mm;
		if (options.mediaType)
			this.mediaType = options.mediaType;
		if (options.load) 
			this.load = options.load;
	}
}

MQLoader.prototype.trimStr = function(str) {
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

MQLoader.prototype.mergeOptions = function(obj1,obj2) {
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

MQLoader.prototype.createYepNopeObject = function(yepnope,mq,fileTest,filePath,type) {
	if (yepnope) {
		var re = new RegExp('\{'+type+'Path\}');
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

/*
for individual tests:
	test: what specific modernizr feature to test
	yep: override the naming convention, can substitute {jsPath} if using different file name but same default path
	nope: override the naming convention, can substitute {cssPath} if using a different file name but same default path
	mboth: in case some needs to access the modernizr both attribute
	complete: do something with, most likely, js after code is loaded
	mm: if this test should be a min or max-width
	mediaType: what media type to test against
	jsPath: if a different path should be provided
	cssPath: if a different path should be provided
	hiRes: true, false[d] - if hi-res properties should also be tested for this file
*/

MQLoader.prototype.createMTestObject = function(options) {
	
	var mq 			= options.mq;
	var cssPath 	= (options.cssPath) ? options.cssPath : this.cssPath;
	var jsPath 		= (options.jsPath) ? options.jsPath : this.jsPath;
	var fileType	= (options.fileType) ? options.fileType : 'css';
	var mm 			= (options.mm) ? options.mm : this.mm;
	var mediaType 	= (options.mediaType) ? options.mediaType : this.mediaType;
	var fileTest	= (options.test) ? '.'+options.test.replace(/\ \|\|\ /,'-').replace(/\ \&\&\ /,'-') : ''; // strip ' || ' & ' && ' 
	
	var MTestObject = {};
	
	// tests - combine the media query test w/ other feature tests if necessary
	MTestObject.test = Modernizr.mq('only '+mediaType+' and ('+mm+'-width: '+mq+')');
	if (options.test) {
		multiAnd = options.test.split(' && ');
		multiOr = options.test.split(' || ');
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
		MTestObject.test = MTestObject.test && Modernizr.mq('only '+mediaType+' and (-webkit-min-device-pixel-ratio: 1.5), only '+mediaType+' and (-o-min-device-pixel-ratio: 3/2), only '+mediaType+' and (min-device-pixel-ratio: 1.5)');
	}
	
	// yep - create the file load if the modernizr.load 'yep' feature is used, filled out by default
	if (fileType == 'js') {
		MTestObject.yep = this.createYepNopeObject(options.yep,mq,fileTest,jsPath,'js');
	} else {
		MTestObject.yep = this.createYepNopeObject(options.yep,mq,fileTest,cssPath,'css');
	}
	
	// nope - create the file load if the modernizr.load 'nope' feature is used
	if ((fileType == 'js') && (options.nope)) {
		MTestObject.nope = this.createYepNopeObject(options.nope,mq,fileTest,jsPath,'js');
	} else if (options.nope) {
		MTestObject.nope = this.createYepNopeObject(options.nope,mq,fileTest,cssPath,'css');
	}
	
	// both - create the file load if the modernizr.load 'both' feature is used
	if ((fileType == 'js') && (options.mboth)) {
		MTestObject.both = this.createYepNopeObject(options.mboth,mq,fileTest,jsPath,'js');
	} else if (options.mboth) {
		MTestObject.both = this.createYepNopeObject(options.mboth,mq,fileTest,cssPath,'css');
	}
	
	// complete - after loading a file make sure we support the modernizr.load 'complete' feature
	if (options.complete) {
		MTestObject.complete = options.complete;
	}
	
	return MTestObject;
}

MQLoader.prototype.createMTestObjects = function(options, subOptions) {
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

/* 

options that can be on an object:
	mq: what px string to test
	load: both, js, css[d], none - what type of files to load by default for mq
	tests: other tests to run using the default type & mq
	both: load both css & js for the following tests
	js: load js only for the following tests
	css: load css only for the following tests

*/

MQLoader.prototype.createMLoadObject = function(options) {
	
	if (typeof options == "string") {
		var MLoadObject = {};
		MLoadObject = this.createMTestObject({ mq: options });
	} else {
		
		var load = (options.load) ? options.load : this.load;
		
		var MLoadObject = [];
		
		// load - see which files should be loaded for the provided mq
		if (load == 'both') {
			options.fileType = 'css';
				MLoadObject.push(this.createMTestObject(options));
			options.fileType = 'js';
				MLoadObject.push(this.createMTestObject(options));
		} else if (load == 'js') {
			options.fileType = 'js';
				MLoadObject.push(this.createMTestObject(options));
		} else if (load == 'none') {
			// don't do anything
		} else {
			MLoadObject.push(this.createMTestObject(options));
		}
		
		// tests - see which files should be loaded for the provided mq & tests
		if (options.tests) {
			if (load == 'both') {
				options.fileType = 'css';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
				options.fileType = 'js';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
			} else if (load == 'js') {
				options.fileType = 'js';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
			} else if (load == 'none') {
				// don't do anything, no idea why you'd provide tests and go none
			} else {
				options.fileType = 'css';
					MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.tests));
			}
		}
		
		// js - see which files should be loaded for the provided type
		if (options.js) {
			options.fileType = 'js';
				MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.js));
		}
		
		// css - see which files should be loaded for the provided type
		if (options.css) {
			options.fileType = 'css';
				MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.css));
		}
		
		// both - see which files should be loaded for the provided type
		if (options.both) {
			options.fileType = 'css';
				MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.both));
			options.fileType = 'js';
				MLoadObject = MLoadObject.concat(this.createMTestObjects(options, options.both));
		}
		
	}
	
	return MLoadObject;
}

// iterate through each breakpoint that is provided & their options
// create the object to be loaded by Modernizr.load
MQLoader.prototype.check = function(MQbreakpoints) {	
	for (MQbreakpoint in MQbreakpoints) {
		var MQbreakpointObject = this.createMLoadObject(MQbreakpoints[MQbreakpoint]);
		console.log(MQbreakpointObject);
		Modernizr.load(MQbreakpointObject);
	}
}