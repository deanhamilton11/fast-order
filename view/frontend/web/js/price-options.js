define([
    "jquery",
    "priceUtils",
    "priceOptions",
    "jquery/ui"
], function($, utils){
    "use strict";

    $.widget("bss.priceOptions", $.mage.priceOptions, {
        /**
         * Custom option change-event handler
         * @param {Event} event
         * @private
         */
        _onOptionChanged: function onOptionChanged(event) {
            var changes,
                option = $(event.target),
                handler = this.options.optionHandlers[option.data('role')];

            option.data('optionContainer', option.closest(this.options.controlContainer));

            if (handler && handler instanceof Function) {
                changes = handler(option, this.options.optionConfig, this);
            } else {
                changes = defaultGetOptionValue(option, this.options.optionConfig);
            }
            $(this.options.priceHolderSelector).trigger('updatePrice', changes);
        }
    });

    /**
     * Custom option preprocessor
     * @param  {jQuery} element
     * @param  {Object} optionsConfig - part of config
     * @return {Object}
     */
    function defaultGetOptionValue(element, optionsConfig) {
        var changes = {},
            optionValue = element.val(),
            optionId = utils.findOptionId(element[0]),
            optionName = element.prop('name'),
            optionType = element.prop('type'),
            optionConfig = optionsConfig[optionId],
            optionHash = optionName,
            optionPriceTax = {};

        switch (optionType) {
            case 'text':
            case 'textarea':
                changes[optionHash] = optionValue ? optionConfig.prices : {};
                break;

            case 'radio':
                if (element.is(':checked')) {
                    changes[optionHash] = optionConfig[optionValue] && optionConfig[optionValue].prices || {};
                }
                break;

            case 'select-one':
                if (element.closest('.bss-options-info').find('.label:first').html() == undefined) {
                    if (element.attr('name').indexOf('year') != -1 ) {
                        if (element.closest('.control').find('.bss-customoption-select-year').hasClass('bss-customoption-select-last')) {
                            changes[optionHash] = optionValue ? optionConfig.prices : {};
                        }
                    } else if (element.attr('name').indexOf('minute') != -1 ) {
                        changes[optionHash] = optionValue ? optionConfig.prices : {};
                    }                
                }
                else {
                    changes[optionHash] = optionConfig[optionValue] && optionConfig[optionValue].prices || {};
                    if (optionValue && $('#bss-content-option-product .bss-product-info-price .base-price').length) {
                        element.attr('data-incl-tax', optionConfig[optionValue].prices.finalPrice.amount);
                    }
                }
                break;

            case 'select-multiple':
                _.each(optionConfig, function (row, optionValueCode) {
                    optionHash = optionName + '##' + optionValueCode;
                    changes[optionHash] = _.contains(optionValue, optionValueCode) ? row.prices : {};
                    optionPriceTax[optionValueCode] = row.prices.finalPrice.amount;
                });
                if ($('#bss-content-option-product .bss-product-info-price .base-price').length) {
                    _.each(optionPriceTax, function (value, price) {
                        element.find('option[value=' + price + ']').attr('data-incl-tax', value);
                    });
                }
                break;

            case 'checkbox':
                optionHash = optionName + '##' + optionValue;
                changes[optionHash] = element.is(':checked') ? optionConfig[optionValue].prices : {};
                if ($('#bss-content-option-product .bss-product-info-price .base-price').length) {
                    element.attr('data-incl-tax', optionConfig[optionValue].prices.finalPrice.amount);
                }
                break;

            case 'file':
                // Checking for 'disable' property equal to checking DOMNode with id*="change-"
                changes[optionHash] = optionValue || element.prop('disabled') ? optionConfig.prices : {};
                break;
        }

        return changes;
    }

    return $.bss.priceOptions;
});