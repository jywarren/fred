Fred.toolbar = {
	position: 'top',
	height: 50,
	element: false,
	initialized: false,
	
	init: function() {
		if (!$('fred_toolbar')) {
			$$('body')[0].insert({top:'<div id="fred_toolbar"></div>'})
			this.element = $('fred_toolbar')
			$$('body')[0].insert("<style>#fred_toolbar {height: "+this.height+"px;width: 100%;background:#222;background:-webkit-gradient(linear, 0% 0%,0% 100%,from(#444),to(#222))}#fred_toolbar a.button {display:block;float:left;height:40px;width:40px;margin:6px;}</style>")
			this.members.each(function(member){
				this.element.insert('<a class="button" href="javascript:void();" onClick="Fred.select_tool(\''+member.name+'\')"><img src="'+member.icon+'" /></a>')
			},this)
			this.initialized = true

		}
	},

	show: function() {
		this.active = true
		Fred.height_offset += this.height
		if (!this.initialized) this.init()
		Fred.resize()
		this.element.show()
	},
	hide: function() {
		this.active = false
		Fred.height_offset -= this.height
		Fred.resize()
		this.element.hide()
	},
	toggle: function() {
		if (this.active) this.hide()
		else this.show()
	},
	/*
	 * slide open and closed with animation
	 */
	open: function() {

	},
	close: function() {

	},

	// members must have an .icon parameter
	members: [
		Fred.tools.pen,
		Fred.tools.edit,
	],
	on_mousedown: function() {
		if (Fred.pointer_x < this.height) {
			this.dragging = true
		}
	},
	on_mousemove: function() {
		if (this.dragging) {
			
		}
	},
	on_mouseup: function() {
		this.dragging = false
	}
}
