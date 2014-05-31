/// <reference path="/javascript/_references.js"/>
(function ($, window, document, undefined) {
    var pluginName = "modal",
        defaults = {
            width: "auto",
            height: "auto",
            css: {},
            stayInWindow: true,
            putItBack: true,
            url: '',
            content: '',
            type: 'default', // default | text | image if content or url property specified script will look this property to what to do with content.
            onOpen: function () { },
            onClose: function () { },
            onLoad: function () { },
            intoFrame: false,
            frameOptions: {
                frameBorder: "0",
                scrolling: "no"
            }
        },
        keyCodeMap = {
            9: "tab",
            27: "esc",
            37: "left",
            39: "right",
            13: "enter",
            38: "up",
            40: "down"
        },
        modalize = function (element, options) {
            var t = this;
            if (arguments.length === 1) {
                options = element;
                element = undefined;
            }
            if (element) {
                t.element = element;
                t.$element = $(element);
                t.$parent = t.$element.parent();
            }
            t.options = $.extend(true, {}, defaults, options);

            t._defaults = defaults;
            t._name = pluginName;

            t.init();
        },
        body = document.body,
        $bg,
        $container,
        $content,
        $closeHandler,
        $iframe,
        $window = $(window),
        $document = $(document);

    //create base elements and assign to variables once
    if (!$.data(window, 'plugin_' + pluginName)) {
        $.data(window, 'plugin_' + pluginName, true);

        $bg = $("<div />", {
            "class": "modal-bg closed"
        }).appendTo(body).css({
            width: $window.width(),
            height: $document.height()
        });

        $container = $("<div />", {
            "class": "modal-container closed"
        }).appendTo(body);

        $content = $("<div />", {
            "class": "modal-content"
        }).appendTo($container);

        $closeHandler = $("<div />", {
            "class": "modal-close"
        }).appendTo($container);
    }

    modalize.prototype.init = function () {
        var t = this,
            o = t.options,
            $e = t.$element || null;

        //preserve default styling modal container
        $container.removeAttr("style");

        if ($e) {
            t.visibleState = $e.is(":visible");
            t.elemIndex = $e.index();
        }


        if (!$container.hasClass("closed")) {
            $.modalize.close(true);
        }

        if (o.type === 'image') {
            o.putItBack = false;
            var src = o.url;
            $content.addClass("loading");
            $("<img />", {
                src: src,
                width: o.width,
                height: o.height
            }).one("load.modalize", function () {
                var $this = $(this),
                    iWidth = $this.width(),
                    iHeight = $this.height(),
                    ratio = iWidth / iHeight,
                    wWidth = $window.width(),
                    wHeight = $window.height();

                o.onLoad.call(t);
                $content.removeClass("loading");
                if (iHeight > wHeight) {
                    var newHeight = wHeight - 100;
                    var newWidth = newHeight * ratio;
                    iWidth = newWidth;
                    iHeight = newHeight;
                    if (newWidth > wWidth) {
                        newWidth = wWidth - 100;
                        newHeight = iHeight * (newWidth / iWidth);
                    }
                    $this.width(newWidth);
                    $this.height(newHeight);
                }
                $this.show();
                t.reposition();
            }).appendTo($content).hide();
        }
        else if (o.type === 'text') {
            o.putItBack = false;
            $content.html(o.content);
            $container.height(o.height);
            $container.width(o.width);
        }
        else if (o.type === 'default') {
            $content.addClass("loading");
            if (o.url) {
                if (o.intoFrame) {
                    o.frameOptions.src = o.url;
                    $.extend(o.frameOptions, {
                        src: o.url,
                        width: o.width + "px",
                        height: o.height + "px"
                    });

                    var $iframe = $("<iframe />", o.frameOptions);
                    $iframe.on("load.modalize", function (responseText, status, xhr) {
                        o.onLoad.call(t, this, responseText, status, xhr);
                        $content.removeClass("loading");
                        $iframe.show();
                        t.reposition();

                    });
                    $content.html($iframe.hide());
                }
                else {
                    o.putItBack = false;
                    $.get(o.url, function (data, textStatus, xhr) {
                        $content.html(data);
                        $container.height(o.height);
                        $container.width(o.width);
                        $content.removeClass("loading");
                        t.reposition();
                        o.onLoad.call(t, data, status, xhr);
                    });
                }
            }
            else {
                $content.removeClass("loading");
                $content.html(t.$element.show());
            }
        }
        
        //Apply styling that specified in options
        $container.css(o.css);

        $document.one("keyup.modalize", function (e) {
            if (e.keyCode == 27) {
                t.close();
            }
        });
        $window.off(".modalize");
        $window.on("resize.modalize", function () {
            t.reposition();
        });

        $bg.one("click.modalize", function () {
            t.close();
        });
        $closeHandler.one("click.modalize", function () {
            t.close();
        });
        t.show();

        $.modalize.close = function (isContentReplacing) {
            t.close.call(t, isContentReplacing);
        } 
    };

    modalize.prototype.reposition = function () {
        var t = this,
            o = t.options;

        var oWidth = $container.width(),
            oHeight = $container.height(),
            mLeft = (oWidth / 2) * -1,
            mTop = ((oHeight / 2) * -1),
            wWidth = $window.width(),
            wHeight = $window.height(),
            stayInWindow = o.stayInWindow;


        $bg.css({
            width: $window.width(),
            height: $document.height()
        });

        if (stayInWindow) {
            $container.css({
                'position': 'fixed',
                'margin-left': mLeft + "px",
                'margin-top': mTop + "px",
                'top': '50%',
                'left': '50%'
            });
        }
        else {
            $container.css({
                'position': 'absolute',
                'margin-left': mLeft + "px",
                'margin-top': 0,
                'top': ((oHeight + 40) > wHeight ? ($window.scrollTop() + 40) : ($window.scrollTop() + ((wHeight - oHeight) / 2))) + "px"
            });
        }
    };
    modalize.prototype.close = function (isContentReplacing) {
        var t = this,
            o = t.options;

        t.detach();

        if (!isContentReplacing) {
            $bg.addClass("closed");
            $container.addClass("closed");

            //call close event
            o.onClose.call(t);

            //unbind events
            $window.off(".modalize");
            $bg.off(".modalize");
            $closeHandler.off(".modalize");
        }
        delete $.modalize.close;
    };

    modalize.prototype.detach = function () {
        var t = this,
            o = t.options;
        if (t.$element) {
            if (o.putItBack) {
                if (t.elemIndex === 0) {
                    t.$parent.prepend(t.$element);
                }
                else {
                    t.$parent.children().eq(t.elemIndex - 1).after(t.$element);
                }
            }
            if (t.visibleState) {
                t.$element.show();
            }
            else {
                t.$element.hide();
            }
        }
        $content.empty();
    }

    modalize.prototype.show = function () {
        var t = this,
            o = t.options;
        $bg.removeClass("closed");
        $container.removeClass("closed");
        t.reposition();
        o.onOpen.call(t);
    };

    $.fn["modalize"] = function (options) {
        return this.each(function () {
            new modalize(this, options);
        });
    };

    $.modalize = function (options) {
        new modalize(options);
    }

})(jQuery, window, document);