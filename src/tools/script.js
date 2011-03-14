// Edit an object's script, in JavaScript
Fred.tools.script = new Fred.Tool('script object behaviors',{
	name: 'script',
	icon: '',
	select: function() {
		// here go things which must happen when the tool is deactivated
	},
	deselect: function() {
		// here go things which must happen when the tool is activated
	},
	on_dblclick: function() {
		// default edit behavior opens a menu to edit that object. The only option right now is to input code into its 'script' property.
		if (!Fred.selection.empty) {
			Fred.selection.each(function(selection) {
				var existing = selection.script || "on_mouseup: function() { console.log('hi') }"
				input = prompt("Edit this object's code:",existing)
				if (input != null) selection.script = ("{"+input+"}").evalJSON()
				Fred.attach_listeners(selection.script)
			},this)
		}
	},
})
