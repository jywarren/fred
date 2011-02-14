// Simple color palette tool
Fred.tools.color = new Fred.Tool('assign color to objects',{
	name: 'color',
	icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAQAAAAEABcxq3DAAAA2klEQVQoz32QMU7DQBBF30rbUCCkpHaPLdH4BJEoOQMSoqHhAFDkAjRIiNZHSBRqijQgKmhN7YIrEMne+SmM8dqJMqPdYv6bP7PrxOHw8FApUXmXDYXbdT1ryiLzQHLBS7qUgIAQhvHLNc8peAhfq/yICfpPQ5zwSPMOTsBCU2wgG8YPNw48QPgrdvbtHboliYqKTtMDgRBZd2NCDNiof4/DWBbWA030/h7bGbHfwYnzqk6OuRohT3wTyk3mYZPMuaeKFjWgpOAyBUT+eWanH2KY/tWJN7VffSi2LS+tHNedUoUAAAAldEVYdGNyZWF0ZS1kYXRlADIwMTAtMDMtMDlUMDk6MzE6NDYtMDU6MDCQx+NFAAAAJXRFWHRtb2RpZnktZGF0ZQAyMDA2LTAzLTEyVDIxOjU3OjE4LTA1OjAwvZAdJgAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAASUVORK5CYII=',
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
	on_touchstart: function() {
		this.on_mousedown()
	}
})
