/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"define metadata";
({
    "dependencies": { "jslint": "0.0.0", "notifier": "0.0.0" },
    "description": "Provides the JSLint command to check code for errors.",
    "objects": [],
    "provides": [
        {
            "ep": "command",
            "name": "jslint",
            "params": [],
            "description": "Run JSLint to check the current file",
            "pointer": "#jslintCommand",
            "key": "ctrl_shift_v",
            "predicates": { "context": "js" }
        },
        {
            "ep": "savehook",
            "name": "jslint",
            "description": "Runs JSLint when a JavaScript file is saved",
            "pointer": "#jslintSaveHook"
        },
        {
            "ep": "notification",
            "name": "jslint_error",
            "description": "JSLint errors",
            "level": "error"
        }
    ]
});
"end";

var env = require('environment').env;
var jslint = require('jslint').jslint;
var catalog = require("bespin:plugins").catalog;

function runJSLint(model) {
    var ok = jslint(model.getValue());
    if (ok) {
        return "JSLint succeeded";
    }

    var errors = jslint.errors;
    var plural = (errors.length === 1) ? "" : "s";
    var message = "JSLint reported " + errors.length + " error" + plural;
    var output = [ "<div>", message, ":</div>" ];

    errors.forEach(function(err) {
        if (err == null) {
            return;
        }

        output.push("<div>");
        output.push(err.line);
        output.push(":");
        output.push(err.character);
        output.push(": ");
        output.push(err.reason);
        output.push("</div>");

        var line = model.lines[err.line - 1];
        var character = err.character - 1;
        line = line.replace(/</g, "&lt;").replace(/\t/g, "    ");

        output.push("<pre>");
        output.push(line);
        output.push("\n");
        for (var i = 0; i < character; i++) {
            output.push(".");
        }
        output.push('^</pre>');
    });
    
    if (errors[errors.length-1] === null) {
        var notifier = catalog.getObject('notifier');
        if (notifier) {
            notifier.notify({
                plugin: 'jslint_command',
                notification: 'jslint_error',
                body: message
            });
        }
    }

    return output.join("");
};

exports.jslintCommand = function(args, req) {
    req.done(runJSLint(env.model));
};

exports.jslintSaveHook = function(file) {
    var extension = file.extension();
    if (extension !== "js" && extension !== "jsm") {
        return "";
    }

    return runJSLint(env.model);
};

exports.runJSLint = runJSLint;

