Fred.toolbar = {
	position: 'top',
	height: 50,
	element: false,
	initialized: false,
	
	init: function() {
		if (!$('fred_toolbar')) {
			$$('body')[0].insert({top:'<div id="fred_toolbar"></div>'})
			this.element = $('fred_toolbar')
			$$('body')[0].insert("<style>#fred_toolbar {height: "+this.height+"px;width: 100%;background:#222;background:-webkit-gradient(linear, 0% 0%,0% 100%,from(#444),to(#222))}#fred_toolbar a.button {display:block;float:left;height:16px;width:16px;margin:6px;margin-right:0;padding:9px;border:1px solid #000;background:-webkit-gradient(linear, 0% 0%,0% 100%,from(#666),to(#333));-moz-border-radius-topleft:3px;-webkit-border-top-left-radius:3px;-moz-border-radius-bottomleft:3px;-webkit-border-bottom-left-radius:3px;-moz-border-radius-topright:3px;-webkit-border-top-right-radius:3px;-moz-border-radius-bottomright:3px;-webkit-border-bottom-right-radius:3px;} #fred_toolbar a.button:hover {background:-webkit-gradient(linear, 0% 0%,0% 100%,from(#555),to(#222));} #fred_toolbar a.button.active {background:-webkit-gradient(linear, 0% 0%,0% 100%,from(#333),to(#444));} </style>")
			this.members.each(function(member){
				this.element.insert('<a id="fred_toolbar_'+member.name+'" class="button" href="javascript:void();" onClick="Fred.select_tool(\''+member.name+'\')"><img src="'+member.icon+'" /></a>')
			},this)
			this.initialized = true

		}
	},
	update: function() {
		this.members.each(function(member) {
			$('fred_toolbar_'+member.name).removeClassName('active')
			if (Fred.active_tool.name == member.name) $('fred_toolbar_'+member.name).addClassName('active')
		},this)
	},

	show: function() {
		this.active = true
		Fred.height_offset += this.height
		if (!this.initialized) this.init()
		Fred.resize()
		this.update()
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
		Fred.tools.color,
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
