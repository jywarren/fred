//= require <timer>

// Central Fred source file; all other files are linked to from here.
Fred = {
	click_radius: 6,
	selection_color: '#a00',
	speed: 1000,
	height: '100%',
	width: '100%',
	// whether to display the Fred logo
	logo: true,
	layers: [],
	tools: [],
	frame: 0,
	timestamp: 0,
	date: new Date,
	pointer_x: 0,
	pointer_y: 0,
	height_offset: 0,
	style: {},
	times: [],
	// Whether the user is dragging.
	drag: false,
	// Events which will be auto-connected when new tools are added,
	// if there are corresponding on_<foo> methods defined.
	listeners: [	'mousedown',
			'mousemove',
			'mouseup',
			'dblclick',
			'touchstart',
			'touchmove',
			'touchend',
			'gesturestart',
			'gestureend'],
			// 'every_<time>', // listener to trigger periodical execution

	init: function(args) {
		Object.extend(Fred,args)
		Fred.element = $('fred')
		$$('body')[0].insert("<style>#fred canvas {display:block;clear:both;}body {margin:0;}</style>")
		//$$('body')[0].insert('<script src="lib/canvas.js" type="text/javascript"></script>')
		//$$('body')[0].insert('<script src="lib/shortcut.js" type="text/javascript"></script>')
		Fred.select_tool('pen')
		new Fred.Layer('main',{active:true})
		new Fred.Layer('background')
		Fred.select_layer(Fred.layers.first())
		// Event handling setup:
		Fred.observe('mousemove',Fred.on_mousemove)
		Fred.observe('touchmove',Fred.on_touchmove)
		Fred.observe('mouseup',Fred.on_mouseup)
		Fred.observe('mousedown',Fred.on_mousedown)
		Fred.observe('touchstart',Fred.on_touchstart)
		Fred.observe('touchend',Fred.on_touchend)
		Fred.currentWidth = 0
		var updateLayout = function() {
		if (window.innerWidth != Fred.currentWidth) {
		    Fred.currentWidth = window.innerWidth;
		    var orient = (Fred.currentWidth == 320) ? "profile" : "landscape";
		    document.body.setAttribute("orient", orient);
		    window.scrollTo(0, 1);
		}
		};
		setInterval(updateLayout, 400);
		Fred.resize()
		Event.observe(window, 'resize', Fred.resize_handler);
		// Access main program grid:
		var whtrbtobj
		// Initialize other modules which are waiting for Fred to be ready
		Fred.keys.initialize()
		// Attempt to connect locally (inline) defined draw() and setup() functions
                try { Fred.local_setup = setup || false } catch(e) { Fred.local_setup = false }
                try { Fred.local_draw = draw || false } catch(e) { Fred.local_draw = false }
		if (Fred.local_setup) Fred.local_setup()
		if (Fred.local_draw) Fred.local_draw()
		// Initiate main loop:
		if (!Fred.static) TimerManager.setup(Fred.draw,this,Fred.speed)
	},

	draw: function() {
		Fred.fire('fred:predraw')
		//calculate fps:
		Fred.timestamp = Fred.date.getTime()
		Fred.times.unshift(Fred.timestamp)
		if (Fred.times.length > 100) Fred.times.pop()
		Fred.fps = parseInt(Fred.times.length/(Fred.timestamp - Fred.times.last())*1000)
		Fred.date = new Date
		this.layers.each(function(layer){layer.draw()})
		Fred.fire('fred:postdraw')
		// debug image -- Fred logo
		if (Fred.logo) {
			fillStyle('#a00')
			beginPath()
				moveTo(0,0)
				lineTo(50,0)
				lineTo(0,50)
				lineTo(0,0)
			fill()
			save()
			translate(15,15)
			rotate(-45)
			translate(-15,-15)
				drawText('georgia',12,'white',0,25,'fred')
			restore()
		}
		if (Fred.debug) drawText('georgia',12,'black',Fred.width-60,30,Fred.fps+' fps')
		if (Fred.local_draw) Fred.local_draw()
	},

	pause: function() {
		TimerManager.paused = true
	},

	resume: function() {
		if (Fred.static) {
			Fred.static = false
			TimerManager.setup(Fred.draw,this,Fred.speed)
		}
		TimerManager.paused = false
	},

	select_layer: function(layer) {
		Fred.active_layer = layer
		$C = Fred.active_layer.canvas
		Fred.objects = Fred.active_layer.objects
		Fred.canvas = Fred.active_layer.canvas
	},

	/*
	 * Add an object to Fred's active layer and autodetect its event listeners
	 */
	add: function(obj) {
		this.objects.push(obj)
		this.attach_listeners(obj)
		return obj
	},

	/*
	 * Remove an object from Fred's active layer and disconnect its event listeners
	 */
	remove: function(obj) {
		Fred.objects.each(function(obj2,index){
			if (obj2 == obj) {
				Fred.objects.splice(index,1)
			}
		},this)
		this.detach_listeners(obj)
		return obj
	},

	// Used to auto-resize Fred; see Fred.init
	resize_handler: function(e,width,height) {
		Fred.resize(width,height)
	},

	resize: function(width,height) {
		width = width || document.viewport.getWidth() 
		height = height || document.viewport.getHeight()
		// document.viewport.getWidth() yields undefined in Android browser
		// try running without resizing just in Android -- disable rotate anyway 
		if (width[width.length-1] == '%') Fred.width = parseInt(document.viewport.getWidth()*100/width.substr(0,width.length-1))
		else Fred.width = width
		if (height[height.length-1] == '%') Fred.height = parseInt(document.viewport.getHeight()*100/height.substr(0,height.length-1))-Fred.height_offset
		else Fred.height = height-Fred.height_offset
		Fred.element.width = Fred.width
		Fred.element.height = Fred.height
		Fred.layers.each(function(layer){
			layer.element.width = Fred.width
			layer.element.height = Fred.height
		})
		Fred.draw()
	},

	/*
	 * Returns true if an object is a known object class; 
	 * this should eventually simply check if the object
	 * conforms to the Fred object spec. For now, accepted
	 * types should have an array of points, with point.x
	 * and point.y parameters.
	 */
	is_object: function(supposed_object) {
		var types = [Fred.Polygon,Fred.Group,Fred.Image]
		var passes = false //assume no
		types.each(function(type) {
			if (supposed_object instanceof type) passes = true
		},this)
		return passes
	},

	text_style: {
		fontFamily: 'georgia',
		fontSize: 15,
		fontColor: '#222',
	},

	text: function(text,x,y) {
		drawText(Fred.text_style.fontFamily,Fred.text_style.fontSize,Fred.text_style.fontColor,x,y,text)
	},

	on_mouseup: function(e) {
		Fred.drag = false
	},
	on_mousedown: function(e) {
		Fred.pointer_x = Event.pointerX(e)
		Fred.pointer_y = Event.pointerY(e)
		if (Fred.pointer_x+Fred.pointer_y < 50) {
			Fred.toolbar.toggle()
		}
		Fred.drag = true
	},
	on_mousemove: function(e) {
		Fred.pointer_x = Event.pointerX(e)
		Fred.pointer_y = Event.pointerY(e)-Fred.height_offset
	},
	on_touchstart: function(e) {
		Fred.pointer_x = e.touches[0].pageX
		Fred.pointer_y = e.touches[0].pageY
		console.log('touch!!')
		e.preventDefault()
		Fred.drag = true
	},
	on_touchmove: function(e) {
		e.preventDefault()
		Fred.pointer_x = e.touches[0].pageX
		Fred.pointer_y = e.touches[0].pageY
	},
	on_touchend: function(e) {
		e.preventDefault()
		Fred.drag = false
	},

	/*
	 * Deactivate old listeners. Can be run on any object with 
	 * a stored Hash of listeners, e.g. object.listeners.get(key)
	 */
	detach_listeners: function(obj) {
		$H(obj).keys().each(function(method) {
			Fred.listeners.each(function(event) {
				if (method == ('on_'+event)) {
					Fred.stop_observing(event,obj.listeners.get(method))
				}
			},this)
			if (method == 'draw') Fred.stop_observing('fred:postdraw',obj.listeners.get('draw'))
		},this)
	},

	/*
	 * Autodetect and activate listeners for any object. Object will receive 
	 * a stored Hash of listeners, e.g. object.listeners.get(key).
	 * If object already has such a hash it's stripped of listeners, and reattached
	 * from scratch.
	 */
	attach_listeners: function(obj) {
		if (Object.isHash(obj.listeners)) {
			Fred.detach_listeners(obj)
		}
		obj.listeners = new Hash
		// Scan tool for on_foo listeners, connect them to available events:
		$H(obj).keys().each(function(method) {
			Fred.listeners.each(function(event) {
				if (method == ('on_'+event)) {
					obj.listeners.set(method,obj[method].bindAsEventListener(obj))
					Fred.observe(event,obj.listeners.get(method))
				}
			},this)
			if (method == 'draw') {
				obj.listeners.set('draw',obj['draw'].bindAsEventListener(obj))
				Fred.observe('fred:postdraw',obj.listeners.get('draw'))
			}
		})
	},

	select_tool: function(tool) {
		if (Fred.active_tool) Fred.active_tool.deselect()
		Fred.detach_listeners(Fred.active_tool)
		Fred.active_tool = Fred.tools[tool]
		Fred.active_tool.select()
		Fred.attach_listeners(Fred.active_tool)
		if (Fred.toolbar.active) Fred.toolbar.update()
	},

	/**
	 * Moves the object (all its points as object.points, including beziers)
	 * but yields to the objects object.move(x,y,absolute) method if that exists
	 * and moves either to an absolute position or one relative to the object's
	 * current position.
	 */
	move: function(obj,x,y,absolute) {
		// If the object has its own way of moving, this is preferred.
		// Thinking of tweening, acceleration, recursion
		if (obj.move) {
			obj.move(x,y,absolute)
		} else if (Fred.is_object(obj)) {
			// we know how to deal with these
			obj.points.each(function(point){
				if (absolute) {
					point.x = point.x-obj.x+x
					point.y = point.y-obj.y+y
				} else {
					point.x += x
					point.y += y
				}
			},this)
			// must correct the object x,y also
			if (absolute) {
				obj.x = x
				obj.y = y
			} else {
				obj.x += x
				obj.y += y
			}
		}
	},

        /**
	 * Binds all events to the 'fred' DOM element. Use instead of native Prototype observe.
	 */
	observe: function(a,b,c) {
		if (a == 'keypress' || a == 'keyup') document.observe(a,b,c)
		else Fred.element.observe(a,b,c)
	},
	/**	
	 * Fires events. Use instead of native Prototype observe.
	 */
	fire: function(a,b,c) {
		if (a == 'keypress' || a == 'keyup') document.fire(a,b,c)
		else Fred.element.fire(a,b,c)
	},
	/**
	 * Unbinds all events from the main canvas. 
	 */
	stop_observing: function(a,b,c) {
		if (a == 'keypress' || a == 'keyup') document.stopObserving(a,b,c)
		else Fred.element.stopObserving(a,b,c)
	},
	// Eventually these errors will pop up in the user environment.
	error: function(e) {
		console.log(e)
	},
	///////////////////////
	// Miscellaneous functions which may someday find a home:
	///////////////////////

	/*
	 * Navigate to a new URL
	 */
	go: function(url) {
		window.location = url
	},
	/*
	 * Returns a triplet of values for red, green, 
	 * and blue for the given x,y position. Accepts 
	 * a 'size' parameter, returning an average color
	 * for an area of that height and width.
	 */
	get_color: function(x,y,size) {
		size = size || 1
		var raw = Fred.canvas.getImageData(x-parseInt((size+0.0001)/2),y-parseInt((size+0.0001)/2),size,size)
		return [raw.data[0],raw.data[1],raw.data[2],raw.data[3]]
	},
	/*
	 * Writes a pixel of the specified color to the given location.
	 */
	put_color: function(x,y,color) {
		Fred.canvas.putImageData(x,y,color)
	},
}

// For debugging purposes
// If the console doesn't exist (Safari, IE, etc), just create empty methods
if (!window.console) console = {};
console.log = console.log || function(){};
console.warn = console.warn || function(){};
console.error = console.error || function(){};
console.info = console.info || function(){};

//= require <layer>
//= require <selection>

//= require <primitives/object>
//= require <primitives/point>
//= require <primitives/polygon>
//= require <primitives/group>
//= require <primitives/image>

//= require <tools/tool>
//= require <tools/edit>
//= require <tools/pen>
//= require <tools/place>
//= require <tools/color>

//= require <toolbar>
//= require <geometry>
//= require <dialog>
//= require <keys>


