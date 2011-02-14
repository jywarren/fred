// Simple color palette tool
Fred.tools.color = new Fred.Tool('assign color to objects',{
	select: function() {
		// here go things which must happen when the tool is activated
		this.pane = this.pane || new Fred.Polygon([[0,0],[195,0],[195,40],[0,40]],{complete:true,closed:true})
		Fred.add(this.pane)
		this.pane.style.pattern = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMMAAAABCAYAAABjXxoVAAAAZElEQVQokaWSSw6AIBBD30gEEu9/V/ziQjaOSMRZNCSv3bSD5IlMBCIQyqtl4bVMYUeA1UHi0lyUKurlLW+5ZeRjoTfvz0DK2xwk6Sukc71DKOazrY23LcDIzqAuY/8JrcGe/ASqeGcEFhVFaAAAAABJRU5ErkJggg=="
		Fred.move(this.pane,Fred.width/2-195,Fred.height/2)
		this.pane.show_highlights = false
		this.pane.style.lineWidth = 5
	},
	deselect: function() {
		// here go things which must happen when the tool is deactivated
		Fred.remove(this.pane)
		this.pane = false
	},
	draw: function() {
		
	},
	on_mousedown: function() {
		if (Fred.Geometry.is_point_in_poly(this.pane.points,Fred.pointer_x,Fred.pointer_y)) {
			var color = Fred.get_color(Fred.pointer_x,Fred.pointer_y)
			Fred.selection.each(function(selection){
				selection.style.fill = "rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")"
			},this)
		} else {
			Fred.tools.edit.on_mousedown()
		}
	},
})
