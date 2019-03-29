define([
    "jquery",
    "jquery/ui",
], function ($) {
    "use strict";
    
    $.widget('bss.fastorder_downloadable', {
        options: {
            priceHolderSelector: '#bss-content-option-product .price-box',
            sortOrder: '',
            defaultPrice: ''
        },

        _create: function () {
            var self = this;
            this.element.find(this.options.bsslinkElement).on('change', $.proxy(function () {
                this._reloadPrice();
                $('#bss-links-advice-container').hide();
            }, this));

            this.element.find(this.options.bssallElements).on('change', function () {
                if (this.checked) {
                    $('#bss-links-advice-container').hide();
                    $('label[for="' + this.id + '"] > span').text($(this).attr('data-checked'));
                    self.element.find(self.options.bsslinkElement + ':not(:checked)').each(function () {
                        $(this).trigger('click');
                    });
                } else {
                    $('[for="' + this.id + '"] > span').text($(this).attr('data-notchecked'));
                    self.element.find(self.options.bsslinkElement + ':checked').each(function () {
                        $(this).trigger('click');
                    });
                }
            });
        },

        /**
         * Reload product price with selected link price included
         * @private
         */
        _reloadPrice: function () {
            var finalPrice = 0;
            var basePrice = 0;
            var refreshPrice = 0;
            $('#bss-fastorder-form-option .bss-attribute-select').val('');
            this.element.find(this.options.bsslinkElement + ':checked').each($.proxy(function (index, element) {
                finalPrice += this.options.bssconfig.links[$(element).val()].finalPrice;
                basePrice += this.options.bssconfig.links[$(element).val()].basePrice;
                $(element).next().val($(element).val());
            }, this));
            refreshPrice = parseFloat(this.options.defaultPrice) + parseFloat(finalPrice);
            $('#bss-fastorder-'+this.options.sortOrder+' .bss-product-price-number').val(refreshPrice);
            $('#bss-fastorder-'+this.options.sortOrder+' .bss-product-price-number-download').val(refreshPrice);
            $(this.options.priceHolderSelector).trigger('updatePrice', {
                'prices': {
                    'finalPrice': { 'amount': finalPrice },
                    'basePrice': { 'amount': basePrice }
                }
            });
        }
    });
    
    return $.bss.fastorder_downloadable;
});