# MQSugr #

MQSugr is a wrapper that provides some syntactic sugar for loading CSS and JavaScript files using media queries
and browser features with `Modernizr.load`. 

## Sugar Isn't Always Good ##

`Modernizr.load` already does a good job of using media queries for loading files. MQSugr was created to help me
learn more about Modernizr, media queries, and JavaScript. While I think I could have used this for organizing
files and properly loading JavaScript for a recent project it's a bit much (4K) for such a really simple task
with `Modernizr.load` and `Modernizr.mq`.

## Features of MQSugr ##

Some list of features...

## Using MQSugr ##

Using MQSugr is fairly straightforward. It can get complicated fast depending on what you want to do though.

### Downloading Modernizr ###

Obviously you'll need to include the proper version of [Modernizr](http://www.modernizr.com/download/). Note
that the default download of Modernizr _does not_ come with `Modernizr.load`. You _must_ create a custom 
download if you don't want to use the full set of tests included with this distribution.

### Initializing MQSugr & Checking Breakpoints ###

Initialize MQSugr and starting the check for breakpoints to load files is really easy. Simply include the 
following before the closing `/body` tag:

    <script type="text/javascript">
			var mqsugr = new MQSugr();			
			var breakpoints = { 
				breakpoint1: { mq: '600px', tests: 'cssanimations' },
				breakpoint2: { mq: '1025px', tests: 'draganddrop' }
			};
			mqsugr.check(breakpoints);
		</script>

### Changing Default Options for MQSugr ###

The following options are set-up by default to be used when creating media queries and file paths:

		cssPath	= 'css/';   // the default path to the css files
		jsPath  = 'js/';    // the default path to the js files
		mm      = 'min';    // the default value for min-width vs max-width
		mt      = 'screen'; // the default value for media type for the media queries (e.g. screen)
		lbd		  = 'css';    // the default files that should be loaded _(can be css, js, both, or none)_

These defaults can be overridden by simply including the new values in the call to initialize MQSugr like so:

    var mqsugr = new MQSugr({ cssPath: 'stylesheets/', lbd: 'none', mm: 'max' });

### Creating Breakpoints ###

Breakpoints and the resulting tests are the core of MQSugr. The following are examples of how you could use
them to load specific files:

    // loads 720.css if min-width is 720px
    breakpoint: '720px' 

    // loads 720.css & 720.js if min-width is 720px
    breakpoint: { mq: '720px', lbd: 'both' }

   	// loads 720.css, 720.cssanimations.css if min-width is 720px
		breakpoint: { mq: '720px', tests: 'cssanimations' }
		
		// loads 720.css, 720.cssanimations.css, 720.borderradius.css if min-width is 720px
		// each feature, cssanimations & borderradius, are tested individually w/ the media query
		breakpoint: { mq: '720px', tests: 'cssanimations,borderradius' }
		
		// loads 720.css, 720.cssanimations-borderradius.css if min-width is 720px
		// both features must exist with the media query to be loaded, || also works
		breakpoint: { mq: '720px', tests: 'cssanimations && borderradius' }
		
		// loads 720.css, 720.cssanimations.js if min-width is 720px
		breakpoint: { mq: '720px', js: 'cssanimations' }
		
		// loads 720.cssanimations.js for devices w/ max-width of 720px					
		breakpoint: { mq: '720px', lbd: 'none', js: [{ test: 'cssanimations', mm: 'max' }]} 
		
Obviously the previous examples use the file naming convention. If you don't want to rely on that you 
can use `Modernizr.load`'s default behavior to load files. The one trick is that you can still 
use the default paths that you set-up when you initialized MQSugr by using {cssPath} and {jsPath}.

    // loads css2/foo.css and amazing.js w/ the default path if min-width is 720px
    breakpoint: { mq: '720px', lbd: 'none', yep: ['css2/foo.css','{jsPath}amazing.js'] }

		// loads snow.js w/ the default path if min-width is 720px and cssanimations are supported
		breakpoint6: { mq: '720px', lbd: 'none', js: [{ test: 'cssanimations', yep: '{jsPath}snow.js' }] }

`nope:`, `both:` _(as mboth:)_, & `complete:` are also supported.

### Suggested Breakpoints ###

In case you're curious here are some breakpoints that you might want to keep in mind. They were
provided by [@ryanve](http://stackoverflow.com/users/770127/ryanve) on [Stack Overflow](http://stackoverflow.com/a/7354648):

   /* regular breakpoints
   min-width: 320px  // smartphones, portrait iPhone, portrait 480x320 phones (Android)
   min-width: 480px  // smartphones, Android phones, landscape iPhone
   min-width: 600px  // portrait tablets, portrait iPad, e-readers (Nook/Kindle), landscape 800x480 phones (Android)
   min-width: 801px  // tablet, landscape iPad, lo-res laptops ands desktops
   min-width: 1025px // big landscape tablets, laptops, and desktops
   min-width: 1281px // hi-res laptops and desktops

   /* 960 grid systems
   min-width: 320px  // smartphones, iPhone, portrait 480x320 phones
   min-width: 481px  // portrait e-readers (Nook/Kindle), smaller tablets @ 600 or @ 640 wide.
   min-width: 641px  // portrait tablets, portrait iPad, landscape e-readers, landscape 800x480 and 854x480 phones
   min-width: 961px  // tablet, landscape iPad, lo-res laptops ands desktops
   min-width: 1025px // big landscape tablets, laptops, and desktops
   min-width: 1281px // hi-res laptops and desktops
