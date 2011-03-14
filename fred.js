var TimerManager = {
	last_date: new Date,
	times: [],
	spacing: 4,
	interval: 10,
	setup: function(f,c,i) {
		this.f = f || function(){}
		this.context = c || this
		this.interval = i || this.interval
		setTimeout(this.bound_run,this.interval)
	},
	bound_run: function() {
		TimerManager.run.apply(TimerManager)
	},
	run: function() {
		var start_date = new Date
		if (!this.paused) this.f.apply(this.context)
		var execution_time = new Date - start_date
		this.times.unshift(parseInt(execution_time))
		if (this.times.length > 100) this.times.pop()
		setTimeout(this.bound_run,parseInt(this.spacing*this.sample()))
	},
	sequence: [1,2,3,5,8,13],//,21,34,55],
	sample: function() {
		var sample = 0,samplesize = Math.min(this.sequence.length,this.times.length)
		for (var i = 0;i < samplesize;i++) {
			sample += this.times[this.sequence[i]] || 0
		}
		return sample/samplesize
	},
}

Fred = {
	click_radius: 6,
	selection_color: '#a00',
	speed: 1000,
	height: '100%',
	width: '100%',
	logo: true,
	layers: [],
	tools: [],
	frame: 0,
	timestamp: 0,
	date: new Date,
	get_timestamp: function() { return Fred.date.getTime() },
	longclicked: false, // instead of reinitializing the longclick timers, this allows users to continue monitoring how long the mouse is held down
	longclick_time: 1000, // in milliseconds, how long the mouse must be pressed to trigger a longclick
	mousedown_start_time: 0, // when the mouse was pressed
	mousedown_time: 0, // how long the mouse has been down
	mouse_is_down: false, // whether the mouse is currently down
	pointer_x: 0,
	pointer_y: 0,
	height_offset: 0,
	times: [],
	drag: false,
	listeners: [	'mousedown',
			'mousemove',
			'mouseup',
			'dblclick',
			'touchstart',
			'touchmove',
			'touchend',
			'gesturestart',
			'gestureend',
			'fred:longclick'], // this is implemented in Fred, not natively

	init: function(args) {
		Object.extend(Fred,args)
		Fred.element = $('fred')
		$$('body')[0].insert("<style>#fred canvas {display:block;clear:both;}body {margin:0;}</style>")
		Fred.select_tool('pen')
		new Fred.Layer('main',{active:true})
		new Fred.Layer('background')
		Fred.select_layer(Fred.layers.first())
		Fred.observe('mousemove',Fred.on_mousemove)
		Fred.observe('touchmove',Fred.on_touchmove)
		Fred.observe('mouseup',Fred.on_mouseup)
		Fred.observe('mousedown',Fred.on_mousedown)
		Fred.observe('dblclick',Fred.on_dblclick)
		Fred.observe('fred:longclick',Fred.on_longclick)
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
		var whtrbtobj
		Fred.keys.initialize()
                try { Fred.local_setup = setup || false } catch(e) { Fred.local_setup = false }
                try { Fred.local_draw = draw || false } catch(e) { Fred.local_draw = false }
		if (Fred.local_setup) Fred.local_setup()
		if (Fred.local_draw) Fred.local_draw()
		if (!Fred.static) TimerManager.setup(Fred.draw,this,Fred.speed)
	},

	draw: function() {
		Fred.fire('fred:predraw')
		Fred.timestamp = Fred.date.getTime()
		Fred.times.unshift(Fred.timestamp)
		if (Fred.times.length > 100) Fred.times.pop()
		Fred.fps = parseInt(Fred.times.length/(Fred.timestamp - Fred.times.last())*1000)
		Fred.date = new Date
		this.layers.each(function(layer){layer.draw()})
		Fred.fire('fred:postdraw')
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
		Fred.mousedown_time = Fred.get_timestamp() - Fred.mousedown_start_time
		if (Fred.mouse_is_down && !Fred.longclicked && Fred.mousedown_time > Fred.longclick_time) {
			if (true) { //mouse has not moved, much
				Fred.fire('fred:longclick')
				Fred.longclicked = true
			}
		}
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

	resize_handler: function(e,width,height) {
		Fred.resize(width,height)
	},

	resize: function(width,height) {
		width = width || document.viewport.getWidth()
		height = height || document.viewport.getHeight()
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

	default_style: {
		fill: '#ccc',
		stroke: '#222',
		lineWidth: 1,
		textsize: 15,
		textfill: '#222',
		font: 'georgia',
		pattern: false,
		padding: 10,
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
		Fred.mouse_is_down = false
	},
	on_mousedown: function(e) {
		Fred.pointer_x = Event.pointerX(e)
		Fred.pointer_y = Event.pointerY(e)-Fred.height_offset
		if (Fred.pointer_x+Fred.pointer_y < 50) {
			Fred.toolbar.toggle()
		}
		Fred.drag = true
		Fred.mouse_is_down = true
		Fred.longclicked = false
		Fred.mousedown_start_time = Fred.get_timestamp()
	},

	on_mousemove: function(e) {
		Fred.pointer_x = Event.pointerX(e)
		Fred.pointer_y = Event.pointerY(e)-Fred.height_offset
	},

	on_dblclick: function(e) {
	},

	/*
	 * This is Fred-created, not a standard JavaScript event, so it has no "e" parameter
	 */
	on_longclick: function() {
	},
	on_touchstart: function(e) {
		if (Fred.pointer_x+Fred.pointer_y < 50) {
			Fred.toolbar.toggle()
		}
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
				if (event.substr(0,5) == "fred:") e = event.substr(5,event.length)
				else e = event
				if (method == ('on_'+e)) {
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
		$H(obj).keys().each(function(method) {
			Fred.listeners.each(function(event) {
				if (event.substr(0,5) == "fred:") e = event.substr(5,event.length)
				else e = event
				if (method == ('on_'+e)) {
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

	move: function(obj,x,y,absolute) {
		absolute = absolute || false
		if (obj.move) {
			obj.move(x,y,absolute)
		} else if (Fred.is_object(obj)) {
			obj.points.each(function(point){
				if (absolute) {
					point.x = point.x-obj.x+x
					point.y = point.y-obj.y+y
				} else {
					point.x += x
					point.y += y
				}
			},this)
			if (absolute) {
				obj.x = x
				obj.y = y
			} else {
				obj.x += x
				obj.y += y
			}
		}
	},

	observe: function(a,b,c) {
		if (a == 'keypress' || a == 'keyup') document.observe(a,b,c)
		else Fred.element.observe(a,b,c)
	},
	fire: function(a,b,c) {
		if (a == 'keypress' || a == 'keyup') document.fire(a,b,c)
		else Fred.element.fire(a,b,c)
	},
	stop_observing: function(a,b,c) {
		if (a == 'keypress' || a == 'keyup') document.stopObserving(a,b,c)
		else Fred.element.stopObserving(a,b,c)
	},
	error: function(e) {
		console.log(e)
	},

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

if (!window.console) console = {};
console.log = console.log || function(){};
console.warn = console.warn || function(){};
console.error = console.error || function(){};
console.info = console.info || function(){};

Fred.Layer = Class.create({
	initialize: function(name,args) {
		Fred.layers.push(this)
		Fred.element.insert("<canvas style='position:absolute;' id='"+name+"'></canvas>")
		this.name = name
		this.static = ''
		this.active = false
		this.objects = []
		this.element = $(this.name)
		this.element.onselectstart = function() {return false}
		this.element.width = Fred.width
		this.element.height = Fred.height
		this.canvas = $(name).getContext('2d')
		Object.extend(this,args)
		strokeStyle('#222')
		fillStyle('#eee')
	},
	draw: function() {
		$C = this.canvas
		clear()
		if (this.last_draw != Fred.timestamp) {
			this.last_draw = Fred.timestamp
			this.objects.each(function(object){
				object.draw()
			})
		}
	}
})

Fred.selection = {
	members: [],
	x: 0,
	y: 0,
	empty: true,
	add: function(obj) {
		if (obj.selected != true) {
			this.members.push(obj)
			this.empty = false
			obj.selected = true
		}
		this.recalc_xy()
	},
	/*
	 * Responds as an array
	 */
	each: function(args) {
		this.members.each(args)
	},
	/*
	 * Remove an object from Fred's active layer and disconnect its event listeners
	 */
	remove: function(obj) {
		this.members.each(function(member,index){
			if (member == obj) {
				member.selected = false
				this.members.splice(index,1)
			}
		},this)
		this.empty = (this.size() == 0)
		this.recalc_xy()
		return obj
	},
	first: function() {
		return this.members[0]
	},
	last: function() {
		return this.members.last()
	},
	clear: function() {
		this.history.push(this.members)
		this.members.each(function(obj) {
			obj.selected = false
		},this)
		this.empty = true
		this.members = []
		this.recalc_xy()
	},
	size: function() {
		return this.members.length
	},
	recalc_xy: function() {
		this.x = 0
		this.y = 0
		if (!this.empty) {
			this.members.each(function(member) {
				this.x += member.x
				this.y += member.y
			},this)
			this.x = this.x/this.members.length
			this.y = this.y/this.members.length
		}
	},
	move: function(x,y,absolute) {
		this.members.each(function(obj) {
			if (obj.move) {
				obj.move(x,y,absolute)
			} else if (Fred.is_object(obj)) {
				obj.points.each(function(point){
					if (absolute) {
						point.x = (point.x-Fred.selection.x)+x
						point.y = (point.y-Fred.selection.y)+y
					} else {
						point.x += x
						point.y += y
					}
				},this)
				if (absolute) {
					obj.x += x-Fred.selection.x
					obj.y += y-Fred.selection.y
				} else {
					obj.x += x
					obj.y += y
				}
			}
		},this)
		if (absolute) {
			this.x = x
			this.y = y
		} else {
			this.x += x
			this.y += y
		}
	},
	history: [],
	get_under_pointer: function() {
		return this.get_under_point(Fred.pointer_x,Fred.pointer_y)
	},
	get_under_point: function(x,y) {
		this.clear()
		Fred.objects.each(function(obj){
			if (this.empty && Fred.is_object(obj)) {
				if (Fred.Geometry.is_point_in_poly(obj.points,x,y)) {
					Fred.selection.add(obj)
				} // else if (Fred.Geometry.is_point_on_polyline(obj.points,x,y)) {
			}
		},this)
		if (this.empty) return false
		else return this.members
	},
	is_point_inside: function(x,y) {
		var inside = false
		if (!this.empty) {
			this.members.each(function(obj){
				if (Fred.is_object(obj)) {
					if (Fred.Geometry.is_point_in_poly(obj.points,x,y)) {
						inside = true
					} // else if (Fred.Geometry.is_point_on_polyline(obj.points,x,y)) {
				}
			},this)
		}
		return inside
	},
}

Fred.Object = Class.create({
	/*
	 * Setup text metrics such as x,y position, interpret alignment and valign
	 */
	setup_text: function() {
		this.text_width = measureText(this.style.font,this.style.textsize,this.text)
		this.text_height = this.style.textsize
	},
	/*
	 * Draw text in the object
	 */
	draw_text: function() {
		if (this.style.text_align == 'left') {
			this.text_x = this.x
		} else if (this.style.text_align == 'right') {
			this.text_x = this.x-this.text_width
		} else {//if (this.style.text_align == 'center') {
			this.text_x = this.x-this.text_width/2
		}
		if (true) { // eventually deal with vertical align here
			this.text_y = this.y+this.text_height/2
		}
		if (this.text) {
			drawText(this.style.font,this.style.textsize,this.style.textfill,this.text_x,this.text_y,this.text)
		}
	}
})
Fred.Point = Class.create({
	initialize: function(x,y) {
		this.x = x
		this.y = y
		this.bezier = { prev: false, next: false }
		return this
	},
})
Fred.Polygon = Class.create(Fred.Object,{
	/*
	 * By default accepts an array of {x:0,y:0} style point objects, but
	 * can also accept an array of [x,y] pairs.
	 */
	initialize: function(points) {
		this.point_size = 12
		if (points) this.points = points
		else this.points = []
		if (points && points[0] instanceof Array) {
			this.points = []
			points.each(function(point){
				this.points.push(new Fred.Point(point[0],point[1]))
			},this)
		}
		this.selected = false
		if (points) this.closed = true
		else this.closed = false
		this.x = 0
		this.y = 0
		this.rotation = 0
		this.rotation_point = false
		this.show_highlights = true
		this.style = {}
		Object.extend(this.style,Fred.default_style)
		return this
	},
	name: 'untitled polygon',
	apply_style: function() {
		lineWidth(this.style.lineWidth)
		strokeStyle(this.style.stroke)
		fillStyle(this.style.fill)
	},
	/*
	 * Is the offered point inside the polygon? Accounts for bezier polygons.
	 * Yields yes if its not a closed poly but you click within Fred.click_radius of the line.
	 */
	is_point_inside: function(x,y) {
		if (this.is_bezier()) {
			if (this.closed) {

			} else {

			}
		} else if (this.closed()) {
			return Fred.Geometry.is_point_in_poly(this.points,x,y)
		} else {
		}
	},
	is_bezier: function() {
		var is_bezier = false
		this.points.each(function(point) {
			if (point.bezier.prev != false) {
				is_bezier = true
				break
			}
			if (point.bezier.next != false) {
				is_bezier = true
				break
			}
		},this)
		return is_bezier
	},
	set_centroid: function() {
		this.x = 0
		this.points.each(function(point){ this.x += point.x },this)
		this.x /= this.points.length
		this.y = 0
		this.points.each(function(point){ this.y += point.y },this)
		this.y /= this.points.length
	},
	in_point: function() {
		if (this.points) {
			var in_point = false
			this.points.each(function(point) {
				if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,point.x,point.y) < Fred.click_radius) in_point = point
			},this)
			return in_point
		} else  {
			return false
		}
	},
	in_bezier: function() {
		if (this.points) {
			var in_bezier = false
			this.points.each(function(point){
				if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,point.x+point.bezier.prev.x,point.y+point.bezier.prev.y) < Fred.click_radius) in_bezier = [point.bezier.prev,point]
				else if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,point.x+point.bezier.next.x,point.y+point.bezier.next.y) < Fred.click_radius) in_bezier = [point.bezier.next,point]
			},this)
			return in_bezier
		} else return false
	},
	draw: function() {
		if (this.points && this.points.length > 0) {
			this.apply_style()
			var over_point = false
			beginPath()
			moveTo(this.points[0].x,this.points[0].y)
			this.points.each(function(point,index){
				var last_point = this.points[index-1]
				var next_point = this.points[index+1]
				if (index = 0 && !this.closed) last_point = false
				if (point.bezier.prev != false && (last_point && last_point.bezier.next != false)) {
					bezierCurveTo(last_point.x+last_point.bezier.next.x,last_point.y+last_point.bezier.next.y,point.x+point.bezier.prev.x,point.y+point.bezier.prev.y,point.x,point.y)
				} else if (!point.bezier.prev && (last_point && last_point.bezier.next != false)) {
					bezierCurveTo(last_point.x+last_point.bezier.next.x,last_point.y+last_point.bezier.next.y,point.x,point.y,point.x,point.y)
				} else if (point.bezier.prev) {
					bezierCurveTo(point.x,point.y,point.x+point.bezier.prev.x,point.y+point.bezier.prev.y,point.x,point.y)
				} else {
					lineTo(point.x,point.y)
				}
			},this)
			if (this.closed) {
				lineTo(this.points[0].x,this.points[0].y)
				fillStyle(this.style.fill)
				if (this.pattern && this.pattern.width) {
					fillPattern(this.pattern)
				} else if (this.style.pattern) {
					this.pattern = new Image()
					this.pattern.src = this.style.pattern
				}
				save()
					translate(this.x,this.y)
					fill()
				restore()
			}
			stroke()
			this.draw_text()

			if (this.show_highlights) {
			this.points.each(function(point){
				save()
				opacity(0.2)
				if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,point.x,point.y) < Fred.click_radius) {
					opacity(0.4)
					over_point = true
					fillStyle('#f55')
					rect(point.x-Fred.click_radius,point.y-Fred.click_radius,Fred.click_radius*2,Fred.click_radius*2)
				} else if (this.selected) {
					lineWidth(2)
					strokeStyle('#f55')
					strokeRect(point.x-Fred.click_radius,point.y-Fred.click_radius,Fred.click_radius*2,Fred.click_radius*2)
				}
				restore()
			},this)
			if (this.selected) {
				this.points.each(function(point){
					$H(point.bezier).values().each(function(bezier){
						if (bezier) {
							save()
							lineWidth(1)
							opacity(0.3)
							strokeStyle(Fred.selection_color)
							moveTo(point.x,point.y)
							lineTo(point.x+bezier.x,point.y+bezier.y)
								save()
								fillStyle(Fred.selection_color)
								rect(point.x+bezier.x-Fred.click_radius/2,point.y+bezier.y-Fred.click_radius/2,Fred.click_radius,Fred.click_radius)
								restore()
							stroke()
							restore()
						}
					},this)
				},this)
			}
			if (this.selected) {
				save()
					strokeStyle(Fred.selection_color)
					opacity(0.2)
					lineWidth(2)
					strokeCircle(this.x,this.y,Fred.click_radius)
				restore()
			}
			if (this.selected && this.closed) {
				save()
					strokeStyle(Fred.selection_color)
					fillStyle(Fred.selection_color)
					lineWidth(2)
					opacity(0.2)
					moveTo(this.x,this.y)
					this.rotation_point = lineToPolar(this.rotation,50)
					this.rotation_point.x += this.x
					this.rotation_point.y += this.y
					stroke()
					if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,this.rotation_point.x,this.rotation_point.y) < Fred.click_radius) {
						opacity(0.4)
						circle(this.rotation_point.x,this.rotation_point.y,Fred.click_radius/2+2)
					} else {
						opacity(0.2)
						strokeCircle(this.rotation_point.x,this.rotation_point.y,Fred.click_radius/2)
					}
				restore()
			}
			}
		}
	},
	on_longclick: function() {
	},
})
Fred.Rectangle = Class.create(Fred.Polygon,{
	initialize: function(width,height,x,y) {
		this.width = width || 50
		this.height = height || 50
		this.x = x || Fred.width/2
		this.y = y || Fred.height/2
		this.complete = true
		this.closed = true
		this.points = []
		this.corners = [[this.x,this.y],[this.x+this.width,this.y],[this.x+this.width,this.y+this.height],[this.x,this.y+this.height]]
		this.corners.each(function(point){
			this.points.push(new Fred.Point(point[0],point[1]))
		},this)
		this.selected = false
		this.rotation = 0
		this.rotation_point = false
		this.show_highlights = true
		this.style = {}
		Object.extend(this.style,Fred.default_style)
		return this
	},
	set_width: function(width) {
		this.points[1].x = this.points[0].x+width
		this.points[2].x = this.points[0].x+width
	},
	set_height: function(height) {
		this.points[2].y = this.points[0].y+height
		this.points[3].y = this.points[0].y+height
	},
})
Fred.Group = Class.create({
	initialize: function(members,x,y) {
		if (!Object.isArray(members)) {
			Fred.error('Fred.Group requires an array.')
		} else {
			this.members = members
			this.members.each(function(member){
				Fred.remove(member)
			})
			Fred.add(this)


			this.x = x || 0
			this.y = y || 0
			this.r = 0 // no rotation
			this.selected = true
		}
		return this
	},
	draw: function() {
		save()
		translate(x,y)
		rotate(r)
			this.members.each(function(member) {
				member.draw()
			},this)
		restore()
		if (this.selected) {
		}
	},
	on_mousedown: function() {
		if (this.mouseover()) {

		}
	},
	on_mousemove: function() {
		if (this.drag) {

		}
		if (this.mouseover()) {

		}
	},
	on_mouseup: function() {
		this.drag = false
	},
	mouseover: function() {
		var mouseover = false
		this.members.each(function(member){
		},this)
	},
})
Fred.Image = Class.create({
	/*
	 * Create a new image with Fred.Image.new(img_url). Additional parameters are optional.
	 */
	initialize: function(src,x,y,r,scale) {
		this.x = x || Fred.width/2
		this.y = y || Fred.height/2
		this.r = r || 0 // rotation
		this.scale = scale || 0.25
		this.src = src
		this.selected = true
		if (src && typeof src == 'string') {
			this.src = src
			this.image = new Image
			this.image.src = src
		}
		return this
	},
	draw: function() {
		if (this.image.width) {
			this.width = this.image.width
			this.height = this.image.height
		}
		save()
			translate(this.x,this.y)
			rotate(this.r)
			scale(this.scale,this.scale)
			drawImage(this.image,this.width/-2,this.height/-2)
			scale(1/this.scale,1/this.scale)
			rotate(-this.r)
			translate(-this.x,-this.y)
		restore()
		if (this.selected) {
			save()
			translate(this.x,this.y)
			rotate(this.r)
				var w = this.width*this.scale
				var h = this.height*this.scale
				this.corners = [[-w/2,-h/2],
						[w/2,-h/2],
						[w/2,h/2],
						[-w/2,h/2]]
				this.corners.each(function(corner) {
					strokeStyle('white')
					lineWidth(2)
					opacity(0.2)
					if (true) circle(corner[0],corner[1],Fred.click_radius)
					opacity(0.9)
					strokeCircle(corner[0],corner[1],Fred.click_radius)
				},this)
				translate(-this.x,-this.y)
				rotate(-this.r)
			restore()
		}
	},
	on_mousedown: function(){
		var poly = [	{x:this.x-this.width/2,y:this.y-this.height-2},
				{x:this.x+this.width/2,y:this.y-this.height-2},
				{x:this.x+this.width/2,y:this.y+this.height-2},
				{x:this.x-this.width/2,y:this.y+this.height-2}]
		if (Fred.Geometry.is_point_in_poly(poly,Fred.pointer_x,Fred.pointer_y)) {
			this.dragging = true
			this.drag_start = {pointer_x:Fred.pointer_x, pointer_y:Fred.pointer_y, x:this.x, y:this.y}
		}
	},
	on_touchstart: function() {
		on_mousedown()
	},
	on_touchmove: function() {
		on_mousemove()
	},
	on_touchend: function() {
		on_mouseup()
	},
	on_mouseup: function() {
		this.dragging = false
	},
	on_mousemove: function() {
		if (this.dragging) {
			this.x = this.drag_start.x + (Fred.pointer_x-this.drag_start.pointer_x)
			this.y = this.drag_start.y + (Fred.pointer_y-this.drag_start.pointer_y)
		}
	},
	set_to_natural_size: function() {
		if (this.image.width) {
			this.points[1].x = this.points[0].x
			this.points[1].y = this.points[0].y
			this.points[2].x = this.points[0].x
			this.points[2].y = this.points[0].y
			this.points[3].x = this.points[0].x
			this.points[3].y = this.points[0].y

			this.points[1].x += this.image.width/(Map.zoom*2)
			this.points[2].x += this.image.width/(Map.zoom*2)
			this.points[2].y += this.image.height/(Map.zoom*2)
			this.points[3].y += this.image.height/(Map.zoom*2)
			this.reset_centroid()
			this.area = Geometry.poly_area(this.points)
			this.waiting_for_natural_size = false
		}
	},
})

Fred.Tool = Class.create({
	initialize: function(description,args){
		this.description = description
		Object.extend(this,args)
	},
})

Fred.tools.edit = new Fred.Tool('select & manipulate objects',{
	name: 'edit',
	icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAQAAAAEABcxq3DAAAA2klEQVQoz32QMU7DQBBF30rbUCCkpHaPLdH4BJEoOQMSoqHhAFDkAjRIiNZHSBRqijQgKmhN7YIrEMne+SmM8dqJMqPdYv6bP7PrxOHw8FApUXmXDYXbdT1ryiLzQHLBS7qUgIAQhvHLNc8peAhfq/yICfpPQ5zwSPMOTsBCU2wgG8YPNw48QPgrdvbtHboliYqKTtMDgRBZd2NCDNiof4/DWBbWA030/h7bGbHfwYnzqk6OuRohT3wTyk3mYZPMuaeKFjWgpOAyBUT+eWanH2KY/tWJN7VffSi2LS+tHNedUoUAAAAldEVYdGNyZWF0ZS1kYXRlADIwMTAtMDMtMDlUMDk6MzE6NDYtMDU6MDCQx+NFAAAAJXRFWHRtb2RpZnktZGF0ZQAyMDA2LTAzLTEyVDIxOjU3OjE4LTA1OjAwvZAdJgAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAASUVORK5CYII=',
	selection_box: {
		points: [ {x: 0, y: 0}, {x: 0, y:0},
			  {x: 0, y: 0}, {x: 0, y:0} ]
	},
	select: function() {
		Fred.keys.add('g',function(){
			console.log('grouping')
			new Fred.Group(Fred.selection.members)
		})
	},
	deselect: function() {
	},
	on_dblclick: function(e) {
		Fred.selection.first().text = prompt("Enter text for this object")
		Fred.selection.first().setup_text()
	},
	on_mousedown: function() {
		this.click_x = Fred.pointer_x
		this.click_y = Fred.pointer_y
		if (Fred.selection.is_point_inside(Fred.pointer_x,Fred.pointer_y)) {
				this.dragging_object = true
				this.selection_orig_x = Fred.selection.x
				this.selection_orig_y = Fred.selection.y
		} else {
			Fred.selection.clear()
			if (Fred.selection.get_under_pointer()) {
				this.dragging_object = true
				this.selection_orig_x = Fred.selection.x
				this.selection_orig_y = Fred.selection.y
			} else {
				this.dragging_selection = true
				this.selection_box.points[0].x = Fred.pointer_x
				this.selection_box.points[0].y = Fred.pointer_y
				this.selection_box.points[3].x = Fred.pointer_x
				this.selection_box.points[1].y = Fred.pointer_y
			}
		}
	},
	on_mousemove: function() {
		if (this.dragging_object) {
			var x = this.selection_orig_x + Fred.pointer_x - this.click_x
			var y = this.selection_orig_y + Fred.pointer_y - this.click_y
			Fred.move(Fred.selection,x,y,true)
		} else if (this.dragging_selection) {
			this.selection_box.points[1].x = Fred.pointer_x
			this.selection_box.points[2].x = Fred.pointer_x
			this.selection_box.points[2].y = Fred.pointer_y
			this.selection_box.points[3].y = Fred.pointer_y
			this.selection_box.width = Fred.pointer_x-this.selection_box.points[0].x
			this.selection_box.height = Fred.pointer_y-this.selection_box.points[0].y
			this.get_selection_box()
		}
	},
	draw: function() {
		if (this.dragging_selection) {
			save()
				lineWidth(0.7)
				opacity(0.7)
				strokeStyle('#222')
				strokeRect(this.selection_box.points[0].x,this.selection_box.points[0].y,this.selection_box.width,this.selection_box.height)
				opacity(0.3)
				rect(this.selection_box.points[0].x,this.selection_box.points[0].y,this.selection_box.width,this.selection_box.height)
			restore()
		}
	},
	on_mouseup: function() {
		if (this.dragging_object) this.dragging_object = false
		if (this.dragging_selection) this.dragging_selection = false
		if (this.getDataUrl == true) {
			getDataUrl
			this.getDataUrl == false
		}
	},
	on_touchstart: function(event) {
		this.on_mousedown(event)
	},
	on_touchmove: function(event) {
		this.on_mousemove(event)
	},
	on_touchend: function(event) {
		this.on_mouseup(event)
	},
	get_selection_box: function() {
		Fred.selection.clear()
		var whole_objects = (this.selection_box.points[0].x < this.selection_box.points[1].x)
		Fred.objects.each(function(obj){
			var all_inside = true
			var one_inside = false
			obj.points.each(function(point){
				if (Fred.Geometry.is_point_in_poly(this.selection_box.points,point.x,point.y)) one_inside = true
				else all_inside = false
			},this)
			if ((all_inside && whole_objects) || (one_inside && !whole_objects)) Fred.selection.add(obj)
		},this)
	}
})
Fred.tools.pen = new Fred.Tool('draw polygons',{
	name: 'pen',
	icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAAAJiS0dEAACqjSMyAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAQAAAAEABcxq3DAAAA4ElEQVQoz4XRMUoDURDG8f+8PFgiBJZIQDu3CiSNzRKwzRFS5ACSLiCewBNY5R5JI7KkyQHSSLLphCjiYhGeWIXdsD4LIUTfQ6eYYn4fw8CI5e/SvmFS3T6b41IFT9UL8W0YW6GD4o6PiSeQ2IgaCsiZfiqXY454wGAAVfzakNiYCq/sWBGSMRDlckbBCQ3eGAgol3NOWfDCpcBBYOTlfeDW9rwMYhmeResuj7Q8DBr0uk/APe80SdlwLYeH6+82J2JJSp2bHwwaUmacU2LYOAxi6doKbULC8VXP/Yv89+4vdZlO6RlYezwAAAAldEVYdGNyZWF0ZS1kYXRlADIwMTAtMDMtMDlUMDk6MzU6MjMtMDU6MDANe2UfAAAAJXRFWHRtb2RpZnktZGF0ZQAyMDEwLTAzLTA5VDA5OjM1OjIzLTA1OjAwUsoTKwAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAASUVORK5CYII=',
	polygon: false,
	dragging_point: false,
	creating_bezier: false,
	sticky: false, // stays on pen tool after creating a polygon
	keys: $H({
		'esc': function() { Fred.tools.pen.cancel() }
	}),
	select: function() {
		Fred.keys.load(this.keys,this)
	},
	deselect: function() {
		this.cancel()
	},
	on_mousedown: function(e) {
		if (!this.polygon) {
			this.polygon = new Fred.Polygon
			this.polygon.selected = true
		}
		this.clicked_point = this.polygon.in_point()
		var bezier = this.polygon.in_bezier()
		this.clicked_bezier = bezier[0]
		this.clicked_bezier_parent = bezier[1]
		if (this.clicked_point != false && this.clicked_point != this.polygon.points[0]) {
			if (Fred.keys.modifiers.get('control') && this.clicked_point != this.polygon.points.last()){
				this.creating_bezier = true
				this.clicked_point.bezier.prev = {x:0,y:0}
				this.clicked_point.bezier.next = {x:0,y:0}
			} else {
				this.dragging_point = true
			}
		} else if (this.clicked_bezier) {
			this.editing_bezier = true
		} else if (this.polygon.closed && Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,this.polygon.rotation_point.x,this.polygon.rotation_point.y) < Fred.click_radius) {
			this.editing_rotation = true
		} else {
			var on_final = (this.polygon.points.length > 1 && ((Math.abs(this.polygon.points[0].x - Fred.pointer_x) < Fred.click_radius) && (Math.abs(this.polygon.points[0].y - Fred.pointer_y) < Fred.click_radius)))
			if (on_final && this.polygon.points.length > 1) {
				this.polygon.closed = true
				this.complete_polygon()
			} else if (!on_final) {
				this.polygon.points.push(new Fred.Point(Fred.pointer_x,Fred.pointer_y))
				if (Fred.keys.modifiers.get('control')) {
					this.creating_bezier = true
					this.clicked_point = this.polygon.points.last()
					this.clicked_point.bezier.prev = {x:0,y:0}
					this.clicked_point.bezier.next = {x:0,y:0}
				} else {
					this.clicked_point = this.polygon.points.last()
					this.dragging_point = true
				}
			}
		}
	},
	on_dblclick: function() {
		if (this.polygon && this.polygon.points.length > 1) {
			this.polygon.set_centroid()
			this.complete_polygon()
		}
	},
	on_mousemove: function() {
		if (this.dragging_point) {
			this.clicked_point.x = Fred.pointer_x
			this.clicked_point.y = Fred.pointer_y
		} else if (this.creating_bezier && Fred.keys.modifiers.get('control')) {
			this.clicked_point.bezier.prev.x = -Fred.pointer_x + this.clicked_point.x
			this.clicked_point.bezier.prev.y = -Fred.pointer_y + this.clicked_point.y
			this.clicked_point.bezier.next.x = Fred.pointer_x - this.clicked_point.x
			this.clicked_point.bezier.next.y = Fred.pointer_y - this.clicked_point.y
		} else if (this.editing_bezier) {
			this.clicked_bezier.x = Fred.pointer_x - this.clicked_bezier_parent.x
			this.clicked_bezier.y = Fred.pointer_y - this.clicked_bezier_parent.y
		} else if (this.editing_rotation) {

		}
	},
	on_mouseup: function() {
		this.clicked_point = false
		this.dragging_point = false
		this.creating_bezier = false
		this.editing_bezier = false
	},
	on_touchstart: function(e) {
		this.on_mousedown(e)
	},
	on_touchend: function(e) {
		this.on_mouseup(e)
	},
	draw: function() {
		if (this.polygon) this.polygon.draw()
	},
	/*
	 * Cancels polygon creation, starts fresh with a new polygon
	 */
	cancel: function() {
		this.polygon = false
	},
	complete_polygon: function() {
		Fred.add(this.polygon)
		this.polygon.set_centroid()
		this.polygon.selected = false
		this.polygon = false
		if (!this.sticky) {
			Fred.select_tool('edit')
		}
	}
})

Fred.tools.place = new Fred.Tool('select & manipulate objects',{
	select: function() {
	},
	deselect: function() {
	},
	image: function(uri,x,y) {
		x = x || Fred.width/2
		y = y || Fred.height/2
		this.image_obj = new Fred.Image(uri,x,y)
		Fred.add(this.image_obj)
	},
	prompt: function() {
		uri = prompt("Enter a URI for an image.",'test.jpg')
		this.image(uri)
	}
})
Fred.tools.color = new Fred.Tool('assign color to objects',{
	name: 'color',
	mode: 'color', // or 'edit' -- for dragging the panel itself only
	icon: 'data:image/png;base64,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ZnkAMjAwNS0wNC0yM1QwNjo1MjowMi0wNDowMNShFXEAAAAXdEVYdGV4aWY6UGl4ZWxYRGltZW5zaW9uADMyiKxnFwAAABd0RVh0ZXhpZjpQaXhlbFlEaW1lbnNpb24AMzJVOr6SAAAAFXRFWHR0aWZmOmFscGhhAGFzc29jaWF0ZWRof6P+AAAAFHRFWHR0aWZmOnBob3RvbWV0cmljAFJHQrMgSd8AAAAWdEVYdHRpZmY6cm93cy1wZXItc3RyaXAAMzKdTiFrAAAAKnRFWHR0aWZmOnNvZnR3YXJlAEFkb2JlIFBob3Rvc2hvcCBFbGVtZW50cyAyLjAv6/C+AAAAInRFWHR0aWZmOnRpbWVzdGFtcAAyMDA1OjA0OjIzIDE0OjUyOjAyBF3esQAAAEN0RVh0eGFwOkNyZWF0b3JUb29sAEFkb2JlIFBob3Rvc2hvcCBFbGVtZW50cyBmb3IgTWFjaW50b3NoLCB2ZXJzaW9uIDIuMAD4a/EAAABLdEVYdHhhcE1NOkRvY3VtZW50SUQAYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY2ZjQyN2U0LWI1OTgtMTFkOS04NWU1LWNhNjZkMjdkM2EwYWEIpioAAAAASUVORK5CYII=',
	select: function() {
		this.panel = this.panel || new Fred.Rectangle(235,80)
		this.picker = this.picker || new Fred.Rectangle(195,40,Fred.width/2+20,Fred.height/2+20)
		Fred.add(this.panel)
		Fred.add(this.picker)
		this.picker.style.pattern = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMMAAAABCAYAAABjXxoVAAAAZElEQVQokaWSSw6AIBBD30gEEu9/V/ziQjaOSMRZNCSv3bSD5IlMBCIQyqtl4bVMYUeA1UHi0lyUKurlLW+5ZeRjoTfvz0DK2xwk6Sukc71DKOazrY23LcDIzqAuY/8JrcGe/ASqeGcEFhVFaAAAAABJRU5ErkJggg=="
		this.panel.show_highlights = false
		this.panel.style.fill = 'rgba(0,0,0,0.3)'
		this.picker.show_highlights = false
	},
	deselect: function() {
		Fred.remove(this.panel)
		Fred.remove(this.picker)
		this.panel = false
		this.picker = false
	},
	draw: function() {

	},
	on_mousedown: function() {
		if (Fred.Geometry.is_point_in_poly(this.picker.points,Fred.pointer_x,Fred.pointer_y)) {
			this.mode = 'color'
			var color = Fred.get_color(Fred.pointer_x,Fred.pointer_y)
			Fred.selection.each(function(selection){
				selection.style.fill = "rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")"
			},this)
		} else {// if (Fred.Geometry.is_point_in_poly(this.panel.points,Fred.pointer_x,Fred.pointer_y)){
			this.mode = 'edit' // acts like edit for dragging around the panel
			Fred.tools.edit.on_mousedown()
		}
	},
	on_touchstart: function() {
		this.on_mousedown()
	},
	on_mouseup: function() {
		if (this.mode = 'edit') {
			Fred.tools.edit.on_mouseup()
			this.mode = 'color'
		}
	},
	on_touchend: function() {
		this.on_mouseup()
	},
	on_mousemove: function() {
		if (this.mode = 'edit') {
			Fred.tools.edit.on_mousemove()
			Fred.move(this.picker,this.panel.x+20,this.panel.y+20,true)
		}
	},
	on_touchmove: function() {
		this.on_mousemove()
	},
})
Fred.tools.text = new Fred.Tool('write text',{
	name: 'text',
	icon: '',
	sticky: false,
	select: function() {
	},
	deselect: function() {
	},
	on_mouseup: function() {
		var text = prompt("Enter text for this object")
		var obj = new Fred.Rectangle(100,50,Fred.pointer_x,Fred.pointer_y)
		obj.text = text
		obj.setup_text()
		obj.set_width(obj.text_width+parseInt(obj.style.padding))
		obj.set_height(obj.text_height+parseInt(obj.style.padding))
		Fred.move(obj,-obj.style.padding,-obj.style.padding,false)
		obj.set_centroid()
		obj.style.fill = 'rgba(0,0,0,0)'
		obj.style.lineWidth = 0
		Fred.add(obj)
		if (!this.sticky) {
			Fred.select_tool('edit')
		}
	},
})
Fred.tools.script = new Fred.Tool('script object behaviors',{
	name: 'script',
	icon: '',
	select: function() {
	},
	deselect: function() {
	},
	on_dblclick: function() {
		if (!Fred.selection.empty) {
			Fred.selection.each(function(selection) {
				var existing = selection.script || "on_mouseup: function() { console.log('hi') }"
				input = prompt("Edit this object's code:",existing)
				if (input != null) selection.script = ("{"+input+"}").evalJSON()
				Fred.attach_listeners(selection.script)
			},this)
		}
	},
})

Fred.toolbar = {
	position: 'top',
	height: 50,
	element: false,
	initialized: false,

	init: function() {
		if (!$('fred_toolbar')) {
			$$('body')[0].insert({top:'<div id="fred_toolbar"></div>'})
			this.element = $('fred_toolbar')
			$$('body')[0].insert("<style>#fred_toolbar {height: "+this.height+"px;width: 100%;background:#222;background:-webkit-gradient(linear, 0% 0%,0% 100%,from(#444),to(#222))}#fred_toolbar a.button {display:block;float:left;height:16px;width:16px;margin:6px;margin-right:0;padding:9px;border:1px solid #000;background:-webkit-gradient(linear, 0% 0%,0% 100%,from(#666),to(#333));-moz-border-radius-topleft:3px;-webkit-border-top-left-radius:3px;-moz-border-radius-bottomleft:3px;-webkit-border-bottom-left-radius:3px;-moz-border-radius-topright:3px;-webkit-border-top-right-radius:3px;-moz-border-radius-bottomright:3px;-webkit-border-bottom-right-radius:3px;} #fred_toolbar a.button:hover {background:-webkit-gradient(linear, 0% 0%,0% 100%,from(#555),to(#222));} #fred_toolbar a.button.active {background:-webkit-gradient(linear, 0% 0%,0% 100%,from(#333),to(#444));} </style>")
			this.members.each(function(member){
				this.element.insert('<a id="fred_toolbar_'+member.name+'" class="button" href="javascript:void();" onClick="Fred.select_tool(\''+member.name+'\')"><img src="'+member.icon+'" /></a>')
			},this)
			this.initialized = true

		}
	},
	update: function() {
		this.members.each(function(member) {
			$('fred_toolbar_'+member.name).removeClassName('active')
			if (Fred.active_tool.name == member.name) $('fred_toolbar_'+member.name).addClassName('active')
		},this)
	},

	show: function() {
		this.active = true
		Fred.height_offset += this.height
		if (!this.initialized) this.init()
		Fred.resize()
		this.update()
		this.element.show()
	},
	hide: function() {
		this.active = false
		Fred.height_offset -= this.height
		Fred.resize()
		this.element.hide()
	},
	toggle: function() {
		if (this.active) this.hide()
		else this.show()
	},
	/*
	 * slide open and closed with animation
	 */
	open: function() {

	},
	close: function() {

	},

	members: [
		Fred.tools.pen,
		Fred.tools.edit,
		Fred.tools.color,
		Fred.tools.text,
		Fred.tools.script,
	],
	on_mousedown: function() {
		if (Fred.pointer_x < this.height) {
			this.dragging = true
		}
	},
	on_mousemove: function() {
		if (this.dragging) {

		}
	},
	on_mouseup: function() {
		this.dragging = false
	}
}
Fred.Geometry = {
	point_from_polar: function(x,y,t,d) {
		var dx = d*Math.acos(t)
		var dy = d*Math.asin(t)
		return {x:dx+x,y:dy+y}
	},
	distance: function(x1,y1,x2,y2) {
		return Math.sqrt(Math.pow(Math.abs(x1-x2),2) + Math.pow(Math.abs(y1-y2),2))
	},
	is_point_in_poly: function(poly, x, y){
	    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
	        ((poly[i].y <= y && y < poly[j].y) || (poly[j].y <= y && y < poly[i].y))
	        && (x < (poly[j].x - poly[i].x) * (y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
	        && (c = !c);
	    return c;
	},
	poly_centroid: function(polygon) {
		var n = polygon.length
		var cx = 0, cy = 0
		var a = Fred.Geometry.poly_area(polygon,true)
		var centroid = []
		var i,j
		var factor = 0

		for (i=0;i<n;i++) {
			j = (i + 1) % n
			factor = (polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y)
			cx += (polygon[i].x + polygon[j].x) * factor
			cy += (polygon[i].y + polygon[j].y) * factor
		}

		a *= 6
		factor = 1/a
		cx *= factor
		cy *= factor
		centroid[0] = cx
		centroid[1] = cy
		return centroid
	},
        poly_area: function(points, signed) {
                var area = 0
                points.each(function(point,index) {
                        if (index < point.length-1) next = points[index+1]
                        else next = points[0]
                        if (index > 0) last = points[index-1]
                        else last = points[points.length-1]
                        area += last.x*point.y-point.x*last.y+point.x*next.y-next.x*point.y
                })
                if (signed) return area/2
                else return Math.abs(area/2)
        },
	does_poly_overlap_poly: function(poly_a,poly_b) {
	}
}
Fred.Dialog = Class.create({
	/* example: new Fred.Dialog({	title:'Object script:',
	 *				content:'<textarea>'++'</textarea>'})
	 * 				buttons: [
	 *						{title:'Save',}
	 *					]
	 */
	initialize: function(args) {
		this.title = args.title || ''
		this.content = args.content || ''
		this.buttons = args.buttons || []
		this.buttons.each(function(button){

		})
	},
})

Fred.keys = {
	shift: false,
	control: false,
	alt: false,
	meta: false,
	modifiers: $H({
		'control': false,
	}),
	master: $H({
		'e': function(){ Fred.select_tool('edit') },
		'p': function(){ Fred.select_tool('pen') },
		'c': function(){ Fred.select_tool('color') },
		't': function(){ Fred.select_tool('text') },
		's': function(){ Fred.select_tool('script') },
	}),
	current: $H({

	}),
	initialize: function() {
		Fred.keys.master.keys().each(function(key){
			Fred.keys.add(key,Fred.keys.master.get(key))
		},this)
		Fred.observe('mouseup',this.on_keydown.bindAsEventListener(this))
		Fred.observe('mousemove',this.on_keydown.bindAsEventListener(this))
		Fred.observe('mouseup',this.on_keyup.bindAsEventListener(this))
	},
	add: function(a,b,c) {
		shortcut.add(a,b,c)
	},
	remove: function(a) {
		shortcut.remove(a)
	},
	add_modifier: function(key) {
		Fred.keys.modifiers.set(key,false)
	},
	remove_modifier: function(key) {
		Fred.keys.modifiers.unset(key)
	},
	load: function(set) {
		Fred.keys.clear()
		Fred.keys.current = set
		Fred.keys.current.keys().each(function(key){
			Fred.keys.add(key,Fred.keys.current.get(key))
		},this)
	},
	clear: function() {
		Fred.keys.current.keys().each(function(key){
			Fred.keys.remove(key)
		},this)
	},
	on_keydown: function(event) {
		if (event.keyCode) code = event.keyCode;
		else if (event.which) code = event.which;
		var character = String.fromCharCode(code).toLowerCase();
		this.modifiers.keys().each(function(modifier) {
			if (modifier == character) Fred.keys.modifiers.set(modifier,true)
			if (modifier == 'alt' && event.altKey) Fred.keys.modifiers.set(modifier,true)
			if (modifier == 'shift' && event.shiftKey) Fred.keys.modifiers.set(modifier,true)
			if (modifier == 'meta' && event.metaKey) Fred.keys.modifiers.set(modifier,true)
			if (modifier == 'control' && event.ctrlKey) Fred.keys.modifiers.set(modifier,true)
		},this)
	},
	on_keyup: function(event) {
		if (event.keyCode) code = event.keyCode;
		else if (event.which) code = event.which;
		var character = String.fromCharCode(code).toLowerCase();
		this.modifiers.keys().each(function(modifier) {
			if (modifier == character) Fred.keys.modifiers.set(modifier,false)
			if (modifier == 'alt' && event.altKey) Fred.keys.modifiers.set(modifier,false)
			if (modifier == 'shift' && event.shiftKey) Fred.keys.modifiers.set(modifier,false)
			if (modifier == 'meta' && event.metaKey) Fred.keys.modifiers.set(modifier,false)
			if (modifier == 'control' && event.ctrlKey) Fred.keys.modifiers.set(modifier,false)
		},this)
	}
}


