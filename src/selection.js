// Selection storage and management

/**
 * This contains and manages all the selected objects, 
 * typically by the edit tool. However it also serves
 * as a prototype for the Fred.Group class, which will
 * build on this code.
 */
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
			// average the seleted objects' positions
			this.members.each(function(member) {
				this.x += member.x
				this.y += member.y
			},this)
			this.x = this.x/this.members.length
			this.y = this.y/this.members.length
		}
	},
	/**
	 * Moves all member objects' points either to an absolute 
	 * position or one relative to the object's
	 * current position.
	 */
	move: function(x,y,absolute) {
		this.members.each(function(obj) {
			// If the object has its own way of moving, this is preferred.
			// Thinking of tweening, acceleration, recursion
			if (obj.move) {
				obj.move(x,y,absolute)
			} else if (Fred.is_object(obj)) {
				// we know how to deal with these
				obj.points.each(function(point){
					if (absolute) {
						point.x = (point.x-Fred.selection.x)+x
						point.y = (point.y-Fred.selection.y)+y
					} else {
						point.x += x
						point.y += y
					}
				},this)
				// must correct the object x,y also
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
	// a collection of past selections
	history: [],
	// selects a single object under the pointer x,y
	get_under_pointer: function() {
		return this.get_under_point(Fred.pointer_x,Fred.pointer_y)	
	},
	// selects a single object under the specified x,y
	get_under_point: function(x,y) {
		this.clear()
		Fred.objects.each(function(obj){
			// test if we have one already
			// and if it has points we can use to test 'insideness'
			if (this.empty && Fred.is_object(obj)) {
				// later replace this with a general is_point_in_obj()
				if (Fred.Geometry.is_point_in_poly(obj.points,x,y)) {
					Fred.selection.add(obj)
				} // else if (Fred.Geometry.is_point_on_polyline(obj.points,x,y)) {
				//}
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
					// later replace this with a general is_point_in_obj()
					if (Fred.Geometry.is_point_in_poly(obj.points,x,y)) {
						console.log('inside')
						inside = true
					} // else if (Fred.Geometry.is_point_on_polyline(obj.points,x,y)) {
					//}
				}
			},this)
		}
		return inside
	},
}
