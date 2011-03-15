// Default editing tool -- selection, translation, rotation, etc.
Fred.tools.edit = new Fred.Tool('select & manipulate objects',{
	name: 'edit',
	icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAQAAAAEABcxq3DAAAA2klEQVQoz32QMU7DQBBF30rbUCCkpHaPLdH4BJEoOQMSoqHhAFDkAjRIiNZHSBRqijQgKmhN7YIrEMne+SmM8dqJMqPdYv6bP7PrxOHw8FApUXmXDYXbdT1ryiLzQHLBS7qUgIAQhvHLNc8peAhfq/yICfpPQ5zwSPMOTsBCU2wgG8YPNw48QPgrdvbtHboliYqKTtMDgRBZd2NCDNiof4/DWBbWA030/h7bGbHfwYnzqk6OuRohT3wTyk3mYZPMuaeKFjWgpOAyBUT+eWanH2KY/tWJN7VffSi2LS+tHNedUoUAAAAldEVYdGNyZWF0ZS1kYXRlADIwMTAtMDMtMDlUMDk6MzE6NDYtMDU6MDCQx+NFAAAAJXRFWHRtb2RpZnktZGF0ZQAyMDA2LTAzLTEyVDIxOjU3OjE4LTA1OjAwvZAdJgAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAASUVORK5CYII=',
	selection_box: {
		// clockwise:
		points: [ {x: 0, y: 0}, {x: 0, y:0}, 
			  {x: 0, y: 0}, {x: 0, y:0} ]
	},
	select: function() {
		// here go things which must happen when the tool is deactivated
		Fred.keys.add('g',function(){
			console.log('grouping')
			new Fred.Group(Fred.selection.members)
		})
	},
	deselect: function() {
		// here go things which must happen when the tool is activated
	},
	on_longclick: function() {
		this.on_dblclick()
	},
	on_dblclick: function(e) {
		Fred.selection.first().text = prompt("Enter text for this object")
		Fred.selection.first().setup_text()
	},
	on_mousedown: function() {
		// record offset of x,y from mouse
		this.click_x = Fred.pointer_x
		this.click_y = Fred.pointer_y
		if (Fred.selection.is_point_inside(Fred.pointer_x,Fred.pointer_y)) {
				this.dragging_object = true
				this.selection_orig_x = Fred.selection.x
				this.selection_orig_y = Fred.selection.y
		} else {
			Fred.selection.clear()
			if (Fred.selection.get_under_pointer()) {
				this.dragging_object = true
				this.selection_orig_x = Fred.selection.x
				this.selection_orig_y = Fred.selection.y
			} else {
				this.dragging_selection = true
				this.selection_box.points[0].x = Fred.pointer_x
				this.selection_box.points[0].y = Fred.pointer_y
				this.selection_box.points[3].x = Fred.pointer_x
				this.selection_box.points[1].y = Fred.pointer_y
			}
		}
	},
	on_mousemove: function() {
		if (this.dragging_object) {
			var x = this.selection_orig_x + Fred.pointer_x - this.click_x
			var y = this.selection_orig_y + Fred.pointer_y - this.click_y
			Fred.move(Fred.selection,x,y,true)
		} else if (this.dragging_selection) {
			this.selection_box.points[1].x = Fred.pointer_x
			this.selection_box.points[2].x = Fred.pointer_x
			this.selection_box.points[2].y = Fred.pointer_y
			this.selection_box.points[3].y = Fred.pointer_y
			this.selection_box.width = Fred.pointer_x-this.selection_box.points[0].x
			this.selection_box.height = Fred.pointer_y-this.selection_box.points[0].y
			// For now we recalculate selection every time the mouse moves.
			// If that becomes inefficient, we can switch.
			this.get_selection_box()
		}
	},
	draw: function() {
		if (this.dragging_selection) {
			save()
				lineWidth(0.7)
				opacity(0.7)
				strokeStyle('#222')
				strokeRect(this.selection_box.points[0].x,this.selection_box.points[0].y,this.selection_box.width,this.selection_box.height)
				opacity(0.3)
				rect(this.selection_box.points[0].x,this.selection_box.points[0].y,this.selection_box.width,this.selection_box.height)
			restore()
		}
	},
	on_mouseup: function() {
		if (this.dragging_object) this.dragging_object = false
		if (this.dragging_selection) this.dragging_selection = false
		if (this.getDataUrl == true) {
			getDataUrl
			this.getDataUrl == false
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
	get_selection_box: function() {
		Fred.selection.clear()
		// now we must determine what we're selecting
		// if dragging right, get any point. if dragging left, get only whole objects.
		var whole_objects = (this.selection_box.points[0].x < this.selection_box.points[1].x)
		Fred.objects.each(function(obj){
			// Fred.Geometry.does_poly_overlap_poly(obj,this.selection_box)
			var all_inside = true
			var one_inside = false
			obj.points.each(function(point){
				if (Fred.Geometry.is_point_in_poly(this.selection_box.points,point.x,point.y)) one_inside = true
				else all_inside = false
			},this)
			if ((all_inside && whole_objects) || (one_inside && !whole_objects)) Fred.selection.add(obj)
		},this)
		//if (Fred.selection.size() == 0) Fred.selection.clear()
	}
})
