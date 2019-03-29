define([
    'jquery',
    'underscore',
    'mage/template',
    'Magento_Catalog/js/price-utils',
    'mage/translate',
    'jquery/ui',
    'mage/validation',

], function ($, _, mageTemplate, priceUtils, $t) {
    "use strict";
    var product_tierprice = product_tierprice || {};
    $.widget('bss.fastorder', {
        options: {
            row: 1,
            searchUrl: '',
            csvUrl: '',
            fomatPrice: '',
            charMin: '',
            headerBackgroundColor: '',
            headerTextColor: '',
            suggestCache: {}
        },

        _create: function () {
            var opt = this.options,
                rowFirst = this.element.html(),
                self = this,
                timer = 0,
                tbodyEl = this.element.closest('tbody'),
                formDefault = $(tbodyEl).html(),
                rowAdd,
                row;
            window.editProductCache = [];
            if (opt.headerBackgroundColor) {
                $('#bss-fastorder-form thead tr').css('background-color','#'+opt.headerBackgroundColor);
            }
            if (opt.headerTextColor) {
                $('#bss-fastorder-form thead tr').css('color','#'+opt.headerTextColor);
            }
             

            $('#bss-fastorder-form .bss-addline').click(function () {
                row = opt.row;
                if (rowAdd > row) {
                    row = rowAdd;
                }
                rowAdd = self._addline(rowFirst, row);
            });

            $(document).on("change","input.bss-upload", function () {
                self._uploadCsv($(this), opt.csvUrl);
            });

            $(document).on("keyup","input.bss-search-input", function () {
                var _this = this;
                if ($(_this).val().length >= opt.charMin) {
                    clearTimeout(timer);
                    timer = setTimeout(function () {
                        self._searchProduct(_this,opt.searchUrl);
                    }, 5);
                }
            });

            $(document).on("blur","input.bss-search-input", function () {
                var _this = this,
                    input = $(_this).val();
                $(_this).attr('value', input);
                $(_this).closest('.bss-fastorder-row').find('.bss-fastorder-autocomplete').hide();
            });

            $(document).on("click",".bss-fastorder-row-action button", function () {
                self._resetRow(this,rowFirst);
            });

            $(document).on("click",".bss-fastorder-row-edit button", function () {
                self._editRow(this);
            });

            $(document).on("click",".bss-fastorder-row-image img", function () {
                self._showLightbox(this);
            });

            $(document).on("click",".bss-fastorder-lightbox", function () {
                $(this).fadeTo('slow', 0.3, function () {
                    $(this).remove();
                }).fadeTo('slow', 1);
            });

            $(document).on("change",'.bss-fastorder-row-qty .qty', function () {
                var qty = $(this).val();
                $(this).attr('value', qty);
                $('.bss-fastorder-row-qty .qty').each(function () {
                    self._reloadTotalPrice(this,opt.fomatPrice);
                });
            });

            $('#bss-fastorder-form').submit(function (e) {
                if (!self.validateForm('#bss-fastorder-form')) {
                   return;
                }
                if (!opt.redirectToCart) {
                    e.preventDefault();
                    var form = $(this);
                    self._submitForm(form,formDefault);
                }
            });

            $(document).ready(function() {
                $('.bss-fastorder-multiple-form .action.tocart').css("display", "block")
            });
        },
        _addline: function (data, row) {
            row = parseInt(row) + 1;
            var lineNew = '<tr class="bss-fastorder-row bss-row" data-sort-order="'+row+'" id="bss-fastorder-'+row+'">'+data+'</tr>';
            $('#bss-fastorder-form table.bss-fastorder-multiple-form tbody').append(lineNew);
            return row;
        },
        _searchProduct: function (el,searchUrl) {
            var input = $(el).val(),
                $widget = this;
            if (input == '') {
                $(el).closest('.bss-fastorder-row').find('.bss-fastorder-autocomplete').empty();
                return false;
            }
            var sortOrder = $(el).closest('.bss-fastorder-row').attr('data-sort-order');
            $(el).addClass('bss-loading');
            var suggestCacheKey = 'bss-'+input;
            $widget._XhrKiller();
            if (suggestCacheKey in $widget.options.suggestCache) {
                $widget._getItemsLocalStorage(el, suggestCacheKey, sortOrder);
            } else {
                $widget.xhr = $.ajax({
                    type: 'post',
                    url: searchUrl,
                    data: {product:input,sort_order:sortOrder},
                    dataType: 'json',
                    success: function (data) {
                        $widget._setItemsLocalStorage(el, suggestCacheKey, JSON.stringify(data), sortOrder);
                        for (var key in data) {
                            if (data.hasOwnProperty(key)) {
                                if (data[key]['tier_price_'+data[key].product_id] != null && data[key]['tier_price_'+data[key].product_id] != 'undefined' && data[key]['tier_price_'+data[key].product_id] != undefined) {
                                    product_tierprice['id_' + data[key].product_id] = data[key]['tier_price_'+data[key].product_id];
                                }
                            }
                        }
                    },
                });
            }
        },
        _submitForm: function (el,formDefault) {
            var actionForm = $(el).attr('action'),
                serializeData = $(el).serialize();
            $('#bss-fastorder-form tr').removeClass('bss-row-error');
            $('#bss-fastorder-form td').removeClass('bss-hide-border');
            $.ajax({
                type: 'post',
                url: actionForm,
                data: serializeData,
                dataType: 'json',
                showLoader:true,
                success: function (data) {
                    if (data.status == true) {
                        $('#bss-fastorder-form tbody').html(formDefault);
                        window.editProductCache = [];
                    } else if (data.status == false && data.row >= 0) {
                        $('#bss-fastorder-form tbody #bss-fastorder-'+data.row).addClass('bss-row-error');
                        if ($('#bss-fastorder-form tbody #bss-fastorder-'+data.row).next().length > 0) {
                            $('#bss-fastorder-form tbody #bss-fastorder-'+data.row).next().find('td').addClass('bss-hide-border');
                        } else {
                            $('#bss-fastorder-form tfoot tr td').addClass('bss-hide-border');
                        }
                    }
                },
                error: function () {
                    console.log('Can not add to cart');
                }
            });
        },
        _resetRow: function (el,data) {
            $(el).closest('.bss-fastorder-row').html(data);
            $(el).addClass('disabled');
            $('#bss-fastorder-form tr').removeClass('bss-row-error');
            $('#bss-fastorder-form td').removeClass('bss-hide-border');
        },
        _editRow: function (el) {
            var sortOrder = $(el).closest('.bss-fastorder-row').data('sort-order'),
                productId = $(el).closest('.bss-fastorder-row').find('input.bss-product-id').val();
            if (productId) {
                window.editProductCache[sortOrder] = $(el).closest('.bss-fastorder-row').html();
            }
            $(el).closest('.bss-fastorder-row').find('.bss-fastorder-autocomplete li:first a').mousedown();
        },
        _showLightbox: function (el) {
            $('.bss-fastorder-lightbox').remove();
            var img = $(el).parent().html();
            var elLightbox = '<div class="bss-fastorder-lightbox">'+img+'</div>';
            $('form.bss-fastorder-form').fadeTo('slow', 0.3, function () {
                $(this).append(elLightbox);
            }).fadeTo('slow', 1);
        },
        _getFormattedPrice: function (price,fomatPrice) {
            return priceUtils.formatPrice(price, fomatPrice);
        },
        _reloadTotalPrice: function (el,fomatPrice) {
            var totalPrice,
                totalPriceExclTax,
                totalPriceFomat,
                totalPriceFomatExclTax,
                productCurId,
                qty = $(el).val(),
                price = $(el).next().val(),
                priceExclTax = $(el).next().attr('data-excl-tax'),
                priceOption = $(el).closest('.bss-fastorder-row-qty').find('.bss-product-price-custom-option').val(),
                priceOptionExclTax = $(el).closest('.bss-fastorder-row-qty').find('.bss-product-price-custom-option').attr('data-excl-tax'),
                productId = $(el).closest('tr.bss-fastorder-row').find('.bss-addtocart-info .bss-product-id').val(),
                productType = $(el).closest('tr.bss-fastorder-row').find('.bss-fastorder-autocomplete .bss-product-type').val(),
                downloadOption = $(el).closest('.bss-fastorder-row-qty').find('.bss-product-price-number-download').val(),
                decimal = parseInt($(el).closest('.bss-fastorder-row-qty').find('.qty').attr('data-decimal')),
                obj = {},
                row = $(el).closest('tr.bss-fastorder-row').attr('data-sort-order');
            if (decimal !== 0) {
                qty = parseFloat(qty);
            } else {
                qty = parseInt(qty);
            }
            obj = product_tierprice['id_'+productId];
            productCurId = $(el).closest('tr.bss-fastorder-row').find('.bss-fastorder-row-qty .bss-product-id-calc').val();
            if (productId != productCurId) {
                obj = product_tierprice['id_'+productId]['tier_price_child_'+productCurId];
            }
            if (qty > 0 && obj != null && obj != 'undefined' && obj != undefined && productType != 'grouped') {
                var qtyTotal = qty;
                $('.bss-fastorder-row .bss-fastorder-row-qty .bss-product-id-calc').each(function () {
                    var productIdClone = $(this).val(),
                        rowClone = $(this).closest('tr.bss-fastorder-row').attr('data-sort-order'),
                        // popupClone = $(this).closest('tr.bss-fastorder-row').find('.bss-fastorder-autocomplete .bss-show-popup').val(),
                        qtyClone = 0;
                    if (row != rowClone) {
                        qtyClone = $(this).closest('tr.bss-fastorder-row').find('.bss-fastorder-row-qty .qty').val();
                    }
                    if (parseInt(productIdClone) == parseInt(productCurId)) {
                        qtyTotal += parseFloat(qtyClone);
                    }
                });
                for (var key in obj) {
                    if (typeof obj[key]['final_price'] != 'object') {
                        if (parseFloat(qtyTotal) >= parseFloat(key)) {
                            price = obj[key]['final_price'] + parseFloat(priceOption) + parseFloat(downloadOption);
                            if (obj[key]['base_price']) {
                                priceExclTax = obj[key]['base_price'] + parseFloat(priceOptionExclTax) + parseFloat(downloadOption);
                            }
                        }
                    } else {
                        for (var key2 in obj[key]['final_price']) {
                            if (parseFloat(qtyTotal) >= parseFloat(key2)) {
                                price = obj[key]['final_price'][key2] + parseFloat(priceOption) + parseFloat(downloadOption);
                                if (obj[key]['base_price']) {
                                    priceExclTax = obj[key]['base_price'] + parseFloat(priceOptionExclTax) + parseFloat(downloadOption);
                                }
                            }
                        }
                    }
                }
                $(el).next().val(price);
                $(el).next().attr('data-excl-tax', priceExclTax);
            }
            if (productId) {
                totalPrice = qty * parseFloat(price);
                totalPriceExclTax = qty * parseFloat(priceExclTax);
                totalPriceFomat = this._getFormattedPrice(totalPrice, fomatPrice);
                if (totalPriceExclTax) {
                    totalPriceFomatExclTax = this._getFormattedPrice(totalPriceExclTax, fomatPrice);
                    totalPriceFomat += '<p>';
                    totalPriceFomat += $t('Excl. Tax: ');
                    totalPriceFomat += totalPriceFomatExclTax;
                    totalPriceFomat += '</p>';
                }
                $(el).closest('tr.bss-fastorder-row').find('.bss-fastorder-row-price .price').html(totalPriceFomat);
                $('#bss-fastorder-form tbody tr').removeClass('bss-row-error');
                $('#bss-fastorder-form tbody td').removeClass('bss-hide-border');
            }
        },
        _XhrKiller: function () {
            var $widget = this;
            if ($widget.xhr !== undefined && $widget.xhr !== null) {
                $widget.xhr.abort();
                $widget.xhr = null;
            }
        },
        _getItemsLocalStorage: function (el, suggestCacheKey, sortOrder) {
            var $widget = this,
                data1 = $widget.options.suggestCache[suggestCacheKey],
                data2 = '';
            if (data1 && data1 != "null") {
                data2 = JSON.parse(data1);
            }
            var html = mageTemplate('#bss-fastorder-search-complete',{data:data2});
            $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-autocomplete').show();
            $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-autocomplete').html(html);
            $(el).removeClass('bss-loading');
            if (data2) {
                if (data2.length == 1) {
                    $(el).closest('.bss-fastorder-row-ref').find(".bss-row-suggest").trigger('mousedown');
                }
            }
        },
        _setItemsLocalStorage: function (el, suggestCacheKey, data, sortOrder) {
            var $widget = this;
            $widget.options.suggestCache[suggestCacheKey] = data;
            $widget._getItemsLocalStorage(el, suggestCacheKey, sortOrder);
            
        },
        _uploadCsv: function (el, csvUrl) {
            var file_data = el.prop("files")[0],
                data = new FormData(),
                $widget = this,
                lengthObj = 0;
            if (!file_data) {
                return false;
            }
            $widget._XhrKiller();
            data.append("file", file_data);
            $widget.xhr = $.ajax({
                type: 'post',
                url: csvUrl,
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                showLoader:true,
                success: function (res) {
                    el.val('');
                    if (res) {
                        var obj = JSON.parse(res);
                        lengthObj = obj.length;
                        $widget._checkLineCsv(lengthObj);
                        for (var key in obj) {
                            var data = {},
                                html;
                            if (obj.hasOwnProperty(key)) {
                                data[0] = obj[key];
                                html = mageTemplate('#bss-fastorder-search-complete',{data:data});
                                $('#bss-fastorder-form .bss-row').each(function () {
                                    var sortOrder,
                                        self = $(this);
                                    if (self.find('.bss-row-suggest').length > 0) {
                                        return true;
                                    }
                                    sortOrder = self.attr('data-sort-order');
                                    $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-autocomplete').html(html);
                                    $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-autocomplete .bss-row-suggest:first').mousedown();
                                    return false;
                                });
                            }
                        }
                    }
                },
                error: function () {
                    el.val('');
                    alert('Can not import csv');
                }
            });
        },
        _checkLineCsv: function (lengthObj) {
            var lineCurrent,
                lineUse,
                lineSurplus,
                lineNew,
                i;
            lineCurrent = $('#bss-fastorder-form .bss-row').size();
            lineUse = $('#bss-fastorder-form .bss-fastorder-row .bss-fastorder-autocomplete ul').size();
            lineSurplus = parseInt(lineCurrent) - parseInt(lineUse);
            if (lengthObj <= lineSurplus) {
                return;
            }
            lineNew = parseInt(lengthObj) - parseInt(lineSurplus);
            for (i = 0; i < lineNew; i++) {
                $('#bss-fastorder-form .bss-addline').click();
            }
        },
        /* Validation Form*/
        validateForm: function (form) {
            return $(form).validation() && $(form).validation('isValid');
        },
    });
    return $.bss.fastorder;
});
