// Simple color palette tool
Fred.tools.color = new Fred.Tool('assign color to objects',{
	name: 'color',
	mode: 'color', // or 'edit' -- for dragging the panel itself only
	icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAMOSURBVDjLVZNNaBxlAIafb+ab2Z3N7Oxv/nYTEyv2LzQJpKBgrQqNUKmY4kUIXqUHT70p9iB48CKIiN5E0It6KFiwiv9FpAVpKUggNc3mZ7vpJpv9n93ZnZ35PNRI+8B7e9/n9gqlFAeIVUfPeN3zh0R0eVpYM1OanhvTCEY0f3tU79+ctnpfHM73fuQhxIHAWHnmkOGXPjgZyS09l5hnNv4YOdMhoQmigzqGt4nhfeub1fpnVsl/e+hMv/q/QKy+Me0EO5dfso/OvzB8grgV4HGXJC7jwAQ2oxxDuC36xZ+Rhe+v6iutZf2iqklReNe0tPSHZ2Nz84ujR7ht3iJKjcexiOIQI8SiixxcR7QtRORFlK7O9t0rlyy4KBEj5+YisVeez85wy9zGIUeGDDYhDhYOITYuoh2BvTJ68y7B0GnCym8XGq+KL2U0MrE8Z2SRVhqdPmlCsvgk8RlCkgAivRbUNKj1YPMeeu4wcnjRql7/+jVpyvxsPjbK3whi5LEAB0WWgBRgqwAaFah04X4V7puwdwddz+FXjJMSbXI8aSTYCgU2oKMwEdgCEoDhug/G5SjsmFDUoV+DXJ7BnpiUVCNBaJqEXfDVfwG6CjoKnF4crZGCVvNBug0IPXzPZOCnAunfk8W6ro7H2gK3A02gGoDeA1MDGx2nkYG6C24bvDaMSzq7ZfxBsiC7O+aNDaWOn0oLfl0HMwDlQRCAHYUkEGvFkLsp2G9Bo0n41AiNG6sMBvY1yZr6/JsV//XZZ3WZaEp2t6DvgWFA1QRHQbwjSDeTUGvCiSPU1ovU/typQPIrTV0yrrl3vE+/+8XlaCIgq8H+BtSLUN2C2ibsl8ArR+HYGE0rwvbvRTr96HsL6od1CUDDf+enK92JwT+982cWEswvRmiug6qAr0E4AV4uoFXosnV1g8bN5kcp7E8eOZOYKtmUqm/ZiDdfPhV3Zp6IM5k0SIUBstwmXKvCX5UdM6y9n2b34wV1IXxEcEBU3J4dprU0zODpjFBTIyoIxgjXxlB/PIl1eUmdLjzc/xceOVXddrB6BQAAAABJRU5ErkJggg==',
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
	/**
	 * HSV to RGB color conversion
	 *
	 * H runs from 0 to 360 degrees
	 * S and V run from 0 to 100
	 * 
	 * from Roshambo (snipplr.com): http://snipplr.com/view/14590/hsv-to-rgb/
	 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
	 * http://www.cs.rit.edu/~ncs/color/t_convert.html
	 */
	hsvToRgb: function (h, s, v) {
	var r, g, b;
	var i;
	var f, p, q, t;
	
	// Make sure our arguments stay in-range
	h = Math.max(0, Math.min(360, h));
	s = Math.max(0, Math.min(100, s));
	v = Math.max(0, Math.min(100, v));
	
	// We accept saturation and value arguments from 0 to 100 because that's
	// how Photoshop represents those values. Internally, however, the
	// saturation and value are calculated from a range of 0 to 1. We make
	// That conversion here.
	s /= 100;
	v /= 100;
	
	if(s == 0) {
		// Achromatic (grey)
		r = g = b = v;
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
	
	h /= 60; // sector 0 to 5
	i = Math.floor(h);
	f = h - i; // factorial part of h
	p = v * (1 - s);
	q = v * (1 - s * f);
	t = v * (1 - s * (1 - f));

	switch(i) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break;			
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		default: // case 5:
			r = v;
			g = p;
			b = q;
	}
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
})
