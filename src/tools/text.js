// Create a minimal text object
Fred.tools.text = new Fred.Tool('write text',{
	name: 'text',
	icon: '',
	sticky: false,
	select: function() {
		// here go things which must happen when the tool is deactivated
	},
	deselect: function() {
		// here go things which must happen when the tool is activated
	},
	on_mouseup: function() {
		var text = prompt("Enter text for this object")
		// handle escape key to cancel
		var obj = new Fred.Rectangle(100,50,Fred.pointer_x,Fred.pointer_y)
		obj.text = text
		obj.setup_text()
		// ability to set width and height directly in Rectangle
		obj.set_width(obj.text_width+parseInt(obj.style.padding))
		obj.set_height(obj.text_height+parseInt(obj.style.padding))
		Fred.move(obj,-obj.style.padding,-obj.style.padding,false)
		obj.set_centroid()
		obj.style.fill = 'rgba(0,0,0,0)'
		obj.style.lineWidth = 0
		Fred.add(obj)
		if (!this.sticky) {
			//Fred.stop_observing('fred:postdraw',this.draw)
			Fred.select_tool('edit')
		}
	},
	on_touchend: function() {
		this.on_mouseup()
	},
})
