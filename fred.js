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
	pointer_x: 0,
	pointer_y: 0,
	style: {},
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
			'gestureend'],
	init: function(args) {
		Object.extend(Fred,args)
		Fred.element = $('fred')
		Fred.select_tool('pen')
		new Fred.Layer('main',{active:true})
		new Fred.Layer('background')
		Fred.select_layer(Fred.layers.first())
		Fred.observe('mousemove',Fred.on_mousemove)
		Fred.observe('touchmove',Fred.on_touchmove)
		Fred.observe('mouseup',Fred.on_mouseup)
		Fred.observe('mousedown',Fred.on_mousedown)
		Fred.observe('touchstart',Fred.on_touchstart)
		Fred.observe('touchend',Fred.on_touchend)
		Fred.element.style.position = 'absolute'
		Fred.element.style.top = 0
		Fred.element.style.left = 0
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
			rect(10,10,40,40)
			drawText('georgia',15,'white',12,30,'fred')
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
	resize_handler: function(e,width,height) {
		Fred.resize(width,height)
	},
	resize: function(width,height) {
		width = width || document.viewport.getWidth()
		height = height || document.viewport.getHeight()
		if (width[width.length-1] == '%') Fred.width = parseInt(document.viewport.getWidth()*100/width.substr(0,width.length-1))
		else Fred.width = width
		if (height[height.length-1] == '%') Fred.height = parseInt(document.viewport.getHeight()*100/height.substr(0,height.length-1))
		else Fred.height = height
		Fred.element.style.width = width+'px'
		Fred.element.style.height = height+'px'
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
		Fred.drag = true
	},
	on_mousemove: function(e) {
		Fred.pointer_x = Event.pointerX(e)
		Fred.pointer_y = Event.pointerY(e)
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
	},
	move: function(obj,x,y,absolute) {
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
		Fred.element.insert("<canvas style='position:absolute;top:0;left:0;' id='"+name+"'></canvas>")
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
		this.style = {
			fill: '#ccc',
			stroke: '#222',
			lineWidth: 2,
			textsize: 15,
			textfill: '#222',
			font: 'georgia',
			pattern: false,
		}
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
				if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,point.x,point.y) < this.point_size) in_point = point
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
				if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,point.x+point.bezier.prev.x,point.y+point.bezier.prev.y) < this.point_size) in_bezier = [point.bezier.prev,point]
				else if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,point.x+point.bezier.next.x,point.y+point.bezier.next.y) < this.point_size) in_bezier = [point.bezier.next,point]
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
			if (this.text) {
				drawText(this.style.font,this.style.textsize,this.style.textfill,this.x,this.y,this.text)
			}

			if (this.show_highlights) {
			this.points.each(function(point){
				save()
				opacity(0.2)
				if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,point.x,point.y) < this.point_size) {
					opacity(0.4)
					over_point = true
					fillStyle('#f55')
					rect(point.x-this.point_size/2,point.y-this.point_size/2,this.point_size,this.point_size)
				} else if (this.selected) {
					lineWidth(2)
					strokeStyle('#f55')
					strokeRect(point.x-this.point_size/2,point.y-this.point_size/2,this.point_size,this.point_size)
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
	}
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
				lineWidth(1)
				opacity(0.7)
				strokeStyle('#999')
				strokeRect(this.selection_box.points[0].x,this.selection_box.points[0].y,this.selection_box.width,this.selection_box.height)
				opacity(0.3)
				rect(this.selection_box.points[0].x,this.selection_box.points[0].y,this.selection_box.width,this.selection_box.height)
			restore()
		}
	},
	on_mouseup: function() {
		if (this.dragging_object) this.dragging_object = false
		if (this.dragging_selection) this.dragging_selection = false
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
	select: function() {
		this.pane = this.pane || new Fred.Polygon([[0,0],[195,0],[195,40],[0,40]],{complete:true,closed:true})
		Fred.add(this.pane)
		this.pane.style.pattern = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMMAAAABCAYAAABjXxoVAAAAZElEQVQokaWSSw6AIBBD30gEEu9/V/ziQjaOSMRZNCSv3bSD5IlMBCIQyqtl4bVMYUeA1UHi0lyUKurlLW+5ZeRjoTfvz0DK2xwk6Sukc71DKOazrY23LcDIzqAuY/8JrcGe/ASqeGcEFhVFaAAAAABJRU5ErkJggg=="
		Fred.move(this.pane,Fred.width/2-195,Fred.height/2)
		this.pane.show_highlights = false
		this.pane.style.lineWidth = 5
	},
	deselect: function() {
		Fred.remove(this.pane)
		this.pane = false
	},
	draw: function() {

	},
	on_mousedown: function() {
		if (Fred.Geometry.is_point_in_poly(this.pane.points,Fred.pointer_x,Fred.pointer_y)) {
			var color = Fred.get_color(Fred.pointer_x,Fred.pointer_y)
			Fred.selection.each(function(selection){
				selection.style.fill = "rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")"
			},this)
		} else {
			Fred.tools.edit.on_mousedown()
		}
	},
})

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


