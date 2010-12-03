// Selection storage and management
Fred.selection = false
Fred.selector = {
	// a collection of past selections
	history: [],
	// selects a single object under the pointer x,y
	set_under_pointer: function() {
		this.set(Fred.pointer_x,Fred.pointer_y)
	},
	// selects a single object under the specified x,y
	set: function(x,y) {
		this.clear()
		Fred.objects.each(function(obj){
			// test if we have one already
			// and if it has points we can use to test 'insideness'
			if (!Fred.selection && Fred.is_object(obj)) {
				if (Fred.Geometry.is_point_in_poly(obj.points,x,y)) {
					Fred.selection = obj
				}
			}
		},this)
	},
	clear: function() {
		this.history.push(Fred.selection)
		Fred.selection = false
	}
}
