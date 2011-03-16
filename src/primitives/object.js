// Basic, Object class -- many Fred primitives inherit from this.
Fred.Object = Class.create({
	/*
	 * Setup text metrics such as x,y position, interpret alignment and valign
	 */
	setup_text: function() {
		this.text_width = measureText(this.style.fontFamily,this.style.fontSize,this.text)
		this.text_height = this.style.fontSize
	},
	/*
	 * Draw text in the object
	 */
	draw_text: function() {
		if (this.style.textAlign == 'left') {
			this.text_x = this.x
		} else if (this.style.textAlign == 'right') {
			this.text_x = this.x-this.text_width
		} else {//if (this.style.textAlign == 'center') {
			this.text_x = this.x-this.text_width/2
		}
		if (true) { // eventually deal with vertical align here
			this.text_y = this.y+this.text_height/2
		}
		// draw text here
		if (this.text) {
			drawText(this.style.fontFamily,this.style.fontSize,this.style.fontColor,this.text_x,this.text_y,this.text)
		}
	}
})
