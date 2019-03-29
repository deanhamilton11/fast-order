<?php
/**
 * BSS Commerce Co.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the EULA
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://bsscommerce.com/Bss-Commerce-License.txt
 *
 * =================================================================
 *                 MAGENTO EDITION USAGE NOTICE
 * =================================================================
 * This package designed for Magento COMMUNITY edition
 * BSS Commerce does not guarantee correct work of this extension
 * on any other Magento edition except Magento COMMUNITY edition.
 * BSS Commerce does not provide extension support in case of
 * incorrect edition usage.
 * =================================================================
 *
 * @category   BSS
 * @package    Bss_FastOrder
 * @author     Extension Team
 * @copyright  Copyright (c) 2017-2018 BSS Commerce Co. ( http://bsscommerce.com )
 * @license    http://bsscommerce.com/Bss-Commerce-License.txt
 */

namespace Bss\FastOrder\Block\Product\View\Options\Type;

use Magento\Catalog\Block\Product\View\Options\Type\Select as CatalogSelect;
use Magento\Catalog\Model\Product\Option;
use Magento\Framework\View\Element\Html\Select as FrameworkSelect;

class Select extends CatalogSelect
{
    /**
     * Return html for control element
     *
     * @return string
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @SuppressWarnings(PHPMD.NPathComplexity)
     * @SuppressWarnings(PHPMD.ExcessiveMethodLength)
     */
    public function getValuesHtml()
    {
        $sortOrder = $this->getRequest()->getParam('sortOrder');
        $_option = $this->getOption();
        $configValue = $this->getProduct()->getPreconfiguredValues()->getData('options/' . $_option->getId());
        $store = $this->getProduct()->getStore();

        $this->setSkipJsReloadPrice(1);
        // Remove inline prototype onclick and onchange events

        if ($_option->getType() == Option::OPTION_TYPE_DROP_DOWN ||
            $_option->getType() == Option::OPTION_TYPE_MULTIPLE
        ) {
            return $this->getTypeMultiple($_option, $store, $configValue, $sortOrder);
        }

        if ($_option->getType() == Option::OPTION_TYPE_RADIO ||
            $_option->getType() == Option::OPTION_TYPE_CHECKBOX
        ) {
            $selectHtml = '<ul class="options-list nested" id="bss-options-' . $_option->getId() . '-list">';
            $require = $_option->getIsRequire() ? ' required' : '';
            $arraySign = '';
            switch ($_option->getType()) {
                case Option::OPTION_TYPE_RADIO:
                    $type = 'radio';
                    $class = 'radio admin__control-radio';
                    if (!$_option->getIsRequire()) {
                        $selectHtml .= '<li class="field choice admin__field admin__field-option">' .
                            '<input type="radio" id="bss-options_' .
                            $_option->getId() .
                            '" class="' .
                            $class .
                            ' product-custom-option" name="bss-options[' .
                            $_option->getId() .
                            ']"' .
                            ' data-selector="options[' . $_option->getId() . ']"' .
                            ($this->getSkipJsReloadPrice() ? '' : ' onclick="opConfig.reloadPrice()"') .
                            ' value="" checked="checked" />
                            <input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$_option->getId().']" class="bss-customoption-select" value="" />
                            <label class="label admin__field-label" for="bss-options_' .
                            $_option->getId() .
                            '"><span>' .
                            __('None') . '</span></label></li>';
                    };
                    $name = 'bss-fastorder-options['.$sortOrder.']['.$_option->getId().']';
                    break;
                case Option::OPTION_TYPE_CHECKBOX:
                    $type = 'checkbox';
                    $class = 'checkbox admin__control-checkbox';
                    $arraySign = '[]';
                    $name = 'bss-fastorder-options['.$sortOrder.']['.$_option->getId().'][]';
                    break;
            }
            $count = 1;
            foreach ($_option->getValues() as $_value) {
                $count++;

                $priceStr = $this->_formatPrice(
                    [
                        'is_percent' => $_value->getPriceType() == 'percent',
                        'pricing_value' => $_value->getPrice($_value->getPriceType() == 'percent'),
                    ]
                );

                $htmlValue = $_value->getOptionTypeId();
                if ($arraySign) {
                    $checked = is_array($configValue) && in_array($htmlValue, $configValue) ? 'checked' : '';
                } else {
                    $checked = $configValue == $htmlValue ? 'checked' : '';
                }

                $dataSelector = 'options[' . $_option->getId() . ']';
                if ($arraySign) {
                    $dataSelector .= '[' . $htmlValue . ']';
                }
                $selectHtml .= '<li class="field choice admin__field admin__field-option' .
                    $require .
                    '">' .
                    '<input type="' .
                    $type .
                    '" class="' .
                    $class .
                    ' ' .
                    $require .
                    ' product-custom-option"' .
                    ($this->getSkipJsReloadPrice() ? '' : ' onclick="opConfig.reloadPrice()"') .
                    ' name="bss-options[' .
                    $_option->getId() .
                    ']' .
                    $arraySign .
                    '" id="bss-options_' .
                    $_option->getId() .
                    '_' .
                    $count .
                    '" value="' .
                    $htmlValue .
                    '" ' .
                    $checked .
                    ' data-selector="' . $dataSelector . '"' .
                    ' price="' .
                    $this->pricingHelper->currencyByStore($_value->getPrice(true), $store, false) .
                    '" />' .
                    '<input type="hidden" name="'.$name.'" class="bss-customoption-select" value="'.$htmlValue.'" />
                    <label class="label admin__field-label" for="bss-options_' .
                    $_option->getId() .
                    '_' .
                    $count .
                    '"><span>' .
                    $_value->getTitle() .
                    '</span> ' .
                    $priceStr .
                    '</label>';
                $selectHtml .= '</li>';
            }
            $selectHtml .= '</ul>';

            return $selectHtml;
        }
    }

    protected function getTypeMultiple($_option = null, $store = null, $configValue = null, $sortOrder = null)
    {
        $require = $_option->getIsRequire() ? ' required' : '';
        $extraParams = '';
        $select = $this->getLayout()->createBlock(
            FrameworkSelect::class
        )->setData(
            [
                'id' => 'bss-select_' . $_option->getId(),
                'class' => $require . ' product-custom-option admin__control-select'
            ]
        );
        if ($_option->getType() == Option::OPTION_TYPE_DROP_DOWN) {
            $select->setName('bss-options[' . $_option->getid() . ']')->addOption('', __('-- Please Select --'));
        } else {
            $select->setName('bss-options[' . $_option->getid() . '][]');
            $select->setClass('multiselect admin__control-multiselect' . $require . ' product-custom-option');
        }
        foreach ($_option->getValues() as $_value) {
            $priceStr = $this->_formatPrice(
                [
                    'is_percent' => $_value->getPriceType() == 'percent',
                    'pricing_value' => $_value->getPrice($_value->getPriceType() == 'percent'),
                ],
                false
            );
            $select->addOption(
                $_value->getOptionTypeId(),
                $_value->getTitle() . ' ' . strip_tags($priceStr) . '',
                ['price' => $this->pricingHelper->currencyByStore($_value->getPrice(true), $store, false)]
            );
        }
        if ($_option->getType() == Option::OPTION_TYPE_MULTIPLE) {
            $extraParams = ' multiple="multiple"';
        }
        if (!$this->getSkipJsReloadPrice()) {
            $extraParams .= ' onchange="opConfig.reloadPrice()"';
        }
        $extraParams .= ' data-selector="' . $select->getName() . '"';
        $select->setExtraParams($extraParams);

        if ($configValue) {
            $select->setValue($configValue);
        }
        $clone = '<input type="hidden" class="bss-customoption-select" name="bss-fastorder-options['.$sortOrder.']['.$_option->getid().']" value=""/>';
        return $select->getHtml() . $clone;
    }
}
