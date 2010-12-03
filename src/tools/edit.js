// Default editing tool -- selection, translation, rotation, etc.
Fred.tools.edit = new Fred.Tool('select & manipulate objects',{
	select: function() {
		// here go things which must happen when the tool is deactivated
	},
	deselect: function() {
		// here go things which must happen when the tool is activated
	},
	on_dblclick: function() {
		// default edit behavior opens a menu to edit that object. The only option right now is to input code into its 'script' property.
		if (Fred.selection) {
			var existing = Fred.selection.script || "on_mouseup: function() { console.log('hi') }"
			input = prompt("Edit this object's code:",existing)
			if (input != null) Fred.selection.script = ("{"+input+"}").evalJSON()
			Fred.attach_listeners(Fred.selection.script)
		}
	},
	on_mousedown: function() {
		Fred.selector.set_under_pointer()
		// record offset of x,y from mouse
		this.click_x = Fred.pointer_x
		this.click_y = Fred.pointer_y
		this.selection_orig_x = Fred.selection.x
		this.selection_orig_y = Fred.selection.y
		this.dragging = true
	},
	on_mousemove: function() {
		if (Fred.selection && this.dragging) {
			var x = this.selection_orig_x + Fred.pointer_x - this.click_x
			var y = this.selection_orig_y + Fred.pointer_y - this.click_y
			Fred.move(Fred.selection,x,y,true)
		}
	},
	on_mouseup: function() {
		if (Fred.selection && this.dragging) {
			this.dragging = false
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
	draw: function() {

	}
})
