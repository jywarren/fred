// Allows manipulation of groups of objects
// This is not done. There remains a lot to decide about how this works.
Fred.Group = Class.create({
	initialize: function(members,x,y) {
		if (!Object.isArray(members)) {
			Fred.error('Fred.Group requires an array.')
		} else {
			this.members = members
			// Remove members from active layer
			this.members.each(function(member){
				Fred.remove(member)
			})
			Fred.add(this)
		
			// Calculate bounding box
			// ...
	
			// Group context origin:
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
			// Draw bounding box
		}
	},
	on_mousedown: function() {
		// If we're within the bounding box? or if we're within bounds of members?
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
