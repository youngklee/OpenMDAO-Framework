
var openmdao = (typeof openmdao === "undefined" || !openmdao ) ? {} : openmdao ;

/**
 * utility functions used in the openmdao gui
 */
openmdao.Util = {

    /**
     * function to toggle visibility of an element
     *
     * id:   id of the element to hide/show
     */
    toggle_visibility: function(id) {
        var e = document.getElementById(id);
        if (e.style.display === 'block') {
            e.style.display = 'none';
        }
        else {
            e.style.display = 'block';
        }
    },

    /**
     * function to block all input on the page
     * (by covering it with a semi-transparent div)
     */
    toggle_screen: function() {
        var id = '_smokescreen_',
            el = document.getElementById(id);
        if (el === null) {
            el = document.createElement('div');
            el.setAttribute('id',id);
            el.style.cssText='position:fixed;top:0px;left:0px;'+
                             'height:100%;width:100%;'+
                             'background:#EEE;opacity:.4;' +
                             'z-index:99999;display:none';
            document.body.appendChild(el);
        }
        if (el.style.display === 'block') {
            el.style.display = 'none';
        }
        else {
            el.style.display = 'block';
        }
    },

    /**
     * open a popup window to view a URL
     *
     * url:     the url to open in the new window
     * title:   the title of the window
     * options: window options
     */
    popupWindow: function(url, title, options) {
        var specs = {
            height:     3/4*screen.height,
            width:      1/2*screen.width,
            top:        10,
            left:       10,
            location:   0,
            menubar:    0,
            resizable:  1,
            scrollbars: 0,
            status:     1,
            titlebar:   1,
            toolbar:    0
        },
        spec_string = '',
        spec = null,
        win = null;

        if (options) {
            jQuery.extend(specs, options);
        }

        for (spec in specs) {
            if (specs.hasOwnProperty(spec)) {
                if (spec_string.length > 0) {
                    spec_string = spec_string + ',';
                }
                spec_string = spec_string + spec + '=' + specs[spec];
            }
        }

        win = window.open(url, title, spec_string);
        win.document.title = title;
        return win;
    },

    /**
     * open a popup window to view HTML
     *
     * html:    the html to display in the new window
     * title:   the title of the window
     * options: window options
     */
    htmlWindow: function(html, title, options) {
        var win =  openmdao.Util.popupWindow('',title,options);
        win.document.open();
        win.document.write(html);
        win.document.close();
    },

    /**
     * open a popup window initialized by the given script
     *
     * title:   the title of the window
     * script:  script to initialize the window
     * options: window options
     */
    scriptWindow: function (title, script, options) {
        var url = "/workspace/base?head_script='"+script+"'",
            win = openmdao.Util.popupWindow(url,title,options);
    },

    /**
     *  escape anything in the text that might look like HTML, etc.
     */
    escapeHTML: function(text) {
        var i = 0,
            result = "";
        for(i = 0; i < text.length; i++){
            if(text.charAt(i) === "&"
                  && text.length-i-1 >= 4
                  && text.substr(i, 4) !== "&amp;"){
                result = result + "&amp;";
            } else if(text.charAt(i) === "<"){
                result = result + "&lt;";
            } else if(text.charAt(i) === ">"){
                result = result + "&gt;";
            } else if(text.charAt(i) === " "){
                result = result + "&nbsp;";
            } else {
                result = result + text.charAt(i);
            }
        }
        return result;
    },

    /**
     * add a handler to the onload event
     * ref: http://simonwillison.net/2004/May/26/addLoadEvent/
     *
     * func:    the function to add
     */
    addLoadEvent: function(func) {
        var oldonload = window.onload;
        if (typeof window.onload !== 'function') {
            window.onload = func;
        }
        else {
            window.onload = function() {
                if (oldonload) {
                    oldonload();
                }
                func();
            };
        }
    },

    /**
     * prompt for a value
     *
     * prompt:      prompt string
     * callback:    the function to call with the provided value
     * baseId:      optional id, default ``get-value``, used for element ids
     */
    promptForValue: function(prompt, callback, baseId) {
        baseId = baseId || 'get-value';

        // if the user didn't specify a callback, just return
        if (typeof callback !== 'function') {
            return;
        }

        var promptId = baseId+'-prompt',
            inputId = baseId+'-input',
            okId = baseId+'-ok',
            cancelId = baseId + '-cancel',
            win = null,
            userInput = null;

        function handleResponse(ok) {
            // close dialog
            win.dialog('close');
            // if response was 'Ok' then invoke the callback
            if (ok && callback) {
                callback(userInput.val());
            }
            // remove from DOM
            win.remove();
        }

        win = jQuery('<div id="'+baseId+'"><div id="'+promptId+'" /></div>');

        userInput = jQuery('<input type="text" id="'+inputId+'" style="width:100%"></input>');
        userInput.bind('keypress.enterkey', function(e) {
            if (e.which === 13) {
                handleResponse(true);
            }
        });
        userInput.appendTo(win);

        win.dialog({
            autoOpen: false,
            modal: true,
            buttons: [
                {
                    text: 'Ok',
                    id: okId,
                    click: function() { handleResponse(true); }
                },
                {
                    text: 'Cancel',
                    id: cancelId,
                    click: function() { handleResponse(false); }
                }
            ]
        });

        jQuery('#'+promptId).html(prompt+':');

        win.dialog('open');
    },

    /**
     * Prompt for confirmation.
     *
     * prompt:      prompt string
     * callback:    the function to call with the provided value
     * title:       optional title, default ``Please confirm``
     * baseId:      optional id, default ``confirm``, used for element ids
     */
    confirm: function(prompt, callback, title, baseId) {
        title = title || 'Please confirm:';
        baseId = baseId || 'confirm';

        // if the user didn't specify a callback, just return
        if (typeof callback !== 'function') {
            return;
        }

        var promptId = baseId+'-prompt',
            okId = baseId+'-ok',
            cancelId = baseId + '-cancel',
            win = null,
            userInput = null;

        // FIXME: this looks like a bug, should be removed in handleResponse()
        if (jQuery('#'+baseId).length > 0) {
            jQuery('#'+baseId).remove();
        }

        function handleResponse(ok) {
            // close dialog
            win.dialog('close');
            // if response was 'Ok' then invoke the callback
            if (ok && callback) {
                callback();
            }
            // remove from DOM
            win.remove();
        }

        win = jQuery('<div id="'+baseId+'"><div id="'+promptId+'" /></div>');

        win.dialog({
            autoOpen: false,
            modal: true,
            title: title,
            buttons: [
                {
                    text: 'Ok',
                    id: okId,
                    click: function() { handleResponse(true); }
                },
                {
                    text: 'Cancel',
                    id: cancelId,
                    click: function() { handleResponse(false); }
                }
            ]
        });

        jQuery('#'+promptId).html(prompt+'?');

        win.dialog('open');
    },

    /**
     * Notify user with `msg`.  Typically used when testing to catch
     * completion of 'background' processing.
     *
     * msg:     message to display.
     * title:   optional title, default ``Note:``.
     * baseId:  optional id, default ``notify``, used for element ids.
     */
    notify: function(msg, title, baseId) {
        title = title || 'Note:';
        baseId = baseId || 'notify';

        var msgId = baseId+'-msg',
            win = null;

        // FIXME: this looks like a bug, should be removed in handleResponse()
        if (jQuery('#'+baseId).length > 0) {
            jQuery('#'+baseId).remove();
        }

        win = jQuery('<div id="'+msgId+'"></div>');
        win.dialog({
            autoOpen: false,
            modal: true,
            title: title,
            buttons: [
                {
                    text: 'Ok',
                    id: baseId+'-ok',
                    click: function() {
                        win.dialog('close');
                        win.remove();
                    }
                }
            ]
        });

        if (msg.indexOf('\n') >= 0) {
            // Try to retain any message formatting.
            win.html(openmdao.Util.escapeHTML(msg).replace(/\n/g, '<br>'));
        }
        else {
            win.text(msg);
        }
        win.dialog('open');
    },

    /**
     * Prompt for object name and arguments.
     *
     * prompt:    prompt string
     * signature: constructor argument signature
     * callback:  the function to call with the name and argument values
     * anonymous: optional, if true then don't include a name input field
     */
    promptForArgs: function(prompt, signature, callback, anonymous) {
        var baseId = 'get-args',
            promptId = baseId+'-prompt',
            nameId = baseId+'-name',
            argsId = baseId+'-tbl',
            okId = baseId+'-ok',
            cancelId = baseId + '-cancel',
            win, nameInput, argsTable, argsHTML, i;

        // FIXME: this looks like a bug, should be removed in handleResponse()
        if (jQuery('#'+baseId).length > 0) {
            jQuery('#'+baseId).remove();
        }

        function handleResponse(ok) {
            // close dialog
            win.dialog('close');
            // if response was 'Ok' then invoke the callback
            if (ok && callback) {
                var args = '';
                jQuery('#'+argsId+ ' input').each(function(i, element) {
                    if (element.value) {
                        args += ', '+signature.args[i][0]+'='+element.value;
                    }
                });
                if (anonymous) {
                    callback('', args);
                } else {
                    callback(nameInput.val(), args);
                }
            }
            // remove from DOM
            win.remove();
        }

        win = jQuery('<div id="'+baseId+'"><div id="'+promptId+'" /></div>');

        if (!anonymous) {
            nameInput = jQuery('<input type="text" id="'+nameId+'" style="width:100%"></input>');
            nameInput.appendTo(win);
        }

        if (signature.args.length) {
            argsHTML = '<table id="'+argsId+'" style="width:100%;">';
            for (i = 0 ; i < signature.args.length ; ++i) {
                argsHTML += '<tr><td align="right">'+signature.args[i][0]+':</td>';
                argsHTML += '<td><input type="text"';
                if (signature.args[i].length > 1) {
                    argsHTML += ' placeholder="'+signature.args[i][1]+'"';
                }
                argsHTML += ' /></td>';
                argsHTML += '</tr>';
            }
            argsHTML += '</table>';
            argsTable = jQuery(argsHTML);
            argsTable.appendTo(win);
        }
        else if (!anonymous) {
            nameInput.bind('keypress.enterkey', function(e) {
                if (e.which === 13) {
                    handleResponse(true);
                }
            });
        }

        win.dialog({
            autoOpen: false,
            modal: true,
            buttons: [
                {
                    text: 'Ok',
                    id: okId,
                    click: function() { handleResponse(true); }
                },
                {
                    text: 'Cancel',
                    id: cancelId,
                    click: function() { handleResponse(false); }
                }
            ]
        });

        jQuery('#'+promptId).html(prompt+':');

        win.dialog('open');
    },

    /**
     * show the properties of an object on the log (debug only)
     *
     * obj: the object for which properties are to be displayed
     */
    dumpProps: function(obj) {
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                debug.log(prop + ": " + obj[prop]);
            }
        }
    },

    /**
     * close the browser window
     */
    closeWindow: function() {
        jQuery('body').html('<center><b>Thank you for using OpenMDAO, You may close your browser now!');
        window.open('','_self');
        window.close();
    },

    /**
     * The purge function takes a reference to a DOM element as an argument. It loops through the
     * element's attributes. If it finds any functions, it nulls them out. This breaks the cycle,
     * allowing memory to be reclaimed. It will also look at all of the element's descendent
     * elements, and clear out all of their cycles as well. The purge function is harmless on
     * Mozilla and Opera. It is essential on IE. The purge function should be called before removing
     * any element, either by the removeChild method, or by setting the innerHTML property.
     *
     * http://www.crockford.com/javascript/memory/leak.html
     */
    purge: function(d) {
        var a = d.attributes, i, l, n;
        if (a) {
            l = a.length;
            for (i = 0; i < l; i += 1) {
                n = a[i].name;
                if (typeof d[n] === 'function') {
                    d[n] = null;
                }
            }
        }
        a = d.childNodes;
        if (a) {
            l = a.length;
            for (i = 0; i < l; i += 1) {
                purge(d.childNodes[i]);
            }
        }
    },

    /** get the path from the pathname */
    getPath: function(pathname) {
        path = '';
        if (pathname) {
            var lastdot = pathname.lastIndexOf('.');
            if (lastdot > 0) {
                path = pathname.substring(0,lastdot);
            }
        }
        return path;
    },

    /** get the name from the pathname */
    getName: function(pathname) {
        var name = pathname,
            tok = pathname.split('.');
        if (tok.length > 1) {
            name = tok[tok.length-1];
        }
        return name;
    },

    /** find the element with the highest z-index of those specified by the jQuery selector */
    getHighest: function (selector) {
        var elems = jQuery(selector),
            highest_elm = null,
            highest_idx = 0,
            i = 0;
        for (i = 0; i < elems.length; i++)  {
            var elem = elems[i][0];
            var zindex = document.defaultView.getComputedStyle(elem,null).getPropertyValue("z-index");
            if ((zindex > highest_idx) && (zindex !== 'auto')) {
                highest_elm = elem;
                highest_idx = zindex;
            }
        }
        return highest_elm;
    },

    /** rotate the page */
    rotatePage: function (x) {
        x = parseInt(x,10);
        var rotateCSS = ' -moz-transform: rotate('+x+'deg); -moz-transform-origin: 50% 50%;'
                      + ' -webkit-transform: rotate('+x+'deg);-webkit-transform-origin: 50% 50%;'
                      + ' -o-transform: rotate('+x+'deg); -o-transform-origin: 50% 50%;'
                      + ' -ms-transform: rotate('+x+'deg); -ms-transform-origin: 50% 50%;'
                      + ' transform: rotate('+x+'deg); transform-origin: 50% 50%;';
        document.body.setAttribute('style',rotateCSS);
    },$doabarrelroll:function(){for(i=0;i<=360;i++){setTimeout("openmdao.Util.rotatePage("+i+")",i*40);} return;},

    /*
     * Allow a child object to inherit from a parent object.
     * Make sure to call this method immediately after defining
     * the child's constructor and before extending it's
     * prototype.
     */
    inherit : function(childObject, parentObject){
        childObject.prototype = new parentObject();
        childObject.prototype.constructor = childObject;
        childObject.prototype.superClass = parentObject.prototype;
    }
};
