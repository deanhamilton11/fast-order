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

use Magento\Catalog\Block\Product\View\Options\Type\Date as CustomDate;

class Date extends CustomDate
{
    /**
     * Use JS calendar settings
     *
     * @return boolean
     */
    public function useCalendar()
    {
        return $this->_catalogProductOptionTypeDate->useCalendar();
    }

    /**
     * Date input
     *
     * @return string Formatted Html
     */
    public function getDateHtml()
    {
        if ($this->useCalendar()) {
            return $this->getCalendarDateHtml();
        } else {
            return $this->getDropDownsDateHtml();
        }
    }

    public function getDateTimeHtml()
    {
        if ($this->useCalendar()) {
            return $this->getCalendarDateHtml();
        } else {
            return $this->getDropDownsDateCustomHtml();
        }
    }
    /**
     * JS Calendar html
     *
     * @return string Formatted Html
     */
    public function getCalendarDateHtml()
    {
        $option = $this->getOption();
        $value = $this->getProduct()->getPreconfiguredValues()->getData('options/' . $option->getId() . '/date');

        $yearStart = $this->_catalogProductOptionTypeDate->getYearStart();
        $yearEnd = $this->_catalogProductOptionTypeDate->getYearEnd();

        $dateFormat = $this->_localeDate->getDateFormat(\IntlDateFormatter::SHORT);
        /** Escape RTL characters which are present in some locales and corrupt formatting */
        $escapedDateFormat = preg_replace('/[^MmDdYy\/\.\-]/', '', $dateFormat);
        $calendar = $this->getLayout()->createBlock(
            \Magento\Framework\View\Element\Html\Date::class
        )->setId(
            'options_' . $this->getOption()->getId() . '_date'
        )->setName(
            'options[' . $this->getOption()->getId() . '][date]'
        )->setClass(
            'product-custom-option datetime-picker input-text'
        )->setImage(
            $this->getViewFileUrl('Magento_Theme::calendar.png')
        )->setDateFormat(
            $escapedDateFormat
        )->setValue(
            $value
        )->setYearsRange(
            $yearStart . ':' . $yearEnd
        );

        return $calendar->getHtml();
    }

    /**
     * Date (dd/mm/yyyy) html drop-downs
     *
     * @return string Formatted Html
     */
    public function getDropDownsDateCustomHtml()
    {
        $sortOrder = $this->getRequest()->getParam('sortOrder');
        $option = $this->getOption();
        $fieldsSeparator = '&nbsp;';
        $fieldsOrder = $this->_catalogProductOptionTypeDate->getConfigData('date_fields_order');
        $fieldsOrder = str_replace(',', $fieldsSeparator, $fieldsOrder);

        $monthsHtml = $this->_getSelectFromToHtml('month', 1, 12).'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][month]" class="bss-customoption-select-month" value="" />';
        $daysHtml = $this->_getSelectFromToHtml('day', 1, 31).'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][day]" class="bss-customoption-select-day" value="" />';

        $yearStart = $this->_catalogProductOptionTypeDate->getYearStart();
        $yearEnd = $this->_catalogProductOptionTypeDate->getYearEnd();
        $yearsHtml = $this->_getSelectFromToHtml('year', $yearStart, $yearEnd).'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][year]" class="bss-customoption-select-year" value="" />';
        $translations = ['d' => $daysHtml, 'm' => $monthsHtml, 'y' => $yearsHtml];
        return strtr($fieldsOrder, $translations);
    }

    /**
     * Date (dd/mm/yyyy) html drop-downs
     *
     * @return string Formatted Html
     */
    public function getDropDownsDateHtml()
    {
        $sortOrder = $this->getRequest()->getParam('sortOrder');
        $option = $this->getOption();
        $fieldsSeparator = '&nbsp;';
        $fieldsOrder = $this->_catalogProductOptionTypeDate->getConfigData('date_fields_order');
        $fieldsOrder = str_replace(',', $fieldsSeparator, $fieldsOrder);

        $monthsHtml = $this->_getSelectFromToHtml('month', 1, 12).'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][month]" class="bss-customoption-select-month" value="" />';
        $daysHtml = $this->_getSelectFromToHtml('day', 1, 31).'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][day]" class="bss-customoption-select-day" value="" />';

        $yearStart = $this->_catalogProductOptionTypeDate->getYearStart();
        $yearEnd = $this->_catalogProductOptionTypeDate->getYearEnd();
        $yearsHtml = $this->_getSelectFromToHtml('year', $yearStart, $yearEnd).'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][year]" class="bss-customoption-select-year bss-customoption-select-last" value="" />';

        $translations = ['d' => $daysHtml, 'm' => $monthsHtml, 'y' => $yearsHtml];
        return strtr($fieldsOrder, $translations);
    }

    /**
     * Time (hh:mm am/pm) html drop-downs
     *
     * @return string Formatted Html
     */
    public function getTimeHtml()
    {
        $sortOrder = $this->getRequest()->getParam('sortOrder');
        $option = $this->getOption();        
        if ($this->_catalogProductOptionTypeDate->is24hTimeFormat()) {
            $hourStart = 0;
            $hourEnd = 23;
            $dayPartHtml = '';
            $minutesHtml = $this->_getSelectFromToHtml('minute', 0, 59).'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][minute]" class="bss-customoption-select-minute bss-customoption-select-last" value="" />';
        } else {
            $hourStart = 1;
            $hourEnd = 12;
            $dayPartHtml = $this->_getHtmlSelect(
                'day_part'
            )->setOptions(
                ['am' => __('AM'), 'pm' => __('PM')]
            )->getHtml().'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][day_part]" class="bss-customoption-select-day_part bss-customoption-select-last" value="" />';
            $minutesHtml = $this->_getSelectFromToHtml('minute', 0, 59).'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][minute]" class="bss-customoption-select-minute" value="" />';
        }
        $hoursHtml = $this->_getSelectFromToHtml('hour', $hourStart, $hourEnd).'<input type="hidden" name="bss-fastorder-options['.$sortOrder.']['.$option->getId().'][hour]" class="bss-customoption-select-hour" value="" />';
        return $hoursHtml . '&nbsp;<b>:</b>&nbsp;' . $minutesHtml . '&nbsp;' . $dayPartHtml;
    }

    /**
     * Return drop-down html with range of values
     *
     * @param string $name Id/name of html select element
     * @param int $from  Start position
     * @param int $to    End position
     * @param int|null $value Value selected
     * @return string Formatted Html
     */
    protected function _getSelectFromToHtml($name, $from, $to, $value = null)
    {
        $options = [['value' => '', 'label' => '-']];
        for ($i = $from; $i <= $to; $i++) {
            $options[] = ['value' => $i, 'label' => $this->_getValueWithLeadingZeros($i)];
        }
        return $this->_getHtmlSelect($name, $value)->setOptions($options)->getHtml();
    }

    /**
     * HTML select element
     *
     * @param string $name Id/name of html select element
     * @param int|null $value
     * @return mixed
     */
    protected function _getHtmlSelect($name, $value = null)
    {
        $option = $this->getOption();

        $this->setSkipJsReloadPrice(1);

        // $require = $this->getOption()->getIsRequire() ? ' required-entry' : '';
        $require = '';
        $select = $this->getLayout()->createBlock(
            \Magento\Framework\View\Element\Html\Select::class
        )->setId(
            'options_' . $this->getOption()->getId() . '_' . $name
        )->setClass(
            'product-custom-option admin__control-select datetime-picker' . $require
        )->setExtraParams()->setName(
            'options[' . $option->getId() . '][' . $name . ']'
        );

        $extraParams = 'style="width:auto"';
        if (!$this->getSkipJsReloadPrice()) {
            $extraParams .= ' onchange="opConfig.reloadPrice()"';
        }
        $extraParams .= ' data-role="calendar-dropdown" data-calendar-role="' . $name . '"';
        $extraParams .= ' data-selector="' . $select->getName() . '"';
        if ($this->getOption()->getIsRequire()) {
            $extraParams .= ' data-validate=\'{"datetime-validation": true}\'';
        }

        $select->setExtraParams($extraParams);
        if ($value === null) {
            $value = $this->getProduct()->getPreconfiguredValues()->getData(
                'options/' . $option->getId() . '/' . $name
            );
        }
        if ($value !== null) {
            $select->setValue($value);
        }
        return $select;
    }

    /**
     * Add Leading Zeros to number less than 10
     *
     * @param int $value
     * @return string|int
     */
    protected function _getValueWithLeadingZeros($value)
    {
        if (!$this->_fillLeadingZeros) {
            return $value;
        }
        return $value < 10 ? '0' . $value : $value;
    }
}
