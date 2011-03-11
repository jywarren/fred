// Basic rectangle class based on Fred.Polygon
Fred.Rectangle = Class.create(Fred.Polygon,{
	initialize: function(width,height,x,y) {
		this.width = width || 50
		this.height = height || 50
		this.x = x || Fred.width/2
		this.y = y || Fred.height/2
		this.complete = true
		this.closed = true
		this.points = []
		this.corners = [[this.x,this.y],[this.x+this.width,this.y],[this.x+this.width,this.y+this.height],[this.x,this.y+this.height]]
		this.corners.each(function(point){
			this.points.push(new Fred.Point(point[0],point[1]))
		},this)
		this.selected = false
		this.rotation = 0
		this.rotation_point = false
		this.show_highlights = true
		this.style = {
			fill: '#ccc',
			stroke: '#222',
			lineWidth: 2,
			textsize: 15,
			textfill: '#222',
			font: 'georgia',
			pattern: false,
		}
		return this
	},
})
