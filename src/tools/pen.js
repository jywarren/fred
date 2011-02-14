// Basic bezier and polygon drawing pen tool
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
		// Here go things which must happen when the tool is activated
		Fred.keys.load(this.keys,this)
	},
	deselect: function() {
		// Here go things which must happen when the tool is deactivated
		// For example, cancel the current polygon. 
		this.cancel()
	},
	on_mousedown: function(e) {
		if (!this.polygon) {
			this.polygon = new Fred.Polygon
			this.polygon.selected = true
		}
		// are we editing a point?
		this.clicked_point = this.polygon.in_point()
		var bezier = this.polygon.in_bezier()
		this.clicked_bezier = bezier[0]
		this.clicked_bezier_parent = bezier[1] 
		// unless it's the FIRST point, allow tool to drag it instead:
		if (this.clicked_point != false && this.clicked_point != this.polygon.points[0]) {
			// if control key is down, start a bezier!
			if (Fred.keys.modifiers.get('control') && this.clicked_point != this.polygon.points.last()){
				this.creating_bezier = true
				this.clicked_point.bezier.prev = {x:0,y:0}
				this.clicked_point.bezier.next = {x:0,y:0}
			} else {
				// allow point dragging
				this.dragging_point = true
			}
		} else if (this.clicked_bezier) {
			// edit the bezier
			this.editing_bezier = true
		} else if (this.polygon.closed && Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,this.polygon.rotation_point.x,this.polygon.rotation_point.y) < Fred.click_radius) {
			// edit the rotation point
			this.editing_rotation = true
		} else {
			// add a new point
			// close polygon if you click on first point
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
		// if in mid-poly-drawing, you grab a control point and drag:
		if (this.dragging_point) {
			// move the control point to follow the mouse
			this.clicked_point.x = Fred.pointer_x
			this.clicked_point.y = Fred.pointer_y
		// the modifier check shouldn't be necessary
		} else if (this.creating_bezier && Fred.keys.modifiers.get('control')) {
			// if control key, draw beziers
			// if you're not dragging the bz control points themselves,
			// you prob. want to start over
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
		//e.preventDefault();
		//var x = e.touches[0].pageX
		//var y = e.touches[0].pageY
		this.on_mousedown(e)
	},
	on_touchend: function(e) {
		//e.preventDefault();
		//var x = e.touches[0].pageX
		//var y = e.touches[0].pageY
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
		// move the polygon to the active Fred layer 
		Fred.add(this.polygon)
		// stop storing the polygon in the pen tool
		this.polygon.set_centroid()
		this.polygon.selected = false
		this.polygon = false
		if (!this.sticky) {
			//Fred.stop_observing('fred:postdraw',this.draw)
			Fred.select_tool('edit')
		}
	}
})

