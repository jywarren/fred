// A class for modal dialog boxes
Fred.Dialog = Class.create({
	/* example: new Fred.Dialog({	title:'Object script:',
	 *				content:'<textarea>'++'</textarea>'})
	 * 				buttons: [
	 *						{title:'Save',}
	 *					]
	 */
	initialize: function(args) {
		this.title = args.title || ''
		this.content = args.content || ''
		this.buttons = args.buttons || []
		this.buttons.each(function(button){

		})
	},
})
