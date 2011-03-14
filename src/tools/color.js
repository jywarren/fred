// Simple color palette tool
Fred.tools.color = new Fred.Tool('assign color to objects',{
	name: 'color',
	mode: 'color', // or 'edit' -- for dragging the panel itself only
	icon: 'data:image/png;base64,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ZnkAMjAwNS0wNC0yM1QwNjo1MjowMi0wNDowMNShFXEAAAAXdEVYdGV4aWY6UGl4ZWxYRGltZW5zaW9uADMyiKxnFwAAABd0RVh0ZXhpZjpQaXhlbFlEaW1lbnNpb24AMzJVOr6SAAAAFXRFWHR0aWZmOmFscGhhAGFzc29jaWF0ZWRof6P+AAAAFHRFWHR0aWZmOnBob3RvbWV0cmljAFJHQrMgSd8AAAAWdEVYdHRpZmY6cm93cy1wZXItc3RyaXAAMzKdTiFrAAAAKnRFWHR0aWZmOnNvZnR3YXJlAEFkb2JlIFBob3Rvc2hvcCBFbGVtZW50cyAyLjAv6/C+AAAAInRFWHR0aWZmOnRpbWVzdGFtcAAyMDA1OjA0OjIzIDE0OjUyOjAyBF3esQAAAEN0RVh0eGFwOkNyZWF0b3JUb29sAEFkb2JlIFBob3Rvc2hvcCBFbGVtZW50cyBmb3IgTWFjaW50b3NoLCB2ZXJzaW9uIDIuMAD4a/EAAABLdEVYdHhhcE1NOkRvY3VtZW50SUQAYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY2ZjQyN2U0LWI1OTgtMTFkOS04NWU1LWNhNjZkMjdkM2EwYWEIpioAAAAASUVORK5CYII=',
	select: function() {
		// here go things which must happen when the tool is activated
		this.panel = this.panel || new Fred.Rectangle(235,80)
		this.picker = this.picker || new Fred.Rectangle(195,40,Fred.width/2+20,Fred.height/2+20)
		Fred.add(this.panel)
		Fred.add(this.picker)
		this.picker.style.pattern = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMMAAAABCAYAAABjXxoVAAAAZElEQVQokaWSSw6AIBBD30gEEu9/V/ziQjaOSMRZNCSv3bSD5IlMBCIQyqtl4bVMYUeA1UHi0lyUKurlLW+5ZeRjoTfvz0DK2xwk6Sukc71DKOazrY23LcDIzqAuY/8JrcGe/ASqeGcEFhVFaAAAAABJRU5ErkJggg=="
		this.panel.show_highlights = false
		this.panel.style.fill = 'rgba(0,0,0,0.3)'
		this.picker.show_highlights = false
	},
	deselect: function() {
		// here go things which must happen when the tool is deactivated
		Fred.remove(this.panel)
		Fred.remove(this.picker)
		this.panel = false
		this.picker = false
	},
	draw: function() {
		
	},
	on_mousedown: function() {
		if (Fred.Geometry.is_point_in_poly(this.picker.points,Fred.pointer_x,Fred.pointer_y)) {
			this.mode = 'color'
			var color = Fred.get_color(Fred.pointer_x,Fred.pointer_y)
			Fred.selection.each(function(selection){
				selection.style.fill = "rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")"
			},this)
		} else {// if (Fred.Geometry.is_point_in_poly(this.panel.points,Fred.pointer_x,Fred.pointer_y)){
			this.mode = 'edit' // acts like edit for dragging around the panel
			Fred.tools.edit.on_mousedown()
		}
	},
	on_touchstart: function() {
		this.on_mousedown()
	},
	on_mouseup: function() {
		if (this.mode = 'edit') {
			Fred.tools.edit.on_mouseup()
			this.mode = 'color'
		}
	},
	on_touchend: function() {
		this.on_mouseup()
	},
	on_mousemove: function() {
		if (this.mode = 'edit') {
			Fred.tools.edit.on_mousemove()
			Fred.move(this.picker,this.panel.x+20,this.panel.y+20,true)
		}
	},
	on_touchmove: function() {
		this.on_mousemove()
	},
})
