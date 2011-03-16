// Create a minimal text object
Fred.tools.text = new Fred.Tool('write text',{
	name: 'text',
	icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAmJLR0QA/vCI/CkAAAAJcEhZcwAAAEgAAABIAEbJaz4AAAAJdnBBZwAAABAAAAAQAFzGrcMAAAFsSURBVCjPVdG/S1tRGMbx77n3mlxjEqM2VZvbBttJ0M1BBzu4WShdipOltT8o3fsf9A/o1sXZycWldRLBQRQcNKCDIKhQSinV0kTDTc49Twfr1TzT4eED5+V9IU28nMjKyqq9d9Oa64dKrR8fwzZg+NQcmDS1q95L6fMdl2OaGUbY7nKvrusUtD5s5e4REjLCWcALmQ6gyI6eEjERP27coYQNmeoE89veEAUqKvpFBjnvdgsdIHm/m60SQU1Lw0k3l76Zk58CjdXLZ1SI6v5nb7HcDPGwMJMCt7CTfUCJvM86h/5FHmgU9AYgABn3cj8YpwcCnQDGBy5M6amyJg6A6Z9dCcN8ZzNzNVGFRyS0bWaWlQDc21r+Pn8YpMrt1It971gxyuj3l/wY/YzrZvHn9m/gETXNXY/ZU1cgx8MGr83/8KSnAY7Y8oxk9Zu+al+KVU4P16v4RMf6pWQDd1BXS5Jbu/2/25QkyR39AwdWkBFpFIBqAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDExLTAzLTE1VDE3OjQyOjU0LTA2OjAwKDV51AAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMS0wMy0xNVQxNzo0Mjo1NC0wNjowMFlowWgAAAAZdEVYdFNvZnR3YXJlAHd3dy5pbmtzY2FwZS5vcmeb7jwaAAAAAElFTkSuQmCC',
	sticky: false,
	select: function() {
		// here go things which must happen when the tool is deactivated
	},
	deselect: function() {
		// here go things which must happen when the tool is activated
	},
	on_mouseup: function() {
		strokeStyle('#ccc')
		lineWidth(2)
		strokeRect(Fred.pointer_x,Fred.pointer_y-3,100,Fred.default_style.fontSize+3)
		var text = prompt("Enter text for this object")
		if (text != "") {
			var obj = new Fred.Rectangle(100,50,Fred.pointer_x,Fred.pointer_y)
			obj.text = text
			obj.setup_text()
			// ability to set width and height directly in Rectangle
			obj.set_width(obj.text_width+parseInt(obj.style.padding))
			obj.set_height(obj.text_height+parseInt(obj.style.padding))
			Fred.move(obj,-obj.style.padding,-obj.style.padding,false)
			obj.set_centroid()
			obj.highlight_outline = true
			obj.style.fill = 'none'
			obj.style.lineWidth = 0
			Fred.add(obj)
		}
		if (!this.sticky) {
			//Fred.stop_observing('fred:postdraw',this.draw)
			Fred.select_tool('edit')
		}
	},
	on_touchend: function() {
		this.on_mouseup()
	},
})
