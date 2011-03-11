// Basic, Object class -- many Fred primitives inherit from this.
Fred.Object = Class.create({

	on_mousedown: function() {
		this.mouse_is_down = true
		this.mousedown_time = Fred.get_timestamp()
		this.long_click_timer = setTimeout(Fred.long_click_time,this.on_long_click.apply(this))
		console.log('setup long click timer')
	},
	on_mouseup: function() {
		this.mouse_is_down = false
	},
	on_long_click: function() {
		console.log('long click!')
	},

})
