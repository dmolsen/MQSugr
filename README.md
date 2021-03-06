# MQSugr #

MQSugr is a wrapper for [Modernizr.load](http://www.modernizr.com/docs/#load) that provides some syntactic sugar for loading CSS and JavaScript files using media queries
and browser features. MQSugr was created to help me learn more about JavaScript, media queries, file loading and Modernizr. I don't think it solves any real problem.

## Sugar Isn't Always Good for You ##

`Modernizr.load` already does a good job of using media queries for loading files.  Some reasons why this little project
might not be a good fit for you:

* at **5K minified** it's very heavy for something that is probably easier to type out by hand or that you might not even have worry about. compare the [MQSugr code](https://gist.github.com/1567142) that powers the demo vs. [Modernizr.load code](https://gist.github.com/1570854).
* if you use this to load CSS files you _will_ experience FOUC. see the [demo](http://dmolsen.com/mqsugr/) for a good example of this in action. you probably should load base breakpoint CSS files with a `<link>` tag and the `media` attribute.
* rather than load one minified file or one stylesheet it will make multiple requests. when using the default `min-width` to test it shouldn't be bad for mobile devices. `max-width` tho...
* it's a _brittle_ solution because I may or may not keep up with all the features of `Modernizr.load`. let's go under the assumption I won't.

## Features of MQSugr ##

List of features:

* Load CSS & JavaScript files based on media queries & browser features.
* Simple format. The normal `Modernerizr.load` format can also be used.
* Standard file naming convention to help make it easier to organize files based on breakpoints.
* Attempts to load CSS in order _(e.g. general media query CSS should be loaded before specific, test-related CSS)_.
* Media queries are continually tested as a user resizes their browser _larger_ or changes the orientation of their device.
* Uses Modernizr to test media queries & browser features.
* Uses `Modernizr.load` to dynamically load files.

## Demo of MQSugr ##

A very [simple demo of MQSugr](http://dmolsen.com/mqsugr/) is available.

## Using MQSugr ##

Using MQSugr is fairly straightforward. It can get complicated fast depending on what you want to do though.

### Using a Custom Version of Modernizr ###

Obviously you'll need to include the proper version of [Modernizr](http://www.modernizr.com/download/). Note
that the default download of Modernizr _does not_ come with `Modernizr.load`. You _must_ select it 
if you don't want to use the full set of tests included with this distribution.

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
    lbd     = 'css';    // the default files that should be loaded (can be css, js, both, or none)

These defaults can be overridden by simply including the new values in the call to initialize MQSugr like so:

    var mqsugr = new MQSugr({ cssPath: 'stylesheets/', lbd: 'none', mm: 'max' });

You can also override these options on a per breakpoint and per test basis.

### File Naming Conventions ###

If you use the default syntax for MQSugr you shouldn't have to type in any file names and, instead should be able to
rely on the standard file naming convention. It works like this:

    {breakpoint}{.test}.{filetype}

So two quick examples:

	  // if true, loads css/720.css
    breakpoint: '720px'

    // if true, loads css/720.css and js/720.cssanimations.js
    breakpoint: { mq: '720px', js: 'cssanimations' }

Please note, if you use the default settings, the CSS for the given media query will always be requested _(e.g. 720.css)_. There
are more examples listed below.

### Creating Breakpoints ###

Breakpoints and their related tests are the core of MQSugr. The names of the tests just match [those features detected by Modernizr](http://www.modernizr.com/docs/#s2). 
I assume that if you use [custom tests](http://www.modernizr.com/docs/#addtest) they'll work. I haven't tried The following are examples of how you could use them to load specific files:

    // loads 720.css if min-width is 720px
    breakpoint: '720px' 

    // loads 720.css & 720.js if min-width is 720px
    breakpoint: { mq: '720px', lbd: 'both' }

    // loads 720.css if min-width is 720px, loads 720.cssanimations.css if min-width is 720px & CSS animations are supported
    // by default, if file type isn't specified CSS is loaded
    breakpoint: { mq: '720px', tests: 'cssanimations' }
		
    // loads 720.css, 720.cssanimations.js, 720.borderradius.js
    // when separated by a comma each feature, cssanimations & borderradius, is tested individually w/ the media query
    breakpoint: { mq: '720px', js: 'cssanimations,borderradius' }
		
    // loads 720.js, 720.cssanimations-borderradius.js
    // both features must exist with the media query to be loaded, || also works. you can also add more tests with a comma
    breakpoint: { mq: '720px', js: 'cssanimations && borderradius' }
		
    // loads 720.cssanimations.js for devices w/ max-width of 720px	& 720.borderradius.js for devices w/ a min-width of 720px			
    breakpoint: { mq: '720px', lbd: 'none', js: [{ tests: 'cssanimations', mm: 'max' },{ tests: 'borderradius', mm: 'min' }]} 

In addition to `js:` you can use `css:` and `both:`. Again, all of the defaults from above can be included as well.

### Loading Files Across Breakpoints ###

If you need to load files across multiple breakpoints just use `min-width` & `max-width` to load them
across the appropriate breakpoints. For example, by default MQSugr uses `min-width` & we want the
`720.cssanimations.js` file to load for an iPad in either portrait or landscape but have separate styles for landscape. The breakpoint tests for that
would look like:

    breakpoint1: { mq: '600px', js: 'cssanimations' },
    breakpoint2: '801px'

If the width of the window is greater than 600px but less than 801px this will only load `600.css` & `600.cssanimations.js`. 
If the width of the window is equal too or greater than 801px it will load `801.css`, `600.css` & `600.cssanimations.js`.

### Using Modernizr.load Defaults ###
		
Obviously the previous examples use the file naming convention. If you don't want to rely on that you 
can still use `Modernizr.load`'s default behavior to load files. The one trick is that you can also
use the default paths that you set-up when you initialized MQSugr by using {cssPath} and {jsPath}.

    // loads css2/foo.css and amazing.js w/ the default path if min-width is 720px
    breakpoint: { mq: '720px', yep: ['css2/foo.css','{jsPath}amazing.js'] }

    // loads snow.js w/ the default path if max-width is 720px and cssanimations are supported
    breakpoint: { mq: '720px', mm: 'max', js: [{ test: 'cssanimations', yep: '{jsPath}snow.js' }] }

`nope:`, `both:` _(as mboth:)_, `callback:` & `complete:` are also supported. `load:` isn't currently supported but I can always add it
or add a pull request with the fix.

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

## Thanks ##

Thanks to the guys behind [Modernizr](http://www.modernizr.com/) (Faruk Ateş, Paul Irish, & Alan Sexton) and [YepNope](http://yepnopejs.com/) (Alan again & Ralph Holtzmann) for giving me some fun libraries to play with. 
