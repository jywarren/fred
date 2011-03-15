// Edit an object's script, in JavaScript
Fred.tools.script = new Fred.Tool('script object behaviors',{
	name: 'script',
	icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAQAAAAEABcxq3DAAABVklEQVQozz3PL2+TYRSG8d/79H3brYx17WiWkJGBweAQkEmyYNiXmMPicBgUgoQPQILAokCQYFCY+SWAAEMWmtGydaPt+68PooUjjjlX7nPdScTLO170d3OFWnnm3C+134Ze+5BCfffa7gOLyTt5Z7Jdmhk4uu9RCtXWCkaCoCHT09BwXa/38XmAar1pbmZmamrqjzFeuelqf5HQa5mZCRINQSKIal98O06h2GqbyIUlQgOn3o4dpFDubJiKanNBLTEXBfmNJ6OwALpyiSCRLNtEhbIm5fFq2sxUEkQRUVC5qIwJFP2wPJIsd9O5YvAsEijb/9yjuPyfGSmPITy8Uj695dRPY4Uo0dTSdqYcQFru2T8ykauUKrW5DfuGypMFcHtv9eC/eaUSvdN0oRxCWn0/8d5l69asaWvK3JMZqn4sgDeH24c7Nm3q6uq0shWXrPv81Sf4C+unh7173JnWAAAAJXRFWHRjcmVhdGUtZGF0ZQAyMDEwLTAzLTA5VDA5OjMxOjQ2LTA1OjAwkMfjRQAAACV0RVh0bW9kaWZ5LWRhdGUAMjAwNi0wMy0xMlQyMTo1Njo1NC0wNTowMBG4EpYAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC',
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
