// Geometric utility storage
Fred.Geometry = {
	/**
	 * Yields an angle and distance given an origin point and subject point
	 * @param {Number} x1    X-coordinate of the origin point
	 * @param {Number} y1    Y-coordinate of the origin point
	 * @param {Number} x2    X-coordinate of the subject point
	 * @param {Number} y2    Y-coordinate of the subject point
	 * @return {angle:Number,distance:Number}   
	 * @type Object
	 */
	polar_from_points: function(x1,y1,x2,y2) {
		// cos(a) = (x2-x1)/(y2-y1)
		var angle = Math.atan((y2-y1)/(x2-x1))
		var distance = Fred.Geometry.distance(x1,y1,x2,y2)
		return {angle:angle,distance:distance}
	},

	/**
	 * Yields a new point given an original point, angle, and distance.
	 * @param {Number} x    X-coordinate of the original point
	 * @param {Number} y    Y-coordinate of the original point
	 * @param {Number} t    Angle between the new point and the old point
	 * @param {Number} d    Distance between old and new points
	 * @return {x:Number,y:Number}   
	 * @type Object
	 */
	point_from_polar: function(x,y,t,d) {
		var dx = d*Math.acos(t)
		var dy = d*Math.asin(t)
		//$C.lineTo($c.lastPoint.x+dx,$c.lastPoint.y+dy)
		return {x:dx+x,y:dy+y}
	},

	/**
	 * Yields a new point given an original point, angle, and distance.
	 * @param {Number} origin_x    X-coordinate of the origin point
	 * @param {Number} origin_y    Y-coordinate of the origin point
	 * @param {Number} x    X-coordinate of the point to move
	 * @param {Number} y    Y-coordinate of the point to move
	 * @param {Number} angle    Angle to rotate to around origin (absolute)
	 * @return {x:Number,y:Number}   
	 * @type Object
	 */
	rotate_around_point: function(origin_x,origin_y,x,y,angle) {
		var distance = Fred.Geometry.distance(origin_x,origin_y,x,y)
		// This is for a change in size as well as angle -- saving for later
		//var distance_change = distance - this.self_distance

		var new_x = origin_x+Math.cos(angle)*(distance)//+distance_change)
		var new_y = origin_y+Math.sin(angle)*(distance)//+distance_change)
		return {x: new_x, y: new_y}
	},

	/**
	 * Determines if a point is in a polygon. 
	 * @param {Number} x    X-coordinate of the first point
	 * @param {Number} y    Y-coordinate of the first point
	 * @param {Number} x    X-coordinate of the second point
	 * @param {Number} y    Y-coordinate of the second point
	 * 
	 * @return Number 	The distance between the two points
	 * @type Number
	 */
	distance: function(x1,y1,x2,y2) {
		return Math.sqrt(Math.pow(Math.abs(x1-x2),2) + Math.pow(Math.abs(y1-y2),2))
	},

	/**
	 * Determines if a point is in a polygon. 
	 * @param {Node[]} poly Array of nodes that make up the polygon
	 * @param {Number} x    X-coordinate of the point to check for
	 * @param {Number} y    Y-coordinate of the point to check for
	 * 
	 * @return True if the point is inside the polygon, else false
	 * @type Boolean
	 * 
	 * @author Jonas Raoni Soares Silva <a href="http://jsfromhell.com/math/is-point-in-poly">
	 *         http://jsfromhell.com/math/is-point-in-poly</a>
	 */
	is_point_in_poly: function(poly, x, y){
	    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
	        ((poly[i].y <= y && y < poly[j].y) || (poly[j].y <= y && y < poly[i].y))
	        && (x < (poly[j].x - poly[i].x) * (y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
	        && (c = !c);
	    return c;
	},

	/**
	 * Finds the centroid of a polygon
	 * @param {Node[]} polygon Array of points that make up the polygon
	 * @return A tuple, in [x, y] format, with the coordinates of the centroid
	 * @type Number[]
	 */
	poly_centroid: function(polygon) {
		var n = polygon.length
		var cx = 0, cy = 0
		var a = Fred.Geometry.poly_area(polygon,true)
		var centroid = []
		var i,j
		var factor = 0
		
		for (i=0;i<n;i++) {
			j = (i + 1) % n
			factor = (polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y)
			cx += (polygon[i].x + polygon[j].x) * factor
			cy += (polygon[i].y + polygon[j].y) * factor
		}
		
		a *= 6
		factor = 1/a
		cx *= factor
		cy *= factor
		centroid[0] = cx
		centroid[1] = cy
		return centroid
	},

        /**
         * Finds the area of a polygon
         * @param {Fred.Point[]}  points    Array of points with p.x and
		 p.y properties that make up the polygon 
         * @param {Boolean} [signed] If true, returns a signed area, else
		 returns a positive area.
         *                           Defaults to false.
         * @return Area of the polygon
         * @type Number
         */
        poly_area: function(points, signed) {
                var area = 0
                points.each(function(point,index) {
                        if (index < point.length-1) next = points[index+1]
                        else next = points[0]
                        if (index > 0) last = points[index-1]
                        else last = points[points.length-1]
                        area += last.x*point.y-point.x*last.y+point.x*next.y-next.x*point.y
                })
                if (signed) return area/2
                else return Math.abs(area/2)
        },

	/**
	 * Determines whether poly_a and poly_b overlap, where
	 * each has array poly.points with point.x and point.y
	 */
	does_poly_overlap_poly: function(poly_a,poly_b) {
		// easier said than done
		// ...
	}
}
