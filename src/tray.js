Fred.tray = {
	position: 'top',
	height: 12,
	// members must have an .icon parameter
	members: [
		Fred.tools.pen,
		Fred.tools.select,
	],
	on_mousedown: function() {
		if (Fred.pointer_x < this.height) {
			this.dragging = true
		}
	},
	on_mousemove: function() {
		if (this.dragging) {
			
		}
	}
	on_mouseup: function() {
		this.dragging = false
	}
}
