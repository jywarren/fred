/**
 * @license 
 * jQuery Tools 1.2.0 / Mask - Dim the lights
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/toolbox/mask.html
 *
 * Since: Mar 2010
 * Date:    Tue Apr 20 19:26:58 2010 +0000 
 */

// imported into Bespin on 2010/05/06

"define metadata";
({
});
"end";

var $ = require("jquery").$;

// static constructs
$.tools = $.tools || {version: '1.2.0'};

var tool;

tool = $.tools.expose = {
	
	conf: {	
		maskId: 'exposeMask',
		loadSpeed: 'slow',
		closeSpeed: 'fast',
		closeOnClick: true,
		closeOnEsc: true,
		
		// css settings
		zIndex: 9998,
		opacity: 0.8,
		startOpacity: 0,
		color: '#fff',
		
		// callbacks
		onLoad: null,
		onClose: null
	}
};

/* one of the greatest headaches in the tool. finally made it */
function viewport() {
			
	// the horror case
	if ($.browser.msie) {
		
		// if there are no scrollbars then use window.height
		var d = $(document).height(), w = $(window).height();
		
		return [
			window.innerWidth || 							// ie7+
			document.documentElement.clientWidth || 	// ie6  
			document.body.clientWidth, 					// ie6 quirks mode
			d - w < 20 ? w : d
		];
	} 
	
	// other well behaving browsers
	return [$(window).width(), $(document).height()]; 
} 

function call(fn) {
	if (fn) { return fn.call($.mask); }
}

var mask, exposed, loaded, config, overlayIndex;		


$.mask = {
	
	load: function(conf, els) {
		
		// already loaded ?
		if (loaded) { return this; }			
		
		// configuration
		if (typeof conf == 'string') {
			conf = {color: conf};	
		}
		
		// use latest config
		conf = conf || config;
		
		config = conf = $.extend($.extend({}, tool.conf), conf);

		// get the mask
		mask = $("#" + conf.maskId);
			
		// or create it
		if (!mask.length) {
			mask = $('<div/>').attr("id", conf.maskId);
			$("body").append(mask);
		}
		
		// set position and dimensions 			
		var size = viewport();
			
		mask.css({				
			position:'absolute', 
			top: 0, 
			left: 0,
			width: size[0],
			height: size[1],
			display: 'none',
			opacity: conf.startOpacity,					 		
			zIndex: conf.zIndex 
		});
		
		// background color 
		var bg = mask.css("backgroundColor");
		
		if (!bg || bg == 'transparent' || bg == 'rgba(0, 0, 0, 0)') {
			mask.css("backgroundColor", conf.color);	
		}			
		
		// onBeforeLoad
		if (call(conf.onBeforeLoad) === false) {
			return this;
		}
		
		// esc button
		if (conf.closeOnEsc) {						
			$(document).bind("keydown.mask", function(e) {							
				if (e.keyCode == 27) {
					$.mask.close(e);	
				}		
			});			
		}
		
		// mask click closes
		if (conf.closeOnClick) {
			mask.bind("click.mask", function(e)  {
				$.mask.close(e);		
			});					
		}			
		
		// resize mask when window is resized
		$(window).bind("resize.mask", function() {
			$.mask.fit();
		});
		
		// exposed elements
		if (els && els.length) {
			
			overlayIndex = els.eq(0).css("zIndex");

			// make sure element is positioned absolutely or relatively
			$.each(els, function() {
				var el = $(this);
				if (!/relative|absolute|fixed/i.test(el.css("position"))) {
					el.css("position", "relative");		
				}					
			});
		 
			// make elements sit on top of the mask
			exposed = els.css({ zIndex: Math.max(conf.zIndex + 1, overlayIndex == 'auto' ? 0 : overlayIndex)});			
		}	
		
		// reveal mask
		mask.css({display: 'block'}).fadeTo(conf.loadSpeed, conf.opacity, function() {
			$.mask.fit(); 
			call(conf.onLoad);
		});
		
		loaded = true;			
		return this;				
	},
	
	close: function() {
		if (loaded) {
			
			// onBeforeClose
			if (call(config.onBeforeClose) === false) { return this; }
				
			mask.fadeOut(config.closeSpeed, function()  {					
				call(config.onClose);					
				if (exposed) {
					exposed.css({zIndex: overlayIndex});
				}				
			});				
			
			// unbind various event listeners
			$(document).unbind("keydown.mask");
			mask.unbind("click.mask");
			$(window).unbind("resize.mask");

			loaded = false;
		}
		
		return this; 
	},
	
	fit: function() {
		if (loaded) {
			var size = viewport();				
			mask.css({width: size[0], height: size[1]});
		}				
	},
	
	getMask: function() {
		return mask;	
	},
	
	isLoaded: function() {
		return loaded;	
	}, 
	
	getConf: function() {
		return config;	
	},
	
	getExposed: function() {
		return exposed;	
	}		
};

$.fn.mask = function(conf) {
	$.mask.load(conf);
	return this;		
};			

$.fn.expose = function(conf) {
	$.mask.load(conf, this);
	return this;			
};
