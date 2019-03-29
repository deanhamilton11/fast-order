define([
    'jquery',
    'underscore',
    'Magento_Catalog/js/price-utils',
    'jquery/ui',
    'jquery/jquery.parsequery',
    'jquery/validate',
    'mage/translate'
], function ($, _, priceUtils) {
    'use strict';
    var childSelect = childSelect || {};
    $.widget('bss.FastOrderSwatchTooltip', {
        options: {
            delay: 200,                             //how much ms before tooltip to show
            tooltipClass: 'swatch-option-tooltip'  //configurable, but remember about css
        },

        /**
         * @private
         */
        _init: function () {
            var $widget = this,
                $this = this.element,
                $element = $('.' + $widget.options.tooltipClass),
                timer,
                type = parseInt($this.attr('bss-option-type'), 10),
                label = $this.attr('bss-option-label'),
                thumb = $this.attr('bss-option-tooltip-thumb'),
                value = $this.attr('bss-option-tooltip-value'),
                $image,
                $title,
                $corner;

            if (!$element.size()) {
                $element = $('<div class="' + $widget.options.tooltipClass + '"><div class="image"></div><div class="title"></div><div class="corner"></div></div>');
                $('body').append($element);
            }

            $image = $element.find('.image');
            $title = $element.find('.title');
            $corner = $element.find('.corner');

            $this.hover(function () {
                if (!$this.hasClass('disabled')) {
                    timer = setTimeout(
                        function () {
                            var leftOpt = null,
                                leftCorner = 0,
                                left,
                                $window;

                            if (type === 2) {
                                // Image
                                $image.css({
                                    'background': 'url("' + thumb + '") no-repeat center', //Background case
                                    'background-size': 'initial'
                                });
                                $image.show();
                            } else if (type === 1) {
                                // Color
                                $image.css({
                                    background: value
                                });
                                $image.show();
                            } else if (type === 0 || type === 3) {
                                // Default
                                $image.hide();
                            }

                            $title.text(label);

                            leftOpt = $this.offset().left;
                            left = leftOpt + $this.width() / 2 - $element.width() / 2;
                            $window = $(window);

                            // the numbers (5 and 5) is magick constants for offset from left or right page
                            if (left < 0) {
                                left = 5;
                            } else if (left + $element.width() > $window.width()) {
                                left = $window.width() - $element.width() - 5;
                            }

                            // the numbers (6,  3 and 18) is magick constants for offset tooltip
                            leftCorner = 0;

                            if ($element.width() < $this.width()) {
                                leftCorner = $element.width() / 2 - 3;
                            } else {
                                leftCorner = (leftOpt > left ? leftOpt - left : left - leftOpt) + $this.width() / 2 - 6;
                            }

                            $corner.css({
                                left: leftCorner
                            });
                            $element.css({
                                left: left,
                                top: $this.offset().top - $element.height() - $corner.height() - 18
                            }).show();
                        },
                        $widget.options.delay
                    );
                }
            }, function () {
                $element.hide();
                clearTimeout(timer);
            });
            $(document).on('tap', function () {
                $element.hide();
                clearTimeout(timer);
            });

            $this.on('tap', function (event) {
                event.stopPropagation();
            });
        }
    });

    $.widget('bss.FastOrderSwatch', {
        options: {
            classes: {
                attributeClass: 'bss-swatch-attribute',
                attributeLabelClass: 'bss-swatch-attribute-label',
                attributeSelectedOptionLabelClass: 'bss-swatch-attribute-selected-option',
                attributeOptionsWrapper: 'bss-swatch-attribute-options',
                attributeInput: 'bss-swatch-input',
                optionClass: 'bss-swatch-option',
                selectClass: 'bss-swatch-select',
                moreButton: 'bss-swatch-more',
                loader: 'bss-swatch-option-loading',
                fastorderInput: 'bss-attribute-select',
            },
            // option's json config
            jsonConfig: {},

            // swatch's json config
            jsonSwatchConfig: {},

            // selector of parental block of prices and swatches (need to know where to seek for price block)
            selectorProduct: '.bss-content-option-product',

            // selector of price wrapper (need to know where set price)
            selectorProductPrice: '[data-role-fastorder=priceBox]',

            // number of controls to show (false or zero = show all)
            numberToShow: false,

            // show only swatch controls
            onlySwatches: false,

            // enable label for control
            enableControlLabel: true,

            // text for more button
            moreButtonText: 'More',

            // Cache for BaseProduct images. Needed when option unset
            mediaGalleryInitial: [{}],

            // Fastorder row select
            fastorderRow: '',

            fomatPrice: '',
        },

        /**
         * Get chosen product
         *
         * @returns array
         */
        getProduct: function () {
            return this._CalcProducts().shift();
        },

        /**
         * @private
         */
        _init: function () {
            if (this.options.jsonConfig !== '' && this.options.jsonSwatchConfig !== '') {
                this._sortAttributes();
                this._RenderControls();
            } else {
                console.log('SwatchRenderer: No input data received');
            }
        },

        /**
         * @private
         */
        _sortAttributes: function () {
            this.options.jsonConfig.attributes = _.sortBy(this.options.jsonConfig.attributes, function (attribute) {
                return attribute.position;
            });
        },

        /**
         * @private
         */
        _create: function () {
            var options = this.options;
            this.productForm = this.element.parents(this.options.selectorProduct).find('form#bss-fastorder-form-option');
        },

        /**
         * Render controls
         *
         * @private
         */
        _RenderControls: function () {
            var $widget = this,
                container = this.element,
                classes = this.options.classes,
                chooseText = this.options.jsonConfig.chooseText;

            $widget.optionsMap = {};

            $.each(this.options.jsonConfig.attributes, function () {
                var item = this,
                    options = $widget._RenderSwatchOptions(item),
                    select = $widget._RenderSwatchSelect(item, chooseText),
                    input = '',
                    label = '';

                // Show only swatch controls
                if ($widget.options.onlySwatches && !$widget.options.jsonSwatchConfig.hasOwnProperty(item.id)) {
                    return;
                }

                if ($widget.options.enableControlLabel) {
                    label +=
                        '<span class="' + classes.attributeLabelClass + '" data-required="1">' + item.label + '</span>' +
                        '<span class="' + classes.attributeSelectedOptionLabelClass + '"></span>';
                }

                if ($widget.productForm) {
                    $widget.productForm.append(input);
                    input = '';
                }

                // Create new control
                container.append(
                    '<div class="' + classes.attributeClass + ' ' + item.code +
                    '" bss-attribute-code="' + item.code +
                    '" bss-attribute-id="' + item.id + '">' +
                    label +
                    '<div class="' + classes.attributeOptionsWrapper + ' clearfix">' +
                    options + select +
                    '</div>' + input +
                    '<input type="hidden" class="bss-attribute-select" name="bss-fastorder-super_attribute['+ $widget.options.fastorderRow + '][' + item.id + ']" value="">'+
                    '</div>'
                );

                $widget.optionsMap[item.id] = {};

                // Aggregate options array to hash (key => value)
                $.each(item.options, function () {
                    if (this.products.length > 0) {
                        $widget.optionsMap[item.id][this.id] = {
                            price: parseInt(
                                $widget.options.jsonConfig.optionPrices[this.products[0]].finalPrice.amount,
                                10
                            ),
                            products: this.products
                        };
                    }
                });
            });

            // Connect Tooltip
            container
                .find('[bss-option-type="1"], [bss-option-type="2"], [bss-option-type="0"], [bss-option-type="3"]')
                .FastOrderSwatchTooltip();

            // Hide all elements below more button
            $('.' + classes.moreButton).nextAll().hide();

            // Handle events like click or change
            $widget._EventListener();

            // Rewind options
            $widget._Rewind(container);

            //Emulate click on all swatches from Request
            $widget._EmulateSelected($.parseQuery());
            $widget._EmulateSelected($widget._getSelectedAttributes());
        },

        /**
         * Render swatch options by part of config
         *
         * @param {Object} config
         * @returns {String}
         * @private
         */
        _RenderSwatchOptions: function (config) {
            var optionConfig = this.options.jsonSwatchConfig[config.id],
                optionClass = this.options.classes.optionClass,
                moreLimit = parseInt(this.options.numberToShow, 10),
                moreClass = this.options.classes.moreButton,
                moreText = this.options.moreButtonText,
                countAttributes = 0,
                html = '';

            if (!this.options.jsonSwatchConfig.hasOwnProperty(config.id)) {
                return '';
            }

            $.each(config.options, function () {
                var id,
                    type,
                    value,
                    thumb,
                    label,
                    attr;

                if (!optionConfig.hasOwnProperty(this.id)) {
                    return '';
                }

                // Add more button
                if (moreLimit === countAttributes++) {
                    html += '<a href="#" class="' + moreClass + '">' + moreText + '</a>';
                }

                id = this.id;
                type = parseInt(optionConfig[id].type, 10);
                value = optionConfig[id].hasOwnProperty('value') ? optionConfig[id].value : '';
                thumb = optionConfig[id].hasOwnProperty('thumb') ? optionConfig[id].thumb : '';
                label = this.label ? this.label : '';
                attr =
                    ' bss-option-type="' + type + '"' +
                    ' bss-option-id="' + id + '"' +
                    ' bss-option-label="' + label + '"' +
                    ' bss-option-tooltip-thumb="' + thumb + '"' +
                    ' bss-option-tooltip-value="' + value + '"';

                if (!this.hasOwnProperty('products') || this.products.length <= 0) {
                    attr += ' bss-option-empty="true"';
                }

                if (type === 0) {
                    // Text
                    html += '<div class="' + optionClass + ' text" ' + attr + '>' + (value ? value : label) +
                        '</div>';
                } else if (type === 1) {
                    // Color
                    html += '<div class="' + optionClass + ' color" ' + attr +
                        '" style="background: ' + value +
                        ' no-repeat center; background-size: initial;">' + '' +
                        '</div>';
                } else if (type === 2) {
                    // Image
                    html += '<div class="' + optionClass + ' image" ' + attr +
                        '" style="background: url(' + value + ') no-repeat center; background-size: initial;">' + '' +
                        '</div>';
                } else if (type === 3) {
                    // Clear
                    html += '<div class="' + optionClass + '" ' + attr + '></div>';
                } else {
                    // Defaualt
                    html += '<div class="' + optionClass + '" ' + attr + '>' + label + '</div>';
                }
            });

            return html;
        },

        /**
         * Render select by part of config
         *
         * @param {Object} config
         * @param {String} chooseText
         * @returns {String}
         * @private
         */
        _RenderSwatchSelect: function (config, chooseText) {
            var html;

            if (this.options.jsonSwatchConfig.hasOwnProperty(config.id)) {
                return '';
            }

            html =
                '<select class="' + this.options.classes.selectClass + ' ' + config.code + '">' +
                '<option value="0" bss-option-id="0">' + chooseText + '</option>';

            $.each(config.options, function () {
                var label = this.label,
                    attr = ' value="' + this.id + '" bss-option-id="' + this.id + '"';

                if (!this.hasOwnProperty('products') || this.products.length <= 0) {
                    attr += ' bss-option-empty="true"';
                }

                html += '<option ' + attr + '>' + label + '</option>';
            });

            html += '</select>';

            return html;
        },

        /**
         * Input for submit form.
         * This control shouldn't have "type=hidden", "display: none" for validation work :(
         *
         * @param {Object} config
         * @private
         */
        _RenderFormInput: function (config) {
            return '<input class="' + this.options.classes.attributeInput + ' bss-super-attribute-select" ' +
                'name="bss-super_attribute[' + config.id + ']" ' +
                'type="text" ' +
                'value="" ' +
                'data-selector="bss-super_attribute[' + config.id + ']" ' +
                'data-validate="{required:true}" ' +
                'aria-required="true" ' +
                'aria-invalid="true" ' +
                'style="visibility: hidden; position:absolute; left:-1000px">';
        },

        /**
         * Event listener
         *
         * @private
         */
        _EventListener: function () {

            var $widget = this;

            $widget.element.on('click', '.' + this.options.classes.optionClass, function () {
                return $widget._OnClick($(this), $widget);
            });

            $widget.element.on('change', '.' + this.options.classes.selectClass, function () {
                return $widget._OnChange($(this), $widget);
            });

            $widget.element.on('click', '.' + this.options.classes.moreButton, function (e) {
                e.preventDefault();

                return $widget._OnMoreClick($(this));
            });
        },

        /**
         * Event for swatch options
         *
         * @param {Object} $this
         * @param {Object} $widget
         * @private
         */
        _OnClick: function ($this, $widget) {

            var $parent = $this.parents('.' + $widget.options.classes.attributeClass),
                attrConfig = this.options.jsonConfig.index,
                $label = $parent.find('.' + $widget.options.classes.attributeSelectedOptionLabelClass),
                attributeId = $parent.attr('bss-attribute-id'),
                fastorderEl = $parent.find('.' + $widget.options.classes.fastorderInput),
                bssAttributeId = $parent.attr('bss-attribute-id'),
                bssOptionSelected,
                $input = $widget.productForm.find(
                    '.' + $widget.options.classes.attributeInput + '[name="bss-super_attribute[' + attributeId + ']"]'
                );

            if ($this.hasClass('disabled')) {
                return;
            }

            if ($this.hasClass('selected')) {
                $parent.removeAttr('bss-option-selected').find('.selected').removeClass('selected');
                $input.val('');
                $label.text('');
                fastorderEl.val('');
            } else {
                $parent.attr('bss-option-selected', $this.attr('bss-option-id')).find('.selected').removeClass('selected');
                $label.text($this.attr('bss-option-label'));
                $input.val($this.attr('bss-option-id'));
                $this.addClass('selected');
                fastorderEl.val($this.attr('bss-option-id'));
                bssOptionSelected = $parent.attr('bss-option-selected')
                if (bssOptionSelected && bssAttributeId) {
                    this._UpdateChild(bssOptionSelected, bssAttributeId);
                }
            }

            $widget._Rebuild();

            if ($widget.element.parents($widget.options.selectorProduct)
                .find(this.options.selectorProductPrice).is(':data(bss-priceBox)')
            ) {
                $widget._UpdatePrice();
            }

            // $widget._LoadProductMedia();
            $input.trigger('change');
        },

        _UpdateChild: function (bssOptionSelected, bssAttributeId) {
            var childSelect = [],
                childIds = [],
                $widget = this,
                attributeSelected = [],
                tmp = '',
                attrConfig = this.options.jsonConfig.index;

            attributeSelected[bssAttributeId] = bssOptionSelected;

            for (var keyCheck in attrConfig) {
                if (attrConfig.hasOwnProperty(keyCheck)) {
                    if (attrConfig[keyCheck][bssAttributeId] == bssOptionSelected) {
                        childIds.push(keyCheck);
                    }
                }
            }

            if (childIds.length > 1) {
                if (!this.options.jsonConfig.optionSelected) {
                    this.options.jsonConfig.optionSelected = attributeSelected;
                } else {
                    this.options.jsonConfig.optionSelected[bssAttributeId] = bssOptionSelected;
                }

                for (var key in this.options.jsonConfig.optionSelected) {
                    if (this.options.jsonConfig.optionSelected.hasOwnProperty(key)) {
                        for (var kc in attrConfig) {
                            if (attrConfig.hasOwnProperty(kc)) {
                                if (attrConfig[kc][key] == this.options.jsonConfig.optionSelected[key]) {
                                    if(childIds[kc]) {
                                        tmp = kc;
                                    }
                                    childIds[kc] = kc;
                                }
                            }
                        }
                    }
                }
            } else {
                childSelect['id_'+bssAttributeId] = childIds;
                var id = [];
                for (var x in childSelect) {
                    id.push(childSelect[x])
                }
                if(id.length > 1){
                    for (var i = 0; i < id.length; i++) {
                        for (var j = i + 1; j < id.length; j++) {
                            for (var k = 0; k < id[i].length; k++) {
                                for (var l = 0; l < id[j].length; l++) {
                                    if (id[i][k] == id[j][l]) {
                                        tmp = id[i][k];
                                    }
                                }
                            }
                        }
                    }
                } else {
                    tmp = id[0][0];
                }
            }

            if (tmp != undefined && tmp != null && tmp != '') {
                var price = this.options.jsonConfig.optionPrices[tmp].finalPrice.amount,
                    priceFormat = $widget._getFormattedPrice(price,this.options.formatPrice);
                $('.bss-product-option .bss-product-child-id').val(tmp);
                $('.bss-product-option .bss-product-child-id').attr('value',tmp);
                $('#bss-content-option-product .bss-product-info-price .price-wrapper').attr('data-price-amount',price);
                $('#bss-content-option-product .bss-product-info-price .price-wrapper .price').html(priceFormat);
            }
        },

        /**
         * Event for select
         *
         * @param {Object} $this
         * @param {Object} $widget
         * @private
         */
        _OnChange: function ($this, $widget) {
            var $parent = $this.parents('.' + $widget.options.classes.attributeClass),
                attributeId = $parent.attr('bss-attribute-id'),
                fastorderEl = $parent.find('.' + $widget.options.classes.fastorderInput),
                $input = $widget.productForm.find(
                    '.' + $widget.options.classes.attributeInput + '[name="bss-super_attribute[' + attributeId + ']"]'
                );

            if ($this.val() > 0) {
                var bssAttributeId = $parent.attr('bss-attribute-id'),
                    bssOptionSelected = $this.val();
                $parent.attr('bss-option-selected', bssOptionSelected);
                $input.val(bssOptionSelected);
                fastorderEl.val(bssOptionSelected);
                this._UpdateChild(bssOptionSelected, bssAttributeId);
            } else {
                $parent.removeAttr('bss-option-selected');
                $input.val('');
                fastorderEl.val('');
            }

            $widget._Rebuild();
            $widget._UpdatePrice();
            // $widget._LoadProductMedia();
            $input.trigger('change');
        },

        /**
         * Event for more switcher
         *
         * @param {Object} $this
         * @private
         */
        _OnMoreClick: function ($this) {
            $this.nextAll().show();
            $this.blur().remove();
        },

        /**
         * Rewind options for controls
         *
         * @private
         */
        _Rewind: function (controls) {
            controls.find('div[bss-option-id], option[bss-option-id]').removeClass('disabled').removeAttr('disabled');
            controls.find('div[bss-option-empty], option[bss-option-empty]').attr('disabled', true).addClass('disabled');
        },

        /**
         * Rebuild container
         *
         * @private
         */
        _Rebuild: function () {

            var $widget = this,
                controls = $widget.element.find('.' + $widget.options.classes.attributeClass + '[bss-attribute-id]'),
                selected = controls.filter('[bss-option-selected]');

            // Enable all options
            $widget._Rewind(controls);

            // done if nothing selected
            if (selected.size() <= 0) {
                return;
            }

            // Disable not available options
            controls.each(function () {
                var $this = $(this),
                    id = $this.attr('bss-attribute-id'),
                    products = $widget._CalcProducts(id);

                if (selected.size() === 1 && selected.first().attr('bss-attribute-id') === id) {
                    return;
                }

                $this.find('[bss-option-id]').each(function () {
                    var $element = $(this),
                        option = $element.attr('bss-option-id');

                    if (!$widget.optionsMap.hasOwnProperty(id) || !$widget.optionsMap[id].hasOwnProperty(option) ||
                        $element.hasClass('selected') ||
                        $element.is(':selected')) {
                        return;
                    }

                    if (_.intersection(products, $widget.optionsMap[id][option].products).length <= 0) {
                        $element.attr('disabled', true).addClass('disabled');
                    }
                });
            });
        },

        /**
         * Get selected product list
         *
         * @returns {Array}
         * @private
         */
        _CalcProducts: function ($skipAttributeId) {
            var $widget = this,
                products = [];

            // Generate intersection of products
            $widget.element.find('.' + $widget.options.classes.attributeClass + '[bss-option-selected]').each(function () {
                var id = $(this).attr('bss-attribute-id'),
                    option = $(this).attr('bss-option-selected');

                if ($skipAttributeId !== undefined && $skipAttributeId === id) {
                    return;
                }

                if (!$widget.optionsMap.hasOwnProperty(id) || !$widget.optionsMap[id].hasOwnProperty(option)) {
                    return;
                }

                if (products.length === 0) {
                    products = $widget.optionsMap[id][option].products;
                } else {
                    products = _.intersection(products, $widget.optionsMap[id][option].products);
                }
            });

            return products;
        },

        /**
         * Update total price
         *
         * @private
         */
        _UpdatePrice: function () {
            var $widget = this,
                $product = $widget.element.parents($widget.options.selectorProduct),
                $productPrice = $product.find(this.options.selectorProductPrice),
                options = _.object(_.keys($widget.optionsMap), {}),
                result;

            $widget.element.find('.' + $widget.options.classes.attributeClass + '[bss-option-selected]').each(function () {
                var attributeId = $(this).attr('bss-attribute-id');

                options[attributeId] = $(this).attr('bss-option-selected');
            });

            result = $widget.options.jsonConfig.optionPrices[_.findKey($widget.options.jsonConfig.index, options)];
            if (result != undefined) {
                $('#bss-fastorder-form tr#bss-fastorder-'+$widget.options.fastorderRow+' td.bss-fastorder-row-qty .bss-product-price-number').val(result.finalPrice.amount);
            }
            $productPrice.trigger(
                'updatePrice',
                {
                    'prices': $widget._getPrices(result, $productPrice.priceBox('option').prices)
                }
            );

        },

        /**
         * Get prices
         *
         * @param {Object} newPrices
         * @param {Object} displayPrices
         * @returns {*}
         * @private
         */
        _getPrices: function (newPrices, displayPrices) {
            var $widget = this;

            if (_.isEmpty(newPrices)) {
                newPrices = $widget.options.jsonConfig.prices;
            }

            _.each(displayPrices, function (price, code) {
                if (newPrices[code]) {
                    displayPrices[code].amount = newPrices[code].amount - displayPrices[code].amount;
                }
            });

            return displayPrices;
        },


        /**
         * Kill doubled AJAX requests
         *
         * @private
         */
        _XhrKiller: function () {
            var $widget = this;

            if ($widget.xhr !== undefined && $widget.xhr !== null) {
                $widget.xhr.abort();
                $widget.xhr = null;
            }
        },

        /**
         * Emulate mouse click on all swatches that should be selected
         * @param {Object} [selectedAttributes]
         * @private
         */
        _EmulateSelected: function (selectedAttributes) {
            $.each(selectedAttributes, $.proxy(function (attributeCode, optionId) {
                this.element.find('.' + this.options.classes.attributeClass +
                    '[bss-attribute-code="' + attributeCode + '"] [bss-option-id="' + optionId + '"]').trigger('click');
            }, this));
        },

        /**
         * Get default options values settings with either URL query parameters
         * @private
         */
        _getSelectedAttributes: function () {
            var hashIndex = window.location.href.indexOf('#'),
                selectedAttributes = {},
                params;

            if (hashIndex !== -1) {
                params = $.parseQuery(window.location.href.substr(hashIndex + 1));

                selectedAttributes = _.invert(_.mapObject(_.invert(params), function (attributeId) {
                    var attribute = this.options.jsonConfig.attributes[attributeId];

                    return attribute ? attribute.code : attributeId;
                }.bind(this)));
            }

            return selectedAttributes;
        },

        _getFormattedPrice: function (price,fomatPrice) {
            return priceUtils.formatPrice(price, fomatPrice);
        },
    });

    return $.bss.FastOrderSwatch;
});
