/* globals window,FroalaEditor:false */
(function (FE) {
    "use strict";

    FE.DEFAULTS = Object.assign(FE.DEFAULTS, {
        linkEditButtons: ['customLinkOpen', 'customLinkStyle', 'customLinkEdit', 'customLinkRemove'],
        linkInsertButtons: ['customLinkInternal', 'customLinkExternal', 'customLinkMail'/*, 'customLinkMedia'*/],
        linkInsertButtons2: ['customLinkCancel'],
        linkAttributes: {},
        linkAutoPrefix: 'https://',
        linkStyles: {
            'fr-green': 'Green',
            'fr-strong': 'Thick'
        },
        linkMultipleStyles: false,
        linkConvertEmailAddress: true,
        linkAlwaysBlank: false,
        linkAlwaysNoFollow: false,
        linkNoOpener: true,
        linkNoReferrer: true,
        linkList: [],
        linkText: true
    });


    FE.POPUP_TEMPLATES = Object.assign(FE.POPUP_TEMPLATES, {
        'customLink.insert': '[_BUTTONS_][_INTERNAL_LAYER_][_EXTERNAL_LAYER_][_EMAIL_LAYER_][_MEDIA_LAYER_][_GLOBAL_LAYER_]',
        'customLink.edit': '[_BUTTONS_]'
    });

    FE.PLUGINS.customLink = function (editor) {
        var $ = editor.$;

        function _init() {
            editor.events.on('keyup', function (e) {
                if (e.which !== FE.KEYCODE.ESC) {
                    _edit(e);
                }
            });
            editor.events.on('window.mouseup', _edit);

            editor.events.$on(editor.$el, 'click', 'a', function (e) {
                if (editor.edit.isDisabled()) {
                    e.preventDefault();
                }
            });

            if (editor.helpers.isMobile()) {
                editor.events.$on(editor.$doc, 'selectionchange', _edit);
            }

            _initInsertPopup(true);

            if (editor.el.tagName === 'A') {
                editor.$el.addClass('fr-view');
            }

            editor.events.on('toolbar.esc', function () {
                if (editor.popups.isVisible('customLink.edit')) {
                    editor.events.disableBlur();
                    editor.events.focus();
                    return false;
                }
            }, true);
        }

        function get() {
            var $current_image = editor.image ? editor.image.get() : null;

            if (!$current_image && editor.$wp) {
                var c_el = editor.selection.ranges(0).commonAncestorContainer;

                try {
                    if (c_el && (c_el.contains && c_el.contains(editor.el) || !editor.el.contains(c_el) || editor.el === c_el)) c_el = null;
                } catch (ex) {
                    c_el = null;
                }

                if (c_el && c_el.tagName === 'A') return c_el;
                var s_el = editor.selection.element();
                var e_el = editor.selection.endElement();

                if (s_el.tagName !== 'A' && !editor.node.isElement(s_el)) {
                    s_el = $(s_el).parentsUntil(editor.$el, 'a').first().get(0);
                }

                if (e_el.tagName !== 'A' && !editor.node.isElement(e_el)) {
                    e_el = $(e_el).parentsUntil(editor.$el, 'a').first().get(0);
                }

                try {
                    if (e_el && (e_el.contains && e_el.contains(editor.el) || !editor.el.contains(e_el) || editor.el === e_el)) e_el = null;
                } catch (ex) {
                    e_el = null;
                }

                try {
                    if (s_el && (s_el.contains && s_el.contains(editor.el) || !editor.el.contains(s_el) || editor.el === s_el)) s_el = null;
                } catch (ex) {
                    s_el = null;
                }

                if (e_el && e_el === s_el && e_el.tagName === 'A') {
                    // We do not clicking at the end / input of links because in IE the selection is changing shortly after mouseup.
                    // https://jsfiddle.net/jredzam3/
                    if ((editor.browser.msie || editor.helpers.isMobile()) && (editor.selection.info(s_el).atEnd || editor.selection.info(s_el).atStart)) {
                        return null;
                    }

                    return s_el;
                }

                return null;
            } else if (editor.el.tagName === 'A') {
                return editor.el;
            } else {
                if ($current_image && $current_image.get(0).parentNode && $current_image.get(0).parentNode.tagName === 'A') {
                    return $current_image.get(0).parentNode;
                }
            }
        }

        function _edit(e) {
            //https://github.com/froala-labs/froala-editor-js-2/issues/4555
            if (editor.core.hasFocus() || editor.opts.iframe && (!document.hasFocus || document.hasFocus())) {
                _hideEditPopup(); // Do not show edit popup for link when ALT is hit.


                if (e && e.type === 'keyup' && (e.altKey || e.which === FE.KEYCODE.ALT)) {
                    return true;
                }
                setTimeout(function () {
                    // No event passed.
                    // Event passed and (left click or other event type).
                    if (!e || e && (e.which === 1 || e.type !== 'mouseup')) {
                        var link = get();
                        var $current_image = editor.image ? editor.image.get() : null;

                        if (link && !$current_image) {
                            if (editor.image) {
                                var contents = editor.node.contents(link); // https://github.com/froala/wysiwyg-editor/issues/1103

                                if (contents.length === 1 && contents[0].tagName === 'IMG') {
                                    var range = editor.selection.ranges(0);

                                    if (range.startOffset === 0 && range.endOffset === 0) {
                                        $(link).before(FE.INVISIBLE_SPACE + FE.MARKERS);
                                    } else {
                                        $(link).after(FE.INVISIBLE_SPACE + FE.MARKERS);
                                    }

                                    editor.selection.restore();
                                    return false;
                                }
                            }

                            if (e) {
                                e.stopPropagation();
                            }

                            _showEditPopup(link);
                        }
                    }
                }, editor.helpers.isIOS() ? 100 : 0);
            }
        }


        function _refreshInsertPopup() {
            var $popup = editor.popups.get('customLink.insert');
            var link = get();

            if (link) {
                var $link = $(link);
                var text_inputs = $popup.find('input.fr-link-attr[type="text"]');
                var check_inputs = $popup.find('input.fr-link-attr[type="checkbox"]');
                var i;
                var $input;

                for (i = 0; i < text_inputs.length; i++) {
                    $input = $(text_inputs[i]);
                    $input.val($link.attr($input.attr('name') || ''));
                }

                check_inputs.attr('checked', false);

                for (i = 0; i < check_inputs.length; i++) {
                    $input = $(check_inputs[i]);

                    if ($link.attr($input.attr('name')) === $input.data('checked')) {
                        $input.attr('checked', true);
                    }
                }

                $popup.find('input.fr-link-attr[type="text"][name="text"]').val($link.text());
            } else {
                $popup.find('input.fr-link-attr[type="text"]').val('');
                $popup.find('input.fr-link-attr[type="checkbox"]').attr('checked', false);
                $popup.find('input.fr-link-attr[type="text"][name="text"]').val(editor.selection.text());
            }

            $popup.find('input.fr-link-attr').trigger('change');
            var $current_image = editor.image ? editor.image.get() : null;

            if ($current_image) {
                $popup.find('.fr-link-attr[name="text"]').parent().hide();
            } else {
                $popup.find('.fr-link-attr[name="text"]').parent().show();
            }
        }

        function showInsertPopup(rerender) {
            var $btn = editor.$tb.find('.fr-command[data-cmd="customInsertLink"]');
            var $popup = editor.popups.get('customLink.insert');
            if (!$popup) {
                $popup = _initInsertPopup();
            }

            if (rerender || !$popup.hasClass('fr-active')) {
                editor.popups.refresh('customLink.insert');
                editor.popups.setContainer('customLink.insert', editor.$tb || editor.$sc);

                if ($btn.isVisible()) {
                    var _editor$button$getPos = editor.button.getPosition($btn),
                        left = _editor$button$getPos.left,
                        top = _editor$button$getPos.top;

                    editor.popups.show('customLink.insert', left, top, $btn.outerHeight());
                } else {
                    editor.position.forSelection($popup);
                    editor.popups.show('customLink.insert');
                }
            }
        }

        /**
         * Insert link into the editor.
         * @param {string} href
         * @param {string} text
         * @param {Object} attrs
         * @return {boolean}
         */
        function insert(href, text, attrs) {
            // if marker can be insert.
            if (editor.opts.trackChangesEnabled) {
                editor.edit.on();
                editor.events.focus(true);
                editor.undo.saveStep();
                editor.markers.insert();
                editor.html.wrap();
                var $marker = editor.$el.find('.fr-marker');

                if (!$marker.length) {
                    // if no markers can be inserted exit , else continue
                    editor.popups.hide('customLink.insert');
                    return;
                }

                editor.markers.remove();
            }

            if (typeof attrs === 'undefined') {
                attrs = {};
            }
            if (editor.events.trigger('link.beforeInsert', [href, text, attrs]) === false) { // Get image if we have one selected.
                return false;
            }

            var $current_image = editor.image ? editor.image.get() : null;
            if (!$current_image && editor.el.tagName !== 'A') {
                editor.selection.restore();
                editor.popups.hide('customLink.insert');
            } else if (editor.el.tagName === 'A') {
                editor.$el.focus();
            }

            var original_href = href; // Convert email address.
            if (editor.opts.linkConvertEmailAddress) {
                if (editor.helpers.isEmail(href) && !/^mailto:.*/i.test(href)) {
                    href = 'mailto:'.concat(href);
                }
            }

            // Check if is local path.
            var local_path = /^([A-Za-z]:(\\){1,2}|[A-Za-z]:((\\){1,2}[^\\]+)+)(\\)?$/i; // Add autoprefix.
            if (editor.opts.linkAutoPrefix !== '' && !new RegExp('^(' + FE.LinkProtocols.join('|') + '):.', 'i').test(href) && !/^data:image.*/i.test(href) && !/^(https?:|ftps?:|file:|)\/\//i.test(href) && !local_path.test(href)) {
                // Do prefix only if starting character is not absolute.
                // https://github.com/froala-labs/froala-editor-js-2/issues/4697
                if (['/', '{', '[', '#', '(', '.', '"', '\\'].indexOf((href || '')[0]) < 0) {
                    href = editor.opts.linkAutoPrefix + href;
                }
            }

            // Sanitize the URL.
            href = editor.helpers.sanitizeURL(href); // Default attributs.

            if (editor.opts.linkAlwaysBlank) {
                attrs.target = '_blank';
            }
            if (editor.opts.linkAlwaysNoFollow) {
                attrs.rel = 'nofollow';
            }

            if (editor.helpers.isEmail(original_href)) {
                attrs.target = null;
                attrs.rel = null;
            }

            // https://github.com/froala/wysiwyg-editor/issues/1576.
            if (attrs.target === '_blank') {
                if (editor.opts.linkNoOpener) {
                    if (!attrs.rel) {
                        attrs.rel = 'noopener';
                    } else {
                        attrs.rel += ' noopener';
                    }
                }

                if (editor.opts.linkNoReferrer) {
                    if (!attrs.rel) {
                        attrs.rel = 'noreferrer';
                    } else {
                        attrs.rel += ' noreferrer';
                    }
                }
            } else if (attrs.target === null) {
                if (attrs.rel) {
                    attrs.rel = attrs.rel.replace(/noopener/, '').replace(/noreferrer/, '');
                } else {
                    attrs.rel = null;
                }
            }

            // Format text.
            text = text || '';

            if (href === editor.opts.linkAutoPrefix) {
                var $popup = editor.popups.get('customLink.insert');
                $popup.find('input[name="href"]').addClass('fr-error');
                editor.events.trigger('link.bad', [original_href]);
                return false;
            }

            // Check if we have selection only in one link.
            var link = get();
            var $link;

            if (link) {
                $link = $(link);
                $link.attr('href', href);

                // Change text if it is different.
                if (text.length > 0 && $link.text() !== text && !$current_image) {
                    if (editor.opts.trackChangesEnabled) {
                        var trackingLink = $($link.get(0).outerHTML);
                        trackingLink.insertBefore($link.parent());
                        var linkWrapper = editor.track_changes.wrapLinkInTracking(trackingLink, editor.track_changes.getPendingChanges().length - 1);
                        var deleteWrapper = editor.track_changes.wrapInDelete(linkWrapper);
                        $link.parent().append(deleteWrapper);
                    }

                    var child = $link.get(0);
                    while (child.childNodes.length === 1 && child.childNodes[0].nodeType === Node.ELEMENT_NODE) {
                        child = child.childNodes[0];
                    }
                    $(child).text(text);
                }

                if (!$current_image) {
                    $link.prepend(FE.START_MARKER).append(FE.END_MARKER);
                }

                // Set attributes.
                // https://github.com/froala-labs/froala-editor-js-2/issues/2023
                for (var prop in attrs) {
                    if (!attrs[prop]) {
                        $link.removeAttr(prop);
                    } else {
                        $link.attr(prop, attrs[prop]);
                    }
                }

                if (!$current_image) {
                    editor.selection.restore();
                }
            } else {
                // We don't have any image selected.
                if (!$current_image) {
                    // Remove current links.
                    editor.format.remove('a');

                    // Nothing is selected.
                    if (editor.selection.isCollapsed()) {
                        text = text.length === 0 ? original_href : text;
                        editor.html.insert('<a href="'.concat(href, '">').concat(FE.START_MARKER).concat(text.replace(/&/g, '&amp;').replace(/</, '&lt;', '>', '&gt;')).concat(FE.END_MARKER, '</a>'));
                        editor.selection.restore();
                    } else {
                        if (text.length > 0 && text !== editor.selection.text().replace(/\n/g, '')) {
                            editor.selection.remove();
                            editor.html.insert('<a href="'.concat(href, '">').concat(FE.START_MARKER).concat(text.replace(/&/g, '&amp;')).concat(FE.END_MARKER, '</a>'));
                            editor.selection.restore();
                        } else {
                            _split();

                            // Add link.
                            editor.format.apply('a', {
                                href: href
                            });
                        }
                    }
                } else {
                    // Just wrap current image with a link.
                    $current_image.wrap('<a href="'.concat(href, '"></a>'));

                    if (editor.image.hasCaption()) {
                        $current_image.parent().append($current_image.parents('.fr-img-caption').find('.fr-inner'));
                    }
                }

                // Set attributes.
                var links = allSelected();

                for (var i = 0; i < links.length; i++) {
                    $link = $(links[i]);
                    $link.attr(attrs);
                    $link.removeAttr('_moz_dirty');
                }

                // Show link edit if only one link.
                if (links.length === 1 && editor.$wp && !$current_image) {
                    $(links[0]).prepend(FE.START_MARKER).append(FE.END_MARKER);
                    editor.selection.restore();
                }
            } // Hide popup and try to edit.


            if (!$current_image) {
                _edit();
            } else {
                var $pop = editor.popups.get('customLink.insert');

                if ($pop) {
                    $pop.find('input:focus').blur();
                }

                editor.image.edit($current_image);
            }
        }

        function insertCallback() {
            var $popup = editor.popups.get('customLink.insert');
            var $activeLayer = $popup.find('.fr-layer.fr-active:not(.fr-link-global-layer)');
            var text_inputs = $activeLayer.find('input.fr-link-attr[type="text"],select');
            var check_inputs = $activeLayer.find('input.fr-link-attr[type="checkbox"]');
            var href = (text_inputs.filter('[name="href"]').val() || '').trim();
            var text = editor.opts.linkText ? text_inputs.filter('[name="text"]').val() : '';
            var attrs = {};
            var $input;
            var i;

            for (i = 0; i < text_inputs.length; i++) {
                $input = $(text_inputs[i]);

                if (['href', 'text'].indexOf($input.attr('name')) < 0) {
                    attrs[$input.attr('name')] = $input.val();
                }
            }

            for (i = 0; i < check_inputs.length; i++) {
                $input = $(check_inputs[i]);

                if ($input.is(':checked')) {
                    attrs[$input.attr('name')] = $input.data('checked');
                } else {
                    attrs[$input.attr('name')] = $input.data('unchecked') || null;
                }
            }

            if ($activeLayer.hasClass('fr-link-email-layer')) {
                if (!text || text === '') {
                    text = href;
                }
                href = 'mailto:'.concat(href);
            }

            // check for rel attritube here
            $popup.rel ? attrs.rel = $popup.rel : '';
            var t = editor.helpers.scrollTop();
            insert(href, text, attrs);
            $(editor.o_win).scrollTop(t);
        }


        /**
         *
         * @param {boolean} [delayed]
         * @return {string|boolean}
         * @private
         */
        function _initInsertPopup(delayed) {
            if (delayed) {
                editor.popups.onRefresh('customLink.insert', _refreshInsertPopup);
                return true;
            }

            var active;
            var tab_idx = 0;
            var $popup;

            var link_buttons = '';
            var buttonList = editor.button.buildList(editor.opts.linkInsertButtons);
            var buttonList2 = editor.button.buildList(editor.opts.linkInsertButtons2);

            if (buttonList !== '') {
                link_buttons = '<div class="fr-buttons fr-tabs">'.concat(buttonList, '<span class="fr-float-right">').concat(buttonList2, '</span></div>');
            }

            var internalIndex = editor.opts.linkInsertButtons.indexOf('customLinkInternal');
            var externalIndex = editor.opts.linkInsertButtons.indexOf('customLinkExternal');
            var emailIndex = editor.opts.linkInsertButtons.indexOf('customLinkMail');
            var mediaIndex = editor.opts.linkInsertButtons.indexOf('customLinkMedia');

            var internal_layer = '';
            if (internalIndex >= 0) {
                active = ' fr-active';

                if (externalIndex >= 0 && internalIndex > externalIndex) {
                    active = '';
                }

                tab_idx++;
                var options = editor.opts.linkList;
                var dropdown = '<select id="fr-link-internal-layer-url-'.concat(editor.id, '" name="href" class="fr-link-attr" placeholder="')
                    .concat(editor.language.translate('URL'), '" tabindex="')
                    .concat(++tab_idx, '">');
                for (var i = 0; i < options.length; i++) {
                    dropdown += '<option value="'
                        .concat(options[i].href, '">')
                        .concat(options[i].displayText || options[i].text, '</option>');
                }
                dropdown += '</select>';
                tab_idx--;
                internal_layer = '<div class="fr-link-internal-layer fr-layer'
                    .concat(active, '" id="fr-link-internal-layer-')
                    .concat(editor.id, '"><div class="fr-input-line"><input id="fr-link-internal-layer-text-')
                    .concat(editor.id, '" name="text" type="text" class="fr-link-attr" placeholder="')
                    .concat(editor.language.translate('Text'), '" tabindex="')
                    .concat(tab_idx++, '"></div><div class="fr-input-line">')
                    .concat(dropdown, '</div></div>');
                tab_idx++;
            }

            var external_layer = '';
            if (externalIndex >= 0) {
                active = ' fr-active';

                if (internalIndex >= 0 && externalIndex > internalIndex) {
                    active = '';
                }

                external_layer = '<div class="fr-link-external-layer fr-layer'
                    .concat(active, '" id="fr-link-external-layer-')
                    .concat(editor.id, '"><div class="fr-input-line"><input id="fr-link-external-layer-text-')
                    .concat(editor.id, '" name="text" type="text" class="fr-link-attr" placeholder="')
                    .concat(editor.language.translate('Text'), '" tabindex="')
                    .concat(++tab_idx, '"></div><div class="fr-input-line"><input id="fr-link-external-layer-url-')
                    .concat(editor.id, '" name="href" type="text" class="fr-link-attr" placeholder="')
                    .concat(editor.language.translate('URL'), '" tabindex="')
                    .concat(++tab_idx, '"></div></div>')
            }

            var email_layer = '';
            if (emailIndex >= 0) {
                active = ' fr-active';

                if (emailIndex > externalIndex && externalIndex >= 0 || emailIndex > internalIndex && internalIndex >= 0) {
                    active = '';
                }

                email_layer = '<div class="fr-link-email-layer fr-layer'
                    .concat(active, '" id="fr-link-email-layer-')
                    .concat(editor.id, '"><div class="fr-input-line"><input id="fr-link-email-layer-text-')
                    .concat(editor.id, '" name="text" type="text" class="fr-link-attr" placeholder="')
                    .concat(editor.language.translate('Text'), '" tabindex="')
                    .concat(++tab_idx, '"></div><div class="fr-input-line"><input id="fr-link-email-layer-url-')
                    .concat(editor.id, '" name="href" type="text" class="fr-link-attr" placeholder="')
                    .concat(editor.language.translate('Email'), '" tabindex="')
                    .concat(++tab_idx, '"></div></div>')
            }

            var media_layer = '';
            if (mediaIndex >= 0) {
                active = ' fr-active';

                if (mediaIndex > emailIndex && emailIndex >= 0 || mediaIndex > externalIndex && externalIndex >= 0 || mediaIndex > internalIndex && internalIndex >= 0) {
                    active = '';
                }

                media_layer = '<div class="fr-link-media-layer fr-layer'
                    .concat(active, '" id="fr-link-media-layer-')
                    .concat(editor.id, '"></div>');
            }

            var global_layer = '<div class="fr-link-global-layer fr-layer fr-active"><div class="fr-action-buttons"><button class="fr-command fr-submit" role="button" data-cmd="customLinkInsert" href="#" tabindex="'
                .concat(++tab_idx, '" type="button">')
                .concat(editor.language.translate('Insert'), '</button></div></div>');

            var template = {
                buttons: link_buttons,
                internal_layer: internal_layer,
                external_layer: external_layer,
                email_layer: email_layer,
                media_layer: media_layer,
                global_layer: global_layer
            };

            $popup = editor.popups.create('customLink.insert', template).addClass('fr-custom-link');

            if (editor.$wp) {
                editor.events.$on(editor.$wp, 'scroll.customLink-insert', function () {
                    var $current_image = editor.image ? editor.image.get() : null;

                    if ($current_image && editor.popups.isVisible('customLink.insert')) {
                        imageLink();
                    }

                    if (get && editor.popups.isVisible('customLink.insert')) {
                        update();
                    }
                });
            }

            return $popup;
        }

        function update() {
            _hideEditPopup();

            var link = get();

            if (link) {
                if (!editor.popups.isVisible('customLink.insert')) {
                    editor.popups.refresh('customLink.insert');
                    editor.selection.save();

                    if (editor.helpers.isMobile()) {
                        editor.events.disableBlur();
                        editor.$el.blur();
                        editor.events.enableBlur();
                    }
                }

                editor.popups.setContainer('customLink.insert', editor.$sc);
                var $ref = (editor.image ? editor.image.get() : null) || $(link);
                var left = $ref.offset().left + $ref.outerWidth() / 2;
                var top = $ref.offset().top + $ref.outerHeight();
                editor.popups.show('customLink.insert', left, top, $ref.outerHeight(), true);
            }
        }

        function _initEditPopup() {
            // Link buttons.
            var link_buttons = '';

            if (editor.opts.linkEditButtons.length >= 1) {
                if (editor.el.tagName === 'A' && editor.opts.linkEditButtons.indexOf('linkRemove') >= 0) {
                    editor.opts.linkEditButtons.splice(editor.opts.linkEditButtons.indexOf('linkRemove'), 1);
                }

                link_buttons = "<div class=\"fr-buttons\">".concat(editor.button.buildList(editor.opts.linkEditButtons), "</div>");
            }

            var template = {
                buttons: link_buttons
            }; // Set the template in the popup.

            var $popup = editor.popups.create('customLink.edit', template);

            if (editor.$wp) {
                editor.events.$on(editor.$wp, 'scroll.customLink-edit', function () {
                    if (get() && editor.popups.isVisible('customLink.edit')) {
                        _showEditPopup(get());
                    }
                });
            }

            return $popup;
        }


        function _showEditPopup(link) {
            var $popup = editor.popups.get('customLink.edit');
            if (!$popup) {
                _initEditPopup();
            }
            var $link = $(link);

            if (!editor.popups.isVisible('customLink.edit')) {
                editor.popups.refresh('customLink.edit');
            }

            editor.popups.setContainer('customLink.edit', editor.$sc);
            var left = $link.offset().left + $link.outerWidth() / 2;
            var top = $link.offset().top + $link.outerHeight();
            editor.popups.show('customLink.edit', left, top, $link.outerHeight(), true);
        }


        function _hideEditPopup() {
            editor.popups.hide('customLink.edit');
        }

        function _split() {
            if (!editor.selection.isCollapsed()) {
                editor.selection.save();
                var markers = editor.$el.find('.fr-marker').addClass('fr-unprocessed').toArray();

                while (markers.length) {
                    var $marker = $(markers.pop());
                    $marker.removeClass('fr-unprocessed'); // Get deepest parent.

                    var deep_parent = editor.node.deepestParent($marker.get(0));

                    if (deep_parent) {
                        var node = $marker.get(0);
                        var close_str = '';
                        var open_str = '';

                        do {
                            node = node.parentNode;

                            if (!editor.node.isBlock(node)) {
                                close_str = close_str + editor.node.closeTagString(node);
                                open_str = editor.node.openTagString(node) + open_str;
                            }
                        } while (node !== deep_parent);

                        var marker_str = editor.node.openTagString($marker.get(0)) + $marker.html() + editor.node.closeTagString($marker.get(0));
                        $marker.replaceWith('<span id="fr-break"></span>');
                        var h = deep_parent.outerHTML; //  https://github.com/froala/wysiwyg-editor/issues/3048

                        h = h.replace(/<span id="fr-break"><\/span>/g, close_str + marker_str + open_str);
                        h = h.replace(open_str + close_str, '');
                        deep_parent.outerHTML = h;
                    }

                    markers = editor.$el.find('.fr-marker.fr-unprocessed').toArray();
                }

                editor.html.cleanEmptyTags();
                editor.selection.restore();
            }
        }

        function allSelected() {
            var $current_image = editor.image ? editor.image.get() : null;
            var selectedLinks = [];

            if ($current_image) {
                if ($current_image.get(0).parentNode.tagName === 'A') {
                    selectedLinks.push($current_image.get(0).parentNode);
                }
            } else {
                var range;
                var containerEl;
                var links;
                var linkRange;

                if (editor.win.getSelection) {
                    var sel = editor.win.getSelection();

                    if (sel.getRangeAt && sel.rangeCount) {
                        linkRange = editor.doc.createRange();

                        for (var r = 0; r < sel.rangeCount; ++r) {
                            range = sel.getRangeAt(r);
                            containerEl = range.commonAncestorContainer;

                            if (containerEl && containerEl.nodeType !== 1) {
                                containerEl = containerEl.parentNode;
                            }

                            if (containerEl && containerEl.nodeName.toLowerCase() === 'a') {
                                selectedLinks.push(containerEl);
                            } else {
                                links = containerEl.getElementsByTagName('a');

                                for (var i = 0; i < links.length; ++i) {
                                    linkRange.selectNodeContents(links[i]);

                                    if (linkRange.compareBoundaryPoints(range.END_TO_START, range) < 1 && linkRange.compareBoundaryPoints(range.START_TO_END, range) > -1) {
                                        selectedLinks.push(links[i]);
                                    }
                                }
                            }
                        }
                        // linkRange.detach()
                    }
                } else if (editor.doc.selection && editor.doc.selection.type !== 'Control') {
                    range = editor.doc.selection.createRange();
                    containerEl = range.parentElement();

                    if (containerEl.nodeName.toLowerCase() === 'a') {
                        selectedLinks.push(containerEl);
                    } else {
                        links = containerEl.getElementsByTagName('a');
                        linkRange = editor.doc.body.createTextRange();

                        for (var j = 0; j < links.length; ++j) {
                            linkRange.moveToElementText(links[j]);

                            if (linkRange.compareEndPoints('StartToEnd', range) > -1 && linkRange.compareEndPoints('EndToStart', range) < 1) {
                                selectedLinks.push(links[j]);
                            }
                        }
                    }
                }
            }

            return selectedLinks;
        }


        function remove() {
            var link = get();
            var $current_image = editor.image ? editor.image.get() : null;
            if (editor.events.trigger('link.beforeRemove', [link]) === false) { // https://github.com/froala-labs/froala-editor-js-2/issues/3110
                return false;
            }
            // Check if image has caption and handle the unlink to retain caption

            if ($current_image && link) {
                if (editor.image.hasCaption()) {
                    $current_image.addClass('img-link-caption');
                    $(link).replaceWith($(link).html());
                    var newImg = document.querySelectorAll('img.img-link-caption');
                    editor.image.edit($(newImg[0]));
                    $(newImg[0]).removeClass('img-link-caption');
                } else {
                    $current_image.unwrap();
                    editor.image.edit($current_image);
                }
            } else if (link) {
                editor.selection.save();
                $(link).replaceWith($(link).html());
                editor.selection.restore();

                _hideEditPopup();
            }
        }

        function imageLink() {
            var $el = editor.image ? editor.image.getEl() : null;

            if ($el) {
                var $popup = editor.popups.get('customLink.insert'); // https://github.com/froala-labs/froala-editor-js-2/issues/4033

                var calcOuterWidth = $el.outerWidth() / 2;

                if (editor.image.hasCaption()) {
                    $el = $el.find('.fr-img-wrap');

                    if ($($el) && $($el).find('img')) {
                        calcOuterWidth = $($el).find('img').outerWidth() / 2;
                    }
                }

                if (!$popup) {
                    _initInsertPopup();
                }

                _refreshInsertPopup(true);

                editor.popups.setContainer('customLink.insert', editor.$sc);
                var left = $el.offset().left + calcOuterWidth;
                var top = $el.offset().top + $el.outerHeight();
                var calcOuterHeight = $el.outerHeight();

                if (editor.opts.iframe && editor.image.hasCaption()) {
                    if ($($el) && $($el).find('img')) {
                        calcOuterHeight = $($el).find('img').outerHeight();
                    }
                }

                editor.popups.show('customLink.insert', left, top, calcOuterHeight, true);
            }
        }

        /**
         * Show the specific layer
         * @param {string} name
         */
        function showLayer(name) {
            var $popup = editor.popups.get('customLink.insert');

            $popup.find('.fr-layer:not(.fr-link-global-layer)').removeClass('fr-active');
            $popup.find('.fr-link-'.concat(name, '-layer')).addClass('fr-active');
        }

        /**
         * Apply specific style.
         * @param {string} val The style to apply
         * @param {string[]} linkStyles The allowed style list
         * @param {boolean} multipleStyles If multiple styles are allowed or not
         * @return {boolean}
         */
        function applyStyle(val, linkStyles, multipleStyles) {
            if (typeof multipleStyles === 'undefined') {
                multipleStyles = editor.opts.linkMultipleStyles;
            }
            if (typeof linkStyles === 'undefined') {
                linkStyles = editor.opts.linkStyles;
            }
            var link = get();
            if (!link) { // Remove multiple styles.
                return false;
            }

            if (!multipleStyles) {
                var styles = Object.keys(linkStyles);
                styles.splice(styles.indexOf(val), 1);
                $(link).removeClass(styles.join(' '));
            }

            $(link).toggleClass(val);

            _edit();
        }

        return {
            _init: _init,
            remove: remove,
            showInsertPopup: showInsertPopup,
            insertCallback: insertCallback,
            insert: insert,
            update: update,
            get: get,
            allSelected: allSelected,
            imageLink: imageLink,
            applyStyle: applyStyle,
            showLayer: showLayer
        };
    };

    FE.DefineIcon('customInsertLink', {
        NAME: 'link',
        SVG_KEY: 'insertLink'
    });
    FE.RegisterShortcut(FE.KEYCODE.K, 'customInsertLink', null, 'K');
    FE.RegisterCommand('customInsertLink', {
        title: 'Insert Link',
        undo: false,
        focus: true,
        refreshOnCallback: false,
        popup: true,
        callback: function () {
            if (!this.popups.isVisible('customLink.insert')) {
                this.customLink.showInsertPopup();
            } else {
                if (this.$el.find('.fr-marker').length) {
                    this.events.disableBlur();
                    this.selection.restore();
                }

                this.popups.hide('customLink.insert');
            }
        },
        plugin: 'customLink'
    });
    FE.DefineIcon('customLinkOpen', {
        NAME: 'external-link',
        FA5NAME: 'external-link-alt',
        SVG_KEY: 'openLink'
    });
    FE.RegisterCommand('customLinkOpen', {
        title: 'Open Link',
        undo: false,
        refresh: function ($btn) {
            var link = this.customLink.get();

            if (link) {
                $btn.removeClass('fr-hidden');
            } else {
                $btn.addClass('fr-hidden');
            }
        },
        callback: function () {
            var link = this.customLink.get();

            if (link) {
                if (link.href.indexOf('mailto:') !== -1) {
                    this.o_win.open(link.href).close();
                } else {
                    // Setting the context of the opening link to _self for opening it within window
                    if (!link.target) {
                        link.target = '_self';
                    }

                    if (this.browser.msie || this.browser.edge) {
                        // noopener is not supported in IE and EDGE
                        this.o_win.open(link.href, link.target);
                    } else {
                        this.o_win.open(link.href, link.target, 'noopener');
                    }
                }

                this.popups.hide('customLink.edit');
            }
        },
        plugin: 'customLink'
    });
    FE.DefineIcon('customLinkEdit', {
        NAME: 'edit',
        SVG_KEY: 'edit'
    });
    FE.RegisterCommand('customLinkEdit', {
        title: 'Edit Link',
        undo: false,
        refreshAfterCallback: false,
        popup: true,
        callback: function () {
            this.customLink.update();
        },
        refresh: function ($btn) {
            var link = this.customLink.get();

            if (link) {
                $btn.removeClass('fr-hidden');
            } else {
                $btn.addClass('fr-hidden');
            }
        },
        plugin: 'customLink'
    });
    FE.DefineIcon('customLinkRemove', {
        NAME: 'unlink',
        SVG_KEY: 'unlink'
    });
    FE.RegisterCommand('customLinkRemove', {
        title: 'Unlink',
        callback: function () {
            this.customLink.remove();
        },
        refresh: function ($btn) {
            var link = this.customLink.get();

            if (link) {
                $btn.removeClass('fr-hidden');
            } else {
                $btn.addClass('fr-hidden');
            }
        },
        plugin: 'customLink'
    });
    FE.RegisterCommand('customLinkInsert', {
        focus: false,
        refreshAfterCallback: false,
        callback: function () {
            this.customLink.insertCallback();
        },
        refresh: function ($btn) {
            var link = this.customLink.get();

            if (link) {
                $btn.text(this.language.translate('Update'));
            } else {
                $btn.text(this.language.translate('Insert'));
            }
        },
        plugin: 'customLink'
    });
    FE.DefineIcon('customLinkInternal', {
        NAME: 'cube',
        SVG_KEY: 'cube'
    });
    FE.RegisterCommand('customLinkInternal', {
        title: 'Internal Link',
        undo: false,
        focus: false,
        toggle: true,
        callback: function () {
            this.customLink.showLayer('internal');
        },
        refresh: function ($btn) {
            var $popup = this.popups.get('customLink.insert');

            if ($popup && $popup.find('.fr-link-internal-layer').hasClass('fr-active')) {
                $btn.addClass('fr-active').attr('aria-pressed', true);
            }
        },
        plugin: 'customLink'
    });
    FE.DefineIcon('customLinkExternal', {
        NAME: 'external-link',
        FA5NAME: 'external-link-alt',
        SVG_KEY: 'openLink'
    });
    FE.RegisterCommand('customLinkExternal', {
        title: 'External Link',
        undo: false,
        focus: false,
        toggle: true,
        callback: function () {
            this.customLink.showLayer('external');
        },
        refresh: function ($btn) {
            var $popup = this.popups.get('customLink.insert');

            if ($popup && $popup.find('.fr-link-external-layer').hasClass('fr-active')) {
                $btn.addClass('fr-active').attr('aria-pressed', true);
            }
        },
        plugin: 'customLink'
    });
    FE.DefineIcon('customLinkMail', {
        NAME: 'envelope',
        SVG_KEY: 'underline'
    });
    FE.RegisterCommand('customLinkMail', {
        title: 'Mail Link',
        undo: false,
        focus: false,
        toggle: true,
        callback: function () {
            this.customLink.showLayer('email');
        },
        refresh: function ($btn) {
            var $popup = this.popups.get('customLink.insert');

            if ($popup && $popup.find('.fr-link-email-layer').hasClass('fr-active')) {
                $btn.addClass('fr-active').attr('aria-pressed', true);
            }
        },
        plugin: 'customLink'
    });
    FE.DefineIcon('customLinkMedia', {
        NAME: 'play',
        SVG_KEY: 'fileManager'
    });
    FE.RegisterCommand('customLinkMedia', {
        title: 'Media Link',
        undo: false,
        focus: false,
        toggle: true,
        callback: function () {
            this.customLink.showLayer('media');
        },
        refresh: function ($btn) {
            var $popup = this.popups.get('customLink.insert');

            if ($popup && $popup.find('.fr-link-media-layer').hasClass('fr-active')) {
                $btn.addClass('fr-active').attr('aria-pressed', true);
            }
        },
        plugin: 'customLink'
    });
    FE.DefineIcon('customLinkCancel', {
        NAME: 'times',
        SVG_KEY: 'cancel'
    });
    FE.RegisterCommand('customLinkCancel', {
        title: 'Cancel',
        undo: false,
        focus: false,
        toggle: true,
        callback: function () {
            this.popups.hide('customLink.insert');
        },
        refresh: function ($btn) {},
        plugin: 'customLink'
    });
    FE.DefineIcon('customLinkStyle', {
        NAME: 'magic',
        SVG_KEY: 'linkStyles'
    });
    FE.RegisterCommand('customLinkStyle', {
        title: 'Style',
        type: 'dropdown',
        html: function () {
            var c = '<ul class="fr-dropdown-list" role="presentation">';
            var options = this.opts.linkStyles;

            for (var cls in options) {
                if (options.hasOwnProperty(cls)) {
                    c += '<li role="presentation"><a class="fr-command" tabindex="-1" role="option" data-cmd="customLinkStyle" data-param1="'
                        .concat(cls, '">')
                        .concat(this.language.translate(options[cls]), '</a> </li>')
                }
            }

            c += '</ul>';
            return c;
        },
        callback: function (cmd, val) {
            this.customLink.applyStyle(val);
        },
        refreshOnShow: function ($btn, $dropdown) {
            var $ = this.$;
            var link = this.customLink.get();

            if (link) {
                var $link = $(link);
                $dropdown.find('.fr-command').each(function () {
                    var cls = $(this).data('param1');
                    var active = $link.hasClass(cls);
                    $(this).toggleClass('fr-active', active).attr('aria-selected', active);
                })
            }
        },
        refresh: function ($btn) {
            var link = this.customLink.get();

            if (link) {
                $btn.removeClass('fr-hidden');
            } else {
                $btn.addClass('fr-hidden');
            }
        },
        plugin: 'customLink'
    });
})(FroalaEditor);
