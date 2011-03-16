// Basic, universal Polygon class
Fred.Polygon = Class.create(Fred.Object,{
	/*
	 * By default accepts an array of {x:0,y:0} style point objects, but
	 * can also accept an array of [x,y] pairs.
	 */
	initialize: function(points) {
		this.point_size = 12
		if (points) this.points = points
		else this.points = []
		// also accept an array of [x,y] pairs
		if (points && points[0] instanceof Array) {
			this.points = []
			points.each(function(point){
				this.points.push(new Fred.Point(point[0],point[1]))
			},this)
		}
		this.selected = false
		if (points) {
			this.closed = true
			this.filled = true
		} else {
			this.closed = false
			this.filled = false
		}
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
	apply_style: function(style) {
		lineWidth(style.lineWidth)
		strokeStyle(style.stroke)
		fillStyle(style.fill)
		// setup pattern, gracefully failing if it hasn't loaded yet:
		if (style.pattern_img && style.pattern_img.width) {
			fillPattern(style.pattern_img)
		} else if (style.pattern) {
			style.pattern_img = new Image()
			style.pattern_img.src = style.pattern
		}
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
		} else if (this.closed) {
			// it's a normal polygon, no curves, no nonsense
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
	// Sets the x,y of the poly to its centroid. Doesn't work right now.
	set_centroid: function() {
		// Centroid is not working, so we're just going to average all points:
		this.x = 0
		this.points.each(function(point){ this.x += point.x },this)
		this.x /= this.points.length
		this.y = 0
		this.points.each(function(point){ this.y += point.y },this)
		this.y /= this.points.length
		//centroid = Fred.Geometry.poly_centroid(this.points)
		//this.x = centroid[0]
		//this.y = centroid[1]
	},
	// Checks if the mouse is inside a control point
	// and returns the control point or false
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
	// Checks if the mouse is inside a bezier control point
	// and returns the bezier control point or false
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
		// when first creating the poly, there are no points:
		if (this.points && this.points.length > 0) {
			if (this.show_highlights && this.selected) {
				this.apply_style(Fred.highlight_style)
				lineWidth(1)
				if (this.highlight_outline) this.draw_shape(Fred.highlight_style,true,false)
			}
			this.apply_style(this.style)
			this.draw_shape(this.style,this.closed,this.filled)
			this.draw_text()

			this.apply_style(Fred.highlight_style)
			if (this.show_highlights) { 
			this.points.each(function(point){
				save()
				if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,point.x,point.y) < Fred.click_radius) {
					over_point = true
					strokeRect(point.x-Fred.click_radius,point.y-Fred.click_radius,Fred.click_radius*2,Fred.click_radius*2)
					rect(point.x-Fred.click_radius,point.y-Fred.click_radius,Fred.click_radius*2,Fred.click_radius*2)
				} else if (this.selected) {
					lineWidth(2)
					strokeRect(point.x-Fred.click_radius,point.y-Fred.click_radius,Fred.click_radius*2,Fred.click_radius*2)
				}
				restore()
			},this)
			// Appearance when selected:
			if (this.selected) {
				// draw beziers too
				this.points.each(function(point){
					$H(point.bezier).values().each(function(bezier){
						if (bezier) {
							save()
							lineWidth(1)
							moveTo(point.x,point.y)
							lineTo(point.x+bezier.x,point.y+bezier.y)
								save()
								rect(point.x+bezier.x-Fred.click_radius/2,point.y+bezier.y-Fred.click_radius/2,Fred.click_radius,Fred.click_radius)
								restore()
							stroke()
							restore()
						}
					},this)
				},this)
			}
			// draw center x,y of the polygon
			if (this.selected) {
				save()
					lineWidth(2)
					strokeCircle(this.x,this.y,Fred.click_radius)
				restore()
			}
			// draw rotation indicator
			if (this.selected && this.closed) {
				save()
					fillStyle(Fred.highlight_style.fill)
					lineWidth(2)
					moveTo(this.x,this.y)
					this.rotation_point = lineToPolar(this.rotation,50)
					this.rotation_point.x += this.x
					this.rotation_point.y += this.y
					stroke()
					if (Fred.Geometry.distance(Fred.pointer_x,Fred.pointer_y,this.rotation_point.x,this.rotation_point.y) < Fred.click_radius) {
						circle(this.rotation_point.x,this.rotation_point.y,Fred.click_radius/2+2)
					} else {
						strokeCircle(this.rotation_point.x,this.rotation_point.y,Fred.click_radius/2)
					}
				restore()
			}
			}
		}
	},
	/* 
	 * This allows us to draw the shape multiple times, as for highlights
	 */
	draw_shape: function(style,closed,filled) {
		var over_point = false
		beginPath()
		moveTo(this.points[0].x,this.points[0].y)
		// bezier madness. There's probably a better way but i'm jetlagged
		this.points.each(function(point,index){
			var last_point = this.points[index-1]
			var next_point = this.points[index+1]
			if (index = 0 && !closed) last_point = false
			// beziers are .next or .prev, depending which line segment they correspond to.
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
		if (closed) {
			lineTo(this.points[0].x,this.points[0].y)
		}	
		if (filled) {
			save()
				translate(this.x,this.y)
				fill()
			restore()
		}
		stroke()
	},
})
