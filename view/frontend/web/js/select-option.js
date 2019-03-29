define([
    'jquery',
    'mage/translate',
    'underscore',
    'jquery/ui'
], function ($, $t, _) {
    'use strict';

    $.widget('bss.fastorder_option', {
        options: {
            resetButtonSelector: '.bss-fastorder-row-action button',
            cancelButtonSelector: 'button#bss-cancel-option',
            selectButtonSelector: 'button#bss-select-option',
            formSubmitSelector: 'form#bss-fastorder-form-option',
            optionsSelector: '#bss-fastorder-form-option .product-custom-option',
        },
        _create: function () {
            this._bind();
        },
        _bind: function () {
            var self = this;
            this.createElements();
        },
        createElements: function () {
            if (!($('#bss-content-option-product').length)) {
                $(document.body).append('<div class="bss-content-option-product" id="bss-content-option-product"></div>');
            }
            this.options.optionsPopup = $('#bss-content-option-product');
            this.options.optionsPopup.hide();
        },
        showPopup: function (selectUrl, el) {
            var self = this,
                productId = $(el).find('.bss-product-id').val(),
                sortOrder = $(el).closest('.bss-fastorder-row').attr('data-sort-order'),
                editProductCache = window.editProductCache;
            $.ajax({
                url: selectUrl,
                data: {productId: productId,sortOrder: sortOrder},
                type: 'post',
                dataType: 'json',
                showLoader:true,
                success: function (res) {
                    if (res.popup_option) {
                        self.options.optionsPopup.html(res.popup_option);
                        self.options.optionsPopup.show();
                        $(self.options.cancelButtonSelector).click(function (event) {
                            // var html = $('#bss-fastorder-'+sortOrder).html();
                            self.closePopup();
                            if (editProductCache[sortOrder]) {
                                $('#bss-fastorder-'+sortOrder).html(editProductCache[sortOrder]);
                            } else {
                                $('tr#bss-fastorder-'+sortOrder).find(self.options.resetButtonSelector).click();
                            }
                        });
                        $(self.options.selectButtonSelector).click(function (event) {
                            event.preventDefault();
                            var isValid = $(self.options.formSubmitSelector).valid();
                            if (isValid) {
                                self.selectOption(sortOrder);
                            }
                        });
                    }
                },
                error: function (response) {
                    console.log('Can not load option');
                }
            });
        },
        selectProduct: function (el) {
            var productSku = $(el).find('.bss-product-sku-select').val(),
                elProductName,
                productId,
                productUrl = $(el).find('.bss-product-url').val(),
                productImage = $(el).find('.bss-product-image').html(),
                productName = $(el).find('.bss-product-name .product.name').text(),
                productPrice = $(el).find('.bss-product-price').html(),
                decimal = $(el).find('.bss-product-qty-decimal').val(),
                productPriceAmount = $(el).find('.bss-product-price-amount').val(),
                productPriceAmountExclTax = 0,
                validators = $(el).find('.bss-product-validate').val(),
                validatorsDecode = $.parseJSON(validators),
                rowEl = $(el).closest('tr.bss-fastorder-row'),
                liSelect = $(el).parent(),
                qty = $(el).find('.bss-product-qty').val(),
                stockStatus = parseInt($(el).find('.bss-product-stock-status').val());
            validatorsDecode = validatorsDecode['validate-item-quantity'];
            if ($(el).find('.bss-product-price-amount').attr('data-excl-tax')) {
                productPriceAmountExclTax = $(el).find('.bss-product-price-amount').attr('data-excl-tax');
            }
            $('#bss-fastorder-form tr').removeClass('bss-row-error');
            $('#bss-fastorder-form td').removeClass('bss-hide-border');
            $(rowEl).find('.bss-addtocart-info .bss-addtocart-option').empty();
            $(rowEl).find('.bss-fastorder-row-name .bss-product-option-select ul').empty();
            $(rowEl).find('.bss-fastorder-row-name .bss-product-baseprice ul').empty();
            $(rowEl).find('.bss-fastorder-row-edit button').addClass('disabled');
            $(rowEl).find('.bss-fastorder-row-qty input.qty').removeAttr('readonly');
            $(rowEl).find('.bss-fastorder-row-action button').removeClass('disabled');
            $(rowEl).find('.bss-fastorder-img').html(productImage);
            if (qty && qty > 0) {
                $(rowEl).find('.bss-fastorder-row-qty input.qty').val(qty);
            }
            elProductName = '<a href="'+productUrl+'" alt="'+productName+'" class="product name" target="_blank">'+productName+'</a>';
            productId = $(el).find('.bss-product-id').val();
            $(rowEl).find('.bss-fastorder-row-qty .bss-product-id-calc').val(productId);
            $(rowEl).find('.bss-fastorder-row-name .bss-product-name-select').html(elProductName);
            $(rowEl).find('.bss-fastorder-row-qty .bss-product-price-number').val(productPriceAmount).attr('data-excl-tax', productPriceAmountExclTax);
            $(rowEl).find('.bss-fastorder-row-qty .bss-product-price-custom-option').val(0).attr('data-excl-tax', 0);
            $(rowEl).find('.bss-fastorder-row-name .bss-product-baseprice ul').append('<li>'+productPrice+'</li>');
            $(rowEl).find('.bss-fastorder-row-ref .bss-search-input').val(productSku);
            $(el).closest('.bss-fastorder-autocomplete').hide();
            $(el).closest('.bss-fastorder-row').find('.bss-addtocart-info .bss-product-id').val(productId);
            $(el).closest('.bss-fastorder-autocomplete').find('li').not(liSelect).remove();
            $(rowEl).find('.bss-fastorder-row-qty .qty').attr('data-validate', validators);
            $(rowEl).find('.bss-fastorder-row-qty .qty').attr('data-decimal', decimal);
            $(rowEl).find('.bss-fastorder-row-name .bss-product-stock-status').empty();
            if (stockStatus) {
                $(rowEl).find('.bss-fastorder-row-name .bss-product-stock-status').html($t('Pre-Order'));
            }
            if (typeof validatorsDecode.qtyIncrements !== 'undefined') {
              $(rowEl).find('.bss-fastorder-row-qty .bss-product-qty-increment').text('is available to buy in increments of ' + validatorsDecode['qtyIncrements']);
            }
            $(rowEl).find('.bss-fastorder-row-qty .qty').change();
        },
        closePopup: function () {
            this.options.optionsPopup.empty().hide();
            $('.loading-mask').hide();
        },
        selectOption: function (sortOrder) {
            var self = this,
                disabledSelect = false,
                selectedLinks = '',
                elAddtocart = $('#bss-fastorder-'+sortOrder+'').find('.bss-addtocart-option'),
                elAddtocartOption = $('#bss-fastorder-'+sortOrder+'').find('.bss-addtocart-custom-option'),
                priceInfo,
                linksInfo,
                groupedPrice = 0,
                groupedPriceExclTax = 0,
                elProductinfo = $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-row-name .bss-product-option-select ul'),
                elPricetinfo = $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-row-name .bss-product-baseprice ul'),
                elCustomOption = $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-row-name .bss-product-custom-option-select ul');
            $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-row-qty .qty').removeAttr('readonly');
            elProductinfo.empty();
            elPricetinfo.empty();
            elAddtocart.empty();
            elCustomOption.empty();
            elAddtocartOption.empty();
            // move id child product configurable to form
            if ($('#bss-fastorder-form-option .bss-swatch-attribute').length > 0) {
                var priceNew = $('#bss-content-option-product .bss-product-info-price .price-wrapper').attr('data-price-amount'),
                    priceNewExclTax = 0,
                    childId = $('#bss-fastorder-form-option .bss-product-child-id').val();
                if ($('#bss-content-option-product .bss-product-info-price .base-price').length) {
                    priceNewExclTax = $('#bss-content-option-product .bss-product-info-price .price-wrapper').attr('data-excl-tax');
                }
                $('#bss-fastorder-'+sortOrder+' .bss-fastorder-row-qty .bss-product-price-number').val(priceNew);
                $('#bss-fastorder-'+sortOrder+' .bss-fastorder-row-qty .bss-product-price-number').attr('data-excl-tax', priceNewExclTax);
                $('#bss-fastorder-'+sortOrder+' .bss-fastorder-row-qty .bss-product-id-calc').val(childId);
                $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-row-name .bss-product-stock-status').empty();
                self._updatePreOrder(childId, sortOrder);
            }
            this.options.optionsPopup.find('#bss-fastorder-form-option .bss-attribute-select').each(function (event) {
                if ($('#bss-fastorder-form-option .bss-swatch-attribute').length > 0) {// configurable product option
                    disabledSelect = self._selectConfigurable(this,disabledSelect,elAddtocart,elProductinfo);
                } else if ($('#bss-fastorder-form-option .field.downloads').length > 0) {// downloadable product links
                    selectedLinks = self._selectDownloads(this,elAddtocart,selectedLinks);
                } else if ($('#bss-fastorder-form-option .table-wrapper.grouped').length > 0) {//grouped product child qty
                    var priceChild = 0,
                        priceChildExclTax = 0;
                    if ($(this).val() != '') {
                        $(this).clone().appendTo(elAddtocart);
                    }
                    if ($(this).next().val() != '') {
                        priceChild = $(this).next().val();
                        priceChildExclTax = $(this).next().attr('data-excl-tax');
                    }
                    groupedPrice = parseFloat(groupedPrice) + parseFloat(priceChild);
                    groupedPriceExclTax = parseFloat(groupedPriceExclTax) + parseFloat(priceChildExclTax);
                }
            });

            if ($('#bss-fastorder-form-option .field.downloads').length > 0) {
                if (selectedLinks == '') {
                    disabledSelect = true;
                    $('#bss-links-advice-container').show();
                } else {
                    var linksLabel = $('#bss-fastorder-form-option .bss-required-label').html();
                    linksInfo = '<li><span class="label">' + linksLabel + '</span></li>' + selectedLinks;
                    $(elProductinfo).append(linksInfo);
                }
            } else if ($('#bss-fastorder-form-option .table-wrapper.grouped').length > 0) {
                $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-row-qty .bss-product-price-number').val(groupedPrice);
                $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-row-qty .bss-product-price-number').attr('data-excl-tax', groupedPriceExclTax);
                $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-row-qty .qty').val(1);
                $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-row-qty .qty').attr('readonly', 'readonly');
                if (groupedPrice <= 0) {
                    disabledSelect = true;
                    $('.bss-validation-message-box').show();
                }
            }
            $(this.options.optionsSelector).each(function () {
                self._onOptionChanged(this, sortOrder, elAddtocartOption);
            });
            if (disabledSelect == false) {
                priceInfo = $('#bss-content-option-product .bss-product-info-price .price-container').html();
                $(elProductinfo).find('li .price').parent().remove();
                if (priceInfo) {
                    $(elPricetinfo).append('<li>'+priceInfo+'</li>');
                }
                // $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-row-price').html(priceInfo);
                $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-row-edit button').removeClass('disabled');
                $('#bss-fastorder-'+sortOrder).find('.bss-fastorder-row-qty .qty').change();
                self.closePopup();
            }
        },
        _selectConfigurable: function (el, disabledSelect,elAddtocart,elProductinfo) {
            var selectInfo;
            if ($(el).val() == '') {
                disabledSelect = true;
                if ($(el).parent().find('.bss-mage-error').length == 0) {
                    $(el).parent().append('<div generated="true" class="bss-mage-error">This is a required field.</div>');
                }
            } else {
                var selectLabel = $(el).parent().find('.bss-swatch-attribute-label').text();
                var selectValue = $(el).parent().find('.bss-swatch-attribute-selected-option').text();
                if (selectValue == '') {
                    selectValue = $(el).parent().find('.bss-swatch-select option:selected').text();
                }
                selectInfo = '<li><span class="label">' + selectLabel + '</span>&nbsp;:&nbsp;' + selectValue + '</li>';
                $(el).parent().find('.bss-mage-error').remove();
                $(el).clone().appendTo(elAddtocart);
                $(elProductinfo).append(selectInfo);
            }
            return disabledSelect;
        },
        _selectDownloads: function (el,elAddtocart,selectedLinks) {
            if ($(el).val() != '') {
                $(el).clone().appendTo(elAddtocart);
                var linkOption = $(el).next().html();
                selectedLinks += '<li>' + linkOption + '</li>';
            }
            return selectedLinks;
        },
        _onOptionChanged: function (el, sortOrder, elAddtocartOption) {
            var element = $(el),
                label = '',
                option = '',
                id = '',
                idSelect = '',
                price = 0,
                priceExclTax = 0,
                optionValue = element.val(),
                optionName = element.prop('name'),
                optionType = element.prop('type'),
                elPrice = $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-row-qty .bss-product-price-number'),
                elPriceOption = $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-row-qty .bss-product-price-custom-option'),
                elOptionInfo = $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-row-name .bss-product-custom-option-select ul');
            switch (optionType) {
                case 'text':
                    if (element.val() != '') {
                        label = element.closest('.bss-options-info').find('.label:first').html();
                        if (element.closest('.field').find('.price-container .price-excluding-tax').length == 0) {
                            price = element.closest('.field').find('.price-container .price-wrapper').attr('data-price-amount');
                        } else {
                            price = element.closest('.field').find('.price-container .price-including-tax').attr('data-price-amount');
                            priceExclTax = element.closest('.field').find('.price-container .price-excluding-tax').attr('data-price-amount');
                        }
                        if (price > 0) {
                            elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                            elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                            elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                            elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                        }
                        element.closest('.control').find('.bss-customoption-select').val(element.val());
                        element.closest('.control').find('.bss-customoption-select').clone().appendTo(elAddtocartOption);
                        option = element.val();
                        elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+option+'</li>');
                    }
                    break;
                case 'textarea':
                    if (element.val() != '') {
                        label = element.closest('.bss-options-info').find('.label:first').html();
                        if (element.closest('.textarea').find('.price-container .price-excluding-tax').length == 0) {
                            price = element.closest('.textarea').find('.price-container .price-wrapper').attr('data-price-amount');
                        } else {
                            price = element.closest('.textarea').find('.price-container .price-including-tax').attr('data-price-amount');
                            priceExclTax = element.closest('.textarea').find('.price-container .price-excluding-tax').attr('data-price-amount');
                        }
                        if (price > 0) {
                            elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                            elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                            elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                            elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                        }
                        element.closest('.control').find('.bss-customoption-select').val(element.val());
                        element.closest('.control').find('.bss-customoption-select').appendTo(elAddtocartOption);
                        option = element.val();
                        elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+option+'</li>');
                    }
                    break;

                case 'radio':
                    if (element.is(':checked')) {
                        if (element.closest('li').find('.price-container .price-including-tax').length == 0) {
                            price = element.attr('price');
                        } else {
                            price = element.closest('li').find('.price-container .price-including-tax').attr('data-price-amount');
                            priceExclTax = element.closest('li').find('.price-container .price-excluding-tax').attr('data-price-amount');
                        }
                        if (price > 0) {
                            elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                            elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                            elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                            elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                        }
                        element.next().clone().appendTo(elAddtocartOption);
                        label = element.closest('.bss-options-info').find('.label:first').html();
                        option = element.closest('.field').find('.label:first').html();
                        if (element.val()) {
                            elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+option+'</li>');
                        }
                    }
                    break;
                case 'select-one':
                    if (element.closest('.bss-options-info').find('.label:first').html() == undefined) {
                        if (element.attr('name').indexOf('month') != -1 ) {
                            element.closest('.control').find('.bss-customoption-select-month').val(element.val());
                            element.closest('.control').find('.bss-customoption-select-month').clone().appendTo(elAddtocartOption);
                        } else if (element.attr('name').indexOf('day_part') != -1 ) {
                            element.closest('.control').find('.bss-customoption-select-day_part').val(element.val());
                            element.closest('.control').find('.bss-customoption-select-day_part').clone().appendTo(elAddtocartOption);    
                            if (element.closest('.control').find('.bss-customoption-select-day_part').hasClass('bss-customoption-select-last')) {
                                if (element.closest('.field').find('.price-container .price-excluding-tax').length == 0) {
                                    price = element.closest('.field').find('.price-container .price-wrapper').attr('data-price-amount');
                                } else {
                                    price = element.closest('.field').find('.price-container .price-including-tax').attr('data-price-amount');
                                    priceExclTax = element.closest('.field').find('.price-container .price-excluding-tax').attr('data-price-amount');
                                }
                                if (price > 0) {
                                    elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                                    elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                                    elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                                    elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                                }
  
                                label = element.closest('.bss-options-info').find('legend.legend').html();
                                var hour = this._pad(element.closest('.control').find('.bss-customoption-select-hour').val(),2);
                                var minute = this._pad(element.closest('.control').find('.bss-customoption-select-minute').val(),2);
                                var day_part = element.find(":selected").text();
                                if (element.closest('.control').find('.bss-customoption-select-month').val() == undefined) {
                                    if (element.val()) {
                                        elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+hour+':' + minute +' '+day_part+'</li>');
                                    }
                                } else {
                                    var month = this._pad(element.closest('.control').find('.bss-customoption-select-month').val(),2);
                                    var day = this._pad(element.closest('.control').find('.bss-customoption-select-day').val(),2);
                                    var year = element.closest('.control').find('.bss-customoption-select-year').val();                                                                  
                                    if (element.val()) {
                                        elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+month+'/' + day +'/'+year+' '+hour+':' + minute +' '+day_part+'</li>');
                                    }                                    
                                }                                                               
                                
                            }                      
                                                   
                        } else if (element.attr('name').indexOf('day') != -1 ) {
                            element.closest('.control').find('.bss-customoption-select-day').val(element.val());
                            element.closest('.control').find('.bss-customoption-select-day').clone().appendTo(elAddtocartOption);
                        } else if (element.attr('name').indexOf('year') != -1 ) {
                            element.closest('.control').find('.bss-customoption-select-year').val(element.val());
                            element.closest('.control').find('.bss-customoption-select-year').clone().appendTo(elAddtocartOption);     
                            if (element.closest('.control').find('.bss-customoption-select-year').hasClass('bss-customoption-select-last')) {
                                if (element.closest('.field').find('.price-container .price-excluding-tax').length == 0) {
                                    price = element.closest('.field').find('.price-container .price-wrapper').attr('data-price-amount');
                                } else {
                                    price = element.closest('.field').find('.price-container .price-including-tax').attr('data-price-amount');
                                    priceExclTax = element.closest('.field').find('.price-container .price-excluding-tax').attr('data-price-amount');
                                }
                                if (price > 0) {
                                    elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                                    elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                                    elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                                    elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                                }

                                label = element.closest('.bss-options-info').find('legend.legend').html();
                                var month = this._pad(element.closest('.control').find('.bss-customoption-select-month').val(),2);
                                var day = this._pad(element.closest('.control').find('.bss-customoption-select-day').val(),2);
                                var year = element.find(":selected").text();                                                                   
                                if (element.val()) {
                                    elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+month+'/' + day +'/'+year+'</li>');
                                }                                
                            }                                                    
                        } else if (element.attr('name').indexOf('hour') != -1 ) {
                            element.closest('.control').find('.bss-customoption-select-hour').val(element.val());
                            element.closest('.control').find('.bss-customoption-select-hour').clone().appendTo(elAddtocartOption);                             
                        } else if (element.attr('name').indexOf('minute') != -1 ) {
                            element.closest('.control').find('.bss-customoption-select-minute').val(element.val());
                            element.closest('.control').find('.bss-customoption-select-minute').clone().appendTo(elAddtocartOption);
                            if (element.closest('.control').find('.bss-customoption-select-minute').hasClass('bss-customoption-select-last')) {
                                if (element.closest('.field').find('.price-container .price-excluding-tax').length == 0) {
                                    price = element.closest('.field').find('.price-container .price-wrapper').attr('data-price-amount');
                                } else {
                                    price = element.closest('.field').find('.price-container .price-including-tax').attr('data-price-amount');
                                    priceExclTax = element.closest('.field').find('.price-container .price-excluding-tax').attr('data-price-amount');
                                }
                                if (price > 0) {
                                    elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                                    elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                                    elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                                    elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                                }


                                label = element.closest('.bss-options-info').find('legend.legend').html();
                                var hour = this._pad(element.closest('.control').find('.bss-customoption-select-hour').val(),2);
                                var minute = element.find(":selected").text();                                                                   
                                if (element.val()) {
                                    elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+hour+':' + minute +'</li>');
                                }                                 
                            }                      
                        
                        }

                    } else {
                        if (element.attr('data-incl-tax')) {
                            price = element.attr('data-incl-tax');
                            priceExclTax = element.find(":selected").attr('price');
                        } else {
                            price = element.find(":selected").attr('price');
                        }
                        label = element.closest('.bss-options-info').find('.label:first').html();
                        option = element.find(":selected").text();
                        if (price > 0) {
                            elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                            elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                            elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                            elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                        }
                        element.closest('.control').find('.bss-customoption-select').val(element.val());
                        element.closest('.control').find('.bss-customoption-select').clone().appendTo(elAddtocartOption);
                        if (element.val()) {
                            elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+option+'</li>');
                        }
                    }
                    break;

                case 'select-multiple':
                    label = element.closest('.bss-options-info').find('.label:first').html();
                    element.find(":selected").each(function (i, selected) {
                        if ($(selected).attr('data-incl-tax')) {
                            price += parseFloat($(selected).attr('data-incl-tax'));
                            priceExclTax += parseFloat($(selected).attr('price'));
                        } else {
                            price += parseFloat($(selected).attr('price'));
                        }

                        id += $(selected).val() + ',';
                        option += '<li>'+$(selected).text()+'</li>';
                    });
                    if (price > 0) {
                        elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                        elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                        elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                        elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                    }
                    element.closest('.control').find('.bss-customoption-select').val(id);
                    element.closest('.control').find('.bss-customoption-select').clone().appendTo(elAddtocartOption);
                    elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+option+'</li>');
                    break;

                case 'checkbox':
                    if (element.is(':checked')) {
                        idSelect = element.closest('.bss-options-info').find('.label:first').attr('for');
                        if (elOptionInfo.find('.'+idSelect).length == 0) {
                            label = element.closest('.bss-options-info').find('.label:first').html();
                        }
                        if ($(element).attr('data-incl-tax')) {
                            price = parseFloat($(element).attr('data-incl-tax'));
                            priceExclTax = parseFloat($(element).attr('price'));
                        } else {
                            price = parseFloat($(element).attr('price'));
                        }
                        element.next().clone().appendTo(elAddtocartOption);
                        option = '<li>'+element.closest('.field').find('.label:first').html()+'</li>';
                    }
                    if (price > 0) {
                        elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                        elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                        elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                        elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                    }
                    elOptionInfo.append('<li><span class="label '+idSelect+'">'+label+'</span></li><li>'+option+'</li>');
                    break;

                case 'file':
                    if (element.val() != '') {
                        label = element.closest('.bss-options-info').find('.label:first').html();
                        if (element.closest('.field').find('.price-container .price-excluding-tax').length == 0) {
                            price = element.closest('.field').find('.price-container .price-wrapper').attr('data-price-amount');
                        } else {
                            price = element.closest('.field').find('.price-container .price-including-tax').attr('data-price-amount');
                            priceExclTax = element.closest('.field').find('.price-container .price-excluding-tax').attr('data-price-amount');
                        }
                        if (price > 0) {
                            elPrice.val(parseFloat(price) + parseFloat(elPrice.val()));
                            elPrice.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPrice.attr('data-excl-tax')));
                            elPriceOption.val(parseFloat(price) + parseFloat(elPriceOption.val()));
                            elPriceOption.attr('data-excl-tax', parseFloat(priceExclTax) + parseFloat(elPriceOption.attr('data-excl-tax')));
                        }
                        element.closest('.control').find('.bss-customoption-select').val(element.val());
                        element.closest('.control').find('.bss-customoption-select').clone().appendTo(elAddtocartOption);
                        option = element.val();
                        elOptionInfo.append('<li><span class="label">'+label+'</span></li><li>'+option+'</li>');
                    }
                    break;
            }
        },
        _updatePreOrder: function (childId, sortOrder) {
            if ($('.bss-fastorder-swatch').length) {
                var dataPreOrder = $('.bss-fastorder-swatch').data('preorder');
                var obj = _.find(dataPreOrder, function (obj) {
                    return obj.productId == childId;
                });
                if (obj && obj.preorder) {
                    $('#bss-fastorder-'+sortOrder+'').find('.bss-fastorder-row-name .bss-product-stock-status').html($t('Pre-Order'));
                }
            }
        },
        _pad: function (number, length) {
            var str = '' + number;
            while (str.length < length) {
                str = '0' + str;
            }
            return str;
        }
    });
    return $.bss.fastorder_option;
});
