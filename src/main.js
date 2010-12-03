//= require <timer>

// Central Fred source file; all other files are linked to from here.
Fred = {
	click_radius: 6,
	speed: 30,
	height: '100%',
	width: '100%',
	layers: [],
	tools: [],
	frame: 0,
	timestamp: 0,
	date: new Date,
	pointer_x: 0,
	pointer_y: 0,
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
		Fred.select_tool('pen')
		new Fred.Layer('main',{active:true})
		new Fred.Layer('background')
		Fred.select_layer(Fred.layers.first())
		// Event handling setup:
		Fred.observe('mousemove',Fred.on_mousemove)
		Fred.observe('touchmove',Fred.on_touchmove)
		// Fred.observe('mouseup',Fred.on_mouseup)
		Fred.observe('touchstart',Fred.on_touchstart)
		Fred.observe('touchend',Fred.on_touchend)
		// Set up the main Fred DOM element:
		Fred.element.style.position = 'absolute'
		Fred.element.style.top = 0
		Fred.element.style.left = 0
		Fred.resize(Fred.width,Fred.height)
		// Initiate main loop:
		TimerManager.setup(Fred.draw,this,Fred.speed)
		// Access main program grid:
		var whtrbtobj
		// Initialize other modules which are waiting for Fred to be ready
		Fred.keys.initialize()
                try { setup = setup || false } catch(e) { setup = false }
                try { draw = draw || false } catch(e) { draw = false }
		if (setup) setup()
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
		// debug image
		fillStyle('#a00')
		rect(10,10,40,40)
		drawText('georgia',15,'white',12,30,'fred')
		if (draw) draw()
	},
	select_layer: function(layer) {
		Fred.active_layer = layer
		$C = Fred.active_layer.canvas
		Fred.objects = Fred.active_layer.objects
		Fred.canvas = Fred.active_layer.canvas
	},
	add: function(obj) {
		this.objects.push(obj)
		$H(obj).keys().each(function(method) {
			Fred.listeners.each(function(event) {
				if (method == ('on_'+event)) {
					Fred.observe(event,obj[method].bindAsEventListener(obj))
				}
			},this)
			if (method == 'draw') Fred.stop_observing('fred:postdraw',obj.draw)
		},this)
	},
	remove: function(obj) {
		Fred.objects.each(function(obj2,index){
			if (obj2 == obj) {
				Fred.objects.splice(index,1)
			}
		},this)
		$H(obj).keys().each(function(method) {
			Fred.listeners.each(function(event) {
				if (method == ('on_'+event)) {
					Fred.stop_observing(event,obj[method].bindAsEventListener(obj))
				}
			},this)
			if (method == 'draw') Fred.stop_observing('fred:postdraw',obj.draw)
		},this)
		return obj
	},
	resize: function(width,height) {
		width = width || Fred.width
		height = height || Fred.height
		// document.viewport.getWidth() yields undefined in Android browser
		// try running without resizing just in Android -- disable rotate anyway 
		if (width[width.length-1] == '%') Fred.width = parseInt(document.viewport.getWidth()*100/width.substr(0,width.length-1))
		else Fred.width = width
		if (height[height.length-1] == '%') Fred.height = parseInt(document.viewport.getHeight()*100/height.substr(0,height.length-1))
		else Fred.height = height
		Fred.element.style.width = width
		Fred.element.style.height = height
		Fred.layers.each(function(layer){
			layer.element.width = Fred.width
			layer.element.height = Fred.height
		})
	},
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
		Fred.drag = true
	},
	on_mousemove: function(e) {
		Fred.pointer_x = Event.pointerX(e)
		Fred.pointer_y = Event.pointerY(e)
		Fred.draw()
	},
	on_touchstart: function(e) {
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
	detach_listeners: function(object) {
		$H(object).keys().each(function(method) {
			Fred.listeners.each(function(event) {
				if (method == ('on_'+event)) {
					Fred.stop_observing(event,object.listeners.get(method))
				}
			},this)
			if (method == 'draw') Fred.stop_observing('fred:postdraw',object.listeners.get('draw'))
		},this)
	},
	/*
	 * Autodetect and activate listeners for any object. Object will receive 
	 * a stored Hash of listeners, e.g. object.listeners.get(key).
	 * If object already has such a hash it's stripped of listeners, and reattached
	 * from scratch.
	 */
	attach_listeners: function(object) {
		if (Object.isHash(object.listeners)) {
			Fred.detach_listeners(object)
		}
		object.listeners = new Hash
		// Scan tool for on_foo listeners, connect them to available events:
		$H(object).keys().each(function(method) {
			Fred.listeners.each(function(event) {
				if (method == ('on_'+event)) {
					object.listeners.set(method,object[method].bindAsEventListener(object))
					Fred.observe(event,object.listeners.get(method))
				}
			},this)
			if (method == 'draw') {
				object.listeners.set('draw',object['draw'].bindAsEventListener(object))
				Fred.observe('fred:postdraw',object.listeners.get('draw'))
			}
		})
	},
	select_tool: function(tool) {
		console.log('selecting '+tool)
		if (Fred.active_tool) Fred.active_tool.deselect()
		Fred.detach_listeners(Fred.active_tool)
		Fred.active_tool = Fred.tools[tool]
		Fred.active_tool.select()
		Fred.attach_listeners(Fred.active_tool)
	},
	/**
	 * Moves the object (all its points as object.points, including beziers)
	 * but yields to the objects object.move(x,y,absolute) method if that exists
	 * and moves either to an absolute position or one relative to the object's
	 * current position.
	 */
	move: function(object,x,y,absolute) {
		// If the object has its own way of moving, this is preferred.
		// Thinking of tweening, acceleration, recursion
		if (object.move) {
			object.move(x,y,absolute)
		} else if (Fred.is_object(object)) {
			// we know how to deal with these
			object.points.each(function(point){
				if (absolute) {
					point.x = point.x-object.x+x
					point.y = point.y-object.y+y
				} else {
					point.x += x
					point.y += y
				}
			},this)
			// must correct the object x,y also
			if (absolute) {
				object.x = x
				object.y = y
			} else {
				object.x += x
				object.y += y
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
	}
}

// For debugging purposes
// If the console doesn't exist (Safari, IE, etc), just create empty methods
if (!window.console) console = {};
console.log = console.log || function(){};
console.warn = console.warn || function(){};
console.error = console.error || function(){};
console.info = console.info || function(){};

//= require <layer>
//= require <selector>

//= require <primitives/object>
//= require <primitives/point>
//= require <primitives/polygon>
//= require <primitives/group>
//= require <primitives/image>

//= require <tools/tool>
//= require <tools/edit>
//= require <tools/pen>
//= require <tools/place>

//= require <geometry>
//= require <keys>


