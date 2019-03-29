define([
    "jquery",
    "jquery/ui",
], function ($) {
    "use strict";
    
    $.widget('bss.fastorder_grouped', {
        options: {
            priceHolderSelector: '#bss-content-option-product .price-box',
            bssqtyElement: '',
            sortOrder: ''
        },

        _create: function () {
            var self = this;
            this.element.find(this.options.bssqtyElement).on('change',function () {
                $(this).attr('value', $(this).val());
                $('#bss-validation-message-box').hide();
                var qtyEl = parseFloat($(this).val());
                var priceEl = parseFloat($(this).closest('tr').find('.price-wrapper').attr('data-price-amount')),
                    priceElExclTax = parseFloat($(this).closest('tr').find('.price-wrapper.price-excluding-tax').attr('data-price-amount'));
                $(this).next().val(qtyEl*priceEl);
                $(this).next().attr('data-excl-tax', qtyEl*priceElExclTax);
            });
        },
    });
    
    return $.bss.fastorder_grouped;
});